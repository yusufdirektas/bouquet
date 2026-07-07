import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { fetchGiftMessage } from './api.js';

const titleElement = document.getElementById('gift-title');
const bodyElement = document.getElementById('gift-body');
const signatureElement = document.getElementById('gift-signature');
const introOverlay = document.getElementById('intro-overlay');
const envelope = document.getElementById('envelope');
const photoCard = document.getElementById('photo-card');
const introText = document.getElementById('intro-text');
const memoryCaption = document.getElementById('memory-caption');
const revealButton = document.getElementById('reveal-button');
const giftApp = document.getElementById('gift-app');
const cardContainer = document.getElementById('card-container');
const flowerOnlyButton = document.getElementById('flower-only-button');

// Theme toggle (dark / light) — initial theme is set by an inline script in index.html
const THEME_KEY = 'vb-theme';
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try {
        localStorage.setItem(THEME_KEY, next);
    } catch (e) {
        /* storage unavailable — theme still applies for this session */
    }
    applyTheme(next);
});

const isiOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const useReducedEffects = isiOS || prefersReducedMotion || isTouchDevice;

if (useReducedEffects) {
    document.body.classList.add('reduced-effects');
}

function getPreferredPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    if (useReducedEffects) {
        return Math.min(dpr, 1.35);
    }

    return Math.min(dpr, 2);
}
let introStep = 'envelope';
let canRevealGift = false;

function handleEnvelopeOpen() {
    if (introStep !== 'envelope') {
        return;
    }

    introStep = 'photo-side';
    envelope.classList.add('open');
    photoCard.classList.add('slide-out');
    introText.textContent = 'Click again to open the photo.';
}

function handlePhotoUpright() {
    if (introStep !== 'photo-side') {
        return;
    }

    introStep = 'photo-upright';
    envelope.classList.add('released');
    photoCard.classList.add('upright');
    introText.textContent = 'Ready. Click to see your gift.';
    memoryCaption.classList.add('visible');
    revealButton.classList.add('visible');
    canRevealGift = true;
}

function revealGiftScene() {
    if (!canRevealGift) {
        return;
    }

    introOverlay.classList.add('hidden');
    giftApp.classList.add('visible');
}

envelope.addEventListener('click', () => {
    if (introStep === 'envelope') {
        handleEnvelopeOpen();
    } else if (introStep === 'photo-side') {
        handlePhotoUpright();
    }
});
envelope.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    event.preventDefault();
    if (introStep === 'envelope') {
        handleEnvelopeOpen();
    } else if (introStep === 'photo-side') {
        handlePhotoUpright();
    }
});

photoCard.addEventListener('click', handlePhotoUpright);
photoCard.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handlePhotoUpright();
    }
});
revealButton.addEventListener('click', revealGiftScene);

async function hydrateGiftMessage() {
    const payload = await fetchGiftMessage();
    titleElement.textContent = payload.title;
    bodyElement.textContent = payload.body;
    signatureElement.textContent = payload.signature;
}

hydrateGiftMessage();

flowerOnlyButton.addEventListener('click', () => {
    cardContainer.classList.add('hidden');
});

// 1. SCENE
const scene = new THREE.Scene();

// 2. CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 5); // Pulled the camera back a bit so the bouquet fits

// 3. RENDERER
// alpha: true makes the background transparent so the pink CSS color shows through
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(getPreferredPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = useReducedEffects ? 1.08 : 1.2;
renderer.domElement.style.opacity = '0';
renderer.domElement.style.transition = 'opacity 0.7s ease';

// Push the 3D canvas behind everything else in the HTML
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '-1'; 
document.body.appendChild(renderer.domElement);

revealButton.addEventListener('click', () => {
    renderer.domElement.style.opacity = '1';
});

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = environmentTexture;

// 4. LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff3eb, 0xf4e9ff, 0.6);
scene.add(hemiLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// 5. LOADING AND SIZING THE BOUQUET
let bouquetModel;
const loader = new GLTFLoader();

loader.load('/bouquet.glb', (gltf) => {
    bouquetModel = gltf.scene;

    bouquetModel.scale.set(5, 5, 5); 
    bouquetModel.position.set(0, -2, 0);

    bouquetModel.traverse((child) => {
        if (!child.isMesh || !child.material) {
            return;
        }

        child.castShadow = false;
        child.receiveShadow = false;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
            material.envMapIntensity = 1.25;
            if (material.map) {
                material.map.colorSpace = THREE.SRGBColorSpace;
            }

            // Use alpha cutout instead of alpha blending to reduce
            // the fade-in/fade-out artifact visible on the leaves.
            if (material.transparent || material.opacity < 1) {
                material.transparent = false;
                material.opacity = 1;
                material.alphaTest = Math.max(material.alphaTest ?? 0, 0.45);
                material.depthWrite = true;
            }

            material.needsUpdate = true;
        });
    });

    scene.add(bouquetModel);
}, undefined, (error) => {
    console.error('An error occurred while loading the model:', error);
});

// 6. CONTROLS (OrbitControls) - rotate with the mouse
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.enablePan = false; 
controls.minDistance = 3;
controls.maxDistance = 7;

// 7. ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);

    // Slowly spin the bouquet around its own axis
    if (bouquetModel) {
        bouquetModel.rotation.y += 0.003; 
    }

    controls.update(); 
    renderer.render(scene, camera); 
}
animate();

// 8. HANDLE WINDOW RESIZE (Responsive)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getPreferredPixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight);
});
