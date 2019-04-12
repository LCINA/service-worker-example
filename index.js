var version = '1.0.1';

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    var isSupportEle = document.getElementById('is-support');
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function (registration) {
          updateServiceWorker(registration);
          console.log('success: ', registration.scope);
          isSupportEle.innerHTML = 'Good, your browser supports serviceWorker.';
        })
        .catch(function (err) {
          console.log('failed: ', err);
          isSupportEle.innerHTML = "Sorry, your browser doesn't support serviceWorker.";
        });
    });
  }
}

function updateServiceWorker(reg) {
  if (localStorage.getItem('sw_version') !== version) {
    reg.update().then(function () {
      localStorage.setItem('sw_version', version)
    });
  }
}

registerServiceWorker();