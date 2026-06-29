const modelCache = {};

export function getCachedModel(name) {
  return modelCache[name] || null;
}

export function setCachedModel(name, model) {
  modelCache[name] = model;
}

export function hasCachedModel(name) {
  return Boolean(modelCache[name]);
}

export function clearModelCache() {
  for (const key of Object.keys(modelCache)) {
    delete modelCache[key];
  }
}
