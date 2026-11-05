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

  // ===== WHY HE PUT A BRIDGE IN THE DESERT (1968) =====  accent #22C7E0 (turquoise) is the boss's alone
  // the boss (~60, stout developer): white straw cowboy hat with a turquoise band, powder-blue suit, bolo tie with a
  // turquoise stone, neat grey moustache + sideburns, a watch, white pocket square, brown cowboy boots
  boss: { seed: 601, hat: "cowboy", hatCol: "#f8f2e0", band: "#22C7E0", hair: "#c4c0b8", hairStyle: "tufts", sideburns: "#c4c0b8", moustache: "#c9c5bd", moStyle: "neat",
    coat: "#a8c6ea", lapel: "#93b4dc", lapels: true, collar: "#ffffff", bolo: "#22C7E0", pocketSq: "#ffffff", watch: true, buttons: "#e8ecf2", legs: "#87a7cf", boots: "#7a4a2a", build: "stout" },
  // the real-estate agent (young, thin): big round glasses, red bow tie, short-sleeve white shirt, pocket protector, pencil
  agent: { seed: 607, hair: "#b8622c", hairStyle: "parted", glasses: true, bigGlasses: true, bowtie: "#d62e2e", coat: "#f7f5ef", collar: "#ffffff", shortSleeve: true,
    pocketPro: "#d6eef8", pencilEar: true, buttons: "#d9d4c8", legs: "#6b4a32", boots: "#3a2416", build: "thin" },
  // salesman A (plump): mint short-sleeve shirt, loosened red/yellow striped tie, big sweat patches, flying sweat
  salesA: { seed: 613, hair: "#6b4a2f", hairStyle: "tufts", moustache: "#6b4a2f", coat: "#a6e0bd", collar: "#ffffff", shortSleeve: true, sweaty: true,
    tie: "#d23a30", tieStripe: "#f2c230", tieLoose: true, legs: "#7a5a3a", boots: "#3a2416", build: "plump" },
  // salesman B (tall, thin): loud teal plaid sport coat, slicked black hair, pencil moustache, white shirt, yellow tie
  salesB: { seed: 617, hair: "#22202a", hairStyle: "slick", moustache: "#22202a", coat: "#2f8f78", plaid: "rgba(255,190,60,0.5)", lapel: "#24725f",
    lapels: true, buttons: "#f2c230", collar: "#ffffff", tie: "#f2c230", legs: "#5a4636", boots: "#2a1d14", build: "lanky" },
  // bulldozer driver: orange hard hat, red/black plaid shirt, tan work gloves, jeans
  dozer: { seed: 619, hat: "hardhat", hatCol: "#f08a2c", hair: "#5a3a1e", hairStyle: "tufts", moustache: "#5a3a1e", moStyle: "walrus", coat: "#c8352e", plaid: "rgba(30,18,30,0.42)",
    rolled: true, gloves: "#d9b46a", collar: "#c8352e", legs: "#3d5f8a", boots: "#5a3a22", build: "stout" },
  // desert construction crew (worker3 = the crane operator)
  worker1: { seed: 631, hat: "hardhat", hatCol: "#f2c230", hair: "#2a1d14", hairStyle: "tufts", coat: "#5a86c4", collar: "#4a74b0", buttons: "#f4f1ea", rolled: true,
    toolbelt: "#8a5a32", legs: "#c9b27a", boots: "#5a3a22", build: "stout" },
  worker2: { seed: 641, hat: "hardhat", hatCol: "#f4f1ea", hair: "#7a4a24", hairStyle: "tufts", moustache: "#7a4a24", coat: "#6f8a3e", collar: "#5e7834", rolled: true,
    toolbelt: "#6b4a2f", legs: "#3d5f8a", boots: "#4a3426", build: "tall" },
  worker3: { seed: 643, hat: "hardhat", hatCol: "#f2c230", hair: "#c8642a", hairStyle: "tufts", shades: true, coat: "#f4f1ea", shortSleeve: true, apron: "#2f6fc8", suspenders: "#2f6fc8",
    legs: "#2f6fc8", boots: "#4a3426", gloves: "#c99a5a" },
  worker4: { seed: 647, hat: "hardhat", hatCol: "#f4f1ea", hair: "#2a1d14", hairStyle: "tufts", coat: "#8fb0d8", rolled: true, scarf: "#d23a30", toolbelt: "#8a5a32",
    legs: "#2c4f7a", boots: "#4a3426", build: "thin" },
  // London city official: black bowler, charcoal pinstripe suit, monocle on a cord (FigOpts.monoclePop), ginger handlebar
  // moustache, red carnation, rolled umbrella (propR "umbrella")
  cityman: { seed: 653, hat: "bowler", hatCol: "#26242c", band: "#3a3844", monocle: true, monoCord: true, moustache: "#d0702e", moStyle: "handlebar", hair: "#d0702e", hairStyle: "tufts",
    coat: "#8c6a54", vstripes: "rgba(255,236,210,0.26)", lapel: "#6c5040", vest: "#d0a24e", buttons: "#c9ced6", chain: true, collar: "#ffffff", tie: "#8a2638",
    carnation: "#d8283a", legs: "#5e4c44", boots: "#1e1c26", build: "tall" },
  // bridge inspector: tweed flat cap, olive tweed waistcoat, rolled white sleeves, round glasses (holds propR "ruler")
  inspector: { seed: 659, hat: "flatcap", hatCol: "#8a6a44", hair: "#a8a29a", hairStyle: "tufts", glasses: true, moustache: "#8a7a64", coat: "#f4efe6", rolled: true, collar: "#ffffff",
    vest: "#7a7a48", vestCheck: "rgba(150,60,40,0.35)", lapel: "#6a6a3c", buttons: "#5a3a1a", bowtie: "#a3262e", legs: "#6b5640", boots: "#3a2416" },
  // London bobby: custodian helmet, navy tunic, silver buttons, collar badges + whistle chain, black belt
  bobby: { seed: 661, hat: "custodian", hatCol: "#3f5aa6", coat: "#3f5aa6", buttons: "#e3e7ec", police: true, belt: "#1e1c26", legs: "#38467a", boots: "#1e1c26",
    moustache: "#3a2a1a", build: "tall" },
  // London lady: red polka-dot headscarf, tan belted raincoat, handbag (propR "purse")
  lady: { seed: 673, hat: "headscarf", hatCol: "#d23a46", band: "#fbf3e3", coat: "#d9b46a", dress: "#d9b46a", belt: "#a8823e", collar: "#e8cf8e", buttons: "#7a5426",
    legs: "#3a3440", boots: "#5a3a22" },
  // 1960s mod girl: black bob, orange A-line mini dress, white go-go boots
  mod: { seed: 677, hair: "#1f1d26", hairStyle: "bob", coat: "#f26a1b", dress: "#f26a1b", mini: true, collar: "#ffffff", tallBoots: "#f6f3ec", boots: "#f6f3ec", build: "thin" },
  // city gent: green trilby, brown tweed suit, grey moustache (propR "newspaper" or "bridgePaper", propL "umbrella")
  gent: { seed: 683, hat: "trilby", hatCol: "#3f5a46", band: "#26342a", jewel: "#d9b46a", moustache: "#bdb8ae", hair: "#bdb8ae", hairStyle: "tufts", coat: "#7a6048", plaid: "rgba(40,30,20,0.18)",
    lapel: "#654e3a", vest: "#e8dcc0", buttons: "#5a3a1a", collar: "#ffffff", tie: "#2f4fa0", legs: "#4a3a2e", boots: "#2a1d14" },
  // London bus driver (sits): peaked cap, green-grey jacket, white shirt, black tie
  busDriver: { seed: 691, hat: "mailcap", hatCol: "#2f5a3e", band: "#1e3a28", hair: "#3a2a1a", hairStyle: "tufts", moustache: "#3a2a1a", coat: "#4a7a5e", lapel: "#3a6650",
    collar: "#ffffff", tie: "#26242c", buttons: "#e8c14a", legs: "#2c3a30", build: "stout" },
  // London dismantling crew: donkey jackets with leather shoulder yokes (londoner3 carries paintPot + paintBrush)
  londoner1: { seed: 701, hat: "flatcap", hatCol: "#34323c", hair: "#2a1d14", hairStyle: "tufts", coat: "#2c3a66", patches: "#a87444", scarf: "#d23a30", buttons: "#1e1c26",
    legs: "#3a3440", boots: "#2a1d14" },
  londoner2: { seed: 709, hat: "hardhat", hatCol: "#f4f1ea", hair: "#c8642a", hairStyle: "tufts", moustache: "#c8642a", coat: "#35383f", patches: "#9a6a3e", scarf: "#f2c230",
    buttons: "#1e1c26", legs: "#2c3a66", boots: "#2a1d14", build: "stout" },
  londoner3: { seed: 719, hat: "flatcap", hatCol: "#6b4a2f", hair: "#3a2a1a", hairStyle: "tufts", coat: "#2f5a46", patches: "#a87444", scarf: "#f4f1ea", splats: true,
    buttons: "#1e1c26", legs: "#4a4a54", boots: "#2a1d14", build: "thin" },
  // the visiting family (all work in mode "sit" for the car seats)
  dad: { seed: 727, hat: "sunhat", hatCol: "#e9d7a0", band: "#2f6fc8", hair: "#5a3a1e", hairStyle: "tufts", coat: "#2f6fc8", hawaii: "#f8f2e0", collar: "#2f6fc8", camStrap: true,
    shorts: "#e3cf9e", socks: "#fbf8ef", shoes: "#7a4a2a", build: "stout" },
  mom: { seed: 733, hat: "headscarf", hatCol: "#e0508a", band: "#fbf3e3", catEye: "#f4f1ea", coat: "#7fd0bc", collar: "#ffffff", capri: "#2d3c78", boots: "#f4f1ea", build: "thin" },
  kidBoy: { seed: 739, hat: "baseball", hatCol: "#2f6fc8", jewel: "#f4f1ea", hair: "#7a4a24", hairStyle: "tufts", coat: "#f6f3ec", stripes: "#d23a30", shorts: "#3d5f8a", socks: "#fbf8ef",
    shoes: "#d23a30", build: "kid" },
  kidGirl: { seed: 743, hair: "#8a5a2b", hairStyle: "pigtails", bow: "#ffffff", coat: "#f28bb0", dress: "#f28bb0", hawaii: "#ffffff", collar: "#ffffff", shoes: "#f6f3ec", build: "kid" },
  // payoff tourists, the boater, the sign painter
  tourist1: { seed: 751, hat: "sunhat", hatCol: "#f6f2e6", band: "#d23a30", hair: "#2a1d14", hairStyle: "tufts", shades: true, coat: "#3aa36a", collar: "#ffffff", shortSleeve: true,
    camStrap: true, shorts: "#f2eee4", socks: "#fbf8ef", shoes: "#5a3a22" },
  tourist2: { seed: 757, hat: "bucket", hatCol: "#f2c230", band: "#d23a30", hair: "#c8642a", hairStyle: "tufts", coat: "#8a5ad1", dress: "#8a5ad1", hawaii: "#f6f2e6", collar: "#ffffff",
    shoes: "#f6f3ec", build: "plump" },
  tourist3: { seed: 761, hat: "baseball", hatCol: "#d23a30", jewel: "#f2c230", hair: "#e2b04e", hairStyle: "tufts", coat: "#f2c230", collar: "#f2c230", shortSleeve: true,
    shorts: "#2f6fc8", shoes: "#f6f3ec", build: "kid" },
  tourist4: { seed: 769, hat: "straw", hatCol: "#ead08e", band: "#2f6fc8", moustache: "#d8d8d8", hair: "#d8d8d8", hairStyle: "tufts", glasses: true, coat: "#e8622c", hawaii: "#f2c230",
    collar: "#e8622c", shorts: "#3a4a6a", socks: "#fbf8ef", shoes: "#7a4a2a", build: "stout" },
  boater: { seed: 773, hat: "mailcap", hatCol: "#f6f3ec", band: "#26386a", hair: "#7a7468", hairStyle: "tufts", beard: "#e8e4dc", coat: "#f6f3ec", stripes: "#26386a",
    scarf: "#d23a30", legs: "#26386a", build: "stout" },
  painter: { seed: 787, hat: "baseball", hatCol: "#f6f3ec", band: "#d23a30", hair: "#3a2a1a", hairStyle: "tufts", coat: "#f2efe6", apron: "#f8f6ef", suspenders: "#e6e1d4",
    splats: true, collar: "#f2efe6", legs: "#ece8dc", boots: "#5a3a22", rolled: true },
  // animals
  lizard: { seed: 797, species: "lizard", coat: "#7fb069", fur: "#7fb069", patch: "#4a7a3a" },
  duck: { seed: 809, species: "duck", coat: "#c9c5c0", fur: "#c9c5c0", patch: "#2f8a5a" },
  pigeon: { seed: 811, species: "pigeon", coat: "#9aa0b4", fur: "#9aa0b4" },
  // ===== WHY HE WANTED HIS POTATOES STOLEN (1780s France) =====
  // the pharmacist (hero): tall black tricorn with a violet band, white powdered curls, round glasses, bottle-green long
  // coat, cream waistcoat with brass buttons, white cravat, leather satchel across the body
  parm: { seed: 821, hat: "tricorn", hatCol: "#2b2733", band: "#8e5be8", hair: "#efe9df", hairStyle: "curl", glasses: true,
    coat: "#2f7a54", lapel: "#235f41", vest: "#f2e6c8", buttons: "#e8c14a", scarf: "#fbf8f1", mailbag: "#8a5a32", legs: "#3a2e2a", boots: "#2a1d14", build: "tall" },
  // ... with the coat thrown open on the old striped prison shirt (scene 2 reveal)
  parmPrison: { seed: 821, hat: "tricorn", hatCol: "#2b2733", band: "#8e5be8", hair: "#efe9df", hairStyle: "curl", glasses: true,
    coat: "#f4f1ea", stripes: "#4a4f6e", collar: "#f4f1ea", lapel: "#2f7a54", mailbag: "#8a5a32", legs: "#3a2e2a", boots: "#2a1d14", build: "tall" },
  // ... at the payoff: a potato flower in the buttonhole
  parmFlower: { seed: 821, hat: "tricorn", hatCol: "#2b2733", band: "#8e5be8", hair: "#efe9df", hairStyle: "curl", glasses: true, carnation: "#c9b4f6",
    coat: "#2f7a54", lapel: "#235f41", vest: "#f2e6c8", buttons: "#e8c14a", scarf: "#fbf8f1", mailbag: "#8a5a32", legs: "#3a2e2a", boots: "#2a1d14", build: "tall" },
  // the big farmer (the first doubter, later a secret thief): straw hat, brown beard, red neckerchief, blue smock, stout
  farmer: { seed: 827, hat: "straw", hatCol: "#e2c06a", band: "#b3262e", hair: "#6b4426", hairStyle: "tufts", beard: "#6b4426", scarf: "#d23a30",
    coat: "#3f6fb0", collar: "#3f6fb0", buttons: "#f4f1ea", belt: "#6b4a2f", legs: "#7a5a3a", boots: "#4a3426", build: "stout", rolled: true },
  // villagers
  vil1: { seed: 829, hat: "bonnet", hatCol: "#f4ecd8", band: "#d8508a", coat: "#d8508a", dress: "#d8508a", apron: "#fbf6e8", collar: "#fbf6e8" },
  vil2: { seed: 839, hat: "beret", hatCol: "#3a4a8a", hair: "#bdb8ae", hairStyle: "tufts", moustache: "#bdb8ae", coat: "#c9862e", vest: "#7a2a2a", legs: "#4a3a2e", boots: "#2a1d14", build: "thin" },
  vil3: { seed: 853, hat: "beret", hatCol: "#f4f1ea", hair: "#2a1d14", hairStyle: "tufts", moustache: "#2a1d14", coat: "#fbf8f1", apron: "#f4ecd8", scarf: "#3a8a5a", legs: "#5a4a3a", boots: "#2a1d14", build: "plump" },
  vil4: { seed: 857, hat: "straw", hatCol: "#ecd28e", band: "#2f6fc8", hair: "#c8642a", hairStyle: "tufts", coat: "#e86a3a", stripes: "#fbf3e3", shorts: "#4a6a9a", socks: "#fbf8ef", shoes: "#6b4426", build: "kid" },
  vil5: { seed: 863, hat: "headscarf", hatCol: "#2f9a8a", band: "#fbf3e3", coat: "#8a5ad1", dress: "#8a5ad1", apron: "#f2e8d2", collar: "#fbf3e3", build: "plump" },
  farmer2: { seed: 869, hat: "flatcap", hatCol: "#6b4a2f", hair: "#3a2a1a", hairStyle: "tufts", coat: "#7aa04a", vest: "#e8d6a8", scarf: "#e8c14a", legs: "#5a4a3a", boots: "#3a2a1a" },
  farmer3: { seed: 877, hat: "straw", hatCol: "#d8b860", hair: "#d8d8d8", hairStyle: "tufts", beard: "#e8e4dc", coat: "#a8462e", collar: "#f4f1ea", legs: "#3a4a6a", boots: "#3a2a1a", build: "thin" },
  // the royal guard on the field: sergeant + 6 soldiers (black tricorns, royal-blue coats, red lapels, white cross-belts)
  sergeant: { seed: 881, hat: "tricorn", hatCol: "#26242c", band: "#f4f1ea", hair: "#efe9df", hairStyle: "curl", moustache: "#3a2a1a", moStyle: "handlebar",
    coat: "#2f4fa0", lapel: "#c8352e", vest: "#f4f1ea", buttons: "#e8c14a", sash: "#f4f1ea", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14", build: "tall" },
  sol1: { seed: 883, hat: "tricorn", hatCol: "#26242c", band: "#f4f1ea", hair: "#efe9df", hairStyle: "curl", coat: "#2f4fa0", lapel: "#c8352e", buttons: "#e8c14a", sash: "#f4f1ea", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14" },
  sol2: { seed: 887, hat: "tricorn", hatCol: "#26242c", band: "#f4f1ea", hair: "#efe9df", hairStyle: "curl", moustache: "#6b4426", coat: "#2f4fa0", lapel: "#c8352e", buttons: "#e8c14a", sash: "#f4f1ea", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14", build: "stout" },
  sol3: { seed: 893, hat: "tricorn", hatCol: "#26242c", band: "#f4f1ea", hair: "#efe9df", hairStyle: "curl", coat: "#2f4fa0", lapel: "#c8352e", buttons: "#e8c14a", sash: "#f4f1ea", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14", build: "thin" },
  sol4: { seed: 907, hat: "tricorn", hatCol: "#26242c", band: "#f4f1ea", hair: "#efe9df", hairStyle: "curl", moustache: "#2a1d14", coat: "#2f4fa0", lapel: "#c8352e", buttons: "#e8c14a", sash: "#f4f1ea", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14" },
  sol5: { seed: 911, hat: "tricorn", hatCol: "#26242c", band: "#f4f1ea", hair: "#efe9df", hairStyle: "curl", coat: "#2f4fa0", lapel: "#c8352e", buttons: "#e8c14a", sash: "#f4f1ea", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14", build: "plump" },
  sol6: { seed: 919, hat: "tricorn", hatCol: "#26242c", band: "#f4f1ea", hair: "#efe9df", hairStyle: "curl", glasses: true, coat: "#2f4fa0", lapel: "#c8352e", buttons: "#e8c14a", sash: "#f4f1ea", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14", build: "tall" },
  // the king: gold crown on white powdered curls, sky-blue silk coat, gold buttons, royal-blue sash, red velvet cape; stout
  king: { seed: 929, hat: "crown", hair: "#f1ede4", hairStyle: "curl", coat: "#7fb0e8", lapel: "#5a8ad0", vest: "#f2e6c8", buttons: "#e8c14a", sash: "#2f4fa0", scarf: "#fbf8f1",
    cape: "#b3262e", legs: "#f2ecdc", boots: "#3a2a4a", build: "stout" },
  kingFlower: { seed: 929, hat: "crown", hair: "#f1ede4", hairStyle: "curl", coat: "#7fb0e8", lapel: "#5a8ad0", vest: "#f2e6c8", buttons: "#e8c14a", sash: "#2f4fa0", scarf: "#fbf8f1",
    cape: "#b3262e", legs: "#f2ecdc", boots: "#3a2a4a", build: "stout", carnation: "#c9b4f6" },
  // palace guards (red coats, gold, bicornes)
  pguard1: { seed: 937, hat: "bicorne", hatCol: "#26242c", band: "#e8c14a", hair: "#efe9df", hairStyle: "curl", moustache: "#3a2a1a", coat: "#b3262e", lapel: "#2f4fa0", buttons: "#e8c14a", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14", build: "tall" },
  pguard2: { seed: 941, hat: "bicorne", hatCol: "#26242c", band: "#e8c14a", hair: "#efe9df", hairStyle: "curl", coat: "#b3262e", lapel: "#2f4fa0", buttons: "#e8c14a", belt: "#f4f1ea", legs: "#f2ecdc", boots: "#2a1d14", build: "stout" },
  // nobles at the payoff + the STAFF ONLY lady
  noble1: { seed: 947, hat: "tricorn", hatCol: "#f4f1ea", band: "#e8c14a", hair: "#f1ede4", hairStyle: "curl", monocle: true, coat: "#b48ad8", lapel: "#9468c0", vest: "#fbf3e3", buttons: "#e8c14a", scarf: "#fbf8f1", legs: "#f2ecdc", boots: "#3a2a4a", build: "thin" },
  noble2: { seed: 953, hair: "#f1ede4", hairStyle: "curl", coat: "#5ec4a0", lapel: "#3ea482", vest: "#f2e6c8", buttons: "#e8c14a", scarf: "#fbf8f1", legs: "#f2ecdc", boots: "#3a2a4a", build: "plump" },
  noble3: { seed: 967, hair: "#f6e2a8", hairStyle: "bun", bow: "#5ec4a0", coat: "#f6d36a", dress: "#f6d36a", collar: "#fbf8f1", build: "thin" },
  noble4: { seed: 971, hat: "tricorn", hatCol: "#3a2a4a", band: "#e8c14a", hair: "#f1ede4", hairStyle: "curl", moustache: "#bdb8ae", coat: "#8a2638", lapel: "#6a1a2a", vest: "#f2e6c8", buttons: "#e8c14a", chain: true, legs: "#f2ecdc", boots: "#2a1d14", build: "stout" },
  lady18: { seed: 977, hair: "#f6c6d4", hairStyle: "bun", bow: "#8e5be8", coat: "#f2a8c0", dress: "#f2a8c0", collar: "#fbf8f1", build: "thin" },
  servant1: { seed: 983, hair: "#efe9df", hairStyle: "curl", coat: "#26386a", lapel: "#e8c14a", vest: "#f4f1ea", buttons: "#e8c14a", scarf: "#fbf8f1", legs: "#f2ecdc", boots: "#2a1d14" },
  servant2: { seed: 991, hair: "#efe9df", hairStyle: "curl", moustache: "#3a2a1a", coat: "#26386a", lapel: "#e8c14a", vest: "#f4f1ea", buttons: "#e8c14a", scarf: "#fbf8f1", legs: "#f2ecdc", boots: "#2a1d14", build: "stout" },
  // the pig (planted in scene 2, the last face of the video) + the crow on the field
  pig: { seed: 997, species: "pig", coat: "#f4a7b4", fur: "#f4a7b4" },
  crow: { seed: 1009, species: "pigeon", coat: "#3a3a5a", fur: "#3a3a5a" },
};
