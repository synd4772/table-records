import { Document, DocumentFieldName } from "@/app/[locale]/documents/documents.types"
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { sortByKey } from "@/app/utils/sortByKey";
import { documentEventEmitter } from "./documentEventEmitter";
import { Coordinates, shiftCoordinates } from "@/app/utils/shiftCoordinates";
import { ChunkHandler } from "@/app/utils/ChunkHandler";

const DOCUMENTS_RENDER_LIMIT = 100;

const INIT_COORDINATES: Coordinates = {
  start: 0,
  end: 5 * DOCUMENTS_RENDER_LIMIT,
};

export const useData = () => {
    const data = useRef<Document[] | null>(null)


    const [coordinates, setCoordinates] = useState<Coordinates>(INIT_COORDINATES);
    
    const [documents, setDocuments] = useState<Document[]>([]);
    const [sorter, setSorter] = useState<{ key: keyof Document, isAscending: boolean}>( { key: 'id', isAscending: true });

    const isRendering = useRef(false);
    const isFirstDataFetched = useRef(false);
    const isAllDataFetched = useRef(false)

    useEffect(()=>{
        documentEventEmitter.on("documentsFetched", (jsonData)=>{
            //@ts-ignore
            data.current = jsonData
            console.log("all fetched")
            setDocuments((data.current as Document[]).slice(coordinates.start, coordinates.end));
            documentEventEmitter.unsubscribe("documentsFetched")
            isAllDataFetched.current = true
        })

        documentEventEmitter.on("documentsForFirst", (jsonData)=>{
            //@ts-ignore
            console.log(jsonData)
            setDocuments((jsonData as Document[]).slice(coordinates.start, coordinates.end));
            documentEventEmitter.unsubscribe("documentsForFirst")
        })
    }, [])

    useEffect(()=>{
        if(!isFirstDataFetched.current){
            async function fetchData() {
                console.log("fetching")
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
                            isFirstDataFetched = true
                            documentEventEmitter.emit("documentsForFirst", chunkHandler.processedChunks)
                        }
                    }
                    documentEventEmitter.emit("documentsFetched", chunkHandler.processedChunks)
                }
                catch(error){
                    console.log(error)
                }
            }
            fetchData();
            isFirstDataFetched.current = true;
        }
    }, [])

    const sortDocuments = useCallback((key: DocumentFieldName, isAscending: boolean) => {
        setDocuments((prev) => sortByKey<Document>(
        {data: prev, 
        key,
        isAscending}
        )
    ) 
    }, []);

    useEffect(() => {
        if (documents) {
            console.log(documents.length, "LENGTH")
            console.log("DOCUMENTS UPDATED EMIT", INIT_COORDINATES)
        documentEventEmitter.emit('documentsUpdated', {documents, indexStart: coordinates.start});
        }
    }, [documents]);

    useEffect(() => {
        const sorted = sortByKey<Document>({ 
            data: (data.current as Document[]), 
            ...sorter
        }).slice(coordinates.start, coordinates.end);

        setDocuments(() => sorted);
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
                setCoordinates((prev) => shiftCoordinates({ maxEnd: (data.current as Document[]).length, coordinates: prev, shift:  DOCUMENTS_RENDER_LIMIT  }));
            }
        });

        documentEventEmitter.on('topRefTriggered', () => {
            console.log("top trigger")
            if (!isRendering.current && isAllDataFetched.current) {
                console.log("coordinates is changing")
                setCoordinates((prev) => shiftCoordinates({  maxEnd:  (data.current as Document[]).length, coordinates: prev, shift:  -1 * DOCUMENTS_RENDER_LIMIT  }));
            }
        });

        documentEventEmitter.on('documentsRerendered', () => {
            isRendering.current = false;
        })

    }, []);

    useEffect(() => {
            
            
            if(data.current){
                console.log("coordinates changed")
                isRendering.current = true;
                setDocuments(() =>(data.current as Document[]).slice(coordinates.start, coordinates.end))
            }
            
    }, [coordinates.end, coordinates.start]);

    return {documents, documentsAmount: data.current ? (data.current as Document[]).length : null, sortDocuments, coordinates, isRendering}
}
