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
scene.background = new THREE.Color("#ADD8E6");

let playgroundLength = 110;
let playgroundBreadth = 20;

let makeSnow = () => {
  const snow = new THREE.Mesh(
    new THREE.PlaneGeometry(
      playgroundBreadth + 10,
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
  let leavesMaterial = new THREE.MeshStandardMaterial({
    color: "green",
    flatShading: true,
  });

  let tree = new THREE.Group();
  let r = 1;
  for (let i = 0; i < 3; i++) {
    let leavesGeometry = new THREE.Mesh(
      new THREE.ConeGeometry(r, 1, 32),
      leavesMaterial
    );
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

let treeNum = 15;
let snow = makeSnow();
let trees1 = makeTrees(treeNum);

let playGround1 = new THREE.Group();
playGround1.add(trees1);
playGround1.add(snow);
scene.add(playGround1);

let playGround2 = new THREE.Group();

snow = makeSnow();
let trees2 = makeTrees(treeNum);
playGround2.add(trees2);
playGround2.add(snow);
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
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xdddddd, 0.2);
scene.add(ambientLight);

// const controls = new OrbitControls(camera, renderer.domElement);
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
  }
  else{
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
      alert("GAME OVER : " + Math.ceil(currScore));

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

let clock = new THREE.Clock();
let prevTime = 0;
let animate = () => {
  let elapsedTime = clock.getElapsedTime();
  let deltaTime = elapsedTime - prevTime;
  prevTime = elapsedTime;

  if (sleighModel) {
    sleighModel.rotation.y = -Math.PI / 2;
    sleighModel.position.x = 5;

    // const playerBox = new THREE.Box3();
    // const playerBoxhelper = new THREE.Box3Helper(playerBox, 0xffff00);

    // // ensure the bounding box is computed for its geometry
    // // this should be done only once (assuming static geometries)
    // player.geometry.computeBoundingBox();

    // console.log(sleighModel)
    // // ...

    // // in the animation loop, compute the current bounding box with the world matrix
    // playerBox
    //   .copy(player.geometry.boundingBox)
    //   .applyMatrix4(sleighModel.matrixWorld);

    // // scene.add(box);
    // scene.add(playerBoxhelper);
    scene.add(sleighModel);
    sleighModel.position.x = player.position.x;
    sleighModel.position.y = player.position.y - 0.2;
    sleighModel.position.z = player.position.z;
  }

  regenerateGround();
  handlePlayer();
  playGround1.position.z += deltaTime * levelSpeed;
  playGround2.position.z += deltaTime * levelSpeed;
  currScore += 0.05;
  updateBoxes();
  checkCollision();

  // controls.update();
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
