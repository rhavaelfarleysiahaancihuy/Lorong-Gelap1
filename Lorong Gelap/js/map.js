/**
 * Level Map Generator for "Lorong Gelap"
 * Builds the corridors, rooms, props, lighting, keys, and batteries.
 */
class HorrorMap {
    constructor(scene) {
        this.scene = scene;
        this.colliders = []; // Array of THREE.Box3 for collision checking
        this.interactables = []; // Items player can collect/interact with
        this.flickeringLights = [];
        this.exitDoor = null;
        this.keysCollected = 0;
        this.totalKeys = 3;

        this.initMaterials();
        this.buildLevel();
    }

    initMaterials() {
        const wallTex = TextureGenerator.createWallTexture();
        wallTex.repeat.set(2, 1);
        this.wallMat = new THREE.MeshLambertMaterial({ map: wallTex });

        const floorTex = TextureGenerator.createFloorTexture();
        floorTex.repeat.set(8, 16);
        this.floorMat = new THREE.MeshLambertMaterial({ map: floorTex, roughness: 0.8 });

        const ceilingTex = TextureGenerator.createCeilingTexture();
        ceilingTex.repeat.set(8, 16);
        this.ceilingMat = new THREE.MeshLambertMaterial({ map: ceilingTex, roughness: 0.9 });

        this.woodMat = new THREE.MeshLambertMaterial({ map: TextureGenerator.createWoodTexture() });
        this.metalMat = new THREE.MeshLambertMaterial({ map: TextureGenerator.createMetalTexture() });
        this.exitSignMat = new THREE.MeshBasicMaterial({ map: TextureGenerator.createExitSignTexture() });
        this.cardboardMat = new THREE.MeshLambertMaterial({ color: 0x5a4830 });
    }

    buildLevel() {
        // Floor and Ceiling
        const floorGeo = new THREE.PlaneGeometry(50, 70);
        const floor = new THREE.Mesh(floorGeo, this.floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);

        const ceiling = new THREE.Mesh(floorGeo, this.ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3.8, 0);
        this.scene.add(ceiling);

        // Build Walls
        this.buildCorridorsAndRooms();

        // Build Furniture & Props
        this.buildProps();

        // Spawn Interactive Items (3 Keys & Batteries)
        this.spawnItems();

        // Exit Door
        this.buildExitDoor();

        // Flickering Atmospheric Lights
        this.setupLights();
    }

    addWall(x, z, width, depth, height = 3.8, y = 1.9) {
        const wallGeo = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(wallGeo, this.wallMat);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);

