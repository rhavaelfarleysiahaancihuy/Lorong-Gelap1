/**
 * Main Game State Manager for "Lorong Gelap"
 * Coordinates Three.js render loop, HUD updates, victory & game over sequences, and menu transitions.
 */
class HorrorGame {
    constructor() {
        this.state = 'menu'; // 'menu', 'playing', 'gameover', 'victory'
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.map = null;
        this.player = null;
        this.monster = null;

        this.gameStartTime = 0;
        this.escapeTime = 0;

        this.initDOM();
        this.initThree();
    }

    initDOM() {
        this.hud = document.getElementById('hud');
        this.crosshair = document.getElementById('crosshair');
        this.interactionPrompt = document.getElementById('interaction-prompt');
        this.promptText = document.getElementById('prompt-text');
        this.keysLabel = document.getElementById('keys-label');
        this.batteryBar = document.getElementById('battery-bar');
        this.batteryPercent = document.getElementById('battery-percent');
        this.staminaBar = document.getElementById('stamina-bar');
        this.notification = document.getElementById('notification');
        this.jumpscareOverlay = document.getElementById('jumpscare-overlay');

        // Modals
        this.mainMenu = document.getElementById('main-menu');
        this.instructionsModal = document.getElementById('instructions-modal');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.victoryScreen = document.getElementById('victory-screen');

        this.bindEvents();
    }

    initThree() {
        const container = document.getElementById('canvas-container');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a12);

        // Atmospheric Fog - Balanced so player can see rooms and corridors clearly
        this.scene.fog = new THREE.FogExp2(0x0a0a12, 0.035);

