/* ============================================================
   导数页交互：① 割线→切线极限动画（P 可拖）
              ② 导函数描迹（上半原函数+切线，下半导数轨迹）
   依赖：common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var ORANGE = '#f59e0b';
  var SEC = '#ea580c';

  /* 函数库：f 原函数，tex 名称，xMin/xMax 拖动范围 */
  var FUNCS = [
    { f: function (x) { return x * x; },           df: function (x) { return 2 * x; },           tex: 'x^2',        name: 'f(x) = x²' },
    { f: function (x) { return x * x * x - 3 * x; }, df: function (x) { return 3 * x * x - 3; }, tex: 'x^3 - 3x',   name: 'f(x) = x³ − 3x' },
    { f: Math.sin,                                 df: Math.cos,                                 tex: '\\sin x',    name: 'f(x) = sin x' },
    { f: function (x) { return Math.exp(x) / 2; }, df: function (x) { return Math.exp(x) / 2; }, tex: 'e^x/2',      name: 'f(x) = eˣ/2' }
  ];
  function numD(f, x) { return (f(x + 1e-4) - f(x - 1e-4)) / 2e-4; }
  function n2(v) { return String(+(+v).toFixed(2)); }

  /* ================= 实验 1：割线 → 切线 ================= */
  var S1 = { fi: 0, x0: 0.5, h: 1.5, anim: null };
  var dCv = document.getElementById('dCanvas');

  function secSlope() {
    var F = FUNCS[S1.fi];
    return (F.f(S1.x0 + S1.h) - F.f(S1.x0)) / S1.h;
  }

  function s1Draw() {
    var s = M.fit(dCv), ctx = s.ctx, w = s.w, h = s.h;
    var F = FUNCS[S1.fi];
    var view = { cx: 0, cy: 0, scale: w / 8 };
    ctx.clearRect(0, 0, w, h);
    M.chart.grid(ctx, w, h, view);

    var xL = view.cx - w / 2 / view.scale, xR = view.cx + w / 2 / view.scale;
    var y0 = F.f(S1.x0);

    // 切线（紫色虚线）
    var kt = numD(F.f, S1.x0);
    M.chart.line(ctx, w, h, view, xL, y0 + kt * (xL - S1.x0), xR, y0 + kt * (xR - S1.x0), '#7c3aed', 2, [7, 5]);
    // 割线（橙色）
    var ks = secSlope();
    if (isFinite(ks) && Math.abs(S1.h) > 1e-4) {
      var xq = S1.x0 + S1.h, yq = F.f(xq);
      M.chart.line(ctx, w, h, view, xL, y0 + ks * (xL - S1.x0), xR, y0 + ks * (xR - S1.x0), SEC, 2.2);
      M.chart.dot(ctx, w, h, view, xq, yq, 5.5, SEC, '#fff');
      // h 标注
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      var yPx = h / 2 + view.cy * view.scale;
      ctx.beginPath(); ctx.moveTo((S1.x0 - view.cx) * view.scale + w / 2, yPx + 12); ctx.lineTo((xq - view.cx) * view.scale + w / 2, yPx + 12); ctx.stroke();
      ctx.setLineDash([]);
    }
    // 原函数
    M.chart.plot(ctx, w, h, view, F.f, ORANGE, 2.6);
    // P 点
    M.chart.dot(ctx, w, h, view, S1.x0, y0, 7, '#b45309', '#fff');

    // 更新读数
    document.getElementById('dSec').textContent = isFinite(ks) ? M.fmt(ks, 3) : '—';
    document.getElementById('dTan').textContent = M.fmt(kt, 3);
    document.getElementById('dHh').textContent = n2(S1.h);
  }

  function s1Update() {
    document.getElementById('dX0v').textContent = n2(S1.x0);
    document.getElementById('dHv').textContent = n2(S1.h);
    s1Draw();
  }

  function playH() {
    if (S1.anim) { cancelAnimationFrame(S1.anim); S1.anim = null; return; }
    var sign = S1.h >= 0 ? 1 : -1;
    if (Math.abs(S1.h) < 0.02) S1.h = sign * 1.5; // 从头播放
    function step() {
      S1.h *= 0.88;
      if (Math.abs(S1.h) < 0.02) {
        S1.h = 0.02 * sign;
        s1Update();
        S1.anim = null;
        return;
      }
      s1Update();
      S1.anim = requestAnimationFrame(step);
    }
    S1.anim = requestAnimationFrame(step);
  }

  function initS1() {
    document.getElementById('dFun').addEventListener('change', function (e) {
      S1.fi = +e.target.value;
      s1Update();
    });
    document.getElementById('dX0').addEventListener('input', function (e) { S1.x0 = +e.target.value; s1Update(); });
    document.getElementById('dH').addEventListener('input', function (e) {
      S1.h = +e.target.value;
      if (S1.anim) { cancelAnimationFrame(S1.anim); S1.anim = null; }
      s1Update();
    });
    document.getElementById('dPlay').addEventListener('click', playH);

    // 拖动 P
    var dragging = false;
    dCv.addEventListener('pointerdown', function (e) {
      dragging = nearP(e);
      if (dragging) dCv.setPointerCapture(e.pointerId);
    });
    dCv.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var rect = dCv.getBoundingClientRect();
      var view = { cx: 0, scale: rect.width / 8 };
      S1.x0 = M.clamp((e.clientX - rect.left - rect.width / 2) / view.scale + 0, -2.8, 2.8);
      document.getElementById('dX0').value = S1.x0;
      s1Update();
    });
    dCv.addEventListener('pointerup', function () { dragging = false; });

    s1Update();
    window.addEventListener('resize', s1Draw);
  }

  function nearP(e) {
    var rect = dCv.getBoundingClientRect();
    var view = { cx: 0, cy: 0, scale: rect.width / 8 };
    var px = (S1.x0 - view.cx) * view.scale + rect.width / 2;
    var py = rect.height / 2 - (FUNCS[S1.fi].f(S1.x0) - view.cy) * view.scale;
    var dx = e.clientX - rect.left - px, dy = e.clientY - rect.top - py;
    return dx * dx + dy * dy < 400;
  }

  /* ================= 实验 2：导函数描迹 ================= */
  var S2 = { fi: 0, x: -3, trail: [], anim: null };
  var gCv = document.getElementById('gCanvas');

  function s2Draw() {
    var s = M.fit(gCv), ctx = s.ctx, w = s.w, h = s.h;
    var F = FUNCS[S2.fi];
    var split = h * 0.56; // 上下面板分界
    var bh = h - split - 7; // 下半面板高度
    var viewT = { cx: 0, cy: 0, scale: w / 7.6 };
    // 下半导数面板的纵向范围
    var dMax = 0;
    for (var xs = -3.5; xs <= 3.5; xs += 0.1) dMax = Math.max(dMax, Math.abs(F.df(xs)));
    dMax = Math.max(dMax, 1.2) * 1.15;
    ctx.clearRect(0, 0, w, h);

    /* ---- 上半：原函数 ---- */
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, split); ctx.clip();
    M.chart.grid(ctx, w, split, viewT);
    var xL = -w / 2 / viewT.scale, xR = w / 2 / viewT.scale;
    var y0 = F.f(S2.x), kt = F.df(S2.x);
    M.chart.line(ctx, w, split, viewT, xL, y0 + kt * (xL - S2.x), xR, y0 + kt * (xR - S2.x), '#7c3aed', 1.8, [6, 4]);
    M.chart.plot(ctx, w, split, viewT, F.f, ORANGE, 2.6);
    M.chart.dot(ctx, w, split, viewT, S2.x, y0, 7, '#b45309', '#fff');
    ctx.restore();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('y = f(x)', 10, 18);

    /* ---- 分隔线 ---- */
    ctx.strokeStyle = '#dde3ee';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, split); ctx.lineTo(w, split); ctx.stroke();

    /* ---- 下半：导数轨迹 ---- */
    var bTop = split + 14;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, bTop, w, h - bTop); ctx.clip();
    ctx.translate(0, split + 7); // 下半网格以自身中心铺
    var sx2 = w / 7.6, sy2 = bh / (2 * dMax); // 横纵独立比例
    function BX(x) { return w / 2 + x * sx2; }
    function BY(y) { return bh / 2 - y * sy2; }
    // 自绘网格（横轴 x∈[-3.5,3.5]，纵轴 ±dMax）
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (var gx = -3; gx <= 3; gx++) {
      ctx.strokeStyle = '#edf1f7';
      ctx.beginPath(); ctx.moveTo(BX(gx), 0); ctx.lineTo(BX(gx), bh); ctx.stroke();
      if (gx !== 0) { ctx.fillStyle = '#9aa5b5'; ctx.fillText(gx, BX(gx), bh / 2 + 13); }
    }
    var yStep = M.chart.niceStep(dMax / 2.5);
    for (var gy = Math.ceil(-dMax / yStep) * yStep; gy <= dMax + 1e-9; gy += yStep) {
      ctx.strokeStyle = '#edf1f7';
      ctx.beginPath(); ctx.moveTo(0, BY(gy)); ctx.lineTo(w, BY(gy)); ctx.stroke();
      if (Math.abs(gy) > 1e-9) {
        ctx.fillStyle = '#9aa5b5';
        ctx.textAlign = 'right';
        ctx.fillText(M.fmt(gy, 1), BX(0) + 30, BY(gy) - 3);
        ctx.textAlign = 'center';
      }
    }
    ctx.strokeStyle = '#8a94a6'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, BY(0)); ctx.lineTo(w, BY(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(BX(0), 0); ctx.lineTo(BX(0), bh); ctx.stroke();
    // 轨迹点
    ctx.fillStyle = 'rgba(220,38,38,0.85)';
    S2.trail.forEach(function (tx) {
      ctx.beginPath(); ctx.arc(BX(tx), BY(F.df(tx)), 2.1, 0, 7); ctx.fill();
    });
    // 当前导数点（大）
    var cxp = BX(S2.x);
    var cyp = BY(F.df(S2.x));
    ctx.strokeStyle = 'rgba(220,38,38,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cxp, 0); ctx.lineTo(cxp, bh); ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cxp, cyp, 5.5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText("y = f′(x) —— 轨迹", 10, split + 20);
  }

  function addTrail(x) {
    var q = Math.round(x * 50) / 50;
    if (S2.trail.indexOf(q) < 0) {
      S2.trail.push(q);
      if (S2.trail.length > 1500) S2.trail.shift();
    }
  }

  function scanLoop(ts) {
    if (!S2.anim) return;
    if (S2.lastT) {
      S2.x += (ts - S2.lastT) / 1000 * 2.2;
      if (S2.x > 3.2) S2.x = -3.2;
      addTrail(S2.x);
      s2Draw();
    }
    S2.lastT = ts;
    S2.anim = requestAnimationFrame(scanLoop);
  }

  function initS2() {
    document.getElementById('gFun').addEventListener('change', function (e) {
      S2.fi = +e.target.value;
      S2.trail = [];
      s2Draw();
    });
    document.getElementById('gScan').addEventListener('click', function () {
      if (S2.anim) {
        cancelAnimationFrame(S2.anim);
        S2.anim = null;
        return;
      }
      S2.lastT = 0;
      S2.anim = requestAnimationFrame(scanLoop);
    });
    document.getElementById('gReset').addEventListener('click', function () {
      S2.trail = [];
      s2Draw();
    });

    var dragging = false;
    gCv.addEventListener('pointerdown', function (e) {
      if (e.clientY - gCv.getBoundingClientRect().top < gCv.clientHeight * 0.56) {
        dragging = true;
        gCv.setPointerCapture(e.pointerId);
        dragTo(e);
      }
    });
    gCv.addEventListener('pointermove', function (e) { if (dragging) dragTo(e); });
    gCv.addEventListener('pointerup', function () { dragging = false; });

    function dragTo(e) {
      var rect = gCv.getBoundingClientRect();
      S2.x = M.clamp((e.clientX - rect.left - rect.width / 2) / (rect.width / 7.6), -3.4, 3.4);
      addTrail(S2.x);
      s2Draw();
    }

    s2Draw();
    window.addEventListener('resize', s2Draw);
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'derivatives', [
    {
      q: '<span class="tex">f(x) = x^2</span>，则 <span class="tex">f\'(3) =</span> ？',
      opts: ['6', '9', '5', '3'],
      a: 0,
      ex: '<span class="tex">f\'(x) = 2x</span>，所以 <span class="tex">f\'(3) = 6</span>。几何上：抛物线在 x = 3 处的切线斜率是 6——在实验 2 里拖到 x = 3 看下半图的点正好是 6。'
    },
    {
      q: '<span class="tex">f(x) = x^3 - 3x</span> 的极大值是？',
      opts: ['2', '−2', '0', '1'],
      a: 0,
      ex: '<span class="tex">f\'(x) = 3x^2 - 3 = 0</span> 得 <span class="tex">x = \\pm 1</span>；x = −1 处 f′ 由正变负，是极大值点，<span class="tex">f(-1) = -1 + 3 = 2</span>。'
    },
    {
      q: '曲线 <span class="tex">y = x^2</span> 在点 (1, 1) 处的切线方程是？',
      opts: ['<span class="tex">y = 2x - 1</span>', '<span class="tex">y = 2x + 1</span>', '<span class="tex">y = x</span>', '<span class="tex">y = -2x + 3</span>'],
      a: 0,
      ex: '切线斜率 <span class="tex">k = f\'(1) = 2</span>，过点 (1,1)：<span class="tex">y - 1 = 2(x-1)</span>，即 <span class="tex">y = 2x - 1</span>。'
    },
    {
      q: '<span class="tex">f(x) = \\sin x</span> 在 <span class="tex">x = 0</span> 处的切线斜率是？',
      opts: ['0', '1', '−1', '不存在'],
      a: 1,
      ex: '<span class="tex">f\'(x) = \\cos x</span>，<span class="tex">f\'(0) = 1</span>。正弦曲线在原点处"爬得最陡"，斜率正好是 1。'
    },
    {
      q: '在区间 (a, b) 上恒有 <span class="tex">f\'(x) > 0</span>，则 f(x) 在该区间上？',
      opts: ['单调递增', '单调递减', '先增后减', '无法确定'],
      a: 0,
      ex: '导数为正 ⇒ 切线斜率为正 ⇒ 图像上坡 ⇒ 单调递增。这正是"用导数研究单调性"的核心。'
    }
  ]);

  /* ================= 启动 ================= */
  initS1();
  initS2();
})();
