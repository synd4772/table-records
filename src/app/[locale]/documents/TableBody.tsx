'use client';

import { MutableRefObject, useEffect, useRef, useState } from "react";
import { HeaderName, Document } from "./documents.types";
import { TableRow } from "./TableRow";
import { documentEventEmitter } from "./documentEventEmitter";
import { useData } from "./useData";

interface TableBodyProps {
  headers: HeaderName[],
  bottomObserver: MutableRefObject<IntersectionObserver | null>
  topObserver: MutableRefObject<IntersectionObserver | null>
}

export const TableBody = ({ headers, bottomObserver, topObserver }: TableBodyProps) => {
    
  const [documents, setDocuments] = useState<Document[]>([]);
  const indexStart = useRef(0);
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null)

  const topTrigger = useRef<HTMLTableRowElement | null>(null);
  const bottomTrigger = useRef<HTMLTableRowElement | null>(null);

  const prevStartIndex = useRef<number | null>(-1);

  const rerenderCount = useRef(0);
   
  useEffect(() => {
    documentEventEmitter.on('documentsUpdated', (args) => {
      bottomObserver.current?.disconnect()
      topObserver.current?.disconnect()
      //@ts-ignore
      const { documents: _documents, indexStart: _indexStart } = args;
      console.log({ _documents, _indexStart })
      indexStart.current = _indexStart;
      setDocuments(() => [..._documents as Document[]]);
    });
    return () => {
      documentEventEmitter.unsubscribe('documentsUpdated')
    }
  }, []);

  useEffect(() => {
        rerenderCount.current += 1
        console.log('indexStart', indexStart.current, rerenderCount)
        documentEventEmitter.emit('documentsRerendered', null)
        prevStartIndex.current = indexStart.current
        
        if (topObserver.current && topTrigger.current) {
          topObserver.current?.observe(topTrigger.current as Element)
          console.log('subscibed topTrigger', topTrigger.current)
        }
        if (bottomObserver.current && bottomTrigger.current) {
          bottomObserver.current?.observe(bottomTrigger.current as Element)
          console.log('subscibed bottomTrigger', bottomTrigger.current)
        }
  });

  return (
    <tbody ref={tableBodyRef}>
      {!documents.length && <tr><td style={{ textAlign: 'center' }} colSpan={headers.length}> Loading ... </td></tr>}
      {
        documents.map((document, i) => {
          const isTopRefIndex = i === Math.floor(documents.length * 0.3);
          const isBottomRefIndex = i === Math.ceil(documents.length * 0.8);

          return <TableRow
            classes={isBottomRefIndex ? 'with-bottom-ref' : isTopRefIndex ? 'with-top-ref' : ''}
            ref={isBottomRefIndex ? bottomTrigger : isTopRefIndex ? topTrigger : null}
            key={document.id}
            document={document}
            headers={headers}
            index={indexStart.current + i}
          />
        })
      }
    </tbody>
  )
};