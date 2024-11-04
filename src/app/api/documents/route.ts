import { NextRequest, NextResponse } from "next/server";
import { Document, DefaultRequest, Requests, DataRequest } from "@/app/[locale]/documents/documents.types";
import { ChunkHandler } from "@/app/utils/ChunkHandler";
import { loadEnvConfig } from '@next/env'
import { serverDataHandler } from "@/app/lib/serverDataHandler";
import { serverEventEmitter } from "@/app/lib/serverEventEmitter";

const projectDir = process.cwd()
loadEnvConfig(projectDir)

export async function GET(request: NextRequest) {
    if(!serverDataHandler.allData.length){
        const stream = new ReadableStream({
            async start(controller){
                const response = await fetch(`${process.env.API_URL}data-1M.json`, {cache: "no-cache"})
                const reader = response.body?.getReader()
                const decoder = new TextDecoder("utf-8")
                const chunkHandler = new ChunkHandler();
                let firstDataSended = false
                try{
                    while(true){
                        //@ts-ignore
                        const { done, value } = await reader?.read();
                        if (done) {
                            break;
                        }
                        const chunk = decoder.decode(value, { stream: true });
                        chunkHandler.processChunk(chunk);
                    
                        if(chunkHandler.processedChunks.length >= 500){
                            if (!firstDataSended){
                                firstDataSended = true
                                controller.enqueue(new TextEncoder().encode(JSON.stringify(chunkHandler.processedChunks.slice(0,500))))
                            }
                            serverDataHandler.pushData(chunkHandler.processedChunks.slice(0,500))
                            chunkHandler.processedChunks = chunkHandler.processedChunks.slice(500)
                        }
                    }
                    
                } catch (error) {
                    console.log(error, "error")
                    controller.close()
                } finally {
                    //@ts-ignore
                    reader.releaseLock();
                    if (chunkHandler.processedChunks.length){
                        serverDataHandler.pushData(chunkHandler.processedChunks)
                    }
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ready: true, documentAmount: serverDataHandler.allData.length})))
                    controller.close()
                    
                    serverEventEmitter.emit("isAllDataFetched", null)
                    serverDataHandler.processData()
                    
                    console.log(chunkHandler.processedChunks.length, "ended")
                }
            }
        })
        
        return new Response(stream, {headers:{"Content-Type": "application/json", "Cahce-Control": "no-cache"}})
    }
    else{
        return NextResponse.json([...serverDataHandler.allData.slice(0,500), {ready: true, documentAmount: serverDataHandler.allData.length}])
    }

}

export async function POST(request: NextRequest){
    try {
        const data = await request.json() as DefaultRequest;
        switch(data.request){
            case "fetchData":
                if(serverDataHandler.isAllDataFetched && serverDataHandler.isAllDataCached()){
                    const fetchDataRequest = data as DataRequest

                    const {key, isAscending} = fetchDataRequest.body.sorting
                    const {start, end} = fetchDataRequest.body.coordinates
                    
                    const dataForResponse = serverDataHandler.getCachedData({key, isAscending, start, end})
                    return NextResponse.json({message: dataForResponse, recievedData: data})
                }
                break;
            case "isAllDataProcessed":
                if(!serverDataHandler.isAllDataCached()){
                    if(serverDataHandler.isAllDataFetched){
                        serverDataHandler.processData()
                        return NextResponse.json({message: {isAllDataProcessed: true}, recievedData: data})
                    }
                    else {
                        return NextResponse.json({message: {isAllDataProcessed: false}, recievedData: data})
                    }
                }
                break;
        }
        return NextResponse.json({message:null, recievedData: data})

    }
    catch(error){
        console.log(error)
    }
}