/* ============================================================
   数趣星球 · 全站共用脚本
   导航/页脚渲染、KaTeX 懒加载、公式渲染、学习进度存储、测验组件、Canvas 工具
   ============================================================ */
(function () {
  'use strict';

  var KATEX_BASE = 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/';
  var LS_KEY = 'mathfun.progress.v1';

  var PAGES = [
    { id: 'functions',   file: 'functions.html',   name: '函数',     emoji: '📈', color: '#3b82f6' },
    { id: 'trig',        file: 'trig.html',        name: '三角函数', emoji: '🌀', color: '#8b5cf6' },
    { id: 'sequences',   file: 'sequences.html',   name: '数列',     emoji: '🌱', color: '#10b981' },
    { id: 'derivatives', file: 'derivatives.html', name: '导数',     emoji: '📐', color: '#f59e0b' },
    { id: 'conics',      file: 'conics.html',      name: '圆锥曲线', emoji: '🪐', color: '#ec4899' },
    { id: 'geometry3d',  file: 'geometry3d.html',  name: '立体几何', emoji: '🧊', color: '#06b6d4' },
    { id: 'vectors',     file: 'vectors.html',     name: '平面向量', emoji: '🧭', color: '#6366f1' },
    { id: 'probability', file: 'probability.html', name: '概率统计', emoji: '🎲', color: '#ef4444' }
  ];

  /* ---------------- 小工具 ---------------- */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function fmt(v, d) {
    if (!isFinite(v)) return '∞';
    var s = v.toFixed(d === undefined ? 2 : d);
    return s.replace(/\.?0+$/, '') || '0';
  }

  /* 高 DPI canvas：每帧调用，尺寸变化时自动重建 */
  function fit(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---------------- 坐标系图表工具 ---------------- */
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
  /* view: {cx, cy, scale} —— scale 为每单位像素数，x 向右 y 向上 */
  function chartGrid(ctx, w, h, view) {
    var step = niceStep(64 / view.scale);
    var x0 = view.cx - w / 2 / view.scale, x1 = view.cx + w / 2 / view.scale;
    var y0 = view.cy - h / 2 / view.scale, y1 = view.cy + h / 2 / view.scale;
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
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
  /* 按 view 画函数曲线，自动断开无穷/跳变 */
  function chartPlot(ctx, w, h, view, f, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
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
  function chartLine(ctx, w, h, view, x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo((x1 - view.cx) * view.scale + w / 2, h / 2 - (y1 - view.cy) * view.scale);
    ctx.lineTo((x2 - view.cx) * view.scale + w / 2, h / 2 - (y2 - view.cy) * view.scale);
    ctx.stroke();
    ctx.restore();
  }
  function chartDotAt(ctx, w, h, view, x, y, r, color, ringColor) {
    var px = (x - view.cx) * view.scale + w / 2;
    var py = h / 2 - (y - view.cy) * view.scale;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
    if (ringColor) {
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  var chart = {
    niceStep: niceStep,
    tickText: tickText,
    grid: chartGrid,
    plot: chartPlot,
    line: chartLine,
    dot: chartDotAt
  };

  /* ---------------- 进度存储 ---------------- */
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveAll(all) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) { /* 隐私模式忽略 */ }
  }

  var progress = {
    topic: function (id) {
      var t = loadAll()[id];
      return t || { answers: [], total: 0, done: false };
    },
    scoreOf: function (id) {
      var t = this.topic(id);
      var ok = 0;
      (t.answers || []).forEach(function (a) { if (a && a.ok) ok++; });
      return { correct: ok, total: t.total || 0 };
    },
    saveAnswer: function (id, qIndex, ok, total) {
      var all = loadAll();
      var t = all[id] || { answers: [], total: total };
      t.total = total;
      t.answers[qIndex] = { ok: ok };
      t.done = t.answers.filter(Boolean).length >= total;
      all[id] = t;
      saveAll(all);
    },
    reset: function (id) {
      var all = loadAll();
      delete all[id];
      saveAll(all);
    },
    summary: function () {
      var all = loadAll(), score = 0, total = 0;
      PAGES.forEach(function (p) {
        var s = progress.scoreOf(p.id);
        score += s.correct; total += s.total;
      });
      return { score: score, total: total };
    }
  };

  /* ---------------- KaTeX 懒加载与渲染 ---------------- */
  var katexReady = false, texQueue = [];

  function renderTexAll() {
    if (!window.katex) return; // 未加载完成时保持原文，加载后由 onload 触发
    var nodes = document.querySelectorAll('.tex, .tex-block');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.dataset.rendered) continue;
      var tex = el.getAttribute('data-tex') || el.textContent;
      try {
        katex.render(tex, el, {
          throwOnError: false,
          displayMode: el.classList.contains('tex-block')
        });
      } catch (e) { /* 渲染失败则保留原文 */ }
      el.dataset.rendered = '1';
    }
  }

  function loadKatex() {
    if (katexReady) return;
    katexReady = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = KATEX_BASE + 'katex.min.css';
    document.head.appendChild(link);
    var s = document.createElement('script');
    s.src = KATEX_BASE + 'katex.min.js';
    s.onload = function () { renderTexAll(); };
    s.onerror = function () { /* 离线时保留原始 LaTeX 文本 */ };
    document.head.appendChild(s);
  }

  function renderTex(scope) {
    if (scope) {
      // 新插入的节点：若 katex 已就绪立即渲染，否则等加载完成
      if (window.katex) renderTexAll();
      // 未就绪时挂起，onload 时会全量扫描
    } else {
      renderTexAll();
    }
  }

  /* ---------------- 导航 / 页脚 / 翻页 ---------------- */
  function currentPageId() { return document.body.dataset.page || ''; }

  function renderNav() {
    var el = document.getElementById('site-nav');
    if (!el) return;
    var cur = currentPageId();
    var links = [{ id: 'index', file: 'index.html', name: '首页', emoji: '🏠' }].concat(PAGES).map(function (p) {
      return '<a href="' + p.file + '"' + (p.id === cur ? ' class="active"' : '') + '>' + p.emoji + ' ' + p.name + '</a>';
    }).join('');
    el.innerHTML =
      '<div class="nav-inner container">' +
        '<a class="brand" href="index.html"><i class="brand-logo">∑</i>数趣星球</a>' +
        '<button class="nav-toggle" aria-label="展开菜单">☰</button>' +
        '<nav class="nav-links" id="navLinks">' + links + '</nav>' +
      '</div>';
    el.querySelector('.nav-toggle').addEventListener('click', function () {
      el.querySelector('.nav-links').classList.toggle('open');
    });
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.className = 'site-footer';
    el.innerHTML = '数趣星球 · 在玩中学会高中数学 —— 全部交互在你的浏览器本地运行，学习进度只保存在本机。<br>' +
      '静态站点，适合部署在 <a href="https://pages.github.com/" target="_blank" rel="noopener">GitHub Pages</a>。';
  }

  function renderPager() {
    var el = document.querySelector('.pager');
    if (!el) return;
    var cur = currentPageId();
    var i = PAGES.findIndex(function (p) { return p.id === cur; });
    if (i < 0) { el.style.display = 'none'; return; }
    var prev = PAGES[i - 1], next = PAGES[i + 1];
    el.innerHTML =
      (prev ? '<a class="pager-link" href="' + prev.file + '"><small>← 上一站</small>' + prev.emoji + ' ' + prev.name + '</a>' : '<span></span>') +
      (next ? '<a class="pager-link next" href="' + next.file + '"><small>下一站 →</small>' + next.emoji + ' ' + next.name + '</a>' : '<span></span>');
  }

  /* ---------------- 测验组件 ---------------- */
  var LETTERS = ['A', 'B', 'C', 'D', 'E'];

  function renderQuiz(container, topicId, questions) {
    var root = (typeof container === 'string') ? document.querySelector(container) : container;
    if (!root) return;

    function draw() {
      var saved = progress.topic(topicId);
      var answers = saved.answers || [];
      var correctCount = 0;
      answers.forEach(function (a) { if (a && a.ok) correctCount++; });
      var allDone = answers.filter(Boolean).length >= questions.length;

      var html = '<div class="quiz-head">' +
        '<h2 style="margin:0">✏️ 随堂小测</h2>' +
        '<span class="quiz-score" id="quizScore">已答对 ' + correctCount + ' / ' + questions.length + '</span>' +
        '<button class="btn small" id="quizReset" type="button">重做测验</button>' +
        '</div><p class="widget-desc">点选答案立即判分，每题都附解析；答对的进度会自动保存。</p>';

      questions.forEach(function (q, qi) {
        html += '<div class="quiz-q"><div class="q-text"><span class="q-num">' + (qi + 1) + '</span>' + q.q + '</div><div class="opts">';
        q.opts.forEach(function (opt, oi) {
          html += '<button type="button" class="opt" data-q="' + qi + '" data-o="' + oi + '">' +
            '<span class="opt-key">' + LETTERS[oi] + '</span>' + opt + '</button>';
        });
        html += '</div><div class="explain" id="ex' + qi + '"><b>解析：</b>' + q.ex + '</div></div>';
      });

      html += '<div class="quiz-done" id="quizDone">🎉 测验完成！你答对了 ' + correctCount + ' / ' + questions.length + '，继续探索下一站吧～</div>';
      root.innerHTML = html;

      // 恢复已答题目状态
      answers.forEach(function (a, qi) {
        if (!a) return;
        paintAnswer(qi, a.pick, questions[qi].a, true);
      });

      root.querySelectorAll('.opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var qi = +btn.dataset.q, oi = +btn.dataset.o;
          if (answers[qi]) return; // 已答过
          answers[qi] = { pick: oi, ok: oi === questions[qi].a };
          progress.saveAnswer(topicId, qi, answers[qi].ok, questions.length);
          paintAnswer(qi, oi, questions[qi].a, false);
          updateScore();
        });
      });

      root.querySelector('#quizReset').addEventListener('click', function () {
        progress.reset(topicId);
        draw();
      });

      function paintAnswer(qi, pick, ans, silent) {
        var opts = root.querySelectorAll('.opt[data-q="' + qi + '"]');
        opts.forEach(function (b) {
          b.disabled = true;
          if (+b.dataset.o === ans) b.classList.add('correct');
          else if (+b.dataset.o === pick) b.classList.add('wrong');
        });
        root.querySelector('#ex' + qi).classList.add('show');
      }

      function updateScore() {
        var ok = 0;
        answers.forEach(function (a) { if (a && a.ok) ok++; });
        root.querySelector('#quizScore').textContent = '已答对 ' + ok + ' / ' + questions.length;
        var doneEl = root.querySelector('#quizDone');
        if (answers.filter(Boolean).length >= questions.length) {
          doneEl.textContent = '🎉 测验完成！你答对了 ' + ok + ' / ' + questions.length + '，继续探索下一站吧～';
          doneEl.style.display = 'block';
        }
      }
    }

    draw();
    renderTex(root);
  }

  /* ---------------- 主题卡片进度（首页用） ---------------- */
  function renderTopicProgress() {
    PAGES.forEach(function (p) {
      var bar = document.querySelector('[data-progress="' + p.id + '"]');
      if (!bar) return;
      var s = progress.scoreOf(p.id);
      var pct = s.total ? Math.round(s.correct / s.total * 100) : 0;
      bar.querySelector('.pfill').style.width = pct + '%';
      var label = bar.querySelector('.pbar-label span');
      if (label) label.textContent = s.total ? ('测验 ' + s.correct + '/' + s.total) : '尚未开始';
    });
    var sum = progress.summary();
    var ring = document.getElementById('progressRing');
    if (ring && sum.total) {
      var pct = sum.score / sum.total;
      var C = 2 * Math.PI * 40;
      ring.style.strokeDasharray = C;
      ring.style.strokeDashoffset = C * (1 - pct);
      var labelEl = document.getElementById('ringLabel');
      if (labelEl) labelEl.textContent = Math.round(pct * 100) + '%';
      var txt = document.getElementById('ringText');
      if (txt) txt.textContent = '已掌握 ' + sum.score + ' / ' + sum.total + ' 道小测题';
    }
  }

  /* ---------------- 视觉增强 ---------------- */
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 页头漂浮数学符号 */
  function heroDecor() {
    if (REDUCED) return;
    var glyphs = ['∑', 'π', '∫', '√', '∞', 'Δ', 'θ', 'φ', 'ω', '±', '≈', '∇'];
    document.querySelectorAll('.page-hero, .index-hero').forEach(function (hero) {
      if (hero.querySelector('.hero-glyphs')) return;
      var wrap = document.createElement('div');
      wrap.className = 'hero-glyphs';
      wrap.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 9; i++) {
        var s = document.createElement('span');
        s.textContent = glyphs[(i * 5 + 3) % glyphs.length];
        s.style.left = (3 + (i * 12.7) % 93) + '%';
        s.style.top = (6 + (i * 29.7) % 72) + '%';
        s.style.fontSize = (15 + (i * 13) % 26) + 'px';
        s.style.animationDuration = (7 + (i % 5) * 1.9) + 's';
        s.style.animationDelay = (-i * 1.4) + 's';
        wrap.appendChild(s);
      }
      hero.appendChild(wrap);
    });
  }

  /* 滚动显现（带兜底：1.4s 后全部显示，避免意外不可见） */
  function revealInit() {
    var els = document.querySelectorAll('main > .card, main > .pager, .home-section, .progress-band');
    if (REDUCED || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.06 });
    els.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
      io.observe(el);
    });
    setTimeout(function () {
      els.forEach(function (el) { el.classList.add('in'); });
    }, 1400);
  }

  /* 首页统计数字滚动 */
  function countUp() {
    if (REDUCED) return;
    document.querySelectorAll('.index-stats .stat b').forEach(function (el) {
      var m = el.textContent.match(/^(\d+)(.*)$/);
      if (!m || !+m[1]) return;
      var target = +m[1], suffix = m[2], t0 = null, dur = 950;
      el.textContent = '0' + suffix;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    var accent = document.body.dataset.accent;
    if (accent) document.documentElement.style.setProperty('--accent', accent);
    renderNav();
    renderFooter();
    renderPager();
    renderTopicProgress();
    heroDecor();
    revealInit();
    countUp();
    loadKatex();
    renderTexAll(); // CDN 已缓存时立即渲染，否则等 onload
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ---------------- 导出 ---------------- */
  window.M = {
    pages: PAGES,
    clamp: clamp,
    fmt: fmt,
    fit: fit,
    chart: chart,
    progress: progress,
    renderQuiz: renderQuiz,
    renderTex: renderTex,
    accent: function () {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';
    }
  };
})();
