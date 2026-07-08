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

// --- Customization (photo + gift message), persisted in localStorage ---
const CUSTOM_KEY = 'vb-custom';
const DEFAULT_PHOTO = '/picture.jpg';
const photoImage = photoCard.querySelector('img');

function loadCustom() {
    try {
        return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || {};
    } catch (e) {
        return {};
    }
}

let custom = loadCustom();

function applyCustomPhoto() {
    photoImage.src = custom.photo || DEFAULT_PHOTO;
}

async function hydrateGiftMessage() {
    const payload = await fetchGiftMessage();
    titleElement.textContent = custom.title || payload.title;
    bodyElement.textContent = custom.body || payload.body;
    signatureElement.textContent = custom.signature || payload.signature;
}

// When opened via a shared link (?g=<id>), load that gift from the backend and
// let it override any local customization for this viewer.
async function loadSharedGift() {
    const id = new URLSearchParams(window.location.search).get('g');
    if (!id) {
        return;
    }
    try {
        const response = await fetch(`/api/gift?id=${encodeURIComponent(id)}`);
        if (!response.ok) {
            return;
        }
        const gift = await response.json();
        custom = {
            title: gift.title || undefined,
            body: gift.body || undefined,
            signature: gift.signature || undefined,
            photo: gift.photoUrl || undefined,
        };
    } catch (error) {
        console.warn('Could not load the shared gift:', error);
    }
}

(async () => {
    await loadSharedGift();
    applyCustomPhoto();
    hydrateGiftMessage();
})();

flowerOnlyButton.addEventListener('click', () => {
    cardContainer.classList.add('hidden');
});

// --- Customize panel ---
const customizeButton = document.getElementById('customize-button');
const customizePanel = document.getElementById('customize-panel');
const customizeClose = document.getElementById('customize-close');
const customizeSave = document.getElementById('customize-save');
const customizeReset = document.getElementById('customize-reset');
const customizePhotoInput = document.getElementById('customize-photo');
const customizePreview = document.getElementById('customize-preview');
const customizeTitle = document.getElementById('customize-title');
const customizeBody = document.getElementById('customize-body');
const customizeSignature = document.getElementById('customize-signature');
const customizeShare = document.getElementById('customize-share');
const shareResult = document.getElementById('share-result');
const shareLink = document.getElementById('share-link');
const shareCopy = document.getElementById('share-copy');

// Holds a freshly chosen (not yet saved) photo data URL
let pendingPhoto = null;

function setPreview(src) {
    if (src) {
        customizePreview.src = src;
        customizePreview.classList.add('has-photo');
    } else {
        customizePreview.removeAttribute('src');
        customizePreview.classList.remove('has-photo');
    }
}

function openCustomizePanel() {
    pendingPhoto = null;
    customizeTitle.value = custom.title || '';
    customizeBody.value = custom.body || '';
    customizeSignature.value = custom.signature || '';
    setPreview(custom.photo || DEFAULT_PHOTO);
    customizePanel.classList.add('open');
    customizePanel.setAttribute('aria-hidden', 'false');
}

function closeCustomizePanel() {
    customizePanel.classList.remove('open');
    customizePanel.setAttribute('aria-hidden', 'true');
}

// Downscale an uploaded image so it stays inside the localStorage quota
function readImageFile(file, maxDim = 1200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const width = Math.round(img.width * scale);
                const height = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

customizeButton.addEventListener('click', openCustomizePanel);
customizeClose.addEventListener('click', closeCustomizePanel);
customizePanel.addEventListener('click', (event) => {
    if (event.target === customizePanel) {
        closeCustomizePanel();
    }
});

customizePhotoInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
        return;
    }

    try {
        pendingPhoto = await readImageFile(file);
        setPreview(pendingPhoto);
    } catch (e) {
        console.error('Could not read the selected image:', e);
    }
});

customizeSave.addEventListener('click', () => {
    const next = {};
    if (pendingPhoto) {
        next.photo = pendingPhoto;
    } else if (custom.photo) {
        next.photo = custom.photo;
    }

    const title = customizeTitle.value.trim();
    const body = customizeBody.value.trim();
    const signature = customizeSignature.value.trim();
    if (title) next.title = title;
    if (body) next.body = body;
    if (signature) next.signature = signature;

    try {
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch (e) {
        window.alert('Could not save — the photo may be too large. Try a smaller image.');
        return;
    }

    custom = next;
    applyCustomPhoto();
    hydrateGiftMessage();
    closeCustomizePanel();
});

customizeReset.addEventListener('click', () => {
    try {
        localStorage.removeItem(CUSTOM_KEY);
    } catch (e) {
        /* ignore */
    }
    custom = {};
    pendingPhoto = null;
    applyCustomPhoto();
    hydrateGiftMessage();
    customizeTitle.value = '';
    customizeBody.value = '';
    customizeSignature.value = '';
    setPreview(DEFAULT_PHOTO);
    shareResult.hidden = true;
});

// Upload the current customization to the backend and get a permanent share link
customizeShare.addEventListener('click', async () => {
    customizeShare.disabled = true;
    customizeShare.textContent = 'Creating link…';
    shareResult.hidden = true;

    const payload = {
        title: customizeTitle.value.trim(),
        body: customizeBody.value.trim(),
        signature: customizeSignature.value.trim(),
        photo: pendingPhoto || custom.photo || null,
    };

    try {
        const response = await fetch('/api/gift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`status ${response.status}`);
        }
        const { id } = await response.json();
        shareLink.value = `${window.location.origin}/?g=${id}`;
        shareResult.hidden = false;
        shareLink.focus();
        shareLink.select();
    } catch (error) {
        console.error('Could not create shareable link:', error);
        window.alert('Could not create the link. The sharing backend may not be set up yet.');
    } finally {
        customizeShare.disabled = false;
        customizeShare.textContent = 'Create shareable link';
    }
});

shareCopy.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(shareLink.value);
    } catch (e) {
        shareLink.focus();
        shareLink.select();
        document.execCommand('copy');
    }
    shareCopy.textContent = 'Copied';
    setTimeout(() => {
        shareCopy.textContent = 'Copy';
    }, 1500);
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
