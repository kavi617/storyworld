import * as THREE from "three";

const DB_NAME = "StoryWorldModelCache";
const DB_VERSION = 2;
const STORE_NAME = "models";
const CACHE_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedModelData(name) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(name);
      request.onsuccess = () => {
        const data = request.result || null;
        if (data && data.version !== CACHE_VERSION) {
          resolve(null);
        } else {
          resolve(data);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return null;
  }
}

export async function saveModelData(name, data) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(data, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("IndexedDB write error:", e.message);
  }
}

export function serializeModel(group) {
  const meshes = [];
  group.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  return {
    version: CACHE_VERSION,
    meshes: meshes.map((mesh) => ({
      position: mesh.geometry.attributes.position.array,
      color: mesh.geometry.attributes.color?.array || null,
      normal: mesh.geometry.attributes.normal?.array || null,
      material: {
        color: mesh.material.color?.getHex(),
        vertexColors: mesh.material.vertexColors,
        transparent: mesh.material.transparent,
        opacity: mesh.material.opacity,
      },
    })),
  };
}

export function deserializeModel(data) {
  const group = new THREE.Group();
  for (const md of data.meshes) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(md.position, 3),
    );
    if (md.color) {
      geo.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(md.color, 3),
      );
    }
    if (md.normal) {
      geo.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(md.normal, 3),
      );
    }
    const mat = new THREE.MeshBasicMaterial({
      color: md.material.color ?? 0xcccccc,
      vertexColors: !!md.material.vertexColors,
      transparent: !!md.material.transparent,
      opacity: md.material.opacity ?? 1.0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = "merged_body";
    mesh.frustumCulled = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    group.add(mesh);
  }
  return group;
}

export async function clearModelCacheDB() {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("IndexedDB clear error:", e.message);
  }
}
