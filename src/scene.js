import {
  mat4Create,
  mat4Translate,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Scale,
  mat4Mul,
} from "./mat4.js";
import { parseOBJ } from "./util.js";

export class SceneManager {
  constructor() {
    this.head = null;
    this.glasses = null;
  }

  async loadGlasses(gl, objURL, texURL) {
    try {
      const objResponse = await fetch(objURL);
      const objString = await objResponse.text();
      const obj = parseOBJ(objString);

      this.glasses = new SceneObject(gl, obj, texURL);
    } catch (error) {
      console.error("Error loading glasses:", error);
    }
  }

  async loadHead(gl, headData) {
    try {
      this.headData = headData;
      this.head = new SceneObject(gl, headData.obj, headData.texMap);

      if (this.glasses) {
        this.head.addChild(this.glasses);
      }
    } catch (error) {
      alert("An error occurred");
      console.error(error);
    }
  }

  rotateHead(angleX, angleY) {
    if (this.head) {
      this.head.rx = angleX;
      this.head.ry = angleY;
    }
  }

  draw(gl, programInfo) {
    if (this.head) {
      this.head.tz = -6;
      this.head.draw(gl, programInfo);

      if (this.glasses) {
        this.glasses.tz = 0.6;
        this.glasses.ty = 0.3;
        this.glasses.draw(gl, programInfo);
      }
    }
  }
}

export class SceneObject {
  constructor(gl, obj, texMap) {
    this.buffers = initBuffers(gl, obj);
    this.texture = loadTexture(gl, texMap);

    this.tx = 0;
    this.ty = 0;
    this.tz = 0;
    this.rx = 0;
    this.ry = 0;
    this.rz = 0;
    this.sx = 1;
    this.sy = 1;
    this.sz = 1;

    // hierarchy
    this.parent = null;
    this.children = [];
  }

  addChild(child) {
    child.parent = this;
    this.children.push(child);
  }

  getLocalMatrix() {
    const T = mat4Create();
    mat4Translate(T, this.tx, this.ty, this.tz);

    const Rx = mat4Create();
    mat4RotateX(Rx, this.rx);

    const Ry = mat4Create();
    mat4RotateY(Ry, this.ry);

    const Rz = mat4Create();
    mat4RotateZ(Rz, this.rz);

    const S = mat4Create();
    mat4Scale(S, this.sx, this.sy, this.sz);

    const M = mat4Create();
    mat4Mul(M, T, Rz);
    mat4Mul(M, M, Ry);
    mat4Mul(M, M, Rx);
    mat4Mul(M, M, S);
    return M;
  }

  getModelMatrix() {
    const local = this.getLocalMatrix();
    if (this.parent) {
      const M = mat4Create();
      mat4Mul(M, this.parent.getModelMatrix(), local);
      return M;
    }
    return local;
  }

  draw(gl, programInfo) {
    const setAttr = (loc, buf, size) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(loc);
    };

    setAttr(programInfo.attribLocations.pos, this.buffers.pos, 3);
    setAttr(programInfo.attribLocations.texCoord, this.buffers.texCoord, 2);

    gl.uniformMatrix4fv(programInfo.uniformLocations.mv, false, this.getModelMatrix());

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(programInfo.uniformLocations.sampler, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.buffers.count);
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

