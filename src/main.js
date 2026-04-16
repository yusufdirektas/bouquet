import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 1. SAHNE (Scene)
const scene = new THREE.Scene();

// 2. KAMERA (Camera)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 5); // Kamerayı biraz daha geri çektim çiçek sığsın diye

// 3. RENDER MOTORU (Renderer)
// alpha: true ile arkaplanı şeffaf yapıyoruz ki CSS'teki pembe renk görünsün
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// 3D Canvas'ı HTML'in en arkasına atıyoruz
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '-1'; 
document.body.appendChild(renderer.domElement);

// 4. IŞIKLAR (Lights)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); 
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// 5. ÇİÇEĞİ YÜKLEME (Loader) ve BOYUTLANDIRMA
let bouquetModel; 
const loader = new GLTFLoader();

// ... (önceki kodlar)

loader.load('/bouquet.glb', (gltf) => {
    bouquetModel = gltf.scene;
    
    // --- BOYUT AYARI ---
    
    bouquetModel.scale.set(4, 4, 4); 
    
    // --- KONUM AYARI ---
    // Çiçek çok yukarıdaysa buradaki -2 değerini -1 veya 0 yaparak aşağı/yukarı kaydırabilirsin.
    bouquetModel.position.set(0, -1, 0);
    
    scene.add(bouquetModel);
}, undefined, (error) => {
    console.error('Model yüklenirken bir hata oluştu:', error);
});

// ... (sonraki kodlar)

// 6. KONTROLLER (OrbitControls) - Mouse ile döndürme
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.enablePan = false; 

// 7. ANİMASYON DÖNGÜSÜ
function animate() {
    requestAnimationFrame(animate); 

    // Çiçek kendi etrafında yavaşça dönsün
    if (bouquetModel) {
        bouquetModel.rotation.y += 0.003; 
    }

    controls.update(); 
    renderer.render(scene, camera); 
}
animate();

// 8. EKRAN BOYUTU GÜNCELLEMESİ (Responsive)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});