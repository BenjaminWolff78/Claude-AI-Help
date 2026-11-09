import type { SetBuilder } from "./types";
import { city } from "./city";
import { backyard } from "./backyard";
import { ridge } from "./ridge";
import { skyline } from "./skyline";
import { boston } from "./boston";
import { dock } from "./dock";
import { storm } from "./storm";
import { commons } from "./commons";
import { loutown } from "./loutown";
// "They Blew Up Houses to Stop a Fire": city (London 1666: home base street, bakery end, wharf, cathedral, tavern),
// backyard (today: the domino demo on the patio table), road (today: the wildfire backburn).
export const SET_BUILDERS: Record<string, SetBuilder> = { city, backyard, ridge, skyline, boston, dock, storm, commons, loutown };
