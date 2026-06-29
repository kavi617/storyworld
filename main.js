/*
 * ULTRA PERFORMANCE MODE (Maximum FPS - Lag-Free)
 * =================================================
 *
 * Chunk Structure: 20x20 units - larger chunks = fewer updates
 * Render Distance: 1 chunk (20 units) - ULTRA performance
 * Unload Distance: 2 chunks (40 units) - aggressive cleanup
 *
 * Visual Style:
 * - Bright blue sky with minimal clouds (3-4 clouds max)
 * - Grass-dominated environment (90% grass for ultra-light rendering)
 * - Very rare trees (3% - minimal heavy models)
 * - Flat shading for stylized low-poly aesthetic
 * - Bright ambient lighting for cheerful atmosphere
 *
 * EXTREME Performance Optimizations:
 * 1. MINIMAL OBJECTS: Only 2-3 objects per chunk (was 3-5)
 * 2. GRASS-DOMINANT: 90% grass (was 70%) - ultra lightweight
 * 3. VERY RARE TREES: Only 3% trees (was 5%) - smaller sizes
 * 4. LARGER CHUNKS: 20x20 (was 16x16) - fewer chunk updates
 * 5. CAMERA FAR PLANE: Reduced to 100 (less rendering)
 * 6. SMALLER GROUND: 800x800 ground plane (was 1000x1000)
 * 7. MINIMAL TEXTURE REPEATS: 30x30 (was 100x100)
 * 8. NO SHADOWS: Disabled everywhere
 * 9. FLAT SHADING: Better performance
 * 10. LOW PRECISION: "lowp" shader precision
 * 11. 1x PIXEL RATIO: No high-DPI overhead
 * 12. FEWER CLOUDS: 3-4 clouds (was 4-6)
 * 13. AUDIO CHECK THROTTLE: Check walk sound every 5 frames (not every frame)
 * 14. TIGHTER FOG: 20-35 units (less rendering)
 *
 * Object Distribution (per chunk):
 * - 2-3 objects per chunk (ULTRA OPTIMIZED)
 * - 3% Trees (VERY RARE - smaller sizes)
 * - 7% Rocks (tiny rocks only)
 * - 90% Grass (ULTRA LIGHTWEIGHT - dominant)
 * - Total loaded: ~18-27 objects in view (9 chunks × 2-3 objects)
 *
 * Expected FPS: 60+ (optimized for smooth, lag-free gameplay)
 */

import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { entity } from "./entity.js";
import { entity_manager } from "./entity-manager.js";
import { player_entity } from "./player-entity.js";
import { player_input } from "./player-input.js";
import { third_person_camera } from "./third-person-camera.js";
import {
  initTempleWorld,
  getNPCSpawnPositions,
  getCollisionMeshes,
  getGroundMeshes,
} from "./architecture_world.js";
import {
  initWaterWorld,
  animateWater,
  getCollisionMeshes as getWaterCollisionMeshes,
  getGroundMeshes as getWaterGroundMeshes,
} from "./water-management-world.js";
import { integrateSceneCharacters } from "./SceneIntegrator.js";
import { gameLoading } from "./GameLoading.js";

console.log("Imports loaded successfully");

// Check game configuration from menu (must be first!)
const gameConfig = window.gameConfig || {
  world: "nature",
  soundEnabled: true,
  playerName: "வீரர்",
};
console.log(
  "⚡ ULTRA PERFORMANCE MODE: 2-3 objects/chunk, 90% grass, 3% trees, lag-free",
);
console.log(
  `🎮 World: ${gameConfig.world} | Player: ${gameConfig.playerName} | Sound: ${gameConfig.soundEnabled ? "ON" : "OFF"}`,
);

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SCREEN MANAGEMENT - Unified with GameLoading.js
// ═══════════════════════════════════════════════════════════════════════════

window.gameLoaded = false; // Global flag to prevent interaction during loading

// Initialize loading system
if (window.gameLoading) {
  window.gameLoading.init(gameConfig.world);
  window.gameLoading.activate();
}

// Safety timeout - force-complete loading after 90 seconds max (120MB FBX files)
const LOADING_SAFETY_TIMEOUT = 90000;
setTimeout(() => {
  if (!window.gameLoaded) {
    console.warn("⚠️ Loading safety timeout reached - force starting game");
    if (window.gameLoading) {
      ["characters", "player", "world"].forEach(t => window.gameLoading.completeTask(t));
    }
    window.gameLoaded = true;
  }
}, LOADING_SAFETY_TIMEOUT);

// Stub for chunk system (only used in nature world, but defined globally to prevent errors)
let updateChunks = () => {}; // No-op by default, will be overridden in nature world

// Expose collision and ground meshes globally for player physics
// Use appropriate getters based on world type
if (gameConfig.world === "water") {
  window.getCollisionMeshes = getWaterCollisionMeshes;
  window.getGroundMeshes = getWaterGroundMeshes;
} else {
  // Architecture and nature worlds use architecture getters (or empty for nature)
  window.getCollisionMeshes = getCollisionMeshes;
  window.getGroundMeshes = getGroundMeshes;
}

// DEV ONLY: FPS Counter - easily removable
const fpsElement = document.getElementById("fps");
// DEV ONLY: Coordinates display - easily removable
const coordsElement = document.getElementById("coords");
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

// Scene setup - Bright Daytime Forest (Ultra Performance)
const scene = new THREE.Scene();

// Set background color based on world type
if (gameConfig.world === "architecture") {
  scene.background = new THREE.Color(0x87ceeb); // Bright daytime sky blue
} else if (gameConfig.world === "water") {
  scene.background = new THREE.Color(0xb0d8f0); // Blueish sky for water world
} else {
  scene.background = new THREE.Color(0x87ceeb); // Bright sky blue for nature world
}

// Fog will be added conditionally based on world type
if (gameConfig.world === "nature") {
  scene.fog = new THREE.Fog(0xd4e8f0, 20, 35); // Tighter fog for forest
}
// No fog for architecture and water worlds - clear view

console.log("Scene created");

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.5, // Increased near plane to prevent clipping issues
  gameConfig.world === "architecture" || gameConfig.world === "water"
    ? 500
    : 100, // Larger far plane for temple and water worlds
);

// Set initial camera position based on world type
if (gameConfig.world === "architecture") {
  // Player spawns at Z=80 facing -Z (toward temple). Camera behind player.
  camera.position.set(0, 15, 95);
  camera.lookAt(0, 5, 0);
  console.log("📍 Camera positioned behind player facing temple");
} else if (gameConfig.world === "water") {
  // Water world - elevated view to see entire water management system
  camera.position.set(-30, 50, 100); // Higher view to see all areas
  camera.lookAt(-40, 1, 120); // Looking at farmland area
  console.log("📍 Camera positioned for Kaveri River world");
} else {
  // Nature world - default position
  camera.position.set(0, 10, 15);
}

