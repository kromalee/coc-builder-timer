# 版本同步机制说明

## 🔄 自动版本同步

本项目实现了自动版本同步机制，无需手动修改多个文件中的版本号。

## 📋 工作原理

### 1. **统一版本源**
- 版本号统一存储在 `package.json` 中
- 所有其他文件从此处获取版本信息

### 2. **自动同步脚本**
- `scripts/update-version.js` 负责同步版本号
- 自动更新 `service-worker.js` 中的缓存版本
- 自动更新 `pwa.js` 中的默认版本号

### 3. **动态版本显示**
- HTML页面通过JavaScript动态获取版本号
- 从Service Worker实时获取当前版本
- 支持离线和在线模式

## 🚀 使用方法

### **发布新版本**

1. **修改版本号**
   ```bash
   # 编辑 package.json 中的 version 字段
   {
     "version": "1.2.0"  # 更新到新版本
   }
   ```

2. **运行同步脚本**
   ```bash
   npm run update-version
   ```

3. **部署应用**
   ```bash
   # 部署到服务器
   # 用户访问时会自动检测到新版本
   ```

### **开发流程**

```bash
# 1. 修改代码
# 2. 更新 package.json 版本号
# 3. 运行版本同步
npm run update-version

# 4. 生成图标（如需要）
npm run generate-icons

# 5. 部署
```

## 📁 涉及文件

| 文件 | 作用 | 更新方式 |
|------|------|----------|
| `package.json` | 版本号源头 | 手动修改 |
| `service-worker.js` | 缓存版本控制 | 脚本自动更新 |
| `assets/js/pwa.js` | 默认版本显示 | 脚本自动更新 |
| `index.html` | 版本号显示容器 | JavaScript动态获取 |

## ✨ 优势

- **🎯 单一数据源**: 只需修改 `package.json` 中的版本号
- **🤖 自动同步**: 一键更新所有相关文件
- **🔄 动态显示**: 页面实时显示当前版本
- **📱 PWA兼容**: 支持Service Worker版本控制
- **🛡️ 容错机制**: 离线时显示默认版本

## 🔧 自定义

如需修改版本同步逻辑，编辑 `scripts/update-version.js` 文件。

## 📝 注意事项

1. 每次发布前务必运行 `npm run update-version`
2. 版本号建议遵循语义化版本规范 (SemVer)
3. 测试环境和生产环境都需要同步版本号
4. Service Worker缓存会根据版本号自动清理