Vue.config.devtools = true
new Vue({
  el: '#app',
  data() {
    return {
      players: {},
      playerRemarks: {},
      jsonInput: '',
      nameMap: {},
      currentTime: Date.now(),
      timer: null,
      // 对话框控制
      helpDialogVisible: false,
      configDialogVisible: false,
      // 通知设置
      notificationEnabled: false,
      notificationPermission: 'default',
      // 加速设置（仅用于主世界建筑和英雄的剩余时间计算）
      speedUp10x: false,
      speedUp24x: false,
      // 浏览器API引用
      window: window,
      categories: ['buildings', 'traps', 'decos', 'obstacles', 'units', 'siege_machines', 'heroes', 'spells', 'pets', 'equipment', 'buildings2', 'traps2', 'decos2', 'obstacles2', 'units2', 'heroes2'],
      categoryNames: {
        buildings: '建筑',
        traps: '陷阱',
        decos: '装饰',
        obstacles: '障碍物',
        units: '兵种',
        siege_machines: '攻城机器',
        heroes: '英雄',
        spells: '法术',
        pets: '宠物',
        equipment: '装备',
        buildings2: '夜世界建筑',
        traps2: '夜世界陷阱',
        decos2: '夜世界装饰',
        obstacles2: '夜世界障碍物',
        units2: '夜世界兵种',
        heroes2: '夜世界英雄'
      }

    };
  },
  computed: {
    AllUpgradingItems() {
      const allItems = [];
      Object.keys(this.players).forEach(playerTag => {
        const gameData = this.players[playerTag];

        this.categories.forEach(category => {
          if (gameData[category]) {
            gameData[category].forEach((item, index) => {
              if (item.timer) {
                const endTime = gameData.timestamp * 1000 + item.timer * 1000;
                let remainingTime = Math.max(0, endTime - this.currentTime);

                // 应用加速（仅适用于主世界的建筑和英雄）
                const isMainWorldBuildingOrHero = category === 'buildings' || category === 'heroes';
                if (isMainWorldBuildingOrHero) {
                  if (this.speedUp24x) {
                    remainingTime = remainingTime / 24;
                  } else if (this.speedUp10x) {
                    remainingTime = remainingTime / 10;
                  }
                }

                allItems.push({
                  id: `${playerTag}_${category}_${index}`,
                  index: index,
                  playerTag: playerTag,
                  playerName: this.playerRemarks[playerTag] || playerTag,
                  category: category,
                  categoryName: this.categoryNames[category] || category,
                  displayName: this.getDisplayName(item.data),
                  lvl: item.lvl,
                  timer: item.timer,
                  remainingTime: remainingTime,
                  endTime: endTime,
                  notificationSent: item.notificationSent,
                  completionNotificationSent: item.completionNotificationSent
                });
              }
            });
          }
        });
      });

      return allItems.sort((a, b) => a.remainingTime - b.remainingTime);
    },
  },
  methods: {
    // 显示帮助对话框
    showHelpDialog() {
      this.helpDialogVisible = true;
    },
    // 显示配置对话框
    showConfigDialog() {
      this.configDialogVisible = true;
    },
    // 请求通知权限
    async requestNotificationPermission() {
      if (!('Notification' in window)) {
        this.$message.error('此浏览器不支持通知功能');
        return false;
      }

      if (Notification.permission === 'granted') {
        this.notificationPermission = 'granted';
        this.notificationEnabled = true;
        this.$message.success('通知权限已开启');
        return true;
      }

      if (Notification.permission === 'denied') {
        this.notificationPermission = 'denied';
        this.notificationEnabled = false;
        this.$message.warning('通知权限已被拒绝，请在浏览器设置中手动开启');
        return false;
      }

      try {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;

        if (permission === 'granted') {
          this.notificationEnabled = true;
          this.$message.success('通知权限已开启');
          return true;
        } else {
          this.notificationEnabled = false;
          this.$message.warning('通知权限被拒绝');
          return false;
        }
      } catch (error) {
        console.error('请求通知权限失败:', error);
        this.$message.error('请求通知权限失败');
        return false;
      }
    },

    // 发送通知
    sendNotification(title, body, options = {}) {
      if (!this.notificationEnabled || Notification.permission !== 'granted') {
        return;
      }

      const defaultOptions = {
        icon: './assets/img/pwa-192x192.png',
        badge: './assets/img/pwa-64x64.png',
        tag: 'coc-timer',
        requireInteraction: true,
        ...options
      };

      try {
        // 优先使用Service Worker通知（更好的iOS支持）
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            title,
            body,
            delay: 0,
            tag: defaultOptions.tag
          });
        } else {
          // 回退到直接通知
          const notification = new Notification(title, {
            body,
            ...defaultOptions
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // 自动关闭通知（iOS Safari需要）
          setTimeout(() => {
            notification.close();
          }, 10000);
        }

      } catch (error) {
        console.error('发送通知失败:', error);
      }
    },

    // 调度延迟通知（用于升级完成提醒）
    scheduleNotification(title, body, delay, tag) {
      if (!this.notificationEnabled || Notification.permission !== 'granted') {
        return;
      }

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          title,
          body,
          delay,
          tag
        });
      } else {
        // 回退到setTimeout
        setTimeout(() => {
          this.sendNotification(title, body, { tag });
        }, delay);
      }
    },

    // 检查升级完成并发送通知
    checkUpgradeCompletion() {
      if (!this.notificationEnabled) return;

      const upgradingItems = this.AllUpgradingItems;

      upgradingItems.forEach(item => {
        // 使用 AllUpgradingItems 中已计算好的 remainingTime（已应用加速设置）
        // 这样通知触发时间与显示的剩余时间保持一致
        const timeLeft = item.remainingTime;

        // 如果在5分钟内完成，发送即将完成通知
        if (timeLeft > 0 && timeLeft <= 300000 && !item.notificationSent) {
          this.sendNotification(
            '升级即将完成',
            `${item.playerName}的${item.displayName}将在5分钟内完成升级`,
            { tag: `upgrade-soon-${item.id}` }
          );
          // 将原始数据 this.players中的数据 标记为已发送通知
          this.players[item.playerTag][item.category][item.index].notificationSent = true;
        }

        // 如果已经完成，并且没有超时五分钟。发送完成通知
        if (timeLeft <= 0 && timeLeft >= -300000 && !item.completionNotificationSent) {
          this.sendNotification(
            '升级已完成！',
            `${item.playerName}的${item.displayName}升级已完成`,
            { tag: `upgrade-complete-${item.id}` }
          );
          // 将原始数据 this.players中的数据 标记为已发送完成通知
          this.players[item.playerTag][item.category][item.index].completionNotificationSent = true;
        }
      });
    },

    // 切换通知设置
    async toggleNotification(result) {
      if (result) {
        const granted = await this.requestNotificationPermission();
        if (granted) {
          this.notificationEnabled = true;
        }
      } else {
        this.notificationEnabled = false;
        this.$message.info('通知已关闭');
      }
    },
    // 切换10倍加速
    toggleSpeedUp10x(value) {
      if (value) {
        this.speedUp24x = false;
      }
    },
    // 切换24倍加速
    toggleSpeedUp24x(value) {
      if (value) {
        this.speedUp10x = false;
      }
    },

    // 检查通知权限状态
    checkNotificationPermission() {
      if ('Notification' in window) {
        this.notificationPermission = Notification.permission;
        if (this.notificationPermission === 'granted') {
          this.notificationEnabled = true;
        } else {
          this.notificationEnabled = false;
        }
      } else {
        this.notificationEnabled = false;
      }
    },

    // 快速粘贴并处理数据
    async quickPasteAndProcess() {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (this.isValidCOCData(text)) {
            this.jsonInput = text;
            this.parseJsonData();
            this.$message.success('已成功粘贴并解析数据！');
          } else {
            this.$message.warning('剪切板中没有有效的COC数据');
          }
        } else {
          this.$message.error('浏览器不支持剪切板访问');
        }
      } catch (error) {
        this.$message.error('无法访问剪切板，请手动粘贴数据');
        console.log('剪切板访问错误:', error);
      }
    },
    // 验证是否为有效的COC数据
    isValidCOCData(text) {
      try {
        const data = JSON.parse(text.trim());
        // 检查是否包含COC数据的关键字段
        return data && data.tag && (data.buildings || data.heroes || data.units || data.timestamp);
      } catch (error) {
        return false;
      }
    },

    loadNameMap() {
      this.nameMap = window.COC_NAME_MAP || {};
    },
    getDisplayName(data) {
      if (!data) return '未知项目';
      return this.nameMap[data] || `ID: ${data}`;
    },
    parseJsonData() {
      if (!this.jsonInput.trim()) {
        this.$message.warning('请输入JSON数据');
        return;
      }

      try {
        const gameData = JSON.parse(this.jsonInput.trim());
        if (gameData.tag) {
          this.addPlayer(gameData.tag, gameData);
          this.jsonInput = '';
          this.$message.success(`玩家 ${gameData.tag} 数据解析成功！`);
        } else {
          this.$message.error('JSON数据缺少玩家标签(tag)字段！');
        }
      } catch (error) {
        this.$message.error('JSON格式错误，请检查数据格式！');
        console.error('JSON解析错误:', error);
      }
    },
    clearInput() {
      this.jsonInput = '';
    },
    addPlayer(tag, data) {
      // 为每个带有timer的项目添加通知状态标识
      if (data) {
        this.categories.forEach(category => {
          if (data[category] && Array.isArray(data[category])) {
            data[category].forEach(item => {
              if (item.timer) {
                if (!item.hasOwnProperty('notificationSent')) {
                  item.notificationSent = false
                }
                if (!item.hasOwnProperty('completionNotificationSent')) {
                  item.completionNotificationSent = false
                }
              }
            });
          }
        });
      }

      this.$set(this.players, tag, data);
      if (!this.playerRemarks[tag]) {
        this.$set(this.playerRemarks, tag, '');
      }
    },
    removePlayer(tag) {
      this.$delete(this.players, tag);
      this.$delete(this.playerRemarks, tag);
    },

    getPlayerUpgradingCount(gameData) {
      let count = 0;
      this.categories.forEach(category => {
        if (gameData[category]) {
          gameData[category].forEach(item => {
            if (item.timer) count++;
          });
        }
      });
      return count;
    },
    getNextCompletionTime() {
      const items = this.AllUpgradingItems;
      if (items.length === 0) return '无';

      const nextItem = items[0];
      if (nextItem.remainingTime <= 0) {
        return '有项目已完成';
      }

      return this.formatTime(nextItem.remainingTime);
    },
    saveToLocalStorage() {
      try {
        const data = {
          players: this.players,
          playerRemarks: this.playerRemarks,
          speedUp10x: this.speedUp10x,
          speedUp24x: this.speedUp24x,
          timestamp: Date.now()
        };
        localStorage.setItem('cocTimerData', JSON.stringify(data));
      } catch (error) {
        console.error('保存到localStorage失败:', error);
      }
    },
    loadFromLocalStorage() {
      try {
        const savedData = localStorage.getItem('cocTimerData');
        if (savedData) {
          const data = JSON.parse(savedData);
          this.players = data.players || {};
          this.playerRemarks = data.playerRemarks || {};
          this.speedUp10x = data.speedUp10x || false;
          this.speedUp24x = data.speedUp24x || false;
          this.$message.success('已从本地存储恢复数据');
        }
      } catch (error) {
        console.error('从localStorage加载失败:', error);
      }
    },
    formatTime(milliseconds) {
      if (milliseconds <= 0) return '已完成';

      const seconds = Math.floor(milliseconds / 1000);
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (days > 0) {
        return `${days}天 ${hours}时 ${minutes}分`;
      } else if (hours > 0) {
        return `${hours}时 ${minutes}分 ${secs}秒`;
      } else if (minutes > 0) {
        return `${minutes}分 ${secs}秒`;
      } else {
        return `${secs}秒`;
      }
    },
    formatTimestamp(timestamp) {
      return new Date(timestamp * 1000).toLocaleString('zh-CN');
    },
    // 获取近两天（自然日：今天至明天23:59:59）的即将完成升级列表（数组）
    getUpcomingNextTwoDays() {
      const now = new Date();
      const endOfTomorrow = new Date(now);
      endOfTomorrow.setDate(now.getDate() + 1);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const startMs = now.getTime();
      const endMs = endOfTomorrow.getTime();

      const pad = (n) => String(n).padStart(2, '0');
      const formatLocalDateTime = (date) => {
        return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };
      const toLocalISOWithOffset = (date) => {
        const tzo = -date.getTimezoneOffset(); // 分钟，东八区为 +480
        const sign = tzo >= 0 ? '+' : '-';
        const hh = pad(Math.floor(Math.abs(tzo) / 60));
        const mm = pad(Math.abs(tzo) % 60);
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${hh}:${mm}`;
      };

      const todos = [];
      const upgradingItems = this.AllUpgradingItems || [];

      upgradingItems.forEach(item => {
        const endTimeMs = item.endTime;
        if (endTimeMs < startMs || endTimeMs > endMs) return;

        // 更准确获取等级
        let level = item.lvl;
        try {
          const src = this.players[item.playerTag]?.[item.category]?.[item.index];
          if (src && src.lvl) level = src.lvl;
        } catch (e) { }

        const endDateObj = new Date(endTimeMs);

        todos.push({
          title: `${item.playerName}的${item.categoryName}${item.displayName}Lv.${level || ''}升级完成`,
          note: `${item.playerName}的${item.categoryName}${item.displayName}Lv.${level || ''}升级完成时间 ${formatLocalDateTime(endDateObj)}`.trim(),
          dueISO: toLocalISOWithOffset(endDateObj)
        });
      });

      // 按时间升序
      todos.sort((a, b) => new Date(a.dueISO) - new Date(b.dueISO));

      return todos;
    },
    // 以字符串形式返回 JSON（数组），便于快捷指令“获取字典”并循环
    getUpcomingNextTwoDaysJSON() {
      try {
        return JSON.stringify(this.getUpcomingNextTwoDays());
      } catch (e) {
        console.error('生成近两天JSON失败:', e);
        return '[]';
      }
    },

    // 将近两天的待办数组JSON写入隐藏标签，供快捷指令读取
    updateUpcomingTodosHiddenTag() {
      try {
        const el = document.getElementById('coc-next-two-days');
        if (!el) return;
        const json = this.getUpcomingNextTwoDaysJSON();
        el.setAttribute('data-json', json);
        el.setAttribute('data-generated-at', new Date().toISOString());
        try {
          const arr = JSON.parse(json);
          el.setAttribute('data-count', String(Array.isArray(arr) ? arr.length : 0));
        } catch (_) {
          el.setAttribute('data-count', '0');
        }
      } catch (err) {
        console.error('更新隐藏标签失败:', err);
      }
    },

    updateTimer() {
      this.currentTime = Date.now();
      // 检查升级完成状态并发送通知
      this.checkUpgradeCompletion();
      // 同步隐藏标签内容
      this.updateUpcomingTodosHiddenTag();
    }
  },
  mounted() {
    this.loadNameMap();
    this.loadFromLocalStorage();
    this.checkNotificationPermission();
    this.timer = setInterval(this.updateTimer, 1000);
    // 初始化隐藏标签内容
    this.updateUpcomingTodosHiddenTag();
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  watch: {
    players: {
      handler() {
        this.saveToLocalStorage();
        this.updateUpcomingTodosHiddenTag();
      },
      deep: true
    },
    playerRemarks: {
      handler() {
        this.saveToLocalStorage();
        this.updateUpcomingTodosHiddenTag();
      },
      deep: true
    },
    speedUp10x: {
      handler() {
        this.saveToLocalStorage();
      }
    },
    speedUp24x: {
      handler() {
        this.saveToLocalStorage();
      }
    }
  }
});