import { IcosahedronScene } from './icosahedron-scene.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    if (container) {
        new IcosahedronScene(container);
    } else {
        console.error('Canvas container not found');
    }
});
