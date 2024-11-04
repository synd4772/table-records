import { Document, DataRequest, DefaultRequest, DataAmountAnswer, IsAllDataProcessedAnswer } from "../[locale]/documents/documents.types"
import { documentEventEmitter } from "../lib/documentEventEmitter";

export class DataRequestHandler{
    private _lastData: Document[]

    constructor(){
        this._lastData = []
    }

    get lastData(){
        return this._lastData;
    }

    async fetchDocumentsData(request: DataRequest){
        const response = await fetch("/api/documents", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        })
        const jsonData:Document[] = await response.json()
        documentEventEmitter.emit("dataFetched", jsonData)
        this._lastData = jsonData
        return jsonData;
    }

    async fetchSomeData(request: DefaultRequest){
        const response = await fetch("/api/documents", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        })

        const data = await response.json()

        switch(request.request){
            case "dataAmount":
                documentEventEmitter.emit("dataAmountFetched", (data as DataAmountAnswer).dataAmount);
                break;
            case "allData":
                documentEventEmitter.emit("allDataFetched", data as Document[]);
                break;
            case "isAllDataProcessed":
                documentEventEmitter.emit("isAllDataProcessedFetched", (data as IsAllDataProcessedAnswer).isAllDataProcessed);
        }
        return data;
    }
}