import { SceneManager, SceneObject }  from "./scene.js";
import { MainView } from "./main-view.js";
import { HeadData } from "./head.js";
import {
  mat4Create,
  mat4Translate,
  mat4Perspective,
  mat4RotateX,
  mat4RotateY,
} from "./mat4.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

const dataInput = document.getElementById("file-data");
const loadBtn = document.getElementById("btn-load");

if (!gl) {
  throw new Error("WebGL2 Unsupported!");
}

const state = {
  sceneManager: new SceneManager(gl),
  mainView: new MainView(gl),
  angleX: 0,
  angleY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  glassesX: 0,
  glassesY: 0,
  glassesZ: 0,
};

state.sceneManager.loadGlasses(
  "/assets/45-oculos/oculos.obj",
  "/assets/45-oculos/glasses.png",
);

loadBtn.addEventListener("click", async () => {
  const dataFile = dataInput.files[0];

  if (!dataFile) {
    alert("Please select a data file.");
    return;
  }

  try {
    const headData = await HeadData.load(dataFile);
    state.sceneManager.loadHead(headData);
  } catch (error) {
    alert("An error occurred");
    console.error(error);
  }
});

[
  ["translate-x", "valX"],
  ["translate-y", "valY"],
  ["translate-z", "valZ"],
].forEach(([sliderId, valueId]) => {
  const slider = document.getElementById(sliderId);
  const value = document.getElementById(valueId);

  value.textContent = Number(slider.value).toFixed(2);

  slider.addEventListener("input", () => {
    value.textContent = Number(slider.value).toFixed(2);
  });
});

document.getElementById("translate-x").addEventListener("input", (e) => {
  state.glassesX = Number(e.target.value);
});

document.getElementById("translate-y").addEventListener("input", (e) => {
  state.glassesY = Number(e.target.value);
});

document.getElementById("translate-z").addEventListener("input", (e) => {
  state.glassesZ = Number(e.target.value);
});

canvas.addEventListener('mousedown', (e) => {
  state.isDragging = true;
  state.lastMouseX = e.clientX;
  state.lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => state.isDragging = false);

window.addEventListener('mousemove', (e) => {
  if (!state.isDragging) return;
  const deltaX = e.clientX - state.lastMouseX;
  const deltaY = e.clientY - state.lastMouseY;

  state.lastMouseX = e.clientX;
  state.lastMouseY = e.clientY;

  state.angleY -= deltaX * 0.01;
  state.angleX += deltaY * 0.01;
});

function resize(gl, canvas) {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = Math.round(canvas.clientWidth * dpr);
  const displayHeight = Math.round(canvas.clientHeight * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

function draw() {
  resize(gl, canvas);

  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const proj = mat4Create();
  mat4Perspective(
    proj,
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100.0,
  );

  gl.useProgram(state.mainView.program);
  gl.uniformMatrix4fv(state.mainView.uniformLocations.proj, false, proj);

  state.sceneManager.translateGlasses(state.glassesX, state.glassesY, state.glassesZ);
  state.sceneManager.rotateHead(state.angleX, -state.angleY);
  state.sceneManager.draw(state.mainView);

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
