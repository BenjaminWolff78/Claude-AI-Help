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
import { hentown } from "./hentown";
// "They Gave Away Free Hens and the Garbage Vanished": one village set (street, café, town hall, Luc's garden).
import { dentown } from "./dentown";
import { plaguetown } from "./plaguetown";
import { javaset } from "./javaset";
import { mexset } from "./mexset";
import { mailset } from "./mailset";
import { shoeset } from "./shoeset";
import { pigset } from "./pigset";
import { dripset } from "./dripset";
// "They Paid for Pig Tails and Got a Pig Farm": one connected Georgia set (the bounty shed + lot + field, the woods road, the hillside).
// "The Skull That Was Worth More in Pieces": one connected Java set (station, shed, village lane) + the riverbank.
// "He Made Dental Visits Longer and Got Cake": one street set (Hal's and Vance's offices, the street) + the lab room.
export const SET_BUILDERS: Record<string, SetBuilder> = { yard: brickyard, village, office, inn, library, hentown, dentown, plaguetown, javaset, mexset, mailset, shoeset, pigset, dripset };
void [city, backyard, ridge, skyline, boston, dock, storm, commons, loutown, grove, cellar];
