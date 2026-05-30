/* BUILD YOUR OWN MODEL — visual + code builder, live training (uses NNLab) */
(function () {
  "use strict";
  const D = NNLab.datasets;

  // ---------- state ----------
  let hidden = [{ n: 6, act: "tanh" }, { n: 6, act: "tanh" }];   // hidden layers only
  let lr = 0.10, dsName = "spiral", data = D.spiral();
  let net = null, epoch = 0, lossHist = [], raf = null, mode = "visual";

  const bd = $("#pgBoundary"), bx = bd.getContext("2d"), BN = bd.width;
  const lc = $("#pgLoss"), lx = lc.getContext("2d");
  const ar = $("#pgArch"), arx = ar.getContext("2d");

  function spec() { return [...hidden, { n: 1, act: "sigmoid" }]; }

  function rebuild() {
    net = new NNLab.Net(spec()); epoch = 0; lossHist = [];
    $("#pgParams").textContent = net.paramCount();
    drawArch(); drawBoundary(); drawLoss(); readout({ loss: NaN, acc: NaN });
    $("#pgStatus").textContent = "ready";
  }

  // ---------- architecture diagram ----------
  function drawArch() {
    const W = ar.width, H = ar.height; arx.clearRect(0, 0, W, H);
    const sizes = [2, ...hidden.map(l => l.n), 1];
    const labels = ["input", ...hidden.map((l, i) => "h" + (i + 1)), "out"];
    const cols = sizes.length, padX = 46, gapX = (W - padX * 2) / (cols - 1);
    const pos = sizes.map((s, c) => {
      const arr = []; const gapY = Math.min(26, (H - 50) / Math.max(s, 1));
      const startY = H / 2 - (s - 1) * gapY / 2;
      for (let i = 0; i < s; i++) arr.push([padX + c * gapX, startY + i * gapY]);
      return arr;
    });
    // edges (colored by learned weight if trained)
    for (let l = 0; l < cols - 1; l++) {
      const Wm = net && net.W[l];
      for (let o = 0; o < pos[l + 1].length; o++) for (let i = 0; i < pos[l].length; i++) {
        let col = "rgba(40,58,53,.5)", lw = 0.6;
        if (Wm) { const w = Wm[o][i]; const t = Math.min(1, Math.abs(w) * 0.9); lw = 0.4 + t * 1.8; col = (w >= 0 ? `rgba(62,233,176,${.12 + t * .55})` : `rgba(240,97,127,${.12 + t * .55})`); }
        arx.strokeStyle = col; arx.lineWidth = lw; arx.beginPath();
        arx.moveTo(pos[l][i][0], pos[l][i][1]); arx.lineTo(pos[l + 1][o][0], pos[l + 1][o][1]); arx.stroke();
      }
    }
    // nodes
    pos.forEach((layer, c) => {
      layer.forEach(([x, y]) => { arx.beginPath(); arx.arc(x, y, 6, 0, 7);
        arx.fillStyle = c === 0 ? "#5db4f0" : c === cols - 1 ? "#f6b14a" : "#3ee9b0";
        arx.fill(); arx.strokeStyle = "#05100c"; arx.lineWidth = 1.5; arx.stroke(); });
      arx.fillStyle = "#7e938a"; arx.font = "10px 'JetBrains Mono'"; arx.textAlign = "center";
      arx.fillText(labels[c], layer[0][0], 16);
      arx.fillText(sizes[c] + "", layer[0][0], H - 8);
    });
    arx.textAlign = "left";
  }

  // ---------- decision boundary ----------
  const S = 2.6;
  function drawBoundary() {
    const R = 46, cell = BN / R, img = bx.createImageData(BN, BN);
    for (let gy = 0; gy < R; gy++) for (let gx = 0; gx < R; gx++) {
      const wx = (gx / R * 2 - 1) * S, wy = (gy / R * 2 - 1) * S;
      const p = net.forward([wx, wy]).p;
      const r = Math.round(240 * p + 62 * (1 - p)), g = Math.round(97 * p + 233 * (1 - p)), b = Math.round(127 * p + 176 * (1 - p));
      for (let dy = 0; dy < cell; dy++) for (let dx = 0; dx < cell; dx++) {
        const px = (gx * cell + dx) | 0, py = (gy * cell + dy) | 0; if (px >= BN || py >= BN) continue;
        const idx = (py * BN + px) * 4; img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 72;
      }
    }
    bx.fillStyle = "#05100c"; bx.fillRect(0, 0, BN, BN); bx.putImageData(img, 0, 0);
    const t = v => (v / S / 2 + 0.5) * BN;
    for (const d of data) { bx.beginPath(); bx.arc(t(d.x[0]), t(d.x[1]), 3, 0, 7); bx.fillStyle = d.y ? ROSE : TEAL; bx.fill(); bx.strokeStyle = "#05100c"; bx.lineWidth = 1; bx.stroke(); }
  }

  // ---------- loss curve ----------
  function drawLoss() {
    const W = lc.width, H = lc.height; lx.fillStyle = "#05100c"; lx.fillRect(0, 0, W, H);
    lx.strokeStyle = "#16221e"; for (let i = 1; i < 4; i++) { lx.beginPath(); lx.moveTo(0, H * i / 4); lx.lineTo(W, H * i / 4); lx.stroke(); }
    if (lossHist.length < 2) { lx.fillStyle = "#566860"; lx.font = "11px 'JetBrains Mono'"; lx.fillText("loss curve — press Train", 12, H / 2); return; }
    const mx = Math.max(...lossHist, 0.05);
    lx.strokeStyle = AMBER; lx.lineWidth = 2; lx.beginPath();
    lossHist.forEach((v, i) => { const x = i / (lossHist.length - 1) * W, y = H - (v / mx) * (H - 10) - 5; i ? lx.lineTo(x, y) : lx.moveTo(x, y); });
    lx.stroke();
    lx.fillStyle = "#566860"; lx.font = "10px 'JetBrains Mono'"; lx.fillText("loss", 6, 14); lx.fillText("epochs →", W - 64, H - 6);
  }

  function readout(r) {
    $("#pgEpoch").textContent = epoch;
    $("#pgLossV").textContent = isNaN(r.loss) ? "—" : r.loss.toFixed(3);
    $("#pgAcc").textContent = isNaN(r.acc) ? "—" : (r.acc * 100).toFixed(0) + "%";
  }

  function loop() {
    let r; for (let i = 0; i < 4; i++) { r = net.trainStep(data, lr); epoch++; }
    lossHist.push(r.loss); if (lossHist.length > 400) lossHist.shift();
    drawBoundary(); drawLoss(); readout(r);
    if (epoch % 24 === 0) drawArch();              // refresh learned weights occasionally
    raf = requestAnimationFrame(loop);
  }
  function stop() { cancelAnimationFrame(raf); raf = null; $("#pgTrain").textContent = "▶ Train"; $("#pgStatus").textContent = "paused"; drawArch(); }

  // ---------- visual builder UI ----------
  function renderLayers() {
    const box = $("#pgLayers"); box.innerHTML = "";
    hidden.forEach((L, idx) => {
      const row = document.createElement("div"); row.className = "layer-row";
      row.innerHTML =
        `<span class="lr-tag">h${idx + 1}</span>
         <input type="range" min="1" max="12" value="${L.n}" data-i="${idx}" class="lr-n">
         <span class="lr-num">${L.n}</span>
         <select class="lr-act" data-i="${idx}">
           ${["tanh", "relu", "sigmoid"].map(a => `<option ${a === L.act ? "selected" : ""}>${a}</option>`).join("")}
         </select>
         <button class="btn lr-del" data-i="${idx}" title="remove layer">✕</button>`;
      box.appendChild(row);
    });
    box.querySelectorAll(".lr-n").forEach(s => s.oninput = e => { const i = +e.target.dataset.i; hidden[i].n = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; syncCode(); rebuild(); });
    box.querySelectorAll(".lr-act").forEach(s => s.onchange = e => { hidden[+e.target.dataset.i].act = e.target.value; syncCode(); rebuild(); });
    box.querySelectorAll(".lr-del").forEach(b => b.onclick = e => { if (hidden.length <= 1) return; hidden.splice(+e.target.dataset.i, 1); renderLayers(); syncCode(); rebuild(); });
  }

  // ---------- code <-> config ----------
  function syncCode() {
    const code =
`layers = [
${hidden.map(l => `  dense(${l.n}, "${l.act}"),`).join("\n")}
  dense(1, "sigmoid"),   // output: class probability
]
learningRate = ${lr.toFixed(2)}
dataset = "${dsName}"      // xor | circle | moons | spiral`;
    $("#pgCodeArea").value = code;
  }
  function applyCode() {
    const src = $("#pgCodeArea").value;
    try {
      const dense = (n, act) => { if (!Number.isInteger(n) || n < 1) throw "dense(): neuron count must be a positive integer"; if (!NNLab.ACT[act]) throw `unknown activation "${act}"`; return { n, act }; };
      const sandbox = new Function("dense", src + "\n;return {layers, learningRate, dataset};");
      const cfg = sandbox(dense);
      if (!Array.isArray(cfg.layers) || cfg.layers.length < 1) throw "layers must be a non-empty array";
      const last = cfg.layers[cfg.layers.length - 1];
      if (last.n !== 1 || last.act !== "sigmoid") throw 'last layer must be dense(1, "sigmoid")';
      if (!D[cfg.dataset]) throw `dataset must be one of: xor, circle, moons, spiral`;
      hidden = cfg.layers.slice(0, -1).map(l => ({ n: Math.min(12, l.n), act: l.act }));
      if (hidden.length === 0) hidden = [{ n: 4, act: "tanh" }];
      lr = Math.max(0.001, Math.min(3, +cfg.learningRate || 0.1));
      dsName = cfg.dataset; data = D[dsName]();
      $("#pgCodeErr").textContent = "✓ applied"; $("#pgCodeErr").style.color = TEAL;
      $("#pgLr").value = Math.round(lr * 100); $("#pgLrVal").textContent = lr.toFixed(2);
      $("#pgDataset").value = dsName;
      renderLayers(); stop(); rebuild();
    } catch (err) {
      $("#pgCodeErr").textContent = "✕ " + err; $("#pgCodeErr").style.color = ROSE;
    }
  }

  // ---------- wire controls ----------
  $("#pgTrain").onclick = () => { if (raf) stop(); else { $("#pgTrain").textContent = "⏸ Pause"; $("#pgStatus").textContent = "training…"; loop(); } };
  $("#pgStep").onclick = () => { if (raf) return; let r; for (let i = 0; i < 30; i++) { r = net.trainStep(data, lr); epoch++; lossHist.push(r.loss); } drawBoundary(); drawLoss(); drawArch(); readout(r); $("#pgStatus").textContent = "stepped +30"; };
  $("#pgReset").onclick = () => { stop(); data = D[dsName](); rebuild(); };
  $("#pgAddLayer").onclick = () => { if (hidden.length >= 4) return; hidden.push({ n: 5, act: "tanh" }); renderLayers(); syncCode(); rebuild(); };
  $("#pgDataset").onchange = e => { dsName = e.target.value; data = D[dsName](); syncCode(); stop(); rebuild(); };
  $("#pgLr").oninput = e => { lr = +e.target.value / 100; $("#pgLrVal").textContent = lr.toFixed(2); syncCode(); };
  $("#pgApply").onclick = applyCode;
  $$("#pgModeSeg button").forEach(b => b.onclick = () => {
    $$("#pgModeSeg button").forEach(q => q.classList.remove("on")); b.classList.add("on");
    mode = b.dataset.m; $("#pgVisual").style.display = mode === "visual" ? "" : "none"; $("#pgCode").style.display = mode === "code" ? "" : "none";
    if (mode === "code") syncCode();
  });

  // init
  renderLayers(); syncCode(); rebuild();
})();
