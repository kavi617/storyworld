import {
  worldOrder,
  resolveOrderWorld,
  getWorldEntry,
  getCharactersForGameWorld,
} from "./WorldManager.js";
import {
  getModel,
  preloadModels,
  createModelInstance,
  getInstanceCount,
  trackInstanceUse,
  createInstancedPlacement,
} from "./CharacterLoader.js";
import { hasCachedModel } from "./ModelCache.js";
import { gameLoading } from "./GameLoading.js";

function transferPlaceholderData(target, placeholder, characterId) {
  const preserved = { ...placeholder.userData };
  target.userData = preserved;
  target.userData.isNPC = true;
  target.userData.npcId = characterId;
  target.userData.npcName = characterId;
  target.name = characterId;
}

function replaceNpcListEntry(placeholder, replacement) {
  if (!window.npcList) return;

  const index = window.npcList.indexOf(placeholder);
  if (index >= 0) {
    window.npcList[index] = replacement;
  }
}

function applyPlaceholderTransform(instance, placeholder) {
  const normY = instance.position.y;
  instance.position.copy(placeholder.position);
  instance.position.y += normY;
  instance.rotation.copy(placeholder.rotation);
  instance.updateMatrix();
  instance.updateMatrixWorld(true);
}

function placeCharacterFromCache(scene, world, character, placeholder, cachedModel) {
  if (!cachedModel) {
    return null;
  }

  trackInstanceUse(character);
  const useInstancing = getInstanceCount(character) > 1;
  let instance;

  if (useInstancing) {
    instance = createInstancedPlacement(cachedModel, [placeholder], character);
    if (!instance) {
      instance = createModelInstance(cachedModel, character);
      applyPlaceholderTransform(instance, placeholder);
    }
  } else {
    instance = createModelInstance(cachedModel, character);
    applyPlaceholderTransform(instance, placeholder);
  }

  transferPlaceholderData(instance, placeholder, character);
  instance.userData.baseScale = instance.scale.y;
  scene.add(instance);
  scene.remove(placeholder);
  replaceNpcListEntry(placeholder, instance);

  return instance;
}

export async function preloadWorldCharacters(gameWorld) {
  const characters = getCharactersForGameWorld(gameWorld);
  if (!characters?.length) return;

  const pending = characters.filter((id) => !hasCachedModel(id));
  if (!pending.length) return;

  const total = pending.length;
  gameLoading.setStatus(`Loading character models (0/${total})...`);
  await preloadModels(pending, (ratio) => {
    gameLoading.setCharacterProgress(ratio);
    const done = Math.round(ratio * total);
    gameLoading.setStatus(`Loading character models (${done}/${total})...`);
  });
}

export async function integrateSceneCharacters(scene, gameWorld) {
  try {
    const orderWorld = resolveOrderWorld(gameWorld);
    if (!orderWorld) {
      console.warn("Unknown game world:", gameWorld);
      gameLoading.completeTask("characters");
      return;
    }

    const worldEntry = getWorldEntry(orderWorld);
    if (!worldEntry) {
      console.warn("No world entry for:", orderWorld);
      gameLoading.completeTask("characters");
      return;
    }

    const characters = worldEntry.characters;
    await preloadWorldCharacters(gameWorld);

    gameLoading.setStatus("Placing characters...");

    for (const worldData of worldOrder) {
      if (worldData.world !== orderWorld) continue;

      for (const character of worldData.characters) {
        const placeholder = scene.getObjectByName(character);

        if (!placeholder) {
          console.warn("Missing placeholder for:", character);
          continue;
        }

        if (!placeholder.userData?.isNPC) {
          console.warn("Placeholder not marked as NPC:", character);
          continue;
        }

        const cached = await getModel(character);
        if (!cached) {
          console.warn("No model available for:", character);
          continue;
        }

        placeCharacterFromCache(
          scene,
          worldData.world,
          character,
          placeholder,
          cached,
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }
  } catch (error) {
    console.warn("Character integration error:", error.message);
  } finally {
    gameLoading.completeTask("characters");
  }
}
