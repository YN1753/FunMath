/* ============================================================
   数列页交互：① 等差/等比数列生长动画（柱状图 + 折线 + 公式）
              ② 斐波那契螺线拼合动画
   依赖：common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var GREEN = '#10b981';
  var N = 12;

  function n1(v) { return String(+(+v).toFixed(1)); }

  /* ================= 实验 1：等差 / 等比 ================= */
  var seq = { mode: 'ap', a1: 1, d: 1.5, q: 1.3, values: [], progress: N, anim: null };
  var sCv = document.getElementById('sCanvas');

  function computeSeq() {
    var arr = [];
    for (var i = 0; i < N; i++) {
      arr.push(seq.mode === 'ap' ? seq.a1 + i * seq.d : seq.a1 * Math.pow(seq.q, i));
    }
    seq.values = arr;
  }

  function sTexUpdate() {
    var el = document.getElementById('sTex');
    var tex;
    if (seq.mode === 'ap') {
      tex = 'a_n = ' + n1(seq.a1) + ' + (n-1) \\times ' + n1(seq.d) + ' = ' + n1(seq.a1 - seq.d) + ' + ' + n1(seq.d) + 'n';
    } else {
      tex = 'a_n = ' + n1(seq.a1) + ' \\times ' + n1(seq.q) + '^{\,n-1}';
    }
    el.textContent = tex;
    el.removeAttribute('data-tex');
    el.removeAttribute('data-rendered');
    M.renderTex();

    var sum = 0;
    seq.values.forEach(function (v) { sum += v; });
    document.getElementById('sSum').textContent = M.fmt(sum, 1);
    var huge = Math.max.apply(null, seq.values.map(Math.abs)) > 5000;
    document.getElementById('sWarn').style.display = huge ? '' : 'none';
  }

  function sDraw() {
    var s = M.fit(sCv), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 46, padR = 14, padT = 26, padB = 30;
    var plotW = w - padL - padR, plotH = h - padT - padB;
    var vals = seq.values;
    if (!vals.length) return;

    var vmax = -Infinity, vmin = Infinity;
    vals.forEach(function (v) { vmax = Math.max(vmax, v); vmin = Math.min(vmin, v); });
    vmax = Math.max(vmax, 0); vmin = Math.min(vmin, 0);
    if (vmax === vmin) { vmax += 1; vmin -= 1; }
    var range = vmax - vmin;

    function Y(v) { return padT + (vmax - v) / range * plotH; }
    var y0 = Y(0);

    // 零线
    ctx.strokeStyle = '#8a94a6'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(padL, y0); ctx.lineTo(w - padR, y0); ctx.stroke();

    // 柱
    var bw = plotW / N;
    var k = seq.progress; // 已生长的"项数"（可为小数）
    for (var i = 0; i < N; i++) {
      var t = M.clamp(k - i, 0, 1);
      if (t <= 0) break;
      var v = vals[i] * (1 - Math.pow(1 - t, 3)); // easeOutCubic
      var x = padL + i * bw + bw * 0.14, wBar = bw * 0.72;
      var top = Y(v), bot = y0;
      ctx.fillStyle = v >= 0 ? 'rgba(16,185,129,0.75)' : 'rgba(245,158,11,0.75)';
      ctx.fillRect(x, Math.min(top, bot), wBar, Math.abs(bot - top) || 1);
      ctx.strokeStyle = v >= 0 ? '#0d9463' : '#d97706';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, Math.min(top, bot), wBar, Math.abs(bot - top) || 1);
      // 数值标签
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(M.fmt(vals[i], 1), x + wBar / 2, (v >= 0 ? top - 5 : bot + 12));
      // 序号
      ctx.fillText(i + 1, x + wBar / 2, h - padB + 15);
    }

    // 折线（穿过柱顶）
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    var started = false;
    for (var j = 0; j < N; j++) {
      if (k < j + 1) break;
      var px = padL + j * bw + bw / 2;
      var py = Y(vals[j]);
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    for (var p = 0; p < N; p++) {
      if (k < p + 1) break;
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.arc(padL + p * bw + bw / 2, Y(vals[p]), 3.2, 0, 7);
      ctx.fill();
    }
  }

  function playGrow() {
    if (seq.anim) cancelAnimationFrame(seq.anim);
    var t0 = null, dur = 2400;
    function step(ts) {
      if (!t0) t0 = ts;
      seq.progress = Math.min(N, (ts - t0) / dur * N);
      sDraw();
      if (seq.progress < N) seq.anim = requestAnimationFrame(step);
      else seq.anim = null;
    }
    seq.progress = 0;
    seq.anim = requestAnimationFrame(step);
  }

  function initSeq() {
    var seg = document.getElementById('sMode');
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        seq.mode = b.dataset.m;
        document.getElementById('sDRow').style.display = seq.mode === 'ap' ? '' : 'none';
        document.getElementById('sQRow').style.display = seq.mode === 'gp' ? '' : 'none';
        refresh();
      });
    });
    [['sA1', 'a1'], ['sD', 'd'], ['sQ', 'q']].forEach(function (pair) {
      document.getElementById(pair[0]).addEventListener('input', function (e) {
        seq[pair[1]] = +e.target.value;
        document.getElementById(pair[0] + 'v').textContent = n1(e.target.value);
        refresh();
      });
    });
    document.getElementById('sPlay').addEventListener('click', playGrow);

    function refresh() {
      if (seq.anim) cancelAnimationFrame(seq.anim);
      seq.progress = N;
      computeSeq();
      sTexUpdate();
      sDraw();
    }
    computeSeq();
    sTexUpdate();
    sDraw();
    window.addEventListener('resize', sDraw);
  }

  /* ================= 实验 2：斐波那契螺线 ================= */
  var FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  var fCv = document.getElementById('fCanvas');
  var fib = { layout: null, count: FIB.length, anim: null };

  function buildLayout() {
    var dirs = ['right', 'down', 'left', 'up'];
    var layout = [];
    var box = [0, 0, 1, 1]; // [a,b,c,d] = 左、下、右、上（数学坐标，y 向上）
    var entry = [0, 1];
    // 第 0 块
    layout.push({ rect: [0, 0, 1, 1], A: entry.slice(), B: [1, 0] });
    for (var i = 1; i < FIB.length; i++) {
      var s = FIB[i], dir = dirs[(i + 3) % 4];
      var a = box[0], b = box[1], c = box[2], d = box[3], rect;
      if (dir === 'right') { rect = [c, b, c + s, b + s]; box = [a, b, c + s, d]; }
      else if (dir === 'down') { rect = [a, b - s, c, b]; box = [a, b - s, c, d]; }
      else if (dir === 'left') { rect = [a - s, b, a, d]; box = [a - s, b, c, d]; }
      else { rect = [a, d, c, d + s]; box = [a, b, c, d + s]; }
      var nd = dirs[i % 4], B;
      if (nd === 'right') B = [box[2], box[1]];
      else if (nd === 'down') B = [box[2], box[3]];
      else if (nd === 'left') B = [box[0], box[3]];
      else B = [box[0], box[1]];
      layout.push({ rect: rect.slice(), A: entry.slice(), B: B });
      entry = B;
    }
    layout.box = box;
    return layout;
  }

  function fDraw() {
    var s = M.fit(fCv), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var lay = fib.layout;
    var box = lay.box;
    var pad = 18;
    var k = Math.min((w - pad * 2) / (box[2] - box[0]), (h - pad * 2) / (box[3] - box[1]));
    function X(x) { return w / 2 + (x - (box[0] + box[2]) / 2) * k; }
    function Y(y) { return h / 2 - (y - (box[1] + box[3]) / 2) * k; }

    var show = Math.min(fib.count, lay.length);
    for (var i = 0; i < show; i++) {
      var sq = lay[i], r = sq.rect, size = r[2] - r[0];
      // 正方形
      ctx.fillStyle = i % 2 ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.26)';
      ctx.fillRect(X(r[0]), Y(r[3]), size * k, size * k);
      ctx.strokeStyle = 'rgba(13,148,99,0.85)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(X(r[0]), Y(r[3]), size * k, size * k);
      // 边长数字
      if (size * k > 22) {
        ctx.fillStyle = '#0f766e';
        ctx.font = 'bold ' + Math.min(14, Math.max(9, size * k * 0.28)) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(FIB[i]), X((r[0] + r[2]) / 2), Y((r[1] + r[3]) / 2) + 4);
      }
      // 四分之一圆弧：圆心是与 A、B 距离都为 size 的角，取逆时针方向
      var corners = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
      var cands = corners.filter(function (C) {
        return Math.abs(Math.hypot(C[0] - sq.A[0], C[1] - sq.A[1]) - size) < 1e-6 &&
               Math.abs(Math.hypot(C[0] - sq.B[0], C[1] - sq.B[1]) - size) < 1e-6;
      });
      var C = cands.find(function (C) {
        return (sq.A[0] - C[0]) * (sq.B[1] - C[1]) - (sq.A[1] - C[1]) * (sq.B[0] - C[0]) > 0;
      }) || cands[0];
      if (!C) continue;
      var a0 = Math.atan2(Y(sq.A[1]) - Y(C[1]), X(sq.A[0]) - X(C[0]));
      var a1 = Math.atan2(Y(sq.B[1]) - Y(C[1]), X(sq.B[0]) - X(C[0]));
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(X(C[0]), Y(C[1]), size * k, a0, a1, true);
      ctx.stroke();
    }
  }

  function replayFib() {
    if (fib.anim) cancelAnimationFrame(fib.anim);
    var t0 = null, dur = 3200;
    function step(ts) {
      if (!t0) t0 = ts;
      fib.count = Math.max(1, Math.ceil((ts - t0) / dur * FIB.length));
      fDraw();
      if (fib.count < FIB.length) fib.anim = requestAnimationFrame(step);
      else { fib.count = FIB.length; fib.anim = null; fDraw(); }
    }
    fib.count = 1;
    fib.anim = requestAnimationFrame(step);
  }

  function initFib() {
    fib.layout = buildLayout();
    fDraw();
    document.getElementById('fReplay').addEventListener('click', replayFib);

    // 相邻项之比展示
    var ratios = [];
    for (var i = 1; i < 9; i++) ratios.push(M.fmt(FIB[i + 1] / FIB[i], 4));
    document.getElementById('fRatio').textContent = ratios.join(' → ');
    window.addEventListener('resize', fDraw);
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'sequences', [
    {
      q: '等差数列中 <span class="tex">a_1 = 2,\ d = 3</span>，则 <span class="tex">a_{10} =</span> ？',
      opts: ['29', '30', '32', '27'],
      a: 0,
      ex: '<span class="tex">a_{10} = a_1 + 9d = 2 + 27 = 29</span>。注意第 10 项只加了 9 次公差，不是 10 次——在实验 1 里数一数柱子就知道。'
    },
    {
      q: '等比数列 <span class="tex">a_1 = 1,\ q = 2</span>，前 10 项和 <span class="tex">S_{10} =</span> ？',
      opts: ['1023', '1024', '512', '2046'],
      a: 0,
      ex: '<span class="tex">S_{10} = \\frac{1\\cdot(1-2^{10})}{1-2} = 2^{10} - 1 = 1023</span>。"1+2+4+…+512"每项翻倍，和比最大项大一倍减一。'
    },
    {
      q: '等差数列中已知 <span class="tex">a_2 = 4,\ a_8 = 16</span>，则 <span class="tex">a_5 =</span> ？',
      opts: ['10', '9', '11', '12'],
      a: 0,
      ex: '等差数列中 <span class="tex">a_2 + a_8 = 2a_5</span>（下标平均），所以 <span class="tex">a_5 = \\frac{4+16}{2} = 10</span>。'
    },
    {
      q: '数列 3, −6, 12, −24, … 的通项公式是？',
      opts: ['<span class="tex">a_n = 3 \\cdot 2^{n-1}</span>', '<span class="tex">a_n = 3 \\cdot (-2)^{n-1}</span>', '<span class="tex">a_n = (-3) \\cdot 2^{n}</span>', '<span class="tex">a_n = 3 \\cdot (-2)^{n}</span>'],
      a: 1,
      ex: '相邻两项之比恒为 −2，是 <span class="tex">q = -2</span> 的等比数列，<span class="tex">a_n = 3 \\cdot (-2)^{n-1}</span>。负公比让正负号交错——去实验 1 把 q 拖到 −2 看看柱子忽正忽负！'
    },
    {
      q: '斐波那契数列 1, 1, 2, 3, 5, 8, 13, … 中，13 的下一项是？相邻两项之比无限接近多少？',
      opts: ['18；0.618', '21；0.618', '21；0.5', '20；1.618'],
      a: 1,
      ex: '<span class="tex">F_n = F_{n-1} + F_{n-2}</span>，下一项 <span class="tex">8 + 13 = 21</span>；<span class="tex">\\frac{F_{n+1}}{F_n} \\to 0.618\\ldots</span>（黄金分割数），见实验 2 的螺线。'
    }
  ]);

  /* ================= 启动 ================= */
  initSeq();
  initFib();
})();
