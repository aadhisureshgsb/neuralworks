/* 3. CONVOLUTION PLAYGROUND — user-driven: draw, erase, or upload your own input */
(function () {
  "use strict";
  const G = 22;                                  // grid size
  const inC = $("#convIn"), inX = inC.getContext("2d");
  const outC = $("#convOut"), outX = outC.getContext("2d");
  const cell = inC.width / G;
  let grid = Array.from({ length: G }, () => Array(G).fill(0));
  let kernel = [[0, -1, 0], [-1, 4, -1], [0, -1, 0]];
  let brush = 1, erasing = false, dirty = false;

  const presets = {
    edge: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
    sobelx: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
    sobely: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
    sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    blur: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]],
    emboss: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
    identity: [[0, 0, 0], [0, 1, 0], [0, 0, 0]]
  };
  const names = { edge: "edge detect", sobelx: "sobel \u2202x", sobely: "sobel \u2202y", sharpen: "sharpen", blur: "blur", emboss: "emboss", identity: "identity" };

  function drawGrid(cx, g, scan, hint) {
    cx.fillStyle = "#05100c"; cx.fillRect(0, 0, inC.width, inC.width);
    for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) {
      const v = Math.max(0, Math.min(1, g[r][c])); if (v <= 0.001) continue;
      const sh = Math.round(v * 255);
      cx.fillStyle = `rgb(${Math.round(sh * .24)},${Math.round(sh * .91)},${Math.round(sh * .69)})`;
      cx.fillRect(c * cell + .5, r * cell + .5, cell - 1, cell - 1);
    }
    if (scan) { cx.strokeStyle = AMBER; cx.lineWidth = 2; cx.strokeRect((scan.c - 1) * cell, (scan.r - 1) * cell, cell * 3, cell * 3); }
    if (hint) { cx.fillStyle = "#33453f"; cx.font = "13px 'JetBrains Mono'"; cx.textAlign = "center"; cx.fillText("draw here \u270e", inC.width / 2, inC.width / 2); cx.textAlign = "left"; }
  }
  function convolve() {
    const out = Array.from({ length: G }, () => Array(G).fill(0));
    let mx = 0;
    for (let r = 1; r < G - 1; r++) for (let c = 1; c < G - 1; c++) {
      let s = 0; for (let kr = -1; kr <= 1; kr++) for (let kc = -1; kc <= 1; kc++) s += grid[r + kr][c + kc] * kernel[kr + 1][kc + 1];
      out[r][c] = Math.abs(s); mx = Math.max(mx, out[r][c]);
    }
    if (mx > 0) for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) out[r][c] /= mx;
    return out;
  }
  function render(scan) { drawGrid(inX, grid, scan, !dirty); drawGrid(outX, convolve(), null, false); }

  // kernel editor
  function buildKernel() {
    const kg = $("#kernelGrid"); kg.innerHTML = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const inp = document.createElement("input"); inp.type = "text"; inp.value = (+kernel[r][c].toFixed(2)).toString();
      inp.style.cssText = "width:46px;height:46px;text-align:center;padding:0;font-size:13px;border-radius:6px;background:#0e1614;color:" + TEAL;
      inp.oninput = () => { const v = parseFloat(inp.value); if (!isNaN(v)) { kernel[r][c] = v; render(); } };
      kg.appendChild(inp);
    }
  }

  // painting with brush + eraser
  let painting = false;
  function paint(e) {
    const r = inC.getBoundingClientRect();
    const cc = Math.floor((e.clientX - r.left) / r.width * G), rr = Math.floor((e.clientY - r.top) / r.height * G);
    for (let dr = -brush + 1; dr <= brush - 1; dr++) for (let dc = -brush + 1; dc <= brush - 1; dc++) {
      const rrr = rr + dr, ccc = cc + dc;
      if (rrr >= 0 && rrr < G && ccc >= 0 && ccc < G && Math.hypot(dr, dc) <= brush - 0.2) grid[rrr][ccc] = erasing ? 0 : 1;
    }
    dirty = true; render();
  }
  inC.addEventListener("pointerdown", e => { painting = true; paint(e); });
  inC.addEventListener("pointermove", e => { if (painting) paint(e); });
  addEventListener("pointerup", () => painting = false);

  // image upload -> grayscale downsample
  function loadImage(file) {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const tmp = document.createElement("canvas"); tmp.width = G; tmp.height = G;
      const tx = tmp.getContext("2d"); tx.drawImage(img, 0, 0, G, G);
      const d = tx.getImageData(0, 0, G, G).data;
      for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) { const i = (r * G + c) * 4; const lum = (d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114) / 255; grid[r][c] = lum; }
      dirty = true; render(); URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function clear() { grid = Array.from({ length: G }, () => Array(G).fill(0)); dirty = false; render(); }
  function loadA() {
    clear();
    const A = ["0000000000000000000000", "0000001111000000000000", "0000011111100000000000", "0000111001110000000000", "0001110000111000000000", "0001110000111000000000", "0011100000011100000000", "0011111111111100000000", "0011111111111100000000", "0011100000011100000000", "0111000000001110000000", "0111000000001110000000", "0111000000001110000000"];
    for (let r = 0; r < A.length; r++) for (let c = 0; c < A[r].length && c < G; c++) if (grid[r + 3]) grid[r + 3][c + 1] = A[r][c] === "1" ? 1 : 0;
    dirty = true; render();
  }

  $("#convPreset").onchange = e => { kernel = presets[e.target.value].map(r => [...r]); $("#convK").textContent = names[e.target.value]; buildKernel(); render(); };
  $("#convClear").onclick = clear;
  $("#convExample").onclick = loadA;
  $("#convDemo").onclick = () => { let r = 1, c = 1; const id = setInterval(() => { render({ r, c }); c++; if (c >= G - 1) { c = 1; r++; } if (r >= G - 1) { clearInterval(id); render(); } }, 18); };
  $("#convBrush").oninput = e => { brush = +e.target.value; $("#convBrushV").textContent = e.target.value; };
  $("#convErase").onclick = e => { erasing = !erasing; e.target.classList.toggle("on", erasing); e.target.textContent = erasing ? "\u232b eraser ON" : "\u232b eraser"; };
  $("#convUpload").onchange = e => { if (e.target.files[0]) loadImage(e.target.files[0]); };

  buildKernel(); render();
})();
