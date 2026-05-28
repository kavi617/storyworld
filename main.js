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

import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { entity } from './entity.js';
import { entity_manager } from './entity-manager.js';
import { player_entity } from './player-entity.js';
import { player_input } from './player-input.js';
import { third_person_camera } from './third-person-camera.js';
import { initTempleWorld, getNPCSpawnPositions, getCollisionMeshes, getGroundMeshes } from './architecture_world.js';
import { initWaterWorld, animateWater, getCollisionMeshes as getWaterCollisionMeshes, getGroundMeshes as getWaterGroundMeshes } from './water-management-world.js';

console.log('Imports loaded successfully');

// Check game configuration from menu (must be first!)
const gameConfig = window.gameConfig || { world: 'nature', soundEnabled: true, playerName: 'வீரர்' };
console.log('⚡ ULTRA PERFORMANCE MODE: 2-3 objects/chunk, 90% grass, 3% trees, lag-free');
console.log(`🎮 World: ${gameConfig.world} | Player: ${gameConfig.playerName} | Sound: ${gameConfig.soundEnabled ? 'ON' : 'OFF'}`);

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SCREEN MANAGEMENT (Architecture world only)
// ═══════════════════════════════════════════════════════════════════════════
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
const loadingStatus = document.getElementById('loadingStatus');

let loadingState = {
    temple: false,
    player: false,
    raja: false,
    ready: false
};

// For nature and water worlds, temple and raja don't exist, so mark them as loaded
if (gameConfig.world === 'nature' || gameConfig.world === 'water') {
    loadingState.temple = true;
    loadingState.raja = true;
}

// Expose globally so other modules can update it
window.loadingState = loadingState;

function updateLoadingProgress() {
    // Only show loading screen for architecture world
    if (gameConfig.world !== 'architecture' || !loadingScreen) {
        // For nature and water worlds, just mark as ready immediately
        if (gameConfig.world === 'nature' || gameConfig.world === 'water') {
            window.gameLoaded = true;
        }
        return;
    }
    
    const completed = Object.values(loadingState).filter(v => v === true).length;
    const total = Object.keys(loadingState).length;
    const percent = (completed / total) * 100;
    
    if (loadingProgress) loadingProgress.style.width = percent + '%';
    
    // Update status text
    if (loadingStatus) {
        if (loadingState.temple && !loadingState.player) {
            loadingStatus.textContent = 'Loading player...';
        } else if (loadingState.player && !loadingState.raja) {
            loadingStatus.textContent = 'Loading Raja Raja Cholan...';
        } else if (loadingState.raja && !loadingState.ready) {
            loadingStatus.textContent = 'Almost ready...';
        }
    }
    
    // All loaded - hide screen quickly
    if (completed === total - 1) { // All except 'ready'
        loadingState.ready = true;
        if (loadingStatus) loadingStatus.textContent = 'Ready! வரவேற்கிறோம்!';
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.classList.remove('active');
                window.gameLoaded = true;
            }, 500);
        }, 300);
    }
}

// Expose globally
window.updateLoadingProgress = updateLoadingProgress;

window.gameLoaded = false; // Global flag to prevent interaction during loading

// Stub for chunk system (only used in nature world, but defined globally to prevent errors)
let updateChunks = () => {}; // No-op by default, will be overridden in nature world

// Expose collision and ground meshes globally for player physics
// Use appropriate getters based on world type
if (gameConfig.world === 'water') {
    window.getCollisionMeshes = getWaterCollisionMeshes;
    window.getGroundMeshes = getWaterGroundMeshes;
} else {
    // Architecture and nature worlds use architecture getters (or empty for nature)
    window.getCollisionMeshes = getCollisionMeshes;
    window.getGroundMeshes = getGroundMeshes;
}

// DEV ONLY: FPS Counter - easily removable
const fpsElement = document.getElementById('fps');
// DEV ONLY: Coordinates display - easily removable
const coordsElement = document.getElementById('coords');
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

// Scene setup - Bright Daytime Forest (Ultra Performance)
const scene = new THREE.Scene();

