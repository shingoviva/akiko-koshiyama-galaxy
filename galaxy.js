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
 uniform vec4 wanderers[5];
 float hash(vec2 p){vec3 h=fract(vec3(p.x,p.y,p.x)*.1031+scene.xyx*.013);h+=dot(h,h.yzx+33.33);return fract((h.x+h.y)*h.z);}
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
  // Irregular large-scale cloud envelope rather than a repeating sinusoidal ribbon.
  float broad=noise(vec2(p.x*.8,scene.z*7.1));
  float edge=noise(vec2(p.x*1.7,13.3+scene.z*3.));
  float bend=(broad-.5)*.32+(edge-.5)*.14;
  // Project the viewport onto the band normal, keeping coverage stable in portrait/landscape.
  float angle=.27;
  float span=(abs(sin(angle))*resolution.x+abs(cos(angle))*resolution.y)/min(resolution.x,resolution.y);
  float width=(.13+.035*broad)*coverage*max(1.,span);
  float d=(p.y-bend)/width;
  return exp(-d*d*.5);
 }
 vec3 stars(vec2 p,float scale,float layer,float density,float t){
  // Rotate and gently warp each layer independently so no shared rows survive.
  vec2 grid=turn(layer*1.137+scene.z*.31)*p*scale;
  grid+=vec2(sin(p.y*7.13+p.x*3.17+layer),cos(p.x*8.71-p.y*2.43+layer))*1.3;
  vec2 base=floor(grid);
  vec3 result=vec3(0.);
  // Evaluate neighbours so full-cell jitter never clips a star at a tile boundary.
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 id=base+vec2(float(x),float(y)),f=grid-id;
  float seed=hash(id+layer*17.3);
  float retained=step(hash(id+vec2(419.3,157.9)+layer*53.7),.28);
  float present=step(seed,.045+density*.66)*retained;
  if(present<.5)continue;
  vec2 center=vec2(hash(id+31.7+layer),hash(id+87.1-layer))*.96+.02;
  // Each particle has its own oscillatory drift: no rigid sheet translation.
  center+=.065*vec2(sin(t*(.045+seed*.055)+seed*41.),cos(t*(.035+seed*.048)+seed*73.));
  float dist=length(f-center);
  float radius=max(mix(.038,.17,pow(hash(id+layer+12.3),2.6)),.35*scale/cssShort);
  float aa=scale/min(resolution.x,resolution.y);
  float selected=step(.76,hash(id+vec2(307.1,29.4)+layer*41.));
  float jewel=step(3.5,layer)*selected;
  if(dist>max(radius+aa*.6,jewel*scale/cssShort*3.))continue;
  float core=1.-smoothstep(max(0.,radius-aa*.6),radius+aa*.6,dist);


  // Most grains remain steady; only a sparse, independently seeded subset twinkles.
  float phase=hash(id+vec2(193.7,81.2)+layer*9.1)*6.2831853;
  // Independent ~77–230 second cycles with gradual, individually varied brightness envelopes.
  float rate=mix(.021,.063,hash(id+vec2(51.8,217.3)+layer*23.));
  float wave=.5+.5*sin(t*rate*1.3+phase);
  float envelope=smoothstep(0.,1.,wave);
  float curve=mix(1.4,2.8,hash(id+vec2(73.2,351.6)+layer*11.));
  float visibility=pow(envelope,curve);
  float depth=mix(.50,1.,hash(id+vec2(271.8,63.5)+layer*7.));
  float peak=mix(.50,1.02,selected);
  // Gentle independent ~4–13 second scintillation above the slow breathing cycle.
  float microPhase=hash(id+vec2(119.4,263.7)+layer*31.1)*6.2831853;
  float microRate=mix(.7,1.9,hash(id+vec2(347.9,54.3)+layer*13.7));
  float microWave=.5+.5*sin(t*microRate*1.3+microPhase);
  float microAmount=mix(.04,.10,hash(id+vec2(83.6,179.2)+layer*47.3))+selected*.22;
  float sparkle=(.16+peak*visibility*depth)*(1.-microAmount+2.*microAmount*microWave);
  sparkle+=.035*microWave*microWave;
  float bright=mix(.21,1.48,pow(hash(id+42.8),3.));
  vec3 tint=mix(vec3(.40,.59,.95),vec3(.89,.94,1.),hash(id+19.));
  // Brighter stars gain a crisp white-blue core, without amplifying the dusty halo.
  vec3 pinLight=vec3(.86,.94,1.)*core*present*selected*(.18+1.05*visibility)*(.45+1.1*microWave*microWave);
  // Omit intrinsically faint grains; keep the bright-core group and naturally bright stars.
  // The selection is stable over time, avoiding threshold-driven popping during twinkles.
  float clearStar=max(selected,step(.8,bright));
  float rPx=dist*cssShort/scale;
  vec2 dPx=(f-center)*cssShort/scale;
  float glimmer=pow(microWave,5.)*jewel;
  float halo=.33*exp(-rPx/1.05);
  float rays=.35*(exp(-abs(dPx.x)*3.-abs(dPx.y)/1.3)+exp(-abs(dPx.y)*3.-abs(dPx.x)/1.3));
  vec3 sparkleLight=vec3(.73,.86,1.)*(halo+rays)*glimmer;
  result+=((tint*core*present*bright*sparkle+pinLight)*clearStar+sparkleLight);
  }
  return result;
 }
 void main(){
  vec2 p=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);
  float t=clock;
  vec2 farP=p-vec2(0.,camera*.24);
  vec2 midP=p-vec2(0.,camera*.65);
  vec2 nearP=p-vec2(0.,camera*1.12);
  vec2 q=flow(midP,t*10.14);
  float ribbon=band(q,1.35);
  vec2 cloud=q*4.6+vec2(t*.00019,-t*.00014);
  // Hierarchical gas masses and cavities, rather than stretched luminous ribbons.
  // Normalized coordinates keep all field operations bounded on mobile GPUs.
  vec2 warp=vec2(fbm(cloud*.62+t*.00025),fbm(cloud*.62+7.1-t*.00025))-.4375;
  vec2 domain=cloud+warp*.65;
  float bulk=fbm(domain*.74);
  float medium=fbm(domain*2.6+vec2(13.1,7.7));
  float detail=fbm(domain*8.2+vec2(t*.00028,0.));
  float folds=clamp(bulk*.56+medium*.29+detail*.15,0.,1.);
  // Soft coverage biases the composition without forcing gas into a single band.
  ribbon=mix(.38,1.,ribbon);
  float mass=smoothstep(.22,.65,folds);
  float dust=pow(mass,1.45)*ribbon;
  float vein=fbm(domain*1.8+vec2(31.7,19.2));
  float ridge=abs(vein-.43);
  float darkLane=smoothstep(.44,.61,vein+medium*.17-detail*.12)*.86;
  float cavity=smoothstep(.49,.66,bulk)*(1.-smoothstep(.30,.44,medium));
  darkLane=max(darkLane,cavity*.82);
  float edge=(1.-smoothstep(.025,.13,ridge))*(.35+detail*.65);
  float filaments=edge*(.28+detail*.9)*smoothstep(.25,.55,folds);
  float wisps=clamp(medium*.65+detail*.55+filaments*.3,0.,1.);
  float violet=smoothstep(.27,.61,noise(cloud*.53+vec2(17.3,scene.z*4.)))*.82;
  vec3 cloudTint=mix(vec3(.051,.138,.35),vec3(.25,.075,.39),violet*.9);
  vec3 col=vec3(.002,.004,.010);
  col+=vec3(.002,.005,.011)*(.45+folds*.55);
  col+=cloudTint*dust*(.4+wisps*.9)*(1.-darkLane*.88);
  col+=vec3(.006,.016,.036)*ribbon;
  col+=vec3(.043,.103,.225)*pow(ribbon,3.)*pow(wisps,3.);
  col+=vec3(.045,.105,.22)*filaments*ribbon*(1.-darkLane*.85);
  // Dark sky with localized luminous blue/violet screen-blended cloud highlights.
  float opticalMask=pow(ribbon,1.8)*pow(folds,.9)*(.55+wisps*.45)*(1.-darkLane*.8);
  col*=.72;
  float hot=(smoothstep(.47,.67,folds)*(.65+detail*.6)+filaments*.18)*pow(ribbon,1.5)*(1.-darkLane*.88);
  vec3 opticalTint=mix(vec3(.16,.3,.52),vec3(.52,.19,.68),violet);
  vec3 opticalLight=clamp(opticalTint*opticalMask*.82+mix(vec3(.48,.65,1.),vec3(.8,.38,1.),violet)*hot*2.05,0.,1.);
  col=mix(col,vec3(1.)-(vec3(1.)-col)*(vec3(1.)-opticalLight),.39);
  float density=pow(ribbon,1.8225)*(.28+folds*.75)*(1.-darkLane*.45);
  col+=stars(q,175.,1.,density,t)*.69;
  col+=stars(flow(farP,t*9.2274)+3.71,285.,2.,density,t)*.48;
  col+=stars(flow(nearP,t*10.8498)-8.31,420.,3.,density,t)*.32;
  // Rare brighter grains remain round, with restrained bloom and no diffraction lines.
  col+=stars(flow(nearP,t*10.14)+11.73,62.,4.,density*.16,t)*.63;
  // Just five independent grains, matching the existing stars in apparent size.
  // Their positions are calculated once per frame on the CPU, not per fragment.
  for(int i=0;i<5;i++){
   vec4 star=wanderers[i];
   vec2 delta=(p-star.xy+vec2(0.,camera*.45))*cssShort;
   if(max(abs(delta.x),abs(delta.y))<2.){
    float aa=cssShort/min(resolution.x,resolution.y);
    float point=1.-smoothstep(max(0.,star.z-aa*.55),star.z+aa*.55,length(delta));
    col+=vec3(.82,.91,1.)*point*star.w;
   }
  }
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
  // A restrained contrast curve deepens the dark sky while preserving luminous cores.
  col=pow(max(col,vec3(0.)),vec3(1.035))*.98;
  gl_FragColor=vec4(col,1.);
 }`;
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader}
 const wandererData=new Float32Array(20);
 const wandererSeeds=Array.from({length:5},()=>({phase:Math.random()*Math.PI*2,rate:.75+Math.random()*.5,radius:.38+Math.random()*.16,light:.72+Math.random()*.18}));
 let program,resolution,clock,cssShort,sceneUniform,cameraUniform,wandererUniform;
 function updateWanderers(){
  const short=Math.min(viewWidth,viewHeight);
  wandererSeeds.forEach((s,i)=>{
   const t=elapsed*s.rate*6.;
   wandererData[i*4]=(.35*Math.sin(t*.00035+s.phase)+.055*Math.sin(t*.00081+s.phase*2.17))*viewWidth/short;
   wandererData[i*4+1]=(.35*Math.cos(t*.00029+s.phase*1.37)+.055*Math.sin(t*.00067+s.phase*3.11))*viewHeight/short;
   wandererData[i*4+2]=s.radius;
   wandererData[i*4+3]=s.light*(.94+.06*Math.sin(elapsed*.689+s.phase));
  });
  gl.uniform4fv(wandererUniform,wandererData);
 }
 function setup(){
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  resolution=gl.getUniformLocation(program,'resolution');clock=gl.getUniformLocation(program,'clock');cssShort=gl.getUniformLocation(program,'cssShort');sceneUniform=gl.getUniformLocation(program,'scene');cameraUniform=gl.getUniformLocation(program,'camera');gl.uniform3fv(sceneUniform,scene);wandererUniform=gl.getUniformLocation(program,'wanderers[0]');
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
  if(!paused||dirty){size();gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(clock,elapsed);gl.uniform1f(cssShort,Math.min(viewWidth,viewHeight));gl.uniform1f(cameraUniform,scrollPosition*.035/Math.min(viewWidth,viewHeight));updateWanderers();gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;reveal(canvas);}
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
