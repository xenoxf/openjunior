import type { Session } from '@opencode-ai/sdk/v2';

export type SessionMetadataRecord = Record<string, unknown>;

type GlenkerMetadata = {
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

const getGlenkerMetadata = (metadata: SessionMetadataRecord): GlenkerMetadata => {
  const value = metadata.glenker;
  return isRecord(value) ? value as GlenkerMetadata : {};
};

export const getReviewSessionID = (session: Session | null | undefined): string | null => {
  const value = getGlenkerMetadata(getSessionMetadata(session)).reviewSessionID;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const getOriginalSessionID = (session: Session | null | undefined): string | null => {
  const value = getGlenkerMetadata(getSessionMetadata(session)).originalSessionID;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const isReviewSession = (session: Session | null | undefined): boolean =>
  getGlenkerMetadata(getSessionMetadata(session)).kind === 'review' && Boolean(getOriginalSessionID(session));

export const withReviewSessionLink = (
  metadata: SessionMetadataRecord,
  reviewSessionID: string,
): SessionMetadataRecord => {
  const current = getGlenkerMetadata(metadata);
  return {
    ...metadata,
    glenker: {
      ...current,
      reviewSessionID,
    },
  };
};

export const withReviewSessionMarker = (
  metadata: SessionMetadataRecord,
  originalSessionID: string,
): SessionMetadataRecord => {
  const current = getGlenkerMetadata(metadata);
  return {
    ...metadata,
    glenker: {
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
  const current = getGlenkerMetadata(metadata);
  if (current.reviewSessionID !== reviewSessionID) return metadata;

  const restGlenker = { ...current };
  delete restGlenker.reviewSessionID;
  const next: SessionMetadataRecord = { ...metadata };
  if (Object.keys(restGlenker).length > 0) {
    next.glenker = restGlenker;
  } else {
    delete next.glenker;
  }
  return next;
};