// Renderer with ULTRA performance optimizations
const renderer = new THREE.WebGLRenderer({
  antialias: false, // Disable antialiasing for performance
  powerPreference: "high-performance", // Request high-performance GPU
  precision: "lowp", // Low precision for maximum performance
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Force 1x pixel ratio for max performance
renderer.shadowMap.enabled = false; // Disable shadows for major performance boost
document.body.appendChild(renderer.domElement);

// Enable frustum culling (Minecraft-style optimization)
camera.matrixAutoUpdate = true;

// Lighting
if (gameConfig.world === "architecture") {
  // Temple world: Even ambient-only daytime — no directional light to avoid bright patches
  const templeAmbient = new THREE.AmbientLight(0xfff8f0, 0.75); // Reduced — prevents texture overexposure
  scene.add(templeAmbient);
} else if (gameConfig.world === "water") {
  // Water world - blueish atmosphere with directional light
  const waterAmbient = new THREE.AmbientLight(0xe0f0ff, 0.7); // Blueish ambient
  scene.add(waterAmbient);

  const waterSun = new THREE.DirectionalLight(0xffffff, 0.8);
  waterSun.position.set(50, 100, 30);
  waterSun.castShadow = false;
  scene.add(waterSun);

  // Add blue fog for atmospheric depth
  scene.fog = new THREE.Fog(0xb0d8f0, 50, 200);
} else {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Bright white ambient for vibrant look
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffee, 0.7); // Bright sun
  directionalLight.position.set(50, 80, 30);
  directionalLight.castShadow = false; // Shadows DISABLED for performance
  scene.add(directionalLight);
}

// Load Forest Theme 1 Textures (ALL TEXTURES - Random Application)
const textureLoader = new THREE.TextureLoader();
const texturePath = "Theme/Forest Theme 1/Textures/";

// Helper function to load texture with performance settings
function loadTexture(filename) {
  const tex = textureLoader.load(texturePath + filename);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// Load ground texture (path rocks for dirt path look)
const groundTexture = loadTexture("Rocks_Diffuse.png");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50); // Minimal repeats for best performance

// Load ALL bark textures (for trees)
const barkTextures = [
  loadTexture("Bark_NormalTree.png"),
  loadTexture("Bark_DeadTree.png"),
  loadTexture("Bark_TwistedTree.png"),
];

// Load ALL leaf textures (for trees)
const leafTextures = [
  loadTexture("Leaves_NormalTree.png"),
  loadTexture("Leaves_NormalTree_C.png"),
  loadTexture("Leaves_TwistedTree.png"),
  loadTexture("Leaves_TwistedTree_C.png"),
  loadTexture("Leaf_Pine.png"),
  loadTexture("Leaf_Pine_C.png"),
  loadTexture("Leaves.png"),
  loadTexture("Leaves_GiantPine_C.png"),
];

// Load ALL vegetation textures (grass, flowers, mushrooms)
const vegetationTextures = [
  loadTexture("Grass.png"),
  loadTexture("Flowers.png"),
  loadTexture("Mushrooms.png"),
];

// Load ALL rock textures
const rockTextures = [
  loadTexture("Rocks_Diffuse.png"),
  loadTexture("Rocks_Desert_Diffuse.png"),
  loadTexture("PathRocks_Diffuse.png"),
];

console.log(
  "All textures loaded: bark, leaves, vegetation (grass/flowers/mushrooms), rocks",
);

// Ground plane - Infinite forest floor (Ultra Performance)
// DISABLED FOR ARCHITECTURE WORLD - Will be added in nature world section only
/*
const groundGeometry = new THREE.PlaneGeometry(800, 800); // Smaller plane for better FPS
const groundMaterial = new THREE.MeshBasicMaterial({
    map: groundTexture,
    color: 0xd4b896, // Bright sandy/dirt path color like preview
    side: THREE.FrontSide // Only visible from above (prevent seeing through from below)
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = false;
scene.add(ground);
*/

// CLOUD SYSTEM - Dynamic Sky (Performance Optimized)
// DISABLED FOR ARCHITECTURE WORLD - Will be added in nature world section only
/*
const gltfLoader = new GLTFLoader();
const cloudPath = 'Theme/Clouds Theme/';
const cloudModels = ['Cloud1.glb', 'Cloud2.glb', 'Cloud3.glb'];
const loadedClouds = [];
let cloudsLoaded = 0;

// Load all cloud models
cloudModels.forEach((cloudFile, index) => {
    gltfLoader.load(cloudPath + cloudFile, (gltf) => {
        loadedClouds[index] = gltf.scene;
        cloudsLoaded++;
        
        // Once all clouds loaded, spawn them in sky
        if (cloudsLoaded === cloudModels.length) {
            spawnCloudsInSky();
        }
    }, undefined, (error) => {
        console.error('Error loading cloud:', cloudFile, error);
    });
});

// Spawn clouds in the sky (3-4 clouds for maximum performance)
function spawnCloudsInSky() {
    const numClouds = 3 + Math.floor(Math.random() * 2); // 3-4 clouds only
    
    for (let i = 0; i < numClouds; i++) {
        // Random cloud model
        const cloudModel = loadedClouds[Math.floor(Math.random() * loadedClouds.length)];
        const cloud = cloudModel.clone();
        
        // Random position in sky (closer for performance)
        const angle = (Math.random() * Math.PI * 2);
        const distance = 35 + Math.random() * 40; // 35-75 units away (closer)
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = 10 + Math.random() * 10; // 10-20 units high (lower)
        
        cloud.position.set(x, y, z);
        
        // Random rotation
        cloud.rotation.y = Math.random() * Math.PI * 2;
        
        // Random scale (smaller for performance)
        const scale = 0.6 + Math.random() * 0.4; // 0.6 to 1.0 (smaller)
        cloud.scale.setScalar(scale);
        
        // Optimize materials for performance
        cloud.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
                // Replace with white MeshBasicMaterial (unaffected by fog or lighting)
                child.material = new THREE.MeshBasicMaterial({
                    color: 0xffffff, // Pure white
                    fog: false // Clouds not affected by fog
                });
            }
        });
        
        scene.add(cloud);
    }
    
    console.log(`${numClouds} clouds spawned in sky`);
}
*/
// END OF DISABLED NATURE-WORLD-ONLY CODE

// ═══════════════════════════════════════════════════════════════════════════
// WORLD LOADING - Check world type and load appropriate environment
// ═══════════════════════════════════════════════════════════════════════════

if (gameConfig.world === "architecture") {
  // ═══════════════════════════════════════════════════════════════════════
  // 🏛️ TEMPLE WORLD (Brihadeeswarar Temple)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("🏛️ Loading Thanjavur Periya Kovil (Big Temple) FBX Model...");
  console.log("   ⚠️ If you see old temple, HARD REFRESH: Ctrl+Shift+F5");

  // Clear fog for temple world
  scene.fog = null;

  // Initialize temple environment (loads FBX model)
  initTempleWorld(scene);

  // Complete world loading task
  if (window.gameLoading) {
    window.gameLoading.completeTask("world");
  }

  console.log("✅ Temple World Loaded");
} else if (gameConfig.world === "water") {
  // ═══════════════════════════════════════════════════════════════════════
  // 💧 WATER MANAGEMENT WORLD (Chola Irrigation System)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("💧 Loading Chola Water Management System...");
  console.log("   Features: Stone dam, sluice gates, canals, tank (eri)");

  // Clear fog for water world
  scene.fog = null;

  // Initialize water management environment
  initWaterWorld(scene);

  // Water world loaded synchronously - mark task complete
  if (window.gameLoading) {
    window.gameLoading.completeTask("world");
  }

  console.log("✅ Water Management World Loaded");
} else {
  // ═══════════════════════════════════════════════════════════════════════
  // 🌲 NATURE/FOREST WORLD (Default)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("🌲 Loading Nature/Forest World...");

  // Ground plane - Infinite forest floor (Ultra Performance)
  const groundGeometry = new THREE.PlaneGeometry(800, 800); // Smaller plane for better FPS
  const groundMaterial = new THREE.MeshBasicMaterial({
    map: groundTexture,
    color: 0xd4b896, // Bright sandy/dirt path color like preview
    side: THREE.FrontSide, // Only visible from above (prevent seeing through from below)
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = false;
  scene.add(ground);

  // CLOUD SYSTEM - Dynamic Sky (Performance Optimized)
  const gltfLoader = new GLTFLoader();
  const cloudPath = "Theme/Clouds Theme/";
  const cloudModels = ["Cloud1.glb", "Cloud2.glb", "Cloud3.glb"];
  const loadedClouds = [];
  let cloudsLoaded = 0;

  // Load all cloud models
  cloudModels.forEach((cloudFile, index) => {
    gltfLoader.load(
      cloudPath + cloudFile,
      (gltf) => {
        loadedClouds[index] = gltf.scene;
        cloudsLoaded++;

        // Once all clouds loaded, spawn them in sky
        if (cloudsLoaded === cloudModels.length) {
          spawnCloudsInSky();
        }
      },
      undefined,
      (error) => {
        console.error("Error loading cloud:", cloudFile, error);
      },
    );
  });

  // Spawn clouds in the sky (3-4 clouds for maximum performance)
  function spawnCloudsInSky() {
    const numClouds = 3 + Math.floor(Math.random() * 2); // 3-4 clouds only

    for (let i = 0; i < numClouds; i++) {
      // Random cloud model
      const cloudModel =
        loadedClouds[Math.floor(Math.random() * loadedClouds.length)];
      const cloud = cloudModel.clone();

      // Random position in sky (closer for performance)
      const angle = Math.random() * Math.PI * 2;
      const distance = 35 + Math.random() * 40; // 35-75 units away (closer)
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = 10 + Math.random() * 10; // 10-20 units high (lower)

      cloud.position.set(x, y, z);

      // Random rotation
      cloud.rotation.y = Math.random() * Math.PI * 2;

      // Random scale (smaller for performance)
      const scale = 0.6 + Math.random() * 0.4; // 0.6 to 1.0 (smaller)
      cloud.scale.setScalar(scale);

      // Optimize materials for performance
      cloud.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          // Replace with white MeshBasicMaterial (unaffected by fog or lighting)
          child.material = new THREE.MeshBasicMaterial({
            color: 0xffffff, // Pure white
            fog: false, // Clouds not affected by fog
          });
        }
      });

      scene.add(cloud);
    }

    console.log(`${numClouds} clouds spawned in sky`);
  }

  // Forest Theme 1 Environment Loader with custom loading manager
  // This redirects texture requests from FBX folder to Textures folder
  const loadingManager = new THREE.LoadingManager();
  loadingManager.setURLModifier((url) => {
    // If the URL is trying to load a texture from the FBX folder, redirect to Textures folder
    if (
      url.includes("Theme/Forest Theme 1/FBX/") &&
      (url.endsWith(".png") || url.endsWith(".jpg"))
    ) {
      return url.replace(
        "Theme/Forest Theme 1/FBX/",
        "Theme/Forest Theme 1/Textures/",
      );
    }
    return url;
  });

  const envLoader = new FBXLoader(loadingManager);
  const forestPath = "Theme/Forest Theme 1/FBX/";

  // Helper function to load and place forest models with appropriate textures
  function loadForestModel(
    filename,
    position,
    scale = 1,
    rotation = 0,
    textureOverride = null,
  ) {
    envLoader.load(
      forestPath + filename,
      (fbx) => {
        fbx.scale.setScalar(scale);
        fbx.position.set(position.x, position.y, position.z);
        fbx.rotation.y = rotation;
        fbx.traverse((c) => {
          c.castShadow = true;
          c.receiveShadow = true;
          // Apply appropriate textures based on model type
          if (c.isMesh && c.material) {
            const materials = Array.isArray(c.material)
              ? c.material
              : [c.material];
            materials.forEach((mat) => {
              if (textureOverride) {
                mat.map = textureOverride;
                mat.needsUpdate = true;
              } else if (
                filename.includes("CommonTree") ||
                filename.includes("Pine") ||
                filename.includes("TwistedTree") ||
                filename.includes("DeadTree")
              ) {
                // Trees use their embedded textures (loaded via LoadingManager)
                // Only apply if no texture is loaded
                if (!mat.map) {
                  if (filename.includes("CommonTree")) {
                    mat.map = leavesNormalTexture;
                  } else if (filename.includes("Pine")) {
                    mat.map = leafPineTexture;
                  } else if (filename.includes("TwistedTree")) {
                    mat.map = leavesTwistedTexture;
                  } else if (filename.includes("DeadTree")) {
                    mat.map = barkDeadTexture;
                  }
                  mat.needsUpdate = true;
                }
              } else if (
                filename.includes("Rock") ||
                filename.includes("Pebble")
              ) {
                mat.map = rocksTexture;
                mat.needsUpdate = true;
              } else if (
                filename.includes("Grass") ||
                filename.includes("Clover") ||
                filename.includes("Fern")
              ) {
                mat.map = grassTexture;
                mat.needsUpdate = true;
              } else if (
                filename.includes("Flower") ||
                filename.includes("Petal")
              ) {
                mat.map = flowersTexture;
                mat.needsUpdate = true;
              } else if (
                filename.includes("Bush") ||
                filename.includes("Plant")
              ) {
                mat.map = leavesNormalTexture;
                mat.needsUpdate = true;
              }
            });
          }
        });
        scene.add(fbx);
      },
      undefined,
      (error) => {
        console.error("Error loading", filename, ":", error);
      },
    );
  }

  // Tree types from Forest Theme 1
  const livingTreeTypes = [
    "CommonTree_1.fbx",
    "CommonTree_2.fbx",
    "CommonTree_3.fbx",
    "CommonTree_4.fbx",
    "CommonTree_5.fbx",
    "Pine_1.fbx",
    "Pine_2.fbx",
    "Pine_3.fbx",
    "Pine_4.fbx",
    "Pine_5.fbx",
    "TwistedTree_1.fbx",
    "TwistedTree_2.fbx",
    "TwistedTree_3.fbx",
    "TwistedTree_4.fbx",
    "TwistedTree_5.fbx",
  ];

  const deadTreeTypes = [
    "DeadTree_1.fbx",
    "DeadTree_2.fbx",
    "DeadTree_3.fbx",
    "DeadTree_4.fbx",
    "DeadTree_5.fbx",
  ];

  // Rock types from Forest Theme 1 - ALL VARIANTS
  const rockTypes = [
    // Path rocks
    "RockPath_Round_Small_1.fbx",
    "RockPath_Round_Small_2.fbx",
    "RockPath_Round_Small_3.fbx",
    "RockPath_Round_Thin.fbx",
    "RockPath_Round_Wide.fbx",
    "RockPath_Square_Small_1.fbx",
    "RockPath_Square_Small_2.fbx",
    "RockPath_Square_Small_3.fbx",
    "RockPath_Square_Thin.fbx",
    "RockPath_Square_Wide.fbx",
    // Medium rocks
    "Rock_Medium_1.fbx",
    "Rock_Medium_2.fbx",
    "Rock_Medium_3.fbx",
    // Pebbles
    "Pebble_Round_1.fbx",
    "Pebble_Round_2.fbx",
    "Pebble_Round_3.fbx",
    "Pebble_Round_4.fbx",
    "Pebble_Round_5.fbx",
    "Pebble_Square_1.fbx",
    "Pebble_Square_2.fbx",
    "Pebble_Square_3.fbx",
    "Pebble_Square_4.fbx",
    "Pebble_Square_5.fbx",
    "Pebble_Square_6.fbx",
  ];

  // Bush and Plant types from Forest Theme 1
  const bushTypes = [
    "Bush_Common.fbx",
    "Bush_Common_Flowers.fbx",
    "Plant_1.fbx",
    "Plant_1_Big.fbx",
    "Plant_7.fbx",
    "Plant_7_Big.fbx",
    "Fern_1.fbx",
  ];

  // Grass and flower types from Forest Theme 1 - ALL VARIANTS
  const grassTypes = [
    "Grass_Common_Short.fbx",
    "Grass_Common_Tall.fbx",
    "Grass_Wispy_Short.fbx",
    "Grass_Wispy_Tall.fbx",
    "Clover_1.fbx",
    "Clover_2.fbx",
    "Flower_3_Group.fbx",
    "Flower_4_Group.fbx",
    "Flower_3_Single.fbx",
    "Flower_4_Single.fbx",
    "Petal_1.fbx",
    "Petal_2.fbx",
    "Petal_3.fbx",
    "Petal_4.fbx",
    "Petal_5.fbx",
  ];

  // MINECRAFT-STYLE CHUNK SYSTEM (ULTRA PERFORMANCE)
  const CHUNK_SIZE = 20; // Larger chunks = fewer chunk updates
  const RENDER_DISTANCE = 1; // Only 1 chunk away (20 units) - MAXIMUM performance
  const UNLOAD_DISTANCE = 2; // Unload at 2 chunks (40 units) - aggressive cleanup
  const loadedChunks = new Map(); // Store loaded chunk data with mesh references
  let lastChunkUpdate = { x: 999, z: 999 }; // Force initial update

  // Material cache to prevent duplicate texture loads
  const materialCache = new Map();

  // Chunk loading queue for async loading
  const chunkLoadQueue = [];
  let isLoadingChunk = false;

  // Seeded random for consistent chunk generation (Perlin-like)
  function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
  }

  function getChunkCoords(worldX, worldZ) {
    return {
      x: Math.floor(worldX / CHUNK_SIZE),
      z: Math.floor(worldZ / CHUNK_SIZE),
    };
  }

  // Calculate distance between two chunks
  function chunkDistance(x1, z1, x2, z2) {
    const dx = x1 - x2;
    const dz = z1 - z2;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // Modified loadForestModel - ULTRA OPTIMIZED (Simplified Materials)
  function loadForestModelTracked(
    filename,
    position,
    scale,
    rotation,
    callback,
  ) {
    envLoader.load(forestPath + filename, (fbx) => {
      fbx.scale.setScalar(scale);
      fbx.position.set(position.x, position.y, position.z);
      fbx.rotation.y = rotation;
      fbx.traverse((c) => {
        c.castShadow = false;
        c.receiveShadow = false;
        // ULTRA optimized materials - minimal texture application
        if (c.isMesh && c.material) {
          const materials = Array.isArray(c.material)
            ? c.material
            : [c.material];
          materials.forEach((mat) => {
            mat.flatShading = true;
            // Only apply texture if needed (skip for grass to save GPU)
            if (filename.includes("Tree")) {
              if (!mat.map) mat.map = leafTextures[0]; // Use first texture only
            } else if (filename.includes("Rock")) {
              mat.map = rockTextures[0]; // Use first texture only
            }
            // Grass uses embedded textures or no texture for max performance
            mat.needsUpdate = true;
          });
        }
      });
      scene.add(fbx);
      if (callback) callback(fbx);
    });
  }

  // Spawn objects in a specific chunk - INSTANT GENERATION (Minecraft-style)
  function populateChunk(chunkX, chunkZ) {
    const chunkKey = getChunkKey(chunkX, chunkZ);

    // Skip if already loaded
    if (loadedChunks.has(chunkKey)) return;

    // Mark as loading immediately to prevent duplicates
    const chunkMeshes = [];
    loadedChunks.set(chunkKey, {
      meshes: chunkMeshes,
      x: chunkX,
      z: chunkZ,
      loading: true,
    });

    const seed = (chunkX * 73856093) ^ (chunkZ * 19349663);
    const baseX = chunkX * CHUNK_SIZE;
    const baseZ = chunkZ * CHUNK_SIZE;

    let rng = seed;
    const random = () => {
      rng++;
      return seededRandom(rng);
    };

    // ULTRA PERFORMANCE POPULATION (Grass-Heavy)
    // Spawn 2-3 objects per chunk, mostly lightweight grass

    const numObjects = 2 + Math.floor(random() * 2); // 2-3 objects per chunk (reduced from 3-5)

    for (let i = 0; i < numObjects; i++) {
      const x = baseX + random() * CHUNK_SIZE;
      const z = baseZ + random() * CHUNK_SIZE;
      const rotation = random() * Math.PI * 2;

      const spawnType = random();

      if (spawnType < 0.03) {
        // 3% chance: Tree (VERY RARE - trees are heavy)
        const treeArray = livingTreeTypes;
        const treeType = treeArray[Math.floor(random() * treeArray.length)];

        let scale;
        if (treeType.includes("Pine"))
          scale = 0.005 + random() * 0.001; // Even smaller
        else scale = 0.006 + random() * 0.002; // Even smaller trees

        loadForestModelTracked(
          treeType,
          { x, y: 0, z },
          scale,
          rotation,
          (mesh) => {
            if (mesh) chunkMeshes.push(mesh);
          },
        );
      } else if (spawnType < 0.1) {
        // 7% chance: Rock (small only)
        const rockType = rockTypes[Math.floor(random() * rockTypes.length)];
        const scale = 0.002 + random() * 0.001; // Smaller rocks

        loadForestModelTracked(
          rockType,
          { x, y: 0, z },
          scale,
          rotation,
          (mesh) => {
            if (mesh) chunkMeshes.push(mesh);
          },
        );
      } else {
        // 90% chance: GRASS ONLY (ultra lightweight, most common)
        const grassType = grassTypes[Math.floor(random() * grassTypes.length)];
        const scale = 0.004 + random() * 0.002; // Smaller grass

        loadForestModelTracked(
          grassType,
          { x, y: 0, z },
          scale,
          rotation,
          (mesh) => {
            if (mesh) chunkMeshes.push(mesh);
          },
        );
      }
    }
  }

  // No queue processing needed - instant generation

  // Unload a chunk and remove its objects from scene
  function unloadChunk(chunkKey) {
    const chunk = loadedChunks.get(chunkKey);
    if (!chunk) return;

    // Remove all meshes from scene
    chunk.meshes.forEach((mesh) => {
      if (mesh && mesh.parent) {
        scene.remove(mesh);
        // Dispose geometry and materials
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    loadedChunks.delete(chunkKey);
  }

  // Update chunks based on player position - INSTANT (Minecraft-style)
  updateChunks = function (playerX, playerZ) {
    const playerChunk = getChunkCoords(playerX, playerZ);

    // Update EVERY time player moves to different chunk (no throttling)
    const movedChunk =
      playerChunk.x !== lastChunkUpdate.x ||
      playerChunk.z !== lastChunkUpdate.z;

    if (!movedChunk) return;

    lastChunkUpdate = playerChunk;

    // Load chunks in square around player - INSTANT
    const chunksToKeep = new Set();

    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const x = playerChunk.x + dx;
        const z = playerChunk.z + dz;
        const key = getChunkKey(x, z);
        chunksToKeep.add(key);

        // Populate instantly
        populateChunk(x, z);
      }
    }

    // Unload chunks beyond unload distance - INSTANT
    const chunksToUnload = [];
    for (const [key, chunk] of loadedChunks.entries()) {
      if (!chunk.loading) {
        // Don't unload chunks that are still loading
        const dist = chunkDistance(
          chunk.x,
          chunk.z,
          playerChunk.x,
          playerChunk.z,
        );
        if (dist > UNLOAD_DISTANCE) {
          chunksToUnload.push(key);
        }
      }
    }

    // Unload immediately
    chunksToUnload.forEach((key) => unloadChunk(key));
  };

  // Initialize - load spawn chunk
  console.log(
    "Minecraft-style instant chunk system: 16x16, Render: 3, Objects: 1-2 per chunk",
  );

  // Create nature world NPC placeholders
  (function createNaturePlaceholders() {
    const natureSpawns = {
      senguttuvan_cheran: { x: 8, y: 0, z: 5 },
      aditya_chola: { x: -8, y: 0, z: 8 },
      nedunjeliyan_1: { x: 12, y: 0, z: -3 },
    };
    for (const [name, pos] of Object.entries(natureSpawns)) {
      const mesh = new THREE.Object3D();
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = Math.PI;
      mesh.name = name;
      mesh.userData.isNPC = true;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      scene.add(mesh);
    }
    console.log("NPC placeholders created for nature world");
  })();
} // End of Nature/Forest World loading

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTER LOADING (All worlds) - Async, non-blocking
// ═══════════════════════════════════════════════════════════════════════════

let rajaModel = null;
window.rajaModel = null;

// Load characters via SceneIntegrator (replaces placeholders with FBX models)
// SceneIntegrator handles loading task completion internally
(function loadCharactersAsync() {
  integrateSceneCharacters(scene, gameConfig.world).then(() => {
    // Collect all placed NPCs for efficient proximity checks
    const npcObjects = [];
    scene.traverse((obj) => {
      if (obj.userData?.isNPC && obj.userData?.npcName) {
        npcObjects.push(obj);
      }
    });
    window.npcObjects = npcObjects;

    // Set raja reference for backward compatibility
    const raja = scene.getObjectByName('raja_raja_cholan');
    if (raja) {
      rajaModel = raja;
      window.rajaModel = raja;
      window.rajaModel.userData.isNPC = true;
      window.rajaModel.userData.npcName = "raja_raja_cholan";
      window.rajaModel.userData.hasPlayedIntro = false;
    }
  }).catch(err => {
    console.warn("Character loading error:", err);
  });
})();

console.log("Scene initialized");

// Entity Manager
const entityManager = new entity_manager.EntityManager();

// Player Entity
const playerEntity = new entity.Entity();
entityManager.Add(playerEntity, "player");

// Add player input component
const input = new player_input.BasicCharacterControllerInput({});
playerEntity.AddComponent(input);
console.log("Input component added");

// Add player controller component
const playerController = new player_entity.BasicCharacterController({
  scene: scene,
  camera: camera,
});
playerEntity.AddComponent(playerController);
console.log("Player controller added");

// Add third-person camera component
const cameraComponent = new third_person_camera.ThirdPersonCamera({
  camera: camera,
  target: playerEntity,
});
playerEntity.AddComponent(cameraComponent);
console.log("Camera component added, camera at:", camera.position);

// Player setup complete - mark loading task
if (window.gameLoading) {
  window.gameLoading.completeTask("player");
}

// Mouse look controls
let mouseRotationY = 0; // Horizontal rotation
let mouseRotationX = 0; // Vertical rotation (up/down)
let isPointerLocked = false;

const instructions = document.getElementById("instructions");
const crosshair = document.getElementById("crosshair");

// Pointer lock for mouse control
document.body.addEventListener("click", () => {
  // Don't allow pointer lock until game is loaded
  if (!window.gameLoaded) {
    return;
  }
  document.body.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === document.body) {
    isPointerLocked = true;
    instructions.style.display = "none";
    crosshair.classList.add("active");

    // Start ambient sound when game starts (first pointer lock)
    if (ambienceAudio && ambienceAudio.paused) {
      ambienceAudio
        .play()
        .catch((e) => console.log("Ambience autoplay prevented:", e));
    }

    console.log("Pointer locked - use mouse to look around");
  } else {
    isPointerLocked = false;
    instructions.style.display = "block";
    crosshair.classList.remove("active");
    console.log("Pointer unlocked - press ESC to release, click to lock again");
  }
});

