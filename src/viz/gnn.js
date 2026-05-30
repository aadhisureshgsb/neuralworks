/* 4. GNN MESSAGE PASSING */
(function(){
  const svg=$('#gnnSvg');
  const nodes=[{x:300,y:60},{x:140,y:130},{x:460,y:130},{x:80,y:250},{x:230,y:230},{x:370,y:230},{x:520,y:250},{x:160,y:320},{x:440,y:320},{x:300,y:300}];
  const edges=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[4,5],[3,7],[4,7],[5,8],[6,8],[4,9],[5,9],[7,9],[8,9]];
  const adj=nodes.map(()=>[]);edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
  let val=nodes.map(()=>0),round=0,agg='mean';
  function col(v){const t=Math.max(0,Math.min(1,v));const r=Math.round(8+t*246),g=Math.round(22+t*145),b=Math.round(20+t*40);return `rgb(${r},${g},${b})`;}
  function render(){
    let s='';
    edges.forEach(([a,b])=>{s+=`<line x1="${nodes[a].x}" y1="${nodes[a].y}" x2="${nodes[b].x}" y2="${nodes[b].y}" stroke="#283a35" stroke-width="1.5"/>`;});
    nodes.forEach((n,i)=>{const v=val[i];
      s+=`<circle cx="${n.x}" cy="${n.y}" r="20" fill="${col(v)}" stroke="${v>0.04?AMBER:'#3a4d47'}" stroke-width="${v>0.04?2.5:1.5}" data-i="${i}" style="cursor:pointer"/>`;
      s+=`<text x="${n.x}" y="${n.y+4}" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="${v>0.5?'#04110c':'#9fb3aa'}" style="pointer-events:none">${v.toFixed(2)}</text>`;});
    svg.innerHTML=s;
    svg.querySelectorAll('circle').forEach(ci=>ci.onclick=()=>{val[+ci.dataset.i]=1;round=0;$('#gnnRound').textContent='round 0';render();});
  }
  function propagate(){
    const nv=val.map((v,i)=>{const ns=adj[i].map(j=>val[j]).concat([v]);
      if(agg==='sum')return Math.min(1,ns.reduce((a,b)=>a+b,0));
      if(agg==='max')return Math.max(...ns);
      return ns.reduce((a,b)=>a+b,0)/ns.length;});
    val=nv;round++;$('#gnnRound').textContent='round '+round;render();
  }
  $('#gnnProp').onclick=propagate;
  $('#gnnAuto').onclick=()=>{let n=0;const id=setInterval(()=>{propagate();if(++n>=6)clearInterval(id);},420);};
  $('#gnnReset').onclick=()=>{val=nodes.map(()=>0);round=0;$('#gnnRound').textContent='round 0';render();};
  $('#gnnAgg').onchange=e=>agg=e.target.value;
  val[0]=1;render();
})();
