import { SceneManager, SceneObject }  from "./scene.js";
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

const vsSource = `#version 300 es
  in vec4 aVertexPosition;
  in vec2 aTextureCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  out highp vec2 vTextureCoord;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

const fsSource = `#version 300 es
  precision lowp float;
  in highp vec2 vTextureCoord;
  uniform sampler2D uSampler;
  out vec4 fragColor;
  void main() {
    fragColor = texture(uSampler, vTextureCoord);
  }
`;

function initShaderProgram(gl, vs, fs) {
  const load = (t, s) => {
    const sh = gl.createShader(t);
    gl.shaderSource(sh, s);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const prog = gl.createProgram();
  gl.attachShader(prog, load(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, load(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }

  return prog;
}

const state = {
  sceneManager: new SceneManager(),
  angleX: 0,
  angleY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  glassesX: 0,
  glassesY: 0,
  glassesZ: 0,
};

const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
  program: shaderProgram,
  attribLocations: {
    pos: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    texCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
  },
  uniformLocations: {
    proj: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
    mv: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    sampler: gl.getUniformLocation(shaderProgram, "uSampler"),
  },
};

state.sceneManager.loadGlasses(
  gl,
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
    state.sceneManager.loadHead(gl, headData);
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

  gl.useProgram(programInfo.program);
  gl.uniformMatrix4fv(programInfo.uniformLocations.proj, false, proj);

  state.sceneManager.translateGlasses(state.glassesX, state.glassesY, state.glassesZ);
  state.sceneManager.rotateHead(state.angleX, -state.angleY);
  state.sceneManager.draw(gl, programInfo);

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
