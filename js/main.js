import * as THREE from 'three';
import { initWorld, getGroundHeight, obstaculosCristal, sky, nave } from './world.js';
import { initPlayer, updatePlayer } from './player.js';
import { initControls, state } from './controls.js';
import { initSlimes, updateSlimes } from './slimes.js';
import { SFX } from './audio.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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

// --- ARMA LOCAL (EN PRIMERA PERSONA) ---
const armaGrupo = new THREE.Group();
const armaCuerpo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.08, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 })
);
armaCuerpo.rotation.x = Math.PI / 2;
const armaBoca = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8),
    new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff4400, emissiveIntensity: 0.2 })
);
armaBoca.rotation.x = Math.PI / 2;
armaBoca.position.z = -0.2;
armaGrupo.add(armaCuerpo, armaBoca);
armaGrupo.position.set(0.25, -0.22, -0.4);
camera.add(armaGrupo);
scene.add(camera);

// --- TEXTURA Y DISEÑO DE LA SALAMANDRA CON SU PISTOLA Y GAMERTAG ---
function generarTexturaPiel() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radioX = 5 + Math.random() * 20;
        const radioY = 5 + Math.random() * 15;
        const rotacion = Math.random() * Math.PI;

        ctx.beginPath();
        ctx.ellipse(x, y, radioX, radioY, rotacion, 0, 2 * Math.PI);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function crearTextoSprite(texto) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Fondo semitransparente para que resalte el texto
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(10, 10, 236, 44, 12);
    ctx.fill();

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.0, 0.25, 1);
    return sprite;
}

function crearSalamandraConPistola(nombreJugador) {
    const grupo = new THREE.Group();
    const texturaPiel = generarTexturaPiel();
    const mat = new THREE.MeshBasicMaterial({ map: texturaPiel });

    // Cuerpo principal
    const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 4, 8), mat);
    cuerpo.position.y = 0.5;
    grupo.add(cuerpo);

    // Cabeza un poco más arriba
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), mat);
    cabeza.position.set(0, 1.1, 0.1);
    grupo.add(cabeza);

    // Ojos elevados con la cabeza
    const ojoMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const ojoL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), ojoMat);
    const ojoR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), ojoMat);
    ojoL.position.set(0.13, 1.2, 0.22);
    ojoR.position.set(-0.13, 1.2, 0.22);
    grupo.add(ojoL, ojoR);

    // Pistola / Succionadora
    const pistolaCuerpo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 0.6, 6),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    pistolaCuerpo.rotation.x = Math.PI / 2;
    pistolaCuerpo.position.set(0.28, 0.55, 0.4);

    const pistolaBoca = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    pistolaBoca.rotation.x = Math.PI / 2;
    pistolaBoca.position.set(0.28, 0.55, 0.72);

    grupo.add(pistolaCuerpo, pistolaBoca);

    // Gamertag flotante arriba de la cabeza
    const spriteGamertag = crearTextoSprite(nombreJugador || "Jugador");
    spriteGamertag.position.set(0, 1.6, 0);
    grupo.add(spriteGamertag);

    return grupo;
}

const otrosJugadores = {};
let bobbingTimer = 0;
let stepTimer = 0;

function animate() {
    requestAnimationFrame(animate);

    if (state.moveX !== 0 || state.moveY !== 0) {
        bobbingTimer += 0.15;
        stepTimer++;
        if(stepTimer % 15 === 0) SFX.caminar();
    }

    if (state.isSuctioning) {
        if (stepTimer % 5 === 0) { SFX.aspiradora(); }
        armaGrupo.position.z = -0.4 + Math.sin(Date.now() * 0.05) * 0.02;
    } else {
        armaGrupo.position.z = -0.4;
    }

    updatePlayer(camera, state, getGroundHeight, obstaculosCristal, bobbingTimer);

    const usuarioActual = localStorage.getItem('sc2_user') || "Invitado";
    if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.send(JSON.stringify({
            user: usuarioActual,
            x: camera.position.x,
            y: getGroundHeight(camera.position.x, camera.position.z),
            z: camera.position.z
        }));
    }

    if (window.multiplayerState) {
        const idsActivos = Object.keys(window.multiplayerState);

        idsActivos.forEach(id => {
            if (id === usuarioActual) return;

            const datos = window.multiplayerState[id];
            if (!otrosJugadores[id]) {
                const salamandraMesh = crearSalamandraConPistola(id);
                scene.add(salamandraMesh);
                otrosJugadores[id] = salamandraMesh;
            }

            if (datos && typeof datos.x === 'number') {
                otrosJugadores[id].position.set(datos.x, datos.y || 0, datos.z);
            }
        });

        Object.keys(otrosJugadores).forEach(id => {
            if (!idsActivos.includes(id)) {
                scene.remove(otrosJugadores[id]);
                delete otrosJugadores[id];
            }
        });
    }

    if(sky) sky.position.copy(camera.position);

    if(nave) {
        const dist = camera.position.distanceTo(nave.position);
        document.getElementById('radar').innerText = `NAVE: ${Math.floor(dist)}m`;
    }

    updateSlimes(scene, camera, state, getGroundHeight, obstaculosCristal);

    renderer.render(scene, camera);
}
animate();