        // Add to collision detection list
        const box = new THREE.Box3().setFromObject(wall);
        this.colliders.push(box);
        return wall;
    }

    buildCorridorsAndRooms() {
        // Outer Boundary Walls
        this.addWall(0, -35, 50, 1);  // North wall
        this.addWall(0, 35, 50, 1);   // South wall
        this.addWall(-25, 0, 1, 70);  // West wall
        this.addWall(25, 0, 1, 70);   // East wall

        // MAIN CORRIDOR (Width 5 meters, runs from Z: 30 to Z: -30, centered at X: 0)
        // Left corridor wall segments with room doorways
        this.addWall(-3, 25, 0.6, 12);  // South-west corridor wall
        this.addWall(-3, 3, 0.6, 16);   // Mid-west corridor wall
        this.addWall(-3, -21, 0.6, 16); // North-west corridor wall

        // Right corridor wall segments with room doorways
        this.addWall(3, 25, 0.6, 12);   // South-east corridor wall
        this.addWall(3, 3, 0.6, 16);    // Mid-east corridor wall
        this.addWall(3, -21, 0.6, 16);  // North-east corridor wall

        // Room partitions:
        // Room 1: Storage Archive (South-West: X: -14, Z: 20)
        this.addWall(-14, 13, 22, 0.6); // Dividing wall between Room 1 & Room 3

        // Room 2: Medical/Morgue Room (South-East: X: 14, Z: 20)
        this.addWall(14, 13, 22, 0.6);  // Dividing wall between Room 2 & Room 4

        // Room 3: Electrical Utility Room (North-West: X: -14, Z: -13)
        this.addWall(-14, -13, 22, 0.6);

        // Room 4: Office Room (North-East: X: 14, Z: -13)
        this.addWall(14, -13, 22, 0.6);
    }

    buildProps() {
        // Storage Shelves in Room 1 (Archive)
        this.createShelf(-18, 26, 0);
        this.createShelf(-18, 20, 0);
        this.createShelf(-12, 28, Math.PI / 2);
        this.createCardboardBoxes(-14, 18);

        // Medical Operating Table & Cabinets in Room 2 (Morgue)
        this.createOperatingTable(14, 24);
        this.createCabinet(21, 26, -Math.PI / 2);
        this.createCabinet(21, 21, -Math.PI / 2);

        // Electrical Generator & Panels in Room 3 (Utility)
        this.createGenerator(-16, -26);
        this.createBreakerPanel(-24.3, -22);

        // Office Desks & Chairs in Room 4 (Office)
        this.createDesk(14, -22, 0);
        this.createDesk(18, -26, Math.PI / 2);
        this.createCabinet(23, -20, -Math.PI / 2);

        // Hallway Benches & Debris
        this.createBench(-2.4, 12, 0);
        this.createBench(2.4, -6, Math.PI);
    }

    createShelf(x, z, rotY) {
        const group = new THREE.Group();
        const shelfMat = this.metalMat;

        // Uprights
        for (let i = -1; i <= 1; i += 2) {
            for (let j = -0.4; j <= 0.4; j += 0.8) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), shelfMat);
                leg.position.set(i * 1.2, 1.25, j);
                group.add(leg);
            }
        }

        // Horizontal shelves
        for (let y = 0.4; y <= 2.4; y += 0.6) {
            const plank = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.9), shelfMat);
            plank.position.set(0, y, 0);
            group.add(plank);
        }

        group.position.set(x, 0, z);
        group.rotation.y = rotY;
        this.scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        this.colliders.push(box);
    }

    createOperatingTable(x, z) {
        const group = new THREE.Group();
        // Base legs
        for (let ix = -1; ix <= 1; ix += 2) {
            for (let iz = -0.4; iz <= 0.4; iz += 0.8) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9), this.metalMat);
                leg.position.set(ix * 0.9, 0.45, iz);
                group.add(leg);
            }
        }
        // Tabletop with bloody stain tint
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.0), this.metalMat);
        top.position.set(0, 0.95, 0);
        group.add(top);

        group.position.set(x, 0, z);
        this.scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        this.colliders.push(box);
    }

    createDesk(x, z, rotY) {
        const group = new THREE.Group();
        // Legs
        for (let ix = -0.8; ix <= 0.8; ix += 1.6) {
            for (let iz = -0.4; iz <= 0.4; iz += 0.8) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), this.woodMat);
                leg.position.set(ix, 0.375, iz);
                group.add(leg);
            }
        }
        // Surface
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.0), this.woodMat);
        deskTop.position.set(0, 0.78, 0);
        group.add(deskTop);

        // Old monitor on desk
        const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.25), this.metalMat);
        monitor.position.set(0, 1.0, 0);
        group.add(monitor);

        group.position.set(x, 0, z);
        group.rotation.y = rotY;
        this.scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        this.colliders.push(box);
    }

    createCabinet(x, z, rotY) {
        const cabGeo = new THREE.BoxGeometry(1.2, 2.2, 0.6);
        const cab = new THREE.Mesh(cabGeo, this.metalMat);
        cab.position.set(x, 1.1, z);
        cab.rotation.y = rotY;
        this.scene.add(cab);

        const box = new THREE.Box3().setFromObject(cab);
        this.colliders.push(box);
    }

    createGenerator(x, z) {
        const group = new THREE.Group();
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 1.4), this.metalMat);
        mainBody.position.set(0, 0.8, 0);
        group.add(mainBody);

        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5), this.metalMat);
        pipe.position.set(0.6, 1.8, 0);
        group.add(pipe);

        group.position.set(x, 0, z);
        this.scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        this.colliders.push(box);
    }

    createBreakerPanel(x, z) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.6), this.metalMat);
        panel.position.set(x, 1.8, z);
        this.scene.add(panel);
    }

    createBench(x, z, rotY) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.5), this.woodMat);
        bench.position.set(x, 0.25, z);
        bench.rotation.y = rotY;
        this.scene.add(bench);

        const box = new THREE.Box3().setFromObject(bench);
        this.colliders.push(box);
    }

    createCardboardBoxes(x, z) {
        for (let i = 0; i < 3; i++) {
            const size = 0.5 + Math.random() * 0.3;
            const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), this.cardboardMat);
            box.position.set(x + (Math.random() - 0.5) * 0.8, size / 2, z + (Math.random() - 0.5) * 0.8);
            box.rotation.y = Math.random() * Math.PI;
            this.scene.add(box);
            this.colliders.push(new THREE.Box3().setFromObject(box));
        }
    }

    buildExitDoor() {
        // Exit frame at North corridor end: X: 0, Z: -34.5
        const doorGroup = new THREE.Group();

        // Heavy steel door
        const doorMat = new THREE.MeshLambertMaterial({
            color: 0x3b1c1c,
            roughness: 0.7
        });
        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.3), doorMat);
        doorMesh.position.set(0, 1.6, 0);
        doorGroup.add(doorMesh);

        // Padlock chains representation
        const lockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.4), new THREE.MeshLambertMaterial({ color: 0xd4af37 }));
        lockMesh.position.set(0, 1.4, 0.15);
        doorGroup.add(lockMesh);

        // EXIT SIGN above door
        const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.1), this.exitSignMat);
        signMesh.position.set(0, 3.5, 0.1);
        doorGroup.add(signMesh);

        // Dim green glow near exit
        const exitLight = new THREE.PointLight(0x10b981, 0.8, 6);
        exitLight.position.set(0, 3.4, 0.5);
        doorGroup.add(exitLight);

        doorGroup.position.set(0, 0, -34.2);
        this.scene.add(doorGroup);

        this.exitDoor = {
            group: doorGroup,
            position: new THREE.Vector3(0, 1.6, -34.2),
            isUnlocked: false,
            radius: 3.0
        };

        // Add to colliders so player can't walk through closed exit door
        this.colliders.push(new THREE.Box3().setFromObject(doorMesh));
    }

    spawnItems() {
        // 3 Keys
        // Key 1: In Archive Room (on a crate)
        this.createKeyItem(-17, 0.9, 21, "Key 1: Storage Key");

        // Key 2: In Morgue Room (on operating table)
        this.createKeyItem(14, 1.05, 24, "Key 2: Medical Key");

        // Key 3: In Electrical Utility Room (near generator)
        this.createKeyItem(-17, 0.8, -27, "Key 3: Electrical Key");

        // 3 Flashlight Battery Packs
        this.createBatteryItem(15, 0.85, -22, "Battery Pack (+50%)"); // Office desk
        this.createBatteryItem(-2.4, 0.55, 12, "Battery Pack (+50%)"); // Corridor bench
        this.createBatteryItem(-23, 0.4, 25, "Battery Pack (+50%)");   // Back corner storage
    }

    createKeyItem(x, y, z, name) {
        const group = new THREE.Group();
        // Golden metallic key shape
        const keyMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), keyMat);
        ring.rotation.x = Math.PI / 2;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25), keyMat);
        stem.rotation.z = Math.PI / 2;
        stem.position.set(0.12, 0, 0);
        const bit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.02), keyMat);
        bit.position.set(0.2, -0.03, 0);

        group.add(ring);
        group.add(stem);
        group.add(bit);

        // Subtle glowing halo
        const halo = new THREE.PointLight(0xffd700, 0.8, 2.5);
        group.add(halo);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.interactables.push({
            type: 'key',
            name: name,
            mesh: group,
            position: new THREE.Vector3(x, y, z),
            collected: false
        });
    }

    createBatteryItem(x, y, z, name) {
        const group = new THREE.Group();
        const batMat = new THREE.MeshLambertMaterial({ color: 0x10b981 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), batMat);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), new THREE.MeshBasicMaterial({ color: 0xcccccc }));
        cap.position.set(0, 0.12, 0);

        group.add(body);
        group.add(cap);

        // Green subtle glow
        const glow = new THREE.PointLight(0x10b981, 0.6, 2.0);
        group.add(glow);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.interactables.push({
            type: 'battery',
            name: name,
            mesh: group,
            position: new THREE.Vector3(x, y, z),
            collected: false
        });
    }

    setupLights() {
        // Atmospheric ambient moonlight / hall fill (soft blue-grey)
        const ambient = new THREE.AmbientLight(0x404555, 1.1);
        this.scene.add(ambient);

        // Hallway Flickering Ceiling Bulbs (brighter with wider reach)
        this.addCeilingBulb(0, 3.6, 24, 0xffeedd, 2.5, 18);
        this.addCeilingBulb(0, 3.6, 8, 0xffeedd, 2.5, 18);
        this.addCeilingBulb(0, 3.6, -8, 0xffe0b2, 2.5, 18);
        this.addCeilingBulb(0, 3.6, -24, 0xffd1b2, 2.5, 18);

        // Room 1 (Storage Archive) - eerie amber lantern glow
        this.addCeilingBulb(-14, 3.5, 20, 0xffaa55, 2.2, 16);

        // Room 2 (Morgue) spooky bluish flickering light
        this.addCeilingBulb(14, 3.5, 20, 0x88ccff, 2.4, 18);

        // Room 3 (Utility Generator) greenish fluorescent hum light
        this.addCeilingBulb(-14, 3.5, -20, 0xd0ffcc, 2.4, 18);

        // Room 4 (Office) dim warm office light
        this.addCeilingBulb(14, 3.5, -20, 0xffeebb, 2.2, 16);
    }

    addCeilingBulb(x, y, z, color, intensity, distance) {
        // Fixture mesh
        const fixMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08), this.metalMat);
        fixMesh.position.set(x, y, z);
        this.scene.add(fixMesh);

        // Small bulb
        const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshBasicMaterial({ color: color }));
        bulbMesh.position.set(x, y - 0.06, z);
        this.scene.add(bulbMesh);

        // Point light
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(x, y - 0.1, z);
        this.scene.add(light);

        this.flickeringLights.push({
            light: light,
            mesh: bulbMesh,
            baseIntensity: intensity,
            flickerTimer: Math.random() * 2,
            isOff: false
        });
    }

    update(delta) {
        // Rotate collectible keys and batteries for visual clarity
        this.interactables.forEach(item => {
            if (!item.collected && item.mesh) {
                item.mesh.rotation.y += delta * 1.8;
            }
        });

        // Flickering light logic
        this.flickeringLights.forEach(bulb => {
            bulb.flickerTimer -= delta;
            if (bulb.flickerTimer <= 0) {
                // Occasional dramatic flicker or shutoff
                if (Math.random() < 0.25) {
                    bulb.isOff = true;
                    bulb.light.intensity = 0.05;
                    bulb.mesh.material.color.setHex(0x222222);
                    bulb.flickerTimer = 0.05 + Math.random() * 0.15;
                    if (Math.random() < 0.1 && window.horrorAudio) {
                        window.horrorAudio.playLightFlicker();
                    }
                } else {
                    bulb.isOff = false;
                    bulb.light.intensity = bulb.baseIntensity * (0.85 + Math.random() * 0.3);
                    bulb.mesh.material.color.setHex(bulb.light.color.getHex());
                    bulb.flickerTimer = 0.4 + Math.random() * 2.5;
                }
            }
        });
    }
}
