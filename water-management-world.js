// ═══════════════════════════════════════════════════════════════════════════
// 🌊 KAVERI RIVER WORLD - Game-Ready River with Exploration Pathway
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';

// Store references for cleanup
let groundPlane = null;
let collisionMeshes = []; // Walls and structures that block movement
let groundMeshes = [];    // Ground and walkable surfaces
let environmentObjects = [];
let waterSurface = null;

/**
 * Create a Tamil text label as a wooden signboard with post
 * @param {string} text - Tamil text to display
 * @param {number} size - Font size
 * @returns {THREE.Group} - Signboard group (board + post)
 */
function createTamilLabel(text, size = 64) {
    const group = new THREE.Group();
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    // Wooden board background with wood grain effect
    context.fillStyle = '#8B6F47';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add wood texture lines
    context.strokeStyle = '#6B5437';
    context.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const y = (i + 1) * (canvas.height / 6);
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
    }
    
    // Border for wooden board
    context.strokeStyle = '#5B4427';
    context.lineWidth = 8;
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    
    // Tamil text
    context.font = `bold ${size}px Arial, sans-serif`;
    context.fillStyle = '#2a1a0a';  // Dark brown text
    context.strokeStyle = '#f0e0c0';  // Light outline
    context.lineWidth = 3;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text with outline for visibility
    context.strokeText(text, canvas.width / 2, canvas.height / 2);
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Wooden signboard (wider and taller like traditional signboards)
    const boardGeometry = new THREE.BoxGeometry(8, 2.5, 0.3);
    const boardMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xFFFFFF,
        roughness: 0.85,
        metalness: 0
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    group.add(board);
    
    // Wooden post (thicker and more visible)
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.18, 2.8, 8);
    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321,  // Dark brown
        roughness: 0.9,
        metalness: 0
    });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = -2.65;  // Below board
    group.add(post);
    
    return group;
}

/**
 * Initialize Kaveri River world
 * @param {THREE.Scene} scene - The Three.js scene to add the world to
 */
