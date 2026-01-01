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
  constructor(gl) {
    this.program = this.initShaderProgram(gl, vsSource, fsSource);

    this.attribLocations = {
      pos: gl.getAttribLocation(this.program, "aVertexPosition"),
      texCoord: gl.getAttribLocation(this.program, "aTextureCoord"),
    };

    this.uniformLocations = {
      proj: gl.getUniformLocation(this.program, "uProjectionMatrix"),
      mv: gl.getUniformLocation(this.program, "uModelViewMatrix"),
      sampler: gl.getUniformLocation(this.program, "uSampler"),
    };
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
