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
let levelNum = 1;
let sleighModel;
let rewardNum = 15;
let rewardBoxes = [];
let startCheckingCollisions = false;

const sizes = { height: window.innerHeight, width: window.innerWidth };

const bgAudio = document.getElementById("bgAudio");
bgAudio.volume = 0.3;
const crashAudio = document.getElementById("crashAudio");
const jumpAudio = document.getElementById("jumpAudio");
const bonusAudio = document.getElementById("bonusAudio");

const startButton = document.querySelector(".menu-container h2");
const menu = document.querySelector(".menu-container");

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

let makeRewardBox = (reward) => {
  const box = new THREE.Box3();
  const helper = new THREE.Box3Helper(box, 0xffff00);

  // ensure the bounding box is computed for its geometry
  // this should be done only once (assuming static geometries)
  reward.geometry.computeBoundingBox();

  // ...

  // in the animation loop, compute the current bounding box with the world matrix
  box.copy(reward.geometry.boundingBox).applyMatrix4(reward.matrixWorld);
  // console.log("HERE");
  // scene.add(box);
  // scene.add(helper);
  rewardBoxes.push(box);
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

let makeRewards = (rewardNum) => {
  let colors = [
    "#F47C7C",
    "#F7F48B",
    "#A1DE93",
    "#70A1D7",
    "#C56E90",
    "#9D8CB8",
  ];
  let rewards = new THREE.Group();
  for (let i = 0; i < rewardNum; i++) {
    let reward = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length] })
    );
    makeRewardBox(reward);
    reward.position.set(
      ((Math.random() * playgroundBreadth - 15) / 2) * (i % 2 == 0 ? -1 : 1),
      -0.5,
      ((Math.random() * playgroundLength) / 2) *
        (Math.floor(Math.random() * 10) % 2 == 0 ? 1 : -1)
    );

    reward.rotation.set((Math.random() / 3) * (i % 2 == 0 ? -1 : 1), 0, 0);
    let scaleVal = Math.random();
    scaleVal = scaleVal < 0.2 ? 1 : scaleVal;
    reward.scale.set(scaleVal, scaleVal, scaleVal);
    rewards.add(reward);
  }
  return rewards;
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

let makeBgMountains = () => {
  let mountainGeometry = new THREE.IcosahedronGeometry(70, 0);
  let mountainMaterial = new THREE.MeshStandardMaterial({
    color: "grey",
    flatShading: true,
  });

  let mountain1 = new THREE.Mesh(mountainGeometry, mountainMaterial);
  mountain1.position.z = -100;

  mountain1.position.y = -40;
  mountain1.position.x = -100;
  let mountain2 = new THREE.Mesh(mountainGeometry, mountainMaterial);
  mountain2.position.z = -120;

  mountain2.position.y = 0;
  mountain2.position.x = 0;

  let mountain3 = new THREE.Mesh(mountainGeometry, mountainMaterial);
  mountain3.position.z = -100;

  mountain3.position.y = -20;
  mountain3.position.x = 100;

  mountain1.rotation.x = Math.random() * Math.PI;
  mountain2.rotation.y = Math.random() * Math.PI;
  mountain3.rotation.z = Math.random() * Math.PI;

  let mountains = new THREE.Group();
  mountains.add(mountain1, mountain2, mountain3);
  return mountains;
};

let makeMoon = () => {
  let moon = new THREE.Mesh(
    new THREE.SphereGeometry(2, 30, 30),
    new THREE.MeshStandardMaterial({ color: "white", flatShading: true })
  );

  moon.position.x = -23;
  moon.position.y = 17;
  moon.position.z = 0;
  return moon;
};

let moon = makeMoon();
scene.add(moon);

let mountains = makeBgMountains();
scene.add(mountains);

let particles = makeParticles();
particles.position.z = 51;
scene.add(particles);

let treeNum = 15;
let snow = makeSnow();
let clouds1 = makeClouds();
let trees1 = makeTrees(treeNum);
let rewards1 = makeRewards(rewardNum);

let playGround1 = new THREE.Group();
playGround1.add(trees1);
playGround1.add(snow);
playGround1.add(clouds1);

playGround1.add(rewards1);

scene.add(playGround1);

let playGround2 = new THREE.Group();

