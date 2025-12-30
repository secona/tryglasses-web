import {
  mat4Create,
  mat4Translate,
  mat4Perspective,
  mat4RotateX,
  mat4RotateY,
} from "./mat4.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 Unsupported!");
}

const vsSource = `#version 300 es
  in vec4 aVertexPosition;
  in vec4 aVertexColor;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  out lowp vec4 vColor;
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
`;

const fsSource = `#version 300 es
  precision lowp float;
  in lowp vec4 vColor;
  out vec4 fragColor;
  void main() {
    fragColor = vColor;
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

const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
  program: shaderProgram,
  attribLocations: {
    pos: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    color: gl.getAttribLocation(shaderProgram, "aVertexColor"),
  },
  uniformLocations: {
    proj: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
    mv: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
  },
};

// --- Buffer Setup (Cube) ---
function initBuffers(gl) {
  const positions = [
    -1,
    -1,
    1,
    1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1, // Front
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    -1, // Back
    -1,
    1,
    -1,
    -1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    -1, // Top
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    -1,
    1,
    -1,
    -1,
    1, // Bottom
    1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1, // Right
    -1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    -1, // Left
  ];

  const faceColors = [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 0, 1, 1],
  ];
  let colors = [];
  faceColors.forEach((c) => colors.push(...c, ...c, ...c, ...c));

  const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];

  const createBuf = (type, data) => {
    const b = gl.createBuffer();
    gl.bindBuffer(type, b);
    gl.bufferData(type, data, gl.STATIC_DRAW);
    return b;
  };

  return {
    pos: createBuf(gl.ARRAY_BUFFER, new Float32Array(positions)),
    color: createBuf(gl.ARRAY_BUFFER, new Float32Array(colors)),
    indices: createBuf(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices)),
  };
}

const buffers = initBuffers(gl);

let rotation = 0.0;

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

  const mv = mat4Create();
  mat4RotateX(mv, rotation * 0.7);
  mat4RotateY(mv, rotation);
  mat4Translate(mv, 0.0, 0.0, -6.0);

  const setAttr = (loc, buf, size) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);
  };

  setAttr(programInfo.attribLocations.pos, buffers.pos, 3);
  setAttr(programInfo.attribLocations.color, buffers.color, 4);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.proj, false, proj);
  gl.uniformMatrix4fv(programInfo.uniformLocations.mv, false, mv);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  rotation += 0.01;
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