        // Camera
        this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 100);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;

        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => this.onWindowResize());

        // Build Level Map
        this.map = new HorrorMap(this.scene);

        // Build Player
        this.player = new HorrorPlayer(this.camera, this.scene, this.map);

        // Build AI Monster
        this.monster = new HorrorMonster(this.scene, this.player, this.map);

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    bindEvents() {
        // Main Menu buttons
        document.getElementById('play-btn').addEventListener('click', () => this.startGame());
        document.getElementById('instructions-btn').addEventListener('click', () => {
            this.mainMenu.style.display = 'none';
            this.instructionsModal.style.display = 'flex';
        });
        document.getElementById('back-btn').addEventListener('click', () => {
            this.instructionsModal.style.display = 'none';
            this.mainMenu.style.display = 'flex';
        });

        // Game Over buttons
        document.getElementById('retry-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('gameover-menu-btn').addEventListener('click', () => this.returnToMenu());

        // Victory buttons
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('victory-menu-btn').addEventListener('click', () => this.returnToMenu());

        // Pointer lock hint element
        const lockHint = document.getElementById('lock-hint');
        if (lockHint) {
            lockHint.addEventListener('click', () => {
                document.body.requestPointerLock();
            });
        }

        // Pointer lock change listener
        document.addEventListener('pointerlockchange', () => {
            if (this.state === 'playing') {
                if (document.pointerLockElement === document.body) {
                    if (lockHint) lockHint.style.display = 'none';
                } else {
                    if (lockHint) lockHint.style.display = 'block';
                }
            } else {
                if (lockHint) lockHint.style.display = 'none';
            }
        });

        document.body.addEventListener('click', (e) => {
            // If clicking buttons, let them handle it
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

            if (this.state === 'playing' && document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });
    }

    startGame() {
        window.horrorAudio.init();
        window.horrorAudio.resume();

        this.mainMenu.style.display = 'none';
        this.instructionsModal.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.victoryScreen.style.display = 'none';
        this.hud.style.display = 'block';

        this.state = 'playing';
        this.gameStartTime = performance.now();

        // Request Pointer Lock for mouse controls
        document.body.requestPointerLock();

        this.showNotification("Find 3 keys and escape the building.");
    }

    restartGame() {
        // Clean old scene items and rebuild map/player/monster
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        this.map = new HorrorMap(this.scene);
        this.player = new HorrorPlayer(this.camera, this.scene, this.map);
        this.monster = new HorrorMonster(this.scene, this.player, this.map);

        this.updateKeyUI();

        const dangerOverlay = document.getElementById('danger-overlay');
        if (dangerOverlay) dangerOverlay.style.opacity = '0';

        this.jumpscareOverlay.style.display = 'none';

        this.startGame();
    }

    returnToMenu() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }

        this.state = 'menu';
        this.hud.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.victoryScreen.style.display = 'none';
        this.jumpscareOverlay.style.display = 'none';
        this.mainMenu.style.display = 'flex';

        const dangerOverlay = document.getElementById('danger-overlay');
        if (dangerOverlay) dangerOverlay.style.opacity = '0';
    }

    updateKeyUI() {
        const count = this.map.keysCollected;
        this.keysLabel.textContent = `Keys: ${count}/3`;

        for (let i = 1; i <= 3; i++) {
            const icon = document.getElementById(`key-${i}`);
            if (icon) {
                if (i <= count) {
                    icon.classList.add('collected');
                } else {
                    icon.classList.remove('collected');
                }
            }
        }
    }

    updateInteractionPrompt(item) {
        if (!item) {
            this.interactionPrompt.style.display = 'none';
            this.crosshair.classList.remove('interactable');
            return;
        }

        this.crosshair.classList.add('interactable');
        this.interactionPrompt.style.display = 'block';

        if (item.type === 'key') {
            this.promptText.textContent = `Pick up ${item.name}`;
        } else if (item.type === 'battery') {
            this.promptText.textContent = `Pick up ${item.name}`;
        } else if (item.type === 'exit') {
            if (this.map.keysCollected >= 3) {
                this.promptText.textContent = "Unlock Exit Door (Escape)";
            } else {
                this.promptText.textContent = `Exit Door (Requires 3 Keys - ${this.map.keysCollected}/3)`;
            }
        }
    }

    showNotification(msg) {
        this.notification.textContent = msg;
        this.notification.classList.add('show');
        clearTimeout(this.notifTimeout);
        this.notifTimeout = setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3200);
    }

    triggerGameOver() {
        if (this.state !== 'playing') return;
        this.state = 'gameover';

        if (document.exitPointerLock) {
            document.exitPointerLock();
        }

        // Play violent jumpscare sound
        window.horrorAudio.playJumpscare();

        // Snap camera directly onto the monster's face
        const lookDir = this.monster.position.clone().add(new THREE.Vector3(0, 2.2, 0)).sub(this.player.camera.position);
        this.player.camera.lookAt(this.monster.position.clone().add(new THREE.Vector3(0, 2.2, 0)));

        // Show violent jumpscare twitch overlay
        this.jumpscareOverlay.style.display = 'flex';

        // After 1.4s jumpscare shock, show the Game Over screen
        setTimeout(() => {
            this.jumpscareOverlay.style.display = 'none';
            this.hud.style.display = 'none';
            this.gameOverScreen.style.display = 'flex';
        }, 1400);
    }

    triggerVictory() {
        if (this.state !== 'playing') return;
        this.state = 'victory';

        this.escapeTime = Math.round((performance.now() - this.gameStartTime) / 1000);

        if (document.exitPointerLock) {
            document.exitPointerLock();
        }

        window.horrorAudio.playDoorUnlock();
        setTimeout(() => {
            window.horrorAudio.playVictory();
        }, 500);

        this.hud.style.display = 'none';

        // Populate escape stats
        const minutes = Math.floor(this.escapeTime / 60);
        const seconds = this.escapeTime % 60;
        const timeStr = `${minutes}m ${seconds}s`;
        document.getElementById('escape-time').textContent = `Time Survived: ${timeStr}`;

        this.victoryScreen.style.display = 'flex';
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate);

        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (this.state === 'playing') {
            // Update components
            this.player.update(delta);
            this.monster.update(delta);
            this.map.update(delta);

            // Update dramatic horror audio system (ambient music, whispers, music box)
            window.horrorAudio.update(delta);

            // Update UI bars
            const batPct = Math.round(this.player.battery);
            this.batteryBar.style.width = `${batPct}%`;
            this.batteryPercent.textContent = `${batPct}%`;
            if (batPct <= 20) {
                this.batteryBar.classList.add('low');
            } else {
                this.batteryBar.classList.remove('low');
            }

            const stamPct = Math.round(this.player.stamina);
            this.staminaBar.style.width = `${stamPct}%`;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Instantiate global game once DOM loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new HorrorGame();
});