snow = makeSnow();
let clouds2 = makeClouds();
let trees2 = makeTrees(treeNum);
let rewards2 = makeRewards(rewardNum);
playGround2.add(trees2);
playGround2.add(snow);
playGround2.add(clouds2);
playGround2.add(rewards2);
playGround2.position.z = -110;
scene.add(playGround2);

let playGround3 = new THREE.Group();

snow = makeSnow();
let clouds3 = makeClouds();
let trees3 = makeTrees(treeNum);
let rewards3 = makeRewards(rewardNum);
playGround3.add(trees3);
playGround3.add(snow);
playGround3.add(clouds3);
playGround3.add(rewards3);
playGround3.position.z = -220;
scene.add(playGround3);

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

const pointLight = new THREE.PointLight(new THREE.Color("white"), 0.7);
pointLight.position.z = 48;
scene.add(pointLight);
const pointLight2 = new THREE.PointLight(new THREE.Color("white"), 1);
pointLight2.position.z = 50;
pointLight2.position.y = -0.5;
scene.add(pointLight2);

const ambientLight = new THREE.AmbientLight(0xdddddd, 0.2);
scene.add(ambientLight);

renderer.render(scene, camera);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

let randomizeTrees = (playground) => {
  let treeArray = playground.children[0].children;
  for (let i = 0; i < treeArray.length; i++) {
    console.log();
    let tree = treeArray[i];
    tree.position.set(
      ((Math.random() * playgroundBreadth) / 2) * (i % 2 == 0 ? -1 : 1),
      0,
      ((Math.random() * playgroundLength) / 2) *
        (Math.floor(Math.random() * 10) % 2 == 0 ? 1 : -1)
    );

    tree.rotation.set((Math.random() / 3) * (i % 2 == 0 ? -1 : 1), 0, 0);
  }
};

let regenerateGround = () => {
  if (playGround1.position.z > playgroundLength) {
    playGround1.position.z = -200;
    randomizeTrees(playGround1);
  } else if (playGround2.position.z > playgroundLength) {
    playGround2.position.z = -200;
    randomizeTrees(playGround2);
  } else if (playGround3.position.z > playgroundLength) {
    playGround3.position.z = -200;
    randomizeTrees(playGround3);
  }
};

let handlePlayer = (deltaTime) => {
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
      console.log(player.position.y)
      player.position.y = -0.5;
      bounceValue = Math.random() * 0.04 + 0.005;
      playerJump = false;
      jumpAudio.load();
    } else {
      // console.log(deltaTime)
      let temp = player.position.y + bounceValue * deltaTime * 70;
      if(temp < -0.5){
        temp = -0.51;
      }
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

let updateMaxScore = () => {
  currScore = Math.ceil(currScore);
  let myStorage = window.localStorage;
  let maxScore = { score: 0 };
  if (myStorage.getItem("sleigh-runner") != null) {
    maxScore = JSON.parse(myStorage.getItem("sleigh-runner"));
    if (currScore > maxScore.score) {
      maxScore.score = currScore;
    }
  }
  console.log("Max score : " + maxScore.score);
  myStorage.setItem("sleigh-runner", JSON.stringify(maxScore));
  let maxS = document.getElementById("max-score");
  maxS.innerHTML = `Max score : <span> ${maxScore.score} </span>`;
};

let updateBoxes = () => {
  playerBox.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);

  for (let i = 0; i < trunkBoxes.length; i++) {
    console.log();
    if (i < 15) {
      trunkBoxes[i]
        .copy(trees1.children[i].children[3].geometry.boundingBox)
        .applyMatrix4(trees1.children[i].children[3].matrixWorld);
    } else if (i < 30) {
      trunkBoxes[i]
        .copy(trees2.children[i - 15].children[3].geometry.boundingBox)
        .applyMatrix4(trees2.children[i - 15].children[3].matrixWorld);
    } else {
      trunkBoxes[i]
        .copy(trees2.children[i - 30].children[3].geometry.boundingBox)
        .applyMatrix4(trees2.children[i - 30].children[3].matrixWorld);
    }
  }

  for (let i = 0; i < rewardBoxes.length; i++) {
    console.log();
    if (i < 15) {
      rewardBoxes[i]
        .copy(rewards1.children[i].geometry.boundingBox)
        .applyMatrix4(rewards1.children[i].matrixWorld);
    } else if (i < 30) {
      rewardBoxes[i]
        .copy(rewards2.children[i - 15].geometry.boundingBox)
        .applyMatrix4(rewards2.children[i - 15].matrixWorld);
    } else {
      rewardBoxes[i]
        .copy(rewards3.children[i - 30].geometry.boundingBox)
        .applyMatrix4(rewards3.children[i - 30].matrixWorld);
    }
  }
  // box.copy(trunk.geometry.boundingBox).applyMatrix4(trunk.matrixWorld);
};

