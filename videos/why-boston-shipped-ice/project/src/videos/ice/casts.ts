// Approved cast kit (reuse in later videos). Warm costumes in cool scenes and vice versa; silhouettes by hat + colour.
import { Look } from "./fig";

export const CAST: Record<string, Look> = {
  // Frederic Tudor: tall top hat with a red band, mustard tailcoat, cream striped waistcoat, red cravat, brown curls
  tudor: { seed: 3, hat: "tophat", hatCol: "#2b2733", band: "#b3262e", hair: "#7a4a24", hairStyle: "tufts",
    coat: "#d99a2b", lapel: "#a8681b", vest: "#f2e6c8", vestStripe: "rgba(170,60,40,0.3)", buttons: "#f3d36b", scarf: "#c8352e", legs: "#3a2c34", build: "tall" },
  tudorLab: { seed: 3, hat: "tophat", hatCol: "#2b2733", band: "#b3262e", hair: "#7a4a24", hairStyle: "tufts", goggles: true,
    coat: "#d99a2b", lapel: "#a8681b", vest: "#f2e6c8", buttons: "#f3d36b", scarf: "#c8352e", apron: "#e6d6b4", legs: "#3a2c34", build: "tall" },
  tudorKing: { seed: 3, hat: "crown", hair: "#7a4a24", hairStyle: "short",
    coat: "#d99a2b", lapel: "#a8681b", vest: "#f2e6c8", buttons: "#f3d36b", scarf: "#c8352e", cape: "#b3262e", legs: "#3a2c34", build: "tall" },
  // the newspaper man (doubter): bowler, round glasses, grey walrus moustache, plum waistcoat + watch chain
  gazette: { seed: 7, hat: "bowler", hatCol: "#34303a", band: "#5a5262", glasses: true, moustache: "#cfc8bc",
    coat: "#6a7f88", lapel: "#51636b", vest: "#7b3f73", buttons: "#e8c14a", chain: true, collar: "#ffffff", build: "stout" },
  banker: { seed: 11, hat: "tophat", hatCol: "#6d6f78", band: "#2c2a30", monocle: true, hair: "#d8d8d8", hairStyle: "tufts",
    coat: "#2f6b4f", lapel: "#245540", vest: "#e9e0c8", buttons: "#e8c14a", chain: true, collar: "#ffffff" },
  sailor1: { seed: 13, hat: "beanie", hatCol: "#c9302c", band: "#f4efe6", coat: "#f4efe6", stripes: "#24447a", scarf: "#e0a52b" },
  sailor2: { seed: 17, hat: "stripecap", hatCol: "#2f5d9a", band: "#e9e4da", moustache: "#5a3a24", coat: "#f4efe6", stripes: "#b0352b", belt: "#3b2a1a" },
  captain: { seed: 19, hat: "bicorne", hatCol: "#1f2b4a", band: "#e8c14a", beard: "#f1f1f1", coat: "#26386a", buttons: "#e8c14a", belt: "#f4f0e6", build: "stout" },
  guard: { seed: 23, hat: "tricorn", hatCol: "#2b2730", band: "#c9a227", moustache: "#3a2a1a", coat: "#7a2a2a", buttons: "#e8c14a", belt: "#f2ead8" },
  // Martinique
  marketWoman: { seed: 29, hat: "madras", hatCol: "#f2c230", dress: "#e8622c", apron: "#fff6e0", coat: "#e8622c" },
  islandMan: { seed: 31, hat: "straw", hatCol: "#e6c27a", band: "#b5282e", coat: "#f4f1ea", vest: "#2a8c7a", lapel: "#ddd6c8", belt: "#b5282e" },
  islandMan2: { seed: 41, hat: "straw", hatCol: "#d9b46a", band: "#2a6f9a", moustache: "#2a1d14", coat: "#fff3d6", stripes: "#e58a2a" },
  islandKid: { seed: 37, hair: "#2a1d14", hairStyle: "cowlick", coat: "#3aa36a", suspenders: "#6b3f1f", build: "kid" },
  // sawmill
  mill1: { seed: 43, hat: "flatcap", hatCol: "#6b4a2f", moustache: "#5a3a1a", coat: "#c23b2f", suspenders: "#3b2a1a" },
  mill2: { seed: 47, hat: "beanie", hatCol: "#3d6e9e", band: "#2b4f75", coat: "#d98a2b", suspenders: "#2b2b2b" },
  // modern beach kid (the cooler gag)
  beachKid: { seed: 53, hat: "flatcap", hatCol: "#2f7fd1", shades: true, coat: "#ff7a3d", stripes: "#ffd166", build: "kid" },
  // Calcutta
  cal1: { seed: 59, hat: "turban", hatCol: "#f39a1e", jewel: "#d9342b", moustache: "#1d1410", coat: "#f6f2ea", kurta: true, sash: "#c8352e" },
  cal2: { seed: 61, hat: "turban", hatCol: "#f4f1ea", coat: "#3c7fc4", kurta: true },
  cal3: { seed: 67, hair: "#1d1410", hairStyle: "bun", coat: "#d6336c", dress: "#d6336c", drape: "#f2a33a" },
  cal4: { seed: 71, hair: "#1d1410", hairStyle: "topknot", coat: "#f2d13a", kurta: true, build: "kid" },
  cal5: { seed: 73, hat: "turban", hatCol: "#c8352e", beard: "#2a2420", coat: "#e7e0cf", kurta: true, sash: "#2f6b4f" },
  cal6: { seed: 79, hat: "turban", hatCol: "#2f9a6b", moustache: "#1d1410", coat: "#f28c3a", kurta: true },
  // Boston crowd
  bos1: { seed: 83, hat: "bonnet", hatCol: "#e9dcc0", band: "#b3262e", coat: "#3b6fa3", dress: "#3b6fa3", apron: "#f4ecd8" },
  bos2: { seed: 89, hat: "tricorn", hatCol: "#3a2a20", band: "#d9c8a0", coat: "#8a3b2f", lapel: "#6e2e24", vest: "#e8dcc0", scarf: "#2f5d9a" },
  bos3: { seed: 97, hat: "flatcap", hatCol: "#4a4f57", coat: "#3c6e4c", lapel: "#2e573c", vest: "#d9b46a", collar: "#ffffff" },
  bos4: { seed: 101, hair: "#8a5a2b", hairStyle: "bun", coat: "#c0476a", dress: "#c0476a", apron: "#fbf3e3" },
};
