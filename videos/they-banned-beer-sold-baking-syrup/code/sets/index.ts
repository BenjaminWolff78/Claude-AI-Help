import type { SetBuilder } from "./types";
import { beer } from "./beer";
// "They Banned Beer, So He Sold It as Bread Syrup" (2026-11-27): one set file, four zones (brewery, grocery, Main Street + cellars).
export const SET_BUILDERS: Record<string, SetBuilder> = { beer };
