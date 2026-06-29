export const worldOrder = [
  {
    world: "forest_world",
    characters: [
      "senguttuvan_cheran",
      "aditya_chola",
      "nedunjeliyan_1",
    ],
  },
  {
    world: "architecture_world",
    characters: [
      "raja_raja_cholan",
      "kulasekara_pandya",
      "cheraman_perumal",
    ],
  },
  {
    world: "water_management_world",
    characters: [
      "karikala_cholan",
      "uthiyan_cheralathan",
      "ariyan_nedunjeliyan_2",
    ],
  },
];

export const characterMap = {
  senguttuvan_cheran:
    "characters/senguttuvan chera/senguttuvan_chera.fbx",
  aditya_chola: "characters/aditya cholan/aditya_cholan.fbx",
  nedunjeliyan_1: "characters/nedunjeliyan i/nedunjeliyan_i.fbx",

  raja_raja_cholan:
    "characters/raja raja cholan/raja_raja_cholan.fbx",
  kulasekara_pandya:
    "characters/kulasekara pandya i/kulasekara_pandya_i.fbx",
  cheraman_perumal: "characters/cheraman perumal/cheraman_perumal.fbx",

  karikala_cholan: "characters/karikala chozhan/karikala_chozhan.fbx",
  uthiyan_cheralathan:
    "characters/uthiyan cheralathan/uthiyan_cheralathan.fbx",
  ariyan_nedunjeliyan_2:
    "characters/ariyan nedunjeliyan 2/ariyan_nedunjeliyan_ii.fbx",
};

const GAME_WORLD_TO_ORDER_WORLD = {
  nature: "forest_world",
  architecture: "architecture_world",
  water: "water_management_world",
};

export function resolveOrderWorld(gameWorld) {
  return GAME_WORLD_TO_ORDER_WORLD[gameWorld] || null;
}

export function getWorldEntry(orderWorld) {
  return worldOrder.find((entry) => entry.world === orderWorld) || null;
}

export function getCharactersForGameWorld(gameWorld) {
  const orderWorld = resolveOrderWorld(gameWorld);
  if (!orderWorld) return null;
  const entry = getWorldEntry(orderWorld);
  return entry ? entry.characters : null;
}
