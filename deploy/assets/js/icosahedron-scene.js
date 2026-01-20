import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class IcosahedronScene {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        console.log("Icosahedron Scene Initialized");

        this.initScene();
        this.initGeometry();
        this.initControls();
        this.handleResize();
        this.animate();
    }

    initScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05060f); // Dark background matching project theme

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.z = 5;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }

    initGeometry() {
        // Icosahedron: 12 vertices, 20 faces, 30 edges
        const radius = 1.5;
        const detail = 0; // 0 = standard icosahedron
        const geometry = new THREE.IcosahedronGeometry(radius, detail);

        // Convert to Wireframe Geometry to get the specific lattice look
        // WireframeGeometry renders all edges, unlike basic wireframe: true on material which renders triangles
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);

        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1, // Note: WebGL rendering implementation limits linewidth to 1 on most modern browsers
            opacity: 1,
            transparent: false
        });

        // Create the lattice object (LineSegments)
        this.icosahedron = new THREE.LineSegments(wireframeGeometry, material);
        this.scene.add(this.icosahedron);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.autoRotate = false; // User controls rotation
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (!this.container) return;
            
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls for damping
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}