document.addEventListener("mousemove", (event) => {
  if (isPointerLocked) {
    mouseRotationY -= event.movementX * 0.002;
    mouseRotationX -= event.movementY * 0.002;

    // Restrict vertical rotation to prevent camera going through ground
    // Allow looking up more than down to avoid ground clipping
    mouseRotationX = Math.max(
      -Math.PI / 6,
      Math.min(Math.PI / 3, mouseRotationX),
    ); // -30° down, +60° up

    // Update camera component with new rotation
    cameraComponent._mouseRotationY = mouseRotationY;
    cameraComponent._mouseRotationX = mouseRotationX;
  }
});

// Mouse wheel zoom
document.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    // Get current zoom distance
    const currentZoom = cameraComponent._zoomDistance;

    // Adjust zoom based on wheel delta (positive = zoom out, negative = zoom in)
    const zoomSpeed = 0.5;
    const newZoom = currentZoom + event.deltaY * 0.01 * zoomSpeed;

    // Update camera zoom
    cameraComponent.SetZoom(newZoom);
  },
  { passive: false },
);

// AUDIO SYSTEM - Optimized for 60 fps
let ambienceAudio = null;
let walkAudio = null;
let isWalkSoundPlaying = false;

// Load and setup audio (lazy loading for performance)
function setupAudio() {
  if (!gameConfig.soundEnabled) {
    console.log("Audio disabled by player settings");
    return;
  }

  // Forest ambience - looping background
  ambienceAudio = new Audio("SFX/forest_amience.mp3");
  ambienceAudio.loop = true;
  ambienceAudio.volume = 0.008; // Subtle background volume
  ambienceAudio.preload = "auto"; // Preload for smooth playback

  // Walk sound - plays when moving
  walkAudio = new Audio("SFX/walk.mp3");
  walkAudio.loop = true;
  walkAudio.volume = 0.4;
  walkAudio.preload = "auto";

  console.log("Audio system initialized (optimized)");
}

