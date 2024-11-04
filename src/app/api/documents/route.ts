import { NextRequest, NextResponse } from "next/server";
import { Document } from "@/app/[locale]/documents/documents.types";
import { ChunkHandler } from "@/app/utils/ChunkHandler";
import { loadEnvConfig } from '@next/env'

interface IData {
    data: Document[]
}

export const data:IData = {
    data:[]
}

const projectDir = process.cwd()
loadEnvConfig(projectDir)

export async function GET(request: NextRequest) {
    const stream = new ReadableStream({
        async start(controller){
            const response = await fetch(`${process.env.API_URL}data-100K.json`, {cache: "no-cache"})
            const reader = response.body?.getReader()
            const decoder = new TextDecoder("utf-8")
            const chunkHandler = new ChunkHandler();
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
                        controller.enqueue(new TextEncoder().encode(JSON.stringify(chunkHandler.processedChunks.slice(0,500))))
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
                    controller.enqueue(new TextEncoder().encode(JSON.stringify(chunkHandler.processedChunks)))
                }
                controller.close()
                console.log(chunkHandler.processedChunks.length, "ended")
            }
        }
    })
    
    return new Response(stream, {headers:{"Content-Type": "application/json", "Cahce-Control": "no-cache"}})
}
