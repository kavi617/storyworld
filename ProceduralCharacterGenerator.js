import * as THREE from "three";

const HEAD_GEO = new THREE.SphereGeometry(0.35, 6, 6);
const NECK_GEO = new THREE.CylinderGeometry(0.15, 0.2, 0.15, 5);
const TORSO_GEO = new THREE.BoxGeometry(0.8, 0.7, 0.5);
const LIMB_GEO = new THREE.CylinderGeometry(0.1, 0.12, 0.6, 5);
const LEG_GEO = new THREE.CylinderGeometry(0.12, 0.14, 0.6, 5);
const SPHERE_GEO = new THREE.SphereGeometry(0.12, 5, 5);
const TORUS_GEO = new THREE.TorusGeometry(0.45, 0.06, 5, 10);

const CROWN_EMP_BASE = new THREE.CylinderGeometry(0.6, 0.7, 0.3, 7);
const CROWN_EMP_SPIKE = new THREE.ConeGeometry(0.06, 0.3, 4);
const CROWN_EMP_GEM = new THREE.SphereGeometry(0.1, 5, 5);
const CROWN_KING_BASE = new THREE.CylinderGeometry(0.5, 0.6, 0.25, 7);
const CROWN_KING_SPIKE = new THREE.ConeGeometry(0.04, 0.2, 4);
const CROWN_WAR_BAND = new THREE.TorusGeometry(0.5, 0.06, 5, 10);
const CROWN_WAR_FEATHER = new THREE.ConeGeometry(0.08, 0.3, 4);

const CHARACTER_STYLES = {
  senguttuvan_cheran: {
    body: 0x2ecc71, accent: 0xf1c40f,
    robe: 0x27ae60, crown: "warrior",
  },
  aditya_chola: {
    body: 0xe67e22, accent: 0xd35400,
    robe: 0xc0392b, crown: "king",
  },
  nedunjeliyan_1: {
    body: 0x2980b9, accent: 0x3498db,
    robe: 0x1a5276, crown: "king",
  },
  raja_raja_cholan: {
    body: 0xffd700, accent: 0xffa500,
    robe: 0x8b0000, crown: "emperor",
  },
  kulasekara_pandya: {
    body: 0x9b59b6, accent: 0x8e44ad,
    robe: 0x6c3483, crown: "king",
  },
  cheraman_perumal: {
    body: 0x1abc9c, accent: 0x16a085,
    robe: 0x0e6655, crown: "king",
  },
  karikala_cholan: {
    body: 0x3498db, accent: 0x2980b9,
    robe: 0x1a5276, crown: "emperor",
  },
  uthiyan_cheralathan: {
    body: 0x27ae60, accent: 0x2ecc71,
    robe: 0x1e8449, crown: "warrior",
  },
  ariyan_nedunjeliyan_2: {
    body: 0x1f618d, accent: 0x2874a6,
    robe: 0x154360, crown: "king",
  },
};

function mkMat(color) {
  return new THREE.MeshBasicMaterial({ color });
}

function buildCrown(pieces) {
  const g = new THREE.Group();
  for (const p of pieces) g.add(p);
  return g;
}

export function generateProceduralCharacter(characterId) {
  const style = CHARACTER_STYLES[characterId];
  if (!style) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), mkMat(0xcccccc));
    m.frustumCulled = true;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    g.add(m);
    return g;
  }

  const group = new THREE.Group();

  const bodyM = mkMat(style.body);
  const robeM = mkMat(style.robe);
  const skinM = mkMat(0xd4a574);
  const accentM = mkMat(style.accent);

  const torso = new THREE.Mesh(TORSO_GEO, robeM);
  torso.position.y = 1.1;
  group.add(torso);

  const head = new THREE.Mesh(HEAD_GEO, skinM);
  head.position.y = 1.75;
  group.add(head);

  const neck = new THREE.Mesh(NECK_GEO, skinM);
  neck.position.y = 1.45;
  group.add(neck);

  const leftArm = new THREE.Mesh(LIMB_GEO, skinM);
  leftArm.position.set(-0.55, 1.2, 0);
  leftArm.rotation.z = 0.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(LIMB_GEO, skinM);
  rightArm.position.set(0.55, 1.2, 0);
  rightArm.rotation.z = -0.2;
  group.add(rightArm);

  const leftLeg = new THREE.Mesh(LEG_GEO, robeM);
  leftLeg.position.set(-0.2, 0.4, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(LEG_GEO, robeM);
  rightLeg.position.set(0.2, 0.4, 0);
  group.add(rightLeg);

  const shL = new THREE.Mesh(SPHERE_GEO, accentM);
  shL.position.set(-0.55, 1.5, 0);
  group.add(shL);

  const shR = new THREE.Mesh(SPHERE_GEO, accentM);
  shR.position.set(0.55, 1.5, 0);
  group.add(shR);

  const waist = new THREE.Mesh(TORUS_GEO, accentM);
  waist.rotation.x = Math.PI / 2;
  waist.position.y = 0.9;
  group.add(waist);

  let crown;
  if (style.crown === "emperor") {
    const pieces = [];
    const base = new THREE.Mesh(CROWN_EMP_BASE, mkMat(style.accent));
    base.position.y = 0.15;
    pieces.push(base);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = new THREE.Mesh(CROWN_EMP_SPIKE, mkMat(0xffd700));
      s.position.set(Math.sin(a) * 0.55, 0.4, Math.cos(a) * 0.55);
      pieces.push(s);
    }

    const gem = new THREE.Mesh(CROWN_EMP_GEM, mkMat(0xff0000));
    gem.position.y = 0.4;
    pieces.push(gem);

    crown = buildCrown(pieces);
    crown.position.y = 1.85;
    group.add(crown);
  } else if (style.crown === "king") {
    const pieces = [];
    const base = new THREE.Mesh(CROWN_KING_BASE, mkMat(style.accent));
    base.position.y = 0.125;
    pieces.push(base);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const s = new THREE.Mesh(CROWN_KING_SPIKE, mkMat(style.accent));
      s.position.set(Math.sin(a) * 0.5, 0.3, Math.cos(a) * 0.5);
      pieces.push(s);
    }

    crown = buildCrown(pieces);
    crown.position.y = 1.85;
    group.add(crown);
  } else {
    const pieces = [];
    const band = new THREE.Mesh(CROWN_WAR_BAND, mkMat(style.accent));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.1;
    pieces.push(band);

    const feather = new THREE.Mesh(CROWN_WAR_FEATHER, mkMat(0xffd700));
    feather.position.set(0, 0.3, 0.5);
    feather.rotation.x = 0.3;
    pieces.push(feather);

    crown = buildCrown(pieces);
    crown.position.y = 1.85;
    group.add(crown);
  }

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = true;
      child.matrixAutoUpdate = false;
      child.updateMatrix();
    }
  });

  group.userData.isProcedural = true;

  return group;
}
