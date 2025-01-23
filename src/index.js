import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';
import { mix } from 'three/webgpu';
import { TechnicolorShader } from 'three/examples/jsm/Addons.js';
import { removeChildElements } from '@finsweet/ts-utils';

window.Webflow ||= [];
window.Webflow.push(() => {
  //console.log('hello');
  init3D();
});

// Init Function
function init3D() {
  // select container
  const viewport = document.querySelector('[data-3d="c"]');
  // console.log(viewport);

  // create scened and renderer and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  viewport.appendChild(renderer.domElement);

  // add an object
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshNormalMaterial();
  const cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  // add controls
  //const controls = new OrbitControls(camera, renderer.domElement);
  const controls = new OrbitControls(camera, document.body);


  camera.position.z = 100;

    //declaring hte bone outside the load
    let neckBone = null;
    let clock = new THREE.Clock();
    let mixer = null;

    const mouse = {
      x: 0,
      y: 0,
    }

    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;  
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; 
      
      //console.log(mouse.x);
    })

  //adding lights outside
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

    //controlling light position with mouse
    dirLight.position.x = mouse.x * 1; 
    dirLight.position.y = mouse.y * 1;

    if (ob.tshirt) ob.tshirt.rotation.y += 0.01;


    renderer.render(scene, camera);
  }


  const ob = {
    zmajca: null,
    mmajca: null,
    pivskikozarec: null,
    salca: null,
  };

  animate();



  // --- load 3d async
  const assets = load();
  assets.then((data) => {
    //console.log(data, data.objects);
    const objects = data.objects.scene;
    const animations = data.objects.animations;

    //console.log(animations);

    objects.traverse((child) => {
      //console.log(child);
      if (child.isMesh) {
        if (child.name === 'zmajca') {
          ob.zmajca = child;
          ob.zmajca.visible = false;
        } else if (child.name === 'mmajca') {
          ob.mmajca = child;
          ob.mmajca.visible = false;
          // ob.cap.position.x = 2;
        } else if (child.name === 'pivski_kozarec') {
          ob.pivskikozarec = child;
          ob.pivskikozarec.visible = false;
          // ob.mug.position.x = -2;
        } else if (child.name === 'salca') {
          ob.salca = child;
          ob.salca.visible = false;
          // ob.mug.position.x = -2;
        }

        //console.log(child.name);

        child.material = new THREE.MeshStandardMaterial({
          //color: 0xff0000,      //color
          transparent: false,
        });

        child.material.map = data.texture;
      }
    });

    //objects.position.y = -1;
    scene.add(objects);

    //console.log(ob);

    initStore();
  });

  // ---------------Store Setup

  function initStore() {
    const shirts = [...document.querySelectorAll('[data-3d-shirt]')];
    //console.log(shirts);

    shirts.forEach((shirt, i) => {
      const image = shirt.src;
      const color = shirt.getAttribute('data-3d-shirt');
      const trigger = shirt.parentElement;
      //console.log(image, color, trigger);
      
      trigger.onclick = () => changeShirt(image, color); 
      if(i == 0 ) {
        changeShirt(image, color);
      }
    });

    //----------------------------Listen to different NAV items
    const navItems = [...document.querySelectorAll('[data-3d-nav]')];
    console.log(navItems);

    navItems.forEach((item) => {
      item.onclick = () => {
        const name = item.getAttribute('data-3d-nav');
        console.log(name);
        
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

    //console.log(texture);
  }

}

/* Loader Functions */
async function load() {
  const objects = await loadModel(
    'https://cdn.prod.website-files.com/6729eb87cfb6a5c0fb028478/67585accc532b1eac36ce515_skupaj.txt' //vsi objekti skupaj: mmajca, zmajca, pivski kozarec, salca 
    //'https://cdn.prod.website-files.com/671b5aa1d031cdfe984c73ee/6723a868acbbd0644b5654de_zenska%20majica.txt'  //zenska
    //'https://cdn.prod.website-files.com/6729eb87cfb6a5c0fb028478/673ca05ea09ba7d6ca757a71_moska%20majica.txt' //moska
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