import type { SetBuilder } from "./types";
import { valley } from "./valley";
import { palace } from "./palace";
import { hut } from "./hut";
// "Why He Wanted His Potatoes Stolen": valley (field on the hill + village market + pigsty + guard hut outside),
// palace (throne room, banquet hall, STAFF ONLY corridor), hut (the guard hut interior at night).
export const SET_BUILDERS: Record<string, SetBuilder> = { valley, palace, hut };
