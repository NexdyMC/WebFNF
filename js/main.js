// ==========================================================
// ORCHESTRATOR & NAVIGASI APLIKASI
// ==========================================================
(function () {
  function showScreen(name) {
    $('#screen-assets').toggle(name === 'assets');
    $('#screen-game').toggleClass('is-hidden', name !== 'game');
    $('#screen-result').toggleClass('hidden', name !== 'result');

    if (name === 'game') {
      const cv = document.getElementById('game-canvas');
      if (cv) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = 1280 * dpr;
        cv.height = 720 * dpr;
      }
      if ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) {
        $('#touch-controls').removeClass('hidden');
      }
    }
  }

  window.showScreen = showScreen;

  window.showAssets = function () {
    if (typeof window.stopGame === 'function') {
      window.stopGame();
    }
    showScreen('assets');
    if (typeof window.renderAssets === 'function') {
      window.renderAssets();
    }
  };

  $(function () {
    showScreen('assets');
  });
})();
