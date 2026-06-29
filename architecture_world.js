// ═══════════════════════════════════════════════════════════════════════════
// 🏛️ THANJAVUR PERIYA KOVIL (BIG TEMPLE) - FBX MODEL LOADER
// ═══════════════════════════════════════════════════════════════════════════
// Loads the actual temple FBX model for exploration
// VERSION: 2.0 - UPDATED May 26, 2026 19:15 PST
// CACHE BUST: 20260526191500
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

// Store temple model reference for cleanup
let templeModel = null;
let groundPlane = null;
let collisionMeshes = []; // Wall-only colliders (for horizontal blocking)
let groundMeshes = []; // Ground + temple meshes (for vertical snapping)
let torchLights = [];
let environmentObjects = [];

/**
 * Initialize temple world with FBX model
 * @param {THREE.Scene} scene - The Three.js scene to add the temple to
 */
export function initTempleWorld(scene) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🏛️ TEMPLE WORLD v2.0 - Loading FBX Model");
  console.log("   File: Theme/Temple Theme/temple.fbx");
  console.log("   Expected: No procedural geometry, only FBX model");
  console.log("═══════════════════════════════════════════════════════════");

  // ═══════════════════════════════════════════════════════════════════
  // 1. GROUND PLANE with #AD8E68 color
  // ═══════════════════════════════════════════════════════════════════

  const groundGeometry = new THREE.PlaneGeometry(1000, 1000);

  // Temple ground - sandy brown earth (like Thanjavur Big Temple)
  const groundMaterial = new THREE.MeshBasicMaterial({
    color: 0xc4a574, // Sandy temple ground color
  });

  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = 0;
  groundPlane.receiveShadow = true;
  groundPlane.name = "TempleGround";
  scene.add(groundPlane);
  groundMeshes.push(groundPlane);

  // ═══════════════════════════════════════════════════════════════════
  // TEMPLE COMPLEX BOUNDARY - Traditional Prakara (compound wall)
  // ═══════════════════════════════════════════════════════════════════

  const wallHeight = 5; // Taller compound wall (realistic temple prakara)
  const wallThickness = 1.2;
  const complexSize = 220; // Even larger compound - more front space, arch pushed further out
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x9d8566, // Lighter stone for boundary wall
    roughness: 1.0,
    metalness: 0,
  });

  // North wall
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(complexSize, wallHeight, wallThickness),
    wallMat,
  );
  northWall.position.set(0, wallHeight / 2, complexSize / 2);
  scene.add(northWall);
  environmentObjects.push(northWall);

  // South wall (entrance side - has gap)
  const southWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(complexSize / 2 - 10, wallHeight, wallThickness),
    wallMat,
  );
  southWallLeft.position.set(
    -complexSize / 4 - 5,
    wallHeight / 2,
    -complexSize / 2,
  );
  scene.add(southWallLeft);
  environmentObjects.push(southWallLeft);

  const southWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(complexSize / 2 - 10, wallHeight, wallThickness),
    wallMat,
  );
  southWallRight.position.set(
    complexSize / 4 + 5,
    wallHeight / 2,
    -complexSize / 2,
  );
  scene.add(southWallRight);
  environmentObjects.push(southWallRight);

  // ═══════════════════════════════════════════════════════════════════
  // ENTRANCE ARCH (Gopuram gateway) with Tamil text
  // ═══════════════════════════════════════════════════════════════════

  const archHeight = 12; // Taller gopuram entrance
  const archWidth = 20; // Width of entrance gap
  const archDepth = 2;
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x9d8566,
    roughness: 1.0,
    metalness: 0,
  });

  // Left pillar
  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(2, archHeight, archDepth),
    archMat,
  );
  leftPillar.position.set(-archWidth / 2, archHeight / 2, -complexSize / 2);
  scene.add(leftPillar);
  environmentObjects.push(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(
    new THREE.BoxGeometry(2, archHeight, archDepth),
    archMat,
  );
  rightPillar.position.set(archWidth / 2, archHeight / 2, -complexSize / 2);
  scene.add(rightPillar);
  environmentObjects.push(rightPillar);

  // Top lintel (arch header) - taller for text
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(archWidth + 4, 3, archDepth),
    archMat,
  );
  lintel.position.set(0, archHeight + 1.5, -complexSize / 2);
  scene.add(lintel);
  environmentObjects.push(lintel);

  // Decorative top tier (gopuram style)
  const gopuramTop = new THREE.Mesh(
    new THREE.BoxGeometry(archWidth + 5, 1.2, archDepth + 0.3),
    new THREE.MeshStandardMaterial({
      color: 0xd4a574, // Lighter decorative color
      roughness: 1.0,
      metalness: 0,
    }),
  );
  gopuramTop.position.set(0, archHeight + 3.2, -complexSize / 2);
  scene.add(gopuramTop);
  environmentObjects.push(gopuramTop);

  // Tamil text: "தஞ்சை பெரிய கோவில்" (Thanjavur Big Temple)
  // Integrated directly on the lintel surface
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1536; // Wider canvas to prevent letter cutoff
  canvas.height = 256;

  // Match lintel color for seamless integration
  ctx.fillStyle = "#9d8566";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dark carved-look text with padding
  ctx.fillStyle = "#1a0f08";
  ctx.font = "bold 90px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("தஞ்சை பெரிய கோவில்", canvas.width / 2, canvas.height / 2);

  const textTexture = new THREE.CanvasTexture(canvas);
  const textMat = new THREE.MeshBasicMaterial({
    map: textTexture,
  });

  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(archWidth + 2, 2.2), // Adjusted to fit all letters
    textMat,
  );
  textPlane.position.set(
    0,
    archHeight + 1.5,
    -complexSize / 2 - archDepth / 2 - 0.01,
  ); // On front face of lintel
  textPlane.rotation.y = Math.PI; // Face toward player
  scene.add(textPlane);
  environmentObjects.push(textPlane);

  console.log("✓ Entrance arch (Gopuram) with Tamil text added");

  // ═══════════════════════════════════════════════════════════════════
  // TAMIL CULTURAL ELEMENTS - Kolam, Vilakku, Traditional Decor
  // ═══════════════════════════════════════════════════════════════════

  // Kolam (traditional rangoli patterns) outside entrance
  const kolamCanvas = document.createElement("canvas");
  const kolamCtx = kolamCanvas.getContext("2d");
  kolamCanvas.width = 512;
  kolamCanvas.height = 512;

  // Transparent background
  kolamCtx.clearRect(0, 0, kolamCanvas.width, kolamCanvas.height);

  // Draw kolam pattern (geometric mandala-style)
  kolamCtx.strokeStyle = "#ffffff";
  kolamCtx.fillStyle = "#f5f5f5";
  kolamCtx.lineWidth = 3;

  const centerX = kolamCanvas.width / 2;
  const centerY = kolamCanvas.height / 2;

  // Central dot pattern
  for (let i = 0; i < 5; i++) {
    const radius = 30 + i * 25;
    kolamCtx.beginPath();
    kolamCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    kolamCtx.stroke();

    // Petals
    const petals = 8;
    for (let p = 0; p < petals; p++) {
      const angle = (Math.PI * 2 * p) / petals;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      kolamCtx.beginPath();
      kolamCtx.arc(x, y, 8, 0, Math.PI * 2);
      kolamCtx.fill();
    }
  }

  const kolamTexture = new THREE.CanvasTexture(kolamCanvas);
  const kolamMat = new THREE.MeshBasicMaterial({
    map: kolamTexture,
    transparent: true,
    opacity: 0.9,
  });

  // Main kolam outside entrance
  const kolam1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), kolamMat);
  kolam1.rotation.x = -Math.PI / 2;
  kolam1.position.set(0, 0.06, -complexSize / 2 - 5);
  scene.add(kolam1);
  environmentObjects.push(kolam1);

  // Side kolams
  const kolam2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), kolamMat);
  kolam2.rotation.x = -Math.PI / 2;
  kolam2.position.set(-12, 0.06, -complexSize / 2 - 3);
  scene.add(kolam2);
  environmentObjects.push(kolam2);

  const kolam3 = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), kolamMat);
  kolam3.rotation.x = -Math.PI / 2;
  kolam3.position.set(12, 0.06, -complexSize / 2 - 3);
  scene.add(kolam3);
  environmentObjects.push(kolam3);

  // Traditional oil lamps (Vilakku) on either side of entrance
  const vilakkuMat = new THREE.MeshStandardMaterial({
    color: 0xb8956d, // Bronze
    roughness: 0.3,
    metalness: 0.7,
  });

  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff9933,
    transparent: true,
    opacity: 0.9,
  });

  function createVilakku(x, z) {
    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8),
      vilakkuMat,
    );
    base.position.y = 0.15;
    group.add(base);

    // Stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8),
      vilakkuMat,
    );
    stem.position.y = 0.7;
    group.add(stem);

    // Oil cup
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.25, 0.3, 8),
      vilakkuMat,
    );
    cup.position.y = 1.2;
    group.add(cup);

    // Flame
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.5, 6),
      flameMat,
    );
    flame.position.y = 1.6;
    group.add(flame);

    group.position.set(x, 0, z);
    return group;
  }

  const leftVilakku = createVilakku(-archWidth / 2 - 2, -complexSize / 2 + 1);
  scene.add(leftVilakku);
  environmentObjects.push(leftVilakku);

  const rightVilakku = createVilakku(archWidth / 2 + 2, -complexSize / 2 + 1);
  scene.add(rightVilakku);
  environmentObjects.push(rightVilakku);

  // Small side shrines (Utsava mandapam style) flanking the entrance
  const shrineMat = new THREE.MeshStandardMaterial({
    color: 0xa58d6d,
    roughness: 1.0,
    metalness: 0,
  });

  function createSideShrine(x, z) {
    const group = new THREE.Group();

    // Base platform
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.3, 3),
      shrineMat,
    );
    platform.position.y = 0.15;
    group.add(platform);

    // Four pillars
    const pillarPositions = [
      [-1, 1],
      [1, 1],
      [-1, -1],
      [1, -1],
    ];

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8),
        shrineMat,
      );
      pillar.position.set(px, 1.5, pz);
      group.add(pillar);
    });

    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.4, 3.5),
      new THREE.MeshStandardMaterial({
        color: 0xc49d6d,
        roughness: 1.0,
        metalness: 0,
      }),
    );
    roof.position.y = 3;
    group.add(roof);

    group.position.set(x, 0, z);
    return group;
  }

  const leftShrine = createSideShrine(-archWidth / 2 - 6, -complexSize / 2 + 4);
  scene.add(leftShrine);
  environmentObjects.push(leftShrine);

  const rightShrine = createSideShrine(archWidth / 2 + 6, -complexSize / 2 + 4);
  scene.add(rightShrine);
  environmentObjects.push(rightShrine);

  // Decorative garland strings above entrance (temple decoration)
  const garlandMat = new THREE.MeshBasicMaterial({
    color: 0xff6b35, // Orange marigold color
    transparent: true,
    opacity: 0.8,
  });

  for (let i = 0; i < 3; i++) {
    const garland = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.08, 8, 16),
      garlandMat,
    );
    garland.position.set(-6 + i * 6, archHeight - 0.5, -complexSize / 2 + 0.5);
    garland.rotation.y = Math.PI / 2;
    scene.add(garland);
    environmentObjects.push(garland);
  }

  console.log(
    "✓ Tamil cultural elements added: Kolam patterns, Vilakku (oil lamps), side shrines, garlands",
  );

  // East wall
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, complexSize),
    wallMat,
  );
  eastWall.position.set(complexSize / 2, wallHeight / 2, 0);
  scene.add(eastWall);
  environmentObjects.push(eastWall);

  // West wall
  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, complexSize),
    wallMat,
  );
  westWall.position.set(-complexSize / 2, wallHeight / 2, 0);
  scene.add(westWall);
  environmentObjects.push(westWall);

  // ═══════════════════════════════════════════════════════════════════
  // TEMPLE TANK - Water bodies OUTSIDE compound walls
  // ═══════════════════════════════════════════════════════════════════

  const waterWidth = 40; // Width of water body
  const waterGap = 3; // Gap between wall and water
  const waterY = 0.05; // Slightly above ground to prevent z-fighting
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x4a7c8f, // Temple tank water color
    roughness: 0.2,
    metalness: 0.3,
  });

  // North water (beyond north wall) - PlaneGeometry on ground
  const northWater = new THREE.Mesh(
    new THREE.PlaneGeometry(complexSize + 20, waterWidth),
    waterMat,
  );
  northWater.rotation.x = -Math.PI / 2;
  northWater.position.set(
    0,
    waterY,
    complexSize / 2 + waterWidth / 2 + waterGap,
  );
  scene.add(northWater);
  environmentObjects.push(northWater);

  // East water (beyond east wall)
  const eastWater = new THREE.Mesh(
    new THREE.PlaneGeometry(waterWidth, complexSize + 20),
    waterMat,
  );
  eastWater.rotation.x = -Math.PI / 2;
  eastWater.position.set(
    complexSize / 2 + waterWidth / 2 + waterGap,
    waterY,
    0,
  );
  scene.add(eastWater);
  environmentObjects.push(eastWater);

  // West water (beyond west wall)
  const westWater = new THREE.Mesh(
    new THREE.PlaneGeometry(waterWidth, complexSize + 20),
    waterMat,
  );
  westWater.rotation.x = -Math.PI / 2;
  westWater.position.set(
    -complexSize / 2 - waterWidth / 2 - waterGap,
    waterY,
    0,
  );
  scene.add(westWater);
  environmentObjects.push(westWater);

  console.log(
    "✓ Temple ground, compound walls (Prakara), and outer water bodies created",
  );

  // ═══════════════════════════════════════════════════════════════════
  // 2. LOAD TEMPLE FBX MODEL
  // ═══════════════════════════════════════════════════════════════════

  const loader = new FBXLoader();
  const templePath = "Theme/Temple Theme/temple.fbx";

  console.log("📦 Starting FBX load:", templePath);

  loader.load(
    templePath,
    (fbx) => {
      templeModel = fbx;
      templeModel.name = "TempleModel";

      // Calculate bounding box to determine scale and position
      const box = new THREE.Box3().setFromObject(templeModel);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      console.log("📦 Original Temple Bounding Box:");
      console.log("   Size:", size);
      console.log("   Center:", center);
      console.log("   Min:", box.min);
      console.log("   Max:", box.max);

      // Auto-scale temple to reasonable size (target max dimension = 100 units)
      const maxDimension = Math.max(size.x, size.y, size.z);
      const targetMaxSize = 100; // Target maximum dimension
      const scaleFactor = targetMaxSize / maxDimension;

      templeModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
      console.log(
        `   🔧 Auto-scaled temple by ${scaleFactor.toFixed(6)}x (from ${maxDimension.toFixed(0)} to ${targetMaxSize} units)`,
      );

      // Recalculate bounding box after scaling
      const scaledBox = new THREE.Box3().setFromObject(templeModel);
      const scaledSize = new THREE.Vector3();
      scaledBox.getSize(scaledSize);

      // Position temple so its bottom (min.y) sits on the ground (y=0)
      templeModel.position.set(0, -scaledBox.min.y, 0);

      console.log("📦 Scaled Temple:");
      console.log("   New Size:", scaledSize);
      console.log("   Position (bottom on ground):", templeModel.position);

      // Enable shadows and apply temple color
      let meshCount = 0;
      let materialCount = 0;

      // Create BRAND NEW material — do NOT clone FBX materials (they have white texture maps)
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0xad8e68,
        roughness: 1.0,
        metalness: 0,
        envMapIntensity: 0,
      });

      templeModel.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          child.castShadow = false;
          child.receiveShadow = false;
          // Replace with fresh material — no FBX textures
          child.material = stoneMat;
          materialCount++;
        }
        // Leave Line geometry untouched — white outlines are part of the carved detail
      });

      // Add temple meshes to groundMeshes ONLY for vertical stair detection.
      // Do NOT add to collisionMeshes — stair faces look like walls to horizontal
      // raycasts and block movement before the vertical snap can lift the player.
      groundMeshes.push(templeModel);
      templeModel.traverse((child) => {
        if (child.isMesh) {
          groundMeshes.push(child);
        }
      });

      scene.add(templeModel);

      // Final bounding box — used for wall collision and Raja placement
      const finalBox = new THREE.Box3().setFromObject(templeModel);
      const finalSize = new THREE.Vector3();
      const finalCenter = new THREE.Vector3();
      finalBox.getSize(finalSize);
      finalBox.getCenter(finalCenter);

      // Temple mesh in groundMeshes ONLY — player can walk in and climb stairs.
      // No horizontal collision on the temple mesh (stair faces block entry otherwise).
      console.log(
        "✓ Temple mesh in groundMeshes only — player can enter interior freely",
      );
      console.log(
        "  Temple footprint X:",
        finalBox.min.x.toFixed(1),
        "to",
        finalBox.max.x.toFixed(1),
      );
      console.log(
        "  Temple footprint Z:",
        finalBox.min.z.toFixed(1),
        "to",
        finalBox.max.z.toFixed(1),
      );

      // ════════════════════════════════════════════════════════════════
      // TRADITIONAL TEMPLE ELEMENTS - Positioned relative to temple entrance
      // ════════════════════════════════════════════════════════════════

      const entranceZ = finalBox.min.z; // Entrance side faces player at z=-80

      // Kodi Kampam (Dwaja Stambha - flagpole)
      const poleHeight = 15;
      const poleRadius = 0.3;
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0xb8956d, // Bronze/gold color
        roughness: 0.4,
        metalness: 0.6,
      });

      const poleGeometry = new THREE.CylinderGeometry(
        poleRadius,
        poleRadius * 1.2,
        poleHeight,
        12,
      );
      const kodiKampam = new THREE.Mesh(poleGeometry, poleMat);
      kodiKampam.position.set(0, poleHeight / 2, entranceZ - 30); // Well inside compound wall
      scene.add(kodiKampam);
      environmentObjects.push(kodiKampam);

      // Pole base
      const baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.8, 8);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x9d8566,
        roughness: 1.0,
        metalness: 0,
      });
      const poleBase = new THREE.Mesh(baseGeometry, baseMat);
      poleBase.position.set(0, 0.4, entranceZ - 30);
      scene.add(poleBase);
      environmentObjects.push(poleBase);

      // Nandhi (sacred bull) - Realistic detailed statue
      const nandhiMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, // Polished black granite
        roughness: 0.3,
        metalness: 0.2,
      });

      // Nandhi body (elongated rectangular body)
      const nandhiBody = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 5),
        nandhiMat,
      );
      nandhiBody.position.set(0, 1.3, entranceZ - 18);
      scene.add(nandhiBody);
      environmentObjects.push(nandhiBody);

      // Nandhi neck (connecting body to head)
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.2, 1.5, 8),
        nandhiMat,
      );
      neck.position.set(0, 2, entranceZ - 20);
      neck.rotation.x = -Math.PI / 6;
      scene.add(neck);
      environmentObjects.push(neck);

      // Nandhi head (facing toward temple entrance)
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2, 2.5),
        nandhiMat,
      );
      head.position.set(0, 2.5, entranceZ - 15.5);
      scene.add(head);
      environmentObjects.push(head);

      // Nandhi horns (curved upward)
      const hornMat = new THREE.MeshStandardMaterial({
        color: 0xe8d4b8,
        roughness: 0.6,
        metalness: 0.1,
      });

      const hornLeft = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 1.2, 8),
        hornMat,
      );
      hornLeft.position.set(-0.9, 3.5, entranceZ - 15.5);
      hornLeft.rotation.z = -0.4;
      hornLeft.rotation.x = -0.3;
      scene.add(hornLeft);
      environmentObjects.push(hornLeft);

      const hornRight = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 1.2, 8),
        hornMat,
      );
      hornRight.position.set(0.9, 3.5, entranceZ - 15.5);
      hornRight.rotation.z = 0.4;
      hornRight.rotation.x = -0.3;
      scene.add(hornRight);
      environmentObjects.push(hornRight);

      // Nandhi ears
      [
        [1, 1],
        [-1, 1],
      ].forEach(([xDir, _]) => {
        const ear = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 0.6, 8),
          nandhiMat,
        );
        ear.position.set(xDir * 1.1, 3.2, entranceZ - 15.5);
        ear.rotation.z = (xDir * Math.PI) / 3;
        scene.add(ear);
        environmentObjects.push(ear);
      });

      // Nandhi legs (four legs)
      const legPositions = [
        { x: 1.5, z: -2 },
        { x: -1.5, z: -2 },
        { x: 1.5, z: 1.5 },
        { x: -1.5, z: 1.5 },
      ];

      legPositions.forEach((pos) => {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8),
          nandhiMat,
        );
        leg.position.set(pos.x, 0.6, entranceZ - 18 + pos.z);
        scene.add(leg);
        environmentObjects.push(leg);
      });

      // Nandhi tail (curved)
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.15, 2, 8),
        nandhiMat,
      );
      tail.position.set(0, 2, entranceZ - 20.5);
      tail.rotation.x = Math.PI / 3;
      scene.add(tail);
      environmentObjects.push(tail);

      // Hump on back (distinctive feature of Nandi)
      const hump = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        nandhiMat,
      );
      hump.position.set(0, 2.8, entranceZ - 18.5);
      hump.scale.set(1, 0.7, 1.2);
      scene.add(hump);
      environmentObjects.push(hump);

      // ════════════════════════════════════════════════════════════════
      // NANDI MANDAPAM - Pavilion housing Nandhi
      // ════════════════════════════════════════════════════════════════

      const mandapamMat = new THREE.MeshStandardMaterial({
        color: 0xa89680,
        roughness: 1.0,
        metalness: 0,
      });

      // Platform base for Nandhi
      const nandhiPlatform = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.6, 8),
        mandapamMat,
      );
      nandhiPlatform.position.set(0, 0.3, entranceZ - 18);
      scene.add(nandhiPlatform);
      environmentObjects.push(nandhiPlatform);

      // Four ornate pillars around Nandhi
      const pillarPositions = [
        { x: 3.5, z: -3.5 },
        { x: -3.5, z: -3.5 },
        { x: 3.5, z: 3.5 },
        { x: -3.5, z: 3.5 },
      ];

      pillarPositions.forEach((pos) => {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.4, 5, 12),
          mandapamMat,
        );
        pillar.position.set(pos.x, 3.1, entranceZ - 18 + pos.z);
        scene.add(pillar);
        environmentObjects.push(pillar);

        // Pillar capital
        const capital = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.35, 0.6, 12),
          new THREE.MeshStandardMaterial({
            color: 0xc4a574,
            roughness: 1.0,
            metalness: 0,
          }),
        );
        capital.position.set(pos.x, 5.7, entranceZ - 18 + pos.z);
        scene.add(capital);
        environmentObjects.push(capital);
      });

      // Roof beams connecting pillars
      const roofMat = new THREE.MeshStandardMaterial({
        color: 0xc4a574,
        roughness: 1.0,
        metalness: 0,
      });

      // Longitudinal beams
      [-3.5, 3.5].forEach((x) => {
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 7.5),
          roofMat,
        );
        beam.position.set(x, 6.2, entranceZ - 18);
        scene.add(beam);
        environmentObjects.push(beam);
      });

      // Lateral beams
      [-3.5, 3.5].forEach((z) => {
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(7.5, 0.4, 0.4),
          roofMat,
        );
        beam.position.set(0, 6.2, entranceZ - 18 + z);
        scene.add(beam);
        environmentObjects.push(beam);
      });

      // Roof slab
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 0.5, 8.5),
        roofMat,
      );
      roof.position.set(0, 6.7, entranceZ - 18);
      scene.add(roof);
      environmentObjects.push(roof);

      console.log(
        "✓ Realistic Nandhi in Nandi Mandapam (facing entrance) at z=" +
          (entranceZ - 18).toFixed(1),
      );
      console.log(
        "✓ Kodi Kampam (flagpole) at z=" + (entranceZ - 30).toFixed(1),
      );

      // ════════════════════════════════════════════════════════════════
      // ADDITIONAL TEMPLE NUANCES - Pathway, Bell Pavilion, Lamp Pillars
      // ════════════════════════════════════════════════════════════════

      // Sacred stone pathway from Nandhi to temple entrance
      const pathMat = new THREE.MeshStandardMaterial({
        color: 0xa89680, // Lighter stone path
        roughness: 1.0,
        metalness: 0,
      });

      const pathway = new THREE.Mesh(
        new THREE.PlaneGeometry(6, Math.abs(entranceZ) - 8),
        pathMat,
      );
      pathway.rotation.x = -Math.PI / 2;
      pathway.position.set(0, 0.02, entranceZ / 2 - 4);
      scene.add(pathway);
      environmentObjects.push(pathway);

      // Mani Mantapam (Bell pavilion) - on the left side of pathway
      const bellPavilionMat = new THREE.MeshStandardMaterial({
        color: 0x9d8566,
        roughness: 1.0,
        metalness: 0,
      });

      function createBellPavilion(x, z) {
        const group = new THREE.Group();

        // Platform
        const platform = new THREE.Mesh(
          new THREE.BoxGeometry(4, 0.4, 4),
          bellPavilionMat,
        );
        platform.position.y = 0.2;
        group.add(platform);

        // Four pillars
        [
          [1.5, 1.5],
          [-1.5, 1.5],
          [1.5, -1.5],
          [-1.5, -1.5],
        ].forEach(([px, pz]) => {
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 4, 8),
            bellPavilionMat,
          );
          pillar.position.set(px, 2.2, pz);
          group.add(pillar);
        });

        // Roof
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(2.8, 1.5, 4),
          new THREE.MeshStandardMaterial({
            color: 0xc49d6d,
            roughness: 1.0,
            metalness: 0,
          }),
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 5;
        group.add(roof);

        // Hanging bell
        const bellMat = new THREE.MeshStandardMaterial({
          color: 0xb8956d,
          roughness: 0.3,
          metalness: 0.7,
        });

        const bell = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.4, 0.6, 8),
          bellMat,
        );
        bell.position.y = 3.5;
        group.add(bell);

        // Bell clapper
        const clapper = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 8, 8),
          bellMat,
        );
        clapper.position.y = 3;
        group.add(clapper);

        group.position.set(x, 0, z);
        return group;
      }

      const leftBellPavilion = createBellPavilion(-10, entranceZ - 10); // Further to the side
      scene.add(leftBellPavilion);
      environmentObjects.push(leftBellPavilion);

      const rightBellPavilion = createBellPavilion(10, entranceZ - 10); // Further to the side
      scene.add(rightBellPavilion);
      environmentObjects.push(rightBellPavilion);

      // Deepa Stambha (Lamp pillars) - traditional tall lamp pillars on pathway
      function createDeepaPillar(x, z) {
        const group = new THREE.Group();

        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0xa58d6d,
          roughness: 0.8,
          metalness: 0.2,
        });

        // Base
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.8, 0.5, 8),
          pillarMat,
        );
        base.position.y = 0.25;
        group.add(base);

        // Main pillar
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.3, 6, 8),
          pillarMat,
        );
        pillar.position.y = 3.25;
        group.add(pillar);

        // Multiple lamp holders (5 tiers)
        for (let i = 0; i < 5; i++) {
          const lampHolder = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.08, 8, 12),
            new THREE.MeshStandardMaterial({
              color: 0xb8956d,
              roughness: 0.3,
              metalness: 0.7,
            }),
          );
          lampHolder.position.y = 1.5 + i * 0.8;
          lampHolder.rotation.x = Math.PI / 2;
          group.add(lampHolder);

          // Small flames
          const flameMat = new THREE.MeshBasicMaterial({
            color: 0xff9933,
            transparent: true,
            opacity: 0.8,
          });

          [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((angle) => {
            const flame = new THREE.Mesh(
              new THREE.ConeGeometry(0.08, 0.3, 6),
              flameMat,
            );
            flame.position.set(
              Math.cos(angle) * 0.5,
              1.5 + i * 0.8 + 0.15,
              Math.sin(angle) * 0.5,
            );
            group.add(flame);
          });
        }

        // Top crown
        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 0.8, 8),
          new THREE.MeshStandardMaterial({
            color: 0xd4a574,
            roughness: 0.4,
            metalness: 0.5,
          }),
        );
        crown.position.y = 6.8;
        group.add(crown);

        group.position.set(x, 0, z);
        return group;
      }

      const leftDeepaPillar = createDeepaPillar(-6, entranceZ - 20);
      scene.add(leftDeepaPillar);
      environmentObjects.push(leftDeepaPillar);

      const rightDeepaPillar = createDeepaPillar(6, entranceZ - 20);
      scene.add(rightDeepaPillar);
      environmentObjects.push(rightDeepaPillar);

      console.log("✓ Added pathway, bell pavilions, and deepa pillars");

      // ════════════════════════════════════════════════════════════════
      // SHIVA LINGAM - Main deity in the sanctum sanctorum (Garbhagriha)
      // ════════════════════════════════════════════════════════════════

      // Shiva Lingam - Polished black with sacred markings
      const lingamMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a, // Polished black stone
        roughness: 0.2, // Shiny/polished surface
        metalness: 0.1,
      });

      // Avudaiyar (base platform - yoni)
      const avudaiyar = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 0.8, 16),
        lingamMat,
      );
      avudaiyar.position.set(0, 5.4, -10);
      scene.add(avudaiyar);
      environmentObjects.push(avudaiyar);

      // Shiva Lingam (smooth cylindrical body)
      const lingamCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 3, 32), // More segments for smoothness
        lingamMat,
      );
      lingamCylinder.position.set(0, 7.3, -10);
      scene.add(lingamCylinder);
      environmentObjects.push(lingamCylinder);

      // Rounded top of lingam (smooth dome)
      const lingamTop = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
        lingamMat,
      );
      lingamTop.position.set(0, 8.8, -10);
      scene.add(lingamTop);
      environmentObjects.push(lingamTop);

      // Tripundra (Three horizontal white lines - sacred markings)
      // Create a canvas texture for the front face only
      const tripundraCanvas = document.createElement("canvas");
      const tripundraCtx = tripundraCanvas.getContext("2d");
      tripundraCanvas.width = 512;
      tripundraCanvas.height = 512;

      // Transparent background
      tripundraCtx.clearRect(
        0,
        0,
        tripundraCanvas.width,
        tripundraCanvas.height,
      );

      // Draw three prominent horizontal white/ash-colored lines (thiruneeru)
      tripundraCtx.fillStyle = "#e8e8e8"; // Bright white/ash color
      const lineHeight = 35; // Much thicker lines
      const spacing = 50; // Space between lines
      const centerY = 256;
      const lineY = [centerY - spacing, centerY, centerY + spacing]; // Three evenly spaced lines
      lineY.forEach((y) => {
        tripundraCtx.fillRect(80, y - lineHeight / 2, 352, lineHeight); // Prominent horizontal lines
      });

      // Red kumkum dot in center (on the middle line)
      tripundraCtx.fillStyle = "#ff3333";
      tripundraCtx.beginPath();
      tripundraCtx.arc(256, centerY, 25, 0, Math.PI * 2); // Larger dot
      tripundraCtx.fill();

      const tripundraTexture = new THREE.CanvasTexture(tripundraCanvas);

      // Create a plane on the front face of the lingam
      const tripundraPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 2.2), // Cover front portion of lingam
        new THREE.MeshBasicMaterial({
          map: tripundraTexture,
          transparent: true,
          side: THREE.DoubleSide,
        }),
      );
      tripundraPlane.position.set(0, 7.8, -11); // Front face of lingam (facing player)
      scene.add(tripundraPlane);
      environmentObjects.push(tripundraPlane);

      console.log("✓ Tripundra (thiruneeru) and kumkum added to Shiva Lingam");

      // Decorative garland (removed - tripundra is the primary decoration)
      // Oil lamps remain
      const lampPositions = [
        { x: 2, z: 2 },
        { x: -2, z: 2 },
        { x: 2, z: -2 },
        { x: -2, z: -2 },
      ];

      lampPositions.forEach((pos) => {
        const lampBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.2, 0.2, 8),
          new THREE.MeshStandardMaterial({
            color: 0xb8956d,
            roughness: 0.3,
            metalness: 0.7,
          }),
        );
        lampBase.position.set(pos.x, 5.8, pos.z - 10); // 10 units forward
        scene.add(lampBase);
        environmentObjects.push(lampBase);

        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.3, 6),
          new THREE.MeshBasicMaterial({
            color: 0xff9933,
            transparent: true,
            opacity: 0.9,
          }),
        );
        flame.position.set(pos.x, 6.1, pos.z - 10);
        scene.add(flame);
        environmentObjects.push(flame);
      });

      console.log(
        "✓ Shiva Lingam with Tripundra and Kumkum markings added in temple sanctum",
      );

      // ════════════════════════════════════════════════════════════════
      // TEMPLE INTERIOR FLOOR - Old traditional tiles
      // ════════════════════════════════════════════════════════════════

      // Create tile pattern on canvas
      const tileCanvas = document.createElement("canvas");
      const tileCtx = tileCanvas.getContext("2d");
      tileCanvas.width = 512;
      tileCanvas.height = 512;

      // Base color - aged stone
      tileCtx.fillStyle = "#8a7a65";
      tileCtx.fillRect(0, 0, tileCanvas.width, tileCanvas.height);

      // Draw tile grid pattern
      const tileSize = 64;
      tileCtx.strokeStyle = "#6a5a45";
      tileCtx.lineWidth = 2;

      for (let x = 0; x < tileCanvas.width; x += tileSize) {
        for (let y = 0; y < tileCanvas.height; y += tileSize) {
          tileCtx.strokeRect(x, y, tileSize, tileSize);

          // Add wear/aging pattern to each tile
          tileCtx.fillStyle = "rgba(100, 80, 60, 0.1)";
          tileCtx.fillRect(
            x + Math.random() * 10,
            y + Math.random() * 10,
            Math.random() * 20,
            Math.random() * 20,
          );
        }
      }

      const tileTexture = new THREE.CanvasTexture(tileCanvas);
      tileTexture.wrapS = tileTexture.wrapT = THREE.RepeatWrapping;
      tileTexture.repeat.set(8, 8);

      const templeFloorMat = new THREE.MeshStandardMaterial({
        map: tileTexture,
        roughness: 0.9,
        metalness: 0,
      });

      // Temple interior floor (covers the area inside the temple)
      const interiorFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(finalSize.x * 0.8, finalSize.z * 0.8),
        templeFloorMat,
      );
      interiorFloor.rotation.x = -Math.PI / 2;
      interiorFloor.position.set(0, 5.02, 0); // Slightly above base to prevent z-fighting
      scene.add(interiorFloor);
      environmentObjects.push(interiorFloor);

      console.log("✓ Traditional tiled floor added inside temple");

      // NPC cube placeholders are spawned from main.js

      console.log(
        "═══════════════════════════════════════════════════════════",
      );
      console.log("✅ TEMPLE FBX MODEL LOADED & POSITIONED!");
      console.log("   Final Position:", templeModel.position);
      console.log("   Final Scale:", templeModel.scale);
      console.log("   Final Size:", finalSize);
      console.log("   Final Center:", finalCenter);
      console.log("   Children count:", templeModel.children.length);
      console.log("   Mesh count:", meshCount);
      console.log("   Material count:", materialCount);
      console.log(
        "   📸 Recommended camera: position at (0, " +
          (finalSize.y * 0.5).toFixed(1) +
          ", " +
          (finalSize.z * 2).toFixed(1) +
          "), look at (0, " +
          (finalSize.y * 0.4).toFixed(1) +
          ", 0)",
      );
      console.log(
        "═══════════════════════════════════════════════════════════",
      );
      // Update loading state
      if (window.gameLoading) {
        window.gameLoading.completeTask("world");
      }
    },
    (xhr) => {
      if (xhr.total > 0) {
        const progress = ((xhr.loaded / xhr.total) * 100).toFixed(0);
        console.log(`   📥 Loading temple FBX: ${progress}%`);
      }
    },
    (error) => {
      console.error(
        "═══════════════════════════════════════════════════════════",
      );
      console.error("❌ ERROR LOADING TEMPLE MODEL:");
      console.error("   Path:", templePath);
      console.error("   Error:", error);
      console.error(
        "   Check if file exists at: Theme/Temple Theme/temple.fbx",
      );
      console.error(
        "═══════════════════════════════════════════════════════════",
      );
      if (window.gameLoading) {
        window.gameLoading.completeTask("world");
      }
    },
  );

  // ═══════════════════════════════════════════════════════════════════
  // 3. ATMOSPHERIC LIGHTING - Dark and Moody
  // ═══════════════════════════════════════════════════════════════════

  // No ambient light - only torch point lights illuminate the temple
  // Torches provide all the light inside

  // Add realistic torches INSIDE temple only
  const torchPositions = [
    { x: 4, y: 7, z: -11 }, // Inside left wall
    { x: -4, y: 7, z: -13 }, // Inside right wall
    { x: 3.5, y: 7, z: -33 }, // Middle left wall
    { x: -3.5, y: 7, z: -33 }, // Middle right wall
    { x: 7, y: 7, z: -43.5 }, // Back left wall
    { x: -7, y: 7, z: -43.4 }, // Back right wall
  ];

  torchPositions.forEach((pos, i) => {
    // Create realistic torch model
    const torchGroup = new THREE.Group();

    // Torch pole (wood/metal)
    const poleGeometry = new THREE.CylinderGeometry(0.08, 0.1, 2, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.8,
      metalness: 0.2,
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = -1;
    torchGroup.add(pole);

    // Torch holder (metal basket)
    const holderGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.4, 8);
    const holderMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      metalness: 0.8,
    });
    const holder = new THREE.Mesh(holderGeometry, holderMaterial);
    holder.position.y = 0.2;
    torchGroup.add(holder);

    // Flame (animated-looking cone)
    const flameGeometry = new THREE.ConeGeometry(0.2, 0.6, 6);
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.9,
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = 0.6;
    torchGroup.add(flame);

    // Flame glow (inner bright part)
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.95,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.5;
    torchGroup.add(glow);

    // Position the entire torch
    torchGroup.position.set(pos.x, pos.y, pos.z);
    scene.add(torchGroup);
    environmentObjects.push(torchGroup);

    // NO POINT LIGHTS - torches are visual only, ambient provides all lighting
  });

  console.log("✓ Decorative torches added (no light sources)");

  // Create NPC placeholder boxes at spawn positions
  createNPCPlaceholders(scene);
}

