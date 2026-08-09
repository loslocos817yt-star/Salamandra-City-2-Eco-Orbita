import * as THREE from 'three';
import { crearNaveChocada } from './objects.js';

export const obstaculosCristal = [];
export let sky, suelo, raycaster, downVector, nave;
let videoElement, videoTexture;

// --- ECUACIÓN FRACTAL ---
// H(x, z) = Suma[ desde i=0 hasta n-1 ] ( (p^i) * N( x / (l^i), z / (l^i) ) )
function simpleNoise(x, z) {
    let n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453123;
    return n - Math.floor(n);
}

export function getGroundHeight(x, z) {
    let h = 0;
    const n = 3;   // Octavas
    const p = 0.4; // Persistencia (suavidad)
    const l = 2.0; // Lacunuaridad
    
    for (let i = 0; i < n; i++) {
        h += Math.pow(p, i) * simpleNoise(x / Math.pow(l, i), z / Math.pow(l, i));
    }
    return h * 0.8; // Multiplicador de altura
}

export function initWorld(scene, loader) {
    scene.fog = new THREE.FogExp2(0x1a052e, 0.04);

    // 1. Cielo de fondo
    const cieloTex = loader.load('assets/texturas/cielos/Blue_Nebula_01-512x512.png');
    sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 15), new THREE.MeshBasicMaterial({ map: cieloTex, side: THREE.BackSide, fog: false }));
    scene.add(sky);

    // 2. Agujero Negro MP4
    videoElement = document.createElement("video");
    videoElement.src = "./assets/texturas/agujero.negro.mp4";
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.play();
    
    videoTexture = new THREE.VideoTexture(videoElement);
    
    const bhMat = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: videoTexture } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            void main() {
                vec4 texel = texture2D(tDiffuse, vUv);
                if (texel.r > 0.9 && texel.g > 0.9 && texel.b > 0.9) discard;
                gl_FragColor = texel;
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    const blackHole = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), bhMat);
    blackHole.position.set(50, 100, -150);
    blackHole.lookAt(0, 0, 0);
    scene.add(blackHole);

    // 3. Suelo con Ecuación Fractal
    const piedraTex = loader.load('assets/texturas/piedra.png');
    piedraTex.wrapS = piedraTex.wrapT = THREE.RepeatWrapping; piedraTex.repeat.set(20, 20);
    
    // Aumentamos los segmentos a 100 para que se vea la forma fractal
    const floorGeo = new THREE.PlaneGeometry(100, 100, 100, 100);
    
    // Aplicar la ecuación a los vértices
    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getY(i);
        pos.setZ(i, getGroundHeight(x, z));
    }
    floorGeo.computeVertexNormals();
    
    suelo = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial({ map: piedraTex }));
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);

    // 4. Nave y Cristales
    raycaster = new THREE.Raycaster();
    downVector = new THREE.Vector3(0, -1, 0);
    nave = crearNaveChocada();
    // Posicionar nave según la ecuación
    nave.position.y = getGroundHeight(0, 0); 
    scene.add(nave);

    const cristalesTex = loader.load('assets/texturas/cristales.png');
    const cristalMat = new THREE.MeshBasicMaterial({ map: cristalesTex });
    for (let i = 0; i < 16; i++) {
        const cx = (Math.random() - 0.5) * 75; 
        const cz = (Math.random() - 0.5) * 75;
        const cy = getGroundHeight(cx, cz);
        
        const cristalMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.8, 4, 6), cristalMat);
        cristalMesh.position.set(cx, cy + 2, cz);
        scene.add(cristalMesh);
        
        // Guardamos la posición Y real para tus colisiones
        obstaculosCristal.push({ position: new THREE.Vector3(cx, cy, cz), radio: 1.0 });
    }
  
}
