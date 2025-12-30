export function mat4Create() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
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
  const m1 = m[1],
    m5 = m[5],
    m9 = m[9],
    m13 = m[13];
  m[1] = m[1] * c + m[2] * s;
  m[2] = m[2] * c - m1 * s;
  m[5] = m[5] * c + m[6] * s;
  m[6] = m[6] * c - m5 * s;
  m[9] = m[9] * c + m[10] * s;
  m[10] = m[10] * c - m9 * s;
  m[13] = m[13] * c + m[14] * s;
  m[14] = m[14] * c - m13 * s;
  return m;
}

export function mat4RotateY(m, rad) {
  const c = Math.cos(rad),
    s = Math.sin(rad);
  const m0 = m[0],
    m4 = m[4],
    m8 = m[8],
    m12 = m[12];
  m[0] = m[0] * c - m[2] * s;
  m[2] = m[2] * c + m0 * s;
  m[4] = m[4] * c - m[6] * s;
  m[6] = m[6] * c + m4 * s;
  m[8] = m[8] * c - m[10] * s;
  m[10] = m[10] * c + m8 * s;
  m[12] = m[12] * c - m[14] * s;
  m[14] = m[14] * c + m12 * s;
  return m;
}
