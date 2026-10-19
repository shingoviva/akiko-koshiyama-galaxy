/* Sparse optical stars on an independent 2D canvas. Never changes the galaxy shader. */
window.createStarlight=function(initiallyPaused){
 'use strict';
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
  for(let i=0;i<stars.length;i++){const s=stars[i];const wave=.5+.5*Math.sin(clock*s.rate+s.phase),pulse=Math.pow(wave,s.strong?3:4),extent=s.strong?16+11*pulse:10+5*pulse;const x=s.x*w,y=s.y*h-offset;ctx.globalAlpha=s.strong?.22+.43*pulse:.07+.38*pulse;ctx.drawImage(s.strong?large:small,x-extent/2,y-extent/2,extent,extent);const r=rects[i]||(rects[i]={});r.x=x-extent/2-2;r.y=y-extent/2-2;r.size=extent+4}ctx.globalAlpha=1;if(!paused)frame=requestAnimationFrame(draw);
 }
 function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
 function reveal(){if(base.classList.contains('galaxy-ready')){canvas.classList.add('starlight-ready');observer.disconnect()}}
 const observer=new MutationObserver(reveal);observer.observe(base,{attributes:true,attributeFilter:['class']});reveal();size();request();
 addEventListener('resize',()=>{size();next=0;request()},{passive:true});document.addEventListener('visibilitychange',()=>{last=null;if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()});
 return{setPaused(value){paused=value;last=null;next=0;request()},renderer:'canvas2d'};
};
