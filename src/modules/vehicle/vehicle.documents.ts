import { DocumentType } from '@prisma/client';

/** Multer field names = Prisma `DocumentType` values — one optional file per type. */
export const VEHICLE_DOCUMENT_FIELD_NAMES = Object.values(DocumentType) as DocumentType[];
