/* 5a. EMBEDDING SPACE */
(function(){
  const c=$('#embCanvas'),x=c.getContext('2d');
  // hand-placed 2D "embeddings" clustered by meaning
  const words=[
    {w:'king',p:[0.18,0.30]},{w:'queen',p:[0.24,0.36]},{w:'prince',p:[0.12,0.40]},{w:'throne',p:[0.28,0.24]},
    {w:'dog',p:[0.62,0.28]},{w:'cat',p:[0.68,0.34]},{w:'puppy',p:[0.58,0.20]},{w:'pet',p:[0.72,0.24]},
    {w:'GPU',p:[0.80,0.74]},{w:'compute',p:[0.86,0.66]},{w:'server',p:[0.74,0.80]},{w:'cluster',p:[0.88,0.80]},
    {w:'ocean',p:[0.20,0.78]},{w:'river',p:[0.14,0.70]},{w:'rain',p:[0.28,0.84]},{w:'storm',p:[0.10,0.86]},
    {w:'happy',p:[0.46,0.50]},{w:'joyful',p:[0.52,0.56]},{w:'sad',p:[0.40,0.62]}
  ];
  let hover=-1;
  function p2c(p){return [40+p[0]*(c.width-80),30+p[1]*(c.height-60)];}
  function dist(a,b){return Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1]);}
  function draw(){
    x.fillStyle='#05100c';x.fillRect(0,0,c.width,c.height);
    x.strokeStyle='#16221e';for(let i=0;i<=10;i++){x.beginPath();x.moveTo(40+i*(c.width-80)/10,30);x.lineTo(40+i*(c.width-80)/10,c.height-30);x.stroke();}
    if(hover>=0){const h=words[hover];const sorted=words.map((w,i)=>({i,d:dist(w,h)})).sort((a,b)=>a.d-b.d).slice(1,4);
      sorted.forEach(s=>{const[ax,ay]=p2c(h.p),[bx,by]=p2c(words[s.i].p);x.strokeStyle='rgba(62,233,176,.4)';x.lineWidth=1.5;x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke();});}
    words.forEach((wd,i)=>{const[px,py]=p2c(wd.p);const on=i===hover;
      x.beginPath();x.arc(px,py,on?7:4.5,0,7);x.fillStyle=on?AMBER:TEAL;x.fill();
      x.fillStyle=on?INK:MUT;x.font=(on?"bold ":"")+"12px 'JetBrains Mono'";x.fillText(wd.w,px+9,py+4);});
  }
  c.onmousemove=e=>{const r=c.getBoundingClientRect();const mx=(e.clientX-r.left)/r.width*c.width,my=(e.clientY-r.top)/r.height*c.height;
    let best=-1,bd=22;words.forEach((wd,i)=>{const[px,py]=p2c(wd.p);const d=Math.hypot(px-mx,py-my);if(d<bd){bd=d;best=i;}});
    if(best!==hover){hover=best;draw();
      if(best>=0){const h=words[best];const nn=words.map((w,i)=>({w:w.w,d:dist(w,h)})).sort((a,b)=>a.d-b.d).slice(1,4);
        $('#embReadout').innerHTML='nearest to <b style="color:'+AMBER+'">'+h.w+'</b> → '+nn.map(n=>n.w+' <span style="color:#566860">('+(1-n.d).toFixed(2)+')</span>').join(' · ');}
      else $('#embReadout').textContent='Nearest neighbors appear here.';}};
  c.onmouseleave=()=>{hover=-1;draw();$('#embReadout').textContent='Nearest neighbors appear here.';};
  draw();
})();
