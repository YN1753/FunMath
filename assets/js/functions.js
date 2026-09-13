/* ============================================================
   函数页交互：① 图像实验室（模板/表达式/参数滑块/平移缩放/读数）
              ② 图像变换实验台（a·f(x-h)+k）
   依赖：parser.js (MathExpr)、common.js (M)
   ============================================================ */
(function () {
  'use strict';
  var ACCENT = '#3b82f6';

  /* ---------------- 共用绘图工具 ---------------- */
  function niceStep(raw) {
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var cands = [1, 2, 5, 10];
    for (var i = 0; i < cands.length; i++) {
      if (cands[i] * pow >= raw) return cands[i] * pow;
    }
    return 10 * pow;
  }
  function tickText(v, step) {
    var dec = Math.max(0, -Math.floor(Math.log10(step)));
    if (Math.abs(v) < 1e-9) return '0';
    return v.toFixed(Math.min(dec, 4));
  }
  function drawGrid(ctx, w, h, view) {
    var step = niceStep(64 / view.scale);
    var x0 = view.cx - w / 2 / view.scale, x1 = view.cx + w / 2 / view.scale;
    var y0 = view.cy - h / 2 / view.scale, y1 = view.cy + h / 2 / view.scale;
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    // 竖网格线 + x 轴刻度
    ctx.textAlign = 'center';
    for (var x = Math.ceil(x0 / step) * step; x <= x1; x += step) {
      var px = (x - view.cx) * view.scale + w / 2;
      ctx.strokeStyle = '#edf1f7';
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
      if (Math.abs(x) > 1e-9) {
        ctx.fillStyle = '#9aa5b5';
        ctx.fillText(tickText(x, step), px, Math.min(h - 4, Math.max(12, h / 2 - view.cy * view.scale + 14)));
      }
    }
    // 横网格线 + y 轴刻度
    ctx.textAlign = 'left';
    for (var y = Math.ceil(y0 / step) * step; y <= y1; y += step) {
      var py = h / 2 - (y - view.cy) * view.scale;
      ctx.strokeStyle = '#edf1f7';
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
      if (Math.abs(y) > 1e-9) {
        ctx.fillStyle = '#9aa5b5';
        ctx.fillText(tickText(y, step), Math.min(w - 30, Math.max(4, w / 2 - view.cx * view.scale + 4)), py - 3);
      }
    }
    var ax = h / 2 - view.cy * view.scale, ay = w / 2 - view.cx * view.scale;
    ctx.strokeStyle = '#8a94a6';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, ax); ctx.lineTo(w, ax); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ay, 0); ctx.lineTo(ay, h); ctx.stroke();
  }
  /* 单色曲线（自动断开无穷/跳变） */
  function plotCurve(ctx, w, h, view, f, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    var prev = null;
    for (var px = -4; px <= w + 4; px += 2) {
      var x = (px - w / 2) / view.scale + view.cx;
      var y = f(x);
      if (!isFinite(y)) { prev = null; continue; }
      var py = h / 2 - (y - view.cy) * view.scale;
      if (prev !== null && Math.abs(py - prev[1]) > h * 4) prev = null;
      if (prev === null) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      prev = [px, py];
    }
    ctx.stroke();
    ctx.restore();
  }

  function setTex(el, tex) {
    el.textContent = tex;
    el.removeAttribute('data-tex'); // 动态公式：清除静态 data-tex，避免永远渲染旧内容
    el.removeAttribute('data-rendered');
    M.renderTex();
  }
  function n(v) { return String(+(+v).toFixed(2)); }

  /* ================= 实验 1：图像实验室 ================= */
  var TEMPLATES = [
    { name: '二次函数 y = a·x² + b·x + c', expr: 'a*x^2 + b*x + c',  p: { a: [-3, 3, 1, 0.1], b: [-5, 5, 1, 0.1], c: [-5, 5, 0, 0.1] } },
    { name: '指数函数 y = a·bˣ + c',       expr: 'a*b^x + c',        p: { a: [-3, 3, 1, 0.1], b: [0.2, 4, 2, 0.1], c: [-3, 3, 0, 0.1] } },
    { name: '对数函数 y = a·ln(bx) + c',   expr: 'a*ln(b*x) + c',    p: { a: [-3, 3, 1, 0.1], b: [0.3, 4, 1, 0.1], c: [-3, 3, 0, 0.1] } },
    { name: '幂函数 y = a·xᵇ',             expr: 'a*x^b',            p: { a: [-3, 3, 1, 0.1], b: [-2.5, 4, 2, 0.1] } },
    { name: '绝对值 y = a·|x+b| + c',      expr: 'a*abs(x + b) + c', p: { a: [-3, 3, 1, 0.1], b: [-4, 4, 0, 0.1], c: [-4, 4, 0, 0.1] } },
    { name: '反比例 y = a/x + c',          expr: 'a/x + c',          p: { a: [-4, 4, 1, 0.1], c: [-4, 4, 0, 0.1] } },
    { name: '正弦型 y = a·sin(bx+c) + d',  expr: 'a*sin(b*x + c) + d', p: { a: [-3, 3, 1, 0.1], b: [0.2, 4, 1, 0.1], c: [-3.2, 3.2, 0, 0.1], d: [-3, 3, 0, 0.1] } }
  ];

  var lab = {
    cv: document.getElementById('fCanvas'),
    view: { cx: 0, cy: 0, scale: 42 },
    tpl: TEMPLATES[0],
    params: {},
    f: null,
    traceX: null
  };
  var fErr = document.getElementById('fErr');
  var fTex = document.getElementById('fTex');
  var fParity = document.getElementById('fParity');
  var fTrace = document.getElementById('fTrace');
  var fExpr = document.getElementById('fExpr');

  /* 把模板里的 a b c d 替换成滑块当前值 */
  function buildExpr() {
    return lab.tpl.expr.replace(/\b([abcd])\b/g, function (_, k) {
      return n(lab.params[k]);
    });
  }
  /* 展示美化：按项去系数 1、归一 0 项、整理符号（供公式显示用） */
  function prettify(s) {
    s = s.replace(/\s+/g, '');
    s = s.replace(/\+-/g, '-');
    var terms = s.split(/(?=[+-])/).filter(Boolean).map(function (t) {
      var sign = '';
      if (t[0] === '+' || t[0] === '-') { sign = t[0]; t = t.slice(1); }
      if (!t) return '';
      t = t.replace(/^1\*/, '');
      if (/^0(\*|$)/.test(t)) t = '0';
      return sign + t;
    });
    s = terms.join('');
    // 乘号：仅当两侧都是数字时保留（如 2*2.5^x），否则直接去掉
    s = s.replace(/\*/g, function (_, off, str) {
      var prev = off > 0 ? str[off - 1] : '';
      var nxt = str[off + 1] || '';
      return (/\d/.test(prev) && /\d/.test(nxt)) ? '*' : '';
    });
    s = s.replace(/\+-/g, '-');
    s = s.replace(/\(1(?=[a-z(])/g, '(');
    s = s.replace(/\+0(?=\))/g, '');
    s = s.replace(/([+-])0(?=[+-])/g, '$1');
    s = s.replace(/^0(?=[+-])/, '');
    s = s.replace(/([+-])0$/, '');
    if (/^[0+\-*.]*$/.test(s)) s = '0';
    return s;
  }
  function toTex(s) {
    return 'y = ' + s
      .replace(/\*/g, '\\cdot ')
      .replace(/abs\(([^()]*)\)/g, '\\left|$1\\right|')
      .replace(/(sin|cos|tan|ln|log)/g, '\\$1 ')
      .replace(/pi/g, '\\pi ');
  }

  function compileExpr(src, fromUser) {
    try {
      lab.f = MathExpr.compile(src);
      fErr.textContent = '';
      fErr.style.display = 'none';
    } catch (e) {
      if (fromUser) {
        fErr.textContent = '⚠️ ' + e.message + '（已保留上一次的图像）';
        fErr.style.display = 'block';
      }
    }
  }

  function refreshLab(fromUser) {
    compileExpr(fExpr.value, fromUser);
    setTex(fTex, toTex(prettify(fExpr.value)));
    if (lab.f) fParity.textContent = '奇偶性：' + parityOf(lab.f);
    drawLab();
  }
  /* 模板/滑块变化时：用参数替换结果覆盖输入框，再刷新 */
  function syncTemplateExpr() {
    fExpr.value = buildExpr();
    refreshLab(false);
  }

  function parityOf(f) {
    var even = 0, odd = 0, cnt = 0;
    for (var x = 0.4; x <= 9; x += 0.35) {
      var a = f(x), b = f(-x);
      if (!isFinite(a) || !isFinite(b)) continue;
      cnt++;
      var scale = Math.max(1, Math.abs(a), Math.abs(b));
      if (Math.abs(a - b) < 1e-6 * scale) even++;
      if (Math.abs(a + b) < 1e-6 * scale) odd++;
    }
    if (cnt < 6) return '定义域受限，样本不足';
    if (even === cnt) return '偶函数（关于 y 轴对称 ✓）';
    if (odd === cnt) return '奇函数（关于原点对称 ✓）';
    return '不具有奇偶性';
  }

  function buildSliders() {
    var box = document.getElementById('fSliders');
    box.innerHTML = '';
    lab.params = {};
    Object.keys(lab.tpl.p).forEach(function (k) {
      var cfg = lab.tpl.p[k];
      lab.params[k] = cfg[2];
      var row = document.createElement('div');
      row.className = 'ctrl';
      row.innerHTML =
        '<label>' + k + '</label>' +
        '<input type="range" min="' + cfg[0] + '" max="' + cfg[1] + '" step="' + cfg[3] + '" value="' + cfg[2] + '">' +
        '<span class="val">' + n(cfg[2]) + '</span>';
      var input = row.querySelector('input'), val = row.querySelector('.val');
      input.addEventListener('input', function () {
        lab.params[k] = +input.value;
        val.textContent = n(input.value);
        syncTemplateExpr();
      });
      box.appendChild(row);
    });
  }

  function drawLab() {
    var s = M.fit(lab.cv), ctx = s.ctx, w = s.w, h = s.h;
    var view = lab.view;
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h, view);
    if (lab.f) plotColoredCurveX(ctx, w, h, view, lab.f);

    // 曲线读数
    if (lab.traceX !== null && lab.f) {
      var y = lab.f(lab.traceX);
      if (isFinite(y)) {
        var px = (lab.traceX - view.cx) * view.scale + w / 2;
        var py = h / 2 - (y - view.cy) * view.scale;
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#b3bcc9';
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, h / 2 - view.cy * view.scale); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(w / 2 - view.cx * view.scale, py); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#1f2937';
        ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        fTrace.style.display = '';
        fTrace.innerHTML = '👆 x = <b>' + M.fmt(lab.traceX) + '</b>，y = <b>' + M.fmt(y, 3) + '</b>';
      }
    } else {
      fTrace.style.display = 'none';
    }
  }
  /* 递增/递减着色曲线 */
  function plotColoredCurveX(ctx, w, h, view, f) {
    var inc = [], dec = [], prev = null;
    for (var px = -4; px <= w + 4; px += 2) {
      var x = (px - w / 2) / view.scale + view.cx;
      var y = f(x);
      if (!isFinite(y)) { prev = null; continue; }
      var d = (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;
      var py = h / 2 - (y - view.cy) * view.scale;
      if (prev !== null && Math.abs(py - prev[1]) < h * 4) {
        (d >= 0 ? inc : dec).push(prev[0], prev[1], px, py);
      }
      prev = [px, py];
    }
    function segs(arr, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.beginPath();
      for (var i = 0; i < arr.length; i += 4) {
        ctx.moveTo(arr[i], arr[i + 1]); ctx.lineTo(arr[i + 2], arr[i + 3]);
      }
      ctx.stroke();
    }
    segs(inc, '#e05252');
    segs(dec, '#3f7fe0');
  }

  function initTplSelect() {
    var sel = document.getElementById('fTpl');
    sel.innerHTML = TEMPLATES.map(function (t, i) {
      return '<option value="' + i + '">' + t.name + '</option>';
    }).join('');
    sel.addEventListener('change', function () {
      lab.tpl = TEMPLATES[+sel.value];
      buildSliders();
      syncTemplateExpr();
    });
  }

  function initLab() {
    initTplSelect();
    buildSliders();
    fExpr.value = buildExpr();
    refreshLab(false);

    // 输入即重绘；change（回车/失焦）时才提示语法错误
    fExpr.addEventListener('input', function () { refreshLab(false); });
    fExpr.addEventListener('change', function () { refreshLab(true); });

    var drag = null;
    lab.cv.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY };
      lab.cv.setPointerCapture(e.pointerId);
    });
    lab.cv.addEventListener('pointermove', function (e) {
      if (drag) {
        lab.view.cx -= (e.clientX - drag.x) / lab.view.scale;
        lab.view.cy += (e.clientY - drag.y) / lab.view.scale;
        drag = { x: e.clientX, y: e.clientY };
        drawLab();
      } else {
        var rect = lab.cv.getBoundingClientRect();
        lab.traceX = (e.clientX - rect.left - rect.width / 2) / lab.view.scale + lab.view.cx;
        drawLab();
      }
    });
    lab.cv.addEventListener('pointerup', function () { drag = null; });
    lab.cv.addEventListener('pointerleave', function () {
      if (!drag) { lab.traceX = null; fTrace.style.display = 'none'; drawLab(); }
    });
    lab.cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      var factor = Math.exp(-e.deltaY * 0.0012);
      var rect = lab.cv.getBoundingClientRect();
      // 保持鼠标下的数学坐标不动
      var mx = (e.clientX - rect.left - rect.width / 2) / lab.view.scale + lab.view.cx;
      var my = lab.view.cy - (e.clientY - rect.top - rect.height / 2) / lab.view.scale;
      lab.view.scale = M.clamp(lab.view.scale * factor, 6, 400);
      lab.view.cx = mx - (e.clientX - rect.left - rect.width / 2) / lab.view.scale;
      lab.view.cy = my + (e.clientY - rect.top - rect.height / 2) / lab.view.scale;
      drawLab();
    }, { passive: false });

    drawLab();
  }

  /* ================= 实验 2：图像变换实验台 ================= */
  var BASES = [
    { name: 'f(x) = x²',  f: function (x) { return x * x; },            tex: function (s) { return '(' + s + ')^2'; } },
    { name: 'f(x) = |x|', f: Math.abs,                                  tex: function (s) { return '\\left|' + s + '\\right|'; } },
    { name: 'f(x) = √x',  f: function (x) { return x < 0 ? NaN : Math.sqrt(x); }, tex: function (s) { return '\\sqrt{' + s + '}'; } },
    { name: 'f(x) = x³',  f: function (x) { return x * x * x; },        tex: function (s) { return '(' + s + ')^3'; } },
    { name: 'f(x) = 1/x', f: function (x) { return 1 / x; },            tex: function (s) { return '\\dfrac{1}{' + s + '}'; } },
    { name: 'f(x) = sin x', f: Math.sin,                                tex: function (s) { return '\\sin(' + s + ')'; } }
  ];
  var tr = { cv: document.getElementById('tCanvas'), base: BASES[0], a: 1, h: 0, k: 0 };

  function trDraw() {
    var s = M.fit(tr.cv), ctx = s.ctx, w = s.w, h = s.h;
    var view = { cx: 0, cy: 0, scale: w / 15 };
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h, view);
    plotCurve(ctx, w, h, view, tr.base.f, '#a8b3c4', 2, [6, 5]);
    plotCurve(ctx, w, h, view, function (x) { return tr.a * tr.base.f(x - tr.h) + tr.k; }, ACCENT, 2.6);
  }

  function trUpdate() {
    ['A', 'H', 'K'].forEach(function (k) {
      document.getElementById('t' + k + 'v').textContent = n({ A: tr.a, H: tr.h, K: tr.k }[k]);
    });
    var inner = 'x' + (tr.h > 0 ? ' - ' + n(tr.h) : tr.h < 0 ? ' + ' + n(-tr.h) : '');
    var body = tr.base.tex(inner);
    var coef = tr.a === 1 ? '' : tr.a === -1 ? '-' : n(tr.a) + ' \\cdot ';
    var lift = tr.k === 0 ? '' : (tr.k > 0 ? ' + ' + n(tr.k) : ' - ' + n(-tr.k));
    setTex(document.getElementById('tTex'), 'y = ' + coef + body + lift);
    trDraw();
  }

  function initTransform() {
    var sel = document.getElementById('tBase');
    sel.innerHTML = BASES.map(function (b, i) { return '<option value="' + i + '">' + b.name + '</option>'; }).join('');
    sel.addEventListener('change', function () { tr.base = BASES[+sel.value]; trUpdate(); });
    [['tA', 'a'], ['tH', 'h'], ['tK', 'k']].forEach(function (pair) {
      document.getElementById(pair[0]).addEventListener('input', function (e) {
        tr[pair[1]] = +e.target.value;
        trUpdate();
      });
    });
    trUpdate();
  }

  /* ================= 测验 ================= */
  M.renderQuiz('#quiz', 'functions', [
    {
      q: '已知 <span class="tex">f(x)</span> 的定义域为 <span class="tex">[-2, 3]</span>，则 <span class="tex">f(x+1)</span> 的定义域是？',
      opts: ['<span class="tex">[-1, 4]</span>', '<span class="tex">[-3, 2]</span>', '<span class="tex">[-2, 3]</span>', '<span class="tex">[-3, 3]</span>'],
      a: 1,
      ex: '括号里的整体要在原定义域内：<span class="tex">-2 \\le x+1 \\le 3</span>，解得 <span class="tex">-3 \\le x \\le 2</span>。注意定义域永远指 x 本身的范围。'
    },
    {
      q: '<span class="tex">f(x) = x^3</span> 是什么函数？',
      opts: ['偶函数', '奇函数', '既是奇函数又是偶函数', '不具有奇偶性'],
      a: 1,
      ex: '<span class="tex">f(-x)=(-x)^3=-x^3=-f(x)</span>，满足奇函数定义，图像关于原点对称（在实验 2 里选 x³、a=1 就能看到）。'
    },
    {
      q: '指数函数 <span class="tex">y = 0.5^x</span> 在 R 上的单调性是？',
      opts: ['单调递增', '单调递减', '先增后减', '不单调'],
      a: 1,
      ex: '底数 <span class="tex">0 < a < 1</span> 时指数函数单调递减（在实验 1 里把 b 拖到 0.5 看看）；<span class="tex">a > 1</span> 时才单调递增。'
    },
    {
      q: '计算：<span class="tex">\\log_2 8 + \\log_3 \\dfrac{1}{9} =</span> ？',
      opts: ['1', '5', '-1', '0'],
      a: 0,
      ex: '<span class="tex">\\log_2 8 = 3</span>（2 的 3 次方是 8），<span class="tex">\\log_3 \\frac{1}{9} = \\log_3 3^{-2} = -2</span>，所以 <span class="tex">3 + (-2) = 1</span>。'
    },
    {
      q: '把 <span class="tex">y = |x|</span> 的图像变成 <span class="tex">y = |x-1| + 2</span>，需要怎样的变换？',
      opts: ['向左平移 1，再向上平移 2', '向右平移 1，再向上平移 2', '向右平移 1，再向下平移 2', '向上平移 1，再向右平移 2'],
      a: 1,
      ex: '<span class="tex">x-1</span> 是"左加右减"里的<b>减</b>，即向右平移 1 个单位；<span class="tex">+2</span> 是"上加下减"里的<b>加</b>，即向上平移 2 个单位。去实验 2 验证一下！'
    }
  ]);

  /* ================= 启动 ================= */
  initLab();
  initTransform();
  window.addEventListener('resize', function () { drawLab(); trDraw(); });
})();
