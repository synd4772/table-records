import { Document, DocumentFieldName, INIT_CACHED_SORTED_DATA } from "@/app/[locale]/documents/documents.types"
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { documentDataHandler } from "./documentsDataHandler";
import { documentEventEmitter } from "./documentEventEmitter";
import { Coordinates, shiftCoordinates } from "@/app/utils/shiftCoordinates";
import { ChunkHandler } from "@/app/utils/ChunkHandler";

const DOCUMENTS_RENDER_LIMIT = 100;

const INIT_COORDINATES: Coordinates = {
  start: 0,
  end: 5 * DOCUMENTS_RENDER_LIMIT,
};

export const useData = () => {
    const [coordinates, setCoordinates] = useState<Coordinates>(INIT_COORDINATES);
    
    const [documents, setDocuments] = useState<Document[]>([]);
    const [sorter, setSorter] = useState<{ key: keyof Document, isAscending: boolean}>( { key: 'id', isAscending: true });

    const isRendering = useRef(false);
    const isFetching = useRef(false);
    const isAllDataFetched = useRef(false)

    useEffect(()=>{
        documentEventEmitter.on("fetchIsCompleted", (jsonData)=>{
            isAllDataFetched.current = true

            if(!documentDataHandler.allData.length){
                documentDataHandler.allData = jsonData as Document[]
            }
            documentDataHandler.pushData(jsonData as Document[])
            setDocuments(documentDataHandler.allData.slice(coordinates.start, (coordinates.end <= documentDataHandler.allData.length ? coordinates.end : documentDataHandler.allData.length)));

            documentDataHandler.createSortWorker()
            documentEventEmitter.unsubscribe("fetchIsCompleted")
        })
        documentEventEmitter.on("anotherDataFetched", (args)=>{
            const jsonData = args as Document[];
            documentDataHandler.pushData(jsonData)
        })
        documentEventEmitter.on("firstDataFetched", (jsonData)=>{
            //@ts-ignore
            documentDataHandler.pushData(jsonData as Document[])
            setDocuments(documentDataHandler.allData.slice(coordinates.start, coordinates.end));
            documentEventEmitter.unsubscribe("firstDataFetched")

        })
        return ()=>{
            documentEventEmitter.unsubscribe("fetchIsCompleted")
            documentEventEmitter.unsubscribe("anotherDataFetched")
            documentEventEmitter.unsubscribe("firstDataFetched")
        }
    }, [])

    useEffect(()=>{
        if(!isFetching.current){
            isFetching.current = true
            async function fetchData() {
                const response = await fetch("/api/documents", {cache:"no-cache"})
                const reader = response.body?.getReader();
                const decoder = new TextDecoder('utf-8');
                const chunkHandler = new ChunkHandler();
                let isFirstDataFetched = false
                try{
                    while(true){
                        if(!reader) throw new Error("error")
                        const {done, value} = await reader?.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        chunkHandler.processChunk(chunk)

                        if(chunkHandler.processedChunks.length >= 500 && !isFirstDataFetched){
                            console.log(chunkHandler.processedChunks.length, "processed chunks")
                            documentEventEmitter.emit("firstDataFetched", chunkHandler.processedChunks.slice(0, 500))
                            chunkHandler.processedChunks = chunkHandler.processedChunks.slice(500)
                            isFirstDataFetched = true
                        }
                        else if(chunkHandler.processedChunks.length >= 5000 && isFirstDataFetched){
                            documentEventEmitter.emit("anotherDataFetched", chunkHandler.processedChunks.slice(0, 5000))
                            chunkHandler.processedChunks = chunkHandler.processedChunks.slice(5000)
                        }
                    }
                    documentEventEmitter.emit("fetchIsCompleted", chunkHandler.processedChunks)
                    chunkHandler.processedChunks = chunkHandler.processedChunks.slice(chunkHandler.processedChunks.length)
                }
                catch(error){
                    console.log(error)
                }
            }
            fetchData();
        }
    }, [])

    const sortDocuments = useCallback((key: DocumentFieldName, isAscending: boolean, start?:number, end?:number) => {
        if(documentDataHandler.isAllDataCached()){
            setDocuments(() => documentDataHandler.getCachedData({key, isAscending}))
        }
        }, []);

    useEffect(() => {
        if (documents && isAllDataFetched) {
            documentEventEmitter.emit('documentsUpdated', {documents, indexStart: coordinates.start});
        }
    }, [documents]);

    useEffect(() => {
        console.time(`Sorting by ${sorter.key}`)
        const sorted = documentDataHandler.getCachedData({ 
            ...sorter,
            start: coordinates.start,
            end: coordinates.end
        })
        
        if(documentDataHandler.isAllDataCached()){
            setDocuments(() => sorted);
        }
        console.timeEnd(`Sorting by ${sorter.key}`)
        
    }, [sorter.isAscending, sorter.key])

    useEffect(() => {
        //@ts-ignore
        documentEventEmitter.on('sortDocuments', ({key, isAscending: isAscending}) => {
            isRendering.current = true
            setSorter({ key, isAscending })
        });

        documentEventEmitter.on('bottomRefTriggered', () => {
            console.log("bottom trigger")
            if (!isRendering.current && isAllDataFetched.current) {
                setCoordinates((prev) => shiftCoordinates({ maxEnd: documentDataHandler.allData.length, coordinates: prev, shift:  DOCUMENTS_RENDER_LIMIT  }));
            }
        });

        documentEventEmitter.on('topRefTriggered', () => {
            console.log("top trigger")
            if (!isRendering.current && isAllDataFetched.current) {
                console.log("coordinates is changing")
                setCoordinates((prev) => shiftCoordinates({  maxEnd: documentDataHandler.allData.length, coordinates: prev, shift:  -1 * DOCUMENTS_RENDER_LIMIT  }));
            }
        });

        documentEventEmitter.on('documentsRerendered', () => {
            isRendering.current = false;
        })
        return ()=>{
            documentEventEmitter.unsubscribe("sortDocuments")
            documentEventEmitter.unsubscribe("bottomRefTriggered")
            documentEventEmitter.unsubscribe("topRefTriggered")
            documentEventEmitter.unsubscribe("documentsRerendered")
        }
    }, []);

    useEffect(() => {
            if(documentDataHandler.allData){
                console.log("coordinates changed")
                isRendering.current = true;
                setDocuments(() => documentDataHandler.allData.slice(coordinates.start, coordinates.end))
            }
    }, [coordinates.end, coordinates.start]);

    return {documents, documentsAmount: documentDataHandler.allData ? documentDataHandler.allData.length : null, sortDocuments, coordinates, isRendering}
}
