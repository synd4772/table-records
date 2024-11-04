self.onmessage = function(event){
    const message = event.data
    console.log("message recieved", event.data)
    const data = message["data"]
    const cache = message["cache"]
    for(const property in cache){
        const key = property
        const ascendingIndexes = sortByKey({data, key})
        const descendingIndexes = ascendingIndexes.slice().reverse()
        self.postMessage({key, ascendingIndexes, descendingIndexes})
    }
}

function sortByKey({ data, key }) {
    const sortedData = data.slice().sort((_a, _b) => {
        const [a, b] = [_a, _b];
        if (typeof a[key] === 'string' && typeof b[key] === 'string') {
            return a[key].localeCompare(b[key])
        }
        return a[key] - b[key]
    });
    const ascendingIndexes = sortedData.map((element) => element.id - 1);

    return ascendingIndexes 
}