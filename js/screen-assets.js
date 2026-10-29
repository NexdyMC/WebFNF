// ==========================================================
// LAYAR 1: ASSETS GAME & CONFIGURATION (3 KOLOM & KARAKTER)
// ==========================================================
$(function () {
  const SL = {
    chart: { t: 'Chart', h: 'File .json (Psych Engine atau V-Slice)', c: '#ff55ff', acc: '.json,application/json' },
    music: { t: 'Musik', h: 'File .ogg, .mp3, atau .wav, wajib', c: '#00d8ff', acc: '.ogg,.mp3,.wav,audio/*', audio: 1 },
    vocal: { t: 'Vocal', h: 'File .ogg, .mp3, atau .wav, opsional', c: '#88ff00', acc: '.ogg,.mp3,.wav,audio/*', audio: 1 }
  };
  const S = { chart: null, music: null, vocal: null };
  const ST = { chart: { s: 'empty' }, music: { s: 'empty' }, vocal: { s: 'empty' } };

  // Karakter Default (Sunnah / Opsional)
  window.charOpponentImg = new Image();
  window.charOpponentImg.src = 'images/icons/icon-kasumi.png';
  window.charPlayerImg = new Image();
  window.charPlayerImg.src = 'images/icons/icon-ichika.png';

  const CHARS = {
    opp: { name: 'Kasumi (Bawaan)', src: 'images/icons/icon-kasumi.png', custom: false },
    play: { name: 'Ichika (Bawaan)', src: 'images/icons/icon-ichika.png', custom: false }
  };

  const DEF = {
    keys: [{ c: 'KeyD', l: 'D' }, { c: 'KeyF', l: 'F' }, { c: 'KeyJ', l: 'J' }, { c: 'KeyK', l: 'K' }],
    speed: 2,
    offset: 0,
    volume: 80,
    laneMode: 'auto'
  };
  const LN = ['Kiri', 'Bawah', 'Atas', 'Kanan'];
  let CFG = $.extend({}, DEF);
  try {
    const j = JSON.parse(localStorage.getItem('rg_cfg'));
    if (j && j.keys && j.keys.length === 4) CFG = $.extend({}, DEF, j);
  } catch (e) {}
  const save = () => { try { localStorage.setItem('rg_cfg', JSON.stringify(CFG)); } catch (e) {} };

  let ctx = null;
  const AC = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
  const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const lab = c => c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : ({ ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Spasi' }[c] || c);
  const toast = m => { $('#toast').text(m).fadeIn(150).delay(2600).fadeOut(300); };

  // Render Slot File Utama
  $.each(SL, (k, s) => {
    const isChart = k === 'chart';
    const chartExtras = isChart ? `
      <div class="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <label for="chart-format" class="text-xs font-semibold text-white/80">Format:</label>
          <select id="chart-format" class="text-xs bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-white font-medium focus:outline-none focus:border-blue-400">
            <option value="auto">⚡ Deteksi Otomatis</option>
            <option value="psych">🎮 Psych Engine (v1)</option>
            <option value="vslice">🚀 FNF V-Slice (v2.0)</option>
          </select>
        </div>
        <div id="vslice-diff-box" class="hidden flex items-center justify-between gap-2">
          <label for="chart-difficulty" class="text-xs font-semibold text-white/80">Tingkat Kesulitan:</label>
          <select id="chart-difficulty" class="text-xs bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-white font-medium focus:outline-none focus:border-blue-400">
            <option value="hard">Hard (Sulit)</option>
            <option value="normal">Normal (Sedang)</option>
            <option value="easy">Easy (Mudah)</option>
          </select>
        </div>
        <div class="flex items-center justify-between gap-2">
          <label for="play-side" class="text-xs font-semibold text-white/80">Mainkan Sebagai:</label>
          <select id="play-side" class="text-xs bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-white font-medium focus:outline-none focus:border-blue-400">
            <option value="player">👤 Pemain (Kanan / Boyfriend)</option>
            <option value="opponent">🎤 Lawan (Kiri / Miku / Kasumi)</option>
            <option value="opponent_swap">🔄 Lawan (Pindah Jalur Kanan)</option>
          </select>
        </div>
      </div>` : '';

    $('#slots').append(`<div class="slot rounded-xl bg-black/40 border border-white/15 p-3.5" data-s="${k}" style="border-left:5px solid ${s.c}">
      <div class="flex justify-between items-start gap-2">
        <div><h2 class="font-bold text-sm sm:text-base">${s.t}</h2><p class="text-xs text-white/60">${s.h}</p></div>
        <span class="st text-xs font-semibold"></span>
      </div>
      <div class="dbox mt-2 rounded-lg border-2 border-dashed border-white/25 px-3 py-3 text-center">
        <p class="fn text-xs sm:text-sm font-medium truncate"></p>
        <p class="meta text-xs text-white/60"></p>
      </div>
      <div class="mt-2.5 flex flex-wrap gap-2">
        <label class="btn text-xs">Pilih file<input type="file" class="sr-only" accept="${s.acc}"></label>
        ${s.audio ? '<button type="button" class="btn tes text-xs">Tes dengar</button>' : ''}
        <button type="button" class="btn del text-xs">Hapus</button>
      </div>
      ${chartExtras}
    </div>`);
  });

  // Render Tombol Keybinds
  $.each(DEF.keys, i => $('#keys').append(`<button type="button" class="kb" data-i="${i}"><span class="kl block text-lg font-bold"></span><span class="text-[10px] text-white/60">${LN[i]}</span></button>`));
  $('#a-n').text(Object.keys(window.A || {}).length);

  let rawChartData = null;

  function parseChartData() {
    if (!rawChartData) return;
    const { json: d, fileName } = rawChartData;
    const selectedFormat = $('#chart-format').val() || 'auto';

    let isVSlice = false;
    if (selectedFormat === 'vslice') {
      isVSlice = true;
    } else if (selectedFormat === 'psych') {
      isVSlice = false;
    } else {
      if (d.version === '2.0.0' || (d.notes && typeof d.notes === 'object' && !Array.isArray(d.notes))) {
        isVSlice = true;
      } else {
        isVSlice = false;
      }
    }

    if (isVSlice) {
      if (!d.notes || typeof d.notes !== 'object' || Array.isArray(d.notes)) {
        throw new Error('Bukan chart V-Slice: bagian notes { easy, normal, hard } tidak ditemukan.');
      }
      $('#vslice-diff-box').removeClass('hidden');
      const diffKeys = Object.keys(d.notes);
      const $diffSel = $('#chart-difficulty');
      const curDiff = $diffSel.val();
      $diffSel.empty();
      ['hard', 'normal', 'easy'].forEach(dk => {
        if (d.notes[dk]) {
          const count = d.notes[dk].length;
          const label = dk === 'hard' ? 'Hard (Sulit)' : dk === 'normal' ? 'Normal (Sedang)' : 'Easy (Mudah)';
          $diffSel.append(`<option value="${dk}">${label} - ${count} note</option>`);
        }
      });
      diffKeys.forEach(dk => {
        if (!['hard', 'normal', 'easy'].includes(dk)) {
          $diffSel.append(`<option value="${dk}">${dk} - ${d.notes[dk].length} note</option>`);
        }
      });
      if (curDiff && d.notes[curDiff]) $diffSel.val(curDiff);
      const activeDiff = $diffSel.val() || diffKeys[0];

      const notesList = d.notes[activeDiff] || [];
      const playSide = $('#play-side').val() || 'player';
      const isOpponentMode = playSide === 'opponent' || playSide === 'opponent_swap';

      let n = 0, h = 0;
      notesList.forEach(x => {
        // In V-Slice: d < 4 is Boyfriend (Pemain), d >= 4 is Opponent (Lawan)
        const isSelectedRole = isOpponentMode ? (x.d >= 4) : (x.d < 4);
        if (isSelectedRole) {
          n++;
          if (x.l > 0) h++;
        }
      });

      let bpm = 120;
      if (d.bpm) bpm = d.bpm;
      else if (d.events && Array.isArray(d.events)) {
        const camEvents = d.events.filter(e => e.e === 'FocusCamera' && e.t > 0);
        if (camEvents.length > 0) {
          const barMs = camEvents[0].t;
          bpm = Math.round(60000 / (barMs / 16)) || 130;
        }
      }
      if (!bpm || bpm <= 0) bpm = 130;

      let speed = 2.5;
      if (d.scrollSpeed) {
        if (typeof d.scrollSpeed === 'object' && d.scrollSpeed[activeDiff]) {
          speed = d.scrollSpeed[activeDiff];
        } else if (typeof d.scrollSpeed === 'number') {
          speed = d.scrollSpeed;
        }
      }

      const songTitle = d.song || fileName.replace(/\.json$/i, '').replace(/-chart$/i, '');
      const chartObj = {
        song: songTitle,
        bpm: bpm,
        speed: speed,
        isVSlice: true,
        difficulty: activeDiff,
        rawVSliceNotes: notesList,
        playSide: playSide,
        needsVoices: true
      };

      S.chart = {
        name: fileName,
        d: chartObj,
        title: songTitle,
        bpm: bpm,
        speed: speed,
        n,
        h,
        b: 0,
        voices: true,
        isVSlice: true,
        difficulty: activeDiff,
        playSide: playSide
      };
      if (speed) CFG.speed = Math.min(4, Math.max(1, +speed || 2));
    } else {
      $('#vslice-diff-box').addClass('hidden');
      const so = d.song || d;
      if (!so || !Array.isArray(so.notes)) throw new Error('Bukan chart FNF: bagian song.notes tidak ditemukan.');
      const playSide = $('#play-side').val() || 'player';
      const isOpponentMode = playSide === 'opponent' || playSide === 'opponent_swap';
      let n = 0, h = 0, b = 0;
      so.notes.forEach(sec => {
        const must = !!sec.mustHitSection;
        (sec.sectionNotes || []).forEach(x => {
          if (x.length > 3 && typeof x[3] === 'string' && x[3].trim() !== '') return;
          let isPlayerNote = must ? (x[1] >= 0 && x[1] <= 3) : (x[1] >= 4 && x[1] <= 7);
          if (isOpponentMode) isPlayerNote = !isPlayerNote;
          if (isPlayerNote) {
            n++;
            if (x[2] > 0) h++;
          }
        });
        if (sec.changeBPM) b++;
      });
      so.playSide = playSide;
      S.chart = {
        name: fileName,
        d: so,
        title: so.song || fileName,
        bpm: so.bpm,
        speed: so.speed,
        n,
        h,
        b,
        voices: so.needsVoices !== false,
        isVSlice: false,
        playSide: playSide
      };
      if (so.speed) CFG.speed = Math.min(4, Math.max(1, +so.speed || 2));
    }
  }

  // Baca File & Karakter
  async function load(k, file) {
    if (k === 'charOpp' || k === 'charPlay') {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (k === 'charOpp') {
          window.charOpponentImg = img;
          CHARS.opp = { name: file.name, src: url, custom: true };
          $('#opp-icon-prev').attr('src', url);
          $('#opp-icon-name').text(file.name);
        } else {
          window.charPlayerImg = img;
          CHARS.play = { name: file.name, src: url, custom: true };
          $('#play-icon-prev').attr('src', url);
          $('#play-icon-name').text(file.name);
        }
      };
      img.src = url;
      return;
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const ok = k === 'chart' ? ext === 'json' : ['ogg', 'mp3', 'wav'].includes(ext);
    if (!ok) {
      ST[k] = { s: 'err', m: k === 'chart' ? 'File harus berformat .json.' : 'File harus berformat .ogg, .mp3, atau .wav.' };
      return render();
    }
    S[k] = null;
    ST[k] = { s: 'load', m: file.name };
    render();

    try {
      if (k === 'chart') {
        const d = JSON.parse(await file.text());
        rawChartData = { json: d, fileName: file.name };
        parseChartData();
      } else {
        const buf = await AC().decodeAudioData(await file.arrayBuffer());
        S[k] = { name: file.name, buf, dur: buf.duration };
      }
      ST[k] = { s: 'ok' };
    } catch (e) {
      S[k] = null;
      ST[k] = { s: 'err', m: k === 'chart' ? (e instanceof SyntaxError ? 'JSON rusak, file tidak bisa dibaca.' : e.message) : 'Audio tidak bisa didekode. Coba file lain.' };
    }
    render();
  }

  function route(files) {
    const o = {}, a = [];
    [...files].forEach(f => {
      const e = (f.name.split('.').pop() || '').toLowerCase();
      if (e === 'json') o.chart = f;
      else if (['ogg', 'mp3', 'wav'].includes(e)) a.push(f);
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(e)) {
        const fn = f.name.toLowerCase();
        if (/opponent|kasumi|enemy|dad|lawan/.test(fn)) load('charOpp', f);
        else if (/player|ichika|bf|boyfriend|pemain/.test(fn)) load('charPlay', f);
      }
    });
    a.forEach(f => {
      const n = f.name.toLowerCase();
      if (/voice|vocal|vox/.test(n)) o.vocal = f;
      else if (/inst|music|musik/.test(n)) o.music = o.music || f;
    });
    a.forEach(f => {
      if (Object.values(o).includes(f)) return;
      if (!o.music) o.music = f;
      else if (!o.vocal) o.vocal = f;
    });
    $.each(o, (k, f) => load(k, f));
  }

  // Event Listeners Slot & Drag-Drop
  $(document).on('change', '.slot input[type=file]', function () {
    const f = this.files[0];
    if (f) load($(this).closest('.slot').data('s'), f);
    this.value = '';
  });
  $(document).on('change', '#input-char-opp', function () {
    if (this.files[0]) load('charOpp', this.files[0]);
    this.value = '';
  });
  $(document).on('change', '#input-char-play', function () {
    if (this.files[0]) load('charPlay', this.files[0]);
    this.value = '';
  });

  $(document).on('dragenter dragover', '.slot, .char-drop', function (e) {
    e.preventDefault();
    $(this).addClass('over');
  }).on('dragleave', '.slot, .char-drop', function (e) {
    if (!this.contains(e.originalEvent.relatedTarget)) $(this).removeClass('over');
  });

  $(window).on('dragover dragenter', e => { e.preventDefault(); $('body').addClass('dz'); })
    .on('dragleave', e => { if (!e.originalEvent.relatedTarget) $('body').removeClass('dz'); })
    .on('drop', e => {
      e.preventDefault();
      $('body').removeClass('dz');
      $('.slot, .char-drop').removeClass('over');
      const fs = e.originalEvent.dataTransfer.files;
      if (!fs.length) return;
      const $s = $(e.target).closest('.slot');
      const $cd = $(e.target).closest('.char-drop');
      if ($cd.length) {
        load($cd.data('char'), fs[0]);
      } else if ($s.length && fs.length === 1) {
        load($s.data('s'), fs[0]);
      } else {
        route(fs);
      }
    });

  // Reset Karakter ke Default
  $('#btn-reset-char-opp').on('click', () => {
    window.charOpponentImg = new Image();
    window.charOpponentImg.src = 'images/icons/icon-kasumi.png';
    CHARS.opp = { name: 'Kasumi (Bawaan)', src: 'images/icons/icon-kasumi.png', custom: false };
    $('#opp-icon-prev').attr('src', 'images/icons/icon-kasumi.png');
    $('#opp-icon-name').text('Kasumi (Bawaan)');
  });
  $('#btn-reset-char-play').on('click', () => {
    window.charPlayerImg = new Image();
    window.charPlayerImg.src = 'images/icons/icon-ichika.png';
    CHARS.play = { name: 'Ichika (Bawaan)', src: 'images/icons/icon-ichika.png', custom: false };
    $('#play-icon-prev').attr('src', 'images/icons/icon-ichika.png');
    $('#play-icon-name').text('Ichika (Bawaan)');
  });

  // Tes Dengar Audio
  let tn = null, tk = null;
  function stopTest() {
    if (tn) {
      try { tn.stop(); } catch (e) {}
      tn = null;
      tk = null;
      render();
    }
  }
  $(document).on('click', '.tes', function () {
    const k = $(this).closest('.slot').data('s');
    if (tk === k) return stopTest();
    stopTest();
    if (!S[k]) return;
    const c = AC();
    c.resume();
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = S[k].buf;
    g.gain.value = CFG.volume / 100;
    src.connect(g).connect(c.destination);
    src.start(0, Math.min(30, S[k].dur * 0.2), 5);
    src.onended = () => { if (tn === src) { tn = null; tk = null; render(); } };
    tn = src;
    tk = k;
    render();
  });
  $(document).on('click', '.dbox', function () { $(this).closest('.slot').find('input[type=file]').trigger('click'); });
  $(document).on('click', '.del', function () {
    const k = $(this).closest('.slot').data('s');
    if (tk === k) stopTest();
    if (k === 'chart') {
      rawChartData = null;
      $('#vslice-diff-box').addClass('hidden');
    }
    S[k] = null;
    ST[k] = { s: 'empty' };
    render();
  });

  $(document).on('change', '#chart-format, #chart-difficulty, #play-side', function () {
    if (rawChartData) {
      try {
        parseChartData();
        ST.chart = { s: 'ok' };
      } catch (e) {
        S.chart = null;
        ST.chart = { s: 'err', m: e.message };
      }
      render();
    }
  });

  // Pengaturan Keybind & Slider
  let bind = null;
  $(document).on('click', '.kb', function () { bind = +$(this).data('i'); render(); });
  $('#speed,#offset,#volume').on('input', function () { CFG[this.id] = +this.value; save(); render(); });
  $('#lane-mode').on('change', function () { CFG.laneMode = this.value; save(); });
  const PR = [0, 0, 0, 0];
  const keyIdx = e => CFG.keys.findIndex(x => x.c === e.code);
  $(document).on('keydown', e => {
    if (!$('#screen-assets').is(':visible')) return;
    if (bind !== null) {
      e.preventDefault();
      if (e.code !== 'Escape') {
        const j = keyIdx(e); if (j > -1 && j !== bind) CFG.keys[j] = CFG.keys[bind];
        CFG.keys[bind] = { c: e.code, l: lab(e.code) }; save();
      }
      bind = null; return render();
    }
    const i = keyIdx(e);
    if (i > -1 && !$(e.target).is('input')) { PR[i] = 1; e.preventDefault(); }
  }).on('keyup', e => {
    if (!$('#screen-assets').is(':visible')) return;
    const i = keyIdx(e); if (i > -1) PR[i] = 0;
  });

  // Tampilan Layar Assets
  function render() {
    const COL = { ok: '#a3e635', err: '#f87171', load: '#fde047', empty: '#94a3b8' };
    const TXT = { ok: ['Siap', 'text-lime-300'], err: ['Gagal', 'text-red-300'], load: ['Memuat', 'text-yellow-300'], empty: ['Belum ada', 'text-white/60'] };
    $.each(SL, (k, s) => {
      const $c = $(`.slot[data-s=${k}]`), st = ST[k], d = S[k], t = TXT[st.s];
      $c.find('.st').text(t[0]).attr('class', 'st text-xs font-semibold ' + t[1]);
      $c.find('.fn').text(d ? d.name : st.s === 'load' ? st.m : 'Seret file ke sini atau klik');
      let meta = st.s === 'err' ? st.m : '';
      if (d) {
        if (k === 'chart') {
          const fmtTag = d.isVSlice ? `[V-Slice ${d.difficulty ? d.difficulty.toUpperCase() : '2.0'}]` : '[Psych Engine]';
          meta = `${fmtTag} ${d.n} note, ${d.h} hold, ${d.bpm} BPM`;
        } else {
          meta = `Durasi ${fmt(d.dur)}`;
        }
      }
      $c.find('.meta').text(meta).attr('class', 'meta text-xs ' + (st.s === 'err' ? 'text-red-300' : 'text-white/60'));
      $c.find('.tes').text(tk === k ? 'Berhenti' : 'Tes dengar').prop('disabled', !d);
      $c.find('.del').prop('disabled', st.s === 'empty');
    });

    const c = S.chart;
    $('#i-title').text(c ? c.title : '-');
    $('#i-format').text(c ? (c.isVSlice ? `V-Slice (${c.difficulty.toUpperCase()})` : 'Psych Engine (v1)') : '-');
    $('#i-bpm').text(c ? c.bpm + (c.b ? ` (berganti ${c.b}x)` : '') : '-');
    $('#i-speed').text(c ? c.speed : '-');
    $('#i-dur').text(S.music ? fmt(S.music.dur) : '-');
    $('#i-n').text(c ? c.n.toLocaleString('id-ID') : '-');
    $('#i-h').text(c ? c.h.toLocaleString('id-ID') : '-');

    $('.kb').each(function () {
      const i = +$(this).data('i');
      $(this).toggleClass('on', bind === i).find('.kl').text(bind === i ? '...' : CFG.keys[i].l);
    });
    $('#speed').val(CFG.speed); $('#speedV').text(CFG.speed.toFixed(1) + 'x');
    $('#offset').val(CFG.offset); $('#offsetV').text(CFG.offset + ' ms');
    $('#volume').val(CFG.volume); $('#volumeV').text(CFG.volume + '%');
    $('#lane-mode').val(CFG.laneMode || 'auto');

    $('#chips').html($.map(SL, (s, k) => `<span class="chip"><i style="background:${COL[ST[k].s]}"></i>${s.t}${k === 'vocal' ? ' (opsional)' : ''}</span>`).join(''));
    const w = [];
    if (c && c.voices && !S.vocal) w.push('Chart ini memakai vokal. Tanpa file vokal, lagu tetap bisa dimainkan.');
    if (S.music && S.vocal && Math.abs(S.music.dur - S.vocal.dur) > 2) w.push(`Durasi musik (${fmt(S.music.dur)}) dan vokal (${fmt(S.vocal.dur)}) berbeda jauh.`);
    $('#warn').html(w.map(x => `<li>${x}</li>`).join(''));

    const ready = !!(S.chart && S.music);
    $('#play').prop('disabled', !ready);
    $('#hint').toggle(!ready);
  }
  window.renderAssets = render;

  // Tombol Main Sekarang
  $('#play').on('click', () => {
    if (!(S.chart && S.music)) return;
    stopTest();
    AC().resume();
    window.GameAssets = {
      chart: S.chart.d,
      music: S.music.buf,
      vocal: S.vocal ? S.vocal.buf : null,
      ctx: AC(),
      sprite: img,
      atlas: window.A,
      settings: CFG,
      playSide: $('#play-side').val() || 'player',
      characters: {
        opponent: window.charOpponentImg,
        player: window.charPlayerImg
      }
    };
    $(document).trigger('game:start', [window.GameAssets]);
    if (typeof window.startGame === 'function') {
      window.startGame(window.GameAssets);
    } else {
      toast('Assets siap. Layar game belum siap.');
    }
  });

  // Preview Jalur di Layar 1
  const img = new Image();
  let imgOK = false, imgErr = false;
  img.onload = () => { imgOK = true; $('#a-png').text('Siap').attr('class', 'text-lime-300'); };
  img.onerror = () => {
    if (!img.src.includes('images/')) {
      img.src = 'images/NOTE_assets.png';
    } else {
      imgErr = true;
      $('#a-png').text('Tidak ditemukan').attr('class', 'text-red-300');
    }
  };
  img.src = 'NOTE_assets.png';

  const cv = $('#pv')[0], g = cv.getContext('2d'), W = 440, H = 260, SC = 0.38, RY = H - 55;
  const LX = [55, 165, 275, 385], DIR = ['left', 'down', 'up', 'right'], COL4 = ['purple', 'blue', 'green', 'red'];
  const ARR = ['arrowLEFT', 'arrowDOWN', 'arrowUP', 'arrowRIGHT'], PAT = [0, 3, 1, 2, 1, 3, 0, 2, 2, 1, 0, 3];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let NT = [], lt = 0, sp = 0, pi = 0; const HT = [-999, -999, -999, -999];

  function spr(n, cx, cy, s) {
    const f = window.A[n]; if (!f) return;
    const [x, y, w, h, fx = 0, fy = 0, fw = w, fh = h] = f;
    g.drawImage(img, x, y, w, h, cx - fw * s / 2 - fx * s, cy - fh * s / 2 - fy * s, w * s, h * s);
  }
  function hold(x, top, bot, c) {
    if (bot <= top) return;
    const p = window.A[c + ' hold piece'], e = window.A[c + ' end'], hs = 0.55, eh = e[3] * hs;
    if (bot - top - eh > 0) g.drawImage(img, p[0], p[1], p[2], p[3], x - p[2] * hs / 2, top + eh, p[2] * hs, bot - top - eh);
    g.save(); g.translate(x, top + eh); g.scale(1, -1);
    g.drawImage(img, e[0], e[1], e[2], e[3], -e[2] * hs / 2, 0, e[2] * hs, eh); g.restore();
  }
  function loop(t) {
    if (!$('#screen-assets').is(':visible')) return requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - lt) / 1000 || 0); lt = t;
    g.clearRect(0, 0, W, H);
    if (!imgOK) {
      g.fillStyle = '#fff'; g.font = '14px Rubik, sans-serif'; g.textAlign = 'center';
      g.fillText(imgErr ? 'NOTE_assets.png tidak ditemukan.' : 'Memuat sprite...', W / 2, H / 2);
      return requestAnimationFrame(loop);
    }
    const v = 100 * CFG.speed;
    if (!RM) { sp -= dt; if (sp <= 0) { sp = 0.5; const l = PAT[pi++ % PAT.length]; NT.push({ l, y: -30, len: pi % 4 === 0 ? 110 : 0, hit: 0 }); } }
    NT = NT.filter(n => {
      if (!n.hit) { n.y += v * dt; if (n.y >= RY) { n.y = RY; n.hit = 1; HT[n.l] = t; } return true; }
      if (n.len > 0) { n.len -= v * dt; HT[n.l] = t; return n.len > 0; }
      return false;
    });
    for (let l = 0; l < 4; l++) {
      if (t - HT[l] < 140) spr(`${DIR[l]} confirm${Math.min(3, Math.floor((t - HT[l]) / 45))}`, LX[l], RY, SC);
      else if (PR[l]) spr(`${DIR[l]} press0`, LX[l], RY, SC);
      else spr(ARR[l], LX[l], RY, SC);
    }
    NT.forEach(n => {
      if (n.len > 0) hold(LX[n.l], n.y - n.len, n.y, COL4[n.l]);
      if (!n.hit) spr(COL4[n.l], LX[n.l], n.y, SC);
    });
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '700 14px Rubik, sans-serif'; g.textAlign = 'center';
    for (let l = 0; l < 4; l++) g.fillText(CFG.keys[l].l, LX[l], H - 8);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  render();
});
