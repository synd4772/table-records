import { Document, DocumentFieldName, DefaultHeaders, DataRequest, DataAmountAnswer , DefaultMessage} from "@/app/[locale]/documents/documents.types"
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { documentEventEmitter } from "../../lib/documentEventEmitter";
import { Coordinates, shiftCoordinates } from "@/app/utils/shiftCoordinates";
import { ChunkHandler } from "@/app/utils/ChunkHandler";
import { clientDataRequestHandler } from "@/app/lib/documentDataRequestHandler";

const DOCUMENTS_RENDER_LIMIT = 100;

const INIT_COORDINATES: Coordinates = {
  start: 0,
  end: 5 * DOCUMENTS_RENDER_LIMIT,
};

type LastResponse = {
    ready:boolean,
    documentAmount: number
}

export const useData = () => {
    const [coordinates, setCoordinates] = useState<Coordinates>(INIT_COORDINATES);

    const [documents, setDocuments] = useState<Document[]>([]);

    const [sorter, setSorter] = useState<{ key: DefaultHeaders, isAscending: boolean}>( { key: 'id', isAscending: true });

    const isRendering = useRef(false);
    const isFetching = useRef(false);
    const isAllDataFetched = useRef(false)
    const dataAmount = useRef(-1)

    useEffect(()=>{
        documentEventEmitter.on("dataFetched", (jsonData)=>{
            isAllDataFetched.current = true
            setDocuments(() => (jsonData as DefaultMessage).message as Document[]);
            console.timeEnd("sorting started")
        })
        documentEventEmitter.on("anotherDataFetched", (jsonData)=>{

        })
        documentEventEmitter.on("firstDataFetched", (jsonData)=>{
            setDocuments(jsonData as Document[])
        })
        documentEventEmitter.on("documentsAmountChanged", (jsonData)=>{
            dataAmount.current = jsonData as number
        })
        return ()=>{
            documentEventEmitter.unsubscribe("fetchIsCompleted")
            documentEventEmitter.unsubscribe("anotherDataFetched")
            documentEventEmitter.unsubscribe("firstDataFetched")
            documentEventEmitter.unsubscribe("dataAmountFetched")
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
                        
                        if(!isFirstDataFetched){
                            chunkHandler.processChunk(chunk)
                            if(chunkHandler.processedChunks.length >= 500){
                                documentEventEmitter.emit("firstDataFetched", chunkHandler.processedChunks.slice(0, 500))
                                if(chunkHandler.processedChunks.length === 501){
                                    const lastResponse = chunkHandler.processedChunks[500] as unknown as LastResponse 
                                    if(lastResponse["ready"]){
                                        documentEventEmitter.emit("documentsAmountChanged", lastResponse["documentAmount"])
                                        chunkHandler.processedChunks = chunkHandler.processedChunks.slice(500)
                                        break;
                                    }

                                }
                                chunkHandler.processedChunks = chunkHandler.processedChunks.slice(500)
                                isFirstDataFetched = true
                                
                            }
                        }
                        else if (isFirstDataFetched){
                            const lastResponse = JSON.parse(chunk)
                            if(lastResponse["ready"]){
                                documentEventEmitter.emit("documentsAmountChanged", lastResponse["documentAmount"])
                            }
                            break;
                        }
                    }
                }
                catch(error){
                    console.log(error)
                }
            }
            fetchData();
            isFetching.current = true;
        }
        
    }, [])

    const sortDocuments = useCallback((key: DefaultHeaders, isAscending: boolean, start?:number, end?:number) => {
        // if(documentDataHandler.isAllDataCached()){
        //     setDocuments(() => documentDataHandler.getCachedData({key, isAscending}))
        // }
        }, []);

    useEffect(() => {
        if (documents && isAllDataFetched) {
            documentEventEmitter.emit('documentsUpdated', {documents, indexStart: coordinates.start});
        }
    }, [documents]);

    useEffect(() => {
        console.log("post", dataAmount.current)
        if(dataAmount.current != -1){
            const sortRequest: DataRequest = {
                request: "fetchData",
                body: {
                    coordinates: coordinates,
                    sorting: {
                        key: sorter.key,
                        isAscending: sorter.isAscending
                    }
                }
            }
            console.time("sorting started")
            clientDataRequestHandler.fetchDocumentsData(sortRequest)
        }
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
                setCoordinates((prev) => shiftCoordinates({ maxEnd: dataAmount.current, coordinates: prev, shift:  DOCUMENTS_RENDER_LIMIT  }));
            }
        });

        documentEventEmitter.on('topRefTriggered', () => {
            console.log("top trigger")
            if (!isRendering.current && isAllDataFetched.current) {
                console.log("coordinates is changing")
                setCoordinates((prev) => shiftCoordinates({  maxEnd: dataAmount.current, coordinates: prev, shift:  -1 * DOCUMENTS_RENDER_LIMIT  }));
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
            if(isAllDataFetched){
                console.log("coordinates changed")
                isRendering.current = true;
                const request: DataRequest  = {
                    request: "fetchData",
                    body:{
                        coordinates:{
                            start: coordinates.start,
                            end: coordinates.end
                        },
                        sorting:{
                            key: sorter.key,
                            isAscending: sorter.isAscending
                        }
                    }
                }
                clientDataRequestHandler.fetchDocumentsData(request)
            }
    }, [coordinates.end, coordinates.start]);

    // return {documents, documentsAmount: documentDataHandler.allData ? documentDataHandler.allData.length : null, sortDocuments, coordinates, isRendering}
    return {documents, sortDocuments, coordinates, isRendering}
}
