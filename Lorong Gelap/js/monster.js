/**
 * AI Monster System ("The Lurker") for "Lorong Gelap"
 * Features:
 * - Procedural 3D humanoid silhouette model with glowing eyes
 * - Limb animation and twitching head
 * - Patrol waypoint navigation
 * - Player detection (sight, flashlight beam, running noise)
 * - Chase state with roar audio
 * - Proximity heartbeat & red vignette tension
 * - Jumpscare attack triggering Game Over
 */
class HorrorMonster {
    constructor(scene, player, map) {
        this.scene = scene;
        this.player = player;
        this.map = map;

        // Position & Speeds
        this.position = new THREE.Vector3(0, 0, -20); // Spawns in north corridor
        this.patrolSpeed = 2.0;
        this.chaseSpeed = 4.8;
        this.currentSpeed = this.patrolSpeed;

        // States: 'patrol', 'investigate', 'chase', 'attack'
        this.state = 'patrol';

        // Patrol Waypoints around corridors and doorway thresholds
        this.waypoints = [
            new THREE.Vector3(0, 0, -25),   // North corridor
            new THREE.Vector3(0, 0, -5),    // Mid-North corridor
            new THREE.Vector3(12, 0, -18),  // Office room
            new THREE.Vector3(0, 0, 8),     // Mid corridor
            new THREE.Vector3(-12, 0, 20),  // Storage archive room
            new THREE.Vector3(0, 0, 22),    // South corridor
            new THREE.Vector3(12, 0, 20),   // Medical morgue
            new THREE.Vector3(0, 0, -5),    // Mid corridor
            new THREE.Vector3(-12, 0, -20)  // Utility generator room
        ];
        this.currentWaypointIndex = 0;

        // Detection parameters
        this.sightDistance = 11;
        this.flashlightDetectDistance = 22;
        this.lostPlayerTimer = 0;
        this.chaseGrowlCooldown = 0;

        // Heartbeat timer
        this.heartbeatTimer = 0;

        // Animation timers
        this.animTimer = 0;

        this.buildMonsterMesh();
    }

