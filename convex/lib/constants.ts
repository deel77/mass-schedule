export const EVENT_TYPES = ["holy-mass", "confession", "other"] as const;
export const DEFAULT_DAY_NAMES_SK = [
  "Pondelok",
  "Utorok",
  "Streda",
  "Stvrtok",
  "Piatok",
  "Sobota",
  "Nedela"
];

export type EventType = (typeof EVENT_TYPES)[number];