/**
 * Get wall collision meshes (horizontal blocking only)
 */
export function getCollisionMeshes() {
  return collisionMeshes;
}

/**
 * Get ground meshes (vertical snapping - includes temple stairs)
 */
export function getGroundMeshes() {
  return groundMeshes;
}

/**
 * Remove temple world from scene and clean up resources
 * @param {THREE.Scene} scene - The Three.js scene to remove the temple from
 */
export function removeTempleWorld(scene) {
  console.log("🗑️ Removing temple world...");

  // Remove temple model
  if (templeModel) {
    templeModel.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    scene.remove(templeModel);
    templeModel = null;
  }

  // Remove environment objects
  environmentObjects.forEach((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    scene.remove(obj);
  });
  environmentObjects = [];

  // Remove torch lights
  torchLights.forEach((light) => scene.remove(light));
  torchLights = [];

  // Clear collision meshes
  collisionMeshes = [];

  // Remove ground plane
  if (groundPlane) {
    groundPlane.geometry.dispose();
    groundPlane.material.dispose();
    scene.remove(groundPlane);
    groundPlane = null;
  }

  // Remove lights
  const lightsToRemove = [];
  scene.traverse((child) => {
    if (
      child.name === "TempleAmbientLight" ||
      child.name === "TempleSunLight"
    ) {
      lightsToRemove.push(child);
    }
  });
  lightsToRemove.forEach((light) => scene.remove(light));

  console.log("✅ Temple world removed");
}

/**
 * Get NPC spawn positions in temple world
 * @returns {Object} Object with NPC names as keys and {x, y, z} positions as values
 */
const NPC_SPAWN_POSITIONS = {
  raja_raja_cholan: { x: 0, y: 1.5, z: -105 },
  kulasekara_pandya: { x: 30, y: 1.5, z: -60 },
  cheraman_perumal: { x: -30, y: 1.5, z: -60 },
};

export function getNPCSpawnPositions() {
  return NPC_SPAWN_POSITIONS;
}

/**
 * Create NPC placeholder boxes at spawn positions
 */
function createNPCPlaceholders(scene) {
  const playerX = 0, playerZ = 95;
  for (const [name, pos] of Object.entries(NPC_SPAWN_POSITIONS)) {
    const mesh = new THREE.Object3D();
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.y = Math.atan2(playerX - pos.x, -(playerZ - pos.z));
    mesh.name = name;
    mesh.userData.isNPC = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.add(mesh);
  }
  console.log("NPC placeholders created for temple world");
}
