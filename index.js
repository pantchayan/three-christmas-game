import * as THREE from "https://cdn.skypack.dev/three";
import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";

let sizes = { height: window.innerHeight, width: window.innerWidth };
const canvas = document.querySelector("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });

renderer.setSize(sizes.width, sizes.height);

window.addEventListener("resize", () => {
  sizes.height = window.innerHeight;
  sizes.width = window.innerWidth;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
});

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ADD8E6");

const snowPlayground = new THREE.Mesh(
  new THREE.PlaneGeometry( 100, 100, 50, 50 ),
  // new THREE.IcosahedronGeometry(20, 6),
  new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    flatShading: true,
    wireframe: false
  })
);
snowPlayground.rotation.x =  - Math.PI/2;
snowPlayground.position.y = -1;
scene.add(snowPlayground);

console.log(snowPlayground)

let makeOneTree = () => {
  let leavesMaterial = new THREE.MeshStandardMaterial({ color: "green", flatShading:true });

  let tree = new THREE.Group();
  let r = 1;
  for (let i = 0; i < 3; i++) {
    let leavesGeometry = new THREE.Mesh(new THREE.ConeGeometry(r, 1, 32), leavesMaterial);
    leavesGeometry.position.y = i * 0.5;
    tree.add(leavesGeometry);
    r -= 0.25;
  }
  let trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1, 10),
    new THREE.MeshBasicMaterial({ color: "black" })
  );
  trunk.position.y -= 0.5;
  tree.add(trunk);

  return tree;
};

let makeTrees = (treeNum) => {
  let trees = new THREE.Group();
  for(let i=0;i < treeNum;i++){
    let tree = makeOneTree();
    tree.position.set(
      Math.random() * 50 * (i % 2 == 0 ? -1 : 1),
      0,
      Math.random() * 50 * (Math.floor(Math.random() * 10) % 2 == 0 ? 1 : -1)
    );
    tree.rotation.set(
      Math.random()/3 * (i % 2 == 0 ? -1 : 1),
      0,
      0
    );
    // let scaleVal = Math.random();
    // tree.scale.set(
    //   scaleVal * 2 < 1?1:scaleVal*2,
    //   scaleVal * 2 < 1?1:scaleVal*2,
    //   scaleVal * 2 < 1?1:scaleVal*2,
    // );
    trees.add(tree);
  }
  return trees;
};

let trees = makeTrees(250);

scene.add(trees)


// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  500
);
camera.position.z = 20;

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

directionalLight.position.z = 7;
directionalLight.position.y = 4;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xdddddd, 0.2);
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);
renderer.render(scene, camera);
let prevT = Date.now();
let animate = () => {
  let currT = Date.now();
  let deltaT = currT - prevT;
  prevT = currT;

  // snowCircle.rotation.x += deltaT * 0.0001 * Math.PI;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();
