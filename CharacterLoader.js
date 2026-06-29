import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { characterMap } from "./WorldManager.js";
import {
  getCachedModel,
  setCachedModel,
  hasCachedModel,
} from "./ModelCache.js";

const loader = new FBXLoader();
const templateMeshCache = new Map();
const loadQueue = new Map();
const TARGET_HEIGHT = 2;
const LOAD_TIMEOUT = 60000;

function loadWithTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("FBX load timed out")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function yieldToBrowser() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

function convertSkinnedToStatic(object) {
  const toConvert = [];
  object.traverse((child) => {
    if (child.isSkinnedMesh) toConvert.push(child);
  });
  for (const skinned of toConvert) {
    const parent = skinned.parent;
    if (!parent) continue;
    const mesh = new THREE.Mesh(skinned.geometry, skinned.material);
    mesh.position.copy(skinned.position);
    mesh.quaternion.copy(skinned.quaternion);
    mesh.scale.copy(skinned.scale);
    mesh.name = skinned.name;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    parent.remove(skinned);
  }
}

function optimizeMaterials(object) {
  const matCache = new Map();
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.frustumCulled = true;
    child.castShadow = false;
    child.receiveShadow = false;
    child.matrixAutoUpdate = false;
    child.updateMatrix();

    if (!child.material) return;
    const orig = Array.isArray(child.material) ? child.material[0] : child.material;
    const key = orig.uuid;
    if (matCache.has(key)) {
      child.material = matCache.get(key);
    } else {
      const simple = new THREE.MeshBasicMaterial({
        color: orig.color || 0xcccccc,
        map: orig.map || null,
        transparent: orig.transparent || false,
        opacity: orig.opacity || 1.0,
      });
      matCache.set(key, simple);
      child.material = simple;
    }
  });
}

function stripUnusedAttributes(object) {
  object.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    if (child.geometry.attributes.skinIndex)
      child.geometry.deleteAttribute("skinIndex");
    if (child.geometry.attributes.skinWeight)
      child.geometry.deleteAttribute("skinWeight");
    if (child.geometry.attributes.tangent)
      child.geometry.deleteAttribute("tangent");
  });
}

function normalizeToHeight(model) {
  model.scale.setScalar(1);
  model.position.set(0, 0, 0);
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = size.y > 0.001 ? TARGET_HEIGHT / size.y : 1;

  model.scale.setScalar(scale);
  model.position.y = -(box.min.y * scale);
  model.updateMatrixWorld(true);
}

function cacheTemplateMeshes(name, model) {
  const meshes = [];
  model.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  templateMeshCache.set(name, meshes);
}

async function loadModelFromDisk(name) {
  const path = characterMap[name];
  if (!path) {
    console.warn("No path for:", name);
    return null;
  }

  try {
    const fbx = await loadWithTimeout(loader.loadAsync(path), LOAD_TIMEOUT);
    await yieldToBrowser();

    convertSkinnedToStatic(fbx);
    stripUnusedAttributes(fbx);
    optimizeMaterials(fbx);
    normalizeToHeight(fbx);
    cacheTemplateMeshes(name, fbx);
    setCachedModel(name, fbx);
    console.log(`Loaded: ${name}`);
    return fbx;
  } catch (error) {
    console.warn("Failed to load:", name, error.message);
    return null;
  }
}

export async function getModel(name) {
  if (hasCachedModel(name)) {
    return getCachedModel(name);
  }
  if (loadQueue.has(name)) {
    return loadQueue.get(name);
  }
  const promise = loadModelFromDisk(name);
  loadQueue.set(name, promise);
  try {
    return await promise;
  } finally {
    loadQueue.delete(name);
  }
}

export async function preloadModels(names, onProgress) {
  const total = names.length;
  for (let i = 0; i < total; i++) {
    await getModel(names[i]);
    onProgress?.((i + 1) / total);
    await yieldToBrowser();
  }
}

export function createModelInstance(cachedModel, name) {
  const templateMeshes = templateMeshCache.get(name) || [];
  const instance = new THREE.Group();
  instance.name = name;
  instance.matrixAutoUpdate = false;

  instance.scale.copy(cachedModel.scale);
  instance.position.y = cachedModel.position.y;

  for (const src of templateMeshes) {
    const mesh = new THREE.Mesh(src.geometry, src.material);
    mesh.position.copy(src.position);
    mesh.quaternion.copy(src.quaternion);
    mesh.scale.copy(src.scale);
    mesh.frustumCulled = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    instance.add(mesh);
  }

  instance.updateMatrix();
  return instance;
}

const instanceCounts = new Map();

export function trackInstanceUse(characterId) {
  instanceCounts.set(
    characterId,
    (instanceCounts.get(characterId) || 0) + 1,
  );
}

export function getInstanceCount(characterId) {
  return instanceCounts.get(characterId) || 0;
}

export function createInstancedPlacement(cachedModel, placeholders, name) {
  const templateMeshes = templateMeshCache.get(name) || [];
  if (!templateMeshes.length) return null;

  const root = new THREE.Group();
  const count = placeholders.length;

  for (const sourceMesh of templateMeshes) {
    const instanced = new THREE.InstancedMesh(
      sourceMesh.geometry,
      sourceMesh.material,
      count,
    );
    instanced.frustumCulled = true;
    instanced.matrixAutoUpdate = false;

    const matrix = new THREE.Matrix4();
    placeholders.forEach((placeholder, index) => {
      matrix.compose(
        placeholder.position,
        new THREE.Quaternion().setFromEuler(placeholder.rotation),
        placeholder.scale,
      );
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    root.add(instanced);
  }

  return root;
}
