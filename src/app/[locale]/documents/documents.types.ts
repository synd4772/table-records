export const DocumentFieldName = {
  id: "id",
  state: "state",
  stateTime: "stateTime",
  documentNumber: "documentNumber",
  documentName: "documentName",
  documentDate: "documentDate",
  documentTotalAmount: "documentTotalAmount",
  eligibleAmount: "eligibleAmount",
  version: "version",
  eligiblePercentage: "eligiblePercentage",
} as const;
export type DocumentFieldName = (typeof DocumentFieldName[keyof typeof DocumentFieldName])

export const HeaderName = {
  index: "index",
  select: "select",
  ...DocumentFieldName,
  actions: "actions"
} as const;

export type HeaderName = (typeof HeaderName[keyof typeof HeaderName])

export const DocumentState = {
  submitted: 'SUBMITTED',
  inProgress: 'IN_PROCESS',
  additionalReview: 'ADDITIONAL_REVIEW',
  reviewCompleted: 'REVIEW_COMPLETED',
  invalid: 'INVALID',
} as const;

export type DocumentState = typeof DocumentState[keyof typeof DocumentState];

export interface Document {
  id: number;
  state: DocumentState;
  documentNumber: string;
  documentName: string;
  documentDate: string;
  documentTotalAmount: number;
  stateTime: string;
  eligibleAmount: number;
  version: number;
  eligiblePercentage: number;
}

