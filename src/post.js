// yeet2waifu © 2026 Haru (@haru717171x). All rights reserved. Free to play on stream; see LICENSE.
// The post-process pass (WebGL): takes the finished 2D frame and adds glow, a vignette, a per-world color
// grade, chromatic aberration that pulses on big hits, a white flash, and optional CRT scanlines (?crt=1).
// ?fx=0 skips all of it (plain 2D canvas). The glow is SELECTIVE: only what the renderer paints on its
// emissive layer (portals, jelly sparks, hearts) bleeds light; the rest of the picture never glows.
// The pixels stay hard: the frame is sampled nearest at its own size; only the glow is soft.

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const BLUR = `
precision mediump float;
varying vec2 uv;
uniform sampler2D src;
uniform vec2 dir;
void main() {
  vec3 c = texture2D(src, uv).rgb * 0.227;
  c += texture2D(src, uv + dir * 1.385).rgb * 0.316;
  c += texture2D(src, uv - dir * 1.385).rgb * 0.316;
  c += texture2D(src, uv + dir * 3.231).rgb * 0.070;
  c += texture2D(src, uv - dir * 3.231).rgb * 0.070;
  gl_FragColor = vec4(c, 1.0);
}`;

const COMPOSITE = `
precision mediump float;
varying vec2 uv;
uniform sampler2D src;
uniform sampler2D glow;
uniform vec2 res;
uniform float bloom, vignette, saturation, contrast, punch, flash, crt;
void main() {
  vec2 d = uv - 0.5;
  vec2 ab = d * punch * 0.012;
  vec3 c;
  c.r = texture2D(src, uv + ab).r;
  c.g = texture2D(src, uv).g;
  c.b = texture2D(src, uv - ab).b;
  c += texture2D(glow, uv).rgb * bloom;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, saturation);
  c = (c - 0.5) * contrast + 0.5;
  c *= 1.0 - vignette * pow(length(d) * 1.35, 2.4);
  if (crt > 0.5) c *= 0.9 + 0.1 * sin(uv.y * res.y * 3.14159);
  c = mix(c, vec3(1.0), flash);
  gl_FragColor = vec4(c, 1.0);
}`;

export class Post {
  static create(canvas) {
    try {
      const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
      return gl ? new Post(canvas, gl) : null;
    } catch {
      return null;
    }
  }

  constructor(canvas, gl) {
    this.canvas = canvas;
    this.gl = gl;
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.blur = this.program(BLUR);
    this.comp = this.program(COMPOSITE);
    this.srcTex = this.texture(gl.NEAREST);
    this.emitTex = this.texture(gl.LINEAR);
    this.w = 0;
    this.h = 0;
  }

  program(frag) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  texture(filter) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  target(w, h) {
    const gl = this.gl;
    const tex = this.texture(gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h };
  }

  resize(w, h) {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
    const qw = Math.max(1, Math.round(w / 4));
    const qh = Math.max(1, Math.round(h / 4));
    this.a = this.target(qw, qh);
    this.b = this.target(qw, qh);
  }

  pass(prog, target, setup) {
    const gl = this.gl;
    gl.useProgram(prog.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : this.w, target ? target.h : this.h);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    setup(prog.u);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  bind(unit, tex, loc) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  // emissive: a quarter-size canvas aligned with the frame, black except for what should glow
  render(source, look, emissive) {
    const gl = this.gl;
    this.resize(source.width, source.height);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.bindTexture(gl.TEXTURE_2D, this.emitTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, emissive);
    for (let i = 0; i < 2; i++) {
      this.pass(this.blur, this.b, (u) => {
        this.bind(0, i === 0 ? this.emitTex : this.a.tex, u.src);
        gl.uniform2f(u.dir, 1 / this.a.w, 0);
      });
      this.pass(this.blur, this.a, (u) => {
        this.bind(0, this.b.tex, u.src);
        gl.uniform2f(u.dir, 0, 1 / this.a.h);
      });
    }
    this.pass(this.comp, null, (u) => {
      this.bind(0, this.srcTex, u.src);
      this.bind(1, this.a.tex, u.glow);
      gl.uniform2f(u.res, this.w, this.h);
      gl.uniform1f(u.bloom, look.bloom);
      gl.uniform1f(u.vignette, look.vignette);
      gl.uniform1f(u.saturation, look.saturation);
      gl.uniform1f(u.contrast, look.contrast);
      gl.uniform1f(u.punch, look.punch);
      gl.uniform1f(u.flash, look.flash);
      gl.uniform1f(u.crt, look.crt ? 1 : 0);
    });
  }
}
