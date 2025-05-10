import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controls setup
let orbitControls = new OrbitControls(camera, renderer.domElement);
let pointerControls = new PointerLockControls(camera, document.body);
let activeControls = orbitControls;
let isFirstPerson = false;
let velocity = new THREE.Vector3();
let moveSpeed = 0;
const MAX_SPEED = 50;

// Movement state
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    rollLeft: false,
    rollRight: false
};

// Create procedural textures
function createSunTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#fff7e6');
    gradient.addColorStop(0.2, '#ffcc00');
    gradient.addColorStop(0.4, '#ff9900');
    gradient.addColorStop(1, '#ff4d00');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createPlanetTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base color
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise
    for (let i = 0; i < 10000; i++) {
        ctx.fillStyle = color2;
        ctx.globalAlpha = Math.random() * 0.2;
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 4;
        ctx.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x666666);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 3.5);
scene.add(sunLight);

const secondaryLight = new THREE.PointLight(0xffffff, 1);
secondaryLight.position.set(100, 100, 100);
scene.add(secondaryLight);

// Stars background
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for(let i = 0; i < 15000; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 1.2,
    transparent: true,
    opacity: 0.8
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Space dust
const dustGeometry = new THREE.BufferGeometry();
const dustVertices = [];
for(let i = 0; i < 5000; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    dustVertices.push(x, y, z);
}
dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustVertices, 3));
const dustMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 3,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
});
const spaceDust = new THREE.Points(dustGeometry, dustMaterial);
scene.add(spaceDust);

// Asteroid belt
const asteroidBelt = new THREE.Group();
const ASTEROID_COUNT = 1000;
const BELT_RADIUS = 85;
const BELT_WIDTH = 15;

const asteroidGeometry = new THREE.IcosahedronGeometry(1, 0);
const asteroidMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888,
    flatShading: true
});

for(let i = 0; i < ASTEROID_COUNT; i++) {
    const angle = (i / ASTEROID_COUNT) * Math.PI * 2;
    const radius = BELT_RADIUS + THREE.MathUtils.randFloatSpread(BELT_WIDTH);
    const size = 0.1 + Math.random() * 0.3;
    
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.scale.set(size, size, size);
    asteroid.position.x = Math.cos(angle) * radius;
    asteroid.position.z = Math.sin(angle) * radius;
    asteroid.position.y = THREE.MathUtils.randFloatSpread(BELT_WIDTH);
    asteroid.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    
    asteroidBelt.add(asteroid);
}
scene.add(asteroidBelt);

// Planet data
const planets = [
    {
        name: 'Sun',
        radius: 12,
        distance: 0,
        color: 0xffffff,
        emissive: true,
        period: 0,
        texture: createSunTexture(),
        glowIntensity: 0.8,
        realDiameter: 1392684
    },
    {
        name: 'Mercury',
        radius: 2,
        distance: 25,
        color: 0xffffff,
        period: 88,
        texture: createPlanetTexture('#a67f59', '#8b4513'),
        realDiameter: 4879
    },
    {
        name: 'Venus',
        radius: 2.8,
        distance: 40,
        color: 0xffffff,
        period: 225,
        texture: createPlanetTexture('#d4b16a', '#b3814d'),
        realDiameter: 12104
    },
    {
        name: 'Earth',
        radius: 3,
        distance: 55,
        color: 0xffffff,
        period: 365.25,
        texture: createPlanetTexture('#4b6cb7', '#182848'),
        realDiameter: 12742
    },
    {
        name: 'Mars',
        radius: 2.5,
        distance: 70,
        color: 0xffffff,
        period: 687,
        texture: createPlanetTexture('#c1440e', '#8b0000'),
        realDiameter: 6779
    },
    {
        name: 'Jupiter',
        radius: 6,
        distance: 95,
        color: 0xffffff,
        period: 4333,
        texture: createPlanetTexture('#d8b08c', '#a67c52'),
        realDiameter: 139820
    },
    {
        name: 'Saturn',
        radius: 5,
        distance: 120,
        color: 0xffffff,
        period: 10759,
        texture: createPlanetTexture('#f4d03f', '#d4ac0d'),
        hasRings: true,
        realDiameter: 116460
    },
    {
        name: 'Uranus',
        radius: 4,
        distance: 150,
        color: 0xffffff,
        period: 30687,
        texture: createPlanetTexture('#aed6f1', '#5dade2'),
        realDiameter: 50724
    },
    {
        name: 'Neptune',
        radius: 4,
        distance: 180,
        color: 0xffffff,
        period: 60190,
        texture: createPlanetTexture('#2e86c1', '#1a5276'),
        realDiameter: 49244
    }
];