let animateRewards = (playground) => {
  let rewardsArray = playground.children[3].children;
  for (let i = 0; i < rewardsArray.length; i++) {
    rewardsArray[i].rotation.y = prevTime;
    rewardsArray[i].position.y = -0.6 + Math.abs(Math.sin(prevTime + i) / 3);
    if (levelNum >= 3)
      rewardsArray[i].position.x +=
        i % 2 == 0 ? Math.sin(prevTime) / 50 : Math.cos(prevTime) / 50;
  }
};

let checkCollision = () => {
  for (let i = 0; i < trunkBoxes.length; i++) {
    if (playerBox.intersectsBox(trunkBoxes[i])) {
      console.log("COLLISION");
      bgAudio.load();
      crashAudio.play();

      updateMaxScore();
      console.log("GAME OVER!  Score : " + Math.ceil(currScore));

      currScore = 0;
      reset();
    }
  }

  for (let i = 0; i < rewardBoxes.length; i++) {
    if (playerBox.intersectsBox(rewardBoxes[i])) {
      // console.log("PICKED REWARD + 5");
      currScore += 5;
      // bonusAudio.load();
      bonusAudio.currentTime = 0;
      bonusAudio.play();
      return;
    }
  }
};

let reset = () => {
  menu.classList.remove("hide");
  document.getElementById(
    "curr-score"
  ).innerHTML = `Curr score : <span> ${0} </span>`;

  document.getElementById(
    "level-container"
  ).innerHTML = `<h1> Level -</h1>`;
  startCheckingCollisions = false;
  bgAudio.pause();
  playerTargetX = 0;
  playerJump = false;
  bounceValue = 0.1;
  levelSpeed = 20;
  levelNum = 1;
  player.position.z = 48;
  player.position.x = 0;
  player.position.y = -0.5;
  playGround1.position.z = 0;
  playGround2.position.z = -110;
  playGround3.position.z = -220;
};

// const controls = new OrbitControls(camera, renderer.domElement);
let clock = new THREE.Clock();
let prevTime = 0;
let animationRequest;
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
  handlePlayer(deltaTime);
  playGround1.position.z += deltaTime * levelSpeed;
  playGround2.position.z += deltaTime * levelSpeed;
  playGround3.position.z += deltaTime * levelSpeed;

  animateRewards(playGround1);
  animateRewards(playGround2);
  animateRewards(playGround3);

  // particles.rotation.z += 0.005;
  particles.rotation.x -= 0.005;
  updateBoxes();
  if (startCheckingCollisions) {
    currScore += 0.05;
    checkCollision();
    document.getElementById(
      "curr-score"
    ).innerHTML = `Curr score : <span> ${Math.ceil(currScore)} </span>`;
  }

  // controls.update();
  renderer.render(scene, camera);
  animationRequest = requestAnimationFrame(animate);
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
      jumpAudio.play();
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

// scene.add(playerBoxhelper);

document.onkeydown = handleKeyDown;

bgAudio.loop = true;

startButton.addEventListener("click", (e) => {
  bgAudio.play();
  menu.classList.add("hide");
  currScore = 0;
  setTimeout(() => {
    startCheckingCollisions = true;
  }, 2000);

  document.getElementById(
    "level-container"
  ).innerHTML = `<h1> Level ${levelNum}</h1>`;
});

setInterval(() => {
  if (startCheckingCollisions) {
    console.log("NEXT LEVEL");
    levelSpeed += 5;
    levelNum += 1;
    document.getElementById(
      "level-container"
    ).innerHTML = `<h1> Level ${levelNum}</h1>`;
  }
}, 20 * 1000);

updateMaxScore();
animate();

// scene.fog = new THREE.Fog(new THREE.Color('grey'), 0.00, 70);
