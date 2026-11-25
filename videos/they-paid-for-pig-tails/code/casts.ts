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
  dealer2: { seed: 233, hat: "tophat", hatCol: "#6d6f78", band: "#2c2a30", beard: "#8e8a94", coat: "#3c3a48", vest: "#c9c2b4", buttons: "#e8c14a", build: "stout" },
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
  // ===== WHY HE PAINTED EYES ON COWS' BUTTS (savanna) — warm costumes pop on cool nights, cool ones on the gold grass =====
  // the hero ("Butt Picasso"): wide olive bush hat with a teal band, royal-blue shirt splattered with paint, sand shorts
  // ===== HE LABELED GRAPE BRICKS "DON'T MAKE WINE" (California, 1920s); accent grape violet #9B3FD0 =====
  // Brick Boy: straw hat with a violet band, cream shirt with red stripes, rolled sleeves, grape-stained violet apron
  brickBoy: { seed: 1301, hat: "straw", hatCol: "#e9c46a", band: "#9b3fd0", hair: "#6a3a1a", hairStyle: "short", coat: "#f2e6cc", stripes: "#d8574a",
    shortSleeve: true, apron: "#9b3fd0", splats: true, legs: "#3f5a86", boots: "#5a3a1a", build: "lanky" },
  // Hank, the neighbor (doubter): bald, grey walrus moustache, green work shirt, brown suspenders, stout
  hank: { seed: 1307, hair: "#bdbdbd", hairStyle: "bald", moustache: "#9a9a9a", moStyle: "walrus", coat: "#4f9a4a", suspenders: "#7a4a24", legs: "#4a4060", boots: "#3a2a1a", build: "stout" },
  // townsfolk at the fence
  town1: { seed: 1319, hat: "flatcap", hatCol: "#5a4a34", coat: "#c8352e", suspenders: "#3b2a1a", legs: "#5a4a3a", boots: "#3a2a1a", build: "thin" },
  town2: { seed: 1321, hat: "cloche", hatCol: "#2f8a8a", band: "#1f5a60", jewel: "#f2c230", coat: "#3fb0a8", dress: "#3fb0a8", collar: "#fbf3e3" },
  town3: { seed: 1327, hat: "bowler", hatCol: "#34303a", moustache: "#3a2a1a", coat: "#e8b04a", vest: "#6b4a2f", buttons: "#3a2a1a", build: "plump" },
  town4: { seed: 1361, hat: "straw", hatCol: "#d9b46a", band: "#2f5d9a", beard: "#8a5a32", coat: "#7aa0d8", suspenders: "#2f4a7a", legs: "#2f4a7a", build: "tall" },
  // the federal agent: charcoal fedora, grey trench coat, dark red tie, tall
  agent: { seed: 1367, hat: "fedora", hatCol: "#2a2a38", band: "#14141c", moustache: "#2a1d14", moStyle: "neat", coat: "#7d8590", lapel: "#646b76", collar: "#ffffff", tie: "#8a2a2a", belt: "#646b76", legs: "#2c2e38", build: "tall" },
  // the government's top Prohibition lawyer: slate cloche, grey suit, pearl collar, bob
  lawyer: { seed: 1373, hat: "cloche", hatCol: "#7a4a6a", band: "#c9a24a", hair: "#3a2a1a", hairStyle: "bob", coat: "#6f7a8e", lapel: "#56607a", dress: "#6f7a8e", collar: "#fbf3e3", build: "thin" },
  // the bottling serviceman: violet peaked cap, white coverall with a violet belt
  service: { seed: 1381, hat: "kepi", hatCol: "#9b3fd0", band: "#f4f1ea", coat: "#f4f1ea", belt: "#9b3fd0", buttons: "#9b3fd0", legs: "#e8e4da", boots: "#3a2a1a" },
  // the family in the kitchen
  mum20: { seed: 1399, hair: "#6a3a24", hairStyle: "bob", coat: "#e8664a", dress: "#e8664a", apron: "#fbf3dc", collar: "#ffffff" },
  kid20: { seed: 1409, hair: "#c26a2c", hairStyle: "cowlick", coat: "#3aa36a", suspenders: "#6b3f1f", legs: "#4a4a6a", build: "kid" },
  picasso: { seed: 1201, hat: "cowboy", hatCol: "#6a7a44", band: "#19b7b0", hair: "#2a1d14", hairStyle: "short", coat: "#2f6fc8", collar: "#e8eef6", buttons: "#f2ead8",
    splats: true, shorts: "#d8c08a", socks: "#f2ead8", shoes: "#5a3a24", build: "adult" },
  // the doubters on the fence: big farmer (straw hat, red shirt, braces), thin one (flat cap, green), auntie (purple headscarf + dress), tall one (orange cap)
  fmBig: { seed: 1213, hat: "straw", hatCol: "#e6c27a", band: "#8a3a22", moustache: "#2a1d14", coat: "#c8352e", suspenders: "#3b2a1a", legs: "#5a4a3a", boots: "#3a2a1a", build: "stout" },
  fmThin: { seed: 1217, hat: "flatcap", hatCol: "#5a4a34", coat: "#3aa36a", collar: "#f2ead8", legs: "#3a4a6a", boots: "#3a2a1a", build: "thin" },
  fmAunt: { seed: 1223, hat: "headscarf", hatCol: "#8e5be8", jewel: "#f2c230", coat: "#b07ae8", dress: "#b07ae8", collar: "#f2c230" },
  fmTall: { seed: 1229, hat: "baseball", hatCol: "#ff8a3d", coat: "#f2c230", stripes: "#e89a2a", legs: "#3a4a6a", boots: "#3a2a1a", build: "tall" },
  kid1: { seed: 1231, hair: "#2a1d14", hairStyle: "short", coat: "#2fb8c8", shorts: "#3a4a6a", build: "kid" },
  kid2: { seed: 1237, hair: "#2a1d14", hairStyle: "bun", bow: "#ff6a8a", coat: "#ff9ab0", dress: "#ff9ab0", build: "kid" },
  // the kitchen: mum in a pink dressing gown with curlers (bun), the kid in teal striped pyjamas
  mum: { seed: 1249, hair: "#3a2418", hairStyle: "bun", bow: "#5ec4a0", coat: "#f2a8c0", dress: "#f2a8c0", collar: "#fbf3e3", build: "adult" },
  pjKid: { seed: 1259, hair: "#3a2418", hairStyle: "cowlick", coat: "#5ec4a0", stripes: "#e8f8f0", legs: "#5ec4a0", build: "kid" },
  // the herd: every third cow wears the painted eyes
  cow0: { seed: 1301, species: "cow", coat: "#c8875a", fur: "#c8875a", painted: true },
  cow1: { seed: 1303, species: "cow", coat: "#f2ece0", fur: "#f2ece0", patch: "#3a3440" },
  cow2: { seed: 1307, species: "cow", coat: "#8a5a3a", fur: "#8a5a3a" },
  cow3: { seed: 1319, species: "cow", coat: "#e8d4a8", fur: "#e8d4a8", patch: "#9a5a3a", painted: true },
  cow4: { seed: 1321, species: "cow", coat: "#3f3a48", fur: "#3f3a48", patch: "#f2ece0" },
  cow5: { seed: 1327, species: "cow", coat: "#b8683e", fur: "#b8683e", patch: "#f2ece0" },
  cow6: { seed: 1361, species: "cow", coat: "#f2ece0", fur: "#f2ece0", patch: "#8a5a3a", painted: true },
  cow7: { seed: 1367, species: "cow", coat: "#c8875a", fur: "#c8875a", patch: "#f2ece0" },
  cow8: { seed: 1373, species: "cow", coat: "#6e4a34", fur: "#6e4a34" },
  cow9: { seed: 1381, species: "cow", coat: "#d8a46a", fur: "#d8a46a", painted: true },
  cow10: { seed: 1399, species: "cow", coat: "#f2ece0", fur: "#f2ece0", patch: "#3a3440" },
  cow11: { seed: 1409, species: "cow", coat: "#9a6a44", fur: "#9a6a44", patch: "#e8d4a8" },
  lion: { seed: 1423, species: "lion", coat: "#d9a24a", fur: "#d9a24a", patch: "#a8582a" },
  impala: { seed: 1427, species: "impala", coat: "#c67a46", fur: "#c67a46" },
  // ===== HE SAVED HIS LIFE BY PROVING HIS MASTERPIECE WAS FAKE (1945; accent ember orange #F05A28) =====
  // the painter (hero): ember-orange beret, slicked dark hair, thin neat moustache, cream smock covered in paint splats,
  // red neckerchief, brown trousers; thin build
  forger: { seed: 1601, hat: "beret", hatCol: "#f05a28", hair: "#2a1d14", hairStyle: "slick", moustache: "#2a1d14", moStyle: "neat",
    coat: "#efe6d0", collar: "#ffffff", scarf: "#c8352e", splats: true, buttons: "#8a5a32", legs: "#6a4a32", shoes: "#3a2a1a", build: "thin" },
  // the two court guards: navy kepis with a brass band, navy tunics, white belts, police badges; one moustached
  guardA: { seed: 1607, hat: "kepi", hatCol: "#23345a", band: "#c9a227", coat: "#2c4270", buttons: "#e8c14a", belt: "#f2ead8", police: true, legs: "#1f2a44", boots: "#1a1a22", build: "stout" },
  guardB: { seed: 1609, hat: "kepi", hatCol: "#23345a", band: "#c9a227", moustache: "#5a3a1e", moStyle: "walrus", coat: "#2c4270", buttons: "#e8c14a", belt: "#f2ead8", police: true, legs: "#1f2a44", boots: "#1a1a22", build: "tall" },
  // the judge: black gown, white bands, round glasses, grey tufts, stout
  judge: { seed: 1613, hair: "#cfc8bc", hairStyle: "tufts", glasses: true, coat: "#1e1a26", lapel: "#2c2636", collar: "#ffffff", bowtie: "#ffffff", build: "stout" },
  // reporters: trilby with a PRESS card, camera strap, pencil behind the ear
  rep1: { seed: 1619, hat: "trilby", hatCol: "#6a5a48", band: "#2a2014", coat: "#8a6a4a", lapels: true, shirt: "#f2ead8", tie: "#2f5d9a", camStrap: true, pencilEar: true },
  rep2: { seed: 1621, hat: "fedora", hatCol: "#3a3a48", band: "#c8352e", glasses: true, coat: "#5a6e88", lapels: true, shirt: "#ffffff", tie: "#c8352e", pencilEar: true, build: "tall" },
  rep3: { seed: 1627, hat: "cloche", hatCol: "#2f7a5a", band: "#e8c14a", hair: "#8a5a2b", hairStyle: "bob", coat: "#e8b04a", dress: "#e8b04a", collar: "#ffffff" },
  // soldiers in the mine (olive helmets + tunics) and their officer (peaked cap, neat moustache)
  soldierA: { seed: 1631, hat: "hardhat", hatCol: "#5a6a3a", coat: "#6a7a44", belt: "#3a2a1a", buttons: "#c9a227", legs: "#5a6a3a", boots: "#2a1a10" },
  soldierB: { seed: 1637, hat: "hardhat", hatCol: "#5a6a3a", moustache: "#c26a2c", coat: "#6a7a44", belt: "#3a2a1a", buttons: "#c9a227", legs: "#5a6a3a", boots: "#2a1a10", build: "stout" },
  officer: { seed: 1639, hat: "kepi", hatCol: "#4e5a34", band: "#3a2a1a", moustache: "#3a2a1a", moStyle: "neat", coat: "#7a8450", lapels: true, shirt: "#d8c8a0", tie: "#4e5a34", belt: "#3a2a1a", legs: "#5a6440", boots: "#2a1a10", build: "tall" },
  // the country's top art expert: white beard, big round glasses, tweed coat, bow tie, watch chain
  expert: { seed: 1643, hair: "#f2f2f2", hairStyle: "bald", beard: "#f4f4f4", bigGlasses: true, coat: "#8a6a44", vest: "#e8dcc0", bowtie: "#7a2a3a", chain: true, build: "stout" },
  // the museum director: top hat, monocle, black tailcoat, cream waistcoat
  director: { seed: 1649, hat: "tophat", hatCol: "#1f1c26", band: "#7a2a3a", monocle: true, moustache: "#8a8a8a", moStyle: "handlebar", coat: "#2a2630", vest: "#f2e6c8", buttons: "#e8c14a", chain: true, build: "tall" },
  // porters: flat caps, aprons, rolled sleeves
  porterA: { seed: 1651, hat: "flatcap", hatCol: "#4a4f57", coat: "#3f6e9a", apron: "#c9a86a", rolled: true },
  porterB: { seed: 1657, hat: "flatcap", hatCol: "#6b4a2f", moustache: "#3a2a1a", coat: "#9a4a3a", apron: "#c9a86a", rolled: true, build: "stout" },
  // the top Nazi (no insignia anywhere): stout, grey-green tunic, peaked cap with a silver band, a big medal, smug
  nazi: { seed: 1663, hat: "kepi", hatCol: "#5e6458", band: "#c9ced8", coat: "#7a8072", buttons: "#c9ced8", belt: "#3a3030", medal: true, legs: "#5e6458", boots: "#1a1a22", build: "plump" },
  // the scientists of the test: white lab coats, goggles / glasses
  sciA: { seed: 1667, hair: "#3a2a1a", hairStyle: "parted", glasses: true, coat: "#f4f4f0", collar: "#ffffff", tie: "#2f5d9a", pocketPro: "#2f5d9a" },
  sciB: { seed: 1669, hair: "#8a5a2b", hairStyle: "bun", goggles: true, coat: "#f4f4f0", collar: "#ffffff" },
  // the public in court (payoff crowd)
  pubA: { seed: 1671, hat: "bowler", hatCol: "#34303a", moustache: "#3a2a1a", coat: "#2f6b4f", vest: "#e8dcc0", collar: "#ffffff" },
  pubB: { seed: 1673, hat: "cloche", hatCol: "#c0476a", band: "#7a2a3a", coat: "#c0476a", dress: "#c0476a", collar: "#fbf3e3" },
  pubC: { seed: 1677, hat: "flatcap", hatCol: "#2f7fd1", coat: "#e8b04a", suspenders: "#3b2a1a", build: "kid" },
  pubD: { seed: 1679, hair: "#d8d8d8", hairStyle: "bun", glasses: true, coat: "#7a5aa8", dress: "#7a5aa8", collar: "#ffffff", build: "plump" },
  pubE: { seed: 1681, hat: "trilby", hatCol: "#8a5a32", coat: "#3f5a8e", lapels: true, shirt: "#f2ead8", tie: "#e8c14a", build: "tall" },
  pubF: { seed: 1687, hair: "#c26a2c", hairStyle: "pigtails", bow: "#2fb8c8", coat: "#2fb8c8", dress: "#2fb8c8", build: "kid" },
  // ===== HE MADE CARS EASIER TO CRUSH, AND IT SAVED LIVES (1950s car works) ===== accent: safety-cage yellow #f2c230
  // THE ENGINEER: big round glasses, neat parted hair, pencil behind the ear, rolled white shirt-sleeves, a yellow bow
  // tie, a sage waistcoat, a pocket protector full of pens
  eng: { seed: 1801, hair: "#2a1d14", hairStyle: "parted", glasses: true, bigGlasses: true, coat: "#f4f1ea", vest: "#6f8a6a", buttons: "#e8dcc0",
    bowtie: "#f2c230", pencilEar: true, pocketPro: "#9ad7e8", rolled: true, legs: "#46485a", build: "thin" },
  // THE BOSS: stout, grey tufts + walrus moustache, navy three-piece suit, wine waistcoat, gold watch chain, red tie
  cBoss: { seed: 1811, hair: "#d8d8d8", hairStyle: "tufts", moustache: "#d8d8d8", moStyle: "walrus", coat: "#2f3d6a", lapel: "#24305a", vest: "#8a2f45",
    chain: true, buttons: "#e8c14a", tie: "#c8352e", legs: "#2a2f48", build: "stout" },
  // the salesmen: a fedora + loud check jacket + clipboard; a slicked one in a striped blazer with a carnation
  cSalesA: { seed: 1813, hat: "fedora", hatCol: "#6b4a2f", band: "#2a1d14", coat: "#c26a2c", plaid: "#8a3a1a", lapels: true, shirt: "#f2ead8", tie: "#2f5d9a", moustache: "#3a2a1a", moStyle: "neat" },
  cSalesB: { seed: 1817, hair: "#1d1410", hairStyle: "slick", coat: "#2f6b8a", vstripes: "#e8dcc0", lapels: true, shirt: "#ffffff", bowtie: "#c8352e", carnation: "#e84a6a", build: "tall" },
  // mechanics: overalls with patches, caps, rolled sleeves; one with a big moustache
  mechA: { seed: 1819, hat: "flatcap", hatCol: "#2f4a7a", coat: "#3b5f9a", patches: "#c9a86a", rolled: true, legs: "#3b5f9a", gloves: "#c9a86a" },
  mechB: { seed: 1823, hat: "beanie", hatCol: "#c8352e", band: "#8a2020", moustache: "#5a3a1a", moStyle: "walrus", coat: "#8a6a4a", patches: "#3b5f9a", rolled: true, legs: "#8a6a4a", build: "stout" },
  mechC: { seed: 1829, hat: "baseball", hatCol: "#f2c230", coat: "#4a7a5a", suspenders: "#2a2a30", rolled: true, legs: "#2f4a3a", toolbelt: "#6b4a2f" },
  // the crash-test dummy: white head, pale body with black-yellow target decals, black joints
  dummy: { seed: 1831, dummy: true, coat: "#e8dcc0", legs: "#e8dcc0", belt: "#26222c", boots: "#26222c", build: "adult" },
  // the 1950s showroom: a proud couple buying the tank car
  buyerM: { seed: 1837, hat: "trilby", hatCol: "#3a3440", coat: "#7a5a3a", lapels: true, shirt: "#f2ead8", tie: "#e8c14a", build: "tall" },
  buyerF: { seed: 1839, hair: "#c26a2c", hairStyle: "curl", coat: "#e86a8a", dress: "#e86a8a", collar: "#ffffff", jewel: "#ffffff" },
  // the backyard demo: YOU (green hoodie + yellow cap, the viewer's avatar) and the friend throwing balloons
  you: { seed: 1841, hat: "baseball", hatCol: "#f2c230", coat: "#3fae6a", shirt: "#2a2f48", legs: "#3a4a7a", shoes: "#f4f1ea", build: "adult" },
  friend: { seed: 1847, hair: "#2a1d14", hairStyle: "cowlick", coat: "#e86a2a", stripes: "#ffd166", legs: "#2f4a6a", shoes: "#f4f1ea", build: "kid" },
  // today: the old man at the wreck (flat cap, cardigan, cane), the driver who is fine (coffee), a passer-by
  oldMan: { seed: 1853, hat: "flatcap", hatCol: "#6b5a4a", hair: "#e6e6e6", hairStyle: "tufts", moustache: "#e6e6e6", moStyle: "walrus", glasses: true, coat: "#8a6a9a", vest: "#d9c9a8", buttons: "#5a4a3a", legs: "#5a5a6a", build: "stout" },
  cDriver: { seed: 1859, hair: "#3a2a1a", hairStyle: "bob", coat: "#2f7fd1", shirt: "#f4f1ea", lapels: true, legs: "#2a2f48", shoes: "#f4f1ea" },
  passer: { seed: 1861, hat: "beanie", hatCol: "#2fb8c8", coat: "#f2c230", legs: "#3a3440", build: "kid" },
  // ---- "They Blew Up Houses to Stop a Fire" (London 1666 + today). Accent: fuse orange-red #E8462A (sash, barrels) ----
  // CAPTAIN KABOOM: tall, navy coat with gold buttons, white cross belt, orange-red sash, black tricorn with gold trim, no moustache
  capt: { seed: 2101, hat: "tricorn", hatCol: "#2a2530", band: "#e8c14a", hair: "#5a3420", hairStyle: "tufts", coat: "#2c3c74", lapel: "#24305e", buttons: "#e8c14a",
    sash: "#e8462a", belt: "#f4f1ea", legs: "#e8dcc0", boots: "#2a2228", build: "tall" },
  sold1: { seed: 2111, hat: "kepi", hatCol: "#2c3c74", band: "#e8c14a", coat: "#2c3c74", buttons: "#e8c14a", belt: "#f4f1ea", legs: "#e8dcc0", boots: "#2a2228", hair: "#2a1d14", hairStyle: "tufts" },
  sold2: { seed: 2113, hat: "flatcap", hatCol: "#6a2a2a", coat: "#2c3c74", buttons: "#e8c14a", belt: "#f4f1ea", legs: "#e8dcc0", boots: "#2a2228", hair: "#c26a2c", hairStyle: "tufts", build: "stout" },
  // THE MAYOR: stout, striped nightcap, white nightgown, the gold chain of office, grey mutton chops (mouth always visible)
  mayor: { seed: 2121, hat: "nightcap", hatCol: "#f4efe4", band: "#c8352e", hair: "#d8d8d8", hairStyle: "tufts", chops: "#d8d8d8", coat: "#f4efe4", dress: "#f4efe4",
    collar: "#ffffff", chain: true, jewel: "#e8c14a", medal: true, build: "stout" },
  baker: { seed: 2131, hat: "nightcap", hatCol: "#f4f1ea", hair: "#8a5a2b", hairStyle: "tufts", coat: "#e8dcc0", apron: "#ffffff", rolled: true, legs: "#6a5a4a", build: "plump" },
  wife: { seed: 2141, hat: "bonnet", hatCol: "#f4efe4", hair: "#8a3a24", hairStyle: "bun", coat: "#7a4a8a", dress: "#7a4a8a", apron: "#f4f1ea", collar: "#ffffff" },
  neighbour: { seed: 2143, hat: "nightcap", hatCol: "#3f6aa8", band: "#f4f1ea", hair: "#2a1d14", hairStyle: "tufts", coat: "#e8e2d0", dress: "#e8e2d0", build: "thin" },
  granny: { seed: 2147, hat: "headscarf", hatCol: "#3f8a6a", hair: "#e6e6e6", hairStyle: "bun", coat: "#8a5a3a", dress: "#8a5a3a", build: "plump" },
  kid66: { seed: 2149, hat: "flatcap", hatCol: "#6b4a2f", coat: "#c26a2c", suspenders: "#3b2a1a", legs: "#5a4a3a", build: "kid" },
  soupGuy: { seed: 2153, hat: "beret", hatCol: "#5a7a3a", hair: "#3a2a1a", hairStyle: "tufts", coat: "#8a6a3a", apron: "#e8dcc0", build: "stout" },
  cit1: { seed: 2161, hat: "flatcap", hatCol: "#4a4f57", coat: "#3f7a6a", legs: "#5a4a3a", rolled: true },
  cit2: { seed: 2163, hat: "headscarf", hatCol: "#c8352e", hair: "#3a2a1a", hairStyle: "bun", coat: "#c89a3a", dress: "#c89a3a", apron: "#f4f1ea" },
  cit3: { seed: 2167, hat: "straw", hatCol: "#e6c27a", band: "#6a2a2a", coat: "#6a5a9a", legs: "#4a4a5a", build: "tall" },
  cit4: { seed: 2171, hat: "beanie", hatCol: "#8a3a4a", hair: "#c26a2c", hairStyle: "tufts", coat: "#9a7a4a", apron: "#5a4a3a", build: "stout" },
  // TODAY: the domino YOU (purple hoodie, orange-red cap), the firefighter, the onlooker
  you2: { seed: 2181, hat: "baseball", hatCol: "#e8462a", coat: "#7a4ab8", hoodie: "#f4f1ea", legs: "#2f3a5a", shoes: "#f4f1ea", build: "adult" },
  ffighter: { seed: 2191, hat: "hardhat", hatCol: "#c8352e", coat: "#e6c02a", stripes: "#d8e0e8", belt: "#2a2e36", gloves: "#6a4a30", legs: "#e6c02a", boots: "#2a2228" },
  // CHANNEL ART: Loophole Lou (messy brown spiky hair, mustard hoodie, sly half-smile)
  coolRat: { seed: 2207, species: "rat", fur: "#aab0bc", shades: true, coat: "#aab0bc" },
  lou: { seed: 2203, hair: "#6b4528", hairStyle: "spiky", coat: "#f2a93b", hoodie: "#f4f1ea", legs: "#2a2228", shoes: "#2a2228", build: "adult" },
  onlooker: { seed: 2197, hat: "baseball", hatCol: "#2f4a7a", hair: "#2a1d14", hairStyle: "tufts", coat: "#6a7a5a", shirt: "#f4f1ea", legs: "#4a4a5a", shoes: "#f4f1ea", build: "stout" },
  // ===== OWNERS SANK THEIR OWN SHIPS, SO HE PAINTED A LINE (1870s Liverpool) ===== accent: signal lime #8BD435
  // the ship owner: stout, tall black top hat, ginger mutton chops (mouth free), crimson waistcoat + gold watch chain, plum frock coat
  owner: { seed: 3101, hat: "tophat", hatCol: "#23222a", band: "#6a1e24", chops: "#c2642c", hair: "#c2642c", hairStyle: "short",
    coat: "#5b2f4e", lapel: "#43223a", vest: "#c8322e", buttons: "#f3d36b", chain: true, collar: "#ffffff", build: "stout" },
  // the insurer: thin, bowler, round spectacles, grey frock coat, mustard waistcoat, ledger-and-policy man
  insurer: { seed: 3109, hat: "bowler", hatCol: "#3a3a40", band: "#1e1e24", glasses: true, hair: "#8a8a86", hairStyle: "parted",
    coat: "#6f747c", lapel: "#565a62", vest: "#d9b24a", buttons: "#3a2a1a", collar: "#ffffff", bowtie: "#2a2a30", build: "thin" },
  // Samuel Plimsoll: tall, brown beard under the mouth line, top hat, bottle-green frock coat, the lime scarf (accent)
  plimsoll: { seed: 3119, hat: "tophat", hatCol: "#2e2a26", band: "#8bd435", beard: "#6b4528", hair: "#6b4528", hairStyle: "short",
    coat: "#2f5a46", lapel: "#244636", vest: "#efe6d2", scarf: "#8bd435", buttons: "#d8c08a", collar: "#ffffff", build: "tall" },
  // sailors: striped jerseys + caps in three silhouettes
  sailorA: { seed: 3121, hat: "beanie", hatCol: "#c8352e", coat: "#2f4f86", stripes: "#f3efe6", hair: "#2a1d14", hairStyle: "tufts", build: "adult" },
  sailorB: { seed: 3127, hat: "flatcap", hatCol: "#4a3a2a", coat: "#f3efe6", stripes: "#2b3f7a", beard: "#3a2a1a", build: "stout" },
  sailorC: { seed: 3137, hat: "stripecap", hatCol: "#2b3f7a", band: "#f3efe6", coat: "#c78a3a", hair: "#d8b060", hairStyle: "cowlick", rolled: true, build: "thin" },
  // the constable: custodian helmet, navy tunic with silver buttons
  constable: { seed: 3163, hat: "custodian", hatCol: "#1d2742", coat: "#24305a", buttons: "#d8dce6", belt: "#1b1b22", police: true, moustache: "#2a1d14", moStyle: "neat", build: "tall" },
  // the Speaker: white curled wig, black silk gown, white lace jabot
  speaker: { seed: 3169, hat: "none", hair: "#f4f1ea", hairStyle: "curl", coat: "#1f1d24", lapel: "#2c2933", collar: "#ffffff", bowtie: "#f4f1ea", build: "stout" },
  // Members of Parliament (the mocking benches): varied top hats / whiskers / waistcoats
  mp1: { seed: 3173, hat: "tophat", hatCol: "#3a3440", sideburns: "#9a9a96", coat: "#3d4a6a", vest: "#e8dcc0", chain: true, build: "plump" },
  mp2: { seed: 3181, hat: "none", hair: "#c9c6bd", hairStyle: "bald", chops: "#c9c6bd", glasses: true, coat: "#6a3a3a", vest: "#d8c8a0", build: "stout" },
  mp3: { seed: 3187, hat: "bowler", hatCol: "#4a3a2a", beard: "#2a1d14", coat: "#4a6a4a", vest: "#c8a060", build: "thin" },
  mp4: { seed: 3191, hat: "tophat", hatCol: "#6d6f78", band: "#2c2a30", monocle: true, coat: "#7a5a2a", vest: "#f2ead8", build: "tall" },
  // the newsboy, the 1890 Board of Trade inspector, a docker
  newsboy: { seed: 3203, hat: "flatcap", hatCol: "#6b4a2f", coat: "#9a5a2a", shirt: "#efe6d2", mailbag: "#7a5230", hair: "#c26a2c", hairStyle: "cowlick", build: "kid" },
  inspector: { seed: 3209, hat: "kepi", hatCol: "#1d2742", band: "#d8b84a", coat: "#2a3a5e", buttons: "#d8b84a", collar: "#ffffff", glasses: true, moustache: "#6a6a66", moStyle: "neat", build: "adult" },
  docker: { seed: 3217, hat: "flatcap", hatCol: "#3a3440", coat: "#7a4a2a", vest: "#4a5a3a", rolled: true, gloves: "#a8784a", build: "stout" },
  // ===== HE COVERED HIS ORANGES IN ICE (Florida grove, a freeze night) =====
  // Earl (hero): lean grower, brown felt fedora with a dark band, grey tufts, brick-red mackinaw with dark checks,
  // mustard knitted scarf, denim work trousers, tan work gloves (deadpan; props: hose, lantern, thermos)
  earl: { seed: 401, hat: "fedora", hatCol: "#6b4a2f", band: "#2e2016", hair: "#a7a4aa", hairStyle: "tufts", sideburns: "#a7a4aa", collar: "#e0aa3c",
    coat: "#b4412c", stripes: "rgba(40,16,12,0.32)", scarf: "#e0aa3c", patches: "#7a3020", buttons: "#3a2414", legs: "#3b5a8a", boots: "#4a3020", gloves: "#c99a5c", build: "thin" },
  // Duane (doubter): stout rival, red knit beanie with cream stripes, big ginger walrus moustache, olive quilted coat
  // with patches, khaki trousers (moustache-mouth default; props: torch, crate, lantern)
  duane: { seed: 409, hat: "beanie", hatCol: "#c8352e", band: "#f2e6c8", moustache: "#c26a2c", moStyle: "walrus", hair: "#c26a2c", hairStyle: "tufts",
    coat: "#5f7a3a", patches: "#8a6a3a", buttons: "#e8c14a", belt: "#3b2a1a", legs: "#8a7a5a", boots: "#3a2a1a", build: "stout" },
  // Duane's farmhands
  hand1: { seed: 419, hat: "flatcap", hatCol: "#6b4a2f", coat: "#3f6fa8", collar: "#e8dcc0", legs: "#4a4038", build: "tall" },
  hand2: { seed: 421, hat: "beanie", hatCol: "#e0aa3c", band: "#8a5a20", moustache: "#2a1d14", coat: "#c8352e", stripes: "rgba(30,10,10,0.3)", legs: "#3b5a8a", build: "stout" },
  hand3: { seed: 431, hair: "#2a1d14", hairStyle: "short", coat: "#3f7a4a", scarf: "#c0476a", legs: "#5a4a3a", build: "adult" },
  // townsfolk at the gate (midnight)
  ftown1: { seed: 433, hat: "fedora", hatCol: "#5a5e6e", band: "#2a2a38", moustache: "#3a2a1a", coat: "#26386a", lapel: "#1d2a52", scarf: "#e8dcc0", legs: "#34303a", build: "tall" },
  ftown2: { seed: 439, hat: "cloche", hatCol: "#2f7f86", band: "#1f5a60", jewel: "#f2c230", coat: "#c0476a", dress: "#c0476a", collar: "#fbf3e3" },
  ftown3: { seed: 443, hat: "flatcap", hatCol: "#4a4f57", coat: "#e0aa3c", scarf: "#3f6fa8", suspenders: "#3b2a1a", build: "kid" },
  ftown4: { seed: 449, hat: "bowler", hatCol: "#4a3a2a", band: "#2a1d14", beard: "#cfcbd2", glasses: true, coat: "#7a4a6a", vest: "#e8dcc0", buttons: "#e8c14a", build: "stout" },
  // June (Earl's wife): grey-brown bun, round glasses, rose cardigan over a mustard dress, cream apron
  june: { seed: 457, hair: "#8a6a4a", hairStyle: "bun", glasses: true, coat: "#c0476a", dress: "#2f7f9a", apron: "#f2e6c8", collar: "#fbf3e3", build: "adult" },
  // the scarecrow: straw hat, straw tufts, patched burlap coat, rope belt, patched trousers
  scarecrow: { seed: 461, hat: "straw", hatCol: "#d9b25a", band: "#8a3a2a", hair: "#e8c66a", hairStyle: "tufts", coat: "#9a6a3a", patches: "#5f7a3a",
    buttons: "#3b2a1a", belt: "#c9a46a", legs: "#5a6e8a", boots: "#6b4a2f", build: "lanky" },
  // ---- "He Made Giant Bricks to Pay Half the Tax" ----
  // Amos (hero, calm and smug, never shocked): straw hat with a red band, short dark hair, teal shirt with rolled
  // sleeves, red neckerchief, brown leather apron, blue breeches, brown boots
  amos: { seed: 503, hat: "straw", hatCol: "#d9b25a", band: "#8a2a24", /* r43: no hair band under the boater (his brows vanished into it) */ coat: "#2f7f9a", plaid: "#22607a", scarf: "#c8352e",
    apron: "#8a5a34", buttons: "#3a2414", legs: "#3b4f7a", boots: "#5a3a22", build: "adult" },
  // Silas (next door, the first to laugh): red-and-cream striped cap, black beard, mustard shirt, braces, stout
  silas: { seed: 509, hat: "stripecap", hatCol: "#c8352e", band: "#f2e6c8", moustache: "#6a4428", moStyle: "neat", hair: "#6a4428", hairStyle: "short",   /* r66 (AX row 3): a moustache, no chin-ring beard (below the jaw it read as a scarf or fur collar) */ /* r52 (AX1 row 3): a mid-brown beard (near-black read as a hood) */ coat: "#e0aa3c",
    suspenders: "#4a2a1a", legs: "#6a5038",   /* r76e: no rolled cuffs (they floated as yellow blocks on the stick arms) */ boots: "#3a2a1a", build: "stout" },
  // Percival the taxman (doubter): charcoal tricorn with a gold band, grey hair, grey neat moustache, navy coat with
  // brass buttons over a red waistcoat, white stock collar, tall and thin; carries his ledger
  tax: { seed: 521, hat: "tricorn", hatCol: "#2a2a38", band: "#e8c14a", moustache: "#4a3a32", moStyle: "walrus",
    coat: "#26386a", lapel: "#1d2a52", vest: "#b8322a", vestStripe: "#8e2420", buttons: "#e8c14a", collar: "#fbf3e3", legs: "#2a2a38", boots: "#1e1a1e", build: "tall" },
  // Ned (the broke builder who tries the loaves): battered brown bowler, green patched coat, grey scarf, lanky
  ned: { seed: 523, hat: "bowler", hatUp: 0.06, hatCol: "#5a4632", band: "#2e2016", coat: "#3f7a4a", plaid: "#2e5e38", patches: "#6a5a3a", scarf: "#a8aab2",
    buttons: "#2a1d14", legs: "#6a6258", boots: "#4a3020", build: "tall" },   /* r60 (AX row 4): tall, not lanky (a pencil torso, 0.62 head widths) */
  // Bess (innkeeper): white bonnet, red dress, straw apron, plump
  bess: { seed: 541, hat: "bonnet", hatCol: "#5f86c4", band: "#c8352e", hair: "#8a5a34", hairStyle: "bun", coat: "#c8352e", dress: "#c8352e", apron: "#f0dca8", collar: "#fbf3e3", build: "adult" },
  // the baker: white beret, white apron over an ochre shirt, moustache
  bkr: { seed: 547, hat: "toque", hatCol: "#f6f2ea",   /* r65 (AX row 3): a puffed cloth baker's cap with a red band over the crown (the small white beret vanished on the white head) */ moustache: "#5a3a22", moStyle: "handlebar", coat: "#d8a95f", apron: "#f4f0e6", stripes: "rgba(255,255,255,0.35)", legs: "#5a4a3a", build: "stout" },
  // the town crier (pins up the Act): red coat with gold trim, black tricorn, white stock
  crier: { seed: 557, hat: "bicorne" /* r76i (AX row 3): a bicorne - the flat red tricorn read as a paper crown */, hatCol: "#8a2a24", band: "#f2e6c8",   /* r76c (AX row 3): a red tricorn with a cream edge (black and gold copied the taxman) */ hair: "#b4aea4", hairStyle: "bald",   /* r62 (AX row 3): grey tufts (white on the white head read as dents) */ coat: "#b8322a", lapel: "#e8c14a", buttons: "#e8c14a", collar: "#fbf3e3", sash: "#e8c14a", legs: "#1e1a22", boots: "#1e1a1e", build: "adult" },   /* r60 (AX row 4): a gold sash (the plain red capsule did not say town crier) */
  // villagers, Silas's hands, builders, drinkers
  sh1: { seed: 563, hat: "flatcap", hatCol: "#6b4a2f", coat: "#3f6fa8", collar: "#e8dcc0", rolled: true, legs: "#4a4038", build: "tall" },
  sh2: { seed: 569, hat: "beanie", hatCol: "#2f7f86", band: "#f2e6c8", moustache: "#2a1d14", coat: "#c0476a", legs: "#3b5a8a", build: "stout" },
  bv1: { seed: 571, hat: "none", hair: "#5e3a22", hairStyle: "bob",   /* r76f (AX row 3): pigtails (the cloche band sat on her far brow) */ coat: "#2f7f9a", dress: "#2f7f9a", collar: "#f2e6c8", sash: "#e8c14a", build: "adult" },   /* r76g (AX rows 3-4): duplicate hair keys removed (the old orange bun won); a sash and collar instead of Bess's apron */
  bv2: { seed: 577, hat: "fedora", hatUp: 0.14, hatCol: "#5a4632", band: "#2a2018", hair: "#5e4a3e", hairStyle: "parted",   /* r76c (AX rows 1-3): bare-headed, brown hair over his own brows (the fedora brim sat on his eyes) */   /* r76b (AX row 3): a slouch felt hat (five flat caps in the cast) */ moustache: "#5e4a3e", moStyle: "neat",   /* r76e (AX row 1): an outlined moustache (the beard behind the outline read as a fur collar) */   /* r76 (AX row 1): a darker brown beard (the grey one read as a scarf or a double chin) */   /* v15 7.9: grey, not a white collar under the white head */ coat: "#7a4a6a", vest: "#e8dcc0", buttons: "#e8c14a", legs: "#3a3440", build: "stout" },
  bv3: { seed: 587, hat: "none",   /* r76g: bare-headed (the beret band sat on his brows) */   /* r76c (AX row 3): a green beret (the knit cap drew as a lid / boater) */ band: "#2f6a43", hair: "#2a1d14", hairStyle: "spiky", coat: "#b03a64", scarf: "#efe4cc",   /* r76 (AX rows 3-4): mustard beanie and raspberry coat (blue cap + red coat twinned builder 2) */ legs: "#5a6e8a", build: "kid" },
  bv4: { seed: 593, hat: "none",   /* r76e (AX rows 1-3): bare head, hair in a bun (the band hid her brows) */ apron: "#f2e6c8", sash: "#8a5a34",   /* r76d (AX rows 3-4): a red headscarf band, apron and sash (a recolour of bv1) */ hair: "#3a2416", hairStyle: "pigtails" /* r76i (AX row 3): a bob with a fringe - the bun repeated bv1 */,   /* v15 AX1 row 3: (the bob covered an eye) */ coat: "#e0aa3c", dress: "#e0aa3c", plaid: "#b07e22", collar: "#fbf3e3", build: "thin" },   /* r60 (AX row 4): a check on the plain mustard dress */
  bv5: { seed: 599, hat: "tophat", hatCol: "#3a3a40", band: "#1e1e22", hair: "#b4aea4", hairStyle: "slick",   /* r76e: soft grey tufts (the side slabs read as earmuffs) */   /* r76d (AX row 3): bald with grey side-whiskers (the bowler read as Ned) */ moustache: "#5a3a22", moStyle: "walrus", coat: "#b0862e", vest: "#7a4a8a",   /* r63 (AX row 4): grey coat, green waistcoat (navy + red copied Percival) */ legs: "#3a3440", build: "tall" },   /* r61 (AX row 3): slate coat (bowler + green coat read as Ned) */
  bld1: { seed: 601, hat: "flatcap", hatCol: "#8a5a34", coat: "#5e4a7e",   /* r66 (AX rows 4/7): plum coat - the orange loaf reads on it, and he no longer reads as Amos (slate + apron did) */   /* r68b: no rolled cuffs (on the plum sleeve they read as lavender pills at the hands) */ apron: "#c9b48e", legs: "#4a4038", boots: "#3a2a1a", build: "adult" },
  bld2: { seed: 607, hat: "none", hair: "#4a3020", hairStyle: "parted" /* r76i (AX row 3): side-parted hair - the curl read as a pot lid with a handle */, moStyle: "neat", scarf: "#e0aa3c", plaid: "#6a2a1e",   /* r76b (AX row 4): a mustard neckerchief and a soft check on the coat (a plain rust bean) */   /* r76 (AX row 3): an outlined moustache (the soft taper read as a smear) */   /* r48: a flat cap (the beanie turn-up read as a ruler on his head) */ moustache: "#6a4226", coat: "#b5523a", suspenders: "#3b2a1a", legs: "#5a4a3a", build: "stout" },   /* r70 (AX row 4): a rust-red work coat (the mustard coat twinned Silas) */
  bld3: { seed: 613, hat: "flatcap", hatCol: "#4a505c",   /* r76i (AX row 3): a dark brimmed fedora with a black band (grey hair read as a bald scalp or skullcap) */ hair: "#8a8580", hairStyle: "parted",   /* r76d (AX row 3): a grey crop (dark tufts twinned drk2) */   /* r76c (AX row 3): bare-headed (three builders in the same newsboy cap) */ moustache: "#2a1d14", moStyle: "handlebar", coat: "#8a8e92", vest: "#6a4a30",   /* r76 (AX rows 3-4): a grey coat and dark cap, outlined moustache (green twinned Ned, the moustache was a hairline) */ scarf: "#3f6fa8", legs: "#3b5a8a", build: "tall" },
  bld4: { seed: 631, hat: "beanie", hatCol: "#c8352e", band: "#f2e6c8", coat: "#3f6fa8", rolled: true, apron: "#c9b48e", legs: "#4a4038", boots: "#3a2a1a", build: "adult" },   // r35: the fourth builder in the queue
  drk1: { seed: 617, hat: "bowler", hatUp: 0.05, hatCol: "#2a2624", band: "#5a3a2a",   /* r76g (AX row 3): a bowler (the tall topper squeezed his face under the brim) */   /* r76 (AX row 8): a warm black topper and brown band (it went navy with a magenta band in the inn light) */   /* r67 (AX row 3): a battered black topper (the knit cap read as a thin band; a third flat cap repeated bld1 / drk2) */ beard: "#8a6a4a", coat: "#7a4a2a", vest: "#2f7f9a", legs: "#3a3440", build: "adult" },
  drk2: { seed: 619, hat: "none", hair: "#2a1d14", hairStyle: "slick" /* r76i (AX row 3): slicked hair - the spikes repeated bv3 */,   /* r76c (AX row 3): bare-headed with dark tufts (the knit cap drew as a lid) */   /* r76b (AX row 3): a teal knit cap (a copy of bld1's brown flat cap) */ moustache: "#2a1d14", moStyle: "handlebar", coat: "#2e5a3e", vest: "#c89a3a", vestCheck: "#8a6a22",   /* r60 (AX row 4): a checked mustard waistcoat */   /* r60 (AX row 3): cap and claret coat (bowler + green coat duplicated bv5 and Ned) */ collar: "#fbf3e3", legs: "#4a4038", build: "thin" },
  // ===== THEY SCRAPPED LATE FEES AND GOT A TRUCKLOAD OF BOOKS BACK (2026-11-16) =====
  // Marge, head librarian (hero, deadpan): grey bun with a pencil, round glasses, teal ribbed cardigan, mustard skirt
  marge: { seed: 701, hat: "none", hair: "#a6a2a8", hairStyle: "bun", pencilEar: true, glasses: true, coat: "#2f8a8a", dress: "#2f8a8a", vstripes: "#287c7c", scarf: "#e0aa3c", buttons: "#f2e6c8", collar: "#fbf3e3", legs: "#3a3a48", build: "adult" },
  // Gary, fines clerk (doubter): side-parted thin hair, neat moustache, pale-blue short-sleeve shirt, brown argyle vest, maroon tie, pocket protector
  gary: { seed: 709, hat: "none", hair: "#7a6450", hairStyle: "parted", moustache: "#5a3a24", moStyle: "neat", coat: "#9ab8d8", shirt: "#9ab8d8", vest: "#8a5a34", vestCheck: "#c8a060", tie: "#7a2a2a", pocketPro: "#ffffff", shortSleeve: true, legs: "#4a4a58", build: "adult" },
  // Dwayne, the late patron: green trucker cap, red-and-black buffalo-check flannel, stubble beard, jeans, big
  dwayne: { seed: 719, hat: "baseball", hatCol: "#2f7a4a", band: "#f2e6c8", coat: "#b8322a", plaid: "#2a1414", legs: "#3f5a8a", build: "stout" },
  // the board: Harold (bald, grey tufts, tweed, bow tie, glasses), Denise (black bob, maroon blazer, cream blouse), Kevin (young, big glasses, green sweater)
  harold: { seed: 727, hat: "none", hair: "#c9c6bd", hairStyle: "bald", sideburns: "#c9c6bd", glasses: true, coat: "#8a6a44", vestCheck: "#6a4a2a", bowtie: "#c8352e", collar: "#ffffff", legs: "#4a3a30", build: "plump" },
  denise: { seed: 733, hat: "none", hair: "#2a2028", hairStyle: "bob", coat: "#8a2a3a", lapels: true, shirt: "#f2e6c8", dress: "#3a4a7a", collar: "#fbf3e3", build: "adult" },
  kevin: { seed: 739, hat: "none", hair: "#4a3020", hairStyle: "spiky", bigGlasses: true, coat: "#3f7a4a", stripes: "rgba(20,40,20,0.35)", collar: "#e8dcc0", legs: "#5a5a6a", build: "thin" },
  // the kid (orange hoodie, blue cap backwards), grandma (white bun, lilac cardigan), Mr. Pruitt (olive raincoat, plaid scarf, moustache)
  libkid: { seed: 743, hat: "baseball", hatCol: "#2f5d9a", hoodie: "#f2e6c8", coat: "#e8762a", legs: "#3f5a8a", build: "kid" },
  grandma: { seed: 751, hat: "none", hair: "#ece8e4", hairStyle: "bun", glasses: true, coat: "#9a7ab8", buttons: "#f2e6c8", collar: "#fbf3e3", dress: "#5a4a6a", legs: "#5a4a6a", build: "plump" },
  pruitt: { seed: 757, hat: "trilby", hatCol: "#5a5a48", band: "#2e2a24", moustache: "#8a8580", moStyle: "neat", coat: "#5f6e3a", lapel: "#4e5c2e", scarf: "#a8343a", legs: "#3a3a40", build: "thin" },
  garySpy: { seed: 709, hat: "fedora", hatCol: "#6a5a44", band: "#2e2a24", hair: "#7a6450", hairStyle: "parted", moustache: "#5a3a24", moStyle: "neat", shades: true, coat: "#b49a6a", lapel: "#9a8054", belt: "#8a7048", legs: "#4a4a58", build: "adult" },
  cyclist: { seed: 761, hat: "beanie", hatCol: "#c8352e", band: "#f2e6c8", coat: "#3f6fa8", legs: "#3a3a48", build: "adult" },
  reader1: { seed: 767, hat: "none", hair: "#2a1d14", hairStyle: "short", glasses: true, coat: "#c0476a", legs: "#3a3a48", build: "adult" },
  reader2: { seed: 769, hat: "none", hair: "#8a5a34", hairStyle: "pigtails", bow: "#2f7a86", coat: "#e0aa3c", legs: "#3f5a8a", build: "kid" },
  // ===== THEY GAVE AWAY FREE HENS AND THE GARBAGE VANISHED (2026-11-17) =====
  // Odile, the mayor (hero, calm half-lid): short black curls, round glasses, navy blazer, red mayor's sash, mustard scarf
  odile: { seed: 801, hat: "none", hair: "#1e1a20", hairStyle: "curl", glasses: true, coat: "#2a3a6a", lapels: true, shirt: "#f2e6c8", sash: "#d23a32", scarf: "#e0aa3c", dress: "#2a3a6a", legs: "#2a2a38", build: "adult" },
  // Bruno, the garbage man (doubter): orange beanie, bushy black beard, hi-vis orange vest with silver stripes over a grey tee, work gloves
  bruno: { seed: 809, hat: "beanie", hatCol: "#e8762a", band: "#e8762a", beard: "#2a1d14", moustache: "#2a1d14", moStyle: "walrus", coat: "#6a6e78", vest: "#f08a1e", vestStripe: "#e4e8ee", gloves: "#c8a050", legs: "#3a4a6a", build: "stout" },
  // Luc, the dad: brown cowlick, blue-and-white striped shirt, red apron
  luc: { seed: 817, hat: "none", hair: "#6a4026", hairStyle: "cowlick", coat: "#eef2f8", stripes: "rgba(40,90,170,0.75)", apron: "#c8352e", legs: "#4a4a58", build: "tall" },
  // Zoé, his kid: brown bunches with red bows, yellow raincoat, red wellies
  zoe: { seed: 823, hat: "none", hair: "#5e3a22", hairStyle: "pigtails", bow: "#c8352e", coat: "#f4c430", buttons: "#f2e6c8", legs: "#3f5a8a", boots: "#c8352e", build: "kid" },
  // Henri, the first laugher: grey flat cap, white walrus moustache, green cardigan
  henri: { seed: 829, hat: "flatcap", hatCol: "#6a6a5a", moustache: "#efece4", moStyle: "walrus", hair: "#d8d4cc", hairStyle: "tufts", coat: "#4a7a4a", buttons: "#f2e6c8", collar: "#fbf3e3", legs: "#4a4038", build: "thin" },
  hbaker: { seed: 839, hat: "toque", hatCol: "#f8f6f0", moustache: "#5a3a22", moStyle: "handlebar", coat: "#f4f1ea", apron: "#f4f1ea", legs: "#3a3a48", build: "plump" },
  regBeret: { seed: 853, hat: "beret", hatCol: "#2a2a34", band: "#2a2a34", hair: "#3a2416", hairStyle: "short", coat: "#b03a64", scarf: "#f2e6c8", legs: "#3a3a48", build: "adult" },
  regBlonde: { seed: 857, hat: "none", hair: "#e0c070", hairStyle: "bob", coat: "#3f6fa8", scarf: "#e8e4dc", vstripes: "rgba(255,255,255,0.0)", legs: "#4a4a58", build: "adult" },
  granny2: { seed: 863, hat: "none", hair: "#ece8e4", hairStyle: "bun", coat: "#8a6ab0", drape: "#a88ac8", dress: "#5a4a6a", legs: "#5a4a6a", build: "plump" },
  hneigh: { seed: 871, hat: "straw", hatCol: "#e0c88a", band: "#c8352e", hair: "#4a3020", hairStyle: "short", coat: "#d8763a", legs: "#4a4a58", build: "adult" },
  // the hens: Rousse (red-brown) and Neige (white), plus extras
  rousse: { seed: 901, species: "hen", fur: "#b8562a", coat: "#000", patch: "peel" },
  neige: { seed: 903, species: "hen", fur: "#f2efe6", coat: "#000", patch: "pasta" },
  henBlack: { seed: 905, species: "hen", fur: "#3a3236", coat: "#000", patch: "crust" },
  henGold: { seed: 907, species: "hen", fur: "#d89a3a", coat: "#000", patch: "crust" },
  rousseC: { seed: 901, species: "hen", fur: "#b8562a", coat: "#000", patch: "crust" },
  neigeP: { seed: 903, species: "hen", fur: "#f2efe6", coat: "#000", patch: "peel" },
  // ===== HE MADE DENTAL VISITS LONGER (2026-11-17) =====
  // Doctor Hal: kind, plump, big round glasses, grey tufts + neat grey moustache, off-white coat over mint scrubs
  hal: { seed: 1001, hat: "none", hair: "#cfcac2", hairStyle: "bald", sideburns: "#cfcac2", bigGlasses: true, glasses: true, moustache: "#cfcac2", moStyle: "neat",
    coat: "#dfe8e4", lapels: true, shirt: "#7cc8a8", pocketPro: "#5aa0d0", legs: "#5aa88a", build: "plump" },
  // Doctor Vance: tall, slick black hair, navy scrubs, a light-blue surgical mask, wristwatch
  vance: { seed: 1009, hat: "none", hair: "#1a1620", hairStyle: "slick", mask: "#a8d2ec", coat: "#2a3a6a", shirt: "#2a3a6a", vstripes: "rgba(255,255,255,0.0)", watch: true, legs: "#2a3a6a", build: "tall" },
  vanceEnd: { seed: 1009, hat: "none", hair: "#1a1620", hairStyle: "slick", mask: "#a8d2ec", coat: "#2a3a6a", shirt: "#2a3a6a", watch: true, legs: "#2a3a6a", build: "tall" },
  vanceNoMask: { seed: 1009, hat: "none", hair: "#1a1620", hairStyle: "slick", coat: "#2a3a6a", shirt: "#2a3a6a", watch: true, legs: "#2a3a6a", build: "tall" },
  // Mae, the receptionist: big auburn curls, red cat-eye glasses, lilac cardigan, pencil behind the ear
  mae: { seed: 1013, hat: "none", hair: "#a8482a", hairStyle: "curl", glasses: true, catEye: "#c8352e", pencilEar: true, coat: "#a88ac8", buttons: "#f2e6c8", collar: "#fbf3e3", dress: "#5a4a7a", legs: "#5a4a7a", build: "adult" },
  // Pratt, truck driver: red trucker cap, big brown beard, blue plaid shirt, stout
  pratt: { seed: 1019, hat: "baseball", hatCol: "#c8352e", band: "#f2e6c8", beard: "#6a4226", moustache: "#6a4226", moStyle: "walrus", coat: "#3f6fa8", plaid: "#1e2a4a", rolled: true, legs: "#3a3a48", build: "stout" },
  // Mrs. Dot (brings the first cake), Gus the postman (the second patient)
  dot: { seed: 1021, hat: "none", hair: "#ece8e4", hairStyle: "bun", glasses: true, coat: "#e8a03a", buttons: "#f2e6c8", collar: "#fbf3e3", dress: "#8a4a3a", legs: "#8a4a3a", build: "plump" },
  gus: { seed: 1031, hat: "mailcap", hatCol: "#2f4a7a", moustache: "#3a2a1a", coat: "#5a7ab8", mailbag: "#8a5a34", legs: "#2f4a7a", build: "adult" },
  // townsfolk with toothaches
  ache1: { seed: 1039, hat: "beanie", hatCol: "#3f7a4a", band: "#3f7a4a", coat: "#c26a2c", scarf: "#e8d070", legs: "#3a3a48", build: "adult" },
  ache2: { seed: 1049, hat: "none", hair: "#2a1d14", hairStyle: "bob", coat: "#8a2a3a", collar: "#fbf3e3", dress: "#3a3a58", legs: "#3a3a58", build: "adult" },
  ache3: { seed: 1051, hat: "baseball", hatCol: "#2f5d9a", band: "#f2e6c8", coat: "#f4c430", legs: "#3f5a8a", build: "kid" },
  // Sal the barber (chalks DR. SLOWPOKE), the baker
  sal: { seed: 1061, hat: "none", hair: "#2a1d14", hairStyle: "parted", moustache: "#2a1d14", moStyle: "handlebar", coat: "#e6dfd2", vstripes: "rgba(200,50,50,0.55)", bowtie: "#c8352e", legs: "#2a2a34", build: "thin" },
  // the LUCKY LANES bowling team: orange shirts with a black chest stripe
  bowl1: { seed: 1071, hat: "none", hair: "#2a1d14", hairStyle: "short", coat: "#e8762a", chestStripe: "#2a2a30", collar: "#f2e6c8", legs: "#2a2a34", build: "stout" },
  bowl2: { seed: 1073, hat: "none", hair: "#e0c070", hairStyle: "curl", coat: "#e8762a", chestStripe: "#2a2a30", collar: "#f2e6c8", legs: "#2a2a34", build: "adult" },
  bowl3: { seed: 1077, hat: "none", hair: "#9a948a", hairStyle: "bald", glasses: true, moustache: "#9a948a", coat: "#e8762a", chestStripe: "#2a2a30", collar: "#f2e6c8", legs: "#2a2a34", build: "plump" },
  bowl4: { seed: 1079, hat: "none", hair: "#5a2a1a", hairStyle: "bun", coat: "#e8762a", chestStripe: "#2a2a30", collar: "#f2e6c8", legs: "#2a2a34", build: "thin" },
  // waiting-room patients who run out
  wait1: { seed: 1081, hat: "trilby", hatCol: "#5a5a48", band: "#2e2a24", coat: "#5f6e3a", legs: "#3a3a40", build: "thin" },
  wait2: { seed: 1083, hat: "none", hair: "#e0c070", hairStyle: "bob", coat: "#3f6fa8", scarf: "#e8e4dc", legs: "#4a4a58", build: "adult" },
  wait3: { seed: 1087, hat: "none", hair: "#4a3020", hairStyle: "spiky", coat: "#3aa36a", legs: "#3f5a8a", build: "kid" },
  // the lab: scientist + volunteer
  sci: { seed: 1091, hat: "none", hair: "#6a4a2a", hairStyle: "bun", glasses: true, coat: "#dde4e2", lapels: true, shirt: "#5a7ab8", pocketPro: "#5aa0d0", legs: "#3a3a48", build: "adult" },
  vol: { seed: 1097, hat: "none", hair: "#2a1d14", hairStyle: "pigtails", bow: "#f4c430", hoodie: "#e8e4dc", coat: "#c0476a", legs: "#3f5a8a", build: "adult" },
  // ---- "They Put a Plague in One Room and It Took a Whole City" (original fantasy world) ----
  garyH: { seed: 2001, hat: "hood", hatCol: "#4a7a3a", hair: "#6a4226", hairStyle: "short", coat: "#5a8a44", belt: "#5a3a24", sash: "#8a5a34", legs: "#4a3a2a", boots: "#3a2a1a", build: "adult" },
  wolf: { seed: 2003, species: "dog", coat: "#8a9098", fur: "#8a9098", patch: "#4a4e56", collar: "#c8352e" },
  rolf: { seed: 2005, hat: "none", hair: "#c8602a", hairStyle: "spiky", beard: "#c8602a", moustache: "#c8602a", moStyle: "walrus", coat: "#8a4a3a", belt: "#3a2a1a", legs: "#4a3a2a", boots: "#3a2a1a", build: "stout" },
  champ: { seed: 2007, hat: "helm", hatCol: "#e2b84a", coat: "#d8ac3a", sash: "#c8352e", belt: "#8a5a24", legs: "#a8862a", boots: "#6a4a1a", build: "tall" },
  knight1: { seed: 2009, hat: "helm", hatCol: "#b8c0c8", coat: "#3a5a9a", sash: "#d8dde4", belt: "#3a2a1a", legs: "#8a929a", boots: "#3a3e46", build: "adult" },
  knight2: { seed: 2011, hat: "helm", hatCol: "#a8b0b8", coat: "#3a5a9a", sash: "#d8dde4", belt: "#3a2a1a", legs: "#8a929a", boots: "#3a3e46", build: "stout" },
  priest: { seed: 2013, hat: "horns", hatCol: "#3a1a22", coat: "#5a1a2a", drape: "#2a0e14", sash: "#c8a03a", legs: "#2a0e14", build: "tall" },
  bram: { seed: 2015, hat: "toque", hatCol: "#f2ece0", hair: "#3a2a1a", hairStyle: "short", moustache: "#3a2a1a", moStyle: "handlebar", coat: "#d8b88a", apron: "#f2ead8", legs: "#5a4a3a", build: "plump" },
  fruitwife: { seed: 2017, hat: "bonnet", hatCol: "#e8d8a8", hair: "#8a4a2a", hairStyle: "bun", coat: "#a84a6a", apron: "#f2e8d2", dress: "#6a3a5a", legs: "#6a3a5a", build: "adult" },
  potioner: { seed: 2019, hat: "beret", hatCol: "#4a3a8a", hair: "#d8d8d0", hairStyle: "tufts", beard: "#d8d8d0", coat: "#6a4a9a", sash: "#c8a03a", legs: "#3a2a5a", build: "thin" },
  healer: { seed: 2021, hat: "none", hair: "#f2d080", hairStyle: "bob", coat: "#f2ece0", sash: "#d8a83a", dress: "#e8e0d0", legs: "#e8e0d0", build: "adult" },
  newbie1: { seed: 2023, hat: "none", hair: "#6a4226", hairStyle: "cowlick", coat: "#b89a74", belt: "#5a3a24", legs: "#6a5a4a", build: "kid" },
  newbie2: { seed: 2025, hat: "none", hair: "#2a1d14", hairStyle: "pigtails", bow: "#e8484a", coat: "#9ab07a", legs: "#6a5a4a", build: "kid" },
  prank: { seed: 2027, hat: "jester", hatCol: "#8a3aa8", band: "#f4c430", coat: "#8a3aa8", vstripes: "#f4c430", legs: "#f4c430", build: "lanky" },
  ptown1: { seed: 2029, hat: "flatcap", hatCol: "#6a5a4a", hair: "#4a3020", hairStyle: "short", coat: "#6a7a9a", legs: "#4a4a52", build: "adult" },
  ptown2: { seed: 2031, hat: "none", hair: "#a8482a", hairStyle: "bun", coat: "#c8a04a", dress: "#8a5a3a", legs: "#8a5a3a", build: "adult" },
  ptown3: { seed: 2033, hat: "none", hair: "#1a1620", hairStyle: "curl", coat: "#4a8a8a", legs: "#3a3a48", build: "thin" },
  ptown4: { seed: 2035, hat: "straw", hatCol: "#e8d088", hair: "#6a4226", hairStyle: "tufts", beard: "#6a4226", coat: "#7a8a4a", legs: "#5a4a3a", build: "stout" },
  dev1: { seed: 2037, hat: "none", hair: "#2a1d14", hairStyle: "short", hoodie: "#d8d8d0", coat: "#3a4a6a", glasses: true, legs: "#3a3a48", build: "adult" },
  dev2: { seed: 2039, hat: "beanie", hatCol: "#c8602a", hair: "#6a4a2a", hairStyle: "short", hoodie: "#f2e6c8", coat: "#5a7a4a", beard: "#6a4a2a", legs: "#3a3a48", build: "stout" },
  sci1: { seed: 2041, hat: "none", hair: "#6a6a6a", hairStyle: "parted", glasses: true, coat: "#dde4e2", lapels: true, shirt: "#5a7ab8", tie: "#8a3a3a", legs: "#3a3a48", build: "adult" },
  sci2: { seed: 2043, hat: "none", hair: "#2a1d14", hairStyle: "bun", bigGlasses: true, coat: "#dde4e2", lapels: true, shirt: "#c87a5a", legs: "#3a3a48", build: "thin" },
  // ===== THE SKULL THAT WAS WORTH MORE IN PIECES (Java, 1937) =====
  // Agus, the farmer (hero): woven caping, indigo batik shirt with ochre kawung, green checked sarong, calm
  agus: { seed: 701, hat: "caping", hatCol: "#d8b878", coat: "#2f4a8a", batik: "#e2b04a", sarong: "#3f7a4a", legs: "#3f7a4a", rolled: true, build: "adult" },
  // Joko, the neighbour (doubter): black peci, moustache, rust striped shirt, brown sarong
  joko: { seed: 709, hat: "peci", hatCol: "#26222a", moustache: "#2a1d14", coat: "#c2552e", stripes: "#f0c060", sarong: "#6a4a2a", legs: "#6a4a2a", rolled: true, build: "stout" },
  // Ralph, the fossil hunter: khaki pith helmet, round glasses, moustache, khaki shirt with rolled sleeves + pockets, red neckerchief
  ralph: { seed: 719, hat: "pith", hatCol: "#d8c89a", band: "#6a5a3a", glasses: true, moustache: "#8a5a2a", hair: "#8a5a2a", hairStyle: "short",
    coat: "#b8a070", lapel: "#9a845a", buttons: "#5a4a2a", scarf: "#b3262e", legs: "#8a7a54", rolled: true, watch: true, build: "tall" },
  // Sri, Agus's wife: hair bun, teal kebaya with a batik sarong
  sri: { seed: 727, hair: "#1d1410", hairStyle: "bun", coat: "#2f8a86", batik: "#f4e2b0", dress: "#2f8a86", collar: "#f4f0e6" },
  kidA: { seed: 733, hair: "#1d1410", hairStyle: "spiky", coat: "#e8a43a", shorts: "#3a4a7a", build: "kid" },
  kidB: { seed: 739, hair: "#1d1410", hairStyle: "pigtails", bow: "#c8352e", coat: "#c84a6a", dress: "#c84a6a", build: "kid" },
  kidC: { seed: 743, hat: "peci", hatCol: "#26222a", coat: "#f2ead8", stripes: "#3a6aa8", shorts: "#6a4a2a", build: "kid" },
  // the farmers in the queue + the villagers
  farmer1: { seed: 751, hat: "caping", hatCol: "#c8a868", coat: "#7a2a2a", sarong: "#2f5a6a", legs: "#2f5a6a", rolled: true },
  farmer2: { seed: 757, hat: "headscarf", hatCol: "#c84a3a", coat: "#3a6a4a", batik: "#e8d8a0", dress: "#6a3a2a" },
  farmer3: { seed: 761, hat: "peci", hatCol: "#26222a", moustache: "#d8d8d8", coat: "#e8dcc0", stripes: "#6a8a3a", sarong: "#8a2a3a", legs: "#8a2a3a", build: "thin" },
  farmer4: { seed: 769, hat: "caping", hatCol: "#e0c48a", coat: "#d87a2a", sarong: "#3a3a6a", legs: "#3a3a6a", rolled: true, build: "stout" },
  elder: { seed: 773, hat: "peci", hatCol: "#26222a", moustache: "#e8e8e8", beard: "#e8e8e8", coat: "#5a3a6a", batik: "#d8c090", sarong: "#2a4a3a", legs: "#2a4a3a", build: "thin" },
  vil1: { seed: 787, hat: "caping", hatCol: "#d4b47a", coat: "#2f6a8a", sarong: "#8a5a2a", legs: "#8a5a2a", rolled: true },
  vil2: { seed: 797, hat: "headscarf", hatCol: "#e8b84a", coat: "#8a2a4a", batik: "#f2d8a8", dress: "#3a5a3a" },
  vil3: { seed: 809, hat: "caping", hatCol: "#c8a468", coat: "#4a7a3a", stripes: "#e8d8a0", sarong: "#5a2a2a", legs: "#5a2a2a", build: "thin" },
  vil4: { seed: 811, hair: "#1d1410", hairStyle: "short", coat: "#d8a03a", batik: "#7a2a1a", sarong: "#2a3a6a", legs: "#2a3a6a", rolled: true },
  // ---- "They Banned Cars One Day a Week and Got More Cars" (Mexico City 1989) ----
  memo: { seed: 901, hair: "#1d1410", hairStyle: "short", moustache: "#5a3a26", moStyle: "neat", coat: "#e2a23a", stripes: "#8a3a2a", collar: "#f4f0e6", legs: "#3a4a6a", watch: true },
  hugo: { seed: 907, hair: "#2a1d14", hairStyle: "slick", moustache: "#2a1d14", moStyle: "handlebar", coat: "#c8352e", hawaii: "#f4d06a", shortSleeve: true, legs: "#3a3a44", build: "stout" },
  mayor: { seed: 911, hair: "#8a8a8a", hairStyle: "parted", moustache: "#8a8a8a", moStyle: "walrus", coat: "#2a2a3a", lapels: true, shirt: "#f2ead6", tie: "#2f7a4a", sash: "#c8352e", carnation: "#f4f0e6", legs: "#2a2a3a", build: "plump" },
  cop: { seed: 919, hat: "kepi", hatCol: "#2a3a6a", band: "#d8a83a", moustache: "#3a2a1a", coat: "#2f4a8a", police: true, belt: "#1a1a22", legs: "#26324e", build: "tall" },
  cop2: { seed: 929, hat: "kepi", hatCol: "#2a3a6a", band: "#d8a83a", hair: "#2a1d14", hairStyle: "short", coat: "#2f4a8a", police: true, belt: "#1a1a22", legs: "#26324e", build: "stout" },
  kid: { seed: 937, hair: "#1d1410", hairStyle: "spiky", coat: "#3aa0c8", stripes: "#f4f0e6", shorts: "#8a5a2a", socks: "#f4f0e6", build: "kid" },
  kidB: { seed: 937, hair: "#1d1410", hairStyle: "spiky", coat: "#3aa0c8", stripes: "#f4f0e6", shorts: "#8a5a2a", tallBoots: "#6a4a2a", build: "kid" },
  clerk: { seed: 941, hair: "#6a4a2a", hairStyle: "parted", glasses: true, coat: "#8a7a5a", lapels: true, shirt: "#f2ead6", tie: "#8a3a2a", legs: "#4a4238", build: "thin", pencilEar: true },
  econ: { seed: 947, hair: "#4a3020", hairStyle: "parted", bigGlasses: true, coat: "#6a5a7a", lapels: true, shirt: "#e8e4dc", tie: "#c8a03a", pocketPro: "#f2ead6", legs: "#3a3a48", build: "thin" },
  paperman: { seed: 953, hat: "fedora", hatCol: "#6a5a48", band: "#2e2a24", moustache: "#4a3020", coat: "#5f6e3a", buttons: "#2e2a24", legs: "#3a3a40" },
  nb1: { seed: 961, hat: "straw", hatCol: "#e8d088", moustache: "#2a1d14", coat: "#4a8a8a", stripes: "#f2ead6", legs: "#5a4a3a", build: "stout" },
  nb2: { seed: 967, hair: "#2a1d14", hairStyle: "bun", coat: "#c84a6a", hawaii: "#f4e2b0", dress: "#c84a6a", collar: "#f4f0e6" },
  nb3: { seed: 971, hat: "flatcap", hatCol: "#6a5a4a", hair: "#6a4226", hairStyle: "tufts", coat: "#7a8a4a", suspenders: "#3a2a1a", legs: "#4a4a52", build: "lanky" },
  worker: { seed: 977, hat: "hardhat", hatCol: "#f2c230", hair: "#2a1d14", hairStyle: "tufts", coat: "#e8762a", chestStripe: "#f4f0e6", toolbelt: "#5a3a24", legs: "#3a4a6a" },
  qa: { seed: 983, hair: "#e0c070", hairStyle: "bob", coat: "#3f6fa8", scarf: "#e8e4dc", legs: "#4a4a58" },
  qb: { seed: 991, hat: "beret", hatCol: "#8a3a4a", hair: "#4a3020", hairStyle: "bun", coat: "#c8a04a", dress: "#8a5a3a", legs: "#8a5a3a" },
  qc: { seed: 997, hair: "#6a4a2a", hairStyle: "short", beard: "#6a4a2a", coat: "#5a7a4a", hoodie: "#f2e6c8", legs: "#3a3a48", build: "tall" },
  qd: { seed: 1009, hair: "#1d1410", hairStyle: "pigtails", bow: "#f4c430", coat: "#8a5ab0", dress: "#8a5ab0", build: "kid" },
  qe: { seed: 1013, hat: "bowler", hatCol: "#3a3440", moustache: "#8a8a8a", coat: "#6a6a7a", lapels: true, shirt: "#f2ead6", tie: "#3a6aa8", legs: "#4a4a52", build: "plump" },
  drv1: { seed: 1019, hat: "trilby", hatCol: "#5a5a48", band: "#2e2a24", coat: "#8a4a3a", legs: "#3a3a40", build: "thin" },
  drv2: { seed: 1021, hair: "#a8482a", hairStyle: "curl", glasses: true, coat: "#4a8a6a", collar: "#f4f0e6", legs: "#3a3a48" },
  // ---- "The Thieves Who Stole 200 Shoes Nobody Can Wear" (an Andean shoe shop, 2026-11-23) ----
  // the owner "Sleepyhead": grey parted hair, neat grey moustache, big round glasses, mustard cardigan over a cream shirt
  shOwner: { seed: 1031, hair: "#a4a4a8", hairStyle: "tufts", moustache: "#a4a4a8", moStyle: "neat", glasses: true, bigGlasses: true, coat: "#d8a23a", lapels: true, shirt: "#efe8d6", buttons: "#6a4a2a", legs: "#5a4c40", build: "plump" },
  // the boss thief: dark flat cap, navy jumper with cream stripes, dark gloves, gold watch, black handlebar moustache
  shBoss: { seed: 1033, hat: "flatcap", hatCol: "#3a3a46", moustache: "#2a1d14", moStyle: "handlebar", hair: "#2a1d14", hairStyle: "short", coat: "#2c3a5e", stripes: "#e8e2d2", gloves: "#2a2a30", watch: true, legs: "#2e2e38", build: "adult" },
  // the big thief: rust beanie, stubble beard, olive jacket under an orange padded vest, wide
  shBig: { seed: 1039, hat: "baseball", hatCol: "#9a3a2a", beard: "#4a3a2e", coat: "#5a6a44", vest: "#d8742e", buttons: "#3a2a1a", legs: "#3a3a48", build: "plump" },
  // the skinny thief: grey-blue hoodie with cream drawstrings, spiky black hair, long legs
  shSkinny: { seed: 1049, hair: "#1d1410", hairStyle: "spiky", coat: "#5a7894", hoodie: "#f2ead6", legs: "#2a2a34", build: "lanky" },
  // the neighbour (the baker next door): white baker's toque, walrus moustache, white shirt, rolled sleeves, blue apron
  shBaker: { seed: 1051, hat: "toque", hatCol: "#f4f2ec", hair: "#3a2a1a", hairStyle: "short", moustache: "#3a2a1a", moStyle: "walrus", coat: "#f0ebe0", apron: "#3a6aa8", rolled: true, legs: "#4a4a52", build: "stout" },
  shBigB: { seed: 1039, hat: "bucket", hatCol: "#6a5a3a", beard: "#4a3a2e", coat: "#5a6a44", vest: "#d8742e", buttons: "#3a2a1a", legs: "#3a3a48", build: "plump" },
  shBigC: { seed: 1039, hat: "stripecap", hatCol: "#9a3a2a", beard: "#4a3a2e", coat: "#5a6a44", vest: "#d8742e", buttons: "#3a2a1a", legs: "#3a3a48", build: "plump" },
  // ---- "They Paid for Pig Tails and Got a Pig Farm" (2026-11-25): the bounty shed guy (lead), the best hunter (lead),
  //      the old ranger "Grandpa", the second hunter, four hunters in the queue, the hogs. All original designs.
  // the shed guy: plump, parted brown hair, neat moustache, khaki work shirt, red suspenders, olive trousers, pencil behind the ear
  pgShed: { seed: 2201, hair: "#5a3a22", hairStyle: "parted", moustache: "#5a3a22", moStyle: "neat", coat: "#d2b880", buttons: "#5a4a30", suspenders: "#b8342a", legs: "#5a5a3a", boots: "#4a3020", pencilEar: true, build: "plump" },
  // the best hunter: blaze-orange cap + vest, a big brown beard, red plaid shirt, olive trousers, tall
  pgHunter: { seed: 2203, hat: "baseball", hatCol: "#f2661a", beard: "#6a4426", hair: "#6a4426", hairStyle: "short", coat: "#a8362c", plaid: "#2a2a30", vest: "#f2661a", legs: "#5a5a40", boots: "#3e2a1a", build: "tall" },
  // the old ranger: campaign hat, white walrus moustache, ranger-green shirt, a brass badge, thin
  pgRanger: { seed: 2207, hat: "campaign", hatCol: "#9a7848", band: "#4a2e1a", hair: "#e8e6e0", hairStyle: "short", moustache: "#f2f0ea", moStyle: "walrus", coat: "#5e7048", buttons: "#c49a48", medal: true, legs: "#4e4836", boots: "#3a2a1c", build: "thin" },
  // the second hunter: blue beanie, short dark beard, brown canvas jacket, stout
  pgHunter2: { seed: 2209, hat: "beanie", hatCol: "#2a5a9a", beard: "#3a2a20", hair: "#3a2a20", hairStyle: "short", coat: "#8a6440", buttons: "#3a2a1a", legs: "#3a3a48", boots: "#3a2a1a", build: "stout" },
  // the queue (backs / small): caps and vests in different colours
  pgQ1: { seed: 2211, hat: "baseball", hatCol: "#4a5a34", moustache: "#2a2018", coat: "#6a5a44", vest: "#f2661a", legs: "#4a4a3a", build: "adult" },
  pgQ2: { seed: 2213, hat: "cowboy", hatCol: "#c8b48a", beard: "#8a8a8a", coat: "#3a5a7a", legs: "#3a3a46", build: "lanky" },
  pgQ3: { seed: 2217, hat: "baseball", hatCol: "#8a2a24", hair: "#2a1a10", coat: "#5a6a3a", vest: "#e8c040", legs: "#4a4436", build: "stout" },
  pgQ4: { seed: 2221, hat: "bucket", hatCol: "#6a6a4a", beard: "#5a3a20", coat: "#7a4a30", plaid: "#2a2018", legs: "#3a3a3a", build: "plump" },
  // the hogs: the giant boar (tusks), sows, striped piglets
  pgBoar: { seed: 2231, species: "pig", coat: "#3a2c26", fur: "#3a2c26", wild: true, tusks: true },
  pgBoar2: { seed: 2233, species: "pig", coat: "#4a3a30", fur: "#4a3a30", wild: true, tusks: true },
  pgSow: { seed: 2237, species: "pig", coat: "#5e4434", fur: "#5e4434", wild: true },
  pgSow2: { seed: 2239, species: "pig", coat: "#4a4446", fur: "#4a4446", wild: true },
  pgPiglet: { seed: 2241, species: "pig", coat: "#7a5a40", fur: "#7a5a40", wild: true, piglet: true },
  pgPiglet2: { seed: 2243, species: "pig", coat: "#6a4c38", fur: "#6a4c38", wild: true, piglet: true },
};
