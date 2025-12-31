export function mat4Create() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function mat4Mul(out, a, b) {
  const a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  const a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  const a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  const a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  const b00 = b[0],
    b01 = b[1],
    b02 = b[2],
    b03 = b[3];
  const b10 = b[4],
    b11 = b[5],
    b12 = b[6],
    b13 = b[7];
  const b20 = b[8],
    b21 = b[9],
    b22 = b[10],
    b23 = b[11];
  const b30 = b[12],
    b31 = b[13],
    b32 = b[14],
    b33 = b[15];

  out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

  return out;
}

export function mat4Perspective(m, fovDeg, aspect, near, far) {
  const f = 1.0 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  m.fill(0);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;
  m[15] = 0;
  return m;
}

export function mat4Translate(m, tx, ty, tz) {
  m[12] += tx;
  m[13] += ty;
  m[14] += tz;
  return m;
}

export function mat4RotateX(m, rad) {
  const c = Math.cos(rad),
    s = Math.sin(rad);
  const rot = new Float32Array([
    1,
    0,
    0,
    0,
    //
    0,
    c,
    s,
    0,
    //
    0,
    -s,
    c,
    0,
    //
    0,
    0,
    0,
    1,
  ]);
  return mat4Mul(m, m, rot);
}

export function mat4RotateY(m, rad) {
  const c = Math.cos(rad),
    s = Math.sin(rad);
  const rot = new Float32Array([
    c,
    0,
    -s,
    0,
    //
    0,
    1,
    0,
    0,
    //
    s,
    0,
    c,
    0,
    //
    0,
    0,
    0,
    1,
  ]);
  return mat4Mul(m, m, rot);
}

export function mat4RotateZ(m, rad) {
  const c = Math.cos(rad),
    s = Math.sin(rad);
  const rot = new Float32Array([
    c,
    s,
    0,
    0,
    //
    -s,
    c,
    0,
    0,
    //
    0,
    0,
    1,
    0,
    //
    0,
    0,
    0,
    1,
  ]);
  return mat4Mul(m, m, rot);
}

export function mat4Scale(m, sx, sy, sz) {
  m[0] *= sx;
  m[1] *= sx;
  m[2] *= sx;
  m[3] *= sx;
  m[4] *= sy;
  m[5] *= sy;
  m[6] *= sy;
  m[7] *= sy;
  m[8] *= sz;
  m[9] *= sz;
  m[10] *= sz;
  m[11] *= sz;
  return m;
}
