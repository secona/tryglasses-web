import { SceneManager, SceneObject }  from "./scene.js";
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
  constructor() {
    const canvas = document.getElementById("glCanvas");
    this.canvas = canvas;

    const gl = canvas.getContext("webgl2");
    this.gl = gl;

    if (!gl) {
      throw new Error("WebGL2 Unsupported!");
    }

    const program = this.initShaderProgram(gl, vsSource, fsSource);
    this.program = program;

    const sceneManager = new SceneManager(gl);
    this.sceneManager = sceneManager;

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

      this.sceneManager.translateGlasses(this.glassesX, this.glassesY, this.glassesZ);
      this.sceneManager.rotateHead(this.angleX, -this.angleY);
      this.sceneManager.draw(this);

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  load(controls) {
    this.sceneManager.loadGlasses(
      "/assets/45-oculos/oculos.obj",
      "/assets/45-oculos/glasses.png",
    );

    controls.subscribeLoadData((headData) => {
      this.sceneManager.loadHead(headData);
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
