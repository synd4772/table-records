import { CachedSortedData,CachedSortedDataKeys,  INIT_CACHED_SORTED_DATA, DefaultHeaders, Document} from "../[locale]/documents/documents.types";
import { serverEventEmitter } from "../lib/serverEventEmitter";

interface DataMessage {
    key: DefaultHeaders,
    ascendingIndexes: number[],
    descendingIndexes: number[]
}

export class DataHandler{
    private _allData: Document[]
    private cachedSortedData: CachedSortedData
    isAllDataFetched: boolean

    constructor(){
        this.cachedSortedData = {...INIT_CACHED_SORTED_DATA}
        this._allData = []     
        this.isAllDataFetched = false
        
        serverEventEmitter.on("isAllDataFetched", (args)=>{
            this.isAllDataFetched = true
        })
    }

    set allData(data: Document[]){
        this._allData = data
    }

    get allData(){
        return this._allData
    }

    pushData(data: Document[]){
        this.allData.push(...data)
        serverEventEmitter.emit("documentsAmountChanged", this._allData.length)
    }

    processData(){
        if (this._allData.length){
            for(const property in this.cachedSortedData){
                const key = property as DefaultHeaders
                const ascendingIndexes = this.sortByKey(key)
                const descendingIndexes = ascendingIndexes.slice().reverse()
                
                this.cachedSortedData[key].ascending = ascendingIndexes
                this.cachedSortedData[key].notAscending = descendingIndexes
            }
            return true
        }
        return false
    }
    
    sortByKey(key: DefaultHeaders) {
        const sortedData = this.allData.slice().sort((_a, _b) => {
            const [a, b] = [_a, _b];
            if (typeof a[key] === 'string' && typeof b[key] === 'string') {
                return a[key].localeCompare(b[key])
            }
            //@ts-ignore
            return a[key] - b[key]
        });
        const ascendingIndexes = sortedData.map((element) => element.id - 1);
    
        return ascendingIndexes 
    }

    isAllDataCached(){
        for(const prop in this.cachedSortedData){
            const key = prop as DefaultHeaders
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
        
        const cachedDataIds = start === -1 && end === -1 ? obj : obj.slice(start,end)
        console.time("backend sorting")
        const data: Document[] = []
        if(!this.isSortedIndexesCached({key, isAscending})) return []
        cachedDataIds.forEach((element)=>{
            data.push(this._allData[element])
        })
        console.timeEnd("backend sorting")
        
        return data;
    }

}

interface IsSortedDataCachedProps{
    key: DefaultHeaders,
    isAscending: boolean
}

interface GetCachedDataProps{
    key: DefaultHeaders,
    isAscending: boolean
    start?:number,
    end?:number

}