import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/src/loaders/TextureLoader.js';
import { mix } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/webgpu/mix.js';
import { TechnicolorShader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/shaders/TechnicolorShader.js'; 
import { removeChildElements } from 'https://cdn.jsdelivr.net/npm/@finsweet/ts-utils@1.0.0/dist/index.min.js';

window.Webflow ||= [];
window.Webflow.push(() => {
  init3D();
});

// Init Function
function init3D() {
  // select container
  const viewport = document.querySelector('[data-3d="c"]');

  // create scene, renderer, and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  viewport.appendChild(renderer.domElement);

  // add controls
  const controls = new OrbitControls(camera, document.body);
  camera.position.z = 100;

  let neckBone = null;
  let clock = new THREE.Clock();
  let mixer = null;

  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Adding lights
  let dirLight;

  function addLight() {
    const ambLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(1, 1, 0.5);
    scene.add(dirLight);
  }

  addLight();

  function animate() {
    window.requestAnimationFrame(animate);
    controls.update();

    // controlling light position with mouse
    dirLight.position.x = mouse.x * 1;
    dirLight.position.y = mouse.y * 1;

    renderer.render(scene, camera);
  }

  const ob = {
    zmajca: null,
    mmajca: null,
    pivskikozarec: null,
    salca: null,
  };

  animate();

  // --- load 3D async
  const assets = load();
  assets.then((data) => {
    const objects = data.objects.scene;
    const animations = data.objects.animations;

    objects.traverse((child) => {
      if (child.isMesh) {
        if (child.name === 'zmajca') {
          ob.zmajca = child;
          ob.zmajca.visible = false;
        } else if (child.name === 'mmajca') {
          ob.mmajca = child;
          ob.mmajca.visible = false;
        } else if (child.name === 'pivski_kozarec') {
          ob.pivskikozarec = child;
          ob.pivskikozarec.visible = false;
        } else if (child.name === 'salca') {
          ob.salca = child;
          ob.salca.visible = false;
        }

        child.material = new THREE.MeshStandardMaterial({
          transparent: false,
        });

        child.material.map = data.texture;
      }
    });

    scene.add(objects);
    initStore();
  });

  // Store Setup
  function initStore() {
    const shirts = [...document.querySelectorAll('[data-3d-shirt]')];
    shirts.forEach((shirt, i) => {
      const image = shirt.src;
      const color = shirt.getAttribute('data-3d-shirt');
      const trigger = shirt.parentElement;

      trigger.onclick = () => changeShirt(image, color); 
      if (i === 0) {
        changeShirt(image, color);
      }
    });

    const navItems = [...document.querySelectorAll('[data-3d-nav]')];
    navItems.forEach((item) => {
      item.onclick = () => {
        const name = item.getAttribute('data-3d-nav');
        if (name === 'zmajca') {
          ob.zmajca.visible = true;
          ob.mmajca.visible = false;
          ob.pivskikozarec.visible = false;
          ob.salca.visible = false;
        } else if (name === 'mmajca') {
          ob.zmajca.visible = false;
          ob.mmajca.visible = true;
          ob.pivskikozarec.visible = false;
          ob.salca.visible = false;
        } else if (name === 'pivskikozarec') {
          ob.zmajca.visible = false;
          ob.mmajca.visible = false;
          ob.pivskikozarec.visible = true;
          ob.salca.visible = false;
        } else if (name === 'salca') {
          ob.zmajca.visible = false;
          ob.mmajca.visible = false;
          ob.pivskikozarec.visible = false;
          ob.salca.visible = true;
        }
      };
    });
  }

  async function changeShirt(image, color) {
    const texture = await loadTexture(image);
    ob.zmajca.material.map = texture;
    ob.zmajca.visible = true;
  }
}

/* Loader Functions */
async function load() {
  const objects = await loadModel(
    'https://cdn.prod.website-files.com/6729eb87cfb6a5c0fb028478/67585accc532b1eac36ce515_skupaj.txt'
  );

  const texture = await loadTexture(
    'https://cdn.prod.website-files.com/671b5aa1d031cdfe984c73ee/6723aa41d98aa73cfeda5400_uv-layout.jpg'
  );

  return { objects, texture };
}

const textureLoader = new TextureLoader();
const modelLoader = new GLTFLoader();

function loadTexture(url) {
  return new Promise((resolve) => {
    textureLoader.load(url, (data) => {
      data.needsUpdate = true;
      data.flipY = false;
      resolve(data); 
    });
  });
}

function loadModel(url, id) {
  return new Promise((resolve, reject) => {
    modelLoader.load(url, (gltf) => {
      const scene = gltf.scene;
      const animations = gltf.animations;
      resolve({scene, animations});
    });
  });
}
