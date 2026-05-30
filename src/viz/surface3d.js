/* SEE IT LEARN · 3D — continuously-animating loss landscape + live descent.
   Hand-rolled 3D projection on canvas. No WebGL, no deps. */
(function () {
  "use strict";
  const cv = $("#s3dCanvas"), x = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  let lr = 0.10, surf = "valley", yaw = 0.6, pitch = 0.95, dragging = false, lastX = 0, lastY = 0;
  let ball = null, vel = [0, 0], trail = [], steps = 0;
  const R = 2.6, GRID = 30;

  // ---- the landscapes (z = loss) ----
  const L = {
    valley: (u, v) => 0.45 * (0.35 * u * u + v * v) + 0.6 * Math.sin(u * 0.9) + 1.2,
    bowl:   (u, v) => 0.5 * (u * u + v * v) * 0.6 + 0.2,
    ridges: (u, v) => 1.6 + 0.18 * (u * u + v * v) + 1.1 * Math.sin(u * 1.5) * Math.cos(v * 1.5)
  };
  function f(u, v) { return L[surf](u, v); }
  function grad(u, v) { const e = 1e-3; return [(f(u + e, v) - f(u - e, v)) / (2 * e), (f(u, v + e) - f(u, v - e)) / (2 * e)]; }

  // ---- 3D -> 2D projection ----
  function project(u, z, v) {
    // u,v are plane coords; z is height (loss). center the height a bit.
    const y = -(z - 1.6) * 0.62;                       // up axis (negative = higher on screen)
    // rotate around vertical (yaw) then tilt (pitch)
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    let X = u * cy - v * sy, Z = u * sy + v * cy, Y = y;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const Y2 = Y * cp - Z * sp, Z2 = Y * sp + Z * cp;
    const persp = 6 / (6 + Z2);                          // simple perspective
    return { sx: W / 2 + X * 92 * persp, sy: H / 2 + Y2 * 92 * persp - 30, depth: Z2 };
  }

  const colormap = t => {                               // t: 0 (high loss) .. 1 (low loss)
    const r = Math.round(8 + t * 70), g = Math.round(40 + t * 200), b = Math.round(30 + t * 150);
    return [r, g, b];
  };

  function draw() {
    x.clearRect(0, 0, W, H);
    x.fillStyle = "#05100c"; x.fillRect(0, 0, W, H);
    // build quads
    let lo = 1e9, hi = -1e9;
    const zc = [];
    for (let i = 0; i <= GRID; i++) { zc[i] = []; for (let j = 0; j <= GRID; j++) { const u = (i / GRID * 2 - 1) * R, v = (j / GRID * 2 - 1) * R; const z = f(u, v); zc[i][j] = z; lo = Math.min(lo, z); hi = Math.max(hi, z); } }
    const quads = [];
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
      const u0 = (i / GRID * 2 - 1) * R, u1 = ((i + 1) / GRID * 2 - 1) * R;
      const v0 = (j / GRID * 2 - 1) * R, v1 = ((j + 1) / GRID * 2 - 1) * R;
      const p00 = project(u0, zc[i][j], v0), p10 = project(u1, zc[i + 1][j], v0),
            p11 = project(u1, zc[i + 1][j + 1], v1), p01 = project(u0, zc[i][j + 1], v1);
      const zavg = (zc[i][j] + zc[i + 1][j] + zc[i + 1][j + 1] + zc[i][j + 1]) / 4;
      const depth = (p00.depth + p10.depth + p11.depth + p01.depth) / 4;
      quads.push({ pts: [p00, p10, p11, p01], t: 1 - (zavg - lo) / (hi - lo + 1e-9), depth });
    }
    quads.sort((a, b) => b.depth - a.depth);            // painter's: far first
    for (const q of quads) {
      const [r, g, b] = colormap(q.t);
      x.beginPath(); x.moveTo(q.pts[0].sx, q.pts[0].sy);
      for (let k = 1; k < 4; k++) x.lineTo(q.pts[k].sx, q.pts[k].sy); x.closePath();
      x.fillStyle = `rgb(${r},${g},${b})`; x.fill();
      x.strokeStyle = "rgba(5,16,12,.55)"; x.lineWidth = 0.5; x.stroke();
    }
    // marble + trail
    if (ball) {
      if (trail.length > 1) {
        x.strokeStyle = "rgba(246,177,74,.85)"; x.lineWidth = 2; x.beginPath();
        trail.forEach((p, i) => { const pr = project(p[0], f(p[0], p[1]), p[1]); i ? x.lineTo(pr.sx, pr.sy) : x.moveTo(pr.sx, pr.sy); }); x.stroke();
      }
      const pr = project(ball[0], f(ball[0], ball[1]), ball[1]);
      x.beginPath(); x.arc(pr.sx, pr.sy, 7, 0, 7); x.fillStyle = AMBER; x.shadowColor = AMBER; x.shadowBlur = 16; x.fill(); x.shadowBlur = 0;
      x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.stroke();
    }
    // labels
    x.fillStyle = "#566860"; x.font = "11px 'JetBrains Mono'";
    x.fillText("height = loss · marble = the optimizer descending · drag to orbit", 14, H - 12);
  }

  function respawn() { ball = [(Math.random() * 2 - 1) * R * 0.85, (Math.random() * 2 - 1) * R * 0.85]; vel = [0, 0]; trail = [ball.slice()]; steps = 0; }

  function tick() {
    if (!dragging) yaw += 0.0045;                       // gentle continuous rotation
    if (ball) {
      const g = grad(ball[0], ball[1]);
      vel[0] = vel[0] * 0.55 - lr * g[0]; vel[1] = vel[1] * 0.55 - lr * g[1];
      ball[0] = Math.max(-R, Math.min(R, ball[0] + vel[0]));
      ball[1] = Math.max(-R, Math.min(R, ball[1] + vel[1]));
      trail.push(ball.slice()); if (trail.length > 90) trail.shift();
      steps++;
      $("#s3dStep").textContent = steps; $("#s3dLoss").textContent = f(ball[0], ball[1]).toFixed(3);
      if ((Math.hypot(vel[0], vel[1]) < 1e-3 && steps > 30) || steps > 320) respawn();  // loop forever
    }
    draw(); requestAnimationFrame(tick);
  }

  // ---- interaction ----
  cv.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  addEventListener("pointerup", () => dragging = false);
  cv.addEventListener("pointermove", e => { if (!dragging) return; yaw += (e.clientX - lastX) * 0.01; pitch = Math.max(0.25, Math.min(1.45, pitch + (e.clientY - lastY) * 0.006)); lastX = e.clientX; lastY = e.clientY; });
  $("#s3dLr").oninput = e => { lr = +e.target.value / 100; $("#s3dLrVal").textContent = lr.toFixed(2); };
  $("#s3dSurf").onchange = e => { surf = e.target.value; respawn(); };
  $("#s3dNew").onclick = respawn;

  respawn(); tick();
})();
