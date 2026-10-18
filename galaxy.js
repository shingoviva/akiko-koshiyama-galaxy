/* Continuous procedural galaxy. Identical scene and shader on every device. */
window.createGalaxy=function(canvas,initiallyPaused){
 'use strict';
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
 let paused=initiallyPaused,elapsed=0,last=null,frame=0,dirty=true,lost=false,nextPaint=0;
 const scene=new Float32Array([Math.random()*71,Math.random()*71,Math.random()]);
 let scrollTarget=scrollY,scrollPosition=scrollY,viewWidth=0,viewHeight=0;
 const stableViewport=matchMedia('(pointer:coarse)').matches;
 let revealed=false;
 function reveal(surface){if(revealed)return;revealed=true;requestAnimationFrame(()=>requestAnimationFrame(()=>surface.classList.add('galaxy-ready')))}
 const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;
 uniform vec2 resolution;
 uniform float clock;
 uniform float cssShort;
 uniform vec3 scene;
 uniform float camera;
 float hash(vec2 p){return fract(sin(dot(p+scene.xy,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+3.71;a*=.5;}return v;}
 mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
 // Bounded, spatially varying currents: no global translation or accumulating rotation.
 // Incommensurate slow phases avoid an obvious shared rhythm; small gradients avoid folding.
 vec2 flow(vec2 p,float t){
  p=turn(.27)*p;
  vec2 base=p;
  float phase=scene.z*6.2831853;
  vec2 broad=vec2(sin(base.y*1.7+base.x*.4+t*.00071+phase),
                  cos(base.x*1.5-base.y*.3-t*.00043+phase*1.37));
  vec2 middle=vec2(cos(base.x*2.3-base.y*1.1-t*.00097+phase*2.11),
                   sin(base.y*2.1+base.x*.8+t*.00059+phase*.73));
  vec2 fine=vec2(sin(base.y*3.2+base.x*1.3+t*.00037+phase*1.83),
                 cos(base.x*2.9-base.y*1.5-t*.00083+phase*2.47));
  return base+broad*.030+middle*.018+fine*.012;
 }
 float band(vec2 p,float coverage){
  float bend=.15*sin(p.x*2.1+scene.z*6.2831853)+.06*sin(p.x*4.2+1.7+scene.z*4.);
  // Project the viewport onto the band normal, keeping coverage stable in portrait/landscape.
  float angle=.27;
  float span=(abs(sin(angle))*resolution.x+abs(cos(angle))*resolution.y)/min(resolution.x,resolution.y);
  float width=(.13+.035*(.5+.5*sin(p.x*2.5+.6)))*coverage*max(1.,span);
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
  float radius=max(mix(.038,.17,pow(hash(id+layer+12.3),2.6)),.35*scale/cssShort);
  float aa=scale/min(resolution.x,resolution.y);
  float core=1.-smoothstep(max(0.,radius-aa*.6),radius+aa*.6,dist);
  float halo=exp(-dist*dist/(radius*radius*5.))* .14;
  // Independent thinning keeps the galactic density profile and twinkle distribution.
  float retained=step(hash(id+vec2(419.3,157.9)+layer*53.7),.28);
  float present=step(seed,.045+density*.66)*retained;
  // Most grains remain steady; only a sparse, independently seeded subset twinkles.
  float phase=hash(id+vec2(193.7,81.2)+layer*9.1)*6.2831853;
  // Independent 100–300 second cycles with gradual, individually varied brightness envelopes.
  float rate=mix(.021,.063,hash(id+vec2(51.8,217.3)+layer*23.));
  float wave=.5+.5*sin(t*rate+phase);
  float envelope=smoothstep(0.,1.,wave);
  float curve=mix(1.4,2.8,hash(id+vec2(73.2,351.6)+layer*11.));
  float visibility=pow(envelope,curve);
  float depth=mix(.50,1.,hash(id+vec2(271.8,63.5)+layer*7.));
  float selected=step(.84,hash(id+vec2(307.1,29.4)+layer*41.));
  float peak=mix(.50,.82,selected);
  float sparkle=.16+peak*visibility*depth;
  float bright=mix(.21,1.48,pow(hash(id+42.8),3.));
  vec3 tint=mix(vec3(.40,.59,.95),vec3(.89,.94,1.),hash(id+19.));
  return tint*(core+halo)*present*bright*sparkle;
 }
 void main(){
  vec2 p=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);
  float t=clock;
  vec2 farP=p-vec2(0.,camera*.24);
  vec2 midP=p-vec2(0.,camera*.65);
  vec2 nearP=p-vec2(0.,camera*1.12);
  vec2 q=flow(midP,t*6.24);
  float ribbon=band(q,1.35);
  vec2 cloud=q*3.5+vec2(t*.00015,-t*.00011);
  float folds=fbm(cloud+vec2(noise(cloud*.8+t*.0002),noise(cloud*.8+7.1-t*.0002)));
  float wisps=fbm(q*15.+folds*2.+vec2(t*.00022,0.));
  float dust=pow(folds,1.65)*ribbon;
  float darkLane=smoothstep(.40,.66,fbm(q*8.1+vec2(3.7,t*.00008)));
  vec3 col=vec3(.003,.006,.016);
  col+=vec3(.002,.005,.011)*(.45+folds*.55);
  col+=vec3(.051,.138,.35)*dust*(.55+wisps*.8)*(1.-darkLane*.68);
  col+=vec3(.006,.016,.036)*ribbon;
  col+=vec3(.043,.103,.225)*pow(ribbon,3.)*pow(wisps,3.);
  float density=band(q,1.)*(.28+folds*.75)*(1.-darkLane*.45);
  col+=stars(q,175.,1.,density,t)*.69;
  col+=stars(flow(farP,t*5.6784)+3.71,285.,2.,density,t)*.48;
  col+=stars(flow(nearP,t*6.6768)-8.31,420.,3.,density,t)*.32;
  // Rare brighter grains remain round, with restrained bloom and no diffraction lines.
  col+=stars(flow(nearP,t*6.24)+11.73,62.,4.,density*.16,t)*.63;
  // One isolated glint per ~1.5–3 minutes. No rapid flickering or simultaneous flashes.
  float cycle=floor(t/135.);
  float start=35.+hash(vec2(cycle+23.1,91.7))*45.;
  float age=mod(t,135.)-start;
  if(age>0.&&age<3.8){
   float envelope=smoothstep(0.,1.1,age)*(1.-smoothstep(1.3,3.8,age));
   vec2 anchor=(vec2(hash(vec2(cycle+61.4,7.9)),hash(vec2(cycle+13.2,83.6)))-.5)*.72;
   anchor*=resolution/min(resolution.x,resolution.y);
   vec2 delta=(p-anchor)*cssShort;
   float distance=length(delta);
   float core=2.4*exp(-distance*distance/1.05);
   float bloom=.32*exp(-distance/3.1);
   float rays=.48*(exp(-abs(delta.x)*2.-abs(delta.y)/4.5)+exp(-abs(delta.y)*2.-abs(delta.x)/4.5));
   col+=vec3(.78,.89,1.)*(core+bloom+rays)*envelope;
  }
  gl_FragColor=vec4(col,1.);
 }`;
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader}
 let program,resolution,clock,cssShort,sceneUniform,cameraUniform;
 function setup(){
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  resolution=gl.getUniformLocation(program,'resolution');clock=gl.getUniformLocation(program,'clock');cssShort=gl.getUniformLocation(program,'cssShort');sceneUniform=gl.getUniformLocation(program,'scene');cameraUniform=gl.getUniformLocation(program,'camera');gl.uniform3fv(sceneUniform,scene);
 }
 function size(){
  const w=innerWidth;
  // Ignore mobile toolbar height changes: no rescale or reallocation while scrolling.
  if(stableViewport&&viewWidth===w)return;
  const h=stableViewport?Math.max(innerHeight,screen.height):Math.max(innerHeight,document.documentElement.clientHeight);
  viewWidth=w;viewHeight=h;canvas.style.width=w+'px';canvas.style.height=h+'px';
  const ratio=Math.min(devicePixelRatio||1,1.25,Math.sqrt(950000/(w*h)));
  const width=Math.round(w*ratio),height=Math.round(h*ratio);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;dirty=true}
 }
 function draw(now){
  frame=0;if(document.hidden||lost)return;
  // A 30 fps ceiling is sufficient for slow currents and soft twinkling.
  if(!dirty&&now<nextPaint){if(!paused)frame=requestAnimationFrame(draw);return}
  nextPaint=now+1000/30-1;
  const delta=last===null?0:Math.min((now-last)/1000,.1);last=now;
  if(!paused){elapsed+=delta;scrollPosition+=(scrollTarget-scrollPosition)*(1.-Math.exp(-delta/.65));}
  if(!paused||dirty){size();gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(clock,elapsed);gl.uniform1f(cssShort,Math.min(viewWidth,viewHeight));gl.uniform1f(cameraUniform,140.*Math.tanh(scrollPosition/3600.)/Math.min(viewWidth,viewHeight));gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;reveal(canvas);}
  if(!paused)frame=requestAnimationFrame(draw);
 }
 function request(){if(!frame&&!lost&&!document.hidden)frame=requestAnimationFrame(draw)}
 // Static Canvas fallback retains dense, blue galactic structure if WebGL is unavailable.
 if(!gl){
  const replacement=document.createElement('canvas');replacement.id=canvas.id;replacement.setAttribute('aria-hidden','true');canvas.replaceWith(replacement);
  const ctx=replacement.getContext('2d');
  function fallback(){const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,1.5);replacement.width=w*d;replacement.height=h*d;ctx.scale(d,d);ctx.fillStyle='#02040b';ctx.fillRect(0,0,w,h);let seed=1+Math.floor(scene[0]*1000000);function random(){seed=(seed*16807)%2147483647;return seed/2147483647}for(let i=0;i<26000;i++){const x=random()*w,y=random()*h,u=(x-w*.5)/Math.min(w,h),v=(y-h*.5)/Math.min(w,h),b=Math.exp(-Math.pow((v-.3*u-.18*Math.sin(u*2))/.17,2));if(random()>.025+b*.7)continue;ctx.fillStyle=`rgba(145,181,244,${.12+random()*.6})`;const r=.25+Math.pow(random(),5)*.8;ctx.fillRect(x,y,r,r)}}
  fallback();reveal(replacement);addEventListener('resize',fallback,{passive:true});return{setPaused(){},renderer:'canvas-static'};
 }
 addEventListener('scroll',()=>{scrollTarget=Math.max(0,scrollY)},{passive:true});
 setup();size();request();
 addEventListener('resize',()=>{size();request()},{passive:true});
 document.addEventListener('visibilitychange',()=>{last=null;if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;setup();dirty=true;last=null;request()});
 return{setPaused(value){paused=value;last=null;nextPaint=0;request()},renderer:'webgl'};
};
