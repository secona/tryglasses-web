import {
  mat4Create,
  mat4Translate,
  mat4Perspective,
  mat4RotateX,
  mat4RotateY,
} from "./mat4.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

const objInput = document.getElementById("file-obj");
const texInput = document.getElementById("file-texture");
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

let scene = null;

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
      const f = [];
      for (const p of parts) {
        f.push(p.split("/").map((i) => parseInt(i, 10) - 1));
      }
      faces.push(f);
    }
  }

  for (const f of faces) {
    for (const [vi, vti] of f) {
      positions.push(...vertices[vi]);
      texCoords.push(...uvs[vti]);
    }
  }

  return { positions, texCoords };
}

function initBuffers(gl, data) {
  const createBuf = (type, d) => {
    const b = gl.createBuffer();
    gl.bindBuffer(type, b);
    gl.bufferData(type, d, gl.STATIC_DRAW);
    return b;
  };
  return {
    pos: createBuf(gl.ARRAY_BUFFER, new Float32Array(data.positions)),
    texCoord: createBuf(gl.ARRAY_BUFFER, new Float32Array(data.texCoords)),
    count: data.positions.length / 3,
  };
}

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src = url;

  return texture;
}

loadBtn.addEventListener("click", () => {
  const objFile = objInput.files[0];
  const texFile = texInput.files[0];

  if (!objFile || !texFile) {
    alert("Please select both an OBJ and a texture file.");
    return;
  }

  const objReader = new FileReader();
  objReader.onload = (e) => {
    const objData = parseOBJ(e.target.result);
    const buffers = initBuffers(gl, objData);
    const texReader = new FileReader();
    texReader.onload = (e) => {
      const texture = loadTexture(gl, e.target.result);
      scene = { buffers, texture };
    };
    texReader.readAsDataURL(texFile);
  };
  objReader.readAsText(objFile);
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

  const mv = mat4Create();
  mat4Translate(mv, 0.0, 0.0, -6.0);

  if (scene) {
    const setAttr = (loc, buf, size) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(loc);
    };

    setAttr(programInfo.attribLocations.pos, scene.buffers.pos, 3);
    setAttr(programInfo.attribLocations.texCoord, scene.buffers.texCoord, 2);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.proj, false, proj);
    gl.uniformMatrix4fv(programInfo.uniformLocations.mv, false, mv);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.texture);
    gl.uniform1i(programInfo.uniformLocations.sampler, 0);

    gl.drawArrays(gl.TRIANGLES, 0, scene.buffers.count);
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
