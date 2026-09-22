/**
 * First-Person Player Controller for "Lorong Gelap"
 * Handles keyboard/mouse inputs, flashlight physics, stamina, head bob, wall collisions, and interactions.
 */
class HorrorPlayer {
    constructor(camera, scene, map) {
        this.camera = camera;
        this.scene = scene;
        this.map = map;

        // Player physics & dimensions
        this.position = new THREE.Vector3(0, 1.7, 30); // Spawns at south end of hallway
        this.camera.position.copy(this.position);
        this.playerRadius = 0.45;
        this.playerHeight = 1.7;

        // Rotation
        this.yaw = 0; // Horizontal rotation
        this.pitch = 0; // Vertical rotation
        this.sensitivity = 0.0034; // Higher sensitivity for laptop touchpads & mouse

        // Movement keys (WASD)
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            run: false
        };

        // Camera Look keys (Arrow keys for laptop touchpad users)
        this.lookKeys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.keyTurnSpeed = 2.4; // Radians per second

        // Touchpad / Mouse drag look state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Speeds
        this.walkSpeed = 3.6;
        this.runSpeed = 6.8;
        this.velocity = new THREE.Vector3();

        // Stamina
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrain = 22; // per second when running
        this.staminaRecover = 14; // per second when resting/walking
        this.isExhausted = false;

        // Flashlight (Significantly brighter with wider coverage)
        this.flashlightOn = true;
        this.battery = 100;
        this.batteryDrain = 1.0; // ~100 seconds continuous runtime
        this.flashlightMesh = null;
        this.flashlightLight = null;
        this.flashlightTarget = null;
        this.initFlashlight();

        // Head Bobbing & Footsteps
        this.bobTimer = 0;
        this.footstepTimer = 0;

        // Raycaster for object interaction
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 3.2;
        this.hoveredObject = null;

