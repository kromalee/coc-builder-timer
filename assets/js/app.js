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
      autoPasteDialogVisible: false,
      clipboardData: '',
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
    // 检测剪切板内容
    async checkClipboard() {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (this.isValidCOCData(text)) {
            this.clipboardData = text;
            this.autoPasteDialogVisible = true;
          }
        }
      } catch (error) {
        // 静默处理剪切板权限错误
        console.log('无法访问剪切板:', error);
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
    // 确认自动粘贴
    confirmAutoPaste() {
      this.jsonInput = this.clipboardData;
      this.parseJsonData();
      this.autoPasteDialogVisible = false;
      this.clipboardData = '';
    },
    // 取消自动粘贴
    cancelAutoPaste() {
      this.autoPasteDialogVisible = false;
      this.clipboardData = '';
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
    }
  },
  mounted() {
    this.loadNameMap();
    this.loadFromLocalStorage();
    this.timer = setInterval(this.updateTimer, 1000);
    // 页面加载后检测剪切板
    setTimeout(() => {
      this.checkClipboard();
    }, 1000);
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