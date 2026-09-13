/* ============================================================
   向量页交互：① 加法/减法（拖端点，三角形/平行四边形法则）
              ② 点积与投影
   依赖：common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var COLA = '#4f46e5', COLB = '#0d9463', COLR = '#dc2626', COLP = '#f59e0b';

  function drawArrow(ctx, x1, y1, x2, y2, color, width) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var head = Math.max(9, width * 3.2);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - head * 0.7 * Math.cos(ang), y2 - head * 0.7 * Math.sin(ang));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  }
  function fmtPair(v) { return '(' + M.fmt(v[0], 2) + ', ' + M.fmt(v[1], 2) + ')'; }
  function n2(v) { return String(+(+v).toFixed(2)); }

  /* ================= 实验 1：加减法 ================= */
  var V = { a: [2, 1], b: [1, 2], mode: 'add', showTri: true };
  var vCv = document.getElementById('vCanvas');
  var SCALE = 42;

  function vDraw() {
    var s = M.fit(vCv), ctx = s.ctx, w = s.w, h = s.h;
    var view = { cx: 0, cy: 0, scale: SCALE };
    ctx.clearRect(0, 0, w, h);
    M.chart.grid(ctx, w, h, view);
    var O = [w / 2, h / 2];
    function PX(p) { return [w / 2 + p[0] * SCALE, h / 2 - p[1] * SCALE]; }
    var A = PX(V.a), B = PX(V.b);

    // 平行四边形 / 三角形辅助线
    if (V.mode === 'add') {
      var S = [V.a[0] + V.b[0], V.a[1] + V.b[1]];
      var SP = PX(S);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#b6bdd0';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(SP[0], SP[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      if (V.showTri) {
        // b 平移到 a 终点：从 A 指向 S
        ctx.strokeStyle = 'rgba(13,148,99,0.75)';
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(SP[0], SP[1]); ctx.stroke();
        ctx.fillStyle = 'rgba(13,148,99,0.75)';
        ctx.font = '11px sans-serif';
        ctx.fillText('b（平移后）', (A[0] + SP[0]) / 2 + 8, (A[1] + SP[1]) / 2);
      }
      ctx.restore();
      drawArrow(ctx, O[0], O[1], SP[0], SP[1], COLR, 3);
    } else {
      // a − b：从 B 的终点指向 A 的终点
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = COLR;
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(A[0], A[1]); ctx.stroke();
      ctx.restore();
      var D = [V.a[0] - V.b[0], V.a[1] - V.b[1]];
      var DP = PX(D);
      drawArrow(ctx, O[0], O[1], DP[0], DP[1], COLR, 3);
    }

    drawArrow(ctx, O[0], O[1], A[0], A[1], COLA, 3.4);
    drawArrow(ctx, O[0], O[1], B[0], B[1], COLB, 3.4);

    // 端点手柄
    [A, B].forEach(function (P, i) {
      ctx.fillStyle = i === 0 ? COLA : COLB;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(P[0], P[1], 7, 0, 7); ctx.fill(); ctx.stroke();
    });
    // 标签
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = COLA;
    ctx.fillText('a', A[0] + 10, A[1] - 8);
    ctx.fillStyle = COLB;
    ctx.fillText('b', B[0] + 10, B[1] - 8);
    var res = V.mode === 'add' ? [V.a[0] + V.b[0], V.a[1] + V.b[1]] : [V.a[0] - V.b[0], V.a[1] - V.b[1]];
    ctx.fillStyle = COLR;
    ctx.fillText(V.mode === 'add' ? 'a+b' : 'a−b', PX(res)[0] + 8, PX(res)[1] - 8);
    ctx.fillStyle = '#64748b';
    ctx.fillText('O', O[0] - 14, O[1] + 16);

    document.getElementById('vA').textContent = fmtPair(V.a);
    document.getElementById('vB').textContent = fmtPair(V.b);
    document.getElementById('vRes').textContent = fmtPair(res);
    document.getElementById('vResChip').innerHTML =
      (V.mode === 'add' ? 'a + b = ' : 'a − b = ') + '<b id="vRes">' + fmtPair(res) + '</b>';
  }

  function initV() {
    var seg = document.getElementById('vMode');
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        V.mode = b.dataset.m;
        vDraw();
      });
    });
    document.getElementById('vTri').addEventListener('change', function (e) { V.showTri = e.target.checked; vDraw(); });
    document.getElementById('vReset').addEventListener('click', function () {
      V.a = [2, 1]; V.b = [1, 2]; vDraw();
    });

    var drag = null; // 'a' | 'b'
    vCv.addEventListener('pointerdown', function (e) {
      drag = hitTip(e, vCv, [V.a, V.b]);
      if (drag) vCv.setPointerCapture(e.pointerId);
    });
    vCv.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var rect = vCv.getBoundingClientRect();
      var x = (e.clientX - rect.left - rect.width / 2) / SCALE;
      var y = -(e.clientY - rect.top - rect.height / 2) / SCALE;
      var t = drag === 'a' ? V.a : V.b;
      t[0] = M.clamp(Math.round(x * 20) / 20, -6, 6);
      t[1] = M.clamp(Math.round(y * 20) / 20, -4, 4);
      vDraw();
    });
    vCv.addEventListener('pointerup', function () { drag = null; });
    vDraw();
    window.addEventListener('resize', vDraw);
  }

  function hitTip(e, cv, vecs) {
    var rect = cv.getBoundingClientRect();
    for (var i = 0; i < vecs.length; i++) {
      var px = rect.width / 2 + vecs[i][0] * SCALE + rect.left;
      var py = rect.height / 2 - vecs[i][1] * SCALE + rect.top;
      if (Math.hypot(e.clientX - px, e.clientY - py) < 18) return i === 0 ? 'a' : 'b';
    }
    return null;
  }

  /* ================= 实验 2：点积与投影 ================= */
  var D = { a: [3, 1.5], b: [1.5, 2.5] };
  var dCv = document.getElementById('dCanvas');

  function dDraw() {
    var s = M.fit(dCv), ctx = s.ctx, w = s.w, h = s.h;
    var view = { cx: 0, cy: 0, scale: SCALE };
    ctx.clearRect(0, 0, w, h);
    M.chart.grid(ctx, w, h, view);
    var O = [w / 2, h / 2];
    function PX(p) { return [w / 2 + p[0] * SCALE, h / 2 - p[1] * SCALE]; }
    var A = PX(D.a), B = PX(D.b);

    var dot = D.a[0] * D.b[0] + D.a[1] * D.b[1];
    var la = Math.hypot(D.a[0], D.a[1]), lb = Math.hypot(D.b[0], D.b[1]);
    var cosT = la && lb ? dot / (la * lb) : 0;
    var theta = Math.acos(M.clamp(cosT, -1, 1)) * 180 / Math.PI;

    // 投影：b 在 a 方向的分量
    var coef = la ? dot / (la * la) : 0;
    var F = [D.a[0] * coef, D.a[1] * coef];
    var FP = PX(F);

    // a 所在直线（淡）
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = '#c7cddc';
    ctx.lineWidth = 1.2;
    var dirA = la ? [D.a[0] / la, D.a[1] / la] : [1, 0];
    ctx.beginPath();
    ctx.moveTo(O[0] - dirA[0] * 900, O[1] + dirA[1] * 900);
    ctx.lineTo(O[0] + dirA[0] * 900, O[1] - dirA[1] * 900);
    ctx.stroke();
    ctx.restore();

    // 垂线（B → F）
    if (Math.abs(lb) > 0.05) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#9aa5b5';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(FP[0], FP[1]); ctx.stroke();
      ctx.restore();
    }
    // 投影向量
    if (Math.hypot(F[0], F[1]) > 0.02) drawArrow(ctx, O[0], O[1], FP[0], FP[1], COLP, 4);

    // 夹角弧
    var angA = Math.atan2(-D.a[1], D.a[0]);
    var angB = Math.atan2(-D.b[1], D.b[0]);
    var rArc = Math.min(46, 24 + 18 * Math.min(la, lb));
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    // 选劣弧方向
    var diff = angB - angA;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(O[0], O[1], rArc, -angA, -angA - diff, diff < 0);
    ctx.stroke();
    // θ 标签
    var mid = -angA - diff / 2;
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('θ=' + M.fmt(theta, 1) + '°', O[0] + (rArc + 14) * Math.cos(mid), O[1] + (rArc + 14) * Math.sin(mid));

    drawArrow(ctx, O[0], O[1], A[0], A[1], COLA, 3.4);
    drawArrow(ctx, O[0], O[1], B[0], B[1], COLB, 3.4);
    [A, B].forEach(function (P, i) {
      ctx.fillStyle = i === 0 ? COLA : COLB;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(P[0], P[1], 7, 0, 7); ctx.fill(); ctx.stroke();
    });
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = COLA; ctx.fillText('a', A[0] + 10, A[1] - 8);
    ctx.fillStyle = COLB; ctx.fillText('b', B[0] + 10, B[1] - 8);
    ctx.fillStyle = COLP; ctx.fillText('投影', FP[0] + 8, FP[1] - 8);

    // 读数
    document.getElementById('dNum').textContent = M.fmt(dot, 3);
    document.getElementById('dGeo').textContent = M.fmt(la * lb * cosT, 3);
    document.getElementById('dCos').textContent = M.fmt(cosT, 3);
    document.getElementById('dDeg').textContent = M.fmt(theta, 1) + '°';
    document.getElementById('dNote').innerHTML = Math.abs(cosT) < 0.04
      ? '🎯 <b>点积 = 0，投影缩成一点！</b>两向量垂直——这就是"a ⊥ b ⇔ a·b = 0"。'
      : (dot > 0
        ? '🎯 点积为<b>正</b>：夹角是锐角，b 在 a 方向上"往前走"。试着拖到垂直（点积归零）或钝角（点积变负）。'
        : '🎯 点积为<b>负</b>：夹角是钝角，投影甚至指向 a 的反方向。继续拖，看点积何时归零。');
  }

  function initD() {
    var drag = null;
    dCv.addEventListener('pointerdown', function (e) {
      drag = hitTip(e, dCv, [D.a, D.b]);
      if (drag) dCv.setPointerCapture(e.pointerId);
    });
    dCv.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var rect = dCv.getBoundingClientRect();
      var x = (e.clientX - rect.left - rect.width / 2) / SCALE;
      var y = -(e.clientY - rect.top - rect.height / 2) / SCALE;
      var t = drag === 'a' ? D.a : D.b;
      t[0] = M.clamp(Math.round(x * 20) / 20, -6, 6);
      t[1] = M.clamp(Math.round(y * 20) / 20, -4, 4);
      dDraw();
    });
    dCv.addEventListener('pointerup', function () { drag = null; });
    dDraw();
    window.addEventListener('resize', dDraw);
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'vectors', [
    {
      q: '已知 <span class="tex">\\vec{a} = (1, 2)</span>，<span class="tex">\\vec{b} = (3, -1)</span>，则 <span class="tex">\\vec{a} + \\vec{b} =</span> ？',
      opts: ['<span class="tex">(4, 1)</span>', '<span class="tex">(2, 3)</span>', '<span class="tex">(4, -1)</span>', '<span class="tex">(3, 1)</span>'],
      a: 0,
      ex: '坐标分别相加：<span class="tex">(1+3,\\ 2+(-1)) = (4, 1)</span>。在实验 1 里把两个箭头拖成这个值，红色对角线就是 (4,1)。'
    },
    {
      q: '<span class="tex">\\vec{a} = (2, -1)</span>，<span class="tex">\\vec{b} = (1, 3)</span>，则 <span class="tex">\\vec{a} \\cdot \\vec{b} =</span> ？',
      opts: ['5', '−1', '1', '−5'],
      a: 1,
      ex: '<span class="tex">2 \\times 1 + (-1) \\times 3 = -1</span>。点积为负说明夹角是钝角——去实验 2 摆出这两个向量验证。'
    },
    {
      q: '<span class="tex">\\vec{a} = (3, 4)</span>，则 <span class="tex">|\\vec{a}| =</span> ？',
      opts: ['7', '5', '25', '12'],
      a: 1,
      ex: '<span class="tex">|\\vec{a}| = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5</span>——经典的 3-4-5 直角三角形。'
    },
    {
      q: '若 <span class="tex">\\vec{a} = (2, 3)</span> 与 <span class="tex">\\vec{b} = (-3, m)</span> 垂直，则 m = ？',
      opts: ['2', '−2', '3', '4.5'],
      a: 0,
      ex: '垂直 ⇔ 点积为 0：<span class="tex">2 \\times (-3) + 3m = 0 \\Rightarrow m = 2</span>。'
    },
    {
      q: '什么时候 <span class="tex">|\\vec{a} + \\vec{b}| = |\\vec{a}| + |\\vec{b}|</span> ？',
      opts: ['a ⊥ b 时', 'a、b 方向相同（共线同向）时', 'a、b 方向相反时', '任何时刻'],
      a: 1,
      ex: '三角形不等式 <span class="tex">|\\vec a+\\vec b| \\le |\\vec a|+|\\vec b|</span>，仅当两向量<b>同向共线</b>时"三角形"压扁成线段，等号才成立。'
    }
  ]);

  /* ================= 启动 ================= */
  initV();
  initD();
})();
