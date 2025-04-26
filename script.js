import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parse } from 'prismarine-nbt';
import pako from 'pako';
import { Buffer } from 'buffer';

// Setup Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Contrôles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lumières
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(20, 50, 20);
scene.add(pointLight);

// Textures Minecraft
const textureLoader = new THREE.TextureLoader();
const textures = {
  grass: textureLoader.load('/textures/grass_block_top.png'),
  dirt: textureLoader.load('/textures/dirt.png'),
  stone: textureLoader.load('/textures/stone.png'),
  oak: textureLoader.load('/textures/oak_planks.png'),
  cobblestone: textureLoader.load('/textures/cobblestone.png'),
};

// Créer un cube
function createBlock(texture, position) {
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const geometry = new THREE.BoxGeometry();
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(position.x, position.y, position.z);
  scene.add(cube);
}

// Charger un fichier schematic
async function loadSchematic(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const compressedData = new Uint8Array(arrayBuffer);

  const decompressed = pako.ungzip(compressedData);
  const buffer = Buffer.from(decompressed);

  const nbtData = await parse(buffer);

  const root = nbtData.parsed.value;

  const width = root.Width.value;
  const height = root.Height.value;
  const length = root.Length.value;

  const palette = root.Palette.value;
  const blockData = root.BlockData.value; // ✅ ICI !

  console.log(`Width: ${width}, Height: ${height}, Length: ${length}`);

  const paletteArray = Object.entries(palette);
  const paletteIds = {};
  paletteArray.forEach(([blockName, id]) => {
    paletteIds[id] = blockName;
  });

  let index = 0;
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        const blockStateId = blockData[index];
        const blockName = paletteIds[blockStateId];

        if (blockName && !blockName.includes('air')) {
          let texture = textures.stone;

          if (blockName.includes('grass')) texture = textures.grass;
          else if (blockName.includes('dirt')) texture = textures.dirt;
          else if (blockName.includes('oak')) texture = textures.oak;
          else if (blockName.includes('cobblestone')) texture = textures.cobblestone;

          createBlock(texture, { x, y, z });
        }
        index++;
      }
    }
  }
}

// Charger ton schematic
loadSchematic('/public/schematics/bee-sanctuary.schem');

// Animation
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
