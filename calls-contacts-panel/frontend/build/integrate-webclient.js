(() => {
  fetch('/3cx-tools/mc-settings-panel/index.html')
    .then((res) => res.text())
    .then((indexHtml) => {
      const cssRe = /href="(\/3cx-tools\/mc-settings-panel\/static\/css\/[a-zA-Z0-9.]+\.css)"/;
      const scriptRe = /src="(\/3cx-tools\/mc-settings-panel\/static\/js\/[a-zA-Z0-9.]+\.js)"/;
      const cssHref = cssRe.exec(indexHtml);
      const scriptSrc = scriptRe.exec(indexHtml);

      const css = document.createElement('link');
      css.href = cssHref[1];
      css.rel = 'stylesheet';
      const script = document.createElement('script');
      script.src = scriptSrc[1];

      setTimeout(() => {
        document.body.appendChild(css);
        document.body.appendChild(script);
      }, 1000);
    });
})();