export function initWaterWorld(scene) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🌊 KAVERI RIVER WORLD - Game-Ready Environment');
    console.log('   River with exploration pathway for player movement');
    console.log('═══════════════════════════════════════════════════════════');
    
    const riverLength = 220;  // Extended to reach dam and flow beyond
    const riverWidth = 30;    // Wider river (was 20m)
    const riverDepth = 1.2;
    const pathwayWidth = 4;
    const segments = 88;  // More segments for longer river
    
    // ═══════════════════════════════════════════════════════════════════
    // 0. GROUND PLANE - Base terrain with texture
    // ═══════════════════════════════════════════════════════════════════
    
    // Load ground texture (path rocks for dirt path look)
    const textureLoader = new THREE.TextureLoader();
    const groundTexture = textureLoader.load('Theme/Forest Theme 1/Textures/Rocks_Diffuse.png');
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(50, 50); // Minimal repeats for best performance
    groundTexture.minFilter = THREE.LinearFilter;
    groundTexture.magFilter = THREE.LinearFilter;
    
    const groundGeometry = new THREE.PlaneGeometry(800, 800);
    const groundMaterial = new THREE.MeshBasicMaterial({
        map: groundTexture,
        color: 0xd4b896, // Bright sandy/dirt path color like preview
        side: THREE.FrontSide // Only visible from above (prevent seeing through from below)
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = false;
    ground.position.y = -0.5; // Slightly below water level to prevent z-fighting
    scene.add(ground);
    environmentObjects.push(ground);
    
    console.log('✓ Ground plane created (800m × 800m with texture)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 1. WATER SURFACE - Flowing river with subtle animation
    // ═══════════════════════════════════════════════════════════════════
    
    const waterGeometry = new THREE.PlaneGeometry(riverWidth, riverLength, segments, segments * 2);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a9fcf,  // Bright blueish water
        roughness: 0.15,
        metalness: 0.5,
        transparent: true,
        opacity: 0.9,
        emissive: 0x2a6a8e,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide
    });
    
    waterSurface = new THREE.Mesh(waterGeometry, waterMaterial);
    waterSurface.rotation.x = -Math.PI / 2; // Make horizontal
    waterSurface.position.set(0, 0, 10);  // Shifted forward to reach dam
    waterSurface.name = 'KaveriWater';
    scene.add(waterSurface);
    environmentObjects.push(waterSurface);
    
    // River label in Tamil (signboard)
    const riverLabel = createTamilLabel('ஆறு', 80);  // "ஆறு" = River
    riverLabel.position.set(18, 2.5, -40);  // Near river edge, closer to ground
    riverLabel.rotation.y = -Math.PI / 6;  // Angled toward pathway
    scene.add(riverLabel);
    environmentObjects.push(riverLabel);
    
    console.log('✓ Water surface created (220m long, 30m wide - flows to dam)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 2. RIVERBED - Dark muddy bottom
    // ═══════════════════════════════════════════════════════════════════
    
    const riverbedGeometry = new THREE.PlaneGeometry(riverWidth + 6, riverLength, segments, segments);
    const riverbedMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,  // Wet sandy riverbed
        roughness: 0.9,
        metalness: 0.05
    });
    
    const riverbed = new THREE.Mesh(riverbedGeometry, riverbedMaterial);
    riverbed.rotation.x = -Math.PI / 2;
    riverbed.position.set(0, -riverDepth, 10);  // Shifted forward to match river
    riverbed.receiveShadow = true;
    riverbed.name = 'Riverbed';
    scene.add(riverbed);
    environmentObjects.push(riverbed);
    
    console.log('✓ Riverbed created (1.2m deep)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 3. LEFT BANK (Natural side, -X)
    // ═══════════════════════════════════════════════════════════════════
    
    const leftBankGeometry = new THREE.PlaneGeometry(12, riverLength, 12, segments);
    const leftBankMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a7a5a,  // Blueish-green grass
        roughness: 0.85,
        metalness: 0
    });
    
    const leftBank = new THREE.Mesh(leftBankGeometry, leftBankMaterial);
    leftBank.rotation.x = -Math.PI / 2;
    leftBank.position.set(-19, 0.35, 10);  // Shifted forward to match river
    leftBank.receiveShadow = true;
    leftBank.name = 'LeftBank';
    scene.add(leftBank);
    environmentObjects.push(leftBank);
    groundMeshes.push(leftBank);
    
    console.log('✓ Left riverbank created (natural side)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 4. RIGHT BANK (Pathway side, +X)
    // ═══════════════════════════════════════════════════════════════════
    
    const rightBankGeometry = new THREE.PlaneGeometry(12, riverLength, 12, segments);
    const rightBankMaterial = new THREE.MeshStandardMaterial({
        color: 0x7a8a6a,  // Blueish-green maintained bank
        roughness: 0.8,
        metalness: 0,
        depthWrite: true  // Ensure proper depth rendering
    });
    
    const rightBank = new THREE.Mesh(rightBankGeometry, rightBankMaterial);
    rightBank.rotation.x = -Math.PI / 2;
    rightBank.position.set(19, 0.3, 10);  // Shifted forward to match river
    rightBank.receiveShadow = true;
    rightBank.name = 'RightBank';
    scene.add(rightBank);
    environmentObjects.push(rightBank);
    groundMeshes.push(rightBank);
    
    console.log('✓ Right riverbank created (pathway side)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 5. EXPLORATION PATHWAY - Flat, clear walking path
    // ═══════════════════════════════════════════════════════════════════
    
    const pathwayGeometry = new THREE.PlaneGeometry(pathwayWidth, riverLength, 2, segments);
    const pathwayMaterial = new THREE.MeshStandardMaterial({
        color: 0x8a9a7a,  // Stone path with blueish tint
        roughness: 0.75,
        metalness: 0.1,
        depthWrite: true,  // Ensure proper depth rendering
        polygonOffset: true,  // Enable polygon offset
        polygonOffsetFactor: -1,  // Render on top
        polygonOffsetUnits: -1
    });
    
    const pathway = new THREE.Mesh(pathwayGeometry, pathwayMaterial);
    pathway.rotation.x = -Math.PI / 2;
    pathway.position.set(26.5, 0.65, 10);  // Shifted forward to match river
    pathway.receiveShadow = true;
    pathway.name = 'ExplorationPath';
    scene.add(pathway);
    environmentObjects.push(pathway);
    groundMeshes.push(pathway);
    
    console.log('✓ Exploration pathway created (4m wide, perfectly flat)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 6. EXTENDED GROUND (Beyond pathway and opposite bank)
    // ═══════════════════════════════════════════════════════════════════
    
    // Ground on far +X side (beyond pathway)
    const farGround = new THREE.Mesh(
        new THREE.PlaneGeometry(30, riverLength, 10, segments),
        new THREE.MeshStandardMaterial({
            color: 0x6a8a6a,  // Blueish grassy field
            roughness: 0.85,
            metalness: 0
        })
    );
    farGround.rotation.x = -Math.PI / 2;
    farGround.position.set(42, 0.45, 10);  // Shifted forward to match river
    farGround.receiveShadow = true;
    scene.add(farGround);
    environmentObjects.push(farGround);
    groundMeshes.push(farGround);
    
    // Ground on far -X side (beyond left bank)
    const leftGround = new THREE.Mesh(
        new THREE.PlaneGeometry(40, riverLength, 15, segments),
        new THREE.MeshStandardMaterial({
            color: 0x5a7a5a,  // Blueish natural grass
            roughness: 0.9,
            metalness: 0
        })
    );
    leftGround.rotation.x = -Math.PI / 2;
    leftGround.position.set(-43, 0.35, 10);  // Shifted forward to match river
    leftGround.receiveShadow = true;
    scene.add(leftGround);
    environmentObjects.push(leftGround);
    groundMeshes.push(leftGround);
    
    console.log('✓ Extended terrain created');
    
    // ═══════════════════════════════════════════════════════════════════
    // 7. KALLANAI DAM (Grand Anicut) - Low diversion dam at river end
    // ═══════════════════════════════════════════════════════════════════
    
    const damPosition = 100;  // Z position (moved further downstream to reduce visual clutter)
    const damWidth = riverWidth + 4;  // Spans full river width plus banks (34m)
    const damHeight = 4;  // Reduced dam height (was 8m)
    const damThickness = 4;  // Thicker for structural support
    const damBaseY = 0.5;  // Elevated base to prevent ground collision/glitching
    
    // Stone material for dam
    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a5a4a,  // Gray-brown stone
        roughness: 0.95,
        metalness: 0,
        flatShading: true  // Rough blocky appearance
    });
    
    // ARCHED DAM STRUCTURE - Similar to Kallanai with multiple openings
    const numArches = 6;  // Number of arched openings
    const archWidth = 5;  // Width of each arch opening
    const pillarWidth = 1.5;  // Width of pillars between arches
    const archHeight = 2.5;  // Height of arch openings (reduced for lower dam)
    const totalSpan = numArches * archWidth + (numArches + 1) * pillarWidth;
    
    // Create pillars (vertical supports)
    for (let i = 0; i <= numArches; i++) {
        const xPos = -totalSpan / 2 + i * (archWidth + pillarWidth) + pillarWidth / 2;
        
        const pillar = new THREE.Mesh(
            new THREE.BoxGeometry(pillarWidth, damHeight, damThickness),
            stoneMaterial
        );
        pillar.position.set(xPos, damBaseY + damHeight / 2, damPosition);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        pillar.name = 'DamPillar' + i;
        scene.add(pillar);
        environmentObjects.push(pillar);
        collisionMeshes.push(pillar);
    }
    
    // Create top walkway (roadway across dam)
    const topWalkway = new THREE.Mesh(
        new THREE.BoxGeometry(damWidth, 0.5, damThickness),
        stoneMaterial
    );
    topWalkway.position.set(0, damBaseY + damHeight, damPosition);
    topWalkway.receiveShadow = true;
    topWalkway.name = 'DamWalkway';
    scene.add(topWalkway);
    environmentObjects.push(topWalkway);
    groundMeshes.push(topWalkway);  // Walkable top surface
    
    // Create arch tops (curved sections above openings)
    for (let i = 0; i < numArches; i++) {
        const xPos = -totalSpan / 2 + i * (archWidth + pillarWidth) + pillarWidth + archWidth / 2;
        
        // Arch top beam
        const archTop = new THREE.Mesh(
            new THREE.BoxGeometry(archWidth, damHeight - archHeight, damThickness),
            stoneMaterial
        );
        archTop.position.set(xPos, damBaseY + archHeight + (damHeight - archHeight) / 2, damPosition);
        archTop.castShadow = true;
        archTop.receiveShadow = true;
        scene.add(archTop);
        environmentObjects.push(archTop);
        collisionMeshes.push(archTop);
        
        // Curved arch detail (visual only)
        const archCurve = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, archWidth, 8),
            stoneMaterial
        );
        archCurve.rotation.z = Math.PI / 2;
        archCurve.position.set(xPos, damBaseY + archHeight, damPosition);
        scene.add(archCurve);
        environmentObjects.push(archCurve);
    }
    
    // Add decorative railing on top of walkway
    const railingHeight = 0.8;
    const railingLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, railingHeight, damThickness),
        stoneMaterial
    );
    railingLeft.position.set(-damWidth / 2 + 0.5, damBaseY + damHeight + railingHeight / 2, damPosition);
    scene.add(railingLeft);
    environmentObjects.push(railingLeft);
    
    const railingRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, railingHeight, damThickness),
        stoneMaterial
    );
    railingRight.position.set(damWidth / 2 - 0.5, damBaseY + damHeight + railingHeight / 2, damPosition);
    scene.add(railingRight);
    environmentObjects.push(railingRight);
    
    // Downstream apron - water landing area after flowing through arches
    const apronWidth = damWidth;
    const apronLength = 8;
    const apron = new THREE.Mesh(
        new THREE.PlaneGeometry(apronWidth, apronLength, 10, 5),
        new THREE.MeshStandardMaterial({
            color: 0x5a4a3a,  // Wet stone/concrete
            roughness: 0.85,
            metalness: 0.1
        })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(0, 0.1, damPosition + damThickness / 2 + apronLength / 2);  // Elevated above ground
    apron.receiveShadow = true;
    scene.add(apron);
    environmentObjects.push(apron);
    groundMeshes.push(apron);
    
    // Dam label in Tamil (signboard)
    const damLabel = createTamilLabel('அணை', 80);  // "அணை" = Dam
    damLabel.position.set(20, 3, damPosition + 8);  // Near dam, on pathway side
    damLabel.rotation.y = -Math.PI / 4;  // Angled toward dam
    scene.add(damLabel);
    environmentObjects.push(damLabel);
    
    // Karikala Cholan name written on dam wall (bright inscription)
    const inscriptionCanvas = document.createElement('canvas');
    const inscriptionContext = inscriptionCanvas.getContext('2d');
    inscriptionCanvas.width = 2048;
    inscriptionCanvas.height = 512;
    
    // Transparent background
    inscriptionContext.fillStyle = 'transparent';
    inscriptionContext.fillRect(0, 0, inscriptionCanvas.width, inscriptionCanvas.height);
    
    // Draw bright yellow/gold text for visibility
    inscriptionContext.font = 'bold 120px Arial, sans-serif';
    inscriptionContext.fillStyle = '#FFD700';  // Bright gold
    inscriptionContext.strokeStyle = '#000000';  // Black outline for contrast
    inscriptionContext.lineWidth = 8;
    inscriptionContext.textAlign = 'center';
    inscriptionContext.textBaseline = 'top';
    
    // Write "கரிகால சோழன்" (Karikala Cholan)
    inscriptionContext.strokeText('கரிகால சோழன்', inscriptionCanvas.width / 2, 60);
    inscriptionContext.fillText('கரிகால சோழன்', inscriptionCanvas.width / 2, 60);
    
    // Draw year "150 CE" below
    inscriptionContext.font = 'bold 80px Arial, sans-serif';
    inscriptionContext.fillStyle = '#FFA500';  // Bright orange for year
    inscriptionContext.lineWidth = 6;
    inscriptionContext.strokeText('150 CE', inscriptionCanvas.width / 2, 220);
    inscriptionContext.fillText('150 CE', inscriptionCanvas.width / 2, 220);
    
    const inscriptionTexture = new THREE.CanvasTexture(inscriptionCanvas);
    inscriptionTexture.needsUpdate = true;
    
    // Create plane for inscription on dam wall (upstream face)
    const inscriptionPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(damWidth * 0.8, damHeight * 0.7),
        new THREE.MeshBasicMaterial({
            map: inscriptionTexture,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthTest: true
        })
    );
    inscriptionPlane.position.set(0, damBaseY + damHeight / 2 + 1.0, damPosition - damThickness / 2 - 0.05);
    inscriptionPlane.rotation.y = Math.PI;  // Rotate 180 degrees to flip text correctly
    inscriptionPlane.name = 'DamInscription';
    scene.add(inscriptionPlane);
    environmentObjects.push(inscriptionPlane);
    
    console.log('✓ Kallanai Dam (Grand Anicut) created');
    console.log('  - Arched dam with ' + numArches + ' openings for water flow');
    console.log('  - Position: Z=' + damPosition + 'm');
    console.log('  - River flows continuously through dam arches');
    console.log('  - Inscription on dam wall: கரிகால சோழன் (Karikala Cholan) - 150 CE');
    
    // ═══════════════════════════════════════════════════════════════════
    // 8. IRRIGATION CANAL - Diverts water from dam to lake
    // ═══════════════════════════════════════════════════════════════════
    
    const canalWidth = 8;
    const canalSegments = 3;  // Break canal into connected segments
    
    // Segment 1: Exit from dam (straight)
    const segment1StartX = -18;
    const segment1StartZ = damPosition + 2;
    const segment1EndX = -25;
    const segment1EndZ = damPosition + 10;
    const segment1Length = 10;
    
    // Segment 2: Middle transition (angled)
    const segment2StartX = -25;
    const segment2StartZ = damPosition + 10;
    const segment2EndX = -40;
    const segment2EndZ = damPosition + 25;
    const segment2Length = 20;
    
    // Segment 3: Lake entry (straight)
    const segment3StartX = -40;
    const segment3StartZ = damPosition + 25;
    const segment3EndX = -65;  // Extended to reach new lake position
    const segment3EndZ = damPosition + 50;
    const segment3Length = 30;  // Longer to reach lake
    
    // Water material for canal
    const canalWaterMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a9fcf,
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0.85,
        emissive: 0x2a6a8e,
        emissiveIntensity: 0.2
    });
    
    const canalBankMaterial = new THREE.MeshStandardMaterial({
        color: 0x7a8a6a,
        roughness: 0.85,
        metalness: 0
    });
    
    // SEGMENT 1: Dam exit (straight section) - using BoxGeometry for solid water channel
    const canal1Angle = Math.atan2(segment1EndX - segment1StartX, segment1EndZ - segment1StartZ);
    const canal1ActualLength = Math.sqrt(
        Math.pow(segment1EndX - segment1StartX, 2) + 
        Math.pow(segment1EndZ - segment1StartZ, 2)
    );
    
    const canal1Water = new THREE.Mesh(
        new THREE.BoxGeometry(canalWidth, 0.3, canal1ActualLength + 5),
        canalWaterMaterial
    );
    canal1Water.rotation.y = canal1Angle;
    canal1Water.position.set(
        (segment1StartX + segment1EndX) / 2, 
        0.2, 
        (segment1StartZ + segment1EndZ) / 2
    );
    scene.add(canal1Water);
    environmentObjects.push(canal1Water);
    
    const canal1BankL = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, canal1ActualLength + 5),
        canalBankMaterial
    );
    canal1BankL.rotation.y = canal1Angle;
    canal1BankL.position.set(
        (segment1StartX + segment1EndX) / 2 + Math.cos(canal1Angle - Math.PI/2) * 5.25,
        0.4,
        (segment1StartZ + segment1EndZ) / 2 - Math.sin(canal1Angle - Math.PI/2) * 5.25
    );
    scene.add(canal1BankL);
    environmentObjects.push(canal1BankL);
    groundMeshes.push(canal1BankL);
    
    const canal1BankR = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, canal1ActualLength + 5),
        canalBankMaterial
    );
    canal1BankR.rotation.y = canal1Angle;
    canal1BankR.position.set(
        (segment1StartX + segment1EndX) / 2 - Math.cos(canal1Angle - Math.PI/2) * 5.25,
        0.4,
        (segment1StartZ + segment1EndZ) / 2 + Math.sin(canal1Angle - Math.PI/2) * 5.25
    );
    scene.add(canal1BankR);
    environmentObjects.push(canal1BankR);
    groundMeshes.push(canal1BankR);
    
    // SEGMENT 2: Middle transition (angled section) - smooth continuous channel
    const canal2Angle = Math.atan2(segment2EndX - segment2StartX, segment2EndZ - segment2StartZ);
    const canal2ActualLength = Math.sqrt(
        Math.pow(segment2EndX - segment2StartX, 2) + 
        Math.pow(segment2EndZ - segment2StartZ, 2)
    );
    
    const canal2Water = new THREE.Mesh(
        new THREE.BoxGeometry(canalWidth, 0.3, canal2ActualLength + 6),
        canalWaterMaterial
    );
    canal2Water.rotation.y = canal2Angle;
    canal2Water.position.set(
        (segment2StartX + segment2EndX) / 2,
        0.2,
        (segment2StartZ + segment2EndZ) / 2
    );
    scene.add(canal2Water);
    environmentObjects.push(canal2Water);
    
    const canal2BankL = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, canal2ActualLength + 6),
        canalBankMaterial
    );
    canal2BankL.rotation.y = canal2Angle;
    canal2BankL.position.set(
        (segment2StartX + segment2EndX) / 2 + Math.cos(canal2Angle - Math.PI/2) * 5.25,
        0.4,
        (segment2StartZ + segment2EndZ) / 2 - Math.sin(canal2Angle - Math.PI/2) * 5.25
    );
    scene.add(canal2BankL);
    environmentObjects.push(canal2BankL);
    groundMeshes.push(canal2BankL);
    
    const canal2BankR = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, canal2ActualLength + 6),
        canalBankMaterial
    );
    canal2BankR.rotation.y = canal2Angle;
    canal2BankR.position.set(
        (segment2StartX + segment2EndX) / 2 - Math.cos(canal2Angle - Math.PI/2) * 5.25,
        0.4,
        (segment2StartZ + segment2EndZ) / 2 + Math.sin(canal2Angle - Math.PI/2) * 5.25
    );
    scene.add(canal2BankR);
    environmentObjects.push(canal2BankR);
    groundMeshes.push(canal2BankR);
    
    // Curved transition between segment 1 and 2
    const transition1Geometry = new THREE.CylinderGeometry(canalWidth/2, canalWidth/2, 0.3, 16, 1, false, 0, Math.PI);
    const transition1Water = new THREE.Mesh(transition1Geometry, canalWaterMaterial);
    transition1Water.rotation.x = Math.PI / 2;
    transition1Water.rotation.z = (canal1Angle + canal2Angle) / 2;
    transition1Water.position.set(segment1EndX, 0.2, segment1EndZ);
    scene.add(transition1Water);
    environmentObjects.push(transition1Water);
    
    // SEGMENT 3: Lake entry (straight to lake) - smooth continuous flow
    const canal3Angle = Math.atan2(segment3EndX - segment3StartX, segment3EndZ - segment3StartZ);
    const canal3ActualLength = Math.sqrt(
        Math.pow(segment3EndX - segment3StartX, 2) + 
        Math.pow(segment3EndZ - segment3StartZ, 2)
    );
    
    const canal3Water = new THREE.Mesh(
        new THREE.BoxGeometry(canalWidth, 0.3, canal3ActualLength + 8),
        canalWaterMaterial
    );
    canal3Water.rotation.y = canal3Angle;
    canal3Water.position.set(
        (segment3StartX + segment3EndX) / 2,
        0.2,
        (segment3StartZ + segment3EndZ) / 2
    );
    scene.add(canal3Water);
    environmentObjects.push(canal3Water);
    
    const canal3BankL = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, canal3ActualLength + 8),
        canalBankMaterial
    );
    canal3BankL.rotation.y = canal3Angle;
    canal3BankL.position.set(
        (segment3StartX + segment3EndX) / 2 + Math.cos(canal3Angle - Math.PI/2) * 5.25,
        0.4,
        (segment3StartZ + segment3EndZ) / 2 - Math.sin(canal3Angle - Math.PI/2) * 5.25
    );
    scene.add(canal3BankL);
    environmentObjects.push(canal3BankL);
    groundMeshes.push(canal3BankL);
    
    const canal3BankR = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, canal3ActualLength + 8),
        canalBankMaterial
    );
    canal3BankR.rotation.y = canal3Angle;
    canal3BankR.position.set(
        (segment3StartX + segment3EndX) / 2 - Math.cos(canal3Angle - Math.PI/2) * 5.25,
        0.4,
        (segment3StartZ + segment3EndZ) / 2 + Math.sin(canal3Angle - Math.PI/2) * 5.25
    );
    scene.add(canal3BankR);
    environmentObjects.push(canal3BankR);
    groundMeshes.push(canal3BankR);
    
    // Curved transition between segment 2 and 3
    const transition2Geometry = new THREE.CylinderGeometry(canalWidth/2, canalWidth/2, 0.3, 16, 1, false, 0, Math.PI);
    const transition2Water = new THREE.Mesh(transition2Geometry, canalWaterMaterial);
    transition2Water.rotation.x = Math.PI / 2;
    transition2Water.rotation.z = (canal2Angle + canal3Angle) / 2;
    transition2Water.position.set(segment2EndX, 0.2, segment2EndZ);
    scene.add(transition2Water);
    environmentObjects.push(transition2Water);
    
    // Inlet canal label in Tamil (signboard)
    const canalLabel = createTamilLabel('கால்வாய்', 60);  // "கால்வாய்" = Canal
    canalLabel.position.set(-20, 2.5, damPosition + 30);  // Near canal, closer to ground
    canalLabel.rotation.y = Math.PI / 2;  // Facing along canal
    scene.add(canalLabel);
    environmentObjects.push(canalLabel);
    
    console.log('✓ Irrigation canal created (3 connected segments, 60m total length)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 9. SWIMMING POOL LAKE - Large reservoir fed by canal
    // ═══════════════════════════════════════════════════════════════════
    
    const lakeX = -80;  // Moved further from canal (was -60)
    const lakeZ = damPosition + 60;  // Moved further downstream (was +40)
    const lakeRadius = 45;  // Much larger (was 25m)
    const lakeDepth = 4;
    
    // Lake water surface (circular) - crystal clear pool water
    const lakeWaterGeometry = new THREE.CircleGeometry(lakeRadius, 48);
    const lakeWaterMaterial = new THREE.MeshStandardMaterial({
        color: 0x5ac8fa,  // Bright cyan swimming pool color
        roughness: 0.05,  // Very smooth, glassy surface
        metalness: 0.7,
        transparent: true,
        opacity: 0.85,  // More transparent to see depth
        emissive: 0x3aa0cf,
        emissiveIntensity: 0.15
    });
    
    const lakeWater = new THREE.Mesh(lakeWaterGeometry, lakeWaterMaterial);
    lakeWater.rotation.x = -Math.PI / 2;
    lakeWater.position.set(lakeX, 1.0, lakeZ);  // Elevated above ground to prevent z-fighting
    lakeWater.name = 'SwimmingPoolLake';
    scene.add(lakeWater);
    environmentObjects.push(lakeWater);
    
    // Pool floor (light blue tiles)
    const lakeBed = new THREE.Mesh(
        new THREE.CircleGeometry(lakeRadius + 1, 48),
        new THREE.MeshStandardMaterial({
            color: 0x6ad8ff,  // Light blue pool tiles
            roughness: 0.3,
            metalness: 0.2
        })
    );
    lakeBed.rotation.x = -Math.PI / 2;
    lakeBed.position.set(lakeX, 1.0 - lakeDepth, lakeZ);  // Below water surface
    scene.add(lakeBed);
    environmentObjects.push(lakeBed);
    
    // Surrounding elevated terrain (hills around lake)
    const hillMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a7a5a,  // Green hills
        roughness: 0.9,
        metalness: 0
    });
    
    // Create hills around pool perimeter (further away for larger pool)
    const numHills = 8;
    for (let i = 0; i < numHills; i++) {
        const angle = (i / numHills) * Math.PI * 2;
        const hillDist = lakeRadius + 18 + Math.random() * 8;  // Further away
        const hillX = lakeX + Math.cos(angle) * hillDist;
        const hillZ = lakeZ + Math.sin(angle) * hillDist;
        const hillHeight = 3 + Math.random() * 4;
        const hillRadius = 6 + Math.random() * 4;
        
        const hill = new THREE.Mesh(
            new THREE.CylinderGeometry(0, hillRadius, hillHeight, 8),
            hillMaterial
        );
        hill.position.set(hillX, hillHeight / 2, hillZ);
        scene.add(hill);
        environmentObjects.push(hill);
    }
    
    // Pool edge (concrete rim) - replaces shore
    const poolEdge = new THREE.Mesh(
        new THREE.RingGeometry(lakeRadius, lakeRadius + 3, 48),
        new THREE.MeshStandardMaterial({
            color: 0xcccccc,  // Light gray concrete
            roughness: 0.6,
            metalness: 0.1
        })
    );
    poolEdge.rotation.x = -Math.PI / 2;
    poolEdge.position.set(lakeX, 1.1, lakeZ);  // Above water, no z-fighting
    scene.add(poolEdge);
    environmentObjects.push(poolEdge);
    groundMeshes.push(poolEdge);
    
    // Pool deck (wider concrete area for walking)
    const poolDeck = new THREE.Mesh(
        new THREE.RingGeometry(lakeRadius + 3, lakeRadius + 8, 48),
        new THREE.MeshStandardMaterial({
            color: 0xb0b0b0,  // Darker gray concrete deck
            roughness: 0.75,
            metalness: 0.05
        })
    );
    poolDeck.rotation.x = -Math.PI / 2;
    poolDeck.position.set(lakeX, 1.15, lakeZ);  // Highest layer, walkable
    scene.add(poolDeck);
    environmentObjects.push(poolDeck);
    groundMeshes.push(poolDeck);
    
    // Lake label in Tamil (signboard)
    const lakeLabel = createTamilLabel('ஏரி', 80);  // "ஏரி" = Lake
    lakeLabel.position.set(lakeX + 30, 3, lakeZ);  // Near lake edge, closer to ground
    scene.add(lakeLabel);
    environmentObjects.push(lakeLabel);
    
    console.log('✓ Swimming pool lake created (45m radius - swimming pool style)');
    console.log('  - Position: (' + lakeX + ', ' + lakeZ + ') - moved further from canal');
    console.log('  - Elevated to prevent z-fighting with terrain');
    console.log('  - Fed by extended irrigation canal from dam');
    
    // ═══════════════════════════════════════════════════════════════════
    // 10. OUTLET CANAL - Overflow from lake to pond
    // ═══════════════════════════════════════════════════════════════════
    
    const outletCanalWidth = 6;
    const outletCanalLength = 35;
    const outletStartX = lakeX - 10;  // From side of lake
    const outletStartZ = lakeZ + 45;
    const outletEndX = lakeX - 25;
    const outletEndZ = lakeZ + 75;
    
    // Outlet canal water
    const outletWaterMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a9fcf,
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0.85,
        emissive: 0x2a6a8e,
        emissiveIntensity: 0.2
    });
    
    const outletAngle = Math.atan2(outletEndX - outletStartX, outletEndZ - outletStartZ);
    const outletActualLength = Math.sqrt(
        Math.pow(outletEndX - outletStartX, 2) + 
        Math.pow(outletEndZ - outletStartZ, 2)
    );
    
    const outletWater = new THREE.Mesh(
        new THREE.BoxGeometry(outletCanalWidth, 0.3, outletActualLength + 5),
        outletWaterMaterial
    );
    outletWater.rotation.y = outletAngle;
    outletWater.position.set(
        (outletStartX + outletEndX) / 2,
        0.9,
        (outletStartZ + outletEndZ) / 2
    );
    scene.add(outletWater);
    environmentObjects.push(outletWater);
    
    // Outlet canal banks
    const outletBankL = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, outletActualLength + 5),
        canalBankMaterial
    );
    outletBankL.rotation.y = outletAngle;
    outletBankL.position.set(
        (outletStartX + outletEndX) / 2 + Math.cos(outletAngle - Math.PI/2) * 4.25,
        1.0,
        (outletStartZ + outletEndZ) / 2 - Math.sin(outletAngle - Math.PI/2) * 4.25
    );
    scene.add(outletBankL);
    environmentObjects.push(outletBankL);
    groundMeshes.push(outletBankL);
    
    const outletBankR = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, outletActualLength + 5),
        canalBankMaterial
    );
    outletBankR.rotation.y = outletAngle;
    outletBankR.position.set(
        (outletStartX + outletEndX) / 2 - Math.cos(outletAngle - Math.PI/2) * 4.25,
        1.0,
        (outletStartZ + outletEndZ) / 2 + Math.sin(outletAngle - Math.PI/2) * 4.25
    );
    scene.add(outletBankR);
    environmentObjects.push(outletBankR);
    groundMeshes.push(outletBankR);
    
    // Decorative stones at outlet canal ends
    
    const outletStone1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), stoneMaterial);
    outletStone1.position.set(outletStartX - 3, 1.2, outletStartZ);
    outletStone1.scale.set(1, 0.6, 1);
    scene.add(outletStone1);
    environmentObjects.push(outletStone1);
    
    const outletStone2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), stoneMaterial);
    outletStone2.position.set(outletStartX + 3, 1.2, outletStartZ);
    outletStone2.scale.set(1, 0.6, 1);
    scene.add(outletStone2);
    environmentObjects.push(outletStone2);
    
    console.log('✓ Outlet canal created (6m wide, 35m long from lake)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 11. STORAGE POND - Final water collection point
    // ═══════════════════════════════════════════════════════════════════
    
    const pondX = lakeX - 30;
    const pondZ = lakeZ + 85;
    const pondRadius = 20;  // Smaller than lake
    const pondDepth = 2.5;
    
    // Pond water surface (natural pond, not pool-like)
    const pondWaterGeometry = new THREE.CircleGeometry(pondRadius, 32);
    const pondWaterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a7fcf,  // Natural pond blue
        roughness: 0.25,
        metalness: 0.4,
        transparent: true,
        opacity: 0.8,
        emissive: 0x1a5a7e,
        emissiveIntensity: 0.2
    });
    
    const pondWater = new THREE.Mesh(pondWaterGeometry, pondWaterMaterial);
    pondWater.rotation.x = -Math.PI / 2;
    pondWater.position.set(pondX, 0.5, pondZ);
    pondWater.name = 'StoragePond';
    scene.add(pondWater);
    environmentObjects.push(pondWater);
    
    // Pond bed (muddy bottom)
    const pondBed = new THREE.Mesh(
        new THREE.CircleGeometry(pondRadius + 1, 32),
        new THREE.MeshStandardMaterial({
            color: 0x4a3a2a,  // Brown mud
            roughness: 0.95,
            metalness: 0
        })
    );
    pondBed.rotation.x = -Math.PI / 2;
    pondBed.position.set(pondX, 0.5 - pondDepth, pondZ);
    scene.add(pondBed);
    environmentObjects.push(pondBed);
    
    // Pond shore (grassy banks)
    const pondShore = new THREE.Mesh(
        new THREE.RingGeometry(pondRadius, pondRadius + 4, 32),
        new THREE.MeshStandardMaterial({
            color: 0x6a8a5a,  // Grassy green
            roughness: 0.85,
            metalness: 0
        })
    );
    pondShore.rotation.x = -Math.PI / 2;
    pondShore.position.set(pondX, 0.55, pondZ);
    scene.add(pondShore);
    environmentObjects.push(pondShore);
    groundMeshes.push(pondShore);
    
    // Small trees/vegetation around pond
    const vegetationMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a6a3a,
        roughness: 0.9,
        metalness: 0
    });
    
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const vegDist = pondRadius + 5 + Math.random() * 3;
        const vegX = pondX + Math.cos(angle) * vegDist;
        const vegZ = pondZ + Math.sin(angle) * vegDist;
        const vegHeight = 2 + Math.random() * 2;
        
        const vegetation = new THREE.Mesh(
            new THREE.ConeGeometry(0.8, vegHeight, 6),
            vegetationMaterial
        );
        vegetation.position.set(vegX, vegHeight / 2, vegZ);
        scene.add(vegetation);
        environmentObjects.push(vegetation);
    }
    
    // Pond label in Tamil (signboard)
    const pondLabel = createTamilLabel('குளம்', 70);  // "குளம்" = Pond
    pondLabel.position.set(pondX + 15, 2.5, pondZ);  // Near pond edge, closer to ground
    scene.add(pondLabel);
    environmentObjects.push(pondLabel);
    
    console.log('✓ Storage pond created (20m radius with natural banks)');
    console.log('  - Position: (' + pondX + ', ' + pondZ + ')');
    console.log('  - Fed by outlet canal from swimming pool lake');
    
    // ═══════════════════════════════════════════════════════════════════
    // 12. IRRIGATION CANAL - From pond to farmland
    // ═══════════════════════════════════════════════════════════════════
    
    const farmCanalWidth = 5;
    const farmCanalLength = 30;
    const farmCanalStartX = pondX + 15;
    const farmCanalStartZ = pondZ + 15;
    const farmCanalEndX = pondX + 35;
    const farmCanalEndZ = pondZ + 35;
    
    // Farm canal water - using BoxGeometry for continuous flow
    const farmAngle = Math.atan2(farmCanalEndX - farmCanalStartX, farmCanalEndZ - farmCanalStartZ);
    const farmActualLength = Math.sqrt(
        Math.pow(farmCanalEndX - farmCanalStartX, 2) + 
        Math.pow(farmCanalEndZ - farmCanalStartZ, 2)
    );
    
    const farmCanalWater = new THREE.Mesh(
        new THREE.BoxGeometry(farmCanalWidth, 0.3, farmActualLength + 5),
        outletWaterMaterial
    );
    farmCanalWater.rotation.y = farmAngle;
    farmCanalWater.position.set(
        (farmCanalStartX + farmCanalEndX) / 2,
        0.5,
        (farmCanalStartZ + farmCanalEndZ) / 2
    );
    scene.add(farmCanalWater);
    environmentObjects.push(farmCanalWater);
    
    // Farm canal banks
    const farmBankL = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, farmActualLength + 5),
        canalBankMaterial
    );
    farmBankL.rotation.y = farmAngle;
    farmBankL.position.set(
        (farmCanalStartX + farmCanalEndX) / 2 + Math.cos(farmAngle - Math.PI/2) * 3.75,
        0.6,
        (farmCanalStartZ + farmCanalEndZ) / 2 - Math.sin(farmAngle - Math.PI/2) * 3.75
    );
    scene.add(farmBankL);
    environmentObjects.push(farmBankL);
    groundMeshes.push(farmBankL);
    
    const farmBankR = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.4, farmActualLength + 5),
        canalBankMaterial
    );
    farmBankR.rotation.y = farmAngle;
    farmBankR.position.set(
        (farmCanalStartX + farmCanalEndX) / 2 - Math.cos(farmAngle - Math.PI/2) * 3.75,
        0.6,
        (farmCanalStartZ + farmCanalEndZ) / 2 + Math.sin(farmAngle - Math.PI/2) * 3.75
    );
    scene.add(farmBankR);
    environmentObjects.push(farmBankR);
    groundMeshes.push(farmBankR);
    
    // Decorative stones at farm canal entrance
    const farmStone1 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), stoneMaterial);
    farmStone1.position.set(farmCanalStartX - 2.5, 0.75, farmCanalStartZ);
    farmStone1.scale.set(1, 0.6, 1);
    scene.add(farmStone1);
    environmentObjects.push(farmStone1);
    
    const farmStone2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), stoneMaterial);
    farmStone2.position.set(farmCanalStartX + 2.5, 0.75, farmCanalStartZ);
    farmStone2.scale.set(1, 0.6, 1);
    scene.add(farmStone2);
    environmentObjects.push(farmStone2);
    
    console.log('✓ Farm irrigation canal created (5m wide, 30m long)');
    
    // ═══════════════════════════════════════════════════════════════════
    // 13. TERRACED FARMLAND - Two-level agricultural fields
    // ═══════════════════════════════════════════════════════════════════
    
    const farmX = pondX + 50;
    const farmZ = pondZ + 50;
    const farmWidth = 35;
    const farmDepth = 30;
    
    // Grass/crop material for farmland
    const cropMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a9a4a,  // Fresh green grass
        roughness: 0.9,
        metalness: 0
    });
    
    const soilMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a4a3a,  // Brown soil
        roughness: 0.95,
        metalness: 0
    });
    
    // LOWER TERRACE (ground level)
    const lowerField = new THREE.Mesh(
        new THREE.PlaneGeometry(farmWidth, farmDepth, 10, 10),
        cropMaterial
    );
    lowerField.rotation.x = -Math.PI / 2;
    lowerField.position.set(farmX, 0.6, farmZ);
    lowerField.receiveShadow = true;
    lowerField.name = 'LowerFarmland';
    scene.add(lowerField);
    environmentObjects.push(lowerField);
    groundMeshes.push(lowerField);
    
    // Terrace wall between lower and upper fields
    const terraceWall = new THREE.Mesh(
        new THREE.BoxGeometry(farmWidth, 1.5, 0.5),
        soilMaterial
    );
    terraceWall.position.set(farmX, 1.35, farmZ - farmDepth / 2);
    terraceWall.castShadow = true;
    scene.add(terraceWall);
    environmentObjects.push(terraceWall);
    collisionMeshes.push(terraceWall);
    
    // UPPER TERRACE (elevated)
    const upperField = new THREE.Mesh(
        new THREE.PlaneGeometry(farmWidth, farmDepth, 10, 10),
        cropMaterial
    );
    upperField.rotation.x = -Math.PI / 2;
    upperField.position.set(farmX, 2.1, farmZ - farmDepth);
    upperField.receiveShadow = true;
    upperField.name = 'UpperFarmland';
    scene.add(upperField);
    environmentObjects.push(upperField);
    groundMeshes.push(upperField);
    
    // Field borders (raised earth)
    const borderMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a5a4a,
        roughness: 0.9,
        metalness: 0
    });
    
    // Lower field borders
    const lowerBorderLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, farmDepth),
        borderMaterial
    );
    lowerBorderLeft.position.set(farmX - farmWidth / 2, 0.75, farmZ);
    scene.add(lowerBorderLeft);
    environmentObjects.push(lowerBorderLeft);
    
    const lowerBorderRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, farmDepth),
        borderMaterial
    );
    lowerBorderRight.position.set(farmX + farmWidth / 2, 0.75, farmZ);
    scene.add(lowerBorderRight);
    environmentObjects.push(lowerBorderRight);
    
    // Upper field borders
    const upperBorderLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, farmDepth),
        borderMaterial
    );
    upperBorderLeft.position.set(farmX - farmWidth / 2, 2.25, farmZ - farmDepth);
    scene.add(upperBorderLeft);
    environmentObjects.push(upperBorderLeft);
    
    const upperBorderRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, farmDepth),
        borderMaterial
    );
    upperBorderRight.position.set(farmX + farmWidth / 2, 2.25, farmZ - farmDepth);
    scene.add(upperBorderRight);
    environmentObjects.push(upperBorderRight);
    
    // ═══════════════════════════════════════════════════════════════════
    // 14. WELL - Water source in farmland
    // ═══════════════════════════════════════════════════════════════════
    
    const wellX = farmX - 8;
    const wellZ = farmZ - 5;
    const wellRadius = 1.2;
    const wellHeight = 2;
    
    // Well shaft (stone)
    const wellShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(wellRadius, wellRadius, wellHeight, 12),
        stoneMaterial
    );
    wellShaft.position.set(wellX, 1.6, wellZ);
    wellShaft.castShadow = true;
    wellShaft.name = 'FarmWell';
    scene.add(wellShaft);
    environmentObjects.push(wellShaft);
    collisionMeshes.push(wellShaft);
    
    // Well water inside
    const wellWater = new THREE.Mesh(
        new THREE.CircleGeometry(wellRadius - 0.2, 12),
        new THREE.MeshStandardMaterial({
            color: 0x2a6a8e,
            roughness: 0.1,
            metalness: 0.5,
            emissive: 0x1a4a6e,
            emissiveIntensity: 0.3
        })
    );
    wellWater.rotation.x = -Math.PI / 2;
    wellWater.position.set(wellX, 0.65, wellZ);
    scene.add(wellWater);
    environmentObjects.push(wellWater);
    
    // Well roof (small cover)
    const wellRoof = new THREE.Mesh(
        new THREE.ConeGeometry(wellRadius + 0.5, 1.2, 4),
        new THREE.MeshStandardMaterial({
            color: 0x7a5a4a,
            roughness: 0.8,
            metalness: 0
        })
    );
    wellRoof.rotation.y = Math.PI / 4;
    wellRoof.position.set(wellX, 3.2, wellZ);
    wellRoof.castShadow = true;
    scene.add(wellRoof);
    environmentObjects.push(wellRoof);
    
    // Well pulley post
    const pulleyPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8),
        new THREE.MeshStandardMaterial({
            color: 0x4a3a2a,
            roughness: 0.9,
            metalness: 0
        })
    );
    pulleyPost.position.set(wellX, 3.35, wellZ);
    scene.add(pulleyPost);
    environmentObjects.push(pulleyPost);
    
    // Farm label in Tamil (signboard)
    const farmLabel = createTamilLabel('வயல்', 70);  // "வயல்" = Farm/Field
    farmLabel.position.set(farmX + 20, 3.5, farmZ - farmDepth / 2);  // Near farm edge
    scene.add(farmLabel);
    environmentObjects.push(farmLabel);
    
    // Well label in Tamil (signboard)
    const wellLabel = createTamilLabel('கிணறு', 50);  // "கிணறு" = Well
    wellLabel.position.set(wellX + 5, 4, wellZ);  // Near well, closer to ground
    scene.add(wellLabel);
    environmentObjects.push(wellLabel);
    
    console.log('✓ Terraced farmland created (2 levels: 35m × 30m each)');
    console.log('✓ Farm well created in lower terrace');
    console.log('  - Position: (' + wellX + ', ' + wellZ + ')');
    
    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ KAVERI RIVER ENVIRONMENT COMPLETE');
    console.log(`   - Ground Plane: 800m × 800m textured base terrain`);
    console.log(`   - River: ${riverLength}m long × ${riverWidth}m wide (flows continuously to dam)`);
    console.log(`   - Arched Dam: 4m tall at Z=${damPosition}m with 6 arch openings`);
    console.log(`   - Dam Wall Inscription: கரிகால சோழன் (Karikala Cholan) - 150 CE in bright gold`);
    console.log(`   - Inlet Canal: 8m wide × 60m (3 seamless segments, dam to lake)`);
    console.log(`   - Swimming Pool Lake: 45m radius with concrete deck`);
    console.log(`   - Outlet Canal: 6m wide × 35m (lake to storage pond)`);
    console.log(`   - Storage Pond: 20m radius with natural grassy banks`);
    console.log(`   - Farm Canal: 5m wide × 30m (pond to farmland)`);
    console.log(`   - Terraced Farmland: 2 levels (upper & lower, 35m × 30m each)`);
    console.log(`   - Farm Well: Stone well with roof in lower terrace`);
    console.log(`   - Tamil Labels: Clear labels for all major features (River, Dam, Canal, Lake, Pond, Farm, Well)`);
    console.log(`   - Polished Canals: Extended segments with wider banks for seamless connections`);
    console.log(`   - Pathway: ${pathwayWidth}m wide exploration path`);
    console.log(`   - Atmosphere: Blueish tint for realistic water world`);
    console.log(`   - Ground meshes: ${groundMeshes.length} (walkable)`);
    console.log(`   - Total objects: ${environmentObjects.length}`);
    console.log('   ');
    console.log('   WATER FLOW SYSTEM:');
    console.log('   • River (ஆறு) flows continuously and passes through Dam (அணை)');
    console.log('   • Dam inscription: கரிகால சோழன் 150 CE (Karikala Cholan 150 CE)');
    console.log('   • Dam diverts water → Inlet Canal (கால்வாய்)');
    console.log('   • Inlet Canal → Swimming Pool Lake (ஏரி)');
    console.log('   • Lake → Outlet Canal → Storage Pond (குளம்)');
    console.log('   • Pond → Farm Canal → Terraced Farmland (வயல்)');
    console.log('   • Well (கிணறு) provides additional water for farming');
    console.log('   ');
    console.log('   PLAYER MOVEMENT:');
    console.log('   • Use pathway on +X side for main exploration');
    console.log('   • River flows through arch openings in dam');
    console.log('   • Walk along polished canals to discover lake, pond, and farmland');
    console.log('   • Tamil labels make navigation easy');
    console.log('   • Explore terraced fields (2 levels) and visit the well');
    console.log('   • Walk across dam top to see water management system');
    console.log('═══════════════════════════════════════════════════════════');
}

/**
 * Get collision meshes (structures that block movement)
 */
export function getCollisionMeshes() {
    return collisionMeshes;
}

/**
 * Get ground meshes (walkable surfaces for vertical snapping)
 */
export function getGroundMeshes() {
    return groundMeshes;
}

/**
 * Get NPC spawn positions (empty for grass world)
 */
export function getNPCSpawnPositions() {
    return [];
}

/**
 * Animate water surface (subtle flowing effect)
 * @param {number} time - Time in seconds
 */
export function animateWater(time) {
    if (waterSurface && waterSurface.geometry && waterSurface.geometry.attributes.position) {
        const positions = waterSurface.geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i); // This is the length direction before rotation
            
            // Flowing ripples (subtle waves)
            const wave = Math.sin(time * 0.8 + y * 0.3 + x * 0.1) * 0.08 
                       + Math.cos(time * 0.5 + y * 0.2 - x * 0.15) * 0.05;
            
            // Set Z (which becomes Y after rotation for height)
            positions.setZ(i, wave);
        }
        
        positions.needsUpdate = true;
        waterSurface.geometry.computeVertexNormals();
    }
}
