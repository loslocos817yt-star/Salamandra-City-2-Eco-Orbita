export const state = { lookYaw: 0, lookPitch: 0, moveX: 0, moveY: 0, isSuctioning: false, jumpVel: 0, isGrounded: false };

export function initControls() {
    // Detectar si el dispositivo soporta touch
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (!isTouchDevice) {
        // ==========================================
        // MODO PC (Teclado y Ratón)
        // ==========================================
        
        // Ocultar botones táctiles
        const ui = document.getElementById('ui');
        if (ui) ui.style.display = 'none';

        // Bloquear el cursor al hacer clic en el juego (Pointer Lock API)
        document.body.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });

        // Mover cámara con el ratón
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                state.lookYaw -= e.movementX * 0.003;
                state.lookPitch -= e.movementY * 0.003;
                // Limitar la vista arriba/abajo
                state.lookPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, state.lookPitch));
            }
        });

        // Controles de teclado WASD
        const keys = { w: false, a: false, s: false, d: false };

        function updateMovement() {
            state.moveY = (keys.w ? 1 : 0) + (keys.s ? -1 : 0);
            state.moveX = (keys.d ? 1 : 0) + (keys.a ? -1 : 0);
        }

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                keys[key] = true;
                updateMovement();
            }
            if (key === ' ' && state.isGrounded) { // Espacio = Saltar
                state.jumpVel = 0.22;
            }
            if (key === 'x') { // X = Absorber
                state.isSuctioning = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                keys[key] = false;
                updateMovement();
            }
            if (key === 'x') {
                state.isSuctioning = false;
            }
        });

    } else {
        // ==========================================
        // MODO ANDROID / MÓVIL (Touch)
        // ==========================================
        const dpadMap = { 'up': [0, 1], 'down': [0, -1], 'left': [-1, 0], 'right': [1, 0] };
        Object.keys(dpadMap).forEach(id => {
            const btn = document.getElementById(id);
            if(btn) {
                btn.addEventListener('touchstart', (e) => { e.preventDefault(); state.moveX = dpadMap[id][0]; state.moveY = dpadMap[id][1]; });
                btn.addEventListener('touchend', (e) => { e.preventDefault(); state.moveX = 0; state.moveY = 0; });
            }
        });

        const sBtn = document.getElementById('suctionBtn');
        if(sBtn) {
            sBtn.addEventListener('touchstart', (e) => { e.preventDefault(); state.isSuctioning = true; });
            sBtn.addEventListener('touchend', (e) => { e.preventDefault(); state.isSuctioning = false; });
        }

        const jBtn = document.getElementById('jumpBtn');
        if(jBtn) {
            jBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if(state.isGrounded) state.jumpVel = 0.22; });
        }

        let isDragging = false, lastX = 0, lastY = 0;
        window.addEventListener('touchstart', (e) => { 
            for(let t of e.touches) if(t.clientX > window.innerWidth/2) { isDragging = true; lastX = t.clientX; lastY = t.clientY; } 
        });
        window.addEventListener('touchmove', (e) => { 
            for(let t of e.touches) if(isDragging) {
                state.lookYaw -= (t.clientX - lastX) * 0.005; state.lookPitch -= (t.clientY - lastY) * 0.005;
                state.lookPitch = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, state.lookPitch));
                lastX = t.clientX; lastY = t.clientY;
            }
        });
        window.addEventListener('touchend', () => isDragging = false);
    }
}
