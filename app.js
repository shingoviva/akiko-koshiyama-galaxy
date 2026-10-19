// Interruptible transitions: state updates immediately; motion never blocks taps.
const uiMotion=matchMedia('(prefers-reduced-motion: reduce)');
const uiAnimations=new WeakMap();
function animateUI(element,frames,options={}){if(!element||uiMotion.matches||typeof element.animate!=='function')return null;uiAnimations.get(element)?.cancel();const animation=element.animate(frames,{duration:420,easing:'cubic-bezier(.22,1,.36,1)',...options});uiAnimations.set(element,animation);return animation}
function revealCollection(from=0){Array.from(gallery.querySelectorAll('.work')).slice(from).forEach((el,i)=>animateUI(el,[{opacity:0,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:520,delay:Math.min(i,5)*38,fill:'backwards'}))}
const icon=name=>`<img class="icon icon-${name}" src="assets/icons/${name}.svg" alt="" aria-hidden="true" width="24" height="24">`;
// Fit complete titles to their available width without truncating or wrapping.
let titleFitFrame=0;
function scheduleTitleFit(){if(titleFitFrame)return;titleFitFrame=requestAnimationFrame(()=>{titleFitFrame=0;document.querySelectorAll('.work-caption h3, #view-title').forEach(title=>{if(!title.getBoundingClientRect().width)return;title.style.fontSize='';const size=parseFloat(getComputedStyle(title).fontSize),available=title.clientWidth,needed=title.scrollWidth;if(needed>available&&available>0)title.style.fontSize=(size*available/needed*.985)+'px'})})}
addEventListener('resize',scheduleTitleFit,{passive:true});if(document.fonts?.ready)document.fonts.ready.then(scheduleTitleFit);
const works=[
 {
  "category": "inner",
  "img": "p3-1.jpg",
  "ja": "光の器（ひかりのうつわ）",
  "titleJa": "光の器",
  "reading": "ひかりのうつわ",
  "en": "Vessel of Light",
  "label": "VESSEL OF LIGHT",
  "textJa": "どんな困難も、\nあなたの光を輝かせるためにある。\nその光は、\nやがて誰かを照らしていく。",
  "textEn": "Every hardship is there\nto let your light shine.\nThat light\nwill one day illuminate someone else.",
  "authorProvided": true
 },
 {
  "category": "nature",
  "img": "p4-1.jpg",
  "ja": "心の奥に咲く花",
  "en": "A Flower Blooming Deep Within",
  "label": "INNER BLOOM",
  "textJa": "あなたの中には、美しい花がある。その花は、愛を知るたびに咲いてゆく。",
  "textEn": "Within you is a beautiful flower. Each time it comes to know love, it blooms.",
  "authorProvided": true
 },
 {
  "category": "inner",
  "img": "p4-0.jpg",
  "ja": "内なる静寂",
  "en": "Inner Stillness",
  "label": "INNER STILLNESS",
  "textJa": "静寂の中で、あなたの光は目を覚ます。\n心の奥に眠る真実は、静けさの中で姿を現す。",
  "textEn": "In stillness, your light awakens.\nThe truth sleeping deep within your heart reveals itself in the quiet.",
  "authorProvided": true
 },
 {
  "category": "body",
  "img": "p6-2.jpg",
  "ja": "地球",
  "en": "Earth",
  "label": "EARTH",
  "textJa": "今、地球は大きな変容の時を迎えています。\n\n一人ひとりの意識と選択が、\nこれからの未来を創っていく。\n\n私たちは今、どんな地球を創造するのかを問われています。",
  "textEn": "Earth is now entering a time of profound transformation.\n\nEach person’s awareness and choices\nshape the future ahead.\n\nWe are being asked what kind of Earth we wish to create.",
  "authorProvided": true
 },
 {
  "category": "nature",
  "img": "p6-1.jpg",
  "ja": "始まりの星",
  "en": "The Star of Beginnings",
  "label": "ORIGIN",
  "textJa": "すべての生命は、ひとつの始まりから生まれました。\n\nその命は受け継がれ、それぞれの輝きを放ちながら、今もつながっています。\n\nあなたはかけがえのない存在です。\nその美しさも、あなたに注がれる愛も、どうか忘れないでください。",
  "textEn": "All life was born from a single beginning.\n\nThat life is passed on, each being radiating its own light, still connected today.\n\nYou are irreplaceable.\nPlease never forget your beauty, or the love that flows to you.",
  "authorProvided": true
 },
 {
  "category": "body",
  "img": "amakudaru-mono.jpg",
  "ja": "天降る者（あまくだるもの）",
  "titleJa": "天降る者",
  "reading": "あまくだるもの",
  "en": "One Who Descends from Heaven",
  "label": "AMAKUDARU MONO",
  "textJa": "古の時代、この地に天から降り立った存在。\nその記憶は失われたのではない。\n私たち自身が思い出す時を待っている。",
  "textEn": "In ancient times, a being descended from heaven to this land.\nThat memory has not been lost.\nIt waits for us to remember.",
  "authorProvided": true
 },
 {
  "category": "body",
  "img": "p6-0.jpg",
  "ja": "上昇",
  "en": "Ascent",
  "label": "ASCENT",
  "textJa": "どこまでも高く、自由に。\n\n私たちはいつだって、\n自分の可能性を広げていくことができる。\n\n心を解き放ち、自分らしい未来へ",
  "textEn": "Ever higher, freely.\n\nWe can always\nexpand our possibilities.\n\nSet your heart free, toward a future that is truly your own",
  "authorProvided": true
 }
];
let english=false,current=0;const gallery=document.querySelector('#gallery'),dialog=document.querySelector('#viewer');
const PAGE_SIZE=6;let activeFilter='all',visibleLimit=works.length;
const filteredIndices=()=>works.map((w,i)=>i).filter(i=>activeFilter==='all'||works[i].category===activeFilter);
function renderCollection(){
 const matches=filteredIndices(),previousHeight=gallery.getBoundingClientRect().height;uiAnimations.get(gallery)?.cancel();gallery.replaceChildren();
 matches.slice(0,visibleLimit).forEach((i,pos)=>{const w=works[i],b=document.createElement('button');b.className='work';b.style.setProperty('--order',pos);b.innerHTML=`<div class="work-image"><img src="assets/${w.img}" loading="lazy" decoding="async" width="900" height="1200" alt="${english?w.en:w.ja}"><span class="work-plus" aria-hidden="true">${icon('plus')}</span></div><div class="work-caption"><h3>${english?w.en:w.ja}</h3><span>${String(i+1).padStart(2,'0')} / ${w.label}</span></div>`;b.addEventListener('click',()=>{current=i;renderWork();dialog.classList.remove('is-closing');dialog.showModal();scheduleTitleFit();document.body.style.overflow='hidden';animateUI(dialog,[{opacity:0,translate:'0 14px',scale:'.985'},{opacity:1,translate:'0 0',scale:'1'}])});gallery.append(b)});
 const nextHeight=gallery.getBoundingClientRect().height;if(previousHeight&&nextHeight!==previousHeight)animateUI(gallery,[{height:previousHeight+'px'},{height:nextHeight+'px'}],{duration:520});
 document.querySelector('#collection-count').textContent=english?`${Math.min(visibleLimit,matches.length)} of ${matches.length} works`:`${matches.length}作品中 ${Math.min(visibleLimit,matches.length)}作品`;
 document.querySelector('#more-works').hidden=visibleLimit>=matches.length;
 scheduleTitleFit();
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===activeFilter)));
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{if(activeFilter===b.dataset.filter)return;activeFilter=b.dataset.filter;visibleLimit=works.length;renderCollection();revealCollection()}));
document.querySelector('#more-works').onclick=()=>{const previous=visibleLimit;visibleLimit+=PAGE_SIZE;renderCollection();revealCollection(previous)};
let workRequest=0;
async function stepWork(direction){
 const matches=filteredIndices(),pos=matches.indexOf(current);current=matches[(pos+direction+matches.length)%matches.length];
 const request=++workRequest,index=current,preload=new Image();preload.src='assets/'+works[index].img;
 try{await preload.decode()}catch{}if(request!==workRequest||!dialog.open||viewerClosing)return;
 const pane=document.querySelector('.viewer-image'),image=document.querySelector('#view-img'),ghost=image.cloneNode();
 ghost.removeAttribute('id');ghost.alt='';ghost.setAttribute('aria-hidden','true');ghost.className='viewer-previous';
 // Keep the old frame visible until the incoming image is decoded.
 if(!uiMotion.matches)pane.append(ghost);renderWork();
 animateUI(image,[{opacity:0,translate:`${direction*14}px 0`},{opacity:1,translate:'0 0'}],{duration:460});
 const fade=animateUI(ghost,[{opacity:1,translate:'0 0'},{opacity:0,translate:`${-direction*10}px 0`}],{duration:460});
 if(fade)fade.finished.then(()=>ghost.remove(),()=>ghost.remove());else ghost.remove();
 animateUI(document.querySelector('.viewer-copy'),[{opacity:.45,translate:'0 4px'},{opacity:1,translate:'0 0'}],{duration:460});
}
renderCollection();
function renderWork(){const w=works[current];document.querySelector('#view-img').src='assets/'+w.img;document.querySelector('#view-img').alt=english?w.en:w.ja;document.querySelector('#view-title').textContent=english?w.en:w.ja;if(!english&&w.reading){const title=document.querySelector('#view-title');title.textContent=w.titleJa||w.ja;const reading=document.createElement('small');reading.className='work-reading';reading.textContent='（'+w.reading+'）';title.append(reading)}document.querySelector('#view-text').textContent=english?w.textEn:w.textJa;scheduleTitleFit();document.querySelector('#view-number').textContent=w.label;document.querySelector('#view-count').textContent=`${String(filteredIndices().indexOf(current)+1).padStart(2,'0')} / ${String(filteredIndices().length).padStart(2,'0')}`}
document.querySelector('#lang').onclick=()=>{english=!english;document.documentElement.lang=english?'en':'ja';document.querySelectorAll('[data-ja]').forEach(e=>e.innerHTML=e.dataset[english?'en':'ja']);document.querySelector('#lang').innerHTML=english?'EN <span>/ JP</span>':'JP <span>/ EN</span>';document.querySelector('#lang').ariaLabel=english?'日本語に切り替え':'Switch to English';renderWork();renderCollection();updateMotionLabel();animateUI(document.querySelector('main'),[{opacity:.55},{opacity:1}],{duration:280})};
let viewerClosing=false;function closeViewer(){if(viewerClosing||!dialog.open)return;viewerClosing=true;++workRequest;dialog.classList.add('is-closing');const animation=animateUI(dialog,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 10px'}],{duration:280});const finish=()=>{dialog.close();dialog.classList.remove('is-closing');dialog.querySelectorAll('.viewer-previous').forEach(e=>e.remove());document.body.style.overflow='';viewerClosing=false};if(animation)animation.finished.then(finish,finish);else finish()}dialog.addEventListener('cancel',e=>{e.preventDefault();closeViewer()});document.querySelector('#close').onclick=closeViewer;dialog.addEventListener('close',()=>document.body.style.overflow='');dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeViewer()}});document.querySelector('#prev').onclick=()=>{stepWork(-1)};document.querySelector('#next').onclick=()=>{stepWork(1)};document.addEventListener('keydown',e=>{if(!dialog.open)return;if(e.key==='ArrowRight')document.querySelector('#next').click();if(e.key==='ArrowLeft')document.querySelector('#prev').click()});
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.07}):null;document.querySelectorAll('.reveal').forEach(e=>observer?observer.observe(e):e.classList.add('visible'));
let paused=uiMotion.matches;
const galaxy=window.createGalaxy(document.querySelector('#cosmos'),paused);
const starlight=window.createStarlight(paused,()=>galaxy.skyAngle||0);
const art=document.querySelector('#hero-art');
addEventListener('pointermove',e=>{if(e.pointerType==='touch'||paused)return;const px=e.clientX/innerWidth-.5,py=e.clientY/innerHeight-.5;art.style.transform=`perspective(1100px) rotateY(${px*9}deg) rotateX(${-py*6}deg) translate3d(${px*8}px,${py*8}px,0)`});
function updateMotionLabel(){document.querySelector('#motion').innerHTML=icon(paused?'play':'pause');document.querySelector('#motion').ariaLabel=english?(paused?'Resume animation':'Pause animation'):(paused?'アニメーションを再開':'アニメーションを停止');galaxy.setPaused(paused);starlight.setPaused(paused)};document.querySelector('#motion').onclick=()=>{paused=!paused;updateMotionLabel();if(paused)art.style.transform='none';animateUI(document.querySelector('#motion'),[{opacity:.25},{opacity:1}],{duration:220})};updateMotionLabel();

