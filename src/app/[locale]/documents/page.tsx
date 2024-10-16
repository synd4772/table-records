'use client'
import {useTranslations} from 'next-intl';

import "./documents.css"
import { DateTime } from 'luxon';
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { DocumentContext } from "next/document";
import { taintObjectReference } from "next/dist/server/app-render/entry-base";
import { SUPPORTED_NATIVE_MODULES } from "next/dist/build/webpack/plugins/middleware-plugin";
import { useDocumentData, DocumentGeneric } from "./useDocumentData";
import { useTranslation } from 'next-i18next'

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

let countBottRecords = 0;
// luxon
export default function Home() {

    const recordsPerPage = 300
    
    const t = useTranslations("Documents")
    const [allDocuments] = useDocumentData()

    const [sortKey, setSortKey] = useState<keyof DocumentGeneric<DateTime>>("id")
   
    const [isAscending, setIsAscending] = useState(false)

    const observerRef = useRef<IntersectionObserver | null>(null)
    const topObserverRef = useRef<IntersectionObserver | null>(null);

    const loaderRef = useRef<HTMLTableRowElement | null>(null)
    const topLoaderRef = useRef<HTMLTableRowElement | null>(null);

    // const [switchFlag, setSwitchFlag] = useState(true)
    

    const [bottomRecords, setBottomRecords] = useState<number>(recordsPerPage);
    const [topRecords, setTopRecords] = useState<number>(0);

    const bottomRecordsRef = useRef<number>(bottomRecords)
    const topRecordsRef = useRef<number>(topRecords)
    
    // console.time("sort")
    const documents = useMemo(() => {
        console.log({isAscending, sortKey})
        return allDocuments.sort((a, b) => {
        if (typeof a[sortKey] === "string" && typeof b[sortKey] === "string"){
            if (["stateTime", "documentDate"].includes(sortKey)){
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
        //@ts-ignore
        return isAscending ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey] 

    }
    )}, [allDocuments, isAscending, sortKey])
    const sort = useCallback((header: Partial<keyof DocumentObject>) => {
        console.warn("useCallBack")
        console.log(header)
        if (sortKey === header){
            setIsAscending((prev) => !prev)
        }
        else{
            setSortKey(header)
            setIsAscending((prev) => !prev)
        }
    } , [sortKey])

    const [visibleRecords, setVisibleRecords] = useState<DocumentGeneric<string>[]>(documents.slice(topRecords, bottomRecords))

    useEffect(() => {
        setVisibleRecords(documents.slice(topRecords, bottomRecords))

        console.log("topRecords", topRecords, "bottomRecords", bottomRecords)
        bottomRecordsRef.current = bottomRecords
        topRecordsRef.current = topRecords
        console.log("topRecordsRef", topRecordsRef.current, "bottomRecordsRef", bottomRecordsRef.current)

    }, [topRecords, bottomRecords, isAscending])


    const timeRef = useRef<number>(0)
    const topTimeRef = useRef<number>(0)

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            console.log("isIntrececting [bottom]", entries)
          if (entries[0].isIntersecting && timeRef.current != 1) {
            console.log(`true [bottom]`)
            timeRef.current = 1
            setTopRecords((prev) => {
                console.log(`previous: ${prev}, next: ${prev + recordsPerPage}`)
                // return prev + recordsPerPage / 2}); v1
                return prev + recordsPerPage});
            setBottomRecords((prev) => {
                console.log(`previous: ${prev}, next: ${prev + recordsPerPage + 100}`)
                // return prev + recordsPerPage + 100}); v1
                return prev + recordsPerPage});
          }
          else if (timeRef.current == 1){
            console.log(`false [bottom]`)
            timeRef.current = 0
          }
        });
    
        topObserverRef.current = new IntersectionObserver((entries) => {
            console.log(`isIntersecting [top]`, entries)
            if (entries[0].isIntersecting && topRecordsRef.current > 0 && topTimeRef.current != 1) {
                console.log(`true [top]`)
                topTimeRef.current = 1
                setTopRecords((prev) => {
                    console.log(`previous: ${prev}, next: ${Math.max(prev - recordsPerPage / 2, 0)}`)
                    // return Math.max(prev - recordsPerPage / 2, 0)}); 1v
                    return Math.max(prev - recordsPerPage, 0)});
                setBottomRecords((prev) =>  {
                    console.log(`previous: ${prev}, next: ${Math.max(prev - recordsPerPage - 100, 0)}`)
                    // return Math.max(prev - recordsPerPage - 100, 0) }); 1v
                    return Math.max(prev - recordsPerPage, 0) });
              } 
            else if (topTimeRef.current == 1){
                console.log(`false [top]`)
                topTimeRef.current = 0
            }
         });
        if (loaderRef.current) {
            observerRef.current.observe(loaderRef.current);
            console.log("bottom loaded", loaderRef.current)
        }

      }, []);
    
      
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

    useEffect(()=>{
        
        console.log(`${topLoaderRef.current} && ${topObserverRef.current} :`, topLoaderRef.current != null && topObserverRef.current != null)
        if (topLoaderRef.current != null && topObserverRef.current != null) {
            topObserverRef.current = new IntersectionObserver((entries) => {
                console.log(`isIntersecting [top]`, entries[0].isIntersecting)
                // if (entries[0].isIntersecting && topRecordsRef.current > 0 && topTimeRef.current != 1) {
                if (entries[0].isIntersecting && topRecordsRef.current > 0) {
                    console.log(`true [top]`)
                    // topTimeRef.current = 1
                    
                    setTopRecords((prev) => {
                        console.log(`previous: ${prev}, next: ${Math.max(prev - recordsPerPage, 0)}`)
                        // return Math.max(prev - recordsPerPage / 2, 0)}); 1v

                        // return switchFlag ? Math.max(prev - recordsPerPage, 0) : Math.max(prev - recordsPerPage - 100, 0)
                        return Math.max(prev - recordsPerPage, 0)
                    });
                    setBottomRecords((prev) =>  {
                        console.log(`previous: ${prev}, next: ${Math.max(prev - recordsPerPage, 0)}`)
                        // return Math.max(prev - recordsPerPage - 100, 0) }); 1v

                        // return switchFlag ? Math.max(prev - recordsPerPage - 100, 0) : Math.max(prev - recordsPerPage, 0)
                        return Math.max(prev - recordsPerPage, 0)
                     });
                    //  setSwitchFlag((prev)=>!prev)
                  } 
                // else if (topTimeRef.current == 1){
                //     console.log(`false [top]`)
                //     topTimeRef.current = 0
                // }
             });

            topObserverRef.current.observe(topLoaderRef.current);
            console.log("top loaded", topLoaderRef.current)
        }
        return () => {
            if (topLoaderRef.current){
                topObserverRef.current?.unobserve(topLoaderRef.current)}
            }
            
    }, [])
    
    useEffect(()=>{
        if (loaderRef.current != null && observerRef.current != null) {
            observerRef.current = new IntersectionObserver((entries) => {
                console.log("isIntrececting [bottom]", entries[0].isIntersecting)
                // if (entries[0].isIntersecting && timeRef.current != 1) {
              if (entries[0].isIntersecting) {
                console.log(`true [bottom]`)
                // timeRef.current = 1
                // setSwitchFlag((prev)=>!prev)
                setTopRecords((prev) => {
                    console.log(`previous: ${prev}, next: ${prev + recordsPerPage}`)
                    // return prev + recordsPerPage / 2}); v1

                    // return switchFlag ? prev + recordsPerPage : prev + recordsPerPage + 100
                    return prev + recordsPerPage 
                });
                setBottomRecords((prev) => {
                    console.log(`previous: ${prev}, next: ${prev + recordsPerPage}`)
                    // return prev + recordsPerPage + 100}); v1

                    // return switchFlag ? prev + recordsPerPage + 100 : prev + recordsPerPage
                    return  prev + recordsPerPage
                })
                }
            //   else if (timeRef.current == 1){
            //     console.log(`false [bottom]`)
            //     timeRef.current = 0
            //   }
            });

            observerRef.current.observe(loaderRef.current);
            console.log("bottom loaded", loaderRef.current)
        }
    }, [bottomRecords, observerRef.current])
        




    useEffect(()=>{
        console.log("")
        console.log("count bottom records ", countBottRecords, "; maxBottomRecords", bottomRecords, "; count top records ", topRecords)
    }, [countBottRecords])
    

    const headersComponent = useMemo(() => {
        return headers.map((header) => (
          <th className="documents-th" key={header} onClick={() => sort(header)}>
            {`${t(header)} ${sortKey === header ? (isAscending ? '⭣' : '⭡') : ''}`}
          </th>
        ));
      }, [headers, sortKey, isAscending]); // ref={index === recordsPerPage / 2 && topRecords > 130 ? topLoaderRef : (index === Math.round((bottomRecords - topRecords) - 10) ? loaderRef : null)} style={{backgroundColor:index === recordsPerPage / 2 && topRecords > 130 ? "red" : (index === Math.round((bottomRecords - topRecords) - 10) ? "green" : "white")}}

    const tableRowRender = (document: DocumentGeneric<string>, index: number, addTopRef = false) => (
        <tr key={document.id} ref={index == 50 ? topLoaderRef : (index == (bottomRecords - topRecords) - 20 ? loaderRef : null)} id={`${document.id}`} style={{backgroundColor:index == Math.round(recordsPerPage / 5)?"red": (index == (bottomRecords - topRecords) - 20 ? "green ": "white")}}> 
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
            <tr style={{height:getHeight(topRecords)}}></tr>
            {/* (bottomRecords - topRecords) - 10 1v */}
            {[...visibleRecords].slice(0).map((document, index) => { 
                
                return tableRowRender(document, index, true)})}

            {/* <tr ref={loaderRef}>
                <td colSpan={headers.length}></td>
            </tr> 1v */}

            {/* (bottomRecords - topRecords) - 10 1v */} 
            {/* {[...visibleRecords].slice((bottomRecords - topRecords) - 20, visibleRecords.length -1 ).map((document, index) => {
                return tableRowRender(document, index, false)
            })} */}
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