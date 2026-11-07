import type { SetBuilder } from "./types";
import { crashhall } from "./crashhall";
import { works } from "./works";
import { showroom } from "./showroom";
import { backyard } from "./backyard";
import { street } from "./street";
// "He Made Cars Easier to Crush, and It Saved Lives": crashhall (home base), works, showroom (+ street outside), backyard, street (today).
export const SET_BUILDERS: Record<string, SetBuilder> = { crashhall, works, showroom, backyard, street };
