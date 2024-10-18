'use client'
import { useTranslations } from 'next-intl';

import "./documents.css"
import { DateTime } from 'luxon';
import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { useDocumentData, DocumentGeneric } from "./useDocumentData";
import { urlToHttpOptions } from 'url';


export const DocumentState = {
    submitted: 'SUBMITTED',
    inProgress: 'IN_PROCESS',
    additionalReview: 'ADDITIONAL_REVIEW',
    reviewCompleted: 'REVIEW_COMPLETED',
    invalid: 'INVALID',
} as const;

export type DocumentState = typeof DocumentState[keyof typeof DocumentState];

interface DocumentObject {
    index: number;
    id: number;
    state: DocumentState;
    stateTime: string;
    stateTimeMillis: number;
    documentNumber: string;
    documentName: string;
    documentDate: string;
    documentDateMillis: number;
    documentTotalAmount: number;
}
// luxon
export default function Home() {

    const recordsPerPage = 200

    const t = useTranslations("Documents")
    const [allDocuments] = useDocumentData()

    const [sortKey, setSortKey] = useState<keyof DocumentGeneric<DateTime>>("id")

    const [isAscending, setIsAscending] = useState(false)

    const observerRef = useRef<IntersectionObserver | null>(null)
    const topObserverRef = useRef<IntersectionObserver | null>(null);

    const loaderRef = useRef<HTMLTableRowElement | null>(null)
    const topLoaderRef = useRef<HTMLTableRowElement | null>(null);

    const [switchFlag, setSwitchFlag] = useState(true)


    const [bottomRecords, setBottomRecords] = useState<number>(recordsPerPage);
    const [topRecords, setTopRecords] = useState<number>(0);

    const bottomRecordsRef = useRef<number>(bottomRecords)
    const topRecordsRef = useRef<number>(topRecords)

    const documents = useMemo(() => {
        return allDocuments.sort((a, b) => {
            if (typeof a[sortKey] === "string" && typeof b[sortKey] === "string") {
                if (["stateTime", "documentDate"].includes(sortKey)) {
                    const date1 = isAscending ? a : b
                    const date2 = isAscending ? b : a

                    return date1 == date2
                        ? 0
                        : date1 < date2
                            ? -1
                            : 1
                }

                const nameA = isAscending ? a[sortKey].toUpperCase() : b[sortKey].toUpperCase();
                const nameB = isAscending ? b[sortKey].toUpperCase() : a[sortKey].toUpperCase();
                return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            }

            return isAscending ? b[sortKey] as number - (a[sortKey] as number) : (a[sortKey] as number) - (b[sortKey] as number)

        }
        )
    }, [allDocuments, isAscending, sortKey])
    const sort = useCallback((header: Partial<keyof DocumentObject>) => {
        console.warn("useCallBack")
        console.log(header)
        if (sortKey === header) {
            setIsAscending((prev) => !prev)
        }
        else {
            setSortKey(header)
            setIsAscending((prev) => !prev)
        }
    }, [sortKey])

    const [visibleRecords, setVisibleRecords] = useState<DocumentGeneric<string>[]>(documents.slice(topRecords, bottomRecords))
    console.log(visibleRecords.length, "size")
    useEffect(() => {
        setVisibleRecords(documents.slice(topRecords, bottomRecords))

        console.log("topRecords", topRecords, "bottomRecords", bottomRecords)
        bottomRecordsRef.current = bottomRecords
        topRecordsRef.current = topRecords
        console.log("topRecordsRef", topRecordsRef.current, "bottomRecordsRef", bottomRecordsRef.current)
        
    }, [topRecords, bottomRecords, isAscending])

    const headers: Partial<keyof DocumentObject>[] = [
        "index",
        "documentNumber",
        "id",
        "state",
        "documentName",
        "stateTime",
        "documentDate",
        "documentTotalAmount"
    ]

    useEffect(() => {
        console.log(`${topLoaderRef.current} && ${topObserverRef.current} :`, topLoaderRef.current != null && topObserverRef.current != null)
        if (topLoaderRef.current !== null) {
            topObserverRef.current = new IntersectionObserver((entries) => {
                console.log(`isIntersecting [top]`, entries[0].isIntersecting)
                if (entries[0].isIntersecting && topRecordsRef.current > 0) {
                    console.log(`true [top]`)
                    setTopRecords((prev) => {
                        console.log(`previous: ${prev}, next: ${Math.max(prev - recordsPerPage, 0)} (setTopRecords)`)

                        return switchFlag ? Math.max(prev - recordsPerPage, 0) : Math.max(prev - recordsPerPage - 50, 0)
                    });
                    setBottomRecords((prev) => {
                        console.log(`previous: ${prev}, next: ${Math.max(prev - recordsPerPage, 0)} (setBottomRecords)`)

                        return switchFlag ? Math.max(prev - recordsPerPage - 50, 0) : Math.max(prev - recordsPerPage, 0)
                    });
                }
            });
            topObserverRef.current.observe(topLoaderRef.current);
            console.log("top loaded", topLoaderRef.current)
        }
        return () => {
            if (topLoaderRef.current) {
                topObserverRef.current?.unobserve(topLoaderRef.current)
            }
        }
    }, [])

    useEffect(()=>{
        if (loaderRef.current && observerRef.current){
            observerRef.current.disconnect();
            observerRef.current.observe(loaderRef.current)
            console.log("bottom loaded", loaderRef.current)
        }
        if(topLoaderRef.current && topObserverRef.current){
            topObserverRef.current.disconnect();
            topObserverRef.current.observe(topLoaderRef.current)
            console.log("top loaded", topLoaderRef.current)

        }

    },[loaderRef.current, observerRef.current, topRecordsRef.current, isAscending])

    useEffect(() => {
        if (loaderRef.current !== null) {
            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    console.log(`true [bottom]`)
                    setSwitchFlag((prev)=>!prev)
                    setTopRecords((prev) => {
                        console.log(bottomRecordsRef.current , 'lol')
                        if (bottomRecordsRef.current === recordsPerPage){
                            return prev
                        }
                        console.log(`previous: ${prev}, next: ${prev + recordsPerPage}  (setTopRecords)`)            
                        return switchFlag ? prev + recordsPerPage : prev + recordsPerPage + 50
                    });
                    
                    setBottomRecords((prev) => {
                        console.log(`previous: ${prev}, next: ${prev + recordsPerPage} (setBottomRecords)`)
                        return switchFlag ? prev + recordsPerPage + 50 : prev + recordsPerPage
                    })

                    console.log("done")
                }
            });
        }
        return () => {
            console.log("unmounted (bottom)")
        }
    }, [])

    const headersComponent = useMemo(() => {
        return headers.map((header) => (
            <th className="documents-th" key={header} onClick={() => sort(header)}>
                {`${t(header)} ${sortKey === header ? (isAscending ? '⭣' : '⭡') : ''}`}
            </th>
        ));
    }, [headers, sortKey, isAscending]);

    const tableRowRender = (document: DocumentGeneric<string>, index: number) => (
        <tr key={document.id} ref={index == 50 ? topLoaderRef : (index == (bottomRecords - topRecords) - 20 ? loaderRef : null)} id={`${index + 1}`} style={{ backgroundColor: index == Math.round(recordsPerPage / 5) ? "red" : (index == (bottomRecords - topRecords) - 20 ? "green " : "white") }}>
            {headers.map(
                (header) => (
                    <td className="documents-td prikol" key={header}>
                        {header === 'index' ? topRecords + index + 1 : (header === 'state' ? t(document[header]) : document[header].toString())}
                    </td>
                )
            )}
        </tr>
    )

    const getHeight = useCallback((topRecords: number) => {
        console.log(`getHeight ${topRecords}`)
        return `${topRecords * 21}px`
    }, [])

    console.log("height:", getHeight(topRecords))
    return (
        <div className={'table-container'}>
            <table className='documents-table'>
                <thead>
                    <tr>
                        {headersComponent}
                    </tr>
                </thead>
                <tbody>
                    {/* <tr style={{ height: getHeight(topRecords) }}></tr> */}
                    {[...visibleRecords].slice(0).map((document, index) => {

                        return tableRowRender(document, index)
                    })}
                </tbody>
            </table>
        </div>
    );
}

// огранизовать сохранение данных в базу : sql / redux
// создать новую страницу для создания новых документов , которая ьбудет доступна по url document/new
// создать новую страницу для изменения имеющихся документов, которая ьбудет доступна по url document/:id
// создать actions == создание - единичное , (удаление , изменение) - множ.
// создать selection
// создать страницы
// фильтрация по полям