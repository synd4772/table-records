import { useMemo } from "react"
import allDocuments from "../../../../assets/document-list.mocked-data.json"
import { DateTime } from 'luxon';

export const DocumentState = {
    submitted: 'SUBMITTED',
    inProgress: 'IN_PROCESS',
    additionalReview: 'ADDITIONAL_REVIEW',
    reviewCompleted: 'REVIEW_COMPLETED',
    invalid: 'INVALID',
  } as const;

export type DocumentState = typeof DocumentState[keyof typeof DocumentState];

export interface DocumentGeneric<T> {
    index: number;
    id: number;
    state: DocumentState;
    stateTime: T;
    stateTimeMillis: number;
    documentNumber: string;
    documentName: string;
    documentDate: T;
    documentDateMillis:number;
    documentTotalAmount: number;
}

export const useDocumentData = () => {
    const data = useMemo(() => (allDocuments as DocumentGeneric<string>[]).map((item) => ({
        ...item,
        documentDate: DateTime.fromISO(item.documentDate).toFormat("dd.MM.yyyy"),
        documentDateMillis: DateTime.fromISO(item.documentDate).toMillis(),
        stateTime: DateTime.fromISO(item.stateTime).toFormat("dd.MM.yyyy hh:mm"),
        stateTimeMillis: DateTime.fromISO(item.stateTime).toMillis()
    })), [allDocuments])

    return [data]
}

// redux toolkit

