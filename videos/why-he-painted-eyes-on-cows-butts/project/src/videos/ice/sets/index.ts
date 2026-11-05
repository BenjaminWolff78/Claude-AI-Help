import type { SetBuilder } from "./types";
import { savanna } from "./savanna";
import { kitchen } from "./kitchen";
// "Why He Painted Eyes on Cows' Butts": savanna (kraal home base, huts, river, tall grass, payoff plain), kitchen (cookie jar).
export const SET_BUILDERS: Record<string, SetBuilder> = { savanna, kitchen };
