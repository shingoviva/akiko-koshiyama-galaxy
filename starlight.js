/* Sparse optical stars on an independent 2D canvas. Never changes the galaxy shader. */
window.createStarlight=function(initiallyPaused,skyAngleForFrame){
 'use strict';
 skyAngleForFrame=skyAngleForFrame||(()=>0);
 const canvas=document.createElement('canvas');canvas.id='starlight';canvas.setAttribute('aria-hidden','true');
 const base=document.querySelector('#cosmos');base.after(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return{setPaused(){}};
 const constrained=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
 const pixelBudget=constrained?480000:950000,maxDpr=constrained?1:1.25;
 const coarse=matchMedia('(pointer:coarse)').matches;
 let paused=initiallyPaused,clock=0,last=null,frame=0,next=0,w=0,h=0,offset=0,rects=[];
 function sprite(strong){
  const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.translate(48,48);
  const halo=g.createRadialGradient(0,0,0,0,0,40);halo.addColorStop(0,'rgba(202,228,255,.55)');halo.addColorStop(.13,'rgba(161,207,255,.28)');halo.addColorStop(.42,'rgba(107,168,255,.075)');halo.addColorStop(1,'rgba(90,147,255,0)');g.fillStyle=halo;g.fillRect(-40,-40,80,80);
  if(strong){g.fillStyle='rgba(226,242,255,.40)';for(let i=0;i<4;i++){g.save();g.rotate(i*Math.PI/2);g.beginPath();g.moveTo(-1.25,0);g.lineTo(0,-30);g.lineTo(1.25,0);g.closePath();g.fill();g.restore()}}
  const core=g.createRadialGradient(0,0,0,0,0,3);core.addColorStop(0,'rgba(255,255,255,1)');core.addColorStop(.4,'rgba(238,249,255,1)');core.addColorStop(1,'rgba(174,218,255,0)');g.fillStyle=core;g.fillRect(-3,-3,6,6);return c;
 }
 const large=sprite(true),small=sprite(false);
 const stars=[[.12,.24],[.88,.37],[.18,.73],[.84,.86]].map(([x,y])=>({x:x+(Math.random()-.5)*.035,y:y+(Math.random()-.5)*.06,strong:true,phase:Math.random()*Math.PI*2,rate:.45+Math.random()*.40}));
 for(let i=0;i<8;i++)stars.push({x:.07+Math.random()*.86,y:.12+Math.random()*.78,strong:false,phase:Math.random()*Math.PI*2,rate:.7+Math.random()*.65});
 function size(){const nw=innerWidth;if(coarse&&w===nw)return;w=nw;h=coarse?Math.max(innerHeight,screen.height):innerHeight;const ratio=Math.min(devicePixelRatio||1,maxDpr,Math.sqrt(pixelBudget/(w*h)));canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(ratio,0,0,ratio,0,0);rects=[]}
 function draw(now){frame=0;if(document.hidden)return;if(now<next){if(!paused)frame=requestAnimationFrame(draw);return}next=now+1000/30-1;const dt=last===null?0:Math.min((now-last)/1000,.1);last=now;if(!paused){clock+=dt;offset+=(Math.max(0,scrollY)*.005-offset)*(1-Math.exp(-dt/.65))}
  for(const r of rects)ctx.clearRect(r.x,r.y,r.size,r.size);
  const angle=skyAngleForFrame(),cos=Math.cos(angle),sin=Math.sin(angle);
  for(let i=0;i<stars.length;i++){const s=stars[i];const wave=.5+.5*Math.sin(clock*s.rate+s.phase),pulse=Math.pow(wave,s.strong?3:4),extent=s.strong?16+11*pulse:10+5*pulse;const sx=(s.x-.5)*w,sy=(s.y-.5)*h;const x=w*.5+cos*sx+sin*sy,y=h*.5-sin*sx+cos*sy-offset;ctx.globalAlpha=s.strong?.22+.43*pulse:.07+.38*pulse;ctx.drawImage(s.strong?large:small,x-extent/2,y-extent/2,extent,extent);const r=rects[i]||(rects[i]={});r.x=x-extent/2-2;r.y=y-extent/2-2;r.size=extent+4}ctx.globalAlpha=1;if(!paused)frame=requestAnimationFrame(draw);
 }
 function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
 function reveal(){if(base.classList.contains('galaxy-ready')){canvas.classList.add('starlight-ready');observer.disconnect()}}
 const observer=new MutationObserver(reveal);observer.observe(base,{attributes:true,attributeFilter:['class']});reveal();size();request();
 addEventListener('resize',()=>{size();next=0;request()},{passive:true});document.addEventListener('visibilitychange',()=>{last=null;if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()});
 // Deliberate upper-left triple tap: independent, event-driven meteor canvas.
 const meteorCanvas=document.createElement('canvas');meteorCanvas.id='meteors';meteorCanvas.setAttribute('aria-hidden','true');canvas.after(meteorCanvas);
 const meteorCtx=meteorCanvas.getContext('2d',{alpha:true});
 if(meteorCtx){
  let meteorFrame=0,meteorLast=null,meteors=[],tapCount=0,tapLast=0,down=null,mw=0,mh=0;
  const limit=constrained?48:96;
  function meteorSize(){mw=innerWidth;mh=innerHeight;const d=Math.min(devicePixelRatio||1,maxDpr,Math.sqrt(pixelBudget/(mw*mh)));meteorCanvas.width=Math.round(mw*d);meteorCanvas.height=Math.round(mh*d);meteorCanvas.style.width=mw+'px';meteorCanvas.style.height=mh+'px';meteorCtx.setTransform(d,0,0,d,0,0)}
  const streak=document.createElement('canvas');streak.width=1024;streak.height=64;
  const brush=streak.getContext('2d');
  // Cached high-resolution tapered emission: a narrow white core and soft cool wake.
  const trail=brush.createLinearGradient(0,0,1024,0);trail.addColorStop(0,'rgba(250,252,255,.96)');trail.addColorStop(.06,'rgba(232,243,255,.72)');trail.addColorStop(.25,'rgba(204,222,246,.34)');trail.addColorStop(.65,'rgba(184,207,236,.08)');trail.addColorStop(1,'rgba(184,207,236,0)');
  brush.fillStyle=trail;brush.shadowColor='rgba(196,219,249,.55)';brush.shadowBlur=7;brush.beginPath();brush.moveTo(0,29.5);brush.lineTo(1024,32);brush.lineTo(0,34.5);brush.closePath();brush.fill();brush.shadowBlur=0;brush.globalAlpha=.65;brush.beginPath();brush.moveTo(0,31.2);brush.lineTo(840,32);brush.lineTo(0,32.8);brush.closePath();brush.fill();

  function meteorDraw(now){meteorFrame=0;if(document.hidden)return;const dt=meteorLast===null?0:Math.min((now-meteorLast)/1000,.06);meteorLast=now;meteorCtx.clearRect(0,0,mw,mh);
   for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];m.age+=dt;m.x-=m.speed*dt;m.y+=m.speed*m.slope*dt;const fade=Math.min(1,m.age/.06)*Math.min(1,(m.life-m.age)/.18);if(m.age>=m.life||m.x+m.tail<0){meteors.splice(i,1);continue}meteorCtx.save();meteorCtx.translate(m.x,m.y);meteorCtx.rotate(-Math.atan(m.slope));
    // Short shutter integration joins fast frame-to-frame motion without leaving stale pixels.
    const exposure=Math.min(dt*.75,.024),travel=m.speed*Math.sqrt(1+m.slope*m.slope)*exposure,samples=constrained?2:3,alpha=Math.max(0,fade)*m.light;
    meteorCtx.imageSmoothingEnabled=true;meteorCtx.imageSmoothingQuality='high';
    for(let j=0;j<samples;j++){meteorCtx.globalAlpha=alpha/samples;meteorCtx.drawImage(streak,travel*j/(samples-1),-m.width*4,m.tail,m.width*8)}
    meteorCtx.globalAlpha=alpha*.8;meteorCtx.drawImage(small,-m.width*3,-m.width*3,m.width*6+travel,m.width*6);meteorCtx.restore();}
   if(meteors.length)meteorFrame=requestAnimationFrame(meteorDraw);else meteorLast=null;
  }
  function launch(count){if(!mw)meteorSize();for(let i=0;i<count;i++){if(meteors.length>=limit)meteors.shift();meteors.push({x:mw*(.78+Math.random()*.35),y:mh*(-.03+Math.random()*.25),speed:mw*(1.45+Math.random()*1.2),slope:.58+Math.random()*.45,tail:mw*(.36+Math.random()*.64),width:.65+Math.random()*1.15,life:.65+Math.random()*.4,age:0,light:.6+Math.random()*.4})}if(!meteorFrame){meteorLast=null;meteorFrame=requestAnimationFrame(meteorDraw)}}
  function inZone(e){return e.clientX>=0&&e.clientX<=Math.min(140,innerWidth*.26)&&e.clientY>=110&&e.clientY<=Math.min(230,innerHeight*.36)&&!e.target.closest('a,button,input,select,textarea,summary,dialog')}
  addEventListener('pointerdown',e=>{down=e.isPrimary&&inZone(e)?{x:e.clientX,y:e.clientY,time:performance.now(),id:e.pointerId}:null},{passive:true});
  addEventListener('pointerup',e=>{const now=performance.now();if(!down||e.pointerId!==down.id||!inZone(e)||now-down.time>400||Math.hypot(e.clientX-down.x,e.clientY-down.y)>12){down=null;tapCount=0;return}down=null;tapCount=now-tapLast<450?tapCount+1:1;tapLast=now;if(tapCount>=3)launch(Math.min(6,tapCount-2))},{passive:true});
  addEventListener('pointercancel',()=>{down=null;tapCount=0},{passive:true});
  addEventListener('resize',()=>{if(mw){meteors=[];cancelAnimationFrame(meteorFrame);meteorFrame=0;meteorLast=null;meteorSize()}},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){meteors=[];tapCount=0;down=null;cancelAnimationFrame(meteorFrame);meteorFrame=0;meteorLast=null;meteorCtx.clearRect(0,0,mw,mh)}});
 }
 return{setPaused(value){paused=value;last=null;next=0;request()},renderer:'canvas2d'};
};
