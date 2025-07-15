

import * as THREE from 'three';
import { FirstPersonCameraController, PlayerController } from './rosieControls.js';
import { World } from './world.js';
import { BlockManager } from './blocks.js';
import { UIManager } from './ui.js';

class MinecraftGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        this.setupRenderer();
        this.setupLighting();
        this.createPlayer();
        this.setupControllers();
        
        this.world = new World(this.scene);
        this.blockManager = new BlockManager(this.scene, this.world);
        this.uiManager = new UIManager(this.blockManager);
        
        this.setupEventListeners();
        this.setupInteraction();
        
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        // Ambient light for soft overall illumination
        const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun) for realistic shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Soft fog for depth
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }

    createPlayer() {
        // Invisible player object for position tracking
        this.player = new THREE.Object3D();
        this.player.position.set(0, 20, 0);
        this.scene.add(this.player);
    }

    setupControllers() {
        this.playerController = new PlayerController(this.player, {
            moveSpeed: 12,
            jumpForce: 15,
            gravity: 30,
            groundLevel: 1.6
        });

        this.firstPersonController = new FirstPersonCameraController(
            this.camera, 
            this.player, 
            this.renderer.domElement,
            {
                eyeHeight: 1.6,
                mouseSensitivity: 0.002
            }
        );

        this.firstPersonController.enable();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    // Hotbar selection
    for (let i = 1; i <= 5; i++) {
        document.addEventListener('keydown', (e) => {
            if (e.code === `Digit${i}`) {
                this.uiManager.setActiveSlot(i - 1);
            }
        });
    }
    // Lock pointer on click
    this.renderer.domElement.addEventListener('click', () => {
        if (document.pointerLockElement !== this.renderer.domElement) {
            this.renderer.domElement.requestPointerLock();
        }
    });
}

    setupInteraction() {
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 10;

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (document.pointerLockElement !== this.renderer.domElement) return;
            
            this.handleBlockInteraction(event.button === 0 ? 'break' : 'place');
        });
    }

    handleBlockInteraction(action) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        for (let intersect of intersects) {
            if (intersect.object.userData.isBlock) {
                if (action === 'break') {
                    this.blockManager.removeBlock(intersect.object.position);
                } else if (action === 'place') {
                    const normal = intersect.face.normal;
                    const placePosition = intersect.object.position.clone().add(normal);
                    this.blockManager.addBlock(placePosition, this.uiManager.getActiveBlockType());
                }
                break;
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update player
        const cameraRotation = this.firstPersonController.update();
        this.playerController.update(deltaTime, cameraRotation);
        
        // Update ground level based on world height
        const worldHeight = this.world.getHeightAt(this.player.position.x, this.player.position.z);
        this.playerController.groundLevel = worldHeight + 1.6;
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
new MinecraftGame();