// Initialize audio
setupAudio();

// ==================== NPC CLICK DETECTION ====================

const NPC_DISPLAY_NAMES = {
  senguttuvan_cheran: "செங்குட்டுவன் சேரன்",
  aditya_chola: "ஆதித்த சோழன்",
  nedunjeliyan_1: "நெடுஞ்செழியன் I",
  raja_raja_cholan: "இராஜராஜ சோழன்",
  kulasekara_pandya: "குலசேகர பாண்டியன்",
  cheraman_perumal: "சேரமான் பெருமாள்",
  karikala_cholan: "கரிகால சோழன்",
  uthiyan_cheralathan: "உதியன் சேரலாதன்",
  ariyan_nedunjeliyan_2: "அரியன் நெடுஞ்செழியன் II",
};

const NPC_SCRIPTS = {
  senguttuvan_cheran: "மேற்குத் தொடர்ச்சி மலைகள் பழங்காலக் காவலர்களைப் போல உயர்ந்து நிற்கும் மலைகளுக்கும் காடுகளுக்கும் அதிபதியான சேரன் செங்குட்டுவன் நான். சந்தனம், மிளகு மற்றும் ஏலக்காய் விளையும் காடுகளே என் நாட்டின் செழிப்பிற்கு அடிப்படையாகத் திகழ்ந்தன; இங்கிருந்து விளைபொருட்கள் மலைப்பாதைகள் வழியாக முசிறி எனும் பெரும் துறைமுகத்திற்கு எடுத்துச் செல்லப்பட்டன. தென்னக மன்னர்கள் வெகு சிலரே துணிந்து மேற்கொண்ட செயலான புனித கங்கை நோக்கிய பயணத்தை நான் மேற்கொண்டேன்; அங்கு சென்று கண்ணகியின் திருவுருவத்தைச் செதுக்குவதற்கான கல்லை எடுத்து வந்தேன். அதைக் கொண்டு முதல் பத்தினி-கண்ணகி கோயிலை அமைத்தேன்; இதன் மூலம் நீதி மற்றும் தூய்மையைப் போற்றும் ஒரு வழிபாட்டு முறையை உருவாக்கி என் மக்களை ஒன்றிணைத்தேன். காட்டுப் பகுதி வணிகப் பாதைகளை வலுப்படுத்தினேன், மலைப்பாதைகளைப் பாதுகாப்பான அரண்களாக மாற்றினேன், மேலும் மேற்குக் கடற்கரையோரம் கடற்படை வலிமையையும் பெருக்கினேன். காடுகள் நிறைந்த சேர நாட்டைத் துறைமுகங்கள், வழிபாட்டுத் தலங்கள் மற்றும் மலைக்கோட்டைகள் கொண்ட ஒரு செழிப்பான கட்டமைப்பாக மாற்றியதே எனது மிகப்பெரிய சாதனையாகும்; இதன் மூலம், மிகவும் கரடுமுரடான நிலப்பகுதிகள் கூட ஒரு வலிமையான பேரரசின் மையமாகத் திகழ முடியும் என்பதை நான் நிரூபித்தேன்.",
  aditya_chola: "சோழ வம்சத்தை மீட்டெடுத்து, அதன் இழந்த பெருமையை மீண்டும் நிலைநாட்டிய மன்னன் நானே ஆதித்த சோழன். பல்லவர்கள் வலிமை குன்றியிருந்த வேளையில், அவர்களின் முக்கியப் பகுதிகளைக் கைப்பற்றி சோழர் ஆட்சியை மீண்டும் நிலைநிறுத்தினேன். கொங்கு நாட்டின் அடர்ந்த மலைப்பகுதிகளை என் ஆட்சியின் கீழ் கொண்டு வந்ததுடன், காளஹஸ்தியில் உள்ள புகழ்பெற்ற கருங்கல் கோயில் உட்பட அப்பகுதி முழுவதும் பல கோயில்களை எழுப்பினேன். காட்டுப் பகுதி குடியேற்றங்களைச் சீரமைத்து, கிராம நிர்வாகத்தை வலுப்படுத்தியதுடன், பிற்காலத்தில் என் வழித்தோன்றல்கள் உருவாக்கவிருந்த பிரம்மாண்டமான கட்டிடக்கலைக்கு அடித்தளத்தையும் அமைத்தேன். சோழப் பேரரசை மீட்டெடுத்ததே எனது ஆகச்சிறந்த சாதனையாகும்; அதன் ராணுவத்தை வலுப்படுத்தியது, இழந்த நிலங்களை மீட்டது மற்றும் அதனைத் தொடர்ந்து வந்த பொற்காலத்திற்கான அடித்தளத்தை அமைத்தது ஆகியவை இதில் அடங்கும். ஒழுக்கம், வியூகம் மற்றும் தொலைநோக்குப் பார்வை ஆகியவற்றின் மூலம், காடுகள் சூழ்ந்த எல்லைப் பகுதிகளை வளர்ந்து வந்த ஒரு பேரரசின் முதுகெலும்பாக நான் மாற்றினேன்.",
  nedunjeliyan_1: "நான் பாண்டியர் குலத்தைச் சேர்ந்த நெடுஞ்செழியன்; முல்லை நிலப் பகுதிகளான காடுகள், மேய்ச்சல் நிலங்கள் மற்றும் மலைவாழ் மக்களின் நிலப்பரப்புகளை ஆளும் போர்வீர-மன்னன் ஆவேன். அடர்ந்த காடுகளில் நான் மேற்கொண்ட போர்களில் எதிரி மன்னர்களைத் தோற்கடித்ததோடு, மதுரையின் செழிப்பிற்கு ஆதாரமாக விளங்கிய காட்டுப் பாதைகளையும் பாதுகாத்தேன். காட்டுப் பகுதிகளில் அரண் அமைக்கப்பட்ட காவல் நிலையங்களை நிறுவி, வணிகப் பாதைகளை வலுப்படுத்தியதோடு, வணிகர்களும் பயணிகளும் பாதுகாப்பாகச் செல்ல வழிவகைகளை உருவாக்கினேன். பாண்டியரின் ஆதிக்கத்தை நிலைநாட்டிய தலையாலங்கானப் போர் மற்றும் பிற போர்களில் நான் பெற்ற வெற்றிகளைப் புலவர்கள் புகழ்ந்து பாடினர். மதுரையைச் சுற்றியிருந்த காடுகள் நிறைந்த பகுதிகளை ஒன்றிணைத்து, அவற்றை ஒரு நிலையான மற்றும் செழிப்பான எல்லைப் பகுதியாக மாற்றியதே எனது மிகப்பெரிய சாதனையாகும். என் ஆட்சிக்காலத்தில், காடுகள் வெறும் காட்டுப் பிரதேசமாக இல்லாமல், பாண்டியரின் வலிமையைப் பறைசாற்றும் கேடயமாகவும், வளங்களின் இருப்பிடமாகவும் திகழ்ந்தன.",
  raja_raja_cholan: "கற்களில் என் கனவு எழுந்த பேரரசனாகிய ராஜராஜ சோழன் நான். எனது மாபெரும் படைப்பு தஞ்சாவூரில் உள்ள பிரகதீஸ்வரர் கோயில் — துல்லியத்துடனும் பக்தியுடனும் கட்டப்பட்ட, இன்றும் பிரமிப்பைத் தூண்டும் ஒரு வானுயர்ந்த கருங்கல் அதிசயம். நான் என் பேரரசு முழுவதும் கோயில்களைக் கட்டினேன், நகரங்களை அரண்செய்தேன், நாகப்பட்டினம் போன்ற துறைமுகங்களை விரிவுபடுத்தினேன். நான் நில நிர்வாகத்தை மறுசீரமைத்தேன், கோயில் அறக்கட்டளைகளை நிறுவினேன், மேலும் ஆட்சியின் ஒவ்வொரு அம்சத்தையும் பதிவுசெய்யும் விரிவான கல்வெட்டுகளை உருவாக்கினேன். எனது கடற்படைப் பயணங்கள் இலங்கை மற்றும் தென்கிழக்கு ஆசியாவை அடைந்து, கடல்களுக்கு அப்பால் சோழர்களின் செல்வாக்கைப் பரப்பின. எனது மாபெரும் சாதனை, சோழப் பேரரசை ஒரு கலாச்சார மற்றும் கட்டிடக்கலை வல்லமைமிக்க மையமாக மாற்றியதே ஆகும்; அங்கு கல் அழியாததாக மாறியது, பேரரசு புகழ்பெற்றதாக ஆனது.",
  kulasekara_pandya: "மதுரையைத் திருக்கோயில்கள் நிறைந்த நகரமாக மாற்றிய மன்னன் நானே. எனது ஆதரவின் கீழ், மீனாட்சி-சுந்தரேசுவரர் கோயில் புதிய மண்டபங்கள், சிற்றாலயங்கள் மற்றும் எனது தலைநகரின் வானளாவிய தோற்றத்தை வடிவமைத்த பிரம்மாண்டமான கோபுரங்களுடன் விரிவுபடுத்தப்பட்டது. நான் பல கோயில் வளாகங்களை உருவாக்கினேன்; சிற்பிகளை ஆதரித்ததோடு, எனது அரசவையைத் தங்கள் அறிவாற்றலால் சிறக்கச் செய்த கவிஞர்களையும் அறிஞர்களையும் ஊக்குவித்தேன். கோயில்களை மையமாகக் கொண்டு நகர அமைப்பைச் சீரமைத்து, மதுரையை ஒரு புனிதமான பெருநகரமாக மாற்றினேன். கட்டடக்கலை, பக்தி மற்றும் கலைகள் அனைத்தும் ஒருசேரச் செழித்தோங்கிய ஒரு கலாச்சார மறுமலர்ச்சிக்குத் தலைமை தாங்கியதே எனது மிகச்சிறந்த சாதனையாகும். எனது ஆட்சிக்காலத்தில் செதுக்கப்பட்ட கற்கள் இன்றும் பேசுகின்றன — அவை கடவுள்கள், மன்னர்கள் மற்றும் பாண்டிய நாட்டின் பெருமைமிகு வரலாற்றை நமக்கு எடுத்துரைக்கின்றன.",
  cheraman_perumal: "கேரளாவின் கோயில்கள் மற்றும் மரபுகளில் இன்றும் நிலைத்திருக்கும் ஒரு பாரம்பரியத்திற்குச் சொந்தக்காரனான சேர மன்னன், நானே சேரமான் பெருமாள். எனது ஆட்சிக்காலத்தில் பல முக்கிய ஆலயங்களை நான் கட்டியும் புதுப்பித்தும், கேரளாவுக்கே உரித்தான தனித்துவமான ஆரம்பகால திராவிடக் கட்டடக்கலை பாணியை உருவாக்கினேன். வடக்கும்நாதன் கோயில் போன்ற ஆலயங்களின் கட்டுமானத்திற்கு நான் ஆதரவளித்ததோடு, கோயில்களை மையமாகக் கொண்ட நகரங்களையும் வலுப்படுத்தினேன். கவிஞர்கள், இசைக்கலைஞர்கள் மற்றும் அறிஞர்களுக்கு எனது அரசவை ஒரு புகலிடமாகத் திகழ்ந்தது; அவர்கள் அனைவருடனும் இணைந்து எனது நாட்டின் கலாச்சார அடையாளத்தை நான் செதுக்கினேன். பக்தி, கலை மற்றும் சமூக வாழ்க்கை ஆகியவற்றை ஒன்றிணைக்கும் வகையிலான ஒரு ஆன்மீக மற்றும் கட்டடக்கலை அடித்தளத்தை அமைத்ததே எனது மிகச்சிறந்த சாதனையாகும். கோயில்கள், திருவிழாக்கள் மற்றும் கலாச்சாரத்திற்கான எனது ஆதரவு ஆகியவற்றின் மூலம், கேரளாவின் புனிதத் தலங்களில் இன்றும் உயிர்ப்புடன் திகழும் ஒரு உன்னத மரபை நான் உருவாக்கினேன்.",
  karikala_cholan: "நான் கரிகால சோழன்; சீறிப்பாயும் காவிரி நதியைத் தன் கட்டுப்பாட்டில் கொண்டுவந்த மன்னன் நான். உலகின் மிகப்பழமையான, இன்றும் பயன்பாட்டில் உள்ள அணைகளில் ஒன்றான 'கல்லணை'யே எனது மிகச்சிறந்த படைப்பாகும். பிரம்மாண்டமான கருங்கற்களைக் கொண்டு கட்டப்பட்ட இவ்வணை, இன்றும் காவிரி நீரைத் திருப்பிவிட்டு டெல்டா பகுதியை வளப்படுத்துகிறது. பாசனக் கால்வாய்களை விரிவுபடுத்தியும், கரைகளை வலுப்படுத்தியும், வேளாண்மைக்கான கட்டமைப்புகளை உருவாக்கியும், சோழ நாட்டின் மையப்பகுதியை நெல் வளம் கொழிக்கும் ஒரு சொர்க்க பூமியாக நான் மாற்றினேன். அத்துடன், கோட்டைகளை அமைத்து, வணிகப் பாதைகளை மேம்படுத்தி, புகார் துறைமுகத்தையும் வலுப்படுத்தினேன். நீரை ஆற்றல், வளம் மற்றும் நிலைத்தன்மையின் ஊற்றாக மாற்றியதே எனது ஆகச்சிறந்த சாதனையாகும்; இதன் மூலம், நான் செதுக்கிய இந்த மண்ணில் எனக்குப் பின்வரும் தலைமுறைகளும் செழித்து வாழ்வதை உறுதிசெய்தேன்.",
  uthiyan_cheralathan: "நான் சேரர்களின் ஆரம்பகால மன்னர்களில் ஒருவனான உதியன் சேரலாதன்; பெரியாறு நதியே எனது நாட்டின் உயிர்நாடியாகத் திகழ்ந்தது. நான் அதன் நீர்ப்பாசனக் கட்டமைப்புகளை வலுப்படுத்தினேன், ஆரம்பகாலக் கால்வாய்களை வெட்டினேன், மேலும் அந்நீரை ஒவ்வொரு வயலுக்கும் கிராமத்திற்கும் கொண்டு சேர்ப்பதை உறுதி செய்தேன். உள்நாட்டு விவசாயிகளையும் கடற்கரைப்பகுதி வணிகர்களையும் இணைக்கும் வகையிலான ஆற்றுவழி வணிகப் பாதைகளை உருவாக்கி, என் நாட்டை ஒரு செழிப்பான வணிக மையமாக மாற்றினேன். நான் நீர் சேமிப்புக் குளங்களை அமைத்தேன், விவசாய நிலங்களை மேம்படுத்தினேன், அத்துடன் கேரளாவின் நீர்வளம் சார்ந்த செழிப்புக்கு அடித்தளமிட்டேன். வணிகம், விவசாயம் மற்றும் சமூக வாழ்க்கை ஆகியவை ஒன்றிணைந்து செழித்தோங்கும் ஒரு நிலையான, வளமான பகுதியாகப் பெரியாறு ஆற்றுப் படுகையை மாற்றியமைத்ததே எனது மிகச்சிறந்த சாதனையாகும்.",
  ariyan_nedunjeliyan_2: "நான் பாண்டியர்களின் அரியன் நெடுஞ்சேலியன், காயப்பட்ட நிலத்தை மீண்டும் கட்டியெழுப்பிய மன்னன். போர்களும் வெள்ளங்களும் வைகைப் பகுதியைச் சூறையாடிய பிறகு, என் மக்களுக்கு வாழ்வாதாரமாக விளங்கிய கால்வாய்களையும், குளங்களையும், கரைகளையும் நான் புனரமைத்தேன். நான் நீர்ப்பாசன வலையமைப்புகளைப் புனரமைத்து, விவசாயத்திற்குப் புத்துயிர் அளித்து, மதுரையின் செழிப்புக்கு உணவளித்த நீர் அமைப்புகளை வலுப்படுத்தினேன். நான் நீர்த்தேக்கங்களைக் கட்டி, வெள்ளத்தால் சேதமடைந்த கட்டிடங்களைச் சீரமைத்து, மிகவும் தேவைப்படும் இடங்களுக்கு நீர் செல்வதை உறுதி செய்தேன். அழிவைப் புதுப்பித்தலாக மாற்றியதே எனது மாபெரும் சாதனையாகும் — மீள்திறன், ஞானம் மற்றும் தன் நீர்நிலைகளின் மீதான ஆளுமையால் வழிநடத்தப்படும்போது ஒரு இராச்சியம் மேலும் வலிமை பெற முடியும் என்பதை நிரூபித்தேன். நீரின் மூலம், என் நிலத்திற்கு உயிரையும், என் மக்களுக்கு நம்பிக்கையையும் மீட்டளித்தேன்.",
};

