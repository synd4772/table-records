'use client'
import { EventEmitter } from "@/app/utils/EventEmitter";
import { clientEvents } from "../[locale]/documents/documents.types";

export const documentEventEmitter = new EventEmitter();