// Set background color based on world type
if (gameConfig.world === 'architecture') {
    scene.background = new THREE.Color(0x87ceeb); // Bright daytime sky blue
} else if (gameConfig.world === 'water') {
    scene.background = new THREE.Color(0xb0d8f0); // Blueish sky for water world
} else {
    scene.background = new THREE.Color(0x87ceeb); // Bright sky blue for nature world
}

// Fog will be added conditionally based on world type
if (gameConfig.world === 'nature') {
    scene.fog = new THREE.Fog(0xd4e8f0, 20, 35); // Tighter fog for forest
}
// No fog for architecture and water worlds - clear view

console.log('Scene created');

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.5, // Increased near plane to prevent clipping issues
    (gameConfig.world === 'architecture' || gameConfig.world === 'water') ? 500 : 100 // Larger far plane for temple and water worlds
);

// Set initial camera position based on world type
if (gameConfig.world === 'architecture') {
    // Player spawns at Z=80 facing -Z (toward temple). Camera behind player.
    camera.position.set(0, 15, 95);
    camera.lookAt(0, 5, 0);
    console.log('📍 Camera positioned behind player facing temple');
} else if (gameConfig.world === 'water') {
    // Water world - elevated view to see entire water management system
    camera.position.set(-30, 50, 100);  // Higher view to see all areas
    camera.lookAt(-40, 1, 120);  // Looking at farmland area
    console.log('📍 Camera positioned for Kaveri River world');
} else {
    // Nature world - default position
    camera.position.set(0, 10, 15);
}

