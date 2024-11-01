'use client';

import "./documents.css";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useData } from "./useData";
import { PageProps } from "../types";
import { HeaderName } from "./documents.types";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { Dispatch, MutableRefObject, SetStateAction, use, useEffect, useRef, useState } from "react";
import { useIntersectionObservers } from "./useIntersectionObservers";
import { documentEventEmitter } from "./documentEventEmitter";
import { isHeritageClause } from "typescript";

const headers = [
  HeaderName.index,
  HeaderName.id,
  HeaderName.state,
  HeaderName.stateTime,
  HeaderName.documentName,
  HeaderName.documentNumber,
  HeaderName.documentDate,
  HeaderName.documentTotalAmount,
] as HeaderName[];

interface TableStatProps{
    params: {
        locale: string
      },
      setHeaderRendered: Dispatch<SetStateAction<boolean>>
}

function TableStatHeader({ params, setHeaderRendered }: TableStatProps){
    const t = useTranslations('DocumentsPage');
    const {coordinates: coordintates, documentsAmount} = useData();
    useEffect(()=>{
        console.log("jouuu")
        setHeaderRendered(true)
    }, [])

    return (
        <div className="header-container">
        <div className="page-header" >
          <Link style={{ paddingRight: 10, textDecoration: params.locale === "en" ? "underline" : "none" }} href={'/documents'} locale="en" >EN</Link>
          <Link style={{ paddingRight: 10, textDecoration: params.locale === "ru" ? "underline" : "none" }} href={'/documents'} locale="ru">RU</Link>
        </div>
        <div className="info-block">
          <span className="info-block-item">{t("rendered", { amount: documentsAmount ? (documentsAmount > 0 ? coordintates.end - coordintates.start : 0) : "loading..."})}</span>
          <span className="info-block-item">{t("allDocuments", { amount: documentsAmount ? documentsAmount : "loading..."})}</span>
          <span className="info-block-item">{t("start", { start: coordintates.start })}</span>
          <span className="info-block-item">{t("end", { end: coordintates.end })}</span>
        </div>
        
      </div>
    )
}

export default function Page({ params }: PageProps) {
    const [isHeaderRendered, setHeaderRendered] = useState(false);
    const pageRef = useRef<HTMLDivElement>(null);
    const { topObserver, bottomObserver } = useIntersectionObservers(pageRef.current);

    useEffect(()=>{
        console.log(isHeaderRendered, "isHeaderRendered")
    },[isHeaderRendered])

    useEffect(()=>{
        console.log("aru pooping?")
    }, [])
  
    return (
        <div ref={pageRef} className="page">
            <TableStatHeader params={params} setHeaderRendered={setHeaderRendered}/>
            <div className="table-container">
            { isHeaderRendered && (
                <table className="table">
                <thead>
                    <TableHeader headers={headers} />
                </thead>
                <TableBody bottomObserver={bottomObserver} topObserver={topObserver} headers={headers} />
                </table>
            )
            }
        </div>
        </div>
    )
}


