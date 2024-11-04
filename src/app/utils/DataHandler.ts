import { CachedSortedData,CachedSortedDataKeys,  INIT_CACHED_SORTED_DATA, DocumentFieldName, Document} from "../[locale]/documents/documents.types";
import { documentEventEmitter } from "../[locale]/documents/documentEventEmitter";

interface DataMessage {
    key: CachedSortedDataKeys,
    ascendingIndexes: number[],
    descendingIndexes: number[]
}

export class DataHandler{
    private _allData: Document[]
    private cachedSortedData: CachedSortedData
    private isMessagePosted: boolean

    constructor(){
        this.cachedSortedData = {...INIT_CACHED_SORTED_DATA}
        this._allData = []     
        this.isMessagePosted = false
    }

    set allData(data: Document[]){
        this._allData = data
    }

    get allData(){
        return this._allData
    }

    pushData(data: Document[]){
        this.allData.push(...data)
        documentEventEmitter.emit("documentsAmountChanged", this._allData.length)
    }

    createSortWorker(){
        if(this.allData.length){
            const worker = new Worker("/workers/SortWorker.js")
            if(!this.isMessagePosted){
                worker.postMessage({data:this.allData, cache:this.cachedSortedData})
                console.time("sorting and indexing")
                this.isMessagePosted = true
            }
            
            worker.onmessage = (event: MessageEvent<DataMessage>) => {
                this.cachedSortedData[event.data.key]["ascending"] = event.data.ascendingIndexes
                this.cachedSortedData[event.data.key]["notAscending"] = event.data.descendingIndexes
                documentEventEmitter.emit("fieldSortingAvailable", event.data.key)
                if(this.isAllDataCached()){
                    console.timeEnd("sorting and indexing")
                    worker.terminate()
                }
            }
        }
    }

    isAllDataCached(){
        for(const prop in this.cachedSortedData){
            const key = prop as CachedSortedDataKeys
            if (!this.cachedSortedData[key]["ascending"].length && !this.cachedSortedData[key]["notAscending"].length){
                return false
            }
        }
        return true
    }

    isSortedIndexesCached({key, isAscending}: IsSortedDataCachedProps){
        const keyObject = isAscending ? "ascending" : "notAscending"
        if(this.cachedSortedData[key][keyObject].length) return true;
        return false;
    }

    getCachedData({key, isAscending, start = -1, end = -1}: GetCachedDataProps){
        const keyObject = isAscending ? "ascending" : "notAscending"
        const obj = this.cachedSortedData[key][keyObject]
        
        const cachedDataIds = start === -1 && end == -1 ? obj : obj.slice(start,end)
        const data: Document[] = []
        if(!this.isSortedIndexesCached({key, isAscending})) return []
        cachedDataIds.forEach((element)=>{
            data.push(this._allData[element])
        })
        return data;
    }

}

interface IsSortedDataCachedProps{
    key: keyof Document,
    isAscending: boolean
}

interface GetCachedDataProps{
    key: keyof Document,
    isAscending: boolean
    start?:number,
    end?:number

}

interface SortByKeyProps {
  key: keyof Document, 
  isAscending: boolean
  start?:number,
  end?:number
}
interface SetSortedDataInCache {
    data: Document[], 
    key: keyof Document, 
    isAscending: boolean
  }