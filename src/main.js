import JSZip from "jszip";
import { SceneObject }  from "./scene.js";
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
  scene: null,
  oculos: null,
  angleX: 0,
  angleY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
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

async function loadOculos() {
  try {
    const objResponse = await fetch("/assets/45-oculos/oculos.obj");
    const objString = await objResponse.text();
    const obj = parseOBJ(objString);

    const texMap = "/assets/45-oculos/glasses.png";

    state.oculos = new SceneObject(gl, obj, texMap);
  } catch (error) {
    console.error("Error loading oculos:", error);
  }
}

loadOculos();

function parseOBJ(text) {
  const positions = [];
  const texCoords = [];
  const vertices = [];
  const uvs = [];
  const faces = [];

  for (const line of text.split("\n")) {
    const parts = line.trim().split(" ");
    const type = parts.shift();
    
    if (type === "v") {
      vertices.push(parts.map(parseFloat));
    } else if (type === "vt") {
      uvs.push(parts.map(parseFloat));
    } else if (type === "f") {
      const currentFace = parts.map((p) => {
        const [vIndex, vtIndex] = p.split("/");
        return [
           parseInt(vIndex, 10) - 1, 
           vtIndex ? parseInt(vtIndex, 10) - 1 : 0
        ];
      });

      for (let i = 1; i < currentFace.length - 1; i++) {
        faces.push([currentFace[0], currentFace[i], currentFace[i + 1]]);
      }
    }
  }

  for (const f of faces) {
    for (const [vi, vti] of f) {
      if (vertices[vi]) {
        positions.push(...vertices[vi]);
        if (uvs[vti]) {
            texCoords.push(...uvs[vti]);
        } else {
            texCoords.push(0, 0);
        }
      }
    }
  }

  return { positions, texCoords };
}

loadBtn.addEventListener("click", async () => {
  const dataFile = dataInput.files[0];

  if (!dataFile) {
    alert("Please select a data file.");
    return;
  }

  try {
    const data = await JSZip.loadAsync(dataFile);

    const objString = await data.file("HRN_export/HRN_result.obj").async("string");
    const obj = parseOBJ(objString);

    const texMapBlob = await data.file("HRN_export/HRN_result.jpg").async("blob");
    const texMap = URL.createObjectURL(texMapBlob);

    state.scene = new SceneObject(gl, obj, texMap);
  } catch (error) {
    alert("An error occurred");
    console.error(error);
  }
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

  if (state.scene) {
    state.scene.tz = -6;
    state.scene.draw(gl, programInfo);
  }

  if (state.oculos) {
    state.oculos.tz = -6;
    state.oculos.draw(gl, programInfo);
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
