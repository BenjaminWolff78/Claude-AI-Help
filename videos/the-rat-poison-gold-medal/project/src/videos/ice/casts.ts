// Approved cast kit (reuse in later videos). Warm costumes in cool scenes and vice versa; silhouettes by hat + colour.
import { Look } from "./fig";

export const CAST: Record<string, Look> = {
  // ===== THE MAN WHO SOLD THE EIFFEL TOWER (1925) =====
  // Victor Lustig, con man: charcoal fedora, pencil moustache, slate suit, wine waistcoat + gold watch chain, white collar
  lustig: { seed: 211, hat: "fedora", hatCol: "#2a2a38", band: "#7a2a3a", moustache: "#2a1d14", hair: "#2a1d14", hairStyle: "tufts",
    coat: "#47506e", lapel: "#343b55", vest: "#8a2f45", buttons: "#f3d36b", chain: true, collar: "#ffffff", legs: "#2a2c3a", build: "tall" },
  // André Poisson, scrap dealer: stout, brown flat cap, big ginger moustache, tweed coat, mustard waistcoat
  poisson: { seed: 223, hat: "flatcap", hatCol: "#6b4a2f", moustache: "#c26a2c", hair: "#c26a2c", hairStyle: "tufts",
    coat: "#8a5a32", lapel: "#6e4626", vest: "#e0b24a", buttons: "#5a3a1a", legs: "#3a2c24", build: "stout" },
  // Madame Poisson (the doubter): teal cloche with a yellow flower, teal dress, pearl collar
  mmePoisson: { seed: 229, hat: "cloche", hatCol: "#2f7f86", band: "#1f5a60", jewel: "#f2c230", coat: "#2f8a8a", dress: "#2f8a8a", collar: "#fbf3e3" },
  // the other scrap dealers
  dealer2: { seed: 233, hat: "tophat", hatCol: "#6d6f78", band: "#2c2a30", beard: "#d8d8d8", coat: "#3c3a48", vest: "#c9c2b4", buttons: "#e8c14a", build: "stout" },
  dealer3: { seed: 239, hat: "bowler", hatCol: "#6b4a2f", band: "#3b2a1a", moustache: "#3a2a1a", glasses: true, coat: "#5a6e3c", vest: "#e8dcc0" },
  dealer4: { seed: 241, hat: "bowler", hatCol: "#1f2230", monocle: true, moustache: "#8a8a8a", coat: "#7a2a2a", vest: "#f2ead8", chain: true, build: "tall" },
  // tower painters (rust), hotel waiter, gendarme, newsboy, Parisians, ministry clerks, modern car salesman
  painter1: { seed: 251, hat: "beret", hatCol: "#c8352e", coat: "#f2efe6", suspenders: "#5a7aa8", legs: "#5a7aa8" },
  painter2: { seed: 257, hat: "beret", hatCol: "#2f5d9a", moustache: "#5a3a24", coat: "#ece6d6", suspenders: "#c26a2c", legs: "#c26a2c" },
  waiter: { seed: 263, hair: "#1d1410", hairStyle: "short", coat: "#1f2230", vest: "#f4f1ea", collar: "#ffffff", apron: "#ffffff", moustache: "#1d1410" },
  gendarme: { seed: 269, hat: "kepi", hatCol: "#26386a", band: "#c9a227", moustache: "#2a1d14", coat: "#26386a", buttons: "#e8c14a", belt: "#f4f0e6", legs: "#b3262e" },
  newsboy: { seed: 271, hat: "flatcap", hatCol: "#4a4f57", coat: "#c26a2c", suspenders: "#3b2a1a", build: "kid" },
  paris1: { seed: 277, hat: "cloche", hatCol: "#c0476a", band: "#7a2a3a", jewel: "#ffffff", coat: "#c0476a", dress: "#c0476a" },
  paris2: { seed: 281, hat: "straw", hatCol: "#e6c27a", band: "#26386a", coat: "#e8dcc0", vest: "#26386a", buttons: "#f3d36b" },
  paris3: { seed: 283, hat: "bowler", hatCol: "#34303a", coat: "#2f6b4f", lapel: "#24543e", vest: "#e8dcc0", scarf: "#c8352e" },
  paris4: { seed: 293, hair: "#8a5a2b", hairStyle: "bun", coat: "#e8b04a", dress: "#e8b04a", collar: "#ffffff" },
  clerk1: { seed: 307, hair: "#3a2a1a", hairStyle: "short", glasses: true, coat: "#5a5e6e", vest: "#d9d2c2", collar: "#ffffff" },
  clerk2: { seed: 311, hair: "#d8d8d8", hairStyle: "tufts", moustache: "#d8d8d8", coat: "#4a4054", vest: "#c9a227", collar: "#ffffff", build: "stout" },
  clerk3: { seed: 331, hair: "#6a3a24", hairStyle: "bun", glasses: true, coat: "#3f5a6e", collar: "#ffffff", dress: "#3f5a6e" },
  mechanic: { seed: 337, hat: "flatcap", hatCol: "#2f4a7a", coat: "#3b5f9a", apron: "#2c3e64", collar: "#ffffff" },
  salesman: { seed: 313, hair: "#e8c14a", hairStyle: "cowlick", coat: "#ff7a3d", stripes: "#ffd166", collar: "#ffffff", build: "adult" },
  buyer: { seed: 317, hat: "flatcap", hatCol: "#2f7fd1", coat: "#3aa36a", collar: "#ffffff" },
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
  // ===== THE RAT POISON GOLD MEDAL (1904) =====
  // runners: singlet (sleeveless vest) + shorts + bare ink-noodle legs + light shoes + a pinned race bib
  // Thomas Hicks, the hero: white singlet, red chest stripe, maroon shorts, brown centre-parted hair + moustache, bib 20
  hicks: { seed: 401, coat: "#f6f3ec", singlet: "#f6f3ec", chestStripe: "#c8352e", shorts: "#7a2433", hair: "#7a4a24", hairStyle: "parted",
    moustache: "#6a3e1e", bib: "20", shoes: "#efe6d2" },
  hicksGold: { seed: 401, coat: "#f6f3ec", singlet: "#f6f3ec", chestStripe: "#c8352e", shorts: "#7a2433", hair: "#7a4a24", hairStyle: "parted",
    moustache: "#6a3e1e", bib: "20", shoes: "#efe6d2", medal: true },
  // his coach: dark bowler, round glasses, ginger moustache, grey-blue three-piece suit, watch chain
  coach: { seed: 409, hat: "bowler", hatCol: "#2a2733", band: "#4a4552", glasses: true, moustache: "#d0702e", hair: "#d0702e", hairStyle: "tufts",
    coat: "#5f7487", lapel: "#4a5c6c", vest: "#71879b", buttons: "#e8c14a", chain: true, collar: "#ffffff", legs: "#45535f" },
  // second handler: olive flat cap, white shirt with rolled sleeves, red braces, brown trousers
  helper: { seed: 419, hat: "flatcap", hatCol: "#5a6a3a", hair: "#3a2a1a", hairStyle: "tufts", coat: "#f4efe6", rolled: true, suspenders: "#a3262e",
    collar: "#ffffff", legs: "#7a5432", build: "adult" },
  // the race organizer: tall top hat, grey frock coat, grey mutton chops, cream waistcoat
  organizer: { seed: 421, hat: "tophat", hatCol: "#2b2733", band: "#5d5868", chops: "#c9c5bd", moustache: "#c9c5bd", hair: "#c9c5bd", hairStyle: "tufts",
    coat: "#7d7f88", lapel: "#62646c", vest: "#efe4c6", buttons: "#c9a227", chain: true, scarf: "#2e2a36", legs: "#3c3a44", build: "tall" },
  // the starter: straw boater, white blazer with green stripes, green bow tie
  starter: { seed: 431, hat: "straw", hatCol: "#e9cd86", band: "#2f6b4f", moustache: "#5a3a1a", coat: "#f6f2e6", vstripes: "#3f8a5a", lapel: "#e4ddcb",
    bowtie: "#2f6b4f", collar: "#ffffff", legs: "#e3dccb" },
  // the official in the car who yells: boater with a red band, red-and-white striped blazer, big black moustache, stout
  official: { seed: 433, hat: "straw", hatCol: "#e6c27a", band: "#c8352e", moustache: "#1d1410", hair: "#1d1410", hairStyle: "tufts",
    coat: "#f6f1e6", vstripes: "#c8352e", collar: "#ffffff", legs: "#3a3440", build: "stout" },
  // the motor-car driver: leather cap with goggles pushed up, long tan duster coat
  driver: { seed: 439, hat: "flatcap", hatCol: "#6a4428", goggles: true, coat: "#cfae76", lapel: "#b08f58", buttons: "#5a3a1a", collar: "#f4efe6",
    scarf: "#e8dcc0", legs: "#4a3a2a", boots: "#3a2416" },
  // dust runner: pale green singlet, navy shorts, white headband, bib 8
  dustRunner: { seed: 443, coat: "#a9d6a0", singlet: "#a9d6a0", shorts: "#26386a", hat: "headband", hatCol: "#f4efe4", hair: "#2a1d14", hairStyle: "short",
    bib: "8", shoes: "#efe6d2", socks: "#26386a" },
  // the Cuban mailman: postman's cap, white long-sleeve shirt, dark trousers cut into ragged shorts, braces, mailbag, bib 3
  mailman: { seed: 449, hat: "mailcap", hatCol: "#2c3550", moustache: "#1d1410", hair: "#1d1410", hairStyle: "short", coat: "#f6f3ec", collar: "#ffffff",
    suspenders: "#2c2a33", legs: "#3a3f52", ragged: true, mailbag: "#8a5a2c", bib: "3", shoes: "#5a3a22" },
  // the runner chased by the dog: orange singlet, dark shorts, bib 35
  dogRunner: { seed: 457, coat: "#f08a2c", singlet: "#f08a2c", shorts: "#2a2c3a", hair: "#e2b04e", hairStyle: "short", bib: "35", shoes: "#efe6d2" },
  // the car rider: navy singlet with a white sash, white shorts, cheeky cowlick, bib 31 (+ the laurel wreath he did not earn)
  lorz: { seed: 461, coat: "#24345e", singlet: "#24345e", sash: "#f6f3ec", shorts: "#f2eee4", hair: "#2a1d14", hairStyle: "curl", bib: "31", shoes: "#efe6d2" },
  lorzWreath: { seed: 461, coat: "#24345e", singlet: "#24345e", sash: "#f6f3ec", shorts: "#f2eee4", hair: "#2a1d14", hairStyle: "curl", bib: "31", shoes: "#efe6d2", hat: "laurel" },
  // the field
  runner1: { seed: 463, coat: "#e05a6a", singlet: "#e05a6a", shorts: "#26386a", hair: "#3a2a1a", hairStyle: "short", bib: "12", shoes: "#efe6d2" },
  runner2: { seed: 467, coat: "#3aa3a0", singlet: "#3aa3a0", shorts: "#f2eee4", hat: "headband", hatCol: "#c8352e", hair: "#1d1410", hairStyle: "short", bib: "7", shoes: "#efe6d2", build: "tall" },
  runner3: { seed: 487, coat: "#f2c230", singlet: "#f2c230", shorts: "#2a2c3a", moustache: "#2a1d14", hair: "#2a1d14", hairStyle: "parted", bib: "15", shoes: "#efe6d2", socks: "#2a2c3a" },
  runner4: { seed: 491, coat: "#8a6ad1", singlet: "#8a6ad1", shorts: "#5e6470", hat: "headband", hatCol: "#f2c230", hair: "#c8642a", hairStyle: "short", bib: "24", shoes: "#efe6d2" },
  runner5: { seed: 499, coat: "#3b6fa3", singlet: "#3b6fa3", chestStripe: "#f6f3ec", shorts: "#f2eee4", moustache: "#7a4a24", hair: "#7a4a24", hairStyle: "short", bib: "9", shoes: "#efe6d2", build: "stout" },
  runner6: { seed: 503, coat: "#c8352e", singlet: "#c8352e", shorts: "#f2eee4", hair: "#e8c860", hairStyle: "cowlick", bib: "41", shoes: "#efe6d2", socks: "#f2eee4" },
  // farm folk along the road
  farmer1: { seed: 509, hat: "straw", hatCol: "#e2c37a", band: "#8a5a2a", moustache: "#8a8a8a", hair: "#8a8a8a", hairStyle: "tufts", coat: "#c8463a",
    plaid: "rgba(70,20,24,0.32)", apron: "#3d5f8a", suspenders: "#3d5f8a", legs: "#3d5f8a", boots: "#4a3426", build: "stout" },
  farmer2: { seed: 521, hat: "straw", hatCol: "#cfa95e", band: "#3b2a1a", chops: "#6b4a2f", moustache: "#6b4a2f", coat: "#3e7a52", plaid: "rgba(240,232,200,0.3)",
    apron: "#7a8aa0", suspenders: "#7a8aa0", legs: "#7a8aa0", boots: "#4a3426", build: "tall" },
  farmKid: { seed: 523, hat: "straw", hatCol: "#e8cd8a", band: "#c8352e", hair: "#c8642a", hairStyle: "tufts", coat: "#5a8fd1", plaid: "rgba(255,255,255,0.28)",
    apron: "#3d5f8a", suspenders: "#3d5f8a", legs: "#3d5f8a", build: "kid" },
  // ladies with picture hats (parasol / parasol2 props)
  lady1: { seed: 541, hat: "picture", hatCol: "#f2ead8", band: "#5a7fc4", jewel: "#e05a7a", hair: "#7a4a24", hairStyle: "tufts", coat: "#8fb3e0", dress: "#8fb3e0", collar: "#ffffff" },
  lady2: { seed: 547, hat: "picture", hatCol: "#3a2a3c", band: "#c8a2e0", jewel: "#f2c230", hair: "#2a1d14", hairStyle: "tufts", coat: "#c76a8a", dress: "#c76a8a", collar: "#fbf3e3" },
  // spectators
  fan1: { seed: 557, hat: "bowler", hatCol: "#3a2a20", band: "#24180f", moustache: "#5a3a1a", coat: "#3c6e4c", lapel: "#2e573c", vest: "#e8dcc0", collar: "#ffffff" },
  fan2: { seed: 563, hat: "straw", hatCol: "#ecd28e", band: "#26386a", coat: "#e8dcc0", lapel: "#d6c9a8", vest: "#26386a", buttons: "#f3d36b", bowtie: "#c8352e", collar: "#ffffff" },
  fan3: { seed: 569, hat: "bowler", hatCol: "#6d6f78", band: "#2c2a30", glasses: true, coat: "#8a3b2f", lapel: "#6e2e24", vest: "#d9b46a", chain: true, collar: "#ffffff", build: "stout" },
  // the soda-fountain scene: pharmacist + the jittery coffee customer
  pharmacist: { seed: 571, hair: "#cfc8bc", hairStyle: "tufts", glasses: true, coat: "#f7f5ef", lapel: "#e6e2d8", vest: "#cfd6de", buttons: "#ffffff", bowtie: "#2f4fa0",
    collar: "#ffffff", legs: "#3a3440", build: "tall" },
  coffeeGuy: { seed: 577, hat: "bowler", hatCol: "#2e2a36", band: "#4a4552", hair: "#3a2a1a", hairStyle: "tufts", coat: "#4f6a8a", lapel: "#3e5470", vest: "#e9d9a8",
    vestCheck: "rgba(150,60,40,0.4)", buttons: "#5a3a1a", bowtie: "#c8352e", collar: "#ffffff", legs: "#3a3440" },
  // animals (species: drawn by creature() in fig.ts)
  dog: { seed: 587, species: "dog", coat: "#c39257", fur: "#c39257", patch: "#6e4a2a", collar: "#c8352e" },
  rat: { seed: 593, species: "rat", coat: "#8f8a98", fur: "#8f8a98" },
};
