import * as THREE from 'three';

export function crearNaveChocada() {
    const grupo = new THREE.Group();
    // Cuerpo principal
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.5, 6, 8), new THREE.MeshBasicMaterial({ color: 0x444444 }));
    cuerpo.rotation.z = Math.PI / 4; 
    grupo.add(cuerpo);
    
    // Antenas rotas/humo
    const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 4), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    antena.position.set(1, 2, 0);
    grupo.add(antena);
    
    grupo.position.set(20, -1, 20); // Posición donde Pepe chocó
    return grupo;
}
