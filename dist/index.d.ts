import type { CSSProperties, ReactElement, ReactNode } from "react";

export type MaritesContactState = "idle" | "ok" | "error";
export type MaritesTopic = "concern" | "question" | "suggestion" | "issue" | "feedback";
export type MaritesListingCategory = "job_offer" | "room_rent" | "lending" | "meetup" | "tour" | "clothes" | "foods" | "sari_sari" | "service";

export type MaritesOption<T extends string = string> = {
  value: T;
  label: string;
};

export type MaritesPostJson = <T = unknown>(path: string, payload: Record<string, unknown>) => Promise<T>;

export type MaritesCityInputProps = {
  value: string;
  onChange: (value: string) => void;
  inputProps: {
    maxLength: number;
    placeholder: string;
  };
};

export type PalengkeMaritesBubbleProps = {
  apiBasePath?: string;
  className?: string;
  imageUrl?: string;
  initialView?: "support" | "wanted";
  onWantedPosted?: (post: unknown) => void;
  postJson?: MaritesPostJson;
  renderCityInput?: (props: MaritesCityInputProps) => ReactNode;
  style?: CSSProperties;
  supportPath?: string;
  topics?: Array<MaritesOption<MaritesTopic>>;
  wantedCategories?: Array<MaritesOption<MaritesListingCategory>>;
  wantedPath?: string;
};

export const DEFAULT_MARITES_IMAGE_URL: string;
export const MARITES_IDLE_HIDE_DELAY_MS: number;
export const defaultMaritesTopics: Array<MaritesOption<MaritesTopic>>;
export const defaultMaritesWantedCategories: Array<MaritesOption<MaritesListingCategory>>;

export function PalengkeMaritesBubble(props?: PalengkeMaritesBubbleProps): ReactElement | null;
export const AnonymousContactBubble: typeof PalengkeMaritesBubble;
export const MaritesBubble: typeof PalengkeMaritesBubble;
