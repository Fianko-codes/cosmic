import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let planets = [];
let rotationSpeed = 1;
let orbitsVisible = true;

init();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 2);
    scene.add(pointLight);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Planets
    const planetData = [
        { radius: 1, distance: 10, color: 0x888888 },  // Mercury
        { radius: 1.5, distance: 15, color: 0xffa500 }, // Venus
        { radius: 2, distance: 20, color: 0x0000ff },   // Earth
        { radius: 1.2, distance: 25, color: 0xff0000 }  // Mars
    ];

    planetData.forEach(data => {
        // Planet
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: data.color });
        const planet = new THREE.Mesh(geometry, material);
        
        // Orbit
        const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            opacity: 0.2,
            transparent: true
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        
        // Group for rotation
        const group = new THREE.Group();
        planet.position.x = data.distance;
        group.add(planet);
        scene.add(group);
        scene.add(orbit);
        
        planets.push({ mesh: planet, group: group, orbit: orbit });
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function animate() {
    requestAnimationFrame(animate);
    
    planets.forEach((planet, index) => {
        if (rotationSpeed > 0) {
            planet.group.rotation.y += (0.02 / (index + 1)) * rotationSpeed;
        }
    });
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Make functions global for HTML buttons
window.toggleOrbits = function() {
    orbitsVisible = !orbitsVisible;
    planets.forEach(planet => {
        planet.orbit.visible = orbitsVisible;
    });
}

window.toggleRotation = function() {
    rotationSpeed = rotationSpeed > 0 ? 0 : 1;
}

window.updateSpeed = function(value) {
    rotationSpeed = parseFloat(value);
}
