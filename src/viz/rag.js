/* 6. RAG PIPELINE (real cosine retrieval) */
(function(){
  const corpus=[
    "RAG reduces hallucination by grounding the model's answer in retrieved source documents instead of relying only on memorized training data.",
    "An embedding maps text to a vector so that semantically similar pieces of text land close together, enabling similarity search and retrieval.",
    "A convolutional network shares the same small kernel weights across every position of an image, which cuts parameters and gives translation invariance.",
    "Each GNN layer performs one round of message passing, so after k layers every node has aggregated information from its k-hop neighborhood.",
    "A vector database stores embeddings and performs fast nearest-neighbor search to find the chunks most relevant to a query.",
    "Gradient descent updates each weight in the direction that reduces the loss, scaled by the learning rate, repeated over many epochs.",
    "Self-attention lets each token compute a weighted blend over all other tokens based on query-key similarity, the core of the Transformer.",
    "At query time RAG embeds the question, retrieves the top matching chunks, inserts them into the prompt, and lets the LLM generate a grounded answer."
  ];
  const stop=new Set(['the','a','an','of','to','in','on','is','are','it','its','and','by','so','that','into','only','each','from','for','with','over','which','every','most','at','as','all','this','these']);
  function toks(s){return s.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(w=>w&&!stop.has(w));}
  // build vocab + df
  const docs=corpus.map(toks);const df={};docs.forEach(d=>{new Set(d).forEach(w=>df[w]=(df[w]||0)+1);});
  function vec(t){const v={};t.forEach(w=>v[w]=(v[w]||0)+1);for(const w in v){const idf=Math.log(1+corpus.length/(1+(df[w]||0)));v[w]*=idf;}return v;}
  function cos(a,b){let dot=0,na=0,nb=0;for(const w in a){na+=a[w]*a[w];if(b[w])dot+=a[w]*b[w];}for(const w in b)nb+=b[w]*b[w];return dot/(Math.sqrt(na*nb)+1e-9);}
  const dvecs=docs.map(vec);
  function run(){
    const q=$('#ragQuery').value.trim();if(!q)return;
    $('#ragStage').textContent='embedding…';
    const qv=vec(toks(q));
    const scored=corpus.map((c,i)=>({i,c,s:cos(qv,dvecs[i])})).sort((a,b)=>b.s-a.s);
    const top=scored.slice(0,3);
    // render chunks
    const box=$('#ragChunks');box.innerHTML='';
    scored.forEach((r,rank)=>{
      const hit=top.includes(r);
      const d=document.createElement('div');
      d.style.cssText=`padding:10px 12px;border-radius:9px;font-size:13px;line-height:1.45;border:1px solid ${hit?TEAL:'#1d2a26'};background:${hit?'rgba(62,233,176,.07)':'#0a110f'};opacity:${hit?1:0.5};transition:.3s`;
      d.innerHTML=`<span style="font-family:JetBrains Mono;font-size:10px;color:${hit?TEAL:MUT};letter-spacing:.1em">${hit?'★ RETRIEVED':'  skipped'} · sim ${r.s.toFixed(3)}</span><br><span style="color:${hit?INK:MUT}">${r.c}</span>`;
      box.appendChild(d);
    });
    // prompt
    const ctx=top.map((t,i)=>`[${i+1}] ${t.c}`).join('\n');
    $('#ragPrompt').textContent=`SYSTEM: Answer using ONLY the context.\n\nCONTEXT:\n${ctx}\n\nQUESTION: ${q}`;
    // templated answer from top chunk
    const ans=top[0].s>0.05?top[0].c:"No sufficiently relevant context was retrieved — the model should say it doesn't know rather than guess.";
    $('#ragAnswer').innerHTML=`<div style="padding:12px;border-radius:9px;background:rgba(246,177,74,.08);border:1px solid #3a3326;font-size:13.5px;line-height:1.5"><span style="font-family:JetBrains Mono;font-size:10px;color:${AMBER};letter-spacing:.1em">④ GROUNDED ANSWER</span><br><span style="color:${INK}">${ans}</span> <span style="color:${MUT};font-size:11px">[grounded in chunk ${top[0].i+1}]</span></div>`;
    $('#ragStage').textContent='done · '+top.length+' chunks';
  }
  $('#ragRun').onclick=run;
  $('#ragQuery').addEventListener('keydown',e=>{if(e.key==='Enter')run();});
  $('#ragPreset').onchange=e=>{if(e.target.value){$('#ragQuery').value=e.target.value;run();}};
  run();
})();