    buildMonsterMesh() {
        this.group = new THREE.Group();

        // Dark shadowy material
        const bodyMat = new THREE.MeshLambertMaterial({
            color: 0x050505,
            roughness: 0.95
        });

        // Slender tall torso (Height: 2.4m creature)
        const torsoGeo = new THREE.BoxGeometry(0.55, 1.1, 0.35);
        this.torso = new THREE.Mesh(torsoGeo, bodyMat);
        this.torso.position.y = 1.45;
        this.group.add(this.torso);

        // Creepy elongated head
        const headGeo = new THREE.BoxGeometry(0.32, 0.45, 0.35);
        this.head = new THREE.Mesh(headGeo, bodyMat);
        this.head.position.set(0, 2.2, 0.05);
        this.group.add(this.head);

        // Glowing red eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
        leftEye.position.set(-0.09, 2.25, 0.22);
        this.group.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
        rightEye.position.set(0.09, 2.25, 0.22);
        this.group.add(rightEye);

        // Subtle eye glow light
        this.eyeLight = new THREE.PointLight(0xff1111, 0.9, 3);
        this.eyeLight.position.set(0, 2.25, 0.35);
        this.group.add(this.eyeLight);

        // Elongated Arms
        const armGeo = new THREE.BoxGeometry(0.12, 1.25, 0.12);
        this.leftArm = new THREE.Mesh(armGeo, bodyMat);
        this.leftArm.position.set(-0.38, 1.25, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, bodyMat);
        this.rightArm.position.set(0.38, 1.25, 0);
        this.group.add(this.rightArm);

        // Claws
        const clawMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const leftClaw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), clawMat);
        leftClaw.rotation.x = Math.PI;
        leftClaw.position.set(-0.38, 0.55, 0);
        this.group.add(leftClaw);

        const rightClaw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), clawMat);
        rightClaw.rotation.x = Math.PI;
        rightClaw.position.set(0.38, 0.55, 0);
        this.group.add(rightClaw);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.16, 1.0, 0.16);
        this.leftLeg = new THREE.Mesh(legGeo, bodyMat);
        this.leftLeg.position.set(-0.18, 0.5, 0);
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, bodyMat);
        this.rightLeg.position.set(0.18, 0.5, 0);
        this.group.add(this.rightLeg);

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(delta) {
        if (!this.group) return;

        this.animTimer += delta * (this.state === 'chase' ? 9 : 4.5);
        if (this.chaseGrowlCooldown > 0) {
            this.chaseGrowlCooldown -= delta;
        }

        const distToPlayer = this.position.distanceTo(this.player.position);

        // Update atmospheric tension effects (Heartbeat + Danger Vignette)
        this.updateTension(distToPlayer, delta);

        // State Machine Decision
        this.checkPlayerDetection(distToPlayer);

        // Execute State Behavior
        if (this.state === 'chase') {
            this.chasePlayer(delta, distToPlayer);
        } else {
            this.patrolWaypoints(delta);
        }

        // Animate monster walk and twitch
        this.animateModel(delta);

        // Check if monster caught player
        if (distToPlayer < 1.35) {
            this.triggerKill();
        }
    }

    checkPlayerDetection(distToPlayer) {
        const canSee = this.hasLineOfSight();

        // 1. Direct vision check
        if (canSee && distToPlayer <= this.sightDistance) {
            this.startChase();
            return;
        }

        // 2. Flashlight detection: if player flashlight is on and shining toward monster
        if (this.player.flashlightOn && this.player.battery > 0 && distToPlayer <= this.flashlightDetectDistance) {
            const camDir = new THREE.Vector3();
            this.player.camera.getWorldDirection(camDir);
            const toMonster = this.position.clone().sub(this.player.position).normalize();
            if (camDir.dot(toMonster) > 0.75 && canSee) {
                // Flashlight illuminated the monster!
                this.startChase();
                return;
            }
        }

        // 3. Sprint noise detection: if player is running nearby (even around corners)
        if (this.player.keys.run && distToPlayer <= 10) {
            this.startChase();
            return;
        }

        // If in chase, check if lost
        if (this.state === 'chase') {
            if (!canSee || distToPlayer > this.sightDistance + 6) {
                this.lostPlayerTimer += 0.016;
                if (this.lostPlayerTimer > 4.0) { // Lost player for 4 seconds
                    this.state = 'patrol';
                    this.currentSpeed = this.patrolSpeed;
                    this.lostPlayerTimer = 0;
                }
            } else {
                this.lostPlayerTimer = 0;
            }
        }
    }

    hasLineOfSight() {
        // Raycast from monster head to player camera
        const origin = this.position.clone().add(new THREE.Vector3(0, 2.0, 0));
        const target = this.player.camera.position.clone();
        const dir = target.clone().sub(origin);
        const dist = dir.length();
        dir.normalize();

        const ray = new THREE.Ray(origin, dir);

        // Check against wall colliders
        for (let i = 0; i < this.map.colliders.length; i++) {
            const hit = ray.intersectBox(this.map.colliders[i], new THREE.Vector3());
            if (hit) {
                const hitDist = origin.distanceTo(hit);
                if (hitDist < dist - 0.4) {
                    return false; // Wall in between
                }
            }
        }
        return true;
    }

    startChase() {
        if (this.state !== 'chase') {
            this.state = 'chase';
            this.currentSpeed = this.chaseSpeed;
            if (this.chaseGrowlCooldown <= 0) {
                window.horrorAudio.playMonsterRoar();
                this.chaseGrowlCooldown = 6.0;
            }
        }
    }

    chasePlayer(delta, distToPlayer) {
        // Move towards player position with wall slide
        const dir = this.player.position.clone().sub(this.position);
        dir.y = 0;
        dir.normalize();

        const moveStep = dir.clone().multiplyScalar(this.currentSpeed * delta);
        this.moveWithCollision(moveStep);

        // Rotate towards player
        const targetRotY = Math.atan2(dir.x, dir.z);
        this.group.rotation.y = targetRotY;
    }

    patrolWaypoints(delta) {
        const targetWp = this.waypoints[this.currentWaypointIndex];
        const toWp = targetWp.clone().sub(this.position);
        toWp.y = 0;
        const dist = toWp.length();

        if (dist < 1.2) {
            // Reached waypoint, advance to next
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
        } else {
            toWp.normalize();
            const moveStep = toWp.clone().multiplyScalar(this.currentSpeed * delta);
            this.moveWithCollision(moveStep);

            const targetRotY = Math.atan2(toWp.x, toWp.z);
            this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.1;
        }
    }

    moveWithCollision(displacement) {
        const testPos = this.position.clone().add(displacement);
        const monsterBox = new THREE.Box3(
            new THREE.Vector3(testPos.x - 0.4, 0.2, testPos.z - 0.4),
            new THREE.Vector3(testPos.x + 0.4, 2.2, testPos.z + 0.4)
        );

        let collided = false;
        for (let i = 0; i < this.map.colliders.length; i++) {
            if (monsterBox.intersectsBox(this.map.colliders[i])) {
                collided = true;
                break;
            }
        }

        if (!collided) {
            this.position.copy(testPos);
            this.group.position.copy(this.position);
        } else {
            // Try sliding on X or Z
            const testX = this.position.clone();
            testX.x += displacement.x;
            const boxX = new THREE.Box3(
                new THREE.Vector3(testX.x - 0.4, 0.2, testX.z - 0.4),
                new THREE.Vector3(testX.x + 0.4, 2.2, testX.z + 0.4)
            );
            let collX = false;
            for (let i = 0; i < this.map.colliders.length; i++) {
                if (boxX.intersectsBox(this.map.colliders[i])) { collX = true; break; }
            }
            if (!collX) {
                this.position.x = testX.x;
                this.group.position.x = this.position.x;
            }

            const testZ = this.position.clone();
            testZ.z += displacement.z;
            const boxZ = new THREE.Box3(
                new THREE.Vector3(testZ.x - 0.4, 0.2, testZ.z - 0.4),
                new THREE.Vector3(testZ.x + 0.4, 2.2, testZ.z + 0.4)
            );
            let collZ = false;
            for (let i = 0; i < this.map.colliders.length; i++) {
                if (boxZ.intersectsBox(this.map.colliders[i])) { collZ = true; break; }
            }
            if (!collZ) {
                this.position.z = testZ.z;
                this.group.position.z = this.position.z;
            }
        }
    }

    animateModel(delta) {
        const swing = Math.sin(this.animTimer) * 0.45;
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
        this.leftLeg.rotation.x = -swing * 0.8;
        this.rightLeg.rotation.x = swing * 0.8;

        // Creepy random head twitch
        if (Math.random() < 0.08) {
            this.head.rotation.z = (Math.random() - 0.5) * 0.6;
            this.head.rotation.y = (Math.random() - 0.5) * 0.5;
        } else {
            this.head.rotation.z *= 0.9;
            this.head.rotation.y *= 0.9;
        }
    }

    updateTension(distToPlayer, delta) {
        const dangerOverlay = document.getElementById('danger-overlay');

        if (distToPlayer < 18) {
            const proximityFactor = Math.max(0, 1 - distToPlayer / 18);
            if (dangerOverlay) {
                dangerOverlay.style.opacity = (proximityFactor * 0.85).toString();
            }

            // Accelerate heartbeat rate based on proximity
            this.heartbeatTimer += delta;
            const beatInterval = 0.35 + (1 - proximityFactor) * 0.75; // Faster when closer
            if (this.heartbeatTimer >= beatInterval) {
                this.heartbeatTimer = 0;
                window.horrorAudio.triggerHeartbeat(proximityFactor);
            }
        } else {
            if (dangerOverlay) dangerOverlay.style.opacity = '0';
            this.heartbeatTimer = 0;
        }
    }

    triggerKill() {
        if (window.game.state !== 'playing') return;
        window.game.triggerGameOver();
    }
}