// Renderer with ULTRA performance optimizations
const renderer = new THREE.WebGLRenderer({ 
    antialias: false, // Disable antialiasing for performance
    powerPreference: "high-performance", // Request high-performance GPU
    precision: "lowp" // Low precision for maximum performance
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Force 1x pixel ratio for max performance
renderer.shadowMap.enabled = false; // Disable shadows for major performance boost
document.body.appendChild(renderer.domElement);

// Enable frustum culling (Minecraft-style optimization)
camera.matrixAutoUpdate = true;

// Lighting
if (gameConfig.world === 'architecture') {
    
    // Temple world: Even ambient-only daytime — no directional light to avoid bright patches
    const templeAmbient = new THREE.AmbientLight(0xfff8f0, 0.75); // Reduced — prevents texture overexposure
    scene.add(templeAmbient);

     
} else if (gameConfig.world === 'water') {
    // Water world - blueish atmosphere with directional light
    const waterAmbient = new THREE.AmbientLight(0xe0f0ff, 0.7);  // Blueish ambient
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
const texturePath = 'Theme/Forest Theme 1/Textures/';

// Helper function to load texture with performance settings
function loadTexture(filename) {
    const tex = textureLoader.load(texturePath + filename);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
}


// Load ground texture (path rocks for dirt path look)
const groundTexture = loadTexture('Rocks_Diffuse.png');
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50); // Minimal repeats for best performance



// Load ALL bark textures (for trees)
const barkTextures = [
    loadTexture('Bark_NormalTree.png'),
    loadTexture('Bark_DeadTree.png'),
    loadTexture('Bark_TwistedTree.png')
];

// Load ALL leaf textures (for trees)
const leafTextures = [
    loadTexture('Leaves_NormalTree.png'),
    loadTexture('Leaves_NormalTree_C.png'),
    loadTexture('Leaves_TwistedTree.png'),
    loadTexture('Leaves_TwistedTree_C.png'),
    loadTexture('Leaf_Pine.png'),
    loadTexture('Leaf_Pine_C.png'),
    loadTexture('Leaves.png'),
    loadTexture('Leaves_GiantPine_C.png')
];

// Load ALL vegetation textures (grass, flowers, mushrooms)
const vegetationTextures = [
    loadTexture('Grass.png'),
    loadTexture('Flowers.png'),
    loadTexture('Mushrooms.png')
];

// Load ALL rock textures
const rockTextures = [
    loadTexture('Rocks_Diffuse.png'),
    loadTexture('Rocks_Desert_Diffuse.png'),
    loadTexture('PathRocks_Diffuse.png')
];

console.log('All textures loaded: bark, leaves, vegetation (grass/flowers/mushrooms), rocks');

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

if (gameConfig.world === 'architecture') {
    // ═══════════════════════════════════════════════════════════════════════
    // 🏛️ TEMPLE WORLD (Brihadeeswarar Temple)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('🏛️ Loading Thanjavur Periya Kovil (Big Temple) FBX Model...');
    console.log('   ⚠️ If you see old temple, HARD REFRESH: Ctrl+Shift+F5');
    
    // Clear fog for temple world
    scene.fog = null;
    
    // Initialize temple environment (loads FBX model)
    initTempleWorld(scene);
    
    // Note: Player and camera will be positioned after player entity is created
    // Raja model will be loaded in the character loading section below
    
    console.log('✅ Temple World Loaded');
    
} else if (gameConfig.world === 'water') {
    // ═══════════════════════════════════════════════════════════════════════
    // 💧 WATER MANAGEMENT WORLD (Chola Irrigation System)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('💧 Loading Chola Water Management System...');
    console.log('   Features: Stone dam, sluice gates, canals, tank (eri)');
    
    // Clear fog for water world
    scene.fog = null;
    
    // Initialize water management environment
    initWaterWorld(scene);
    
    console.log('✅ Water Management World Loaded');
    
} else {
    // ═══════════════════════════════════════════════════════════════════════
    // 🌲 NATURE/FOREST WORLD (Default)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('🌲 Loading Nature/Forest World...');

// Ground plane - Infinite forest floor (Ultra Performance)
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

// CLOUD SYSTEM - Dynamic Sky (Performance Optimized)
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

// Forest Theme 1 Environment Loader with custom loading manager
// This redirects texture requests from FBX folder to Textures folder
const loadingManager = new THREE.LoadingManager();
loadingManager.setURLModifier((url) => {
    // If the URL is trying to load a texture from the FBX folder, redirect to Textures folder
    if (url.includes('Theme/Forest Theme 1/FBX/') && (url.endsWith('.png') || url.endsWith('.jpg'))) {
        return url.replace('Theme/Forest Theme 1/FBX/', 'Theme/Forest Theme 1/Textures/');
    }
    return url;
});

const envLoader = new FBXLoader(loadingManager);
const forestPath = 'Theme/Forest Theme 1/FBX/';

// Helper function to load and place forest models with appropriate textures
function loadForestModel(filename, position, scale = 1, rotation = 0, textureOverride = null) {
    envLoader.load(forestPath + filename, (fbx) => {
        fbx.scale.setScalar(scale);
        fbx.position.set(position.x, position.y, position.z);
        fbx.rotation.y = rotation;
        fbx.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            // Apply appropriate textures based on model type
            if (c.isMesh && c.material) {
                const materials = Array.isArray(c.material) ? c.material : [c.material];
                materials.forEach(mat => {
                    if (textureOverride) {
                        mat.map = textureOverride;
                        mat.needsUpdate = true;
                    } else if (filename.includes('CommonTree') || filename.includes('Pine') || filename.includes('TwistedTree') || filename.includes('DeadTree')) {
                        // Trees use their embedded textures (loaded via LoadingManager)
                        // Only apply if no texture is loaded
                        if (!mat.map) {
                            if (filename.includes('CommonTree')) {
                                mat.map = leavesNormalTexture;
                            } else if (filename.includes('Pine')) {
                                mat.map = leafPineTexture;
                            } else if (filename.includes('TwistedTree')) {
                                mat.map = leavesTwistedTexture;
                            } else if (filename.includes('DeadTree')) {
                                mat.map = barkDeadTexture;
                            }
                            mat.needsUpdate = true;
                        }
                    } else if (filename.includes('Rock') || filename.includes('Pebble')) {
                        mat.map = rocksTexture;
                        mat.needsUpdate = true;
                    } else if (filename.includes('Grass') || filename.includes('Clover') || filename.includes('Fern')) {
                        mat.map = grassTexture;
                        mat.needsUpdate = true;
                    } else if (filename.includes('Flower') || filename.includes('Petal')) {
                        mat.map = flowersTexture;
                        mat.needsUpdate = true;
                    } else if (filename.includes('Bush') || filename.includes('Plant')) {
                        mat.map = leavesNormalTexture;
                        mat.needsUpdate = true;
                    }
                });
            }
        });
        scene.add(fbx);
    }, undefined, (error) => {
        console.error('Error loading', filename, ':', error);
    });
}

// Tree types from Forest Theme 1
const livingTreeTypes = [
    'CommonTree_1.fbx', 'CommonTree_2.fbx', 'CommonTree_3.fbx', 'CommonTree_4.fbx', 'CommonTree_5.fbx',
    'Pine_1.fbx', 'Pine_2.fbx', 'Pine_3.fbx', 'Pine_4.fbx', 'Pine_5.fbx',
    'TwistedTree_1.fbx', 'TwistedTree_2.fbx', 'TwistedTree_3.fbx', 'TwistedTree_4.fbx', 'TwistedTree_5.fbx'
];

const deadTreeTypes = [
    'DeadTree_1.fbx', 'DeadTree_2.fbx', 'DeadTree_3.fbx', 'DeadTree_4.fbx', 'DeadTree_5.fbx'
];

// Rock types from Forest Theme 1 - ALL VARIANTS
const rockTypes = [
    // Path rocks
    'RockPath_Round_Small_1.fbx', 'RockPath_Round_Small_2.fbx', 'RockPath_Round_Small_3.fbx',
    'RockPath_Round_Thin.fbx', 'RockPath_Round_Wide.fbx',
    'RockPath_Square_Small_1.fbx', 'RockPath_Square_Small_2.fbx', 'RockPath_Square_Small_3.fbx',
    'RockPath_Square_Thin.fbx', 'RockPath_Square_Wide.fbx',
    // Medium rocks
    'Rock_Medium_1.fbx', 'Rock_Medium_2.fbx', 'Rock_Medium_3.fbx',
    // Pebbles
    'Pebble_Round_1.fbx', 'Pebble_Round_2.fbx', 'Pebble_Round_3.fbx', 'Pebble_Round_4.fbx', 'Pebble_Round_5.fbx',
    'Pebble_Square_1.fbx', 'Pebble_Square_2.fbx', 'Pebble_Square_3.fbx', 'Pebble_Square_4.fbx', 'Pebble_Square_5.fbx', 'Pebble_Square_6.fbx'
];

// Bush and Plant types from Forest Theme 1
const bushTypes = [
    'Bush_Common.fbx', 'Bush_Common_Flowers.fbx',
    'Plant_1.fbx', 'Plant_1_Big.fbx', 'Plant_7.fbx', 'Plant_7_Big.fbx',
    'Fern_1.fbx'
];

// Grass and flower types from Forest Theme 1 - ALL VARIANTS
const grassTypes = [
    'Grass_Common_Short.fbx', 'Grass_Common_Tall.fbx',
    'Grass_Wispy_Short.fbx', 'Grass_Wispy_Tall.fbx',
    'Clover_1.fbx', 'Clover_2.fbx',
    'Flower_3_Group.fbx', 'Flower_4_Group.fbx',
    'Flower_3_Single.fbx', 'Flower_4_Single.fbx',
    'Petal_1.fbx', 'Petal_2.fbx', 'Petal_3.fbx', 'Petal_4.fbx', 'Petal_5.fbx'
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
        z: Math.floor(worldZ / CHUNK_SIZE)
    };
}

