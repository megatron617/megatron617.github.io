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
  fetch('./resume_new.md')
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

// Torus

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
const torus = new THREE.Mesh(geometry, material);

scene.add(torus);

// Lights

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Helpers

// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper)

// const controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(200).fill().forEach(addStar);

// Background

const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

// Avatar

const chrisTexture = new THREE.TextureLoader().load('chris.png');

const chris = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ map: chrisTexture }));

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
  chris.rotation.z += 0.01;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop

function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  moon.rotation.x += 0.005;

  // controls.update();

  renderer.render(scene, camera);
}

animate();