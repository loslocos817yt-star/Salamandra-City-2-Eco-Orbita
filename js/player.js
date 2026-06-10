import * as THREE from 'three';
export let vacpack, anilloLuz;
const eyeHeight = 1.5;

export function initPlayer(scene, camera) {
    vacpack = new THREE.Group();
    const metalMat = new THREE.MeshBasicMaterial({ color: 0x444449 });
    const boquillaMat = new THREE.MeshBasicMaterial({ color: 0x222225 });
    
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 6), metalMat);
    cuerpo.rotation.x = Math.PI / 2; 
    vacpack.add(cuerpo);
    
    const boquilla = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.2, 6), boquillaMat);
    boquilla.position.set(0, 0, -0.25); 
    boquilla.rotation.x = Math.PI / 2.5; 
    vacpack.add(boquilla);
    
    anilloLuz = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 6), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    anilloLuz.position.set(0, 0, -0.15); 
    anilloLuz.rotation.x = Math.PI / 2; 
    vacpack.add(anilloLuz);

    vacpack.position.set(0.3, -0.25, -0.5); 
    camera.add(vacpack); 
    scene.add(camera); 
    camera.position.set(0, 5, 0);
}

export function updatePlayer(camera, state, getGroundHeight, obstaculosCristal, bobbingTimer) {
    camera.rotation.set(state.lookPitch, state.lookYaw, 0, 'YXZ');
    
    // forward ahora está normalizado para que 'adelante' sea positivo
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
    
    const prevX = camera.position.x; const prevZ = camera.position.z;
    
    // CORRECCIÓN: Cambiamos el signo de state.moveY para invertir el movimiento
    camera.position.addScaledVector(forward, state.moveY * 0.12).addScaledVector(right, state.moveX * 0.12);
    
    for (let obs of obstaculosCristal) {
        if (Math.hypot(camera.position.x - obs.position.x, camera.position.z - obs.position.z) < obs.radio) {
            camera.position.x = prevX; camera.position.z = prevZ;
        }
    }
    
    if (state.moveX !== 0 || state.moveY !== 0) {
        vacpack.position.y = -0.25 + Math.sin(bobbingTimer) * 0.015;
        vacpack.position.x = 0.3 + Math.cos(bobbingTimer * 0.5) * 0.01;
    } else { 
        vacpack.position.set(0.3, -0.25, -0.5); 
    }
    
    anilloLuz.material.color.setHex(state.isSuctioning ? 0xff0055 : 0xffaa00);
    
    const groundY = getGroundHeight(camera.position.x, camera.position.z);
    state.jumpVel -= 0.01; camera.position.y += state.jumpVel;
    if (camera.position.y < groundY + eyeHeight) { 
        camera.position.y = groundY + eyeHeight; state.jumpVel = 0; state.isGrounded = true; 
    } else { 
        state.isGrounded = false; 
    }
}
