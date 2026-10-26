/* ASMBL — Le temps prend forme.
 * A deterministic 12 s 2.5D study. No external dependencies, no tracking.
 * The generated key visual is a conceptual mechanism, not an ASMBL product.
 */
(() => {
  'use strict';
  const canvas = document.querySelector('#motion-canvas');
  if (!canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const exporting = new URLSearchParams(location.search).has('export');
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  let paused = reduced.matches, visible = true, raf = 0, elapsed = 0, last = 0;
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  let width = 0, height = 0, gl, program, image, initialized = false;
  const api = window.ASMBLMotion = {
    ready, render, resize, duration: 12,
    get paused() { return paused; },
    setPaused(value) {
      paused = Boolean(value); last = 0;
      cancelAnimationFrame(raf);
      if (!paused && visible && !exporting && initialized) raf = requestAnimationFrame(tick);
      document.dispatchEvent(new CustomEvent('motionstatechange', {detail: {paused}}));
    }
  };
  const vertex = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * .5 + .5;
      gl_Position = vec4(a_position, 0., 1.);
    }
  `;
  const fragment = `
    precision highp float;
    uniform sampler2D u_image;
    uniform vec2 u_resolution;
    uniform vec2 u_imageSize;
    uniform vec2 u_pointer;
    uniform float u_time;
    varying vec2 v_uv;
    const float PI = 3.141592653589793;
    vec3 source(vec2 p) {
      return texture2D(u_image, vec2(clamp(p.x, .001, .999), 1. - clamp(p.y, .001, .999))).rgb;
    }
    float ellipse(vec2 p, vec2 c, vec2 scale, float angle) {
      vec2 d = p-c;
      d = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * d;
      return 1. - smoothstep(.62, 1., length(d / scale));
    }
    void main() {
      float phase = 2. * PI * u_time / 12.;
      vec2 uv = vec2(v_uv.x, 1.-v_uv.y);
      float viewAspect = u_resolution.x/u_resolution.y;
      float imageAspect = u_imageSize.x/u_imageSize.y;
      vec2 cover = vec2(min(1., viewAspect/imageAspect), min(1., imageAspect/viewAspect));
      // Narrow viewports crop around the mechanism rather than the empty left.
      float anchor = viewAspect < 1.2 ? .715 : .5;
      vec2 center = vec2(anchor, .49);
      uv = (uv-.5)*cover + center;

      // Periodic camera motion: position, speed, and exposure meet at the loop.
      float breath = .5-.5*cos(phase);
      float zoom = 1.035 + .105*breath;
      uv = (uv-vec2(.735,.47))/zoom + vec2(.735,.47);
      uv += vec2(.006*sin(phase), .005*sin(phase+.35)) + u_pointer*vec2(.008,.005);

      // Very small depth offsets between the suspended bezel and lower case.
      float right = smoothstep(.43,.57,uv.x);
      float upper = (1.-smoothstep(.255,.335,uv.y))*right;
      float lower = smoothstep(.63,.79,uv.y)*right;
      uv.y += upper*.005*sin(phase+.25)-lower*.0035*sin(phase+.25);
      uv.x += upper*.002*sin(phase)-lower*.0015*sin(phase);
      vec3 color = source(uv);
      float luminance = dot(color,vec3(.2126,.7152,.0722));

      // A softbox passes across the existing reflections, not over the black.
      vec2 lamp = vec2(.72+.19*sin(phase-.7), .43+.29*cos(phase-.7));
      float sweep = ellipse(uv,lamp,vec2(.13,.48),-.52);
      float metal = smoothstep(.07,.66,luminance)*right;
      color += vec3(1.,.91,.77)*metal*sweep*.135;
      color *= .88+.075*cos(phase-.4);

      // Keep the copy field quiet and the image border in the studio black.
      float vignette = 1.-.19*smoothstep(.36,.89,length((v_uv-.5)*vec2(.9,1.)));
      color *= vignette;
      float grain = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
      color += grain*.003;
      gl_FragColor = vec4(color,1.);
    }
  `;
  const uniforms = {};
  function shader(kind, code) {
    const s = gl.createShader(kind);
    gl.shaderSource(s, code); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function resize() {
    if (!gl) return;
    const rect = canvas.getBoundingClientRect();
    // Cap live device pixel ratio; exports explicitly use a DPR of 1.
    const ratio = exporting ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    width = Math.max(1,Math.round(rect.width*ratio));
    height = Math.max(1,Math.round(rect.height*ratio));
    canvas.width = width; canvas.height = height;
    gl.viewport(0,0,width,height);
    render(elapsed);
  }
  function render(seconds = 0) {
    if (!gl || !image) return;
    gl.useProgram(program);
    gl.uniform1f(uniforms.u_time, ((seconds%12)+12)%12);
    gl.uniform2f(uniforms.u_resolution,width,height);
    gl.uniform2f(uniforms.u_imageSize,image.naturalWidth,image.naturalHeight);
    gl.uniform2f(uniforms.u_pointer,exporting?0:mouseX,exporting?0:mouseY);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function tick(now) {
    if (paused || !visible) return;
    if (last) elapsed += Math.min((now-last)/1000,.05);
    last = now;
    mouseX += (targetX-mouseX)*.035;
    mouseY += (targetY-mouseY)*.035;
    render(elapsed);
    raf = requestAnimationFrame(tick);
  }
  async function init() {
    try {
      gl = canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:exporting,powerPreference:'low-power'});
      if (!gl) throw new Error('WebGL unavailable; displaying static poster.');
      program = gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(program,'a_position');
      gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      for (const key of ['u_image','u_time','u_resolution','u_imageSize','u_pointer']) uniforms[key]=gl.getUniformLocation(program,key);
      image = new Image(); image.src='assets/keyvisual.webp'; await image.decode();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
      gl.uniform1i(uniforms.u_image,0);
      resize(); render(0); canvas.classList.add('is-ready'); initialized = true;
      resolveReady({ok:true});
      if (!exporting && !paused) raf=requestAnimationFrame(tick);
    } catch(error) {
      console.warn(error.message); canvas.style.display='none';
      gl=null; resolveReady({ok:false,error:error.message});
    }
  }
  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove',event=>{
    if (paused || reduced.matches || event.pointerType==='touch') return;
    targetX=event.clientX/innerWidth-.5; targetY=event.clientY/innerHeight-.5;
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{
    visible=!document.hidden; last=0; cancelAnimationFrame(raf);
    if(visible&&!paused&&!exporting&&initialized) raf=requestAnimationFrame(tick);
  });
  reduced.addEventListener('change',()=>api.setPaused(reduced.matches));
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault(); cancelAnimationFrame(raf); canvas.style.display='none';
  });
  init();
})();
