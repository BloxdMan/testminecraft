

import * as THREE from 'three';
import { noise } from './utils.js';
export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 32;
        this.voxels = new Map();
        this.generateWorld();
    }
    generateWorld() {
        this.generateTerrain();
        this.generateTrees();
        this.generateWater();
    }
    generateTerrain() {
        const size = 64;
        
        for (let x = -size; x < size; x++) {
            for (let z = -size; z < size; z++) {
                const height = this.getHeightAt(x, z);
                const biome = this.getBiome(x, z, height);
                
                // Generate ground blocks
                for (let y = 0; y <= height; y++) {
                    const block = this.createBlock(x, y, z, biome, y === height);
                    this.scene.add(block);
                    this.setVoxel(x, y, z, block);
                }
            }
        }
    }
    getHeightAt(x, z) {
        let height = 0;
        const scale1 = 0.05, scale2 = 0.1, scale3 = 0.2;
        
        height += noise.perlin2(x * scale1, z * scale1) * 20; // Base terrain
        height += noise.perlin2(x * scale2, z * scale2) * 5;  // Hills
        height += noise.perlin2(x * scale3, z * scale3) * 2;   // Roughness
        
        return Math.floor(height + 10); // Base level
    }
    getBiome(x, z, height) {
        if (height > 25) return 'mountain';
        if (height < 12) return 'water'; // Adjusted water level
        return 'grass';
    }
    createBlock(x, y, z, biome, isTop) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let material;
        if (biome === 'mountain' && isTop && y > 20) {
            material = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Snow
        } else if (biome === 'mountain') {
            material = new THREE.MeshLambertMaterial({ color: 0x666666 }); // Stone
        } else if (biome === 'grass' && isTop) {
            material = new THREE.MeshLambertMaterial({ color: 0x4a9d3f }); // Grass
        } else if (isTop) {
            material = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Dirt top
        } else {
            material = new THREE.MeshLambertMaterial({ color: 0x666666 }); // Stone underneath
        }
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData.isBlock = true;
        
        return block;
    }
    getVoxel(x, y, z) {
        const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        return this.voxels.get(key);
    }
    
    setVoxel(x, y, z, block) {
        const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        this.voxels.set(key, block);
    }
    removeVoxel(x, y, z) {
        const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        this.voxels.delete(key);
    }

    generateTrees() {
        const treeCount = 150;
        
        for (let i = 0; i < treeCount; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            const height = this.getHeightAt(Math.floor(x), Math.floor(z));
            const biome = this.getBiome(x, z, height);
            
            if (biome === 'grass' && Math.random() < 0.8) {
                this.createTree(x, height + 1, z);
            }
        }
    }

    createTree(x, y, z) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c17 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, y + 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Tree leaves
        const leavesGeometry = new THREE.SphereGeometry(2.5, 8, 6);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, y + 5, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
    }

    generateWater() {
        const waterPools = 8;
        
        for (let i = 0; i < waterPools; i++) {
            const centerX = (Math.random() - 0.5) * 80;
            const centerZ = (Math.random() - 0.5) * 80;
            const radius = 3 + Math.random() * 4;
            
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                for (let z = centerZ - radius; z <= centerZ + radius; z++) {
                    const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
                    if (distance <= radius) {
                        const height = this.getHeightAt(Math.floor(x), Math.floor(z));
                        if (height < 15) { // Only create water in lower areas
                            this.createWater(Math.floor(x), height + 1, Math.floor(z));
                        }
                    }
                }
            }
        }
    }

    createWater(x, y, z) {
        const geometry = new THREE.BoxGeometry(1, 0.8, 1);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x4169e1,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(geometry, material);
        water.position.set(x, y - 0.1, z);
        this.scene.add(water);
        this.setVoxel(x, y, z, water);
    }
}