        this.setupInputListeners();
    }

    initFlashlight() {
        // Bright and wide spotlight cone
        this.flashlightLight = new THREE.SpotLight(0xfff7e8, 5.0);
        this.flashlightLight.angle = Math.PI / 3.8; // ~47 degrees wide cone
        this.flashlightLight.penumbra = 0.4;
        this.flashlightLight.decay = 1.3;
        this.flashlightLight.distance = 38;
        this.flashlightLight.castShadow = true;

        // Spotlight target
        this.flashlightTarget = new THREE.Object3D();
        this.scene.add(this.flashlightTarget);
        this.flashlightLight.target = this.flashlightTarget;

        // Ambient bulb on camera to illuminate immediate surroundings (360 degrees)
        this.flashlightGlow = new THREE.PointLight(0xfff7e8, 0.9, 7.0);

        this.scene.add(this.flashlightLight);
        this.scene.add(this.flashlightGlow);
    }

    setupInputListeners() {
        if (HorrorPlayer.listenersBound) return;
        HorrorPlayer.listenersBound = true;

        window.addEventListener('keydown', (e) => {
            if (window.game && window.game.player) window.game.player.onKeyDown(e);
        });
        window.addEventListener('keyup', (e) => {
            if (window.game && window.game.player) window.game.player.onKeyUp(e);
        });
        document.addEventListener('mousemove', (e) => {
            if (window.game && window.game.player) window.game.player.onMouseMove(e);
        });
        document.addEventListener('mousedown', (e) => {
            if (window.game && window.game.player) window.game.player.onMouseDown(e);
        });
        document.addEventListener('mouseup', (e) => {
            if (window.game && window.game.player) window.game.player.onMouseUp(e);
        });
        document.addEventListener('touchstart', (e) => {
            if (window.game && window.game.player) window.game.player.onTouchStart(e);
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (window.game && window.game.player) window.game.player.onTouchMove(e);
        }, { passive: false });
        document.addEventListener('touchend', (e) => {
            if (window.game && window.game.player) window.game.player.onTouchEnd(e);
        });
    }

    onMouseDown(e) {
        if (!window.game || window.game.state !== 'playing') return;
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    onMouseUp(e) {
        this.isDragging = false;
    }

    onTouchStart(e) {
        if (!window.game || window.game.state !== 'playing') return;
        if (e.touches.length > 0) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }

    onTouchMove(e) {
        if (!this.isDragging || !window.game || window.game.state !== 'playing') return;
        if (e.touches.length > 0) {
            const dx = e.touches[0].clientX - this.lastMouseX;
            const dy = e.touches[0].clientY - this.lastMouseY;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;

            this.yaw -= dx * (this.sensitivity * 1.3);
            this.pitch -= dy * (this.sensitivity * 1.3);

            const maxPitch = Math.PI / 2 - 0.08;
            this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
            e.preventDefault();
        }
    }

    onTouchEnd(e) {
        this.isDragging = false;
    }

    onKeyDown(e) {
        if (!window.game || window.game.state !== 'playing') return;

        switch (e.code) {
            // Movement keys (WASD)
            case 'KeyW': this.keys.forward = true; break;
            case 'KeyS': this.keys.backward = true; break;
            case 'KeyA': this.keys.left = true; break;
            case 'KeyD': this.keys.right = true; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.run = true; break;
            case 'KeyF': this.toggleFlashlight(); break;
            case 'KeyE': this.interact(); break;

            // Camera Look keys (Arrow keys for Touchpad/Keyboard looking)
            case 'ArrowLeft': this.lookKeys.left = true; e.preventDefault(); break;
            case 'ArrowRight': this.lookKeys.right = true; e.preventDefault(); break;
            case 'ArrowUp': this.lookKeys.up = true; e.preventDefault(); break;
            case 'ArrowDown': this.lookKeys.down = true; e.preventDefault(); break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            // Movement keys
            case 'KeyW': this.keys.forward = false; break;
            case 'KeyS': this.keys.backward = false; break;
            case 'KeyA': this.keys.left = false; break;
            case 'KeyD': this.keys.right = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.run = false; break;

            // Camera Look keys
            case 'ArrowLeft': this.lookKeys.left = false; break;
            case 'ArrowRight': this.lookKeys.right = false; break;
            case 'ArrowUp': this.lookKeys.up = false; break;
            case 'ArrowDown': this.lookKeys.down = false; break;
        }
    }

    onMouseMove(e) {
        if (!window.game || window.game.state !== 'playing') return;

        const maxPitch = Math.PI / 2 - 0.08;

        if (document.pointerLockElement === document.body) {
            // Pointer locked: use movement deltas
            const dx = e.movementX || 0;
            const dy = e.movementY || 0;
            this.yaw -= dx * this.sensitivity;
            this.pitch -= dy * this.sensitivity;
        } else if (this.isDragging) {
            // Drag-to-look on touchpad / mouse without needing pointer lock
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            this.yaw -= dx * (this.sensitivity * 1.3);
            this.pitch -= dy * (this.sensitivity * 1.3);
        }

        // Clamp pitch to prevent somersaults
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    }

    toggleFlashlight() {
        if (this.battery <= 0) {
            // Can't turn on dead flashlight
            this.flashlightOn = false;
            window.horrorAudio.playFlashlightSwitch();
            window.game.showNotification("Battery is empty! Find a battery pack.");
            return;
        }

        this.flashlightOn = !this.flashlightOn;
        window.horrorAudio.playFlashlightSwitch();
        this.updateFlashlightState();
    }

    updateFlashlightState() {
        const active = this.flashlightOn && this.battery > 0;
        this.flashlightLight.visible = active;
        this.flashlightGlow.visible = active;
    }

    interact() {
        if (!this.hoveredObject) return;

        const obj = this.hoveredObject;

        if (obj.type === 'key') {
            obj.collected = true;
            this.scene.remove(obj.mesh);
            this.map.keysCollected++;
            window.horrorAudio.playKeyPickup();
            window.game.showNotification(`Picked up ${obj.name}! (${this.map.keysCollected}/3 Keys)`);
            window.game.updateKeyUI();
        } else if (obj.type === 'battery') {
            obj.collected = true;
            this.scene.remove(obj.mesh);
            this.battery = Math.min(100, this.battery + 50);
            window.horrorAudio.playBatteryPickup();
            window.game.showNotification("Battery recharged +50%!");
            if (!this.flashlightOn && this.battery > 0) {
                this.flashlightOn = true;
            }
            this.updateFlashlightState();
        } else if (obj.type === 'exit') {
            if (this.map.keysCollected >= this.map.totalKeys) {
                window.game.triggerVictory();
            } else {
                window.horrorAudio.playDoorLocked();
                window.game.showNotification(`Exit is locked! You need ${this.map.totalKeys - this.map.keysCollected} more key(s).`);
            }
        }
    }

    update(delta) {
        this.handleMovement(delta);
        this.handleFlashlight(delta);
        this.handleInteractionRaycast();
    }

    handleMovement(delta) {
        // Calculate move direction relative to camera yaw
        const moveDir = new THREE.Vector3();
        if (this.keys.forward) moveDir.z -= 1;
        if (this.keys.backward) moveDir.z += 1;
        if (this.keys.left) moveDir.x -= 1;
        if (this.keys.right) moveDir.x += 1;

        const isMoving = moveDir.lengthSq() > 0;
        if (isMoving) moveDir.normalize();

        // Running & Stamina logic
        let isRunning = this.keys.run && isMoving && !this.isExhausted && this.stamina > 5;
        if (isRunning) {
            this.stamina -= this.staminaDrain * delta;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isExhausted = true;
                isRunning = false;
            }
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecover * delta);
            if (this.isExhausted && this.stamina > 25) {
                this.isExhausted = false;
            }
        }

        const currentSpeed = isRunning ? this.runSpeed : this.walkSpeed;

        // Apply rotation to movement vector
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        // Desired displacement
        const displacement = moveDir.clone().multiplyScalar(currentSpeed * delta);

        // Collision detection & slide with walls
        this.moveWithCollision(displacement);

        // Head Bobbing & Footstep Sounds
        if (isMoving) {
            const bobFrequency = isRunning ? 14 : 9;
            const bobAmplitude = isRunning ? 0.07 : 0.04;
            this.bobTimer += delta * bobFrequency;

            const bobOffset = Math.sin(this.bobTimer) * bobAmplitude;
            this.camera.position.y = this.position.y + bobOffset;

            // Footstep audio timing
            this.footstepTimer += delta * (isRunning ? 2.6 : 1.7);
            if (this.footstepTimer >= 1.0) {
                this.footstepTimer = 0;
                if (window.horrorAudio) {
                    window.horrorAudio.playFootstep(isRunning);
                }
            }
        } else {
            // Settle camera back to eye height smoothly
            this.camera.position.y += (this.position.y - this.camera.position.y) * 0.15;
            this.bobTimer = 0;
            this.footstepTimer = 0.5;
        }

        // Arrow Keys Camera Rotation (smooth turn for touchpad/keyboard users)
        if (this.lookKeys.left) this.yaw += this.keyTurnSpeed * delta;
        if (this.lookKeys.right) this.yaw -= this.keyTurnSpeed * delta;
        if (this.lookKeys.up) this.pitch += this.keyTurnSpeed * 0.8 * delta;
        if (this.lookKeys.down) this.pitch -= this.keyTurnSpeed * 0.8 * delta;

        const maxPitch = Math.PI / 2 - 0.08;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

        // Camera Orientation
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }

    moveWithCollision(displacement) {
        // Test X axis movement
        const nextPosX = this.position.clone();
        nextPosX.x += displacement.x;
        if (!this.checkCollision(nextPosX)) {
            this.position.x = nextPosX.x;
        }

        // Test Z axis movement
        const nextPosZ = this.position.clone();
        nextPosZ.z += displacement.z;
        if (!this.checkCollision(nextPosZ)) {
            this.position.z = nextPosZ.z;
        }

        this.camera.position.x = this.position.x;
        this.camera.position.z = this.position.z;
    }

    checkCollision(targetPos) {
        const playerBox = new THREE.Box3(
            new THREE.Vector3(targetPos.x - this.playerRadius, 0.2, targetPos.z - this.playerRadius),
            new THREE.Vector3(targetPos.x + this.playerRadius, this.playerHeight, targetPos.z + this.playerRadius)
        );

        for (let i = 0; i < this.map.colliders.length; i++) {
            if (playerBox.intersectsBox(this.map.colliders[i])) {
                return true;
            }
        }
        return false;
    }

    handleFlashlight(delta) {
        if (this.flashlightOn && this.battery > 0) {
            this.battery -= this.batteryDrain * delta;
            if (this.battery <= 0) {
                this.battery = 0;
                this.flashlightOn = false;
                this.updateFlashlightState();
                window.horrorAudio.playFlashlightSwitch();
                window.game.showNotification("Flashlight battery died!");
            }
        }

        // Flashlight flicker effect when battery is low (< 20%)
        if (this.flashlightOn && this.battery < 20) {
            if (Math.random() < 0.12) {
                this.flashlightLight.intensity = 0.4 + Math.random() * 0.8;
            } else {
                this.flashlightLight.intensity = 2.5 * (this.battery / 20);
            }
        } else if (this.flashlightOn) {
            this.flashlightLight.intensity = 2.5;
        }

        // Position flashlight with camera
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);

        // Flashlight position slightly offset to mimic holding it in right hand
        const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const lightPos = this.camera.position.clone()
            .add(rightVec.clone().multiplyScalar(0.22))
            .add(new THREE.Vector3(0, -0.15, 0));

        this.flashlightLight.position.copy(lightPos);
        this.flashlightGlow.position.copy(lightPos);

        // Aim beam forward
        const targetPos = this.camera.position.clone().add(camDir.clone().multiplyScalar(20));
        this.flashlightTarget.position.copy(targetPos);
    }

    handleInteractionRaycast() {
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        this.raycaster.set(this.camera.position, camDir);

        let closestItem = null;
        let closestDist = 2.5; // Interaction reach distance

        // Check Keys & Batteries
        this.map.interactables.forEach(item => {
            if (!item.collected) {
                const dist = this.position.distanceTo(item.position);
                if (dist < closestDist) {
                    // Check angle with camera forward
                    const toItem = item.position.clone().sub(this.camera.position).normalize();
                    const dot = camDir.dot(toItem);
                    if (dot > 0.85) { // Looking generally towards item
                        closestItem = item;
                        closestDist = dist;
                    }
                }
            }
        });

        // Check Exit Door
        if (this.map.exitDoor) {
            const dist = this.position.distanceTo(this.map.exitDoor.position);
            if (dist < 3.2) {
                const toDoor = this.map.exitDoor.position.clone().sub(this.camera.position).normalize();
                if (camDir.dot(toDoor) > 0.8) {
                    closestItem = {
                        type: 'exit',
                        name: 'Exit Door',
                        keysNeeded: this.map.totalKeys - this.map.keysCollected
                    };
                }
            }
        }

        this.hoveredObject = closestItem;
        window.game.updateInteractionPrompt(closestItem);
    }
}
