'use client';
import { useTranslations } from "next-intl";
import { DocumentFieldName, HeaderName } from "./documents.types";
import { useEffect, useState } from "react";
import { documentEventEmitter } from "./documentEventEmitter";
import { documentDataHandler } from "./documentsDataHandler";
import { headers } from "next/headers";

interface TableHeaderProps {
  headers: HeaderName[];
}
// type sortingAbility ={
//  [key in keyof typeof HeaderName]: boolean;
// }

// const INIT_SORTING_ABILITITY = {
//     index: false,
//     id: false,
//     state: false,
//     stateTime: false,
//     documentName: false,
//     documentNumber: false,
//     documentDate: false,
//     documentTotalAmount: false,
// } as sortingAbility

export const TableHeader = ({ headers }: TableHeaderProps) => {
  const t = useTranslations('DocumentsPage');
//   const [sortingAbility, setSortingAbility] = useState(INIT_SORTING_ABILITITY)

  const [sortedBy, setSortedBy] = useState<{header: HeaderName, isAscending: boolean}>({
    header: HeaderName.id,
    isAscending: true
  });

  useEffect(()=>{
    documentEventEmitter.on("fieldSortingAvailable", (args)=>{
        const header = args as HeaderName
        // const newSortingAbilityObject = sortingAbility
        // newSortingAbilityObject[header] = true
        // setSortingAbility((prev)=>)
    })
    return ()=>{
        documentEventEmitter.unsubscribe("fieldSortingAvailable")
    }
  }, [])

  const handleSort = (header: HeaderName) => {
    if(documentDataHandler.isAllDataCached()){
        if (!(header in DocumentFieldName)) {
            return;
          }
          const isAscending = sortedBy.header === header? !sortedBy.isAscending: true;
          documentEventEmitter.emit('sortDocuments', { key: header, isAscending });
          setSortedBy(({
            header,
            isAscending
          }));
    }
  };

  return (
    <tr>
      {
        headers.map((header) => {
          return (
            <th className={header in DocumentFieldName? `sortable`:''} key={header} onClick={() => handleSort(header)}>
              {t(`table.header.${header}`)}
              { sortedBy.header !== header 
                  ? ''
                  :  !sortedBy.isAscending 
                    ? ' ↑ ':' ↓ '}
            </th>
          )
        })
      }
    </tr>
  )
};