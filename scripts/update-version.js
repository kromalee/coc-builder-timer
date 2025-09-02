const fs = require('fs');
const path = require('path');

// 读取package.json获取版本号
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

console.log(`正在更新版本号到: ${version}`);

// 更新service-worker.js中的版本号
const serviceWorkerPath = path.join(__dirname, '..', 'service-worker.js');
let serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');

// 替换版本号
serviceWorkerContent = serviceWorkerContent.replace(
  /const CACHE_NAME = 'coc-timer-v[^']+';/,
  `const CACHE_NAME = 'coc-timer-v${version}';`
);
serviceWorkerContent = serviceWorkerContent.replace(
  /const STATIC_CACHE = 'coc-timer-static-v[^']+';/,
  `const STATIC_CACHE = 'coc-timer-static-v${version}';`
);
serviceWorkerContent = serviceWorkerContent.replace(
  /const DYNAMIC_CACHE = 'coc-timer-dynamic-v[^']+';/,
  `const DYNAMIC_CACHE = 'coc-timer-dynamic-v${version}';`
);

fs.writeFileSync(serviceWorkerPath, serviceWorkerContent);
console.log('✅ 已更新 service-worker.js');

// 更新pwa.js中的默认版本号
const pwaPath = path.join(__dirname, '..', 'assets', 'js', 'pwa.js');
let pwaContent = fs.readFileSync(pwaPath, 'utf8');

// 替换默认版本号
pwaContent = pwaContent.replace(
  /document\.getElementById\('version-info'\)\.innerHTML = '<p>v[^<]+<\/p>';/g,
  `document.getElementById('version-info').innerHTML = '<p>v${version}</p>';`
);

fs.writeFileSync(pwaPath, pwaContent);
console.log('✅ 已更新 pwa.js');

console.log(`🎉 版本同步完成！当前版本: v${version}`);
console.log('\n📝 更新内容:');
console.log('- Service Worker 缓存版本号');
console.log('- PWA.js 默认版本号');
console.log('\n💡 提示: HTML页面会自动从Service Worker获取最新版本号');