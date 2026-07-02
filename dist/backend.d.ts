export type MaritesBackendOptions = {
  sourceLabel?: string;
  fetchImpl?: typeof fetch;
  palengkeApiUrl?: string;
  timeoutMs?: number;
};

export const defaultPalengkeApiUrl: string;
export function normalizeMaritesSupportPayload(payload?: Record<string, unknown>, options?: Pick<MaritesBackendOptions, "sourceLabel">): Record<string, unknown>;
export function normalizeMaritesWantedPayload(payload?: Record<string, unknown>, options?: Pick<MaritesBackendOptions, "sourceLabel">): Record<string, unknown>;
export function postToPalengkeApi<T = unknown>(path: string, payload: Record<string, unknown>, options?: MaritesBackendOptions): Promise<T>;
export function createSupportTicket<T = unknown>(payload: Record<string, unknown>, options?: MaritesBackendOptions): Promise<T>;
export function createWantedPost<T = unknown>(payload: Record<string, unknown>, options?: MaritesBackendOptions): Promise<T>;
