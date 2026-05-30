/* 1a. ACTIVATION EXPLORER */
(function(){
  const c=$('#actCanvas'),x=c.getContext('2d');
  const acts={
    relu:{f:z=>Math.max(0,z),d:'ReLU: max(0, z). Cheap, no vanishing gradient for z>0 — the default for hidden layers. "Dead" neurons can get stuck at 0.'},
    sigmoid:{f:z=>1/(1+Math.exp(-z)),d:'Sigmoid: squashes to (0,1). Great for probabilities at the output; rarely used in hidden layers (gradients vanish at the tails).'},
    tanh:{f:z=>Math.tanh(z),d:'Tanh: squashes to (-1,1), zero-centered. A smoother classic; still suffers vanishing gradients but better than sigmoid.'},
    gelu:{f:z=>0.5*z*(1+Math.tanh(0.79788*(z+0.044715*z*z*z))),d:'GELU: a smooth ReLU. The activation inside most modern Transformers / LLMs.'}
  };
  let cur='relu';
  function draw(){
    const W=c.width,H=c.height;x.clearRect(0,0,W,H);
    const ox=W/2,oy=H/2,sx=W/12,sy=H/3;
    // grid + axes
    x.strokeStyle='#16221e';x.lineWidth=1;
    for(let i=-6;i<=6;i++){x.beginPath();x.moveTo(ox+i*sx,0);x.lineTo(ox+i*sx,H);x.stroke();}
    for(let i=-3;i<=3;i++){x.beginPath();x.moveTo(0,oy-i*sy);x.lineTo(W,oy-i*sy);x.stroke();}
    x.strokeStyle='#33453f';x.beginPath();x.moveTo(0,oy);x.lineTo(W,oy);x.moveTo(ox,0);x.lineTo(ox,H);x.stroke();
    // curve
    const f=acts[cur].f;x.strokeStyle=TEAL;x.lineWidth=2.5;x.beginPath();
    for(let px=0;px<=W;px++){const z=(px-ox)/sx,y=oy-f(z)*sy;px===0?x.moveTo(px,y):x.lineTo(px,y);}
    x.stroke();
    x.shadowColor=TEAL;x.shadowBlur=14;x.stroke();x.shadowBlur=0;
    x.fillStyle=MUT;x.font="11px 'JetBrains Mono'";x.fillText('z',W-16,oy-8);x.fillText('f(z)',ox+8,16);
  }
  $('#actSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    $$('#actSeg button').forEach(q=>q.classList.remove('on'));b.classList.add('on');
    cur=b.dataset.a;$('#actDesc').textContent=acts[cur].d;draw();});
  $('#actDesc').textContent=acts.relu.d;draw();
})();