// Calculate distance between two chunks
function chunkDistance(x1, z1, x2, z2) {
    const dx = x1 - x2;
    const dz = z1 - z2;
    return Math.sqrt(dx * dx + dz * dz);
}

// Modified loadForestModel - ULTRA OPTIMIZED (Simplified Materials)
function loadForestModelTracked(filename, position, scale, rotation, callback) {
    envLoader.load(forestPath + filename, (fbx) => {
        fbx.scale.setScalar(scale);
        fbx.position.set(position.x, position.y, position.z);
        fbx.rotation.y = rotation;
        fbx.traverse(c => {
            c.castShadow = false;
            c.receiveShadow = false;
            // ULTRA optimized materials - minimal texture application
            if (c.isMesh && c.material) {
                const materials = Array.isArray(c.material) ? c.material : [c.material];
                materials.forEach(mat => {
                    mat.flatShading = true;
                    // Only apply texture if needed (skip for grass to save GPU)
                    if (filename.includes('Tree')) {
                        if (!mat.map) mat.map = leafTextures[0]; // Use first texture only
                    } else if (filename.includes('Rock')) {
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
    loadedChunks.set(chunkKey, { meshes: chunkMeshes, x: chunkX, z: chunkZ, loading: true });
    
    const seed = chunkX * 73856093 ^ chunkZ * 19349663;
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
            if (treeType.includes('Pine')) scale = 0.005 + random() * 0.001; // Even smaller
            else scale = 0.006 + random() * 0.002; // Even smaller trees
            
            loadForestModelTracked(treeType, { x, y: 0, z }, scale, rotation, (mesh) => {
                if (mesh) chunkMeshes.push(mesh);
            });
        } else if (spawnType < 0.10) {
            // 7% chance: Rock (small only)
            const rockType = rockTypes[Math.floor(random() * rockTypes.length)];
            const scale = 0.002 + random() * 0.001; // Smaller rocks
            
            loadForestModelTracked(rockType, { x, y: 0, z }, scale, rotation, (mesh) => {
                if (mesh) chunkMeshes.push(mesh);
            });
        } else {
            // 90% chance: GRASS ONLY (ultra lightweight, most common)
            const grassType = grassTypes[Math.floor(random() * grassTypes.length)];
            const scale = 0.004 + random() * 0.002; // Smaller grass
            
            loadForestModelTracked(grassType, { x, y: 0, z }, scale, rotation, (mesh) => {
                if (mesh) chunkMeshes.push(mesh);
            });
        }
    }
}

// No queue processing needed - instant generation

// Unload a chunk and remove its objects from scene
function unloadChunk(chunkKey) {
    const chunk = loadedChunks.get(chunkKey);
    if (!chunk) return;
    
    // Remove all meshes from scene
    chunk.meshes.forEach(mesh => {
        if (mesh && mesh.parent) {
            scene.remove(mesh);
            // Dispose geometry and materials
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => mat.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        }
    });
    
    loadedChunks.delete(chunkKey);
}

// Update chunks based on player position - INSTANT (Minecraft-style)
updateChunks = function(playerX, playerZ) {
    const playerChunk = getChunkCoords(playerX, playerZ);
    
    // Update EVERY time player moves to different chunk (no throttling)
    const movedChunk = playerChunk.x !== lastChunkUpdate.x || playerChunk.z !== lastChunkUpdate.z;
    
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
        if (!chunk.loading) { // Don't unload chunks that are still loading
            const dist = chunkDistance(chunk.x, chunk.z, playerChunk.x, playerChunk.z);
            if (dist > UNLOAD_DISTANCE) {
                chunksToUnload.push(key);
            }
        }
    }
    
    // Unload immediately
    chunksToUnload.forEach(key => unloadChunk(key));
}

// Initialize - load spawn chunk
console.log('Minecraft-style instant chunk system: 16x16, Render: 3, Objects: 1-2 per chunk');

} // End of Nature/Forest World loading

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTER LOADING (Nature world only)
// ═══════════════════════════════════════════════════════════════════════════

// Declare Raja variables at higher scope for animation loop access
let rajaMixer = null;
let rajaModel = null;
window.rajaModel = null;

// Load Raja Raja Cholan model (only in nature world)
if (gameConfig.world === 'nature') {
const loader = new FBXLoader();
// Add cache busting timestamp to force reload when model changes
const modelPath = 'characters/raja raja cholan/rajarajacholan.fbx?v=' + Date.now();
loader.load(modelPath, (fbx) => {
    // Match the player character scale
    fbx.scale.setScalar(0.018);
    
    // Nature world - default position
    fbx.position.set(5, 0, 0);
    
    fbx.traverse(c => {
        c.castShadow = false; // No shadows for performance
    });
    scene.add(fbx);
    
    // Store reference for click detection
    rajaModel = fbx;
    window.rajaModel = fbx; // Expose globally for voice system
    rajaModel.userData.isNPC = true;
    rajaModel.userData.npcName = 'raja_raja_cholan';
    rajaModel.userData.hasPlayedIntro = false; // Track if intro has been played
    
    // Check if the model has animations
    if (fbx.animations && fbx.animations.length > 0) {
        rajaMixer = new THREE.AnimationMixer(fbx);
        
        // Play the first animation (usually idle)
        const idleClip = fbx.animations[0];
        const idleAction = rajaMixer.clipAction(idleClip);
        idleAction.play();
        
        console.log('Raja Raja Cholan model loaded with', fbx.animations.length, 'animations');
    } else {
        console.log('Raja Raja Cholan model loaded (no animations found)');
    }
}, undefined, (error) => {
    console.error('Error loading Raja Raja Cholan model:', error);
});
} // End of Raja loading (nature world only)

console.log('Scene initialized');

// Entity Manager
const entityManager = new entity_manager.EntityManager();

// Player Entity
const playerEntity = new entity.Entity();
entityManager.Add(playerEntity, 'player');

// Add player input component
const input = new player_input.BasicCharacterControllerInput({});
playerEntity.AddComponent(input);
console.log('Input component added');

// Add player controller component
const playerController = new player_entity.BasicCharacterController({
    scene: scene,
    camera: camera
});
playerEntity.AddComponent(playerController);
console.log('Player controller added');

// Add third-person camera component
const cameraComponent = new third_person_camera.ThirdPersonCamera({
    camera: camera,
    target: playerEntity
});
playerEntity.AddComponent(cameraComponent);
console.log('Camera component added, camera at:', camera.position);

// Mouse look controls
let mouseRotationY = 0; // Horizontal rotation
let mouseRotationX = 0; // Vertical rotation (up/down)
let isPointerLocked = false;

const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair');

// Pointer lock for mouse control
document.body.addEventListener('click', () => {
    // Don't allow pointer lock until game is loaded
    if (!window.gameLoaded) {
        return;
    }
    document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
        isPointerLocked = true;
        instructions.style.display = 'none';
        crosshair.classList.add('active');
        
        // Start ambient sound when game starts (first pointer lock)
        if (ambienceAudio && ambienceAudio.paused) {
            ambienceAudio.play().catch(e => console.log('Ambience autoplay prevented:', e));
        }
        
        console.log('Pointer locked - use mouse to look around');
    } else {
        isPointerLocked = false;
        instructions.style.display = 'block';
        crosshair.classList.remove('active');
        console.log('Pointer unlocked - press ESC to release, click to lock again');
    }
});

document.addEventListener('mousemove', (event) => {
    if (isPointerLocked) {
        mouseRotationY -= event.movementX * 0.002;
        mouseRotationX -= event.movementY * 0.002;
        
        // Restrict vertical rotation to prevent camera going through ground
        // Allow looking up more than down to avoid ground clipping
        mouseRotationX = Math.max(-Math.PI / 6, Math.min(Math.PI / 3, mouseRotationX)); // -30° down, +60° up
        
        // Update camera component with new rotation
        cameraComponent._mouseRotationY = mouseRotationY;
        cameraComponent._mouseRotationX = mouseRotationX;
    }
});

// Mouse wheel zoom
document.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    // Get current zoom distance
    const currentZoom = cameraComponent._zoomDistance;
    
    // Adjust zoom based on wheel delta (positive = zoom out, negative = zoom in)
    const zoomSpeed = 0.5;
    const newZoom = currentZoom + (event.deltaY * 0.01 * zoomSpeed);
    
    // Update camera zoom
    cameraComponent.SetZoom(newZoom);
}, { passive: false });

// AUDIO SYSTEM - Optimized for 60 fps
let ambienceAudio = null;
let walkAudio = null;
let isWalkSoundPlaying = false;

// Load and setup audio (lazy loading for performance)
function setupAudio() {
    if (!gameConfig.soundEnabled) {
        console.log('Audio disabled by player settings');
        return;
    }
    
    // Forest ambience - looping background
    ambienceAudio = new Audio('SFX/forest_amience.mp3');
    ambienceAudio.loop = true;
    ambienceAudio.volume = 0.008; // Subtle background volume
    ambienceAudio.preload = 'auto'; // Preload for smooth playback
    
    // Walk sound - plays when moving
    walkAudio = new Audio('SFX/walk.mp3');
    walkAudio.loop = true;
    walkAudio.volume = 0.4;
    walkAudio.preload = 'auto';
    
    console.log('Audio system initialized (optimized)');
}

// Initialize audio
setupAudio();

// ==================== NPC CLICK DETECTION ====================
// Backend URL - update if deploying to production
const BACKEND_URL = 'http://localhost:8000';

// Raycaster for detecting NPC clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to play NPC introduction audio
async function playNPCIntro() {
    if (!window.rajaModel || window.rajaModel.userData.hasPlayedIntro) {
        return; // Already played or model not loaded
    }
    
    // Hide tooltip immediately when starting to play
    npcTooltip.classList.remove('visible');
    canInteract = false;
    
    try {
        console.log('🎮 Fetching NPC introduction from backend...');
        
        const response = await fetch(`${BACKEND_URL}/npc/intro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to fetch NPC intro:', error.detail);
            alert('இராஜராஜ சோழன் அறிமுகம் கிடைக்கவில்லை\n(NPC intro audio not found)');
            return;
        }
        
        // Get audio blob and create URL
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create and play audio
        const npcAudio = new Audio(audioUrl);
        npcAudio.volume = gameConfig.soundEnabled ? 0.8 : 0;
        
        // Show dialogue overlay while playing
        showNPCDialogue();
        
        npcAudio.play();
        window.rajaModel.userData.hasPlayedIntro = true;
        
        console.log('🔊 Playing Raja Raja Cholan introduction');
        
        // Clean up blob URL when done
        npcAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            hideNPCDialogue();
            
            // Enable voice chat after intro
            console.log('✅ Intro finished - Voice chat enabled!');
            window.rajaModel.userData.voiceChatEnabled = true;
            
            console.log('🎤 Voice chat status:', {
                canInteract: window.canInteract,
                rajaModel: !!window.rajaModel,
                voiceChatEnabled: window.rajaModel?.userData?.voiceChatEnabled
            });
            
            // Show voice chat tooltip if still near NPC
            if (isNearNPC) {
                showVoiceChatTooltip();
            }
            
            // Initialize voice system
            if (typeof initNPCVoiceSystem === 'function') {
                initNPCVoiceSystem();
            }
        };
        
    } catch (error) {
        console.error('Error playing NPC intro:', error);
        alert('பின்னணி சேவையை இயக்கவும்\n(Please start backend: uvicorn main:app --reload)');
    }
}

// Show NPC dialogue overlay
function showNPCDialogue() {
    let dialogueDiv = document.getElementById('npcDialogue');
    
    if (!dialogueDiv) {
        dialogueDiv = document.createElement('div');
        dialogueDiv.id = 'npcDialogue';
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
        <strong style="font-size: 28px;">இராஜராஜ சோழன்</strong><br>
        <span style="font-size: 16px; color: #B8860B; margin-top: 10px; display: block;">
            🔊 அறிமுகம் ஒலிக்கிறது...
        </span>
    `;
    dialogueDiv.style.display = 'block';
}

// Hide NPC dialogue overlay
function hideNPCDialogue() {
    const dialogueDiv = document.getElementById('npcDialogue');
    if (dialogueDiv) {
        dialogueDiv.style.display = 'none';
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
            if (object.userData && object.userData.isNPC && object.userData.npcName === 'raja_raja_cholan') {
                console.log('🎯 Clicked on Raja Raja Cholan!');
                playNPCIntro();
                return;
            }
            object = object.parent;
        }
    }
}

// Add click listener
window.addEventListener('click', onDocumentClick);

console.log('NPC click detection initialized');

// ===== NPC PROXIMITY TOOLTIP SYSTEM =====
const npcTooltip = document.getElementById('npcTooltip');
const INTERACTION_DISTANCE = 5; // Distance in units to show tooltip
let isNearNPC = false;
let canInteract = false;
window.canInteract = false; // Expose globally for voice system

// E key listener for NPC interaction
let eKeyPressed = false;
window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyE' && !eKeyPressed) {
        eKeyPressed = true;
        if (canInteract && window.rajaModel && !window.rajaModel.userData.hasPlayedIntro) {
            playNPCIntro();
        }
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'KeyE') {
        eKeyPressed = false;
    }
});

