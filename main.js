// import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
// import THREE from 'https://cdn.skypack.dev/three';
// import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";
// import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";

// import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.min.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";

let playerTargetX = 0;
let playerJump = false;
let bounceValue = 0.1;
let gravity = 0.005;
let trunkBoxes = [];
let currScore = 0;
let levelSpeed = 20;
let sleighModel;

const sizes = { height: window.innerHeight, width: window.innerWidth };

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
scene.background = new THREE.Color("#050F26");

let playgroundLength = 110;
let playgroundBreadth = 20;

let makeSnow = () => {
  const snow = new THREE.Mesh(
    new THREE.PlaneGeometry(
      playgroundBreadth + 100,
      playgroundLength + 10,
      30,
      30
    ),
    // new THREE.IcosahedronGeometry(20, 6),
    new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      flatShading: true,
      wireframe: false,
    })
  );
  snow.rotation.x = -Math.PI / 2;
  snow.position.y = -1;
  let array = snow.geometry.attributes.position.array;
  for (let i = 2; i < array.length; i += 3) {
    array[i] = Math.random() / 3;
  }

  return snow;
};

let makeTrunkBox = (trunk) => {
  const box = new THREE.Box3();
  const helper = new THREE.Box3Helper(box, 0xffff00);

  // ensure the bounding box is computed for its geometry
  // this should be done only once (assuming static geometries)
  trunk.geometry.computeBoundingBox();

  // ...

  // in the animation loop, compute the current bounding box with the world matrix
  box.copy(trunk.geometry.boundingBox).applyMatrix4(trunk.matrixWorld);
  // console.log("HERE");
  // scene.add(box);
  // scene.add(helper);
  trunkBoxes.push(box);
};

let makeOneTree = () => {
  let colors = ["#008000", "#228B22", "#006400"];
  let tree = new THREE.Group();
  let r = 1;
  for (let i = 0; i < 3; i++) {
    let color = colors[i];
    let leaves = new THREE.Mesh(
      new THREE.ConeGeometry(r, 1, 32),
      new THREE.MeshStandardMaterial({ color: color })
    );
    leaves.position.y = i * 0.5;
    tree.add(leaves);
    r -= 0.25;
  }
  let trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1, 10),
    new THREE.MeshBasicMaterial({ color: "#3A271A" })
  );
  trunk.position.y -= 0.5;
  tree.add(trunk);

  makeTrunkBox(trunk);

  return tree;
};

let makeTrees = (treeNum) => {
  let trees = new THREE.Group();
  let array = snow.geometry.attributes.position.array;
  for (let i = 0; i < treeNum; i++) {
    let tree = makeOneTree();
    tree.position.set(
      ((Math.random() * playgroundBreadth) / 2) * (i % 2 == 0 ? -1 : 1),
      0,
      ((Math.random() * playgroundLength) / 2) *
        (Math.floor(Math.random() * 10) % 2 == 0 ? 1 : -1)
    );

    tree.rotation.set((Math.random() / 3) * (i % 2 == 0 ? -1 : 1), 0, 0);
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

let makeClouds = () => {
  let clouds = new THREE.Group();
  let cloudPositions = [
    { x: -15, y: 10, z: 0 },
    { x: -15, y: 10, z: 15 },
    { x: 5, y: 8, z: 40 },
    { x: 15, y: 10, z: 0 },
  ];
  let cubeMaterial = new THREE.MeshBasicMaterial({ color: "white" });
  let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 4; i++) {
    let cloud = new THREE.Group();
    for (let j = 0; j < 8; j++) {
      let cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cubeMesh.material.color =
        j % 2 == 0 ? new THREE.Color("black") : new THREE.Color("white");
      cubeMesh.rotation.x = (Math.random() * Math.PI) / 2;
      cubeMesh.rotation.y = (Math.random() * Math.PI) / 2;
      cubeMesh.rotation.z = (Math.random() * Math.PI) / 2;
      cubeMesh.position.x = j - Math.random() * 0.1;
      let scaleRandom = Math.random();
      cubeMesh.scale.set(scaleRandom, scaleRandom, scaleRandom);
      cloud.add(cubeMesh);
    }
    cloud.position.set(
      cloudPositions[i].x,
      cloudPositions[i].y,
      cloudPositions[i].z
    );
    // cloud.position.x = Math.sin(i * Math.PI)
    clouds.add(cloud);
  }

  return clouds;
};

let makeParticles = () => {
  // PARTICLES

  let bgParticlesGeometry = new THREE.BufferGeometry();
  let count = 1500;

  let positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    if (i % 3 == 0) {
      // x
      positions[i] = (Math.random() - 0.5) * 50;
    }
    if (i % 3 == 1) {
      // y
      positions[i] = (Math.random() - 0.5) * 50;
    }
    if (i % 3 == 2) {
      // z
      positions[i] = (Math.random() - 0.5) * 50;
    }
  }

  bgParticlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  let bgParticlesMaterial = new THREE.PointsMaterial();
  bgParticlesMaterial.size = 0.05;
  bgParticlesMaterial.sizeAttenuation = true;
  bgParticlesMaterial.transparent = true;
  // bgParticlesMaterial.alphaMap = ;
  bgParticlesMaterial.depthWrite = false;
  bgParticlesMaterial.color = new THREE.Color("white");

  let bgParticles = new THREE.Points(bgParticlesGeometry, bgParticlesMaterial);

  return bgParticles;
};

