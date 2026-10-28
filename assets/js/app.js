/* =========================================================
   晶晶 × 以轩 · 我们的小小日子
   纯原生 JS，无依赖，双击 index.html 就能跑。
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var DAY = 86400000;
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function parseDate(str) {
    var p = String(str).split('-').map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  }
  function todayStart() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function dayDiff(a, b) {
    return Math.round((b.getTime() - a.getTime()) / DAY);
  }
  function fmtDate(d) {
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
  }

  /* ---------------- 1. 主题切换 ---------------- */
  var root = document.documentElement;
  var THEME_KEY = 'jj-yx-theme';
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme, save) {
    root.setAttribute('data-theme', theme);
    if (metaTheme) metaTheme.setAttribute('content', theme === 'film' ? '#141210' : '#fbf5ec');
    if (save) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }
  }

  var themeToggle = $('#themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function (e) {
      var opt = e.target.closest ? e.target.closest('.tt-option') : null;
      var next = opt ? opt.getAttribute('data-mode')
        : (root.getAttribute('data-theme') === 'film' ? 'cream' : 'film');
      applyTheme(next, true);
    });
  }

  /* ---------------- 2. 开场：天数与时钟 ---------------- */
  var SITE = window.SITE || { together: '2026-10-10' };
  var together = parseDate(SITE.together);

  function countUp(el, target) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target;
      return;
    }
    var dur = 1100, t0 = null, done = false;
    function finish() {
      if (!done) { done = true; el.textContent = target; }
    }
    /* 兜底：动画被打断（切后台、截图、低性能）时也一定落到正确数字 */
    setTimeout(finish, 1500);
    function step(ts) {
      if (done) return;
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else finish();
    }
    requestAnimationFrame(step);
  }

  function renderHero() {
    var today = todayStart();
    var days = Math.max(1, dayDiff(together, today));
    var el = $('#daysCount');
    if (el) countUp(el, days);
    var t = $('#todayText');
    if (t) t.textContent = (today.getMonth() + 1) + ' 月 ' + today.getDate() + ' 日 · ' + WEEK[today.getDay()];
  }

  function tickClock() {
    var el = $('#nowClock');
    if (!el) return;
    var n = new Date();
    el.textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds());
  }

  renderHero();
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------------- 3. 回忆时间线 ---------------- */
  var PHOTOS = window.PHOTOS || [];
  var photoById = {};
  PHOTOS.forEach(function (p) { photoById[p.id] = p; });

  function renderTimeline() {
    var list = $('#timelineList');
    if (!list || !window.TIMELINE) return;
    list.innerHTML = window.TIMELINE.map(function (node) {
      var p = photoById[node.photo];
      var photo = p
        ? '<div class="tl-photo" style="aspect-ratio:' + p.w + ' / ' + p.h + '">' +
            '<img src="' + p.src + '" alt="' + esc(node.date + ' ' + node.title) + '" ' +
            'width="' + p.w + '" height="' + p.h + '" loading="lazy" decoding="async">' +
          '</div>'
        : '';
      return '<li class="tl-item reveal' + (node.highlight ? ' is-key' : '') + '">' +
        '<span class="tl-dot" aria-hidden="true"></span>' +
        '<article class="tl-card">' +
          '<header class="tl-head">' +
            '<time class="tl-date">' + esc(node.date) + '</time>' +
            '<span class="tl-tag">' + esc(node.tag) + '</span>' +
          '</header>' +
          '<h3 class="tl-title">' + esc(node.title) + '</h3>' +
          '<p class="tl-text">' + esc(node.text) + '</p>' +
          photo +
        '</article>' +
      '</li>';
    }).join('');
  }

  /* ---------------- 4. 相册 ---------------- */
  var albumGrid = $('#albumGrid');
  var filters = $('#albumFilters');
  var albumCount = $('#albumCount');
  var currentFilter = 'all';
  var visiblePhotos = [];
  var lastFocused = null;

  function renderAlbum() {
    if (!albumGrid) return;
    albumGrid.innerHTML = PHOTOS.map(function (p) {
      return '<button class="album-item reveal" type="button" data-id="' + p.id + '" ' +
        'data-group="' + p.group + '" style="aspect-ratio:' + p.w + ' / ' + p.h + '" ' +
        'aria-label="放大查看 ' + esc(p.date + (p.caption ? ' ' + p.caption : '')) + '">' +
        '<img src="' + p.thumb + '" alt="' + esc(p.caption || p.date) + '" ' +
        'width="' + p.w + '" height="' + p.h + '" loading="lazy" decoding="async">' +
        '<span class="album-meta"><i>' + esc(p.date) + '</i>' +
        (p.caption ? '<b>' + esc(p.caption) + '</b>' : '') + '</span>' +
      '</button>';
    }).join('');

    if (filters) {
      var counts = { all: PHOTOS.length, date: 0, travel: 0, daily: 0 };
      PHOTOS.forEach(function (p) { counts[p.group] = (counts[p.group] || 0) + 1; });
      $$('.chip', filters).forEach(function (btn) {
        var n = $('.chip-n', btn);
        if (n) n.textContent = counts[btn.getAttribute('data-filter')] || 0;
      });
    }
    applyFilter('all');
  }

  function applyFilter(key) {
    currentFilter = key;
    visiblePhotos = [];
    $$('.album-item', albumGrid).forEach(function (item) {
      var ok = key === 'all' || item.getAttribute('data-group') === key;
      item.classList.toggle('is-hidden', !ok);
      if (ok) visiblePhotos.push(Number(item.getAttribute('data-id')));
    });
    if (albumCount) albumCount.textContent = visiblePhotos.length + ' / ' + PHOTOS.length + ' 张';
    if (filters) {
      $$('.chip', filters).forEach(function (b) {
        var active = b.getAttribute('data-filter') === key;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }
  }

  if (filters) {
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.chip') : null;
      if (btn) applyFilter(btn.getAttribute('data-filter'));
    });
  }

  /* ---------------- 5. 灯箱 ---------------- */
  var lb = $('#lightbox');
  var lbImg = $('#lbImage');
  var lbDate = $('#lbDate');
  var lbCaption = $('#lbCaption');
  var lbCounter = $('#lbCounter');
  var lbIndex = 0;

  function openLightbox(id) {
    if (!lb) return;
    var at = visiblePhotos.indexOf(id);
    lbIndex = at < 0 ? 0 : at;
    lastFocused = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('is-locked');
    paintLightbox();
    $('#lbClose').focus();
  }

  function paintLightbox() {
    var id = visiblePhotos[lbIndex];
    var p = photoById[id];
    if (!p) return;
    lbImg.src = p.src;
    lbImg.alt = p.caption || p.date;
    lbDate.textContent = p.date;
    lbCaption.textContent = p.caption || '';
    lbCounter.textContent = (lbIndex + 1) + ' / ' + visiblePhotos.length;
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function stepLightbox(dir) {
    if (!visiblePhotos.length) return;
    lbIndex = (lbIndex + dir + visiblePhotos.length) % visiblePhotos.length;
    paintLightbox();
  }

  if (albumGrid) {
    albumGrid.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.album-item') : null;
      if (item) openLightbox(Number(item.getAttribute('data-id')));
    });
  }
  if (lb) {
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', function () { stepLightbox(-1); });
    $('#lbNext').addEventListener('click', function () { stepLightbox(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
      else if (e.key === 'ArrowRight') stepLightbox(1);
    });

    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) stepLightbox(dx > 0 ? -1 : 1);
      touchX = null;
    }, { passive: true });
  }

  /* ---------------- 6. 纪念日 ---------------- */
  function nextSolarMD(month, day, today) {
    var y = today.getFullYear();
    var t = new Date(y, month - 1, day);
    if (t < today) t = new Date(y + 1, month - 1, day);
    return t;
  }
  function nextFromTable(table, today) {
    var ds = table.map(parseDate).filter(function (d) { return !isNaN(d.getTime()); })
      .sort(function (a, b) { return a - b; });
    for (var i = 0; i < ds.length; i++) if (ds[i] >= today) return ds[i];
    return null;
  }

  function computeDates() {
    var today = todayStart();
    return (window.DATES || []).map(function (entry) {
      var next = null, note = '';
      if (entry.type === 'since') {
        var since = parseDate(entry.date);
        note = '已经 ' + Math.max(0, dayDiff(since, today)) + ' 天';
        next = nextSolarMD(since.getMonth() + 1, since.getDate(), today);
      } else if (entry.type === 'monthly') {
        var y = today.getFullYear(), m = today.getMonth();
        next = new Date(y, m, entry.day);
        if (next < today) next = new Date(y, m + 1, entry.day);
      } else if (entry.type === 'solar') {
        var md = entry.md.split('-').map(Number);
        next = nextSolarMD(md[0], md[1], today);
      } else if (entry.type === 'lunar') {
        next = nextFromTable(entry.table, today);
      }
      return { entry: entry, next: next, note: note };
    });
  }

  function renderDates() {
    var grid = $('#dateGrid');
    if (!grid) return;
    var today = todayStart();
    var items = computeDates();

    var CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    grid.innerHTML = items.map(function (it) {
      var e = it.entry;
      var whenLabel = '下一次';
      var whenDate = it.next ? fmtDate(it.next) : '—';
      var left;

      if (e.type === 'since') {
        /* 恋爱纪念日：大数字显示已经在一起的天数，右边写下一次周年 */
        var since = parseDate(e.date);
        var passed = Math.max(0, dayDiff(since, today));
        left = '<span class="dc-left">' + passed + '<em>天</em></span>';
        whenLabel = '已经在一起';
        if (it.next) {
          var years = it.next.getFullYear() - since.getFullYear();
          whenDate = fmtDate(it.next) + ' · ' + (CN[years] || years) + ' 周年';
        }
      } else if (!it.next) {
        left = '<span class="dc-left">--<em>待定</em></span>';
      } else {
        var d = dayDiff(today, it.next);
        left = d === 0
          ? '<span class="dc-left is-today">今天</span>'
          : '<span class="dc-left">' + d + '<em>天</em></span>';
      }

      return '<article class="date-card">' +
        '<span class="dc-label">' + esc(e.label) + '</span>' +
        '<h3>' + esc(e.title) + '</h3>' +
        '<p class="dc-meta">' + esc(e.meta) + '</p>' +
        '<div class="dc-foot">' +
          '<span class="dc-when"><b>' + esc(whenLabel) + '</b>' +
          '<span>' + esc(whenDate) + '</span></span>' +
          left +
        '</div>' +
      '</article>';
    }).join('');

    var upcoming = items.filter(function (it) { return it.next; })
      .sort(function (a, b) { return a.next - b.next; });
    if (upcoming.length) {
      var top = upcoming[0];
      var dd = dayDiff(today, top.next);
      $('#nextUpDays').textContent = dd;
      $('#nextUpTitle').textContent = top.entry.label + ' · ' + top.entry.title;
      $('#nextUpDate').textContent = fmtDate(top.next) + (dd === 0 ? ' · 就是今天' : '');
    }
  }

  /* ---------------- 7. 拼图 ---------------- */
  var board = $('#puzzleBoard');
  var puzzle = { state: [0, 1, 2, 3, 4, 5, 6, 7, 8], moves: 0, start: 0, timer: null, solved: false, cells: [] };
  var PUZZLE_SRC = 'assets/img/puzzle.webp';
  var BOARD_SIZE = 3;

  function isNeighbor(a, b) {
    var ra = Math.floor(a / BOARD_SIZE), ca = a % BOARD_SIZE;
    var rb = Math.floor(b / BOARD_SIZE), cb = b % BOARD_SIZE;
    return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
  }

  function paintPuzzle() {
    puzzle.state.forEach(function (tile, pos) {
      var el = puzzle.cells[pos];
      if (!el) return;
      if (tile === 8) {
        el.classList.add('is-blank');
        el.style.backgroundImage = 'none';
        el.setAttribute('aria-label', '空位');
      } else {
        el.classList.remove('is-blank');
        el.style.backgroundImage = 'url("' + PUZZLE_SRC + '")';
        el.style.backgroundPosition = ((tile % 3) * 50) + '% ' + (Math.floor(tile / 3) * 50) + '%';
        el.setAttribute('aria-label', '照片块 ' + (tile + 1));
      }
    });
  }

  function puzzleSolved() {
    for (var i = 0; i < 9; i++) if (puzzle.state[i] !== i) return false;
    return true;
  }

  function stopTimer() {
    if (puzzle.timer) { clearInterval(puzzle.timer); puzzle.timer = null; }
  }

  function startTimer() {
    puzzle.start = Date.now();
    stopTimer();
    puzzle.timer = setInterval(function () {
      var s = Math.floor((Date.now() - puzzle.start) / 1000);
      var el = $('#puzzleTimer');
      if (el) el.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }, 500);
  }

  function shufflePuzzle() {
    puzzle.state = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    var blank = 8, prev = -1;
    for (var i = 0; i < 260; i++) {
      var nums = [];
      for (var n = 0; n < 9; n++) if (isNeighbor(n, blank) && n !== prev) nums.push(n);
      var pick = nums[Math.floor(Math.random() * nums.length)];
      puzzle.state[blank] = puzzle.state[pick];
      puzzle.state[pick] = 8;
      prev = blank;
      blank = pick;
    }
    if (puzzleSolved()) return shufflePuzzle();
    puzzle.moves = 0;
    puzzle.solved = false;
    stopTimer();
    $('#puzzleMoves').textContent = '0';
    $('#puzzleTimer').textContent = '00:00';
    $('#puzzleMsg').hidden = true;
    $('#puzzleMsg').classList.remove('is-win');
    board.classList.remove('is-peek');
    paintPuzzle();
  }

  function onPuzzleClick(e) {
    var el = e.currentTarget;
    if (puzzle.solved) return;
    var pos = Number(el.getAttribute('data-pos'));
    var blank = puzzle.state.indexOf(8);
    if (!isNeighbor(pos, blank)) return;

    puzzle.state[blank] = puzzle.state[pos];
    puzzle.state[pos] = 8;
    puzzle.moves++;
    if (!puzzle.timer) startTimer();
    $('#puzzleMoves').textContent = puzzle.moves;
    paintPuzzle();

    if (puzzleSolved()) {
      puzzle.solved = true;
      stopTimer();
      var msg = $('#puzzleMsg');
      msg.hidden = false;
      msg.classList.add('is-win');
      msg.textContent = '拼好啦！' + puzzle.moves + ' 步，就是我们俩。';
    }
  }

  if (board) {
    for (var i = 0; i < 9; i++) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'puzzle-cell';
      cell.setAttribute('data-pos', i);
      cell.addEventListener('click', onPuzzleClick);
      board.appendChild(cell);
      puzzle.cells.push(cell);
    }
    shufflePuzzle();

    $('#puzzleShuffle').addEventListener('click', shufflePuzzle);

    var peekBtn = $('#puzzlePeek');
    var peekTimer = null;
    peekBtn.addEventListener('click', function () {
      board.classList.add('is-peek');
      clearTimeout(peekTimer);
      peekTimer = setTimeout(function () { board.classList.remove('is-peek'); }, 1800);
    });
  }

  /* ---------------- 8. 问答小游戏 ---------------- */
  var QUIZ = window.QUIZ || [];
  var quizState = { i: 0, score: 0, locked: false };
  var quizQ = $('#quizQuestion');
  var quizOpts = $('#quizOptions');
  var quizAfter = $('#quizAfter');
  var quizNext = $('#quizNext');
  var quizProgress = $('#quizProgress');
  var quizRestart = $('#quizRestart');

  function renderQuiz() {
    if (!quizQ) return;
    quizState.locked = false;
    var q = QUIZ[quizState.i];
    quizProgress.textContent = '第 ' + (quizState.i + 1) + ' / ' + QUIZ.length + ' 题';
    quizQ.textContent = q.q;
    quizAfter.hidden = true;
    quizAfter.textContent = '';
    quizNext.hidden = true;
    quizNext.textContent = quizState.i === QUIZ.length - 1 ? '看结果' : '下一题';
    quizOpts.innerHTML = q.options.map(function (text, idx) {
      return '<button class="opt" type="button" data-idx="' + idx + '">' +
        '<span class="opt-key">' + 'ABCD'[idx] + '</span>' + esc(text) + '</button>';
    }).join('');
  }

  function onQuizAnswer(e) {
    var btn = e.target.closest ? e.target.closest('.opt') : null;
    if (!btn || quizState.locked) return;
    quizState.locked = true;
    var q = QUIZ[quizState.i];
    var picked = Number(btn.getAttribute('data-idx'));
    var right = picked === q.answer;

    $$('.opt', quizOpts).forEach(function (b, idx) {
      b.disabled = true;
      if (idx === q.answer) b.classList.add('is-right');
      else if (idx === picked) b.classList.add('is-wrong');
    });

    if (right) quizState.score++;
    quizAfter.hidden = false;
    quizAfter.textContent = (right ? '答对了。' : '差一点点。') + q.after;
    quizNext.hidden = false;
  }

  function renderQuizResult() {
    var total = QUIZ.length, score = quizState.score;
    var line;
    if (score === total) line = '全对。这些日子你一个都没忘，我也是。';
    else if (score >= total - 1) line = '几乎全对。记不住的那一天，我再讲给你听。';
    else if (score >= Math.ceil(total / 2)) line = '还不错。剩下的我们慢慢补上。';
    else line = '没关系，反正日子还长，可以一起重新记一遍。';

    quizProgress.textContent = '结果';
    quizQ.textContent = '对了 ' + score + ' / ' + total + ' 题';
    quizOpts.innerHTML = '';
    quizAfter.hidden = false;
    quizAfter.textContent = line;
    quizNext.hidden = true;
    quizRestart.textContent = '再来一次';
  }

  if (quizQ) {
    renderQuiz();
    quizOpts.addEventListener('click', onQuizAnswer);
    quizNext.addEventListener('click', function () {
      if (quizState.i >= QUIZ.length - 1) { renderQuizResult(); return; }
      quizState.i++;
      renderQuiz();
    });
    quizRestart.addEventListener('click', function () {
      quizState = { i: 0, score: 0, locked: false };
      quizRestart.textContent = '重新开始';
      renderQuiz();
    });
  }

  /* ---------------- 9. 小游戏面板切换 ---------------- */
  var tabs = $$('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-panel');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      $('#panel-puzzle').hidden = name !== 'puzzle';
      $('#panel-quiz').hidden = name !== 'quiz';
    });
  });

  /* ---------------- 10. 滚动相关 ---------------- */
  var topbar = $('#topbar');
  var bar = $('#progressBar');
  var toTop = $('#toTop');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (topbar) topbar.classList.toggle('is-scrolled', y > 24);
    if (toTop) toTop.classList.toggle('is-visible', y > 640);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* 入场动画 */
  function observeReveals(scope) {
    var nodes = $$('.reveal', scope || document);
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    nodes.forEach(function (el, idx) {
      if (!el.classList.contains('in')) {
        el.style.transitionDelay = (idx % 5) * 70 + 'ms';
        io.observe(el);
      }
    });
  }

  /* 当前章节高亮 */
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = '#' + en.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    $$('main section[id]').forEach(function (sec) { spy.observe(sec); });
  }

  /* ---------------- 启动 ---------------- */
  renderTimeline();
  renderAlbum();
  renderDates();
  observeReveals();

  var nowTheme = root.getAttribute('data-theme');
  applyTheme(nowTheme === 'film' ? 'film' : 'cream', false);
})();
