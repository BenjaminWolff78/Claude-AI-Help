import type { SetBuilder } from "./types";
import { studio } from "./studio";
import { court } from "./court";
import { mine } from "./mine";
import { museum, hall } from "./museum";
// "He Saved His Life by Proving His Masterpiece Was Fake": studio (home base B), court (home base A), mine, museum, hall.
export const SET_BUILDERS: Record<string, SetBuilder> = { studio, court, mine, museum, hall };
