import type { SetBuilder } from "./types";
import { city } from "./city";
import { backyard } from "./backyard";
import { ridge } from "./ridge";
import { skyline } from "./skyline";
// "They Blew Up Houses to Stop a Fire": city (London 1666: home base street, bakery end, wharf, cathedral, tavern),
// backyard (today: the domino demo on the patio table), road (today: the wildfire backburn).
export const SET_BUILDERS: Record<string, SetBuilder> = { city, backyard, ridge, skyline };