// Touch gestures preserve normal vertical page scrolling.
let swipeStart=null,swipeOffset=0;
const imagePane=document.querySelector('.viewer-image'),viewImage=document.querySelector('#view-img');
imagePane.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;swipeStart={x:e.clientX,y:e.clientY};swipeOffset=0});
imagePane.addEventListener('pointermove',e=>{if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;if(Math.abs(dx)>Math.abs(dy)*1.3){swipeOffset=dx;if(!paused)viewImage.style.transform=`translateX(${dx*.22}px)`}});
function finishSwipe(e){if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4){stepWork(dx<0?1:-1)}swipeStart=null;viewImage.style.transform=''}
imagePane.addEventListener('pointerup',finishSwipe);imagePane.addEventListener('pointercancel',()=>{swipeStart=null;viewImage.style.transform=''});
addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||paused||dialog.open)return;const card=e.target.closest('.work');if(card)card.classList.add('touched')},{passive:true});
addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||paused||dialog.open)return;if(e.target.closest('.hero'))art.style.transform=`perspective(1100px) rotateY(${(e.clientX/W-.5)*9}deg) rotateX(${-(e.clientY/H-.5)*6}deg)`},{passive:true});
function releaseTouch(){document.querySelectorAll('.work.touched').forEach(e=>e.classList.remove('touched'));if(!paused)art.style.transform='none'}
addEventListener('pointerup',releaseTouch,{passive:true});addEventListener('pointercancel',releaseTouch,{passive:true});



