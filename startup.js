// Each document visit starts at the hero, including Safari's back/forward cache.
(()=>{
 function resetVisit(){
  try{history.scrollRestoration='manual';if(location.hash)history.replaceState(history.state,'',location.pathname+location.search)}catch{}
  dispatchEvent(new Event('akiko:resetview'));
  const viewer=document.querySelector('dialog[open]');if(viewer)try{viewer.close()}catch{}
  if(document.body)document.body.style.overflow='';
  const root=document.documentElement,previous=root.style.scrollBehavior;root.style.scrollBehavior='auto';window.scrollTo(0,0);root.style.scrollBehavior=previous;
 }
 if(!window.__akikoVisitReset){window.__akikoVisitReset=true;addEventListener('pageshow',()=>{resetVisit();requestAnimationFrame(resetVisit)});}
 resetVisit();requestAnimationFrame(resetVisit);
})();
