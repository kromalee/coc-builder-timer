const fs = require('fs');
const path = require('path');

// 读取coc_info.json文件并更新assets/data/namemap.js
function extractNameMap() {
    try {
        // 读取coc_info.json文件
        const cocInfoPath = path.join(__dirname, 'coc_info.json');
        const cocInfoData = JSON.parse(fs.readFileSync(cocInfoPath, 'utf8'));
        
        const nameMap = {};
        
        // 递归遍历所有数据
        function traverseData(data) {
            if (Array.isArray(data)) {
                data.forEach(item => traverseData(item));
            } else if (typeof data === 'object' && data !== null) {
                // 检查是否有clashNo和nameZh字段
                if (data.clashNo && data.nameZh && data.clashNo !== null && data.clashNo !== '') {
                    nameMap[data.clashNo] = data.nameZh;
                }
                
                // 递归遍历对象的所有属性
                Object.values(data).forEach(value => {
                    if (typeof value === 'object') {
                        traverseData(value);
                    }
                });
            }
        }
        
        // 开始遍历
        traverseData(cocInfoData);
        
        // 按clashNo排序
        const sortedEntries = Object.entries(nameMap).sort((a, b) => {
            // 尝试按数字排序，如果不是数字则按字符串排序
            const numA = parseInt(a[0]);
            const numB = parseInt(b[0]);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a[0].localeCompare(b[0]);
        });
        
        // 生成JavaScript代码格式的nameMap内容
        const mapEntries = sortedEntries.map(([clashNo, nameZh]) => `  "${clashNo}": "${nameZh}"`).join(',\n');
        
        const outputContent = `// 部落冲突物品名称映射
// 自动生成时间: ${new Date().toLocaleString()}
window.COC_NAME_MAP = {
${mapEntries}
};
`;
        
        // 写入到assets/data/namemap.js文件
        const outputPath = path.join(__dirname, '..', 'assets', 'data', 'namemap.js');
        fs.writeFileSync(outputPath, outputContent, 'utf8');
        
        // 按类型分组统计
        const typeStats = {};
        sortedEntries.forEach(([clashNo]) => {
            const prefix = clashNo.substring(0, clashNo.length - 3);
            typeStats[prefix] = (typeStats[prefix] || 0) + 1;
        });
        
        // 输出统计信息到控制台
        console.log('✅ 成功更新 assets/data/namemap.js');
        console.log(`📊 总共提取了 ${sortedEntries.length} 个映射关系`);
        console.log('📋 按类型分布：');
        Object.entries(typeStats).forEach(([prefix, count]) => {
            let typeName = '未知类型';
            switch(prefix) {
                case '4000': typeName = '兵种'; break;
                case '28000': typeName = '英雄'; break;
                case '26000': typeName = '法术'; break;
                case '12000': typeName = '陷阱'; break;
                case '1000': typeName = '建筑'; break;
                case '106000': typeName = '装备'; break;
                case '73000': typeName = '宠物'; break;
            }
            console.log(`   ${typeName}(${prefix}xxx): ${count} 个`);
        });
        
    } catch (error) {
        console.error('❌ 处理文件时出错:', error.message);
    }
}

// 执行提取
extractNameMap();