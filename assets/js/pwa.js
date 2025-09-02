// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker 注册成功:', registration.scope);
        
        // 获取并显示版本号
        getAndDisplayVersion();
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('应用有新版本可用，是否立即更新？')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('Service Worker 注册失败:', error);
        // 如果Service Worker注册失败，显示默认版本
        document.getElementById('version-info').innerHTML = '<p>v1.3.0</p>';
      });
  });
} else {
  // 如果不支持Service Worker，显示默认版本
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('version-info').innerHTML = '<p>v1.3.0</p>';
  });
}

// 获取并显示版本号
function getAndDisplayVersion() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // 创建消息通道
    const messageChannel = new MessageChannel();
    
    // 监听版本号响应
    messageChannel.port1.onmessage = function(event) {
      if (event.data && event.data.version) {
        const version = event.data.version.replace('coc-timer-', '');
        document.getElementById('version-info').innerHTML = `<p>${version}</p>`;
      }
    };
    
    // 向Service Worker请求版本号
    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_VERSION' },
      [messageChannel.port2]
    );
  } else {
    // 如果没有Service Worker控制器，稍后重试
    setTimeout(getAndDisplayVersion, 1000);
  }
}

// 添加到主屏幕提示
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('PWA 可以安装');
});

window.addEventListener('appinstalled', (evt) => {
  console.log('PWA 已安装');
});