let activeNPC = null; // Currently near/interacting NPC
window.activeNPC = null;
window.NPC_DISPLAY_NAMES = NPC_DISPLAY_NAMES;
window.NPC_SCRIPTS = NPC_SCRIPTS;

// Backend URL - update if deploying to production
// This value can be overridden at runtime by placing a ".env" file
// at the web root containing a line like:
// BACKEND_URL=http://localhost:8000
// Alternatively, set `window.__BACKEND_URL__` before this script runs.
let BACKEND_URL = "http://localhost:8000";

// Try to load runtime overrides from /.env (if served by dev server)
(function loadBackendUrlFromEnv() {
  try {
    if (window.__BACKEND_URL__) {
      BACKEND_URL = window.__BACKEND_URL__;
      console.log(
        "Using BACKEND_URL from window.__BACKEND_URL__:",
        BACKEND_URL,
      );
      return;
    }

    fetch("/.env")
      .then((res) => {
        if (!res.ok) throw new Error(".env not found");
        return res.text();
      })
      .then((text) => {
        const lines = text.split(/\r?\n/);
        for (const raw of lines) {
          const line = raw.trim();
          if (!line || line.startsWith("#")) continue;
          const idx = line.indexOf("=");
          if (idx === -1) continue;
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (key === "BACKEND_URL" && val) {
            BACKEND_URL = val;
            console.log("Loaded BACKEND_URL from /.env:", BACKEND_URL);
            break;
          }
        }
      })
      .catch((err) => {
        // Silent fallback to default
        console.log("No /.env loaded (using default BACKEND_URL)");
      });
  } catch (e) {
    console.warn("Error loading /.env for BACKEND_URL", e);
  }
})();

// Raycaster for detecting NPC clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to play NPC introduction audio
async function playNPCIntro(npcName) {
  if (!npcName) npcName = "raja_raja_cholan";
  const npc = scene.getObjectByName(npcName);
  if (!npc || npc.userData.hasPlayedIntro) {
    return;
  }

  activeNPC = npc;
  window.activeNPC = npc;

  // Hide tooltip immediately when starting to play
  npcTooltip.classList.remove("visible");
  canInteract = false;

  const displayName = NPC_DISPLAY_NAMES[npcName] || npcName;

  try {
    console.log("🎮 Fetching NPC introduction from backend...");

    const response = await fetch(`${BACKEND_URL}/npc/intro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ npc_name: npcName }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to fetch NPC intro:", error.detail);
      alert(
        `${displayName} அறிமுகம் கிடைக்கவில்லை\n(NPC intro audio not found)`,
      );
      return;
    }

    // Get audio blob and create URL
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create and play audio
    const npcAudio = new Audio(audioUrl);
    npcAudio.volume = gameConfig.soundEnabled ? 0.8 : 0;

    // Show dialogue overlay while playing
    showNPCDialogue(npcName);

    const scriptBody = document.getElementById("scriptPanelBody");
    let scriptText = NPC_SCRIPTS[npcName] || "";

    const audioTimeUpdate = () => {
      if (npcAudio.duration && scriptBody && scriptText) {
        const ratio = npcAudio.currentTime / npcAudio.duration;
        scriptBody.scrollTop = ratio * (scriptBody.scrollHeight - scriptBody.clientHeight);
      }
    };
    npcAudio.addEventListener("timeupdate", audioTimeUpdate);

    npcAudio.play();
    npc.userData.hasPlayedIntro = true;

    console.log(`🔊 Playing ${npcName} introduction`);

    // Clean up blob URL when done
    npcAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      npcAudio.removeEventListener("timeupdate", audioTimeUpdate);
      hideNPCDialogue();

      // Enable voice chat after intro
      console.log("✅ Intro finished - Voice chat enabled!");
      npc.userData.voiceChatEnabled = true;

      console.log("🎤 Voice chat status:", {
        canInteract: window.canInteract,
        npcName: npcName,
        voiceChatEnabled: npc?.userData?.voiceChatEnabled,
      });

      // Show voice chat tooltip if still near NPC
      if (isNearNPC && activeNPC === npc) {
        showVoiceChatTooltip();
      }

      // Initialize voice system
      if (typeof initNPCVoiceSystem === "function") {
        initNPCVoiceSystem();
      }
    };
  } catch (error) {
    console.error("Error playing NPC intro:", error);
    alert(
      "பின்னணி சேவையை இயக்கவும்\n(Please start backend: uvicorn main:app --reload)",
    );
  }
}

// Show NPC dialogue overlay and script panel
function showNPCDialogue(npcName) {
  let dialogueDiv = document.getElementById("npcDialogue");
  const displayName = NPC_DISPLAY_NAMES[npcName] || npcName;

  if (!dialogueDiv) {
    dialogueDiv = document.createElement("div");
    dialogueDiv.id = "npcDialogue";
    dialogueDiv.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #FFD700;
            padding: 25px 50px;
            color: #FFD700;
            font-size: 24px;
            font-family: 'Noto Sans Tamil', Arial;
            border-radius: 10px;
            z-index: 1000;
            text-align: center;
            max-width: 80%;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
        `;
    document.body.appendChild(dialogueDiv);
  }

  dialogueDiv.innerHTML = `
        <strong style="font-size: 28px;">${displayName}</strong><br>
        <span style="font-size: 16px; color: #B8860B; margin-top: 10px; display: block;">
            🔊 அறிமுகம் ஒலிக்கிறது...
        </span>
    `;
  dialogueDiv.style.display = "block";

  // Show script panel with the NPC's script
  const scriptText = NPC_SCRIPTS[npcName] || "";
  if (scriptText) {
    const scriptPanel = document.getElementById("scriptPanel");
    const scriptHeader = document.getElementById("scriptPanelHeader");
    const scriptBody = document.getElementById("scriptPanelBody");
    if (scriptPanel && scriptBody) {
      scriptHeader.textContent = displayName + " - செய்தி";
      scriptBody.textContent = scriptText;
      scriptBody.scrollTop = 0;
      scriptPanel.classList.add("visible");
    }
  }
}

// Hide NPC dialogue overlay and script panel
function hideNPCDialogue() {
  const dialogueDiv = document.getElementById("npcDialogue");
  if (dialogueDiv) {
    dialogueDiv.style.display = "none";
  }
  const scriptPanel = document.getElementById("scriptPanel");
  if (scriptPanel) {
    scriptPanel.classList.remove("visible");
  }
}

// Click event listener for NPC detection
function onDocumentClick(event) {
  // Don't trigger if pointer is locked (game mode)
  if (document.pointerLockElement) {
    return;
  }

  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections with scene objects
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    let object = intersects[i].object;

    // Walk up the hierarchy to find the NPC
    while (object) {
      if (
        object.userData &&
        object.userData.isNPC &&
        object.userData.npcName
      ) {
        const npcName = object.userData.npcName;
        const displayName = NPC_DISPLAY_NAMES[npcName] || npcName;
        console.log(`🎯 Clicked on ${displayName}!`);
        playNPCIntro(npcName);
        return;
      }
      object = object.parent;
    }
  }
}