let particles = makeParticles();
particles.position.z = 51;
scene.add(particles);

let treeNum = 15;
let snow = makeSnow();
let clouds1 = makeClouds();
let trees1 = makeTrees(treeNum);

let playGround1 = new THREE.Group();
playGround1.add(trees1);
playGround1.add(snow);
playGround1.add(clouds1);
scene.add(playGround1);

let playGround2 = new THREE.Group();

snow = makeSnow();
let clouds2 = makeClouds();
let trees2 = makeTrees(treeNum);
playGround2.add(trees2);
playGround2.add(snow);
playGround2.add(clouds2);
playGround2.position.z = -110;
scene.add(playGround2);

let makePlayer = () => {
  let cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.3, 0.7),
    new THREE.MeshStandardMaterial({
      color: "red",
      transparent: true,
      opacity: 0,
    })
  );

  cube.position.z = 48;
  cube.position.y = -0.5;

  let loader = new GLTFLoader();
  loader.load("./assets/sleigh.gltf", (gltf) => {
    gltf.scene.scale.x = 0.2;
    gltf.scene.scale.y = 0.2;
    gltf.scene.scale.z = 0.2;
    sleighModel = gltf.scene;
  });

  return cube;
};

let player = makePlayer();
scene.add(player);

// Camera
const camera = new THREE.PerspectiveCamera(
  55,
  sizes.width / sizes.height,
  0.1,
  500
);
camera.position.z = 50.5;
camera.position.y = 0.2;

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.z = 7;
directionalLight.position.y = 4;
// scene.add(directionalLight);

const pointLight = new THREE.PointLight(new THREE.Color("white"), 0.5);
pointLight.position.z = 48;
scene.add(pointLight);
const pointLight2 = new THREE.PointLight(new THREE.Color("white"), 1.5);
pointLight2.position.z = 50;
pointLight2.position.y = -0.5;
scene.add(pointLight2);

const ambientLight = new THREE.AmbientLight(0xdddddd, 0.2);
scene.add(ambientLight);

renderer.render(scene, camera);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

let regenerateGround = () => {
  if (playGround1.position.z > playgroundLength) {
    playGround1.position.z = -100;
  } else if (playGround2.position.z > playgroundLength) {
    playGround2.position.z = -100;
  }
};

