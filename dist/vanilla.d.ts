export const DEFAULT_MARITES_IMAGE_URL: string;
export const MARITES_IDLE_HIDE_DELAY_MS: number;

export type VanillaMaritesInstance = {
  close: () => void;
  destroy: () => void;
  element: HTMLElement;
  open: () => void;
};

export type VanillaMaritesOptions = {
  apiBasePath?: string;
  container?: HTMLElement;
  imageUrl?: string;
  postJson?: <T = unknown>(path: string, payload: Record<string, unknown>) => Promise<T>;
  supportPath?: string;
  wantedPath?: string;
};

export function mountPalengkeMarites(options?: VanillaMaritesOptions): VanillaMaritesInstance | null;
