/* ============================================================
   概率统计页交互：① 高尔顿钉板（落球动画 + 二项分布理论线）
                  ② 蒙提霍尔三扇门（手动 + 1000 局自动模拟）
                  ③ 大数定律抛硬币（频率收敛曲线，对数横轴）
   依赖：common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var RED = '#ef4444';

  /* ================= 实验 1：高尔顿钉板 ================= */
  var ROWS = 10;               // 钉板层数（= 抛硬币次数）
  var G = { bins: new Array(ROWS + 1).fill(0), balls: [], total: 0,
            speed: 3, auto: false, anim: null, spawnQueue: 0, lastT: 0, spawnAcc: 0 };
  var gCv = document.getElementById('gCanvas');

  function galtonLayout(w, h) {
    var padT = 16, padB = 46;
    var pegH = (h - padT - padB) * 0.72;   // 钉板区高度
    var rowH = pegH / ROWS;
    var d = Math.min(w / (ROWS + 3), rowH * 1.6); // 钉距（也 = 格宽）
    var cx = w / 2;
    var pegTop = padT + 14;
    return { d: d, cx: cx, pegTop: pegTop, rowH: rowH, binTop: padT + 14 + pegH + 6, binBottom: h - padB };
  }

  function spawnBall() {
    var path = [];
    for (var i = 0; i < ROWS; i++) path.push(Math.random() < 0.5 ? 0 : 1); // 1 = 右
    G.balls.push({ row: 0, path, bin: path.reduce(function (a, b) { return a + b; }, 0) });
    G.total++;
  }

  function galtonStep(dt) {
    var v = 3.2 * G.speed; // 行/秒
    for (var i = G.balls.length - 1; i >= 0; i--) {
      var b = G.balls[i];
      b.row += v * dt;
      if (b.row >= ROWS) {
        G.bins[b.bin]++;
        G.balls.splice(i, 1);
      }
    }
  }

  function gDraw() {
    var s = M.fit(gCv), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var L = galtonLayout(w, h);

    // 钉子
    ctx.fillStyle = '#8a94a6';
    for (var r = 0; r < ROWS; r++) {
      var y = L.pegTop + r * L.rowH;
      var count = r + 1;
      for (var m = 0; m < count; m++) {
        var x = L.cx + (m - (count - 1) / 2) * L.d;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
      }
    }

    // 格子分隔线
    ctx.strokeStyle = '#e2e7f0';
    ctx.lineWidth = 1;
    var binW = L.d;
    for (var k = 0; k <= ROWS + 1; k++) {
      var xb = L.cx + (k - (ROWS + 1) / 2) * binW;
      ctx.beginPath(); ctx.moveTo(xb, L.binTop); ctx.lineTo(xb, L.binBottom); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(L.cx - (ROWS + 1) / 2 * binW, L.binBottom); ctx.lineTo(L.cx + (ROWS + 1) / 2 * binW, L.binBottom); ctx.stroke();

    // 柱状图（bins[k] 落在从左数第 k 格）
    var maxC = Math.max.apply(null, G.bins.concat([5]));
    var binH = L.binBottom - L.binTop;
    for (var k2 = 0; k2 <= ROWS; k2++) {
      if (!G.bins[k2]) continue;
      var xb2 = L.cx + (k2 - ROWS / 2) * binW - binW / 2;
      var hh = G.bins[k2] / maxC * (binH - 12);
      ctx.fillStyle = 'rgba(239,68,68,0.55)';
      ctx.fillRect(xb2 + 1, L.binBottom - hh, binW - 2, hh);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      if (G.bins[k2] > 0) ctx.fillText(String(G.bins[k2]), xb2 + binW / 2, L.binBottom - hh - 3);
    }

    // 理论二项分布曲线（紫）：高度按 概率/峰值概率 等比绘制
    if (G.total > 0) {
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      var started = false;
      var peakProb = binom(ROWS, Math.round(ROWS / 2)) / Math.pow(2, ROWS);
      for (var k3 = 0; k3 <= ROWS; k3++) {
        var prob = binom(ROWS, k3) / Math.pow(2, ROWS);
        var hExp = prob / peakProb * (binH - 12);
        var x = L.cx + (k3 - ROWS / 2) * binW;
        var y = L.binBottom - Math.min(hExp, binH - 2);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 球
    ctx.fillStyle = RED;
    G.balls.forEach(function (b) {
      var rowIdx = Math.min(Math.floor(b.row), ROWS - 1);
      var frac = Math.min(b.row - rowIdx, 1);
      var rights = 0;
      for (var i = 0; i < rowIdx; i++) rights += b.path[i];
      // 当前层起点位置 → 撞钉后向 path[rowIdx] 方向移动 frac
      var x0 = L.cx + (rights - rowIdx / 2) * L.d;
      var dir = b.path[rowIdx] === 1 ? 1 : -1;
      var x = x0 + dir * L.d / 2 * frac;
      var y0 = L.pegTop + rowIdx * L.rowH;
      var y = y0 + L.rowH * frac;
      ctx.beginPath(); ctx.arc(x, y, 4.6, 0, 7); ctx.fill();
    });

    document.getElementById('gTotal').textContent = String(G.total);
  }

  function binom(n, k) {
    var r = 1;
    for (var i = 0; i < k; i++) r = r * (n - i) / (i + 1);
    return r;
  }

  function gLoop(ts) {
    if (!G.anim) return;
    var dt = Math.min((ts - G.lastT) / 1000, 0.05);
    G.lastT = ts;
    // 生成球
    if (G.auto) {
      G.spawnAcc += dt * 14 * (G.speed / 3);
      while (G.spawnAcc > 1 && G.balls.length < 90) { spawnBall(); G.spawnAcc--; }
    } else if (G.spawnQueue > 0 && G.balls.length < 90) {
      var batch = Math.min(G.spawnQueue, 4);
      G.spawnQueue -= batch;
      for (var i = 0; i < batch; i++) spawnBall();
    }
    galtonStep(dt);
    gDraw();
    // 空闲时停止动画循环，省电
    if (!G.auto && G.spawnQueue <= 0 && G.balls.length === 0) { G.anim = null; return; }
    G.anim = requestAnimationFrame(gLoop);
  }
  function ensureGalton() {
    if (!G.anim) { G.lastT = 0; G.anim = requestAnimationFrame(gLoop); }
  }

  function initGalton() {
    document.getElementById('g1').addEventListener('click', function () { G.spawnQueue += 1; ensureGalton(); });
    document.getElementById('g100').addEventListener('click', function () { G.spawnQueue += 100; ensureGalton(); });
    document.getElementById('gAuto').addEventListener('change', function (e) {
      G.auto = e.target.checked;
      ensureGalton();
    });
    document.getElementById('gSpeed').addEventListener('input', function (e) {
      G.speed = +e.target.value;
      document.getElementById('gSpeedV').textContent = String(G.speed);
    });
    document.getElementById('gReset').addEventListener('click', function () {
      G.bins.fill(0); G.balls = []; G.total = 0; G.spawnQueue = 0;
      gDraw();
    });
    ensureGalton();
    window.addEventListener('resize', gDraw);
  }

  /* ================= 实验 2：蒙提霍尔 ================= */
  var MH = { car: 0, pick: -1, opened: -1, stage: 'idle',
             games: 0, switchWins: 0, stayWins: 0 };
  var doorBtns = [];

  function mhNewRound() {
    MH.car = Math.floor(Math.random() * 3);
    MH.pick = -1; MH.opened = -1; MH.stage = 'idle';
    document.getElementById('mhLog').textContent = '点击一扇门开始';
    document.getElementById('mhStay').disabled = true;
    document.getElementById('mhSwitch').disabled = true;
    doorBtns.forEach(function (b) {
      b.className = 'door-btn';
      b.textContent = b.dataset.i === '0' ? '1' : b.dataset.i === '1' ? '2' : '3';
      b.disabled = false;
    });
  }

  function mhPick(i) {
    if (MH.stage !== 'idle') return;
    MH.pick = i;
    // 主持人开一扇 Goat 门（非 pick 非 car）
    var opts = [0, 1, 2].filter(function (x) { return x !== MH.pick && x !== MH.car; });
    MH.opened = opts[Math.floor(Math.random() * opts.length)];
    MH.stage = 'chosen';
    doorBtns[MH.opened].className = 'door-btn opened';
    doorBtns[MH.opened].textContent = '🐐';
    doorBtns[MH.opened].disabled = true;
    doorBtns[i].classList.add('picked');
    document.getElementById('mhLog').textContent = '你选了门 ' + (i + 1) + '，主持人打开了门 ' + (MH.opened + 1) + '（山羊）。坚持，还是换？';
    document.getElementById('mhStay').disabled = false;
    document.getElementById('mhSwitch').disabled = false;
  }

  function mhResolve(switched) {
    if (MH.stage !== 'chosen') return;
    var finalPick = switched
      ? [0, 1, 2].filter(function (x) { return x !== MH.pick && x !== MH.opened; })[0]
      : MH.pick;
    MH.stage = 'done';
    MH.games++;
    var win = finalPick === MH.car;
    if (switched && win) MH.switchWins++;
    if (!switched && win) MH.stayWins++;
    doorBtns.forEach(function (b, i) {
      b.disabled = true;
      b.classList.remove('picked');
      b.textContent = i === MH.car ? '🚗' : '🐐';
      if (i === MH.car) b.classList.add('reveal');
      if (i === finalPick) b.classList.add('picked');
    });
    document.getElementById('mhLog').textContent = win
      ? (switched ? '🎉 你换门并赢了！（车在门 ' + (MH.car + 1) + '）' : '🎉 你坚持到底并赢了！')
      : (switched ? '😭 换门输了——小概率事件，多试几次。' : '😭 不换输了。这局恰恰说明"不换"靠运气。');
    document.getElementById('mhStay').disabled = true;
    document.getElementById('mhSwitch').disabled = true;
    mhStats();
    // 2.4 秒后自动开新一局，方便连续体验
    setTimeout(function () {
      if (MH.stage === 'done') mhNewRound();
    }, 2400);
  }

  function mhStats() {
    document.getElementById('mhSW').textContent = String(MH.switchWins);
    document.getElementById('mhDW').textContent = String(MH.stayWins);
    document.getElementById('mhG').textContent = String(MH.games);
  }

  function mhAutoSim() {
    var n = 1000, sw = 0, st = 0;
    for (var i = 0; i < n; i++) {
      var car = Math.floor(Math.random() * 3);
      var pick = Math.floor(Math.random() * 3);
      // 换门：只要初次没选中车，换门必赢 → 胜率 2/3
      if (pick !== car) sw++;
      if (pick === car) st++;
    }
    document.getElementById('mhSim').textContent = sw + ' 局（不换 ' + st + ' 局）';
    mhStats();
  }

  function initMH() {
    doorBtns = Array.prototype.slice.call(document.querySelectorAll('#mhDoors .door-btn'));
    doorBtns.forEach(function (b) {
      b.addEventListener('click', function () { mhPick(+b.dataset.i); });
    });
    document.getElementById('mhStay').addEventListener('click', function () { mhResolve(false); });
    document.getElementById('mhSwitch').addEventListener('click', function () { mhResolve(true); });
    document.getElementById('mhAuto').addEventListener('click', mhAutoSim);
    document.getElementById('mhReset').addEventListener('click', function () {
      MH.games = 0; MH.switchWins = 0; MH.stayWins = 0;
      document.getElementById('mhSim').textContent = '—';
      mhStats();
      mhNewRound();
    });
    mhNewRound();
  }

  /* ================= 实验 3：大数定律 ================= */
  var C = { n: 0, heads: 0, pts: [{ n: 0, p: 0.5 }], anim: null, lastT: 0, queue: 0 };
  var cCv = document.getElementById('cCanvas');
  var MAXN = 400000;

  function flip(k) {
    for (var i = 0; i < k && C.n < MAXN; i++) {
      C.n++;
      if (Math.random() < 0.5) C.heads++;
    }
    C.pts.push({ n: C.n, p: C.heads / C.n });
    if (C.pts.length > 3000) C.pts = C.pts.filter(function (_, idx) { return idx % 2 === 0; });
    cDraw();
    cReadout();
  }

  function cDraw() {
    var s = M.fit(cCv), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 46, padR = 14, padT = 16, padB = 30;
    var pw = w - padL - padR, ph = h - padT - padB;
    var maxN = Math.max(100, C.n);

    function X(n) { // 对数刻度
      if (n <= 0) n = 1;
      var t = Math.log10(n) / Math.log10(maxN);
      return padL + t * pw;
    }
    function Y(p) { return padT + (1 - p) * ph; }

    // 0.5 虚线
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(padL, Y(0.5)); ctx.lineTo(w - padR, Y(0.5)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0.5（概率）', padL + 4, Y(0.5) - 5);

    // 轴与刻度
    ctx.strokeStyle = '#8a94a6'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); ctx.stroke();
    ctx.fillStyle = '#9aa5b5'; ctx.textAlign = 'center';
    [1, 10, 100, 1000, 10000, 100000].forEach(function (v) {
      if (v > maxN) return;
      ctx.fillText(v >= 1000 ? (v / 1000) + 'k' : String(v), X(v), h - padB + 14);
    });
    ctx.textAlign = 'right';
    [0.25, 0.5, 0.75].forEach(function (v) {
      ctx.fillText(String(v), padL - 5, Y(v) + 3);
    });

    // 频率曲线
    if (C.pts.length > 1) {
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      var started = false;
      C.pts.forEach(function (pt) {
        if (pt.n === 0) return;
        var x = X(pt.n), y = Y(pt.p);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // 末端点
      var last = C.pts[C.pts.length - 1];
      if (last.n > 0) {
        ctx.fillStyle = RED;
        ctx.beginPath(); ctx.arc(X(last.n), Y(last.p), 4.5, 0, 7); ctx.fill();
      }
    }
  }

  function cReadout() {
    document.getElementById('cN').textContent = String(C.n);
    document.getElementById('cH').textContent = String(C.heads);
    document.getElementById('cP').textContent = C.n ? (C.heads / C.n).toFixed(4) : '—';
  }

  function initCoin() {
    document.getElementById('c1').addEventListener('click', function () { flip(1); });
    document.getElementById('c100').addEventListener('click', function () { flip(100); });
    document.getElementById('c10000').addEventListener('click', function () { flip(10000); });
    document.getElementById('cReset').addEventListener('click', function () {
      C.n = 0; C.heads = 0; C.pts = [{ n: 0, p: 0.5 }];
      cDraw(); cReadout();
    });
    cDraw();
    cReadout();
    window.addEventListener('resize', cDraw);
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'probability', [
    {
      q: '蒙提霍尔问题中，"换门"的获胜概率约为？',
      opts: ['<span class="tex">\\dfrac{1}{2}</span>', '<span class="tex">\\dfrac{1}{3}</span>', '<span class="tex">\\dfrac{2}{3}</span>', '<span class="tex">\\dfrac{3}{4}</span>'],
      a: 2,
      ex: '初次选中车的概率只有 ⅓。主持人开出一扇山羊门后，"剩下那扇门"承接了 ⅔ 的概率——所以换门胜率 ⅔。用实验 2 跑 1000 局看看！'
    },
    {
      q: '高尔顿钉板投入几千颗球后，格子里的球堆出的形状是？',
      opts: ['左低右高的斜坡', '中间高、两边低的钟形', '完全平坦', '两边高中间低'],
      a: 1,
      ex: '每层钉子相当于一次 50/50 抛硬币，10 层后落点服从二项分布 B(10, ½)——大量球时呈现中间凸起的<b>钟形</b>，逼近正态分布。'
    },
    {
      q: '均匀硬币已连续抛出 5 次正面，第 6 次抛出正面的概率是？',
      opts: ['小于 ½（该出反面了）', '大于 ½（正面手气旺）', '正好 ½', '无法确定'],
      a: 2,
      ex: '每次抛掷<b>相互独立</b>，硬币没有记忆。<span class="tex">P(\\text{第6次正面}) = \\frac{1}{2}</span>。"赌徒谬误"就是忘了独立性。'
    },
    {
      q: '大数定律说的是：试验次数很多时，事件发生的______会稳定于它的______。',
      opts: ['概率；频率', '频率；概率', '方差；均值', '频数；方差'],
      a: 1,
      ex: '频率（统计出来的比值）随次数增多而稳定于理论概率。注意方向：先有概率这个"真值"，频率围绕它波动。'
    },
    {
      q: '某射手命中率为 0.8，独立射击 3 次，恰好命中 2 次的概率是？',
      opts: ['<span class="tex">0.8^2 \\times 0.2</span>', '<span class="tex">3 \\times 0.8^2 \\times 0.2</span>', '<span class="tex">0.8^3</span>', '<span class="tex">\\binom{3}{2} \\times 0.8 \\times 0.2^2</span>'],
      a: 1,
      ex: '二项分布：<span class="tex">P(X=2) = \\binom{3}{2} 0.8^2 0.2 = 3 \\times 0.64 \\times 0.2 = 0.384</span>。别忘了乘"哪两次命中"的 <span class="tex">\\binom{3}{2} = 3</span>。'
    }
  ]);

  /* ================= 启动 ================= */
  initGalton();
  initMH();
  initCoin();
})();