// Check proximity to NPC and show tooltip
function checkNPCProximity() {
    // Use window.rajaModel (works for both nature and architecture worlds)
    if (!window.rajaModel) return;
    
    const player = entityManager.Get('player');
    if (!player || !player._position) return;
    
    const playerPos = player._position;
    const npcPos = window.rajaModel.position;
    const distance = playerPos.distanceTo(npcPos);
    
    // Player is within interaction range
    if (distance < INTERACTION_DISTANCE) {
        if (!isNearNPC) {
            isNearNPC = true;
            canInteract = true;
            window.canInteract = true; // Update global
            
            // Show appropriate tooltip based on state
            if (!window.rajaModel.userData.hasPlayedIntro) {
                // Show "Press E" tooltip
                npcTooltip.classList.add('visible');
                hideVoiceChatTooltip();
            } else if (window.rajaModel.userData.voiceChatEnabled) {
                // Show "Hold V" tooltip
                npcTooltip.classList.remove('visible');
                showVoiceChatTooltip();
            }
        }
    } else {
        if (isNearNPC) {
            isNearNPC = false;
            canInteract = false;
            window.canInteract = false; // Update global
            npcTooltip.classList.remove('visible');
            hideVoiceChatTooltip();
        }
    }
}

console.log('NPC proximity system initialized');

