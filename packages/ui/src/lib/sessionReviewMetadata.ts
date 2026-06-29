import type { Session } from '@opencode-ai/sdk/v2';

export type SessionMetadataRecord = Record<string, unknown>;

type OpenJuniorMetadata = {
  kind?: 'review';
  originalSessionID?: string;
  reviewSessionID?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

export const getSessionMetadata = (session: Session | null | undefined): SessionMetadataRecord => {
  const metadata = (session as (Session & { metadata?: unknown }) | null | undefined)?.metadata;
  return isRecord(metadata) ? metadata : {};
};

const getOpenJuniorMetadata = (metadata: SessionMetadataRecord): OpenJuniorMetadata => {
  const value = metadata.openjunior;
  return isRecord(value) ? value as OpenJuniorMetadata : {};
};

export const getReviewSessionID = (session: Session | null | undefined): string | null => {
  const value = getOpenJuniorMetadata(getSessionMetadata(session)).reviewSessionID;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const getOriginalSessionID = (session: Session | null | undefined): string | null => {
  const value = getOpenJuniorMetadata(getSessionMetadata(session)).originalSessionID;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const isReviewSession = (session: Session | null | undefined): boolean =>
  getOpenJuniorMetadata(getSessionMetadata(session)).kind === 'review' && Boolean(getOriginalSessionID(session));

export const withReviewSessionLink = (
  metadata: SessionMetadataRecord,
  reviewSessionID: string,
): SessionMetadataRecord => {
  const current = getOpenJuniorMetadata(metadata);
  return {
    ...metadata,
    openjunior: {
      ...current,
      reviewSessionID,
    },
  };
};

export const withReviewSessionMarker = (
  metadata: SessionMetadataRecord,
  originalSessionID: string,
): SessionMetadataRecord => {
  const current = getOpenJuniorMetadata(metadata);
  return {
    ...metadata,
    openjunior: {
      ...current,
      kind: 'review' as const,
      originalSessionID,
    },
  };
};

export const withoutReviewSessionLink = (
  metadata: SessionMetadataRecord,
  reviewSessionID: string,
): SessionMetadataRecord => {
  const current = getOpenJuniorMetadata(metadata);
  if (current.reviewSessionID !== reviewSessionID) return metadata;

  const restOpenJunior = { ...current };
  delete restOpenJunior.reviewSessionID;
  const next: SessionMetadataRecord = { ...metadata };
  if (Object.keys(restOpenJunior).length > 0) {
    next.openjunior = restOpenJunior;
  } else {
    delete next.openjunior;
  }
  return next;
};
