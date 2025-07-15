

import * as THREE from 'three';

export class BlockManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.blockTypes = {
            grass: { color: 0x4a9d3f, name: 'Grass' },
            stone: { color: 0x666666, name: 'Stone' },
            wood: { color: 0x4a2c17, name: 'Wood' },
            dirt: { color: 0x8b4513, name: 'Dirt' },
            water: { color: 0x4169e1, name: 'Water', transparent: true, opacity: 0.8 }
        };
    }

    addBlock(position, blockType) {
        // Check if position is already occupied
        const existingBlock = this.getBlockAt(position);
        if (existingBlock) return;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const blockData = this.blockTypes[blockType];
        
        const materialProperties = {
            color: blockData.color
        };
        
        if (blockData.transparent) {
            materialProperties.transparent = true;
            materialProperties.opacity = blockData.opacity;
        }
        
        const material = new THREE.MeshLambertMaterial(materialProperties);
        const block = new THREE.Mesh(geometry, material);
        
        block.position.copy(position);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData.isBlock = true;
        block.userData.blockType = blockType;
        
        this.scene.add(block);
        this.world.setVoxel(position.x, position.y, position.z, block);
        
        // Add particle effect
        this.createPlaceEffect(position);
    }
    removeBlock(position) {
        const block = this.getBlockAt(position);
        if (block) {
            this.scene.remove(block);
            this.world.removeVoxel(position.x, position.y, position.z);
            this.createBreakEffect(position, block.userData.blockType);
        }
    }

    getBlockAt(position) {
        const tolerance = 0.1;
        return this.scene.children.find(child => 
            child.userData.isBlock &&
            Math.abs(child.position.x - position.x) < tolerance &&
            Math.abs(child.position.y - position.y) < tolerance &&
            Math.abs(child.position.z - position.z) < tolerance
        );
    }

    createPlaceEffect(position) {
        const particles = new THREE.Group();
        
        for (let i = 0; i < 5; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            ));
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animate and cleanup particles
        setTimeout(() => {
            this.scene.remove(particles);
        }, 500);
    }

    createBreakEffect(position, blockType) {
        const blockData = this.blockTypes[blockType] || this.blockTypes.stone;
        const particles = new THREE.Group();
        
        for (let i = 0; i < 8; i++) {
            const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: blockData.color
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            particle.userData.velocity = velocity;
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            particles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                particle.userData.velocity.y -= 0.01; // Gravity
                particle.material.opacity -= 0.02;
            });
            
            if (particles.children[0] && particles.children[0].material.opacity > 0) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
            }
        };
        
        animateParticles();
    }
}

