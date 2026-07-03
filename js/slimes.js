import * as THREE from 'three';

export const slimes = [];
export let slimesCount = 0;

export function initSlimes(scene, getGroundHeight) {
    const slimeGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const ojoGeo = new THREE.SphereGeometry(0.06, 4, 4);
    const slimeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const ojoMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    for(let i = 0; i < 20; i++) {
        const bodyMesh = new THREE.Mesh(slimeGeo, slimeMat);
        const ojoIzq = new THREE.Mesh(ojoGeo, ojoMat); ojoIzq.position.set(-0.15, 0.1, 0.3); bodyMesh.add(ojoIzq);
        const ojoDer = new THREE.Mesh(ojoGeo, ojoMat); ojoDer.position.set(0.15, 0.1, 0.3); bodyMesh.add(ojoDer);

        const rx = (Math.random() - 0.5) * 60; const rz = (Math.random() - 0.5) * 60;
        bodyMesh.position.set(rx, getGroundHeight(rx, rz) + 0.4, rz);
        scene.add(bodyMesh);
        slimes.push({ mesh: bodyMesh, jumpVel: 0, dirX: 0, dirZ: 0, isGrounded: false, timer: Math.random() * 2 });
    }
}

export function updateSlimes(scene, camera, state, getGroundHeight, obstaculosCristal) {
    for(let i = slimes.length - 1; i >= 0; i--) {
        const s = slimes[i];
        const currentGround = getGroundHeight(s.mesh.position.x, s.mesh.position.z) + 0.4;
        const distToPlayer = camera.position.distanceTo(s.mesh.position);

        if (state.isSuctioning && distToPlayer < 12) {
            s.isGrounded = false;
            s.mesh.position.addScaledVector(new THREE.Vector3().subVectors(camera.position, s.mesh.position).normalize(), 0.22);
            s.mesh.scale.set(1.2, 0.7, 0.7);
        } else if (s.isGrounded) {
            s.timer -= 0.02;
            if(s.timer <= 0) {
                s.jumpVel = 0.23; const ang = Math.random() * Math.PI * 2;
                s.dirX = Math.cos(ang) * 0.14; s.dirZ = Math.sin(ang) * 0.14;
                s.isGrounded = false; s.timer = 0.3 + Math.random() * 1.2;
            }
            s.mesh.scale.set(1, 1, 1);
        } else {
            s.jumpVel -= 0.018; s.mesh.position.y += s.jumpVel;
            const sPrevX = s.mesh.position.x; const sPrevZ = s.mesh.position.z;
            s.mesh.position.x += s.dirX; s.mesh.position.z += s.dirZ;

            for (let obs of obstaculosCristal) {
                if (Math.hypot(s.mesh.position.x - obs.position.x, s.mesh.position.z - obs.position.z) < obs.radio - 0.2) {
                    s.dirX *= -1; s.dirZ *= -1; s.mesh.position.x = sPrevX; s.mesh.position.z = sPrevZ;
                }
            }
            s.mesh.position.x = Math.max(-45, Math.min(45, s.mesh.position.x));
            s.mesh.position.z = Math.max(-45, Math.min(45, s.mesh.position.z));
            s.mesh.scale.set(0.7, 1.3, 0.7);

            if(s.mesh.position.y <= currentGround) {
                s.mesh.position.y = currentGround; s.jumpVel = 0; s.dirX = 0; s.dirZ = 0; s.isGrounded = true;
            }
        }
        s.mesh.lookAt(camera.position.x, s.mesh.position.y, camera.position.z);

        if(distToPlayer < 1.6) {
            scene.remove(s.mesh); slimes.splice(i, 1); slimesCount++;

            // Actualización del contador con el objetivo de 20
            const scoreEl = document.getElementById('score');
            if(scoreEl) scoreEl.innerText = `SLIMES: ${slimesCount} / 20`;

            if(slimesCount >= 20) {
                const rad = document.getElementById("radioStatus");
                rad.style.opacity = 1;
                const audio = new Audio("assets/music/discurso.mp3");
                audio.play();
                audio.onended = () => {
                    rad.innerText = "Transmisión finalizada.";
                    setTimeout(() => location.reload(), 3000);
                };
                slimesCount = -9999;
            }
        }
    }
}
