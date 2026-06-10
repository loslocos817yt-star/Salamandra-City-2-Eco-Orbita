import * as THREE from 'three';
import { initWorld, getGroundHeight, obstaculosCristal, sky, nave } from './world.js';
import { initPlayer, updatePlayer } from './player.js';
import { initControls, state } from './controls.js';
import { initSlimes, updateSlimes } from './slimes.js';
import { SFX } from './audio.js'; // Importamos el audio

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Listener para desbloquear el AudioContext (necesario en navegadores)
window.addEventListener('touchstart', () => { if(window.AudioContext) new (window.AudioContext)().resume(); }, {once: true});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const loader = new THREE.TextureLoader();

initWorld(scene, loader);
initPlayer(scene, camera);
initControls();
initSlimes(scene, getGroundHeight);

let bobbingTimer = 0;
let stepTimer = 0;

function animate() {
    requestAnimationFrame(animate);

    if (state.moveX !== 0 || state.moveY !== 0) {
        bobbingTimer += 0.15;
        stepTimer++;
        if(stepTimer % 15 === 0) SFX.caminar(); // Sonido de caminar
    }

    if (state.isSuctioning && stepTimer % 5 === 0) { SFX.aspiradora(); } // Sonido de succión constante

    updatePlayer(camera, state, getGroundHeight, obstaculosCristal, bobbingTimer);

    if(sky) sky.position.copy(camera.position);

    if(nave) {
        const dist = camera.position.distanceTo(nave.position);
        document.getElementById('radar').innerText = `NAVE: ${Math.floor(dist)}m`;
    }

    updateSlimes(scene, camera, state, getGroundHeight, obstaculosCristal);

    renderer.render(scene, camera);
}
animate();