let handlePlayer = () => {
  // console.log(playerTargetX, player.position.x);
  if (playerTargetX > player.position.x + 0.02) {
    player.position.x += 0.02;
  } else if (playerTargetX < player.position.x - 0.02) {
    player.position.x -= 0.02;
  }

  if (playerJump === true) {
    // player.position.y = -0.5 + Math.abs(Math.cos(prevTime * 2)) ;
    // console.log(player.position.y);
    // if(player.position.y >= 0.5 || goDown){
    //   player.position.y -= 0.02
    //   goDown = true;
    // }
    // else{
    //   player.position.y += 0.02
    //   goDown = false;
    // }

    if (player.position.y < -0.5) {
      player.position.y = -0.5;
      bounceValue = Math.random() * 0.04 + 0.005;
      playerJump = false;
    } else {
      player.position.y += bounceValue;
    }
    bounceValue -= gravity;
  } else {
    //   bounceValue = Math.random() * 0.04 + 0.005;
    //   // player.position.y += bounceValue;
    //   bounceValue -= gravity;
    // player.position.y = Math.abs(Math.sin(clock.getElapsedTime()))/4 - 0.4
  }
};

let updateBoxes = () => {
  playerBox.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);

  for (let i = 0; i < 30; i++) {
    console.log();
    if (i < 15) {
      trunkBoxes[i]
        .copy(trees1.children[i].children[3].geometry.boundingBox)
        .applyMatrix4(trees1.children[i].children[3].matrixWorld);
    } else {
      trunkBoxes[i]
        .copy(trees2.children[i - 15].children[3].geometry.boundingBox)
        .applyMatrix4(trees2.children[i - 15].children[3].matrixWorld);
    }
  }
  // box.copy(trunk.geometry.boundingBox).applyMatrix4(trunk.matrixWorld);
};

let checkCollision = () => {
  for (let i = 0; i < 30; i++) {
    if (playerBox.intersectsBox(trunkBoxes[i])) {
      console.log("COLLISION");
      alert("GAME OVER!  Score : " + Math.ceil(currScore));

      currScore = 0;
      reset();
    }
  }
};

let reset = () => {
  playerTargetX = 0;
  playerJump = false;
  bounceValue = 0.1;
  player.position.z = 48;
  player.position.x = 0;
  player.position.y = -0.5;
  playGround1.position.z = 0;
  playGround2.position.z = -110;
};

const controls = new OrbitControls(camera, renderer.domElement);
let clock = new THREE.Clock();
let prevTime = 0;
let animate = () => {
  let elapsedTime = clock.getElapsedTime();
  let deltaTime = elapsedTime - prevTime;
  prevTime = elapsedTime;

  if (sleighModel) {
    sleighModel.rotation.y = -Math.PI / 2;
    sleighModel.position.x = 5;
    scene.add(sleighModel);
    sleighModel.position.x = player.position.x;
    sleighModel.position.y = player.position.y - 0.1;
    sleighModel.position.z = player.position.z;
    sleighModel.rotation.x = Math.sin(prevTime) / 5;
  }

  regenerateGround();
  handlePlayer();
  playGround1.position.z += deltaTime * levelSpeed;
  playGround2.position.z += deltaTime * levelSpeed;

  // particles.rotation.z += 0.005;
  particles.rotation.x -= 0.005;
  currScore += 0.05;
  updateBoxes();
  checkCollision();

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

let handleKeyDown = (keyEvent) => {
  if (keyEvent.keyCode === 37) {
    //left
    // console.log("move left");
    if (playerTargetX > -1) playerTargetX -= 1;
  } else if (keyEvent.keyCode === 39) {
    //right
    // console.log("move right");
    if (playerTargetX < 1) playerTargetX += 1;
  } else {
    if (keyEvent.keyCode === 38) {
      if (player.position.y > -0.5) return;
      //up, jump
      playerJump = true;
      bounceValue = 0.1;
    }
  }
};

const playerBox = new THREE.Box3();
const playerBoxhelper = new THREE.Box3Helper(playerBox, 0xffff00);

// ensure the bounding box is computed for its geometry
// this should be done only once (assuming static geometries)
player.geometry.computeBoundingBox();

// ...

// in the animation loop, compute the current bounding box with the world matrix
playerBox.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);

// scene.add(box);
// scene.add(playerBoxhelper);

document.onkeydown = handleKeyDown;
animate();
