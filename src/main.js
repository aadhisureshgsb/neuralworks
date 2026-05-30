/* NEURALWORKS — shared helpers & scroll-spy. Loaded first; later scripts reuse these globals. */
const TEAL='#3ee9b0', ROSE='#f0617f', AMBER='#f6b14a', MUT='#7e938a', BLUE='#5db4f0', INK='#e9f1ec';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

/* ---------- scroll spy ---------- */
const spy=()=>{const ss=$$('main section[id]');let cur=ss[0]?.id;
  for(const s of ss){if(s.getBoundingClientRect().top<160)cur=s.id;}
  $$('.toc a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));};
addEventListener('scroll',spy,{passive:true});addEventListener('load',spy);
