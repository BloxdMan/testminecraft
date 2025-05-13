
const loader = new THREE.TextureLoader();
const texture = loader.load('medua/terrain.png');
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;

function getUVs(tileX, tileY) {
    const tileCount = 16;
    const tileSize = 1 / tileCount;
    const x = tileX * tileSize;
    const y = 1 - (tileY + 1) * tileSize;
    return [
        x, y + tileSize,
        x + tileSize, y + tileSize,
        x + tileSize, y,
        x, y
    ];
}

function createBlock(type) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const uvs = geometry.attributes.uv.array;
    
    let [tileX, tileY] = ((15, 15));
    switch(type) {
        case 'grass':
            tileX = 0;
            tileY = 0;
            break;
        case 'dirt':
            tileX = 2;
            tileY = 0;
            break;
        case 'stone':
            tileX = 1;
            tileY = 0;
            break;
        case 'sand':
            tileX = 2;
            tileY = 1;
            break;
        case 'wood':
            tileX = 4;
            tileY = 1;
            break;
        case 'leaves':
            tileX = 4;
            tileY = 3;
            break;
        case 'water':
            tileX = 14;
            tileY = 0;
            break;
        case 'lava':
            tileX = 14;
            tileY = 1;
            break;
        case 'glass':
            tileX = 1;
            tileY = 3;
            break;
        case 'default':
            tileX = 15;
            tileY = 15;
            break;
    }

    const uv = getUVs(tileX, tileY);

    // Set UVs for each face of the cube (6 sides * 4 vertices)
    for (let i = 0; i < 6; i++) {
        geometry.attributes.uv.setXY(i * 4 + 0, uv[0], uv[1]);
        geometry.attributes.uv.setXY(i * 4 + 1, uv[2], uv[3]);
        geometry.attributes.uv.setXY(i * 4 + 2, uv[4], uv[5]);
        geometry.attributes.uv.setXY(i * 4 + 3, uv[6], uv[7]);
    }

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    return cube;
}
