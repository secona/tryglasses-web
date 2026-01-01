import {
  mat4Translate,
  mat4Create,
  mat4Perspective,
  mat4Mul,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
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

const texVsSource = `#version 300 es
  in vec2 aPosition;
  in vec2 aTexCoord;
  out vec2 vTexCoord;

  void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const texFsSource = `#version 300 es
  precision highp float;
  in vec2 vTexCoord;
  out vec4 fragColor;
  uniform sampler2D uTexture;
  uniform float uOpacity;
        
  void main() {
    vec4 texColor = texture(uTexture, vTexCoord);
    fragColor = vec4(texColor.rgb, texColor.a * uOpacity);
  }
`;

export class ResultView {
  constructor(objectManager) {
    const canvas = document.getElementById("render-canvas");
    this.canvas = canvas;

    const gl = canvas.getContext("webgl2");
    this.gl = gl;

    const modal = document.getElementById("render-modal");
    this.modal = modal;

    this.objectManager = objectManager;

    document.getElementById("btn-close-modal").addEventListener("click", () => {
      modal.style.display = "none";
    });

    document
      .getElementById("btn-close-modal-2")
      .addEventListener("click", () => {
        modal.style.display = "none";
      });

    document.getElementById("btn-save-render").addEventListener("click", () => {
      this.drawScene();

      requestAnimationFrame(() => {
        const link = document.createElement("a");
        link.download = "glasses_render.png";
        link.href = canvas.toDataURL();
        link.click();
      });
    });
  }

  drawScene() {
    const gl = this.gl;
    const canvas = this.canvas;

    const headData = this.objectManager.headData;
    const { trans, angle, cameraFocal, cameraCenter, cameraDist } =
      headData.recon;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.round(canvas.clientWidth * dpr);
    const displayHeight = Math.round(canvas.clientHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    // render background image
    const quadVertices = new Float32Array([
      -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
    ]);
    const quadBuffer = gl.createBuffer();

    gl.useProgram(this.texProgram);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const texLocs = this.texLocs;

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texLocs.position);
    gl.vertexAttribPointer(texLocs.position, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texLocs.texCoord);
    gl.vertexAttribPointer(texLocs.texCoord, 2, gl.FLOAT, false, 16, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.img);
    gl.uniform1i(texLocs.texture, 0);
    gl.uniform1f(texLocs.opacity, 1);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // render head & glasses
    const IMG_SIZE = 224;
    const aspect = 1.0;
    const fov = 2 * Math.atan(IMG_SIZE / (2 * cameraFocal));

    const proj = mat4Create();
    const f = 1.0 / Math.tan(fov / 2);
    const near = 0.1;
    const far = 100.0;

    proj[0] = f / aspect;
    proj[5] = f;
    proj[10] = (far + near) / (near - far);
    proj[11] = -1;
    proj[14] = (2 * far * near) / (near - far);
    proj[15] = 0;

    const offsetX = (cameraCenter[0] / IMG_SIZE) * 2 - 1;
    const offsetY = (cameraCenter[0] / IMG_SIZE) * 2 - 1;
    proj[8] = -offsetX;
    proj[9] = -offsetY;

    gl.useProgram(this.meshProgram);
    gl.uniformMatrix4fv(this.uniformLocations.proj, false, proj);

    const setAttr = (loc, buf, size) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(loc);
    };

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    // render head
    gl.colorMask(false, false, false, false);

    setAttr(this.attribLocations.pos, this.headBuffers.pos, 3);
    setAttr(this.attribLocations.texCoord, this.headBuffers.texCoord, 2);

    const headModel = mat4Create();
    mat4RotateZ(headModel, angle[2]);
    mat4RotateY(headModel, angle[1]);
    mat4RotateX(headModel, angle[0]);
    mat4Translate(headModel, trans[0], trans[1], trans[2] - cameraDist);

    gl.uniformMatrix4fv(this.uniformLocations.mv, false, headModel);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.headTexture);
    gl.drawArrays(gl.TRIANGLES, 0, this.headBuffers.count);

    // render glasses
    gl.colorMask(true, true, true, true);
    setAttr(this.attribLocations.pos, this.glassesBuffers.pos, 3);
    setAttr(this.attribLocations.texCoord, this.glassesBuffers.texCoord, 2);

    const glassesModel = this.objectManager.glasses.getLocalMatrix();
    mat4Mul(glassesModel, headModel, glassesModel);

    gl.uniformMatrix4fv(this.uniformLocations.mv, false, glassesModel);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.glassesTexture);
    gl.drawArrays(gl.TRIANGLES, 0, this.glassesBuffers.count);
  }

  run() {
    const gl = this.gl;

    this.modal.style.display = "flex";

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    function createProgram(vertSource, fragSource) {
      const vertShader = compileShader(vertSource, gl.VERTEX_SHADER);
      const fragShader = compileShader(fragSource, gl.FRAGMENT_SHADER);

      const program = gl.createProgram();
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program linking error:", gl.getProgramInfoLog(program));
        return null;
      }

      return program;
    }

    const meshProgram = this.initShaderProgram(gl, vsSource, fsSource);
    this.meshProgram = meshProgram;

    const texProgram = createProgram(texVsSource, texFsSource);
    this.texProgram = texProgram;

    this.attribLocations = {
      pos: gl.getAttribLocation(meshProgram, "aVertexPosition"),
      texCoord: gl.getAttribLocation(meshProgram, "aTextureCoord"),
    };

    this.uniformLocations = {
      proj: gl.getUniformLocation(meshProgram, "uProjectionMatrix"),
      mv: gl.getUniformLocation(meshProgram, "uModelViewMatrix"),
      sampler: gl.getUniformLocation(meshProgram, "uSampler"),
    };

    this.texLocs = {
      position: gl.getAttribLocation(texProgram, "aPosition"),
      texCoord: gl.getAttribLocation(texProgram, "aTexCoord"),
      texture: gl.getUniformLocation(texProgram, "uTexture"),
      opacity: gl.getUniformLocation(texProgram, "uOpacity"),
    };

    const redraw = () => {
      requestAnimationFrame(() => this.drawScene());
    };

    if (this.objectManager.glasses && this.objectManager.glasses.obj) {
      this.glassesBuffers = initBuffers(
        this.gl,
        this.objectManager.glasses.obj,
      );
      this.glassesTexture = loadTexture(
        this.gl,
        this.objectManager.glasses.texMap,
        redraw,
      );
    }

    if (this.objectManager.head && this.objectManager.head.obj) {
      this.headBuffers = initBuffers(this.gl, this.objectManager.head.obj);
      this.headTexture = loadTexture(
        this.gl,
        this.objectManager.head.texMap,
        redraw,
      );
    }

    this.img = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.objectManager.headData.img,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.drawScene();
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

function loadTexture(gl, url, onLoad) {
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

    if (onLoad) {
      onLoad();
    }
  };
  image.src = url;

  return texture;
}
