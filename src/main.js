import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { marked } from 'marked';

const resumeAnchor = document.querySelector('#resume-anchor');

function splitMarkdownSections(markdown) {
  const sections = [];
  const lines = markdown.split(/\r?\n/);
  let currentTitle = '';
  let currentBody = [];

  const flush = () => {
    if (!currentTitle && currentBody.length === 0) {
      return;
    }

    sections.push({
      title: currentTitle.trim(),
      body: currentBody.join('\n').trim(),
    });
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^##\s+(.*)$/);
    const titleMatch = line.match(/^#\s+(.*)$/);

    if (headingMatch) {
      flush();
      currentTitle = headingMatch[1].trim();
      currentBody = [];
      return;
    }

    if (titleMatch && sections.length === 0 && !currentTitle) {
      currentTitle = titleMatch[1].trim();
      currentBody = [];
      return;
    }

    if (currentTitle || line.trim()) {
      currentBody.push(line);
    }
  });

  flush();
  return sections.filter((section) => section.title || section.body);
}

if (resumeAnchor) {
  fetch('./resume_2026.md')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to load resume markdown');
      }
      return response.text();
    })
    .then((markdown) => {
      const sections = splitMarkdownSections(markdown);
      const markup = sections
        .map((section, index) => {
          const sideClass = index % 2 === 0 ? 'resume-section--left' : 'resume-section--right';
          const titleHtml = section.title ? `<h2>${section.title}</h2>` : '';
          const bodyHtml = marked.parse(section.body || '');
          return `<section class="resume-section ${sideClass}">${titleHtml}${bodyHtml}</section>`;
        })
        .join('');

      resumeAnchor.insertAdjacentHTML('beforebegin', markup);
      resumeAnchor.remove();
    })
    .catch((error) => {
      console.error(error);
      resumeAnchor.insertAdjacentHTML('beforebegin', '<p>Unable to load resume content.</p>');
      resumeAnchor.remove();
    });
}

// Setup

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
camera.position.setX(-3);

renderer.render(scene, camera);

// Fancy centerpiece

const geometry = new THREE.TorusKnotGeometry(3.1, 0.9, 220, 20);
const positionAttribute = geometry.attributes.position;
const colors = [];
const blue = new THREE.Color(0x3b82f6);
const purple = new THREE.Color(0x8b5cf6);
const green = new THREE.Color(0x22c55e);

for (let i = 0; i < positionAttribute.count; i += 1) {
  const y = positionAttribute.getY(i);
  const t = THREE.MathUtils.clamp((y + 2.6) / 5.2, 0, 1);
  const color = new THREE.Color();

  if (t < 0.5) {
    color.lerpColors(blue, purple, t * 2);
  } else {
    color.lerpColors(purple, green, (t - 0.5) * 2);
  }

  colors.push(color.r, color.g, color.b);
}

geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
geometry.computeVertexNormals();

const material = new THREE.MeshStandardMaterial({
  vertexColors: true,
  emissive: 0x101a2f,
  emissiveIntensity: 0.25,
  roughness: 0.25,
  metalness: 0.7,
});
const fancyShape = new THREE.Mesh(geometry, material);
fancyShape.position.set(-5, 0, -10);

scene.add(fancyShape);

// Lights

const ambientLight = new THREE.AmbientLight(0x2a2a4a, 0.45);

const pointLight = new THREE.PointLight(0xffffff, 2.2, 100);
pointLight.position.set(12, 10, 8);

const fillLight = new THREE.PointLight(0x4f46e5, 1.2, 100);
fillLight.position.set(-10, -5, 12);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(8, 15, 20);

scene.add(ambientLight, pointLight, fillLight, directionalLight);

// Helpers

// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper)

// const controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.1,
  });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(500));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(1000).fill().forEach(addStar);

// Background

const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

// Avatar

const chrisTexture = new THREE.TextureLoader().load('chris_professional_profile.png');

const chris = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshBasicMaterial({
    map: chrisTexture,
    color: new THREE.Color(0.6, 0.6, 0.6),
  })
);

scene.add(chris);

// Moon

const moonTexture = new THREE.TextureLoader().load('moon.jpg');
const normalTexture = new THREE.TextureLoader().load('normal.jpg');

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture,
  })
);

scene.add(moon);

moon.position.z = 30;
moon.position.setX(-10);

chris.position.z = -5;
chris.position.x = 2;

// Scroll Animation

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  moon.rotation.x += 0.05;
  moon.rotation.y += 0.075;
  moon.rotation.z += 0.05;

  chris.rotation.y += 0.01;
//  chris.rotation.z += 0.01;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop

function animate() {
  requestAnimationFrame(animate);

  fancyShape.rotation.x += 0.01;
  fancyShape.rotation.y += 0.008;
  fancyShape.rotation.z += 0.012;

  moon.rotation.x += 0.005;

  // controls.update();

  renderer.render(scene, camera);
}

animate();