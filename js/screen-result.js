// ==========================================================
// LAYAR 3: RESULT / SCORE (PERINGKAT, BREAKDOWN & ULANGI)
// ==========================================================
(function () {
  window.showResult = function (result) {
    if (typeof window.stopGame === 'function') {
      window.stopGame();
    }
    if (typeof window.showScreen === 'function') {
      window.showScreen('result');
    }

    $('#res-title').text(result.title || 'Lagu');
    if (result.completed) {
      $('#res-status').text('Lagu selesai').attr('class', 'text-base sm:text-lg font-bold tracking-wide text-lime-400');
    } else {
      $('#res-status').text('Gagal').attr('class', 'text-base sm:text-lg font-bold tracking-wide text-red-400');
    }
    $('#res-role').text(result.role ? `Dimainkan sebagai: ${result.role}` : '');

    const r = result.rank || 'D';
    const RANK_THEMES = {
      'S': 'bg-gradient-to-tr from-yellow-400 to-amber-200 text-black shadow-amber-500/50',
      'A': 'bg-gradient-to-tr from-emerald-500 to-lime-300 text-black shadow-emerald-500/50',
      'B': 'bg-gradient-to-tr from-blue-500 to-cyan-300 text-black shadow-blue-500/50',
      'C': 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-orange-500/50',
      'D': 'bg-gradient-to-tr from-red-600 to-rose-400 text-white shadow-red-500/50'
    };
    $('#res-rank').text(r).attr('class', `w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl font-black shadow-xl drop-shadow ${RANK_THEMES[r] || RANK_THEMES['D']}`);

    $('#res-score').text((result.score || 0).toLocaleString('id-ID'));
    $('#res-accuracy').text((result.accuracy || 0).toFixed(2) + '%');
    $('#res-max-combo').text((result.maxCombo || 0).toLocaleString('id-ID'));

    const c = result.counts || { sick: 0, good: 0, bad: 0, shit: 0, miss: 0 };
    const total = Math.max(1, (c.sick || 0) + (c.good || 0) + (c.bad || 0) + (c.shit || 0) + (c.miss || 0));

    $('#res-count-sick').text((c.sick || 0).toLocaleString('id-ID'));
    $('#res-count-good').text((c.good || 0).toLocaleString('id-ID'));
    $('#res-count-bad').text((c.bad || 0).toLocaleString('id-ID'));
    $('#res-count-shit').text((c.shit || 0).toLocaleString('id-ID'));
    $('#res-count-miss').text((c.miss || 0).toLocaleString('id-ID'));

    $('#res-bar-sick').css('width', `${(((c.sick || 0) / total) * 100).toFixed(1)}%`);
    $('#res-bar-good').css('width', `${(((c.good || 0) / total) * 100).toFixed(1)}%`);
    $('#res-bar-bad').css('width', `${(((c.bad || 0) / total) * 100).toFixed(1)}%`);
    $('#res-bar-shit').css('width', `${(((c.shit || 0) / total) * 100).toFixed(1)}%`);
    $('#res-bar-miss').css('width', `${(((c.miss || 0) / total) * 100).toFixed(1)}%`);
  };

  // Event Listeners Layar 3
  $('#btn-result-replay').on('click', () => {
    if (window.GameAssets && typeof window.startGame === 'function') {
      window.startGame(window.GameAssets);
    }
  });

  $('#btn-result-assets').on('click', () => {
    if (typeof window.showAssets === 'function') {
      window.showAssets();
    }
  });
})();
