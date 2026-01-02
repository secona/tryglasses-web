import Stats from 'stats.js';
import { ObjectManager }  from "./object.js";
import { HeadData } from "./head.js";
import {
  mat4Create,
  mat4Translate,
  mat4Perspective,
  mat4RotateX,
  mat4RotateY,
} from "./mat4.js";

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

export class MainView {
  constructor(objectManager) {
    const canvas = document.getElementById("glCanvas");
    this.canvas = canvas;

    const gl = canvas.getContext("webgl2");
    this.gl = gl;

    if (!gl) {
      throw new Error("WebGL2 Unsupported!");
    }

    const program = this.initShaderProgram(gl, vsSource, fsSource);
    this.program = program;

    this.objectManager = objectManager;

    this.attribLocations = {
      pos: gl.getAttribLocation(program, "aVertexPosition"),
      texCoord: gl.getAttribLocation(program, "aTextureCoord"),
    };

    this.uniformLocations = {
      proj: gl.getUniformLocation(program, "uProjectionMatrix"),
      mv: gl.getUniformLocation(program, "uModelViewMatrix"),
      sampler: gl.getUniformLocation(program, "uSampler"),
    };

    this.angleX = 0;
    this.angleY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.glassesX = 0;
    this.glassesY = 0;
    this.glassesZ = 0;

    const stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    stats.dom.style.right = '0px';
    document.getElementById('canvas-container').appendChild(stats.dom);
    this.stats = stats;
  }

  run() {
    const gl = this.gl;
    const canvas = this.canvas;

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

    const draw = () => {
      this.stats.begin();
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

      gl.useProgram(this.program);
      gl.uniformMatrix4fv(this.uniformLocations.proj, false, proj);

      this.objectManager.translateGlasses(this.glassesX, this.glassesY, this.glassesZ);
      this.objectManager.rotateHead(this.angleX, -this.angleY);

      this.drawScene();

      this.stats.end();
      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  drawScene() {
    const gl = this.gl;

    const setAttr = (loc, buf, size) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(loc);
    };

    if (this.objectManager.head) {
      this.objectManager.head.tz = -6;

      setAttr(this.attribLocations.pos, this.headBuffers.pos, 3);
      setAttr(this.attribLocations.texCoord, this.headBuffers.texCoord, 2);

      gl.uniformMatrix4fv(this.uniformLocations.mv, false, this.objectManager.head.getModelMatrix());
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.headTexture);
      gl.drawArrays(gl.TRIANGLES, 0, this.headBuffers.count);

      if (this.objectManager.glasses) {
        setAttr(this.attribLocations.pos, this.glassesBuffers.pos, 3);
        setAttr(this.attribLocations.texCoord, this.glassesBuffers.texCoord, 2);

        gl.uniformMatrix4fv(this.uniformLocations.mv, false, this.objectManager.glasses.getModelMatrix());
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.glassesTexture);
        gl.drawArrays(gl.TRIANGLES, 0, this.glassesBuffers.count);
      }
    }
  }

  load(controls) {
    this.glassesBuffers = initBuffers(this.gl, this.objectManager.glasses.obj);
    this.glassesTexture = loadTexture(this.gl, this.objectManager.glasses.texMap);

    controls.subscribeLoadData((headData) => {
      this.objectManager.loadHead(headData);
      this.headBuffers = initBuffers(this.gl, headData.obj);
      this.headTexture = loadTexture(this.gl, headData.texMap);
    });

    controls.subscribeGlasses((data) => {
      switch (data.axis) {
        case 'x':
          this.glassesX = data.value;
          break;
        case 'y':
          this.glassesY = data.value;
          break;
        case 'z':
          this.glassesZ = data.value;
          break;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => this.isDragging = false);

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.angleY -= deltaX * 0.01;
      this.angleX += deltaY * 0.01;
    });
  }

  initShaderProgram(gl, vs, fs) {
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

