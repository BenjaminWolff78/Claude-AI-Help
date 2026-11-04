import type { SetBuilder } from "./types";
import { desert } from "./desert";
import { london } from "./london";
import { worldmap } from "./worldmap";
// "Why He Put a Bridge in the Desert": the builders register desert, london and worldmap here (drugstore = the
// quality reference from the last video; it is dropped at merge).
export const SET_BUILDERS: Record<string, SetBuilder> = { desert, london, worldmap };
