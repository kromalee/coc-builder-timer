#!/usr/bin/env node

/**
 * Git版本自动管理脚本
 * 根据Git提交时间自动生成版本号 (YYMMDDHHmmss)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取Git提交时间并格式化为版本号
function getVersionFromGit() {
  try {
    // 获取最新提交的时间戳
    const timestamp = execSync('git log -1 --format=%ct', { encoding: 'utf8' }).trim();
    
    if (!timestamp) {
      console.log('⚠️  无法获取Git提交时间，使用当前时间');
      return formatDateToVersion(new Date());
    }
    
    // 转换为Date对象
    const commitDate = new Date(parseInt(timestamp) * 1000);
    return formatDateToVersion(commitDate);
    
  } catch (error) {
    console.log('⚠️  Git命令执行失败，使用当前时间:', error.message);
    return formatDateToVersion(new Date());
  }
}

// 格式化日期为版本号 (YYMMDDHHmmss)
function formatDateToVersion(date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// 更新package.json中的版本号
function updatePackageVersion(version) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    // 更新版本号
    packageJson.version = `1.${version}`;
    
    // 写回文件
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`✅ 版本号已更新为: ${packageJson.version}`);
    return packageJson.version;
    
  } catch (error) {
    console.error('❌ 更新package.json失败:', error.message);
    throw error;
  }
}

// 更新service-worker.js中的缓存版本
function updateServiceWorkerVersion(version) {
  const swPath = path.join(__dirname, '..', 'service-worker.js');
  
  try {
    let content = fs.readFileSync(swPath, 'utf8');
    
    // 更新缓存名称
    content = content.replace(
      /const CACHE_NAME = '[^']*';/,
      `const CACHE_NAME = 'coc-timer-v${version}';`
    );
    
    content = content.replace(
      /const STATIC_CACHE = '[^']*';/,
      `const STATIC_CACHE = 'coc-timer-static-v${version}';`
    );
    
    content = content.replace(
      /const DYNAMIC_CACHE = '[^']*';/,
      `const DYNAMIC_CACHE = 'coc-timer-dynamic-v${version}';`
    );
    
    fs.writeFileSync(swPath, content);
    console.log('✅ Service Worker版本已更新');
    
  } catch (error) {
    console.error('❌ 更新Service Worker失败:', error.message);
    throw error;
  }
}

// 更新pwa.js中的默认版本
function updatePwaVersion(version) {
  const pwaPath = path.join(__dirname, '..', 'assets', 'js', 'pwa.js');
  
  try {
    let content = fs.readFileSync(pwaPath, 'utf8');
    
    // 更新默认版本号
    content = content.replace(
      /versionElement\.textContent = '[^']*';/,
      `versionElement.textContent = 'v${version}';`
    );
    
    fs.writeFileSync(pwaPath, content);
    console.log('✅ PWA默认版本已更新');
    
  } catch (error) {
    console.error('❌ 更新PWA版本失败:', error.message);
    throw error;
  }
}

// 主函数
function main() {
  console.log('🚀 开始Git版本自动管理...');
  
  try {
    // 1. 获取Git提交时间版本号
    const gitVersion = getVersionFromGit();
    console.log(`📅 Git提交时间版本: ${gitVersion}`);
    
    // 2. 更新package.json
    const fullVersion = updatePackageVersion(gitVersion);
    
    // 3. 更新service-worker.js
    updateServiceWorkerVersion(fullVersion);
    
    // 4. 更新pwa.js
    updatePwaVersion(fullVersion);
    
    console.log('🎉 版本自动管理完成!');
    console.log(`📦 当前版本: ${fullVersion}`);
    
  } catch (error) {
    console.error('❌ 版本管理失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  getVersionFromGit,
  formatDateToVersion,
  updatePackageVersion,
  updateServiceWorkerVersion,
  updatePwaVersion,
  main
};