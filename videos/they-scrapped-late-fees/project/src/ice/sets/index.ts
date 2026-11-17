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
import { grove } from "./grove";
import { cellar } from "./cellar";
// "He Covered His Oranges in Ice": the two groves (home base) + the root cellar. Older sets stay importable.
import { brickyard } from "./brickyard";
import { village } from "./village";
import { office, inn } from "./rooms";
// "He Made Giant Bricks to Pay Half the Tax": the brickyard (home base + the shed), the village (street, Ned's plot,
// Church Lane), the excise office, the inn. Older sets stay importable.
import { library } from "./library";
// "They Scrapped Late Fees and Got a Truckload of Books Back": one connected set (street, library, inside, Dwayne's flat).
export const SET_BUILDERS: Record<string, SetBuilder> = { yard: brickyard, village, office, inn, library };
void [city, backyard, ridge, skyline, boston, dock, storm, commons, loutown, grove, cellar];