// Add click listener
window.addEventListener("click", onDocumentClick);

console.log("NPC click detection initialized");

// ===== NPC PROXIMITY TOOLTIP SYSTEM =====
const npcTooltip = document.getElementById("npcTooltip");
const INTERACTION_DISTANCE = 5; // Distance in units to show tooltip
let isNearNPC = false;
let canInteract = false;
window.canInteract = false; // Expose globally for voice system

// E key listener for NPC interaction
let eKeyPressed = false;
window.addEventListener("keydown", (event) => {
  if (event.code === "KeyE" && !eKeyPressed) {
    eKeyPressed = true;
    if (canInteract && activeNPC && !activeNPC.userData.hasPlayedIntro) {
      playNPCIntro(activeNPC.userData.npcName);
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "KeyE") {
    eKeyPressed = false;
  }
});

// Check proximity to NPC and show tooltip
let proxFrameCount = 0;
function checkNPCProximity() {
  const player = entityManager.Get("player");
  if (!player || !player._position) return;

  const npcList = window.npcObjects;
  if (!npcList || !npcList.length) return;

  const playerPos = player._position;
  let nearestNPC = null;
  let nearestDist = INTERACTION_DISTANCE;

  for (let i = 0; i < npcList.length; i++) {
    const obj = npcList[i];
    if (obj.userData?.isNPC && obj.userData?.npcName) {
      const dist = playerPos.distanceTo(obj.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestNPC = obj;
      }
    }
  }

  if (nearestNPC) {
    if (activeNPC !== nearestNPC) {
      activeNPC = nearestNPC;
      window.activeNPC = nearestNPC;
      isNearNPC = true;
      canInteract = true;
      window.canInteract = true;
    }

    if (!isNearNPC) {
      isNearNPC = true;
      canInteract = true;
      window.canInteract = true;
    }

    proxFrameCount++;
    if (proxFrameCount % 10 === 0) {
      const displayName = NPC_DISPLAY_NAMES[nearestNPC.userData.npcName] || nearestNPC.userData.npcName;
      document.getElementById('npcTooltipName').textContent = displayName;
      document.getElementById('voiceTooltipName').textContent = displayName;
      document.getElementById('conversationLogHeader').textContent = displayName + ' உடன் உரையாடல்';
    }

    if (!nearestNPC.userData.hasPlayedIntro) {
      npcTooltip.classList.add("visible");
      hideVoiceChatTooltip();
    } else if (nearestNPC.userData.voiceChatEnabled) {
      npcTooltip.classList.remove("visible");
      showVoiceChatTooltip();
    }
  } else {
    if (isNearNPC) {
      isNearNPC = false;
      canInteract = false;
      window.canInteract = false;
      activeNPC = null;
      window.activeNPC = null;
      npcTooltip.classList.remove("visible");
      hideVoiceChatTooltip();
    }
  }
}

console.log("NPC proximity system initialized");

// Voice chat tooltip helpers
const voiceChatTooltip = document.getElementById("voiceChatTooltip");

function showVoiceChatTooltip() {
  if (
    voiceChatTooltip &&
    activeNPC &&
    activeNPC.userData.voiceChatEnabled
  ) {
    voiceChatTooltip.classList.add("visible");
  }
}

function hideVoiceChatTooltip() {
  if (voiceChatTooltip) {
    voiceChatTooltip.classList.remove("visible");
  }
}

// Make functions globally accessible for voice system
window.hideVoiceChatTooltip = hideVoiceChatTooltip;
window.showVoiceChatTooltip = showVoiceChatTooltip;

// Animation loop
let previousTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  // DEV ONLY: FPS Counter calculation
  frameCount++;
  const fpsCheckTime = performance.now();
  if (fpsCheckTime >= lastTime + 1000) {
    fps = Math.round((frameCount * 1000) / (fpsCheckTime - lastTime));
    fpsElement.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = fpsCheckTime;
  }

  // DEV ONLY: Update coordinates display every frame
  if (coordsElement) {
    const player = entityManager.Get("player");
    if (player && player._position) {
      const p = player._position;
      coordsElement.textContent = `X:${p.x.toFixed(1)} Y:${p.y.toFixed(1)} Z:${p.z.toFixed(1)}`;
    }
  }

  const currentTime = performance.now();
  const timeElapsed = (currentTime - previousTime) / 1000; // Convert to seconds
  previousTime = currentTime;

  // Update all entities
  entityManager.Update(timeElapsed);

  // Animate water in river world
  if (gameConfig.world === "water") {
    animateWater(currentTime / 1000);
  }

  // Update chunks based on player position (INSTANT - Minecraft-style)
  // Only for nature world - temple world doesn't use chunks
  if (gameConfig.world === "nature") {
    const player = entityManager.Get("player");
    if (player && player._position) {
      updateChunks(player._position.x, player._position.z);
    }
  }

  // AUDIO: Update walk sound (optimized - check every 5 frames to reduce overhead)
  if (walkAudio && frameCount % 5 === 0) {
    const player = entityManager.Get("player");
    if (player) {
      const playerController = player.GetComponent("BasicCharacterController");
      if (playerController) {
        const input = playerController.GetComponent(
          "BasicCharacterControllerInput",
        );
        if (input) {
          const isMoving =
            input._keys.forward ||
            input._keys.backward ||
            input._keys.left ||
            input._keys.right;

          if (isMoving && !isWalkSoundPlaying) {
            walkAudio
              .play()
              .catch((e) => console.log("Walk sound play prevented"));
            isWalkSoundPlaying = true;
          } else if (!isMoving && isWalkSoundPlaying) {
            walkAudio.pause();
            walkAudio.currentTime = 0;
            isWalkSoundPlaying = false;
          }
        }
      }
    }
  }

  // Check proximity to NPC for tooltip
  checkNPCProximity();

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
console.log("Starting animation loop");
animate();

// Initial loading state
if (gameConfig.world === "architecture" || gameConfig.world === "water") {
  // Show loading screen - temple/water world loads asynchronously
  if (window.gameLoading) {
    window.gameLoading.setStatus("Loading world...");
  }
} else if (gameConfig.world === "nature") {
  // Nature world loads chunks dynamically, mark ready
  if (window.gameLoading) {
    window.gameLoading.completeTask("world");
  }
}

// Log what should be visible
console.log("Setup complete. Character at:", playerEntity._position);
console.log("Camera at:", camera.position);
console.log("Scene children:", scene.children.length);
