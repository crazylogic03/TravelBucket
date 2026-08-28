(function () {
  try {
    var stored = localStorage.getItem('yolo-theme');
    var theme = stored === 'dark' ? 'dark' : 'light';
    var root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    requestAnimationFrame(function () {
      root.classList.add('theme-animate');
    });
  } catch {
    /* ignore */
  }
})();
