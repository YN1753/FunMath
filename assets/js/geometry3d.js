/* ============================================================
   立体几何页交互：迷你 3D 引擎（透视投影 + 画家算法 + 平面着色）
   六种几何体：正方体 / 三棱柱 / 四棱锥 / 圆柱 / 圆锥 / 球
   依赖：common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var CYAN = [6, 182, 212];

  /* ---------- 几何体数据 ---------- */
  function ring(n, r, y) {
    var v = [];
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2;
      v.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return v;
  }
  function polyRing(v, off, n, flip) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(off + (flip ? n - 1 - i : i));
    return idx;
  }

  function buildSolids() {
    var solids = [];

    // 0 正方体
    (function () {
      var v = [], faces = [];
      for (var i = 0; i < 8; i++) {
        v.push([(i & 1 ? 1 : -1), (i & 2 ? 1 : -1), (i & 4 ? 1 : -1)]);
      }
      // 六个面（索引顺序需构成环）
      faces.push([0, 1, 3, 2]); // y=-1 底
      faces.push([4, 6, 7, 5]); // y=+1 顶
      faces.push([0, 2, 6, 4]); // x=-1
      faces.push([1, 5, 7, 3]); // x=+1
      faces.push([0, 4, 5, 1]); // z=-1
      faces.push([2, 3, 7, 6]); // z=+1
      solids.push({ name: '正方体', verts: v, faces: faces, V: 8, E: 12, F: 6, curved: false,
        note: '✅ 简单多面体：V − E + F = 8 − 12 + 6 = 2，永远成立——欧拉公式。' });
    })();

    // 1 三棱柱
    (function () {
      var bot = ring(3, 1.25, -1), top = ring(3, 1.25, 1);
      var v = bot.concat(top);
      var faces = [
        [0, 2, 1],            // 底三角（外向）
        [3, 4, 5],            // 顶三角
        [0, 1, 4, 3],
        [1, 2, 5, 4],
        [2, 0, 3, 5]
      ];
      solids.push({ name: '三棱柱', verts: v, faces: faces, V: 6, E: 9, F: 5, curved: false,
        note: '✅ 6 − 9 + 5 = 2 ✓。n 棱柱：顶点 2n、棱 3n、面 n+2。' });
    })();

    // 2 四棱锥
    (function () {
      var v = [[-1, -0.8, -1], [1, -0.8, -1], [1, -0.8, 1], [-1, -0.8, 1], [0, 1.4, 0]];
      var faces = [[0, 3, 2, 1], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]];
      solids.push({ name: '四棱锥', verts: v, faces: faces, V: 5, E: 8, F: 5, curved: false,
        note: '✅ 5 − 8 + 5 = 2 ✓。n 棱锥：顶点 n+1、棱 2n、面 n+1。' });
    })();

    // 3 圆柱
    (function () {
      var N = 18, v = [], faces = [];
      var bot = ring(N, 1, -1.1), top = ring(N, 1, 1.1);
      v = bot.concat(top);
      for (var i = 0; i < N; i++) {
        var j = (i + 1) % N;
        faces.push([i, j, N + j, N + i]); // 侧面
      }
      faces.push(polyRing(v, 0, N, true));   // 底面
      faces.push(polyRing(v, N, N, false));  // 顶面
      solids.push({ name: '圆柱', verts: v, faces: faces, V: 2 * N, E: 3 * N, F: N + 2, curved: true,
        note: '🌀 曲面体无法真正数"棱"和"面"——显示的是网格划分后的数字（此处恰好 V − E + F = 2）。真实答案：无顶点、无棱、3 个面（曲 2 平 1）。' });
    })();

    // 4 圆锥
    (function () {
      var N = 18, v = ring(N, 1, -1);
      v.push([0, 1.3, 0]); // 锥顶
      var apex = N;
      var faces = [];
      for (var i = 0; i < N; i++) faces.push([i, (i + 1) % N, apex]);
      faces.push(polyRing(v, 0, N, true));
      solids.push({ name: '圆锥', verts: v, faces: faces, V: N + 1, E: 2 * N, F: N + 1, curved: true,
        note: '🌀 同样是网格数字。真实答案：1 个顶点、0 条棱、2 个面（1 曲 1 平）。侧面展开是扇形！' });
    })();

    // 5 球（UV 网格）
    (function () {
      var LAT = 6, LON = 14, v = [], faces = [];
      v.push([0, 1.15, 0]); // 北极
      for (var la = 1; la < LAT; la++) {
        var phi = la / LAT * Math.PI;
        for (var lo = 0; lo < LON; lo++) {
          var th = lo / LON * Math.PI * 2;
          v.push([Math.sin(phi) * Math.cos(th) * 1.15, Math.cos(phi) * 1.15, Math.sin(phi) * Math.sin(th) * 1.15]);
        }
      }
      v.push([0, -1.15, 0]); // 南极
      var south = v.length - 1;
      // 上北极三角
      for (var lo2 = 0; lo2 < LON; lo2++) {
        faces.push([0, 1 + lo2, 1 + (lo2 + 1) % LON]);
      }
      // 中间四边形
      for (var la2 = 1; la2 < LAT - 1; la2++) {
        for (var lo3 = 0; lo3 < LON; lo3++) {
          var a = 1 + (la2 - 1) * LON + lo3;
          var b2 = 1 + (la2 - 1) * LON + (lo3 + 1) % LON;
          var c2 = 1 + la2 * LON + (lo3 + 1) % LON;
          var d2 = 1 + la2 * LON + lo3;
          faces.push([a, b2, c2, d2]);
        }
      }
      // 下南极三角
      var base = 1 + (LAT - 2) * LON;
      for (var lo4 = 0; lo4 < LON; lo4++) {
        faces.push([base + lo4, south, base + (lo4 + 1) % LON]);
      }
      solids.push({ name: '球', verts: v, faces: faces, V: v.length, E: null, F: faces.length, curved: true,
        note: '🌀 球面完全光滑：0 个顶点、0 条棱、1 个曲面。表面积 S = 4πr²，体积 V = 4πr³/3。' });
    })();

    return solids;
  }

  /* ---------- 渲染 ---------- */
  var G = { solids: buildSolids(), cur: 0, rotX: -0.42, rotY: 0.72, auto: true, anim: null, lastT: 0 };
  var cv = document.getElementById('gCanvas');
  var LIGHT = norm3([0.45, 0.85, 0.55]);

  function norm3(v) {
    var l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function rotate(p, rx, ry) {
    // 绕 y 轴
    var x = p[0] * Math.cos(ry) + p[2] * Math.sin(ry);
    var z = -p[0] * Math.sin(ry) + p[2] * Math.cos(ry);
    var y = p[1];
    // 绕 x 轴
    var y2 = y * Math.cos(rx) - z * Math.sin(rx);
    var z2 = y * Math.sin(rx) + z * Math.cos(rx);
    return [x, y2, z2];
  }

  function draw() {
    var s = M.fit(cv), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var solid = G.solids[G.cur];
    var f = 6.5;                       // 相机距离
    var scale = Math.min(w, h) / 3.6;

    // 顶点旋转 + 投影
    var rot = solid.verts.map(function (p) { return rotate(p, G.rotX, G.rotY); });
    var proj = rot.map(function (p) {
      var k = f / (f - p[2]);
      return [w / 2 + p[0] * k * scale, h / 2 - p[1] * k * scale, p[2]];
    });

    // 面排序（画家算法：远的先画）
    var order = solid.faces.map(function (face, i) {
      var zsum = 0;
      face.forEach(function (vi) { zsum += rot[vi][2]; });
      return { i: i, z: zsum / face.length };
    }).sort(function (a, b) { return a.z - b.z; });

    order.forEach(function (item) {
      var face = solid.faces[item.i];
      // 面法线（旋转后）
      var a = rot[face[0]], b = rot[face[1]], c = rot[face[2]];
      var u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      var v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      var n = norm3([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
      var bright = 0.5 + 0.5 * Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      var col = 'rgba(' + Math.round(CYAN[0] * bright + 30 * bright) + ',' +
        Math.round(CYAN[1] * bright) + ',' + Math.round((CYAN[2] + 60) * bright) + ',0.92)';

      ctx.beginPath();
      face.forEach(function (vi, idx) {
        if (idx === 0) ctx.moveTo(proj[vi][0], proj[vi][1]);
        else ctx.lineTo(proj[vi][0], proj[vi][1]);
      });
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = 'rgba(8,72,96,0.85)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    });

    // 顶部提示
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    if (solid.curved) ctx.fillText('（网格近似渲染）', w - 12, 20);
  }

  function updateInfo() {
    var solid = G.solids[G.cur];
    document.getElementById('vName').textContent = solid.name;
    document.getElementById('vV').textContent = solid.V;
    document.getElementById('vE').textContent = solid.E === null ? '—' : solid.E;
    document.getElementById('vF').textContent = solid.F;
    document.getElementById('vNote').innerHTML = solid.note;
    var eulerEl = document.getElementById('vEuler'), v2 = document.getElementById('vEulerV');
    if (solid.E === null) {
      eulerEl.style.display = 'none';
    } else {
      eulerEl.style.display = '';
      v2.textContent = solid.V - solid.E + solid.F;
    }
    draw();
  }

  function loop(ts) {
    if (!G.auto) { G.anim = null; return; }
    if (G.lastT) {
      G.rotY += (ts - G.lastT) / 1000 * 0.55;
      draw();
    }
    G.lastT = ts;
    G.anim = requestAnimationFrame(loop);
  }
  function ensureLoop() {
    if (G.auto && !G.anim) { G.lastT = 0; G.anim = requestAnimationFrame(loop); }
  }

  function init() {
    var sel = document.getElementById('gSel');
    sel.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        G.cur = +b.dataset.i;
        updateInfo();
      });
    });
    document.getElementById('gAuto').addEventListener('change', function (e) {
      G.auto = e.target.checked;
      if (!G.auto && G.anim) { cancelAnimationFrame(G.anim); G.anim = null; }
      ensureLoop();
    });
    document.getElementById('gResetView').addEventListener('click', function () {
      G.rotX = -0.42; G.rotY = 0.72;
      draw();
    });

    var drag = null;
    cv.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY };
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drag) return;
      G.rotY += (e.clientX - drag.x) * 0.008;
      G.rotX = M.clamp(G.rotX + (e.clientY - drag.y) * 0.008, -1.4, 1.4);
      drag = { x: e.clientX, y: e.clientY };
      draw();
    });
    cv.addEventListener('pointerup', function () { drag = null; });

    updateInfo();
    ensureLoop();
    window.addEventListener('resize', draw);
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'geometry3d', [
    {
      q: '正方体有 8 个顶点、6 个面，它有多少条棱？',
      opts: ['10', '12', '14', '16'],
      a: 1,
      ex: '数一数或用欧拉公式：<span class="tex">V - E + F = 2 \\Rightarrow E = V + F - 2 = 8 + 6 - 2 = 12</span>。'
    },
    {
      q: '三棱柱有几个顶点？',
      opts: ['5', '6', '8', '9'],
      a: 1,
      ex: '两个三角形底面，各 3 个顶点：2 × 3 = 6 个。展台里切换到三棱柱数一数。'
    },
    {
      q: '五棱锥有几个面？',
      opts: ['5', '6', '7', '10'],
      a: 1,
      ex: '1 个五边形底面 + 5 个三角形侧面 = 6 个面。公式：n 棱锥面数 = n + 1。'
    },
    {
      q: '圆锥的侧面展开图是？',
      opts: ['三角形', '扇形', '矩形', '圆'],
      a: 1,
      ex: '圆锥沿母线剪开铺平，得到一个<b>扇形</b>（半径 = 母线长，弧长 = 底面圆周长）。所以侧面积 = πrl。'
    },
    {
      q: '把一个长方形绕它的一边旋转一周，得到的旋转体是？',
      opts: ['圆柱', '圆锥', '圆台', '球'],
      a: 0,
      ex: '矩形绕一边旋转，对边扫出侧面，另两边扫出两个底面圆——正是<b>圆柱</b>。直角三角形绕直角边才是圆锥，半圆绕直径是球。'
    }
  ]);

  init();
})();