const planetObjects = [];
const orbitLines = [];
const planetColliders = [];

// Create planets
planets.forEach((data, index) => {
    // Create orbit lines
    if (index > 0) {
        const orbitGeometry = new THREE.RingGeometry(data.distance, data.distance + 0.2, 128);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);
        orbitLines.push(orbit);
    }

    // Create planet
    const geometry = new THREE.SphereGeometry(data.radius, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        map: data.texture,
        shininess: 25
    });

    if (data.emissive) {
        material.emissiveMap = data.texture;
        material.emissive = new THREE.Color(0xffff80);
        material.emissiveIntensity = 0.8;
    }

    const planet = new THREE.Mesh(geometry, material);
    planet.userData = data;

    // Add Saturn rings
    if (data.hasRings) {
        const ringGeometry = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.4, 128);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xd4ac0d,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        planet.add(rings);
    }

    // Position planet
    const planetGroup = new THREE.Group();
    planet.position.x = data.distance;
    planetGroup.add(planet);
    scene.add(planetGroup);

    // Add collision sphere
    const colliderGeometry = new THREE.SphereGeometry(data.radius + 1);
    const colliderMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
    collider.position.copy(planet.position);
    planetColliders.push(collider);
    scene.add(collider);

    // Calculate speeds
    const mercuryTime = 7;
    const baseSpeed = (2 * Math.PI) / (mercuryTime * 60);
    const speedFactor = data.period > 0 ? baseSpeed * (88 / data.period) : 0;

    planetObjects.push({
        mesh: planet,
        group: planetGroup,
        collider: collider,
        rotationSpeed: 0.02,
        orbitSpeed: speedFactor
    });
});

// Camera initial position
camera.position.set(0, 30, 100);
orbitControls.update();

// UI Elements
const speedSlider = document.getElementById('speedSlider');
const timeValue = document.getElementById('timeValue');
const toggleViewBtn = document.getElementById('toggleView');
const toggleOrbitsBtn = document.getElementById('toggleOrbits');
const toggleRotationBtn = document.getElementById('toggleRotation');
const resetCameraBtn = document.getElementById('resetCamera');
const showControlsBtn = document.getElementById('showControls');
const closeControlsBtn = document.getElementById('closeControls');
const controlsHelp = document.getElementById('controls-help');
const planetInfo = document.getElementById('planetInfo');

let timeScale = 1;
let rotationEnabled = true;

// Event handlers
speedSlider.addEventListener('input', (e) => {
    timeScale = parseInt(e.target.value);
    timeValue.textContent = timeScale + 'x';
});

toggleViewBtn.addEventListener('click', () => {
    isFirstPerson = !isFirstPerson;
    if (isFirstPerson) {
        orbitControls.enabled = false;
        pointerControls.lock();
        document.getElementById('speedometer').style.display = 'block';
        toggleViewBtn.textContent = 'Switch to Orbit View';
    } else {
        pointerControls.unlock();
        orbitControls.enabled = true;
        document.getElementById('speedometer').style.display = 'none';
        toggleViewBtn.textContent = 'Switch to First Person';
    }
});

toggleOrbitsBtn.addEventListener('click', () => {
    orbitLines.forEach(orbit => orbit.visible = !orbit.visible);
});

toggleRotationBtn.addEventListener('click', () => {
    rotationEnabled = !rotationEnabled;
    toggleRotationBtn.textContent = rotationEnabled ? 'stop rotation' : 'start rotation';
});

resetCameraBtn.addEventListener('click', () => {
    if (isFirstPerson) {
        camera.position.set(0, 30, 100);
        camera.lookAt(0, 0, 0);
    } else {
        camera.position.set(0, 30, 100);
        orbitControls.target.set(0, 0, 0);
        orbitControls.update();
    }
});

showControlsBtn.addEventListener('click', () => {
    controlsHelp.classList.add('visible');
});

closeControlsBtn.addEventListener('click', () => {
    controlsHelp.classList.remove('visible');
});

// Planet interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
    if (isFirstPerson) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
        planetObjects.map(obj => obj.mesh)
    );

    if (intersects.length > 0) {
        const planet
