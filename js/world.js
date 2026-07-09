//Ayudaaaa, esta cisa no se actializa 😂😂
import * as THREE from 'three';
import { crearNaveChocada } from './objects.js';

export const obstaculosCristal = [];
export let sky, suelo, raycaster, downVector, nave;
let videoElement, videoTexture;

export function initWorld(scene, loader) {
    scene.fog = new THREE.FogExp2(0x1a052e, 0.04);

    // 1. Cielo de fondo
    const cieloTex = loader.load('assets/texturas/cielos/Blue_Nebula_01-512x512.png');
    sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 15), new THREE.MeshBasicMaterial({ map: cieloTex, side: THREE.BackSide, fog: false }));
    scene.add(sky);

    // 2. Agujero Negro MP4 (Eliminando el fondo blanco)
    videoElement = document.createElement("video");
    videoElement.src = "./assets/texturas/agujero.negro.mp4";
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.play();
    
    videoTexture = new THREE.VideoTexture(videoElement);
    
    // Shader simple para hacer que el blanco (#ffffff) sea transparente
    const bhMat = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: videoTexture } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            void main() {
                vec4 texel = texture2D(tDiffuse, vUv);
                // Si el color es muy cercano al blanco, lo hacemos transparente
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

    // 3. Suelo
    const piedraTex = loader.load('assets/texturas/piedra.png');
    piedraTex.wrapS = piedraTex.wrapT = THREE.RepeatWrapping; piedraTex.repeat.set(20, 20);
    const floorGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
    suelo = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial({ map: piedraTex }));
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);

    // 4. Nave y Cristales
    raycaster = new THREE.Raycaster();
    downVector = new THREE.Vector3(0, -1, 0);
    nave = crearNaveChocada();
    nave.position.y = 1.5; // Ajuste simple inicial
    scene.add(nave);

    const cristalesTex = loader.load('assets/texturas/cristales.png');
    const cristalMat = new THREE.MeshBasicMaterial({ map: cristalesTex });
    for (let i = 0; i < 16; i++) {
        const cx = (Math.random() - 0.5) * 75; const cz = (Math.random() - 0.5) * 75;
        const cristalMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.8, 4, 6), cristalMat);
        cristalMesh.position.set(cx, 0, cz);
        scene.add(cristalMesh);
        obstaculosCristal.push({ position: new THREE.Vector3(cx, 0, cz), radio: 1.0 });
    }
}

export function getGroundHeight(x, z) {
    if(!raycaster) return 0;
    raycaster.set(new THREE.Vector3(x, 50, z), downVector);
    const intersects = raycaster.intersectObject(suelo);
    return intersects.length > 0 ? intersects[0].point.y : 0;
}
