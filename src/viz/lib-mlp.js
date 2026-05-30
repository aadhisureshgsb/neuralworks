/* NEURALWORKS — NNLab: a tiny but real N-layer neural-network engine + datasets.
   Pure JS, no deps. Powers the "Build your own model" playground.
   Binary classification (2D input -> 1 probability), BCE loss, full backprop. */
const NNLab = (function () {
  "use strict";

  /* ---------- activations ---------- */
  const ACT = {
    tanh:    { f: z => Math.tanh(z),                d: z => 1 - Math.tanh(z) ** 2 },
    relu:    { f: z => Math.max(0, z),              d: z => (z > 0 ? 1 : 0) },
    sigmoid: { f: z => 1 / (1 + Math.exp(-z)),      d: z => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); } },
    linear:  { f: z => z,                            d: () => 1 }
  };
  const rnd = a => (Math.random() * 2 - 1) * a;

  /* ---------- the network ---------- */
  // spec: [{n, act}, ...] for layers AFTER the 2D input. Last layer should be {n:1, act:'sigmoid'}.
  class Net {
    constructor(spec) {
      this.spec = spec.map(l => ({ n: l.n, act: l.act }));
      this.sizes = [2, ...this.spec.map(l => l.n)];          // include input width
      this.W = []; this.b = [];
      for (let l = 0; l < this.spec.length; l++) {
        const inN = this.sizes[l], outN = this.sizes[l + 1];
        // He/Xavier-ish init
        const scale = Math.sqrt(2 / inN);
        const w = [];
        for (let o = 0; o < outN; o++) { const row = []; for (let i = 0; i < inN; i++) row.push(rnd(1) * scale); w.push(row); }
        this.W.push(w); this.b.push(new Array(outN).fill(0));
      }
    }
    forward(x) {
      const as = [x.slice()], zs = [];
      let a = x;
      for (let l = 0; l < this.spec.length; l++) {
        const z = new Array(this.sizes[l + 1]).fill(0);
        for (let o = 0; o < z.length; o++) {
          let s = this.b[l][o]; const row = this.W[l][o];
          for (let i = 0; i < a.length; i++) s += row[i] * a[i];
          z[o] = s;
        }
        const fn = ACT[this.spec[l].act].f;
        a = z.map(fn);
        zs.push(z); as.push(a);
      }
      return { zs, as, p: a[0] };
    }
    // one full-batch gradient step over data [{x,y}]; returns {loss, acc}
    trainStep(data, lr) {
      const L = this.spec.length;
      const gW = this.W.map(m => m.map(r => r.map(() => 0)));
      const gb = this.b.map(r => r.map(() => 0));
      let loss = 0, correct = 0;
      for (const d of data) {
        const { zs, as, p } = this.forward(d.x);
        loss += -(d.y * Math.log(p + 1e-9) + (1 - d.y) * Math.log(1 - p + 1e-9));
        if ((p > 0.5 ? 1 : 0) === d.y) correct++;
        // delta at output (BCE + sigmoid): p - y
        let delta = [p - d.y];
        for (let l = L - 1; l >= 0; l--) {
          const aIn = as[l];                       // input to layer l
          for (let o = 0; o < delta.length; o++) {
            gb[l][o] += delta[o];
            const row = gW[l][o];
            for (let i = 0; i < aIn.length; i++) row[i] += delta[o] * aIn[i];
          }
          if (l > 0) {                              // propagate to previous layer
            const prevZ = zs[l - 1], dfn = ACT[this.spec[l - 1].act].d;
            const nd = new Array(aIn.length).fill(0);
            for (let i = 0; i < aIn.length; i++) {
              let s = 0; for (let o = 0; o < delta.length; o++) s += this.W[l][o][i] * delta[o];
              nd[i] = s * dfn(prevZ[i]);
            }
            delta = nd;
          }
        }
      }
      const m = data.length;
      for (let l = 0; l < L; l++) {
        for (let o = 0; o < this.W[l].length; o++) {
          this.b[l][o] -= lr * gb[l][o] / m;
          for (let i = 0; i < this.W[l][o].length; i++) this.W[l][o][i] -= lr * gW[l][o][i] / m;
        }
      }
      return { loss: loss / m, acc: correct / m };
    }
    paramCount() { let n = 0; for (let l = 0; l < this.W.length; l++) n += this.b[l].length + this.W[l].length * this.W[l][0].length; return n; }
  }

  /* ---------- datasets (domain ~ [-2.5, 2.5]) ---------- */
  function jitter(n) { return (Math.random() - 0.5) * n; }
  const datasets = {
    xor(n = 200) { const out = []; for (let i = 0; i < n; i++) { const x = (Math.random() * 2 - 1) * 2.2, y = (Math.random() * 2 - 1) * 2.2; out.push({ x: [x, y], y: (x * y > 0) ? 1 : 0 }); } return out; },
    circle(n = 200) { const out = []; for (let i = 0; i < n; i++) { const inside = i < n / 2; const r = inside ? Math.random() * 1.0 : 1.5 + Math.random() * 0.9; const t = Math.random() * 6.283; out.push({ x: [r * Math.cos(t) + jitter(.1), r * Math.sin(t) + jitter(.1)], y: inside ? 1 : 0 }); } return out; },
    moons(n = 200) { const out = []; const h = n / 2; for (let i = 0; i < h; i++) { const t = Math.PI * i / h; out.push({ x: [Math.cos(t) * 1.5 - 0.7 + jitter(.18), Math.sin(t) * 1.5 - 0.4 + jitter(.18)], y: 0 }); out.push({ x: [1.5 - Math.cos(t) * 1.5 - 0.7 + jitter(.18), 0.4 - Math.sin(t) * 1.5 + 0.4 + jitter(.18)], y: 1 }); } return out; },
    spiral(n = 220) { const out = []; const h = n / 2; for (let i = 0; i < h; i++) { const r = i / h * 2.3; const t = i / h * 4 + 0; out.push({ x: [r * Math.cos(t) + jitter(.08), r * Math.sin(t) + jitter(.08)], y: 0 }); out.push({ x: [r * Math.cos(t + Math.PI) + jitter(.08), r * Math.sin(t + Math.PI) + jitter(.08)], y: 1 }); } return out; }
  };

  return { Net, datasets, ACT };
})();
