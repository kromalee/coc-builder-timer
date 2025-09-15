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

      const now = Date.now();
      const upgradingItems = this.getAllUpgradingItems();
      
      upgradingItems.forEach(item => {
        const completionTime = item.upgradeEndTime * 1000;
        const timeLeft = completionTime - now;
        
        // 如果在1分钟内完成，发送即将完成通知
        if (timeLeft > 0 && timeLeft <= 60000 && !item.notificationSent) {
          this.sendNotification(
            '升级即将完成',
            `${item.playerName}的${item.displayName}将在1分钟内完成升级`,
            { tag: `upgrade-soon-${item.id}` }
          );
          item.notificationSent = true;
        }
        
        // 如果已经完成，发送完成通知
        if (timeLeft <= 0 && !item.completionNotificationSent) {
          this.sendNotification(
            '升级已完成！',
            `${item.playerName}的${item.displayName}升级已完成`,
            { tag: `upgrade-complete-${item.id}` }
          );
          item.completionNotificationSent = true;
        }
      });
    },

    // 切换通知设置
    async toggleNotification() {
      if (!this.notificationEnabled) {
        const granted = await this.requestNotificationPermission();
        if (granted) {
          this.notificationEnabled = true;
        }
      } else {
        this.notificationEnabled = false;
        this.$message.info('通知已关闭');
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
      this.$set(this.players, tag, data);
      if (!this.playerRemarks[tag]) {
        this.$set(this.playerRemarks, tag, '');
      }
    },
    removePlayer(tag) {
      this.$delete(this.players, tag);
      this.$delete(this.playerRemarks, tag);
    },
    getAllUpgradingItems() {
      const allItems = [];

      Object.keys(this.players).forEach(playerTag => {
        const gameData = this.players[playerTag];

        this.categories.forEach(category => {
          if (gameData[category]) {
            gameData[category].forEach((item, index) => {
              if (item.timer) {
                const endTime = gameData.timestamp * 1000 + item.timer * 1000;
                const remainingTime = Math.max(0, endTime - this.currentTime);

                allItems.push({
                  id: `${playerTag}_${category}_${index}`,
                  playerTag: playerTag,
                  category: category,
                  categoryName: this.categoryNames[category] || category,
                  displayName: this.getDisplayName(item.data),
                  lvl: item.lvl,
                  timer: item.timer,
                  remainingTime: remainingTime,
                  endTime: endTime
                });
              }
            });
          }
        });
      });

      return allItems.sort((a, b) => a.remainingTime - b.remainingTime);
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
      const items = this.getAllUpgradingItems();
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
    updateTimer() {
      this.currentTime = Date.now();
      // 检查升级完成状态并发送通知
      this.checkUpgradeCompletion();
    }
  },
  mounted() {
    this.loadNameMap();
    this.loadFromLocalStorage();
    this.checkNotificationPermission();
    this.timer = setInterval(this.updateTimer, 1000);
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
      },
      deep: true
    },
    playerRemarks: {
      handler() {
        this.saveToLocalStorage();
      },
      deep: true
    }
  }
});