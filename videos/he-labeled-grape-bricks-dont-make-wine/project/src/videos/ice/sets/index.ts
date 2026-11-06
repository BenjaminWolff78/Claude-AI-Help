import type { SetBuilder } from "./types";
import { road } from "./road";
import { kitchen } from "./kitchen";
import { office } from "./office";
// "He Labeled Grape Bricks 'Don't Make Wine'": vineyard (the 1904 farm road set, VINE variant: Brick Boy's press yard, Hank's
// vines across the road), kitchen (the warning + the explanation + the cake mix), office (the Washington cut-in).
export const SET_BUILDERS: Record<string, SetBuilder> = { vineyard: () => road({ vine: true }), kitchen, office };
