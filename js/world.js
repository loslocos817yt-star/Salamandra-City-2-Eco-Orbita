import * as THREE from 'three';
import { crearNaveChocada } from './objects.js';

export const obstaculosCristal = [];
export let sky, suelo, raycaster, downVector, nave;

export function initWorld(scene, loader) {
    scene.fog = new THREE.FogExp2(0x020208, 0.04);
    
    const cieloTex = loader.load('assets/texturas/cielos/Blue_Nebula_01-512x512.png');
    cieloTex.wrapS = cieloTex.wrapT = THREE.RepeatWrapping; cieloTex.repeat.set(4, 2); cieloTex.magFilter = THREE.NearestFilter;
    sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 15), new THREE.MeshBasicMaterial({ map: cieloTex, side: THREE.BackSide, fog: false }));
    scene.add(sky);

    const piedraTex = loader.load('assets/texturas/piedra.png');
    piedraTex.wrapS = piedraTex.wrapT = THREE.RepeatWrapping; piedraTex.repeat.set(20, 20); piedraTex.magFilter = THREE.NearestFilter;
    const floorGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3 + Math.sin(x * 0.05) * 4);
    }
    floorGeo.computeVertexNormals();
    suelo = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial({ map: piedraTex }));
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);

    suelo.updateMatrixWorld(true);
    raycaster = new THREE.Raycaster();
    downVector = new THREE.Vector3(0, -1, 0);

    nave = crearNaveChocada();
    nave.position.y = getGroundHeight(20, 20) + 1.5;
    scene.add(nave);

    const cristalesTex = loader.load('assets/texturas/cristales.png');
    cristalesTex.magFilter = THREE.NearestFilter; cristalesTex.minFilter = THREE.NearestFilter;
    const cristalMat = new THREE.MeshBasicMaterial({ map: cristalesTex });
    for (let i = 0; i < 16; i++) {
        const alto = 1.5 + Math.random() * 6.5; const anchoBase = 0.4 + Math.random() * 1.2;
        const cristalPivot = new THREE.Group();
        const cx = (Math.random() - 0.5) * 75; const cz = (Math.random() - 0.5) * 75;
        cristalPivot.position.set(cx, getGroundHeight(cx, cz) - 1.0, cz);
        const cristalMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, anchoBase, alto, 6), cristalMat);
        cristalMesh.position.y = alto / 2;
        cristalPivot.add(cristalMesh);
        scene.add(cristalPivot);
        obstaculosCristal.push({ position: new THREE.Vector3(cx, 0, cz), radio: anchoBase + 0.4 });
    }
}

export function getGroundHeight(x, z) {
    if(!raycaster) return 0;
    raycaster.set(new THREE.Vector3(x, 50, z), downVector);
    const intersects = raycaster.intersectObject(suelo);
    return intersects.length > 0 ? intersects[0].point.y : 0;
}
