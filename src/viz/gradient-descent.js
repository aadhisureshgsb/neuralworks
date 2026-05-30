/* 2. GRADIENT DESCENT ON LOSS SURFACE */
(function(){
  const c=$('#gdCanvas'),x=c.getContext('2d'),N=c.width;
  let lr=0.10,surf='bowl',pos=null,vel=[0,0],step=0,raf=null;
  const S=3.0; // domain [-S,S]
  function L(u,v){
    if(surf==='bowl')return 0.5*(u*u+v*v);
    if(surf==='saddle')return 0.5*(0.3*u*u + v*v) + 0.5*Math.sin(u*1.4);
    return u*u*0.18+v*v*0.18 + 1.4*(Math.sin(u*1.6)*Math.cos(v*1.6))+1.4;
  }
  function grad(u,v){const e=1e-3;return [(L(u+e,v)-L(u-e,v))/(2*e),(L(u,v+e)-L(u,v-e))/(2*e)];}
  function w2p(u,v){return [(u/S/2+0.5)*N,(v/S/2+0.5)*N];}
  function p2w(px,py){return [(px/N-0.5)*2*S,(py/N-0.5)*2*S];}
  let lo,hi;
  function drawSurf(){
    const R=120,cell=N/R;lo=1e9;hi=-1e9;const vals=[];
    for(let j=0;j<R;j++){vals[j]=[];for(let i=0;i<R;i++){const [u,v]=p2w(i*cell,j*cell);const l=L(u,v);vals[j][i]=l;lo=Math.min(lo,l);hi=Math.max(hi,l);}}
    const img=x.createImageData(N,N);
    for(let j=0;j<R;j++)for(let i=0;i<R;i++){
      const t=1-(vals[j][i]-lo)/(hi-lo+1e-9); // 1 = low loss = bright
      const r=Math.round(8+t*54),g=Math.round(16+t*210),b=Math.round(14+t*150);
      const band=(Math.floor((1-t)*16)%2)?0.82:1; // contour bands
      for(let dy=0;dy<cell;dy++)for(let dx=0;dx<cell;dx++){
        const px=Math.floor(i*cell+dx),py=Math.floor(j*cell+dy);if(px>=N||py>=N)continue;
        const idx=(py*N+px)*4;img.data[idx]=r*band;img.data[idx+1]=g*band;img.data[idx+2]=b*band;img.data[idx+3]=255;}
    }
    x.putImageData(img,0,0);
  }
  let trail=[];
  function draw(){
    drawSurf();
    if(trail.length>1){x.strokeStyle='rgba(246,177,74,.7)';x.lineWidth=2;x.beginPath();
      trail.forEach((p,i)=>{const[px,py]=w2p(p[0],p[1]);i?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();}
    if(pos){const[px,py]=w2p(pos[0],pos[1]);x.beginPath();x.arc(px,py,7,0,7);x.fillStyle=AMBER;x.fill();
      x.strokeStyle='#fff';x.lineWidth=1.5;x.stroke();x.shadowColor=AMBER;x.shadowBlur=12;x.fill();x.shadowBlur=0;}
  }
  function loop(){
    if(!pos)return;const g=grad(pos[0],pos[1]);
    vel[0]=vel[0]*0.6-lr*g[0];vel[1]=vel[1]*0.6-lr*g[1];
    pos[0]+=vel[0];pos[1]+=vel[1];
    pos[0]=Math.max(-S,Math.min(S,pos[0]));pos[1]=Math.max(-S,Math.min(S,pos[1]));
    trail.push([pos[0],pos[1]]);if(trail.length>200)trail.shift();
    step++;$('#gdStep').textContent=step;$('#gdLoss').textContent=L(pos[0],pos[1]).toFixed(3);
    draw();
    if(Math.hypot(vel[0],vel[1])>1e-4&&step<600)raf=requestAnimationFrame(loop);
  }
  function drop(u,v){cancelAnimationFrame(raf);pos=[u,v];vel=[0,0];step=0;trail=[[u,v]];loop();}
  c.onclick=e=>{const r=c.getBoundingClientRect();const px=(e.clientX-r.left)/r.width*N,py=(e.clientY-r.top)/r.height*N;const[u,v]=p2w(px,py);drop(u,v);};
  $('#gdReset').onclick=()=>drop(-2.2+Math.random()*0.6,2.0+Math.random()*0.6);
  $('#gdLr').oninput=e=>{lr=+e.target.value/100;$('#gdLrVal').textContent=lr.toFixed(2);};
  $('#gdSurf').onchange=e=>{surf=e.target.value;trail=[];pos=null;draw();};
  draw();drop(-2.2,2.1);
})();
