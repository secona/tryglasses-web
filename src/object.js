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

export class ObjectManager {
  constructor() {
    this.head = null;
    this.glasses = null;
  }

  async loadGlasses(objURL, texURL) {
    try {
      const objResponse = await fetch(objURL);
      const objString = await objResponse.text();
      const obj = parseOBJ(objString);

      this.glasses = new MyObject(obj, texURL);
    } catch (error) {
      console.error("Error loading glasses:", error);
    }
  }

  async loadHead(headData) {
    try {
      this.headData = headData;
      this.head = new MyObject(headData.obj, headData.texMap);

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

  translateGlasses(x, y, z) {
    if (this.glasses) {
      this.glasses.tx = x;
      this.glasses.ty = y;
      this.glasses.tz = z;
    }
  }
}

export class MyObject {
  constructor(obj, texMap) {
    this.obj = obj;
    this.texMap = texMap;

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
}
