/* ============================================================
   圆锥曲线页交互：① 离心率统一定义演示（e 滑块 + 动点验证）
                  ② 绳索法画椭圆（|PF1|+|PF2| = 2a 动画）
   依赖：common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var PINK = '#ec4899', TEAL = '#0d9488';
  function n2(v) { return String(+(+v).toFixed(2)); }

  /* ================= 实验 1：离心率变形记 ================= */
  var C = { e: 0.5, p: 2, theta: 0.6, playing: true, anim: null, lastT: 0 };
  var cCv = document.getElementById('cCanvas');

  /* 极径 r = e·p / (1 − e·cosθ)；r<0 时自然画出双曲线另一支 */
  function conicR(e, p, th) { return e * p / (1 - e * Math.cos(th)); }

  function cDraw() {
    var s = M.fit(cCv), ctx = s.ctx, w = s.w, h = s.h;
    var e = C.e, p = C.p;
    ctx.clearRect(0, 0, w, h);

    // 视野：按 e 动态适配
    var span = Math.max(2 * p + 2.5, e < 1 ? e * p / (1 - e) * 0.9 : e * p / (e - 1) * 1.4, e * p / (1 + e));
    var scale = Math.min(w, h) / 2.1 / Math.min(span, 40);
    var view = { cx: 0, cy: 0, scale: scale };
    function X(x) { return w / 2 + x * scale; }
    function Y(y) { return h / 2 - y * scale; }

    // 准线 x = −p
    ctx.save();
    ctx.strokeStyle = TEAL;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(X(-p), 0); ctx.lineTo(X(-p), h); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = TEAL;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('准线 l', X(-p) + 6, 18);

    // 曲线
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    var started = false;
    for (var th = 0; th <= Math.PI * 2 + 0.02; th += 0.008) {
      var r = conicR(e, p, th);
      if (!isFinite(r) || Math.abs(r) > 60) { started = false; continue; }
      var x = r * Math.cos(th), y = r * Math.sin(th);
      if (!started) { ctx.moveTo(X(x), Y(y)); started = true; }
      else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // 第二焦点
    if (Math.abs(e - 1) > 0.02) {
      var x2 = 2 * e * e * p / (1 - e * e);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath(); ctx.arc(X(x2), Y(0), 5, 0, 7); ctx.fill();
      ctx.font = '10px sans-serif';
      ctx.fillText("F′", X(x2) + 6, Y(0) - 6);
    }

    // 焦点 F
    ctx.fillStyle = PINK;
    ctx.beginPath(); ctx.arc(X(0), Y(0), 5.5, 0, 7); ctx.fill();
    ctx.fillText('F', X(0) + 6, Y(0) - 6);

    // 动点 P 与两段距离
    var rP = conicR(e, p, C.theta);
    if (isFinite(rP) && Math.abs(rP) < 60) {
      var px = rP * Math.cos(C.theta), py = rP*Math.sin(C.theta);
      // PL 垂线段（P → (x, −p)）
      ctx.save();
      ctx.strokeStyle = TEAL; ctx.lineWidth = 2.2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(X(px), Y(py)); ctx.lineTo(X(-p), Y(py)); ctx.stroke();
      ctx.restore();
      // PF 线段
      ctx.save();
      ctx.strokeStyle = PINK; ctx.lineWidth = 2.2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(X(px), Y(py)); ctx.lineTo(X(0), Y(0)); ctx.stroke();
      ctx.restore();
      // P
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(px), Y(py), 6, 0, 7); ctx.fill(); ctx.stroke();

      var dPF = Math.abs(rP), dPL = px + p;
      document.getElementById('cPF').textContent = M.fmt(dPF, 3);
      document.getElementById('cPL').textContent = M.fmt(dPL, 3);
      document.getElementById('cRatio').textContent = M.fmt(dPF / dPL, 3);
    }
  }

  function cUpdate() {
    document.getElementById('cEv').textContent = n2(C.e);
    document.getElementById('cPv').textContent = n2(C.p);
    var t = document.getElementById('cType');
    if (C.e < 0.999) t.textContent = '类型：椭圆（e < 1）';
    else if (C.e <= 1.001) t.textContent = '类型：抛物线（e = 1）';
    else t.textContent = '类型：双曲线（e > 1）';
    cDraw();
  }

  function cLoop(ts) {
    if (!C.playing) return;
    if (C.lastT) {
      C.theta += (ts - C.lastT) / 1000 * 1.1;
      cDraw();
    }
    C.lastT = ts;
    C.anim = requestAnimationFrame(cLoop);
  }

  function initC() {
    document.getElementById('cE').addEventListener('input', function (e2) { C.e = +e2.target.value; cUpdate(); });
    document.getElementById('cP').addEventListener('input', function (e2) { C.p = +e2.target.value; cUpdate(); });
    document.getElementById('cPlay').addEventListener('click', function () {
      C.playing = !C.playing;
      this.textContent = C.playing ? '⏸ 暂停' : '▶ 播放';
      if (C.playing) { C.lastT = 0; C.anim = requestAnimationFrame(cLoop); }
      else cancelAnimationFrame(C.anim);
    });
    cUpdate();
    C.anim = requestAnimationFrame(cLoop);
    window.addEventListener('resize', cDraw);
  }

  /* ================= 实验 2：绳索画椭圆 ================= */
  var E = { a: 3.5, c: 2, t: 0, playing: true, anim: null, lastT: 0 };
  var eCv = document.getElementById('eCanvas');

  function eDraw() {
    var s = M.fit(eCv), ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    var c = Math.min(E.c, E.a - 0.3); // 保证绳能套住
    var b = Math.sqrt(E.a * E.a - c * c);
    var scale = Math.min(w / (2.4 * E.a), h / (2.4 * Math.max(b, 1)));
    function X(x) { return w / 2 + x * scale; }
    function Y(y) { return h / 2 - y * scale; }

    // 坐标轴
    ctx.strokeStyle = '#d8dee9'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();

    // 椭圆轨迹
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (var th = 0; th <= Math.PI * 2 + 0.02; th += 0.01) {
      var x = E.a * Math.cos(th), y = b * Math.sin(th);
      if (th === 0) ctx.moveTo(X(x), Y(y)); else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // 铅笔点 + 两根绳子
    var px = E.a * Math.cos(E.t), py = b * Math.sin(E.t);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(X(-c), Y(0)); ctx.lineTo(X(px), Y(py)); ctx.lineTo(X(c), Y(0)); ctx.stroke();
    // 图钉
    [[-c, 'F₁'], [c, 'F₂']].forEach(function (pin) {
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.arc(X(pin[0]), Y(0), 5, 0, 7); ctx.fill();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pin[1], X(pin[0]), Y(0) + 18);
    });
    // 铅笔
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(px), Y(py), 6, 0, 7); ctx.fill(); ctx.stroke();

    // 实时读数
    var d1 = Math.hypot(px + c, py), d2 = Math.hypot(px - c, py);
    document.getElementById('eSum').textContent = M.fmt(d1 + d2, 3);
    document.getElementById('eB').textContent = M.fmt(b, 3);
    document.getElementById('eEcc').textContent = M.fmt(c / E.a, 3);
  }

  function eUpdate() {
    document.getElementById('eAv').textContent = n2(E.a);
    document.getElementById('eCv').textContent = n2(E.c);
    eDraw();
  }

  function eLoop(ts) {
    if (!E.playing) return;
    if (E.lastT) {
      E.t += (ts - E.lastT) / 1000 * 1.2;
      eDraw();
    }
    E.lastT = ts;
    E.anim = requestAnimationFrame(eLoop);
  }

  function initE() {
    document.getElementById('eA').addEventListener('input', function (e2) { E.a = +e2.target.value; eUpdate(); });
    document.getElementById('eC').addEventListener('input', function (e2) { E.c = +e2.target.value; eUpdate(); });
    document.getElementById('ePlay').addEventListener('click', function () {
      E.playing = !E.playing;
      this.textContent = E.playing ? '⏸ 暂停' : '▶ 播放';
      if (E.playing) { E.lastT = 0; E.anim = requestAnimationFrame(eLoop); }
      else cancelAnimationFrame(E.anim);
    });
    eUpdate();
    E.anim = requestAnimationFrame(eLoop);
    window.addEventListener('resize', eDraw);
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'conics', [
    {
      q: '椭圆 <span class="tex">\\dfrac{x^2}{25} + \\dfrac{y^2}{16} = 1</span> 的离心率是？',
      opts: ['<span class="tex">\\dfrac{3}{5}</span>', '<span class="tex">\\dfrac{4}{5}</span>', '<span class="tex">\\dfrac{\\sqrt{41}}{5}</span>', '<span class="tex">\\dfrac{3}{4}</span>'],
      a: 0,
      ex: '<span class="tex">a^2 = 25,\\ b^2 = 16 \\Rightarrow c = \\sqrt{25-16} = 3</span>，<span class="tex">e = \\frac{c}{a} = \\frac{3}{5}</span>。注意 a 永远是较大的分母（对椭圆而言）。'
    },
    {
      q: '椭圆的两焦点为 <span class="tex">(\\pm 4, 0)</span>，离心率 <span class="tex">e = \\dfrac{1}{2}</span>，则其方程是？',
      opts: ['<span class="tex">\\dfrac{x^2}{64} + \\dfrac{y^2}{48} = 1</span>', '<span class="tex">\\dfrac{x^2}{16} + \\dfrac{y^2}{12} = 1</span>', '<span class="tex">\\dfrac{x^2}{16} + \\dfrac{y^2}{4} = 1</span>', '<span class="tex">\\dfrac{x^2}{8} + \\dfrac{y^2}{4} = 1</span>'],
      a: 0,
      ex: '由焦点坐标知 <span class="tex">c = 4</span>；由 <span class="tex">e = \\dfrac{c}{a} = \\dfrac{1}{2}</span> 得 <span class="tex">a = 8</span>；再由 <span class="tex">b^2 = a^2 - c^2 = 64 - 16 = 48</span>，所以方程是 <span class="tex">\\dfrac{x^2}{64} + \\dfrac{y^2}{48} = 1</span>。'
    },
    {
      q: '双曲线 <span class="tex">\\dfrac{x^2}{9} - \\dfrac{y^2}{16} = 1</span> 的渐近线方程是？',
      opts: ['<span class="tex">y = \\pm\\dfrac{3}{4}x</span>', '<span class="tex">y = \\pm\\dfrac{4}{3}x</span>', '<span class="tex">y = \\pm\\dfrac{9}{16}x</span>', '<span class="tex">y = \\pm\\dfrac{16}{9}x</span>'],
      a: 1,
      ex: '渐近线为 <span class="tex">y = \\pm\\frac{b}{a}x = \\pm\\frac{4}{3}x</span>（b² 在减号下面=16）。双曲线的形状由这两条"边界直线"框定。'
    },
    {
      q: '抛物线 <span class="tex">y^2 = 8x</span> 的焦点坐标是？',
      opts: ['(2, 0)', '(4, 0)', '(0, 2)', '(8, 0)'],
      a: 0,
      ex: '<span class="tex">2p = 8 \\Rightarrow p = 4</span>，焦点 <span class="tex">(\\frac{p}{2}, 0) = (2, 0)</span>，准线 <span class="tex">x = -2</span>。口诀"开口向右，焦点在正半轴 p/2 处"。'
    },
    {
      q: '拖动实验 1 的 e 滑块，下列说法正确的是？',
      opts: ['e 越接近 0，椭圆越扁', 'e = 1 时曲线是圆', 'e 从 0.9 增大到 1 的过程中椭圆越来越扁，到 1 变成抛物线', 'e > 1 后曲线消失'],
      a: 2,
      ex: 'e 越接近 1 椭圆越扁；e = 1 恰好变成抛物线；e > 1 后"张开"成双曲线。e → 0 椭圆反而越来越圆（e = 0 就是圆）。'
    }
  ]);

  /* ================= 启动 ================= */
  initC();
  initE();
})();