// All clickable controls receive restrained visual feedback, including external links.
document.addEventListener('click',e=>{const control=e.target.closest('button,a,summary');if(control&&!uiAnimations.get(control)?.playState?.includes('running'))animateUI(control,[{opacity:.78},{opacity:1}],{duration:320})});
for(const details of document.querySelectorAll('details')){
 const summary=details.querySelector('summary');let disclosure=null,targetOpen=details.open;
 summary.addEventListener('click',e=>{
  if(uiMotion.matches||typeof details.animate!=='function')return;e.preventDefault();
  const start=details.getBoundingClientRect().height,opening=!targetOpen;targetOpen=opening;
  disclosure?.cancel();details.open=true;const expanded=details.getBoundingClientRect().height;
  const collapsed=summary.getBoundingClientRect().height;details.style.overflow='hidden';
  disclosure=details.animate([{height:start+'px'},{height:(opening?expanded:collapsed)+'px'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
  const currentAnimation=disclosure;disclosure.finished.then(()=>{if(disclosure!==currentAnimation)return;details.open=opening;details.style.overflow='';disclosure=null},()=>{});
 });
}

// Deliberate in-page travel, interruptible by any new user scroll gesture.
let pageTravel=null;
function stopPageTravel(){if(!pageTravel)return;cancelAnimationFrame(pageTravel.frame);clearTimeout(pageTravel.timeout);document.documentElement.style.scrollBehavior=pageTravel.previous;pageTravel=null}
for(const event of ['wheel','touchstart','pointerdown'])addEventListener(event,stopPageTravel,{passive:true});
addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End','Escape',' '].includes(e.key))stopPageTravel()});
document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const target=document.getElementById(link.getAttribute('href').slice(1));if(!target)return;e.preventDefault();stopPageTravel();const start=scrollY,padding=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0,end=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,target.getBoundingClientRect().top+start-padding));history.pushState(null,'',link.getAttribute('href'));if(uiMotion.matches){window.scrollTo({top:end,behavior:'instant'});return}const previous=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';const travel={frame:0,previous,startTime:null},duration=Math.min(1650,1050+Math.abs(end-start)*.12);pageTravel=travel;function step(now){if(pageTravel!==travel)return;if(travel.startTime===null)travel.startTime=now;const t=Math.min(1,(now-travel.startTime)/duration),eased=t*t*t*(t*(t*6-15)+10);window.scrollTo(0,start+(end-start)*eased);if(t<1)travel.frame=requestAnimationFrame(step);else stopPageTravel()}travel.frame=requestAnimationFrame(step);travel.timeout=setTimeout(()=>{if(pageTravel===travel){window.scrollTo(0,end);stopPageTravel()}},duration+160)});

addEventListener("akiko:resetview",()=>{stopPageTravel()});
