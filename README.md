# 部落冲突建筑工人计时器 (COC Builder Timer)

一个帮助部落冲突玩家管理建筑升级时间的PWA应用。
<img width="328" height="648" alt="image" src="https://github.com/user-attachments/assets/5703baf8-be70-419f-a065-9693eba9f085" />

## 功能特性

- [ ] 📱 **PWA支持** - 可安装到桌面，支持离线使用
- [x] ⏰ **升级计时** - 实时显示建筑升级剩余时间
- [x] 📊 **数据统计** - 显示各类建筑升级进度
- [ ] 🎯 **智能提醒** - 升级完成通知
- [x] 📱 **响应式设计** - 完美适配手机和桌面
- [x] 🔄 **离线缓存** - 无网络环境下也能使用

## 安装使用

### 在线使用
直接访问网页版本即可使用所有功能。

### 安装为PWA应用

#### 手机端安装
1. 使用Chrome、Safari等现代浏览器打开应用
2. 点击浏览器菜单中的"添加到主屏幕"或"安装应用"
3. 确认安装，应用图标将出现在桌面

#### 桌面端安装
1. 使用Chrome、Edge等浏览器打开应用
2. 地址栏右侧会出现安装图标，点击安装
3. 或者点击浏览器菜单 → "安装应用"

## PWA功能说明

### 离线支持
- 应用使用Service Worker技术实现离线缓存
- 首次访问后，即使断网也能正常使用
- 自动缓存静态资源和CDN资源

### 缓存策略
- **静态资源**：缓存优先策略，确保快速加载
- **CDN资源**：缓存优先策略，支持离线使用
- **动态数据**：网络优先策略，保证数据实时性

### 自动更新
- 应用检测到新版本时会自动提示更新
- 用户确认后立即应用新版本
- 支持后台静默更新

## 开发者指南

### 项目结构
```
coc-builder-timer/
├── index.html              # 主页面
├── manifest.json           # PWA配置文件
├── service-worker.js       # Service Worker
├── assets/
│   ├── css/
│   │   └── main.css        # 主样式文件
│   ├── js/
│   │   ├── app.js          # 主应用逻辑
│   │   └── pwa.js          # PWA相关功能
│   ├── data/
│   │   └── namemap.js      # 物品名称映射
│   └── img/                # 图标和图片资源
└── data/                   # 数据文件
```


### 技术栈
- **前端框架**：Vue.js 2.x
- **UI组件**：Element UI
- **PWA技术**：Service Worker + Web App Manifest
- **缓存策略**：多层缓存机制

## 更新指南

### 版本更新流程

#### 1. 修改版本号
更新以下文件中的版本号：

**service-worker.js**
```javascript
const CACHE_NAME = 'coc-timer-v1.2.0';  // 更新版本号
const STATIC_CACHE = 'coc-timer-static-v1.2.0';
const DYNAMIC_CACHE = 'coc-timer-dynamic-v1.2.0';
```

**manifest.json**
```json
{
  "version": "1.2.0",  // 添加版本字段
  // ... 其他配置
}
```

**index.html**
```html
<div class="version-info">v1.2.0</div>  <!-- 更新显示版本 -->
```

#### 2. 更新缓存资源列表
如果添加了新的静态资源，需要在service-worker.js中更新缓存列表：

```javascript
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/main.css',
  './assets/js/app.js',
  './assets/js/pwa.js',
  './assets/data/namemap.js',
  './new-file.js',  // 新增文件
  // ... 其他资源
];
```

#### 3. 测试更新机制
1. 部署新版本到服务器
2. 在已安装应用的设备上访问
3. 确认出现更新提示
4. 测试更新后功能正常

### 添加新功能

#### 添加新页面
1. 创建新的HTML模板
2. 添加对应的Vue组件
3. 更新路由配置（如果使用）
4. 将新资源添加到缓存列表

#### 添加新数据源
1. 在`assets/data/`目录下添加数据文件
2. 在主应用中引入数据
3. 更新缓存策略
4. 测试离线功能

#### 修改样式
1. 更新`assets/css/main.css`
2. 确保响应式设计兼容性
3. 测试不同设备显示效果

### 图标更新

如需更换应用图标，请准备以下尺寸的PNG图片：
- 16x16, 32x32 (网站图标)
- 57x57, 60x60, 72x72, 76x76, 114x114, 120x120, 144x144, 152x152, 180x180 (iOS)
- 192x192, 384x384, 512x512 (Android)

将图片放置在`assets/img/`目录下，并更新manifest.json中的图标配置。

### 性能优化

#### 缓存优化
- 定期清理无用缓存
- 优化缓存策略
- 监控缓存大小

#### 资源优化
- 压缩CSS和JavaScript文件
- 优化图片大小和格式
- 使用CDN加速

#### 代码优化
- 移除未使用的代码
- 优化Vue组件性能
- 减少DOM操作

## 部署说明

### HTTPS要求
PWA功能需要HTTPS环境才能正常工作，确保部署到支持HTTPS的服务器。

### 服务器配置
确保服务器正确配置以下MIME类型：
- `.json` → `application/json`
- `.js` → `application/javascript`
- `.css` → `text/css`
- `.png` → `image/png`

### 缓存头设置
建议为静态资源设置适当的缓存头：
```
Cache-Control: public, max-age=31536000  # 静态资源
Cache-Control: no-cache                  # HTML文件
```


## 故障排除

### 常见问题

**Q: 应用无法安装**
A: 检查是否使用HTTPS，确认manifest.json配置正确

**Q: 离线功能不工作**
A: 检查Service Worker是否正确注册，查看浏览器控制台错误信息

**Q: 更新不生效**
A: 清除浏览器缓存，或在开发者工具中强制更新Service Worker

**Q: 图标显示异常**
A: 检查图标文件路径和尺寸是否正确

### 调试工具
- Chrome DevTools → Application → Service Workers
- Chrome DevTools → Application → Storage
- Chrome DevTools → Lighthouse (PWA审核)

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

---

**最后更新**: 2024年1月
**当前版本**: v1.1.0
