/* ============================================================
   三角函数页交互：① 会转的单位圆（拖拽/播放/吸附，同步扫出曲线）
                  ② 波形实验室 y = A·sin(ωx+φ)+k
   依赖：common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var COL = { sin: '#e05252', cos: '#d97706', tan: '#0d9488', accent: '#8b5cf6', axis: '#c3cad6' };
  var state = { theta: Math.PI / 4, playing: false, speed: 1, snap: false, raf: null, lastT: 0 };

  var cvC = document.getElementById('uCircle');
  var cvW = document.getElementById('uWave');

  /* ================= 实验 1：单位圆 ================= */
  function drawCircle() {
    var s = M.fit(cvC), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var R = Math.min(w, h) / 2 - 26;
    var cx = w / 2, cy = h / 2;
    var cos = Math.cos(state.theta), sin = Math.sin(state.theta);
    var tan = Math.abs(cos) < 1e-9 ? NaN : sin / cos;

    // 坐标轴
    ctx.strokeStyle = COL.axis;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - R - 16, cy); ctx.lineTo(cx + R + 16, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R - 16); ctx.lineTo(cx, cy + R + 16); ctx.stroke();
    ctx.fillStyle = '#9aa5b5'; ctx.font = '11px sans-serif';
    ctx.fillText('x', cx + R + 8, cy - 6);
    ctx.fillText('y', cx + 6, cy - R - 6);

    // 单位圆
    ctx.strokeStyle = '#8a94a6';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();

    // 角弧
    ctx.strokeStyle = COL.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(30, R * 0.3), 0, -state.theta, true);
    ctx.stroke();

    // 终边 OP
    var px = cx + cos * R, py = cy - sin * R;
    ctx.strokeStyle = COL.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

    // cos 段（中心 → (cosθ,0)）
    ctx.strokeStyle = COL.cos;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
    // sin 段（(cosθ,0) → P）
    ctx.strokeStyle = COL.sin;
    ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();

    // tan 段（切线 x=1 上）
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = '#d6dbe6';
    ctx.beginPath(); ctx.moveTo(cx + R, cy - R - 14); ctx.lineTo(cx + R, cy + R + 14); ctx.stroke();
    ctx.restore();
    if (isFinite(tan) && Math.abs(tan) <= 3.2) {
      var ty = cy - tan * R;
      ctx.strokeStyle = COL.tan;
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(cx + R, cy); ctx.lineTo(cx + R, ty); ctx.stroke();
      ctx.fillStyle = COL.tan;
      ctx.beginPath(); ctx.arc(cx + R, ty, 3.4, 0, TAU); ctx.fill();
    }

    // 点 P
    ctx.fillStyle = COL.accent;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill(); ctx.stroke();

    // 标签
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = COL.cos;
    ctx.fillText('cos θ', (cx + px) / 2 - 14, cy + (sin >= 0 ? 14 : -8));
    ctx.fillStyle = COL.sin;
    ctx.fillText('sin θ', px + (cos >= 0 ? 5 : -42), (cy + py) / 2 + 4);
    if (isFinite(tan) && Math.abs(tan) <= 3.2) {
      ctx.fillStyle = COL.tan;
      ctx.fillText('tan θ', cx + R + 5, cy - tan * R / 2);
    }
    ctx.fillStyle = '#9aa5b5';
    ctx.fillText('O', cx - 12, cy + 13);
    ctx.fillText('P', px + (cos >= 0 ? 8 : -16), py + (sin >= 0 ? -8 : 16));
  }

  function drawWave() {
    cvW.style.height = cvC.clientHeight + 'px';
    var s = M.fit(cvW), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 36, padR = 12, padT = 10, padB = 22;
    var pw = w - padL - padR, ph = h - padT - padB;
    var midY = padT + ph / 2;
    var yScale = ph / 2 / 1.5;

    function xpx(t) { return padL + t / TAU * pw; }
    function ypx(v) { return midY - v * yScale; }

    // 轴
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, midY); ctx.lineTo(w - padR, midY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.stroke();

    // x 轴刻度 π/2 的倍数
    ctx.font = '10px sans-serif'; ctx.fillStyle = '#9aa5b5'; ctx.textAlign = 'center';
    var halfPi = Math.PI / 2;
    var labels = ['π/2', 'π', '3π/2', '2π'];
    for (var i = 1; i <= 4; i++) {
      var t = halfPi * i, x = xpx(t);
      ctx.strokeStyle = '#e6eaf2';
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, h - padB); ctx.stroke();
      ctx.fillText(labels[i - 1], x, h - padB + 13);
    }
    // y 刻度
    ctx.textAlign = 'right';
    [-1, 1].forEach(function (v) {
      ctx.fillText(v, padL - 5, ypx(v) + 3);
      ctx.strokeStyle = '#e6eaf2';
      ctx.beginPath(); ctx.moveTo(padL, ypx(v)); ctx.lineTo(w - padR, ypx(v)); ctx.stroke();
    });

    // 曲线（先画淡的全貌，再画到当前角度为止的实线）
    function curve(fn, color, width, upto) {
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath();
      var started = false;
      for (var px = 0; px <= pw; px += 2) {
        var t = px / pw * TAU;
        if (t > upto) break;
        var y = ypx(fn(t));
        if (!started) { ctx.moveTo(padL + px, y); started = true; }
        else ctx.lineTo(padL + px, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.22;
    curve(Math.sin, COL.sin, 1.6, TAU);
    curve(Math.cos, COL.cos, 1.6, TAU);
    ctx.globalAlpha = 1;
    curve(Math.sin, COL.sin, 2.6, state.theta);
    curve(Math.cos, COL.cos, 2.6, state.theta);

    // 扫描线 + 当前点
    var sx = xpx(state.theta % TAU);
    ctx.save();
    ctx.strokeStyle = COL.accent; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx, padT); ctx.lineTo(sx, h - padB); ctx.stroke();
    ctx.restore();
    [[Math.sin, COL.sin], [Math.cos, COL.cos]].forEach(function (pair) {
      ctx.fillStyle = pair[1];
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, ypx(pair[0](state.theta)), 4.6, 0, TAU); ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = '#9aa5b5'; ctx.textAlign = 'left';
    ctx.fillText('θ', w - padR - 10, midY - 6);
  }

  function updateReadout() {
    var deg = state.theta * 180 / Math.PI;
    var sin = Math.sin(state.theta), cos = Math.cos(state.theta);
    document.getElementById('uTheta').textContent = deg.toFixed(1) + '° ≈ ' + M.fmt(state.theta) + ' rad';
    document.getElementById('uSin').textContent = M.fmt(sin, 3);
    document.getElementById('uCos').textContent = M.fmt(cos, 3);
    document.getElementById('uTan').textContent =
      Math.abs(cos) < 1e-6 ? '不存在' : M.fmt(sin / cos, 3);
  }

  function redrawAll() {
    drawCircle();
    drawWave();
    updateReadout();
  }

  function setFromPointer(e) {
    var rect = cvC.getBoundingClientRect();
    var cx = rect.width / 2, cy = rect.height / 2;
    var dx = e.clientX - rect.left - cx, dy = e.clientY - rect.top - cy;
    var t = Math.atan2(-dy, dx);
    if (t < 0) t += TAU;
    if (state.snap) t = Math.round(t / (Math.PI / 12)) * (Math.PI / 12) % TAU;
    state.theta = t;
    redrawAll();
  }

  function loop(ts) {
    if (!state.playing) return;
    if (state.lastT) {
      state.theta = (state.theta + (ts - state.lastT) / 1000 * state.speed * 1.1) % TAU;
      redrawAll();
    }
    state.lastT = ts;
    state.raf = requestAnimationFrame(loop);
  }

  function initUnitCircle() {
    var playBtn = document.getElementById('uPlay');
    playBtn.addEventListener('click', function () {
      state.playing = !state.playing;
      playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 播放旋转';
      if (state.playing) { state.lastT = 0; state.raf = requestAnimationFrame(loop); }
      else cancelAnimationFrame(state.raf);
    });
    document.getElementById('uSnap').addEventListener('change', function (e) {
      state.snap = e.target.checked;
      if (state.snap) {
        state.theta = Math.round(state.theta / (Math.PI / 12)) * (Math.PI / 12);
        redrawAll();
      }
    });
    document.getElementById('uSpeed').addEventListener('input', function (e) {
      state.speed = +e.target.value;
      document.getElementById('uSpeedV').textContent = state.speed.toFixed(1);
    });

    var dragging = false;
    cvC.addEventListener('pointerdown', function (e) {
      dragging = true;
      if (state.playing) playBtn.click();
      setFromPointer(e);
      cvC.setPointerCapture(e.pointerId);
    });
    cvC.addEventListener('pointermove', function (e) { if (dragging) setFromPointer(e); });
    cvC.addEventListener('pointerup', function () { dragging = false; });

    redrawAll();
  }

  /* ================= 实验 2：波形实验室 ================= */
  var W = { A: 1, w: 1, p: 0, k: 0, cv: document.getElementById('wCanvas') };

  function wDraw() {
    var s = M.fit(W.cv), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var view = { cx: 0, cy: 0, scale: w / 15 };
    var sx = view.scale, sy = h / 8; // 纵向独立比例
    var x0 = -7.5, x1 = 7.5;

    function X(x) { return (x - view.cx) * sx + w / 2; }
    function Y(y) { return h / 2 - (y - view.cy) * sy; }
    ctx.lineWidth = 1; ctx.font = '10px sans-serif';
    for (var i = Math.ceil(x0); i <= x1; i++) {
      ctx.strokeStyle = '#edf1f7';
      ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), h); ctx.stroke();
      if (i !== 0) { ctx.fillStyle = '#9aa5b5'; ctx.textAlign = 'center'; ctx.fillText(i, X(i), Y(0) + 13); }
    }
    for (var j = -4; j <= 4; j++) {
      ctx.strokeStyle = '#edf1f7';
      ctx.beginPath(); ctx.moveTo(0, Y(j)); ctx.lineTo(w, Y(j)); ctx.stroke();
      if (j !== 0) { ctx.fillStyle = '#9aa5b5'; ctx.textAlign = 'right'; ctx.fillText(j, X(0) - 5, Y(j) + 3); }
    }
    ctx.strokeStyle = '#8a94a6'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();

    function plot(fn, color, width, dash) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      var started = false;
      for (var px = 0; px <= w; px += 2) {
        var x = (px - w / 2) / sx + view.cx;
        var y = fn(x);
        if (!isFinite(y)) { started = false; continue; }
        if (!started) { ctx.moveTo(px, Y(y)); started = true; }
        else ctx.lineTo(px, Y(y));
      }
      ctx.stroke();
      ctx.restore();
    }

    // 包络线 y = k ± |A|
    ctx.save();
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = '#e7b9ef';
    [W.k + Math.abs(W.A), W.k - Math.abs(W.A)].forEach(function (v) {
      ctx.beginPath(); ctx.moveTo(0, Y(v)); ctx.lineTo(w, Y(v)); ctx.stroke();
    });
    ctx.restore();

    plot(Math.sin, '#b0bac8', 1.8, [6, 5]);
    plot(function (x) { return W.A * Math.sin(W.w * x + W.p) + W.k; }, '#8b5cf6', 2.8);
  }

  function n2(v) { return String(+(+v).toFixed(2)); }

  function wUpdate() {
    ['A', 'W', 'P', 'K'].forEach(function (key) {
      document.getElementById('w' + key + 'v').textContent = n2({ A: W.A, W: W.w, P: W.p, K: W.k }[key]);
    });
    // 公式
    var aPart = W.A === 1 ? '' : W.A === -1 ? '-' : n2(W.A);
    var xPart = W.w === 1 ? 'x' : n2(W.w) + 'x';
    if (W.p > 0) xPart += ' + ' + n2(W.p);
    else if (W.p < 0) xPart += ' - ' + n2(-W.p);
    var kPart = W.k === 0 ? '' : (W.k > 0 ? ' + ' + n2(W.k) : ' - ' + n2(-W.k));
    var tex = 'y = ' + (aPart ? aPart + '\\,\\sin\\left(' : '\\sin\\left(') + xPart + '\\right)' + kPart;
    var el = document.getElementById('wTex');
    el.textContent = tex;
    el.removeAttribute('data-tex');
    el.removeAttribute('data-rendered');
    M.renderTex();

    document.getElementById('wAmp').textContent = n2(Math.abs(W.A));
    document.getElementById('wPer').textContent = M.fmt(TAU / W.w);
    document.getElementById('wRange').textContent =
      '[' + M.fmt(W.k - Math.abs(W.A)) + ', ' + M.fmt(W.k + Math.abs(W.A)) + ']';
    wDraw();
  }

  function initWave() {
    [['wA', 'A'], ['wW', 'w'], ['wP', 'p'], ['wK', 'k']].forEach(function (pair) {
      document.getElementById(pair[0]).addEventListener('input', function (e) {
        W[pair[1]] = +e.target.value;
        wUpdate();
      });
    });
    wUpdate();
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'trig', [
    {
      q: '<span class="tex">\\sin 150^\\circ =</span> ？',
      opts: ['<span class="tex">\\dfrac{1}{2}</span>', '<span class="tex">-\\dfrac{1}{2}</span>', '<span class="tex">\\dfrac{\\sqrt{3}}{2}</span>', '<span class="tex">-\\dfrac{\\sqrt{3}}{2}</span>'],
      a: 0,
      ex: '<span class="tex">150^\\circ = 180^\\circ - 30^\\circ</span>，由诱导公式 <span class="tex">\\sin(\\pi-\\theta)=\\sin\\theta</span>，所以 <span class="tex">\\sin 150^\\circ = \\sin 30^\\circ = \\frac{1}{2}</span>。第二象限的正弦值为正。'
    },
    {
      q: '与角 <span class="tex">-60^\\circ</span> 终边相同的角是？',
      opts: ['只能表示为 <span class="tex">-60^\\circ</span>', '<span class="tex">-60^\\circ + k \\cdot 360^\\circ\\ (k \\in \\mathbb{Z})</span>', '<span class="tex">-60^\\circ + k \\cdot 180^\\circ\\ (k \\in \\mathbb{Z})</span>', '<span class="tex">60^\\circ</span>'],
      a: 1,
      ex: '终边相同的角相差整数圈，即相差 <span class="tex">k \\cdot 360^\\circ</span>。在单位圆实验里把角多转一圈，sin 和 cos 完全不变——这就是周期性。'
    },
    {
      q: '<span class="tex">\\cos(-\\theta) = \\cos\\theta</span> 说明 y = cos x 是什么函数？',
      opts: ['奇函数', '偶函数', '既是奇函数又是偶函数', '非奇非偶'],
      a: 1,
      ex: '满足 <span class="tex">f(-x)=f(x)</span>，是偶函数。几何上：θ 与 −θ 的终边关于 x 轴对称，横坐标（cos）相同、纵坐标（sin）相反。'
    },
    {
      q: '函数 <span class="tex">y = 3\\sin\\left(2x + \\dfrac{\\pi}{3}\\right)</span> 的最小正周期是？',
      opts: ['<span class="tex">2\\pi</span>', '<span class="tex">\\pi</span>', '<span class="tex">\\dfrac{\\pi}{2}</span>', '<span class="tex">4\\pi</span>'],
      a: 1,
      ex: '<span class="tex">T = \\dfrac{2\\pi}{\\omega} = \\dfrac{2\\pi}{2} = \\pi</span>。ω 越大，波形越"密"，周期越短——去实验 2 拖一下 ω 感受。'
    },
    {
      q: '角 θ 的终边与单位圆交于点 <span class="tex">\\left(\\dfrac{3}{5}, \\dfrac{4}{5}\\right)</span>，则 <span class="tex">\\tan\\theta =</span> ？',
      opts: ['<span class="tex">\\dfrac{3}{4}</span>', '<span class="tex">\\dfrac{4}{3}</span>', '<span class="tex">\\dfrac{3}{5}</span>', '<span class="tex">\\dfrac{5}{4}</span>'],
      a: 1,
      ex: '单位圆定义：<span class="tex">\\cos\\theta = \\frac{3}{5}</span>（横坐标），<span class="tex">\\sin\\theta = \\frac{4}{5}</span>（纵坐标），<span class="tex">\\tan\\theta = \\frac{y}{x} = \\frac{4/5}{3/5} = \\frac{4}{3}</span>。'
    }
  ]);

  /* ================= 启动 ================= */
  initUnitCircle();
  initWave();
  window.addEventListener('resize', redrawAll);
})();
