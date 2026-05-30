/* 1b. LIVE MLP TRAINER (real backprop, two-moons) */
(function(){
  const c=$('#mlpCanvas'),x=c.getContext('2d'),N=c.width;
  let W1,b1,W2,b2,H=8,lr=0.30,act='tanh',data=[],epoch=0,raf=null;
  function actf(z){return act==='tanh'?Math.tanh(z):Math.max(0,z);}
  function actd(z){return act==='tanh'?1-Math.tanh(z)**2:(z>0?1:0);}
  function sig(z){return 1/(1+Math.exp(-z));}
  function rnd(a){return (Math.random()*2-1)*a;}
  function genData(){
    data=[];const n=120;
    for(let i=0;i<n;i++){const t=Math.PI*i/n;
      data.push({x:[Math.cos(t)*1.0-0.5+rnd(.08),Math.sin(t)*1.0-0.25+rnd(.08)],y:0});
      data.push({x:[1-Math.cos(t)*1.0-0.5+rnd(.08),0.25-Math.sin(t)*1.0+0.25+rnd(.08)],y:1});}
  }
  function init(){
    H=+$('#hu').value;lr=+$('#lr').value/100;act=$('#mlpAct').value;epoch=0;
    W1=[];b1=[];for(let i=0;i<H;i++){W1.push([rnd(1),rnd(1)]);b1.push(0);}
    W2=[];for(let i=0;i<H;i++)W2.push(rnd(1));b2=0;
    genData();$('#mlpEpoch').textContent='0';$('#mlpLoss').textContent='—';$('#mlpAcc').textContent='—';
  }
  function forward(inp){
    const z1=[],a1=[];for(let i=0;i<H;i++){let s=b1[i];s+=W1[i][0]*inp[0]+W1[i][1]*inp[1];z1.push(s);a1.push(actf(s));}
    let z2=b2;for(let i=0;i<H;i++)z2+=W2[i]*a1[i];return{a1,z1,p:sig(z2)};}
  function trainStep(){
    let loss=0,correct=0;
    const gW1=W1.map(()=>[0,0]),gb1=b1.map(()=>0),gW2=W2.map(()=>0);let gb2=0;
    for(const d of data){
      const {a1,z1,p}=forward(d.x);const err=p-d.y;
      loss+=-(d.y*Math.log(p+1e-9)+(1-d.y)*Math.log(1-p+1e-9));
      if((p>0.5?1:0)===d.y)correct++;
      for(let i=0;i<H;i++){gW2[i]+=err*a1[i];const da=err*W2[i],dz=da*actd(z1[i]);
        gW1[i][0]+=dz*d.x[0];gW1[i][1]+=dz*d.x[1];gb1[i]+=dz;}
      gb2+=err;
    }
    const m=data.length;
    for(let i=0;i<H;i++){W2[i]-=lr*gW2[i]/m;W1[i][0]-=lr*gW1[i][0]/m;W1[i][1]-=lr*gW1[i][1]/m;b1[i]-=lr*gb1[i]/m;}
    b2-=lr*gb2/m;epoch++;
    return{loss:loss/m,acc:correct/m};
  }
  function toPx(v){return (v+1.5)/3*N;}
  function draw(){
    const R=42,cell=N/R,img=x.createImageData(N,N);
    for(let gy=0;gy<R;gy++)for(let gx=0;gx<R;gx++){
      const wx=(gx/R*3-1.5),wy=(gy/R*3-1.5);const p=forward([wx,wy]).p;
      const r=Math.round(240*p+62*(1-p)),g=Math.round(97*p+233*(1-p)),b=Math.round(127*p+176*(1-p));
      for(let dy=0;dy<cell;dy++)for(let dx=0;dx<cell;dx++){
        const px=Math.floor(gx*cell+dx),py=Math.floor(gy*cell+dy);if(px>=N||py>=N)continue;
        const idx=(py*N+px)*4;img.data[idx]=r;img.data[idx+1]=g;img.data[idx+2]=b;img.data[idx+3]=70;}
    }
    x.fillStyle='#05100c';x.fillRect(0,0,N,N);x.putImageData(img,0,0);
    for(const d of data){x.beginPath();x.arc(toPx(d.x[0]),toPx(d.x[1]),3.5,0,7);
      x.fillStyle=d.y?ROSE:TEAL;x.fill();x.strokeStyle='#05100c';x.lineWidth=1.5;x.stroke();}
  }
  function readout(r){$('#mlpEpoch').textContent=epoch;$('#mlpLoss').textContent=r.loss.toFixed(3);$('#mlpAcc').textContent=(r.acc*100).toFixed(0)+'%';}
  function loop(){let r;for(let i=0;i<3;i++)r=trainStep();draw();readout(r);raf=requestAnimationFrame(loop);}
  function stop(){cancelAnimationFrame(raf);raf=null;$('#mlpRun').textContent='▶ Train';$('#mlpStatus').textContent='paused';}
  $('#mlpRun').onclick=()=>{if(raf)stop();else{$('#mlpRun').textContent='⏸ Pause';$('#mlpStatus').textContent='training…';loop();}};
  $('#mlpStep').onclick=()=>{if(raf)return;let r;for(let i=0;i<50;i++)r=trainStep();draw();readout(r);$('#mlpStatus').textContent='stepped';};
  $('#mlpReset').onclick=()=>{stop();init();draw();$('#mlpStatus').textContent='idle';};
  $('#hu').oninput=e=>{$('#huVal').textContent=e.target.value;};
  $('#hu').onchange=()=>{stop();init();draw();};
  $('#lr').oninput=e=>{lr=+e.target.value/100;$('#lrVal').textContent=lr.toFixed(2);};
  $('#mlpAct').onchange=e=>{act=e.target.value;};
  init();draw();
})();
