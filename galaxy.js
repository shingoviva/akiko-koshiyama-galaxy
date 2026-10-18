/* Continuous procedural galaxy. Identical scene and shader on every device. */
window.createGalaxy=function(canvas,initiallyPaused){
 'use strict';
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
 let paused=initiallyPaused,elapsed=0,last=null,frame=0,dirty=true,lost=false,nextPaint=0;
 const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;
 uniform vec2 resolution;
 uniform float clock;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+3.71;a*=.5;}return v;}
 mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
 // Shared smooth flow carries both dust and stars. The shared current moves gently; stars retain individual drift.
 vec2 flow(vec2 p,float t){
  p=turn(.27+sin(t*.002)*.07)*p;
  float r=length(p);
  p=turn(t*.0018/(1.+r*.55))*p;
  p+=vec2(sin(p.y*2.4+t*.004),cos(p.x*2.1-t*.003))*.075;
  return p;
 }
 float band(vec2 p){
  float bend=.19*sin(p.x*2.1)+.08*sin(p.x*4.2+1.7);
  float width=.105+.055*(.5+.5*sin(p.x*2.5+.6));
  float d=(p.y-bend)/width;
  return exp(-d*d*.5);
 }
 vec3 stars(vec2 p,float scale,float layer,float density,float t){
  vec2 grid=p*scale,id=floor(grid),f=fract(grid);
  float seed=hash(id+layer*17.3);
  vec2 center=vec2(hash(id+31.7+layer),hash(id+87.1-layer))*.66+.17;
  // Each particle has its own oscillatory drift: no rigid sheet translation.
  center+=.065*vec2(sin(t*(.045+seed*.055)+seed*41.),cos(t*(.035+seed*.048)+seed*73.));
  float dist=length(f-center);
  float radius=mix(.035,.18,pow(hash(id+layer+12.3),2.6));
  float aa=scale/min(resolution.x,resolution.y);
  float core=1.-smoothstep(max(0.,radius-aa*.6),radius+aa*.6,dist);
  float halo=exp(-dist*dist/(radius*radius*5.))* .14;
  // Independent thinning keeps the galactic density profile and twinkle distribution.
  float retained=step(hash(id+vec2(419.3,157.9)+layer*53.7),.28);
  float present=step(seed,.025+density*.66)*retained;
  // Most grains remain steady; only a sparse, independently seeded subset twinkles.
  float phase=hash(id+vec2(193.7,81.2)+layer*9.1)*6.2831853;
  // Independent 50–150 second cycles, with long dim intervals and soft appearances.
  float rate=mix(.042,.126,hash(id+vec2(51.8,217.3)+layer*23.));
  float wave=.5+.5*sin(t*rate+phase);
  float visibility=smoothstep(.60,.96,wave);
  float selected=step(.90,hash(id+vec2(307.1,29.4)+layer*41.));
  float sparkle=mix(.025+.61*visibility,.045+.73*visibility,selected);
  float bright=mix(.21,1.48,pow(hash(id+42.8),3.));
  vec3 tint=mix(vec3(.40,.59,.95),vec3(.89,.94,1.),hash(id+19.));
  return tint*(core+halo)*present*bright*sparkle;
 }
 void main(){
  vec2 p=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);
  float t=clock;
  vec2 q=flow(p,t*3.9);
  float ribbon=band(q);
  vec2 cloud=q*3.5+vec2(t*.0008,-t*.0006);
  float folds=fbm(cloud+vec2(noise(cloud*.8+t*.001),noise(cloud*.8+7.1-t*.001)));
  float wisps=fbm(q*15.+folds*2.+vec2(t*.0012,0.));
  float dust=pow(folds,1.65)*ribbon;
  float darkLane=smoothstep(.40,.66,fbm(q*8.1+vec2(3.7,t*.0004)));
  vec3 col=vec3(.003,.006,.016);
  col+=vec3(.026,.086,.24)*dust*(.55+wisps*.8)*(1.-darkLane*.68);
  col+=vec3(.033,.078,.17)*pow(ribbon,3.)*pow(wisps,3.);
  float density=ribbon*(.28+folds*.75)*(1.-darkLane*.45);
  col+=stars(q,175.,1.,density,t)*.69;
  col+=stars(flow(p,t*3.549)+3.71,285.,2.,density,t)*.48;
  col+=stars(flow(p,t*4.173)-8.31,420.,3.,density,t)*.32;
  // Rare brighter grains remain round, with restrained bloom and no diffraction lines.
  col+=stars(q+11.73,62.,4.,density*.16,t)*.63;
  gl_FragColor=vec4(col,1.);
 }`;
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader}
 let program,resolution,clock;
 function setup(){
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  resolution=gl.getUniformLocation(program,'resolution');clock=gl.getUniformLocation(program,'clock');
 }
 function size(){
  const w=innerWidth,h=Math.max(innerHeight,document.documentElement.clientHeight),ratio=Math.min(devicePixelRatio||1,1.25,Math.sqrt(950000/(w*h)));
  const width=Math.round(w*ratio),height=Math.round(h*ratio);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;dirty=true}
 }
 function draw(now){
  frame=0;if(document.hidden||lost)return;
  // A 30 fps ceiling is sufficient for slow currents and soft twinkling.
  if(!dirty&&now<nextPaint){if(!paused)frame=requestAnimationFrame(draw);return}
  nextPaint=now+1000/30-1;
  if(last!==null&&!paused)elapsed+=Math.min((now-last)/1000,.08);last=now;
  if(!paused||dirty){size();gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(clock,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;}
  if(!paused)frame=requestAnimationFrame(draw);
 }
 function request(){if(!frame&&!lost&&!document.hidden)frame=requestAnimationFrame(draw)}
 // Static Canvas fallback retains dense, blue galactic structure if WebGL is unavailable.
 if(!gl){
  const replacement=document.createElement('canvas');replacement.id=canvas.id;replacement.setAttribute('aria-hidden','true');canvas.replaceWith(replacement);
  const ctx=replacement.getContext('2d');
  function fallback(){const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,1.5);replacement.width=w*d;replacement.height=h*d;ctx.scale(d,d);ctx.fillStyle='#02040b';ctx.fillRect(0,0,w,h);let seed=727;function random(){seed=(seed*16807)%2147483647;return seed/2147483647}for(let i=0;i<26000;i++){const x=random()*w,y=random()*h,u=(x-w*.5)/Math.min(w,h),v=(y-h*.5)/Math.min(w,h),b=Math.exp(-Math.pow((v-.3*u-.18*Math.sin(u*2))/.17,2));if(random()>.025+b*.7)continue;ctx.fillStyle=`rgba(145,181,244,${.12+random()*.6})`;const r=.25+Math.pow(random(),5)*.8;ctx.fillRect(x,y,r,r)}}
  fallback();addEventListener('resize',fallback,{passive:true});return{setPaused(){},renderer:'canvas-static'};
 }
 setup();size();request();
 addEventListener('resize',()=>{size();request()},{passive:true});
 document.addEventListener('visibilitychange',()=>{last=null;if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;setup();dirty=true;last=null;request()});
 return{setPaused(value){paused=value;last=null;nextPaint=0;request()},renderer:'webgl'};
};