// Voice chat tooltip helpers
const voiceChatTooltip = document.getElementById('voiceChatTooltip');

function showVoiceChatTooltip() {
    if (voiceChatTooltip && window.rajaModel && window.rajaModel.userData.voiceChatEnabled) {
        voiceChatTooltip.classList.add('visible');
    }
}

function hideVoiceChatTooltip() {
    if (voiceChatTooltip) {
        voiceChatTooltip.classList.remove('visible');
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
        const player = entityManager.Get('player');
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
    if (gameConfig.world === 'water') {
        animateWater(currentTime / 1000);
    }
    
    // Update chunks based on player position (INSTANT - Minecraft-style)
    // Only for nature world - temple world doesn't use chunks
    if (gameConfig.world === 'nature') {
        const player = entityManager.Get('player');
        if (player && player._position) {
            updateChunks(player._position.x, player._position.z);
        }
    }
    
    // AUDIO: Update walk sound (optimized - check every 5 frames to reduce overhead)
    if (walkAudio && frameCount % 5 === 0) {
        const player = entityManager.Get('player');
        if (player) {
            const playerController = player.GetComponent('BasicCharacterController');
            if (playerController) {
                const input = playerController.GetComponent('BasicCharacterControllerInput');
                if (input) {
                    const isMoving = input._keys.forward || input._keys.backward || 
                                   input._keys.left || input._keys.right;
                    
                    if (isMoving && !isWalkSoundPlaying) {
                        walkAudio.play().catch(e => console.log('Walk sound play prevented'));
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
    
    // Update raja mixer if it exists (both nature and architecture worlds)
    if (rajaMixer) {
        rajaMixer.update(timeElapsed);
    }
    if (window.rajaMixer) {
        window.rajaMixer.update(timeElapsed);
    }
    
    // Check proximity to NPC for tooltip
    checkNPCProximity();
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
console.log('Starting animation loop');
animate();

// Initial loading state - only for architecture world
if (gameConfig.world === 'architecture' && loadingStatus) {
    loadingStatus.textContent = 'Loading temple...';
    updateLoadingProgress();
} else if (gameConfig.world === 'nature') {
    // Nature world loads instantly
    window.gameLoaded = true;
}

// Log what should be visible
console.log('Setup complete. Character at:', playerEntity._position);
console.log('Camera at:', camera.position);
console.log('Scene children:', scene.children.length);
