// ==========================================================
// LAYAR 2: RUN MUSIC (GAMEPLAY, DUA STRUM, FULLSCREEN & ASET FNF)
// ==========================================================
(function () {
  // Preload Aset Gambar FNF Asli
  const FNF_IMG = {
    ready: new Image(),
    set: new Image(),
    go: new Image(),
    sick: new Image(),
    good: new Image(),
    bad: new Image(),
    shit: new Image(),
    combo: new Image(),
    nums: []
  };
  FNF_IMG.ready.src = 'images/ready.png';
  FNF_IMG.set.src = 'images/set.png';
  FNF_IMG.go.src = 'images/go.png';
  FNF_IMG.sick.src = 'images/sick.png';
  FNF_IMG.good.src = 'images/good.png';
  FNF_IMG.bad.src = 'images/bad.png';
  FNF_IMG.shit.src = 'images/shit.png';
  FNF_IMG.combo.src = 'images/combo.png';
  for (let i = 0; i <= 9; i++) {
    const num = new Image();
    num.src = `images/num${i}.png`;
    FNF_IMG.nums.push(num);
  }

  const isAutoplay = new URLSearchParams(window.location.search).get('autoplay') === '1';
  let gameRunning = false;
  let isPlaying = false;
  let isPaused = false;
  let isCountingDown = false;
  let animFrameId = null;
  let countdownTimer = null;

  let musicSource = null;
  let vocalSource = null;
  let masterGain = null;
  let vocalGain = null;
  let audioStartTime = 0;

  let playerNotes = [];
  let opponentNotes = [];
  let noteStartIndex = 0;
  let oppNoteStartIndex = 0;
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let health = 50;
  let counts = { sick: 0, good: 0, bad: 0, shit: 0, miss: 0 };
  let totalWeight = 0;

  const LANE_KEYS_DOWN = [false, false, false, false];
  const PLAYER_CONFIRM_TIMERS = [0, 0, 0, 0];
  const OPP_CONFIRM_TIMERS = [0, 0, 0, 0];

  let curAssets = null;
  let curMusicDuration = 0;
  let songPosition = 0;
  let lastFrameTime = 0;
  let countdownStartTime = 0;
  let countdownDuration = 0;
  let countdownStepMs = 500;
  let currentCountdownStep = -1;

  const G_DIR = ['left', 'down', 'up', 'right'];
  const G_DIR_UPPER = ['LEFT', 'DOWN', 'UP', 'RIGHT'];
  const G_COL4 = ['purple', 'blue', 'green', 'red'];
  const G_OPP_LANE_X = [140, 250, 360, 470]; // Jalur Lawan (Kiri - Landscape)
  const G_PLAYER_LANE_X = [810, 920, 1030, 1140]; // Jalur Pemain (Kanan - Landscape)
  const G_MIDDLE_LANE_X = [475, 585, 695, 805]; // Jalur Tengah (Middle Scroll - Landscape)
  const G_PORTRAIT_LANE_X = [135, 285, 435, 585]; // 4 Jalur Lebar di Layar HP Tegak (720x1280)
  const G_RY_LANDSCAPE = 560; // Tinggi receptor di Landscape
  const G_RY_PORTRAIT = 1080; // Tinggi receptor di Portrait (dekat jempol bawah)

  let curPlaySide = 'player';
  let isMiddleScroll = false;
  let isPortrait = false;
  let showOpponentLanes = true;
  let userLaneX = G_PLAYER_LANE_X;
  let cpuLaneX = G_OPP_LANE_X;
  let curRY = G_RY_LANDSCAPE;
  let curScale = 0.7;
  let curCanvasW = 1280;
  let curCanvasH = 720;

  const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

  function resizeGameCanvas() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Deteksi Orientasi Layar (Tegak/Portrait vs Mendatar/Landscape)
    isPortrait = window.innerWidth < window.innerHeight;

    if (isPortrait) {
      curCanvasW = 720;
      curCanvasH = 1280;
      canvas.width = 720 * dpr;
      canvas.height = 1280 * dpr;
      curRY = G_RY_PORTRAIT;
      curScale = 0.85;
      userLaneX = G_PORTRAIT_LANE_X;
      showOpponentLanes = false;
      $('#rating-popup').css('top', '42%');
      $('#label-scroll-mode').text('Tegak (1 Jalur)');
      $('#btn-toggle-scroll').attr('title', 'Sedang Mode Layar Tegak (Portrait)');
      $('#touch-controls').removeClass('right-4 sm:right-8 left-4 sm:left-8').addClass('left-1/2 -translate-x-1/2');
    } else {
      curCanvasW = 1280;
      curCanvasH = 720;
      canvas.width = 1280 * dpr;
      canvas.height = 720 * dpr;
      curRY = G_RY_LANDSCAPE;
      curScale = 0.7;
      $('#rating-popup').css('top', '30%');
      updateScrollModeUI();
    }
  }
  $(window).on('resize orientationchange', resizeGameCanvas);

  function drawGameSprite(g, img, n, cx, cy, s) {
    const f = window.A[n]; if (!f) return;
    const [x, y, w, h, fx = 0, fy = 0, fw = w, fh = h] = f;
    g.drawImage(img, x, y, w, h, cx - fw * s / 2 - fx * s, cy - fh * s / 2 - fy * s, w * s, h * s);
  }

  function drawGameHold(g, img, x, top, bot, color, hs) {
    if (bot <= top) return;
    const p = window.A[color + ' hold piece'];
    const e = window.A[color + ' end'];
    if (!p || !e) return;
    const eh = e[3] * hs;
    const hw = p[2] * hs;
    const ew = e[2] * hs;

    if (bot - top - eh > 0) {
      g.drawImage(img, p[0], p[1], p[2], p[3], x - hw / 2, top + eh, hw, bot - top - eh);
    }
    const curH = Math.min(eh, Math.max(0, bot - top));
    if (curH > 0) {
      g.save();
      g.translate(x, top + curH);
      g.scale(1, -1);
      g.drawImage(img, e[0], e[1], e[2], e[3], -ew / 2, 0, ew, curH);
      g.restore();
    }
  }

  function buildNotes(chart, playSide = 'player') {
    const pList = [];
    const oList = [];
    const isOpponentMode = playSide === 'opponent' || playSide === 'opponent_swap';

    if (chart.isVSlice && Array.isArray(chart.rawVSliceNotes)) {
      chart.rawVSliceNotes.forEach(n => {
        const rawLane = n.d;
        // In V-Slice: d < 4 is Boyfriend (Pemain), d >= 4 is Opponent (Lawan)
        const isPlayer = isOpponentMode ? (rawLane >= 4) : (rawLane < 4);
        const lane = rawLane % 4;
        const noteObj = {
          t: n.t,
          lane: lane,
          len: Math.max(0, n.l || 0),
          hit: false,
          missed: false,
          holding: false,
          holdDone: false
        };
        if (isPlayer) pList.push(noteObj);
        else oList.push(noteObj);
      });
    } else {
      (chart.notes || []).forEach(sec => {
        const must = !!sec.mustHitSection;
        (sec.sectionNotes || []).forEach(x => {
          if (x.length > 3 && typeof x[3] === 'string' && x[3].trim() !== '') return;
          const rawLane = x[1];
          let isPlayer = must ? (rawLane >= 0 && rawLane <= 3) : (rawLane >= 4 && rawLane <= 7);
          if (isOpponentMode) isPlayer = !isPlayer;
          const lane = rawLane % 4;
          const noteObj = {
            t: x[0],
            lane: lane,
            len: Math.max(0, x[2] || 0),
            hit: false,
            missed: false,
            holding: false,
            holdDone: false
          };
          if (isPlayer) pList.push(noteObj);
          else oList.push(noteObj);
        });
      });
    }
    pList.sort((a, b) => a.t - b.t);
    oList.sort((a, b) => a.t - b.t);
    return { pList, oList };
  }

  function updateScrollModeUI() {
    if (isPortrait) {
      userLaneX = G_PORTRAIT_LANE_X;
      showOpponentLanes = false;
      $('#label-scroll-mode').text('Tegak (1 Jalur)');
      $('#btn-toggle-scroll').attr('title', 'Sedang Mode Layar Tegak (Portrait)');
      $('#touch-controls').removeClass('right-4 sm:right-8 left-4 sm:left-8').addClass('left-1/2 -translate-x-1/2');
      return;
    }
    if (isMiddleScroll) {
      userLaneX = G_MIDDLE_LANE_X;
      showOpponentLanes = false;
      $('#label-scroll-mode').text('1 Jalur');
      $('#btn-toggle-scroll').attr('title', 'Sedang 1 Jalur (Tengah). Klik untuk 2 Jalur.');
      $('#touch-controls').removeClass('right-4 sm:right-8 left-4 sm:left-8').addClass('left-1/2 -translate-x-1/2');
    } else {
      showOpponentLanes = true;
      const isOpponentLeft = curPlaySide === 'opponent';
      userLaneX = isOpponentLeft ? G_OPP_LANE_X : G_PLAYER_LANE_X;
      cpuLaneX = isOpponentLeft ? G_PLAYER_LANE_X : G_OPP_LANE_X;
      $('#label-scroll-mode').text('2 Jalur');
      $('#btn-toggle-scroll').attr('title', 'Sedang 2 Jalur. Klik untuk 1 Jalur.');
      if (isOpponentLeft) {
        $('#touch-controls').removeClass('right-4 sm:right-8 left-1/2 -translate-x-1/2').addClass('left-4 sm:left-8');
      } else {
        $('#touch-controls').removeClass('left-4 sm:left-8 left-1/2 -translate-x-1/2').addClass('right-4 sm:right-8');
      }
    }
  }

  function stopGame() {
    gameRunning = false;
    isPlaying = false;
    isPaused = false;
    isCountingDown = false;
    currentCountdownStep = -1;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (musicSource) {
      try { musicSource.onended = null; musicSource.stop(); } catch (e) {}
      musicSource = null;
    }
    if (vocalSource) {
      try { vocalSource.onended = null; vocalSource.stop(); } catch (e) {}
      vocalSource = null;
    }
    if (curAssets && curAssets.ctx && curAssets.ctx.state === 'suspended') {
      try { curAssets.ctx.resume(); } catch (e) {}
    }
    if (typeof activeTouchPointers !== 'undefined') {
      activeTouchPointers.clear();
    }
    LANE_KEYS_DOWN.fill(false);
    PLAYER_CONFIRM_TIMERS.fill(0);
    OPP_CONFIRM_TIMERS.fill(0);
    $('#pause-modal').addClass('hidden');
    $('#countdown-overlay').addClass('hidden').empty();
    $('#rating-popup').empty();
  }
  window.stopGame = stopGame;

  function getRank(acc) {
    if (acc >= 95) return 'S';
    if (acc >= 90) return 'A';
    if (acc >= 80) return 'B';
    if (acc >= 70) return 'C';
    return 'D';
  }

  function buildGameResult(completed) {
    const totalEvaluated = counts.sick + counts.good + counts.bad + counts.shit + counts.miss;
    const acc = totalEvaluated > 0 ? (totalWeight / totalEvaluated) * 100 : 100;
    const roleLabel = curPlaySide === 'opponent' ? 'Lawan (Kiri)' : curPlaySide === 'opponent_swap' ? 'Lawan (Kanan)' : 'Pemain (Kanan)';
    return {
      title: curAssets.chart.song || curAssets.chart.title || 'Lagu',
      score: score,
      accuracy: +(acc.toFixed(2)),
      maxCombo: maxCombo,
      counts: { ...counts },
      rank: getRank(acc),
      completed: completed,
      role: roleLabel
    };
  }

  function handleGameOver() {
    if (!gameRunning) return;
    const res = buildGameResult(false);
    stopGame();
    if (typeof window.showResult === 'function') {
      window.showResult(res);
    }
  }

  function handleSongComplete() {
    if (!gameRunning) return;
    const res = buildGameResult(true);
    stopGame();
    if (typeof window.showResult === 'function') {
      window.showResult(res);
    }
  }

  // Tampilkan Gambar Penilaian & Angka Combo Asli FNF
  function showRatingPopup(rating, curCombo) {
    const $pop = $('#rating-popup');
    $pop.empty();

    const imgMap = {
      'SICK': 'sick',
      'GOOD': 'good',
      'BAD': 'bad',
      'SHIT': 'shit',
      'MISS': 'shit'
    };

    const $wrap = $('<div class="flex flex-col items-center fnf-pop"></div>');

    const key = imgMap[rating] || 'shit';
    const $rImg = $(`<img src="images/${key}.png" alt="${rating}" class="h-12 sm:h-16 w-auto drop-shadow-md select-none pointer-events-none">`);
    $wrap.append($rImg);

    if (curCombo > 5) {
      const $comboRow = $('<div class="flex items-center gap-1 mt-1"></div>');
      $comboRow.append('<img src="images/combo.png" alt="combo" class="h-7 sm:h-8 w-auto mr-1">');
      const digits = String(curCombo).split('');
      digits.forEach(d => {
        $comboRow.append(`<img src="images/num${d}.png" alt="${d}" class="h-7 sm:h-8 w-auto">`);
      });
      $wrap.append($comboRow);
    }

    $pop.append($wrap);
  }

  // Update HUD & Ikon Karakter di Health Bar Atas
  function updateHUD() {
    const totalEvaluated = counts.sick + counts.good + counts.bad + counts.shit + counts.miss;
    const acc = totalEvaluated > 0 ? (totalWeight / totalEvaluated) * 100 : 100;
    const rank = getRank(acc);

    $('#hud-score').text(score.toLocaleString('id-ID'));
    $('#hud-combo').text(combo);
    $('#hud-acc').text(acc.toFixed(2) + '%');
    $('#hud-rank').text(rank);

    const hpPct = Math.min(100, Math.max(0, health));
    $('#health-bar').css('width', hpPct + '%');

    // Posisi Ikon Wajah Karakter di Titik Temu Pembagi Bar
    // Health 100% = pemain menang penuh (pembatas di 0% / kiri).
    // Health 50% = tengah (50%).
    // Health 0% = pemain kalah (pembatas di 100% / kanan).
    const dividerPct = 100 - hpPct;
    $('#icon-head-container').css('left', `${dividerPct}%`);

    // Ganti Frame Wajah Karakter (Normal vs Panik/Kalah)
    const isUserOpponent = curPlaySide === 'opponent' || curPlaySide === 'opponent_swap';
    if (isUserOpponent) {
      // User adalah Lawan: jika darah user tinggi (>80%), CPU (Pemain) panik
      if (hpPct > 80) {
        $('#icon-play-frame').css('transform', 'translateX(-50%)');
      } else {
        $('#icon-play-frame').css('transform', 'translateX(0%)');
      }
      // Jika darah user sekarat (<20%), User (Lawan) panik
      if (hpPct < 20) {
        $('#icon-opp-frame').css('transform', 'translateX(-50%)');
      } else {
        $('#icon-opp-frame').css('transform', 'translateX(0%)');
      }
    } else {
      // User adalah Pemain: Kasumi (Lawan) panik jika health pemain > 80%
      if (hpPct > 80) {
        $('#icon-opp-frame').css('transform', 'translateX(-50%)');
      } else {
        $('#icon-opp-frame').css('transform', 'translateX(0%)');
      }
      // Ichika (Pemain) panik jika health pemain < 20%
      if (hpPct < 20) {
        $('#icon-play-frame').css('transform', 'translateX(-50%)');
      } else {
        $('#icon-play-frame').css('transform', 'translateX(0%)');
      }
    }

    const curSec = Math.max(0, songPosition / 1000);
    const durSec = curMusicDuration || 0;
    $('#hud-time').text(fmt(curSec));
    if (durSec > 0) {
      $('#hud-duration').text(fmt(durSec));
      const prog = Math.min(100, Math.max(0, (curSec / durSec) * 100));
      $('#hud-progress-bar').css('width', prog + '%');
    }
  }

  function judgeHit(lane, note, diff) {
    note.hit = true;
    PLAYER_CONFIRM_TIMERS[lane] = 180;
    if (note.len > 0) {
      note.holding = true;
    }

    let rating = 'shit';
    let pts = 50;
    let hpDelta = -1;
    let weight = 0.25;

    if (diff <= 45) {
      rating = 'sick'; pts = 350; hpDelta = 2.0; weight = 1.0;
    } else if (diff <= 90) {
      rating = 'good'; pts = 200; hpDelta = 1.0; weight = 0.75;
    } else if (diff <= 135) {
      rating = 'bad'; pts = 100; hpDelta = 0; weight = 0.50;
    }

    counts[rating]++;
    score += pts;
    totalWeight += weight;
    health = Math.min(100, Math.max(0, health + hpDelta));
    combo++;
    maxCombo = Math.max(maxCombo, combo);

    if (vocalGain && curAssets && curAssets.ctx) {
      vocalGain.gain.setValueAtTime(1, curAssets.ctx.currentTime);
    }
    showRatingPopup(rating.toUpperCase(), combo);
    updateHUD();

    if (health <= 0) {
      handleGameOver();
    }
  }

  function judgeMiss(note) {
    note.missed = true;
    if (note.len > 0) note.holdDone = true;
    counts.miss++;
    combo = 0;
    health = Math.max(0, health - 5.0);
    showRatingPopup('SHIT', 0);
    if (vocalGain && curAssets && curAssets.ctx) {
      vocalGain.gain.setValueAtTime(0, curAssets.ctx.currentTime);
    }
    updateHUD();
    if (health <= 0) {
      handleGameOver();
    }
  }

  function handleLaneDown(lane) {
    if (!gameRunning || isPaused) return;
    LANE_KEYS_DOWN[lane] = true;

    let target = null;
    let minDiff = Infinity;
    for (let i = 0; i < playerNotes.length; i++) {
      const n = playerNotes[i];
      if (n.lane !== lane || n.hit || n.missed) continue;
      const diff = Math.abs(n.t - songPosition);
      if (diff <= 166 && diff < minDiff) {
        minDiff = diff;
        target = n;
      }
      if (n.t - songPosition > 166) break;
    }

    if (target) {
      judgeHit(lane, target, minDiff);
    }
  }

  function handleLaneUp(lane) {
    LANE_KEYS_DOWN[lane] = false;
    if (!gameRunning || isPaused) return;

    for (let i = 0; i < playerNotes.length; i++) {
      const n = playerNotes[i];
      if (n.lane === lane && n.hit && n.holding && !n.holdDone) {
        if (songPosition < n.t + n.len - 100) {
          n.holding = false;
          n.holdDone = true;
          n.missed = true;
          counts.miss++;
          combo = 0;
          health = Math.max(0, health - 5.0);
          showRatingPopup('SHIT', 0);
          if (vocalGain && curAssets && curAssets.ctx) {
            vocalGain.gain.setValueAtTime(0, curAssets.ctx.currentTime);
          }
          updateHUD();
          if (health <= 0) {
            handleGameOver();
          }
        } else {
          n.holding = false;
          n.holdDone = true;
        }
      }
    }
  }

  function startAudioSources() {
    const ctx = curAssets.ctx;
    ctx.resume();

    masterGain = ctx.createGain();
    masterGain.gain.value = ((curAssets.settings && curAssets.settings.volume) ?? 80) / 100;
    masterGain.connect(ctx.destination);

    musicSource = ctx.createBufferSource();
    musicSource.buffer = curAssets.music;
    musicSource.connect(masterGain);

    if (curAssets.vocal) {
      vocalGain = ctx.createGain();
      vocalGain.gain.value = 1;
      vocalGain.connect(masterGain);

      vocalSource = ctx.createBufferSource();
      vocalSource.buffer = curAssets.vocal;
      vocalSource.connect(vocalGain);
    }

    const t0 = ctx.currentTime + 0.02;
    musicSource.start(t0);
    if (vocalSource) vocalSource.start(t0);
    audioStartTime = t0;
    isPlaying = true;

    musicSource.onended = () => {
      if (isPlaying && !isPaused && gameRunning) {
        handleSongComplete();
      }
    };
  }

  function toggleGamePause() {
    if (!gameRunning || isCountingDown) return;
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }

  function pauseGame() {
    if (!isPlaying || isPaused) return;
    isPaused = true;
    if (curAssets && curAssets.ctx) {
      curAssets.ctx.suspend();
    }
    $('#pause-modal').removeClass('hidden');
  }

  function resumeGame() {
    if (!isPaused) return;
    $('#pause-modal').addClass('hidden');

    const steps = ['ready', 'set', 'go'];
    let idx = 0;
    const $cnt = $('#countdown-overlay').removeClass('hidden').empty();
    $cnt.html(`<img src="images/${steps[0]}.png" alt="${steps[0]}" class="h-24 sm:h-36 w-auto fnf-pop">`);

    const intv = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        $cnt.html(`<img src="images/${steps[idx]}.png" alt="${steps[idx]}" class="h-24 sm:h-36 w-auto fnf-pop">`);
      } else {
        clearInterval(intv);
        $cnt.addClass('hidden').empty();
        if (curAssets && curAssets.ctx) {
          curAssets.ctx.resume().then(() => {
            isPaused = false;
          });
        } else {
          isPaused = false;
        }
      }
    }, 400);
  }

  function gameLoop(now) {
    if (!gameRunning) return;
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000 || 0);
    lastFrameTime = now;

    if (isPlaying && !isPaused) {
      songPosition = (curAssets.ctx.currentTime - audioStartTime) * 1000 + (curAssets.settings.offset || 0);
    } else if (isCountingDown && !isPlaying) {
      const elapsed = now - countdownStartTime;
      songPosition = (elapsed - countdownDuration) + (curAssets.settings.offset || 0);
      const stepIdx = Math.floor(elapsed / countdownStepMs);
      if (stepIdx !== currentCountdownStep) {
        currentCountdownStep = stepIdx;
        const $cnt = $('#countdown-overlay');
        if (stepIdx === 0) {
          $cnt.removeClass('hidden').html('<div class="text-6xl sm:text-8xl font-black text-white fnf-pop">3</div>');
        } else if (stepIdx === 1) {
          $cnt.removeClass('hidden').html('<img src="images/ready.png" alt="Ready" class="h-28 sm:h-40 w-auto fnf-pop">');
        } else if (stepIdx === 2) {
          $cnt.removeClass('hidden').html('<img src="images/set.png" alt="Set" class="h-28 sm:h-40 w-auto fnf-pop">');
        } else if (stepIdx === 3) {
          $cnt.removeClass('hidden').html('<img src="images/go.png" alt="Go" class="h-32 sm:h-44 w-auto fnf-pop">');
        } else if (stepIdx >= 4) {
          $cnt.addClass('hidden').empty();
          isCountingDown = false;
          startAudioSources();
        }
      }
    }

    // Auto-play Note Lawan & Sedikit Kuras Health
    if (isPlaying && !isPaused) {
      while (oppNoteStartIndex < opponentNotes.length) {
        const n = opponentNotes[oppNoteStartIndex];
        const tailTime = n.t + (n.len || 0);
        if (n.hit && (songPosition - tailTime > 500)) {
          oppNoteStartIndex++;
        } else {
          break;
        }
      }

      for (let i = oppNoteStartIndex; i < opponentNotes.length; i++) {
        const n = opponentNotes[i];
        if (!n.hit && songPosition >= n.t) {
          n.hit = true;
          OPP_CONFIRM_TIMERS[n.lane] = 180;
          if (n.len > 0) n.holding = true;
          health = Math.max(1, health - 0.25);
        }
        if (n.hit && n.holding && !n.holdDone) {
          if (songPosition < n.t + n.len) {
            OPP_CONFIRM_TIMERS[n.lane] = 140;
            health = Math.max(1, health - 0.4 * dt);
          } else {
            n.holding = false;
            n.holdDone = true;
          }
        }
        if (n.t - songPosition > 166) break;
      }
    }

    // Autoplay Pemain jika diaktifkan (?autoplay=1)
    if (isAutoplay && isPlaying && !isPaused) {
      for (let i = 0; i < playerNotes.length; i++) {
        const n = playerNotes[i];
        if (!n.hit && !n.missed && songPosition >= n.t) {
          LANE_KEYS_DOWN[n.lane] = true;
          judgeHit(n.lane, n, 0);
        }
        if (n.t - songPosition > 166) break;
      }
      for (let i = 0; i < playerNotes.length; i++) {
        const n = playerNotes[i];
        if (n.hit && n.holding && !n.holdDone && songPosition >= n.t + n.len) {
          LANE_KEYS_DOWN[n.lane] = false;
          n.holding = false;
          n.holdDone = true;
        }
      }
    }

    // Cek Miss Pemain
    if (isPlaying && !isPaused) {
      for (let i = 0; i < playerNotes.length; i++) {
        const n = playerNotes[i];
        if (n.hit || n.missed) continue;
        if (songPosition - n.t > 166) {
          judgeMiss(n);
        }
        if (n.t - songPosition > 166) break;
      }

      // Tahan Hold Note Pemain
      for (let i = 0; i < playerNotes.length; i++) {
        const n = playerNotes[i];
        if (n.hit && n.holding && !n.holdDone) {
          if (LANE_KEYS_DOWN[n.lane]) {
            PLAYER_CONFIRM_TIMERS[n.lane] = 140;
            health = Math.min(100, health + 4.0 * dt);
            score += Math.round(50 * dt);
            if (songPosition >= n.t + n.len) {
              n.holding = false;
              n.holdDone = true;
            }
          }
        }
      }
    }

    // Animasi Confirm Timers
    for (let l = 0; l < 4; l++) {
      if (PLAYER_CONFIRM_TIMERS[l] > 0) {
        PLAYER_CONFIRM_TIMERS[l] = Math.max(0, PLAYER_CONFIRM_TIMERS[l] - dt * 1000);
      }
      if (OPP_CONFIRM_TIMERS[l] > 0) {
        OPP_CONFIRM_TIMERS[l] = Math.max(0, OPP_CONFIRM_TIMERS[l] - dt * 1000);
      }
    }

    // Render Canvas
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      const g = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      g.save();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, curCanvasW, curCanvasH);

      // Feedback Sentuhan Kolom Layar (Direct Touch Zones)
      const zoneGlowColors = [
        'rgba(168, 85, 247, 0.12)', // Ungu (Kiri)
        'rgba(59, 130, 246, 0.12)',  // Biru (Bawah)
        'rgba(34, 197, 94, 0.12)',   // Hijau (Atas)
        'rgba(239, 68, 68, 0.12)'    // Merah (Kanan)
      ];
      for (let l = 0; l < 4; l++) {
        if (LANE_KEYS_DOWN[l]) {
          const colW = curCanvasW / 4;
          g.fillStyle = zoneGlowColors[l];
          g.fillRect(l * colW, 0, colW, curCanvasH);
        }
      }

      // Garis bantu pemisah zona sentuh halus di layar mobile
      if (isPortrait || isMiddleScroll) {
        const colW = curCanvasW / 4;
        g.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(colW * 1, 0); g.lineTo(colW * 1, curCanvasH);
        g.moveTo(colW * 2, 0); g.lineTo(colW * 2, curCanvasH);
        g.moveTo(colW * 3, 0); g.lineTo(colW * 3, curCanvasH);
        g.stroke();
      }

      // Kalibrasi kecepatan note agar waktu tempuh note sama persis di Landscape dan Portrait
      const distFactor = isPortrait ? (1080 / 560) : 1;
      const pxPerMs = 0.45 * (curAssets.settings.speed || 2) * distFactor;
      const spriteImg = curAssets.sprite;

      // 1. Hold Notes CPU (Hanya tampil jika 2 Jalur / Dual Lane aktif)
      if (showOpponentLanes) {
        for (let i = oppNoteStartIndex; i < opponentNotes.length; i++) {
          const n = opponentNotes[i];
          if (n.len <= 0 || n.holdDone) continue;
          let headY = curRY - (n.t - songPosition) * pxPerMs;
          let tailY = headY - n.len * pxPerMs;
          if (n.holding) {
            headY = curRY;
            tailY = curRY - (n.t + n.len - songPosition) * pxPerMs;
          }
          headY = Math.min(curRY, headY);
          tailY = Math.min(headY, tailY);
          if (tailY >= headY) continue;
          if (tailY > curCanvasH + 50) continue;
          if (headY < -150) break;
          drawGameHold(g, spriteImg, cpuLaneX[n.lane], tailY, headY, G_COL4[n.lane], curScale);
        }
      }

      // 2. Hold Notes Pemain / User
      for (let i = noteStartIndex; i < playerNotes.length; i++) {
        const n = playerNotes[i];
        if (n.len <= 0 || n.holdDone || n.missed) continue;

        let headY = curRY - (n.t - songPosition) * pxPerMs;
        let tailY = headY - n.len * pxPerMs;
        if (n.holding) {
          headY = curRY;
          tailY = curRY - (n.t + n.len - songPosition) * pxPerMs;
        }
        headY = Math.min(curRY, headY);
        tailY = Math.min(headY, tailY);
        if (tailY >= headY) continue;
        if (tailY > curCanvasH + 50) continue;
        if (headY < -150) break;
        drawGameHold(g, spriteImg, userLaneX[n.lane], tailY, headY, G_COL4[n.lane], curScale);
      }

      // 3. Receptors CPU (Hanya tampil jika 2 Jalur / Dual Lane aktif)
      if (showOpponentLanes) {
        for (let l = 0; l < 4; l++) {
          const x = cpuLaneX[l];
          if (OPP_CONFIRM_TIMERS[l] > 0) {
            const frame = Math.min(3, Math.floor((180 - OPP_CONFIRM_TIMERS[l]) / 45));
            drawGameSprite(g, spriteImg, `${G_DIR[l]} confirm${frame}`, x, curRY, curScale);
          } else {
            drawGameSprite(g, spriteImg, `arrow${G_DIR_UPPER[l]}`, x, curRY, curScale);
          }
        }
      }

      // 4. Receptors Pemain / User
      for (let l = 0; l < 4; l++) {
        const x = userLaneX[l];
        if (PLAYER_CONFIRM_TIMERS[l] > 0) {
          const frame = Math.min(3, Math.floor((180 - PLAYER_CONFIRM_TIMERS[l]) / 45));
          drawGameSprite(g, spriteImg, `${G_DIR[l]} confirm${frame}`, x, curRY, curScale);
        } else if (LANE_KEYS_DOWN[l]) {
          drawGameSprite(g, spriteImg, `${G_DIR[l]} press0`, x, curRY, curScale);
        } else {
          drawGameSprite(g, spriteImg, `arrow${G_DIR_UPPER[l]}`, x, curRY, curScale);
        }
      }

      // 5. Label Tombol Pemain / User
      g.fillStyle = 'rgba(255, 255, 255, 0.75)';
      g.font = isPortrait ? '700 18px Rubik, sans-serif' : '700 15px Rubik, sans-serif';
      g.textAlign = 'center';
      for (let l = 0; l < 4; l++) {
        const label = (curAssets.settings.keys && curAssets.settings.keys[l] && curAssets.settings.keys[l].l) || ['D','F','J','K'][l];
        g.fillText(label, userLaneX[l], curRY + (isPortrait ? 65 : 58));
      }

      // 6. Note Heads CPU (Hanya tampil jika 2 Jalur / Dual Lane aktif)
      if (showOpponentLanes) {
        for (let i = oppNoteStartIndex; i < opponentNotes.length; i++) {
          const n = opponentNotes[i];
          if (n.hit) continue;
          const y = curRY - (n.t - songPosition) * pxPerMs;
          if (y > curCanvasH + 50) continue;
          if (y < -120) break;
          drawGameSprite(g, spriteImg, G_COL4[n.lane], cpuLaneX[n.lane], y, curScale);
        }
      }

      // 7. Note Heads Pemain / User
      for (let i = noteStartIndex; i < playerNotes.length; i++) {
        const n = playerNotes[i];
        if (n.hit || n.missed) continue;
        const y = curRY - (n.t - songPosition) * pxPerMs;
        if (y > curCanvasH + 50) continue;
        if (y < -120) break;
        drawGameSprite(g, spriteImg, G_COL4[n.lane], userLaneX[n.lane], y, curScale);
      }

      while (noteStartIndex < playerNotes.length) {
        const n = playerNotes[noteStartIndex];
        const tailTime = n.t + (n.len || 0);
        if ((n.hit || n.missed) && (songPosition - tailTime > 500)) {
          noteStartIndex++;
        } else {
          break;
        }
      }

      g.restore();
    }

    updateHUD();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  window.startGame = function (GameAssets) {
    stopGame();
    curAssets = GameAssets;
    curMusicDuration = (GameAssets.music && GameAssets.music.duration) || 0;

    curPlaySide = GameAssets.playSide || (GameAssets.chart && GameAssets.chart.playSide) || 'player';
    
    // Tentukan mode tampilan jalur (Otomatis: 1 Jalur di HP, 2 Jalur di PC)
    const lanePref = (GameAssets.settings && GameAssets.settings.laneMode) || 'auto';
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth < 1024);
    if (lanePref === 'middle') {
      isMiddleScroll = true;
    } else if (lanePref === 'dual') {
      isMiddleScroll = false;
    } else {
      isMiddleScroll = isMobile;
    }
    updateScrollModeUI();

    const allNotes = buildNotes(GameAssets.chart, curPlaySide);
    playerNotes = allNotes.pList;
    opponentNotes = allNotes.oList;
    noteStartIndex = 0;
    oppNoteStartIndex = 0;

    score = 0;
    combo = 0;
    maxCombo = 0;
    health = 50;
    counts = { sick: 0, good: 0, bad: 0, shit: 0, miss: 0 };
    totalWeight = 0;
    LANE_KEYS_DOWN.fill(false);
    PLAYER_CONFIRM_TIMERS.fill(0);
    OPP_CONFIRM_TIMERS.fill(0);

    $('#hud-title').text(GameAssets.chart.song || GameAssets.chart.title || 'Lagu');
    $('#hud-autoplay-badge').toggle(isAutoplay);

    // Badge Sisi Karakter (Pemain / Lawan)
    const $roleBadge = $('#hud-role-badge');
    if (curPlaySide === 'opponent') {
      $roleBadge.removeClass('hidden bg-amber-500 text-black').addClass('bg-red-500 text-white').text('LAWAN (KIRI)');
    } else if (curPlaySide === 'opponent_swap') {
      $roleBadge.removeClass('hidden bg-red-500 text-white').addClass('bg-amber-500 text-black').text('LAWAN (KANAN)');
    } else {
      $roleBadge.addClass('hidden');
    }

    // Atur posisi tombol sentuh dan tampilan jalur
    updateScrollModeUI();

    // Setup Gambar Ikon Karakter di Health Bar
    if (GameAssets.characters) {
      if (GameAssets.characters.opponent && GameAssets.characters.opponent.src) {
        $('#icon-opp-frame').attr('src', GameAssets.characters.opponent.src);
      }
      if (GameAssets.characters.player && GameAssets.characters.player.src) {
        $('#icon-play-frame').attr('src', GameAssets.characters.player.src);
      }
    }

    $('.touch-btn').each(function () {
      const l = +$(this).data('lane');
      if (GameAssets.settings.keys && GameAssets.settings.keys[l]) {
        $(this).text(GameAssets.settings.keys[l].l);
      }
    });

    updateHUD();
    if (typeof window.showScreen === 'function') {
      window.showScreen('game');
    }
    resizeGameCanvas();

    const bpm = GameAssets.chart.bpm || (GameAssets.chart.notes && GameAssets.chart.notes[0] && GameAssets.chart.notes[0].bpm) || 100;
    countdownStepMs = Math.max(200, 60000 / bpm);
    countdownDuration = 4 * countdownStepMs;
    countdownStartTime = performance.now();
    currentCountdownStep = -1;
    isCountingDown = true;
    gameRunning = true;
    lastFrameTime = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  };

  // Event Listeners Layar 2
  $('#btn-pause').on('click', toggleGamePause);
  $('#btn-resume').on('click', resumeGame);
  $('#btn-restart').on('click', () => {
    if (curAssets) window.startGame(curAssets);
  });
  $('#btn-back-assets').on('click', () => {
    if (typeof window.showAssets === 'function') window.showAssets();
  });
  $('#btn-toggle-scroll').on('click', () => {
    isMiddleScroll = !isMiddleScroll;
    updateScrollModeUI();
  });
  $('#btn-toggle-touch').on('click', () => {
    $('#touch-controls').toggleClass('hidden');
  });
  $('#btn-fullscreen').on('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  $(document).on('keydown', e => {
    if (!$('#screen-game').is(':visible') || $('#screen-game').hasClass('is-hidden')) return;
    if (e.code === 'Escape') {
      e.preventDefault();
      toggleGamePause();
      return;
    }
    if (!gameRunning || isPaused || e.repeat) return;
    if (curAssets && curAssets.settings && curAssets.settings.keys) {
      const l = curAssets.settings.keys.findIndex(k => k.c === e.code);
      if (l > -1) {
        e.preventDefault();
        handleLaneDown(l);
      }
    }
  }).on('keyup', e => {
    if (!$('#screen-game').is(':visible') || $('#screen-game').hasClass('is-hidden')) return;
    if (curAssets && curAssets.settings && curAssets.settings.keys) {
      const l = curAssets.settings.keys.findIndex(k => k.c === e.code);
      if (l > -1) {
        handleLaneUp(l);
      }
    }
  });

  // Kontrol Sentuh Langsung di Layar (4 Kolom Multi-Touch Canvas)
  const activeTouchPointers = new Map();

  function getLaneFromPointer(e) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    if (e.clientY < rect.top + (isPortrait ? 85 : 70)) return -1;
    const relX = e.clientX - rect.left;
    if (relX < 0 || relX > rect.width) return -1;
    const ratio = relX / rect.width;
    if (ratio < 0.25) return 0;
    if (ratio < 0.50) return 1;
    if (ratio < 0.75) return 2;
    return 3;
  }

  $('#game-stage')
    .on('pointerdown', function (e) {
      if (!gameRunning || isPaused) return;
      if (e.target.closest('button') || e.target.closest('#pause-modal') || e.target.closest('.touch-btn')) return;
      const lane = getLaneFromPointer(e);
      if (lane !== -1) {
        e.preventDefault();
        try { this.setPointerCapture(e.pointerId); } catch (_) {}
        activeTouchPointers.set(e.pointerId, lane);
        handleLaneDown(lane);
      }
    })
    .on('pointermove', function (e) {
      if (!gameRunning || isPaused) return;
      if (!activeTouchPointers.has(e.pointerId)) return;
      const prevLane = activeTouchPointers.get(e.pointerId);
      const newLane = getLaneFromPointer(e);
      if (newLane !== prevLane) {
        if (prevLane !== -1 && prevLane !== undefined) {
          handleLaneUp(prevLane);
        }
        if (newLane !== -1) {
          activeTouchPointers.set(e.pointerId, newLane);
          handleLaneDown(newLane);
        } else {
          activeTouchPointers.delete(e.pointerId);
        }
      }
    })
    .on('pointerup pointercancel', function (e) {
      if (activeTouchPointers.has(e.pointerId)) {
        const lane = activeTouchPointers.get(e.pointerId);
        activeTouchPointers.delete(e.pointerId);
        try { this.releasePointerCapture(e.pointerId); } catch (_) {}
        if (lane !== -1 && lane !== undefined) {
          handleLaneUp(lane);
        }
      }
    });

  $(document).on('pointerdown', '.touch-btn', function (e) {
    e.preventDefault();
    try { this.setPointerCapture(e.pointerId); } catch (_) {}
    const l = +$(this).data('lane');
    handleLaneDown(l);
  }).on('pointerup pointercancel pointerleave', '.touch-btn', function (e) {
    e.preventDefault();
    try { this.releasePointerCapture(e.pointerId); } catch (_) {}
    const l = +$(this).data('lane');
    handleLaneUp(l);
  });
})();
