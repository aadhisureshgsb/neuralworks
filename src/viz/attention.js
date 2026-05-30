/* 5b. SELF-ATTENTION */
(function(){
  const tokens=['The','robot','picked','up','the','ball','because','it','was','heavy'];
  // illustrative attention weights per query token (sum~1 each), index aligns to tokens
  const A={
    7:[0.04,0.34,0.05,0.02,0.05,0.30,0.04,0.10,0.03,0.03], // "it" -> robot/ball
    1:[0.30,0.20,0.10,0.02,0.05,0.05,0.02,0.05,0.02,0.19],
    5:[0.06,0.10,0.12,0.04,0.18,0.20,0.03,0.05,0.04,0.18],
    9:[0.03,0.06,0.03,0.02,0.03,0.30,0.05,0.28,0.10,0.10]
  };
  const def=tokens.map(()=>1/tokens.length);
  const cont=$('#attnSentence');
  let sel=-1;
  function render(){
    cont.innerHTML='';const wts=sel>=0?(A[sel]||def):null;
    tokens.forEach((t,i)=>{
      const w=wts?wts[i]:0;
      const sp=document.createElement('span');
      sp.textContent=t;sp.style.cssText='padding:7px 11px;border-radius:8px;cursor:pointer;transition:.18s;border:1px solid '+(i===sel?AMBER:'#283a35')+';position:relative';
      const bg=sel<0?0:(i===sel?0:w*3.2);
      sp.style.background= i===sel?'rgba(246,177,74,.18)':`rgba(62,233,176,${Math.min(0.55,bg)})`;
      sp.style.color = (bg>0.25||i===sel)?INK:MUT;
      if(wts&&i!==sel){const bar=document.createElement('div');bar.style.cssText=`position:absolute;left:0;bottom:-5px;height:3px;border-radius:2px;background:${TEAL};width:${Math.round(w*100)}%`;sp.appendChild(bar);}
      sp.onclick=()=>{sel=i;$('#attnQ').textContent='query: "'+t+'"'+(A[i]?'':' (uniform — try "it", "robot", "ball", "heavy")');render();};
      cont.appendChild(sp);
    });
  }
  render();
})();
