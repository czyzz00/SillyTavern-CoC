// COC骰子系统 - 完整版（带角色数据存储）
// 用法: /coc 技能名 @角色名 或 /coc 100 @角色名
// 结果由【系统】发出，避免AI混淆
// 角色数据保存在 data/[用户]/attachments/characters/[角色名]/coc-stats.json

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 角色数据存储功能 ====================
            
            const COC_STATS_FILE = 'coc-stats.json';

            // 保存角色数据
            function saveCharacterStats(characterName, stats) {
                try {
                    const context = SillyTavern.getContext();
                    
                    const attachmentsPath = context.getUserDirectories?.()?.attachments;
                    if (!attachmentsPath) {
                        console.error('无法获取附件目录');
                        return false;
                    }
                    
                    const charAttachPath = path.join(attachmentsPath, 'characters', characterName);
                    
                    if (!fs.existsSync(charAttachPath)) {
                        fs.mkdirSync(charAttachPath, { recursive: true });
                    }
                    
                    const filePath = path.join(charAttachPath, COC_STATS_FILE);
                    fs.writeFileSync(filePath, JSON.stringify(stats, null, 2));
                    
                    return true;
                } catch (e) {
                    console.error('保存角色数据失败:', e);
                    return false;
                }
            }

            // 读取角色数据
            function loadCharacterStats(characterName) {
                try {
                    const context = SillyTavern.getContext();
                    
                    const attachmentsPath = context.getUserDirectories?.()?.attachments;
                    if (!attachmentsPath) return null;
                    
                    const filePath = path.join(attachmentsPath, 'characters', characterName, COC_STATS_FILE);
                    
                    if (!fs.existsSync(filePath)) return null;
                    
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (e) {
                    console.error('读取角色数据失败:', e);
                    return null;
                }
            }

            // 导出角色数据
            function exportCharacterStats(characterName) {
                const stats = loadCharacterStats(characterName);
                if (!stats) {
                    sendAndSaveSystemMessage(`❌ 角色 ${characterName} 没有数据`);
                    return null;
                }
                
                const exportData = {
                    character: characterName,
                    version: '1.0',
                    stats: stats,
                    exportDate: new Date().toISOString()
                };
                
                return JSON.stringify(exportData, null, 2);
            }

            // 导入角色数据
            function importCharacterStats(characterName, jsonString) {
                try {
                    const importData = JSON.parse(jsonString);
                    
                    if (!importData.stats) {
                        sendAndSaveSystemMessage('❌ 无效的导入文件格式');
                        return false;
                    }
                    
                    const targetChar = characterName || importData.character;
                    return saveCharacterStats(targetChar, importData.stats);
                } catch (e) {
                    sendAndSaveSystemMessage('❌ 导入失败: ' + e.message);
                    return false;
                }
            }

            // 获取技能值（优先从存储读取）
            function getSkillValue(characterName, skillName) {
                const stats = loadCharacterStats(characterName);
                if (stats?.skills && stats.skills[skillName]) {
                    return stats.skills[skillName];
                }
                if (stats?.[skillName.toUpperCase()]) {
                    return stats[skillName.toUpperCase()] * 5;
                }
                return 50; // 默认值
            }

            // ==================== 注册/cocstat命令 ====================
            context.registerSlashCommand('cocstat', (args, value) => {
                const action = args?.action || '';
                const character = args?.char || context.name2;
                const data = args?.data || '';
                
                if (!character) {
                    sendAndSaveSystemMessage('❌ 请指定角色名: /cocstat get char=李昂');
                    return '';
                }
                
                switch (action) {
                    case 'get':
                        const stats = loadCharacterStats(character);
                        if (stats) {
                            sendAndSaveSystemMessage(`📊 ${character} 的数据:\n${JSON.stringify(stats, null, 2)}`);
                        } else {
                            sendAndSaveSystemMessage(`❌ ${character} 没有数据`);
                        }
                        break;
                        
                    case 'save':
                        // 示例数据
                        const exampleStats = {
                            STR: 70,
                            DEX: 50,
                            CON: 60,
                            APP: 50,
                            POW: 60,
                            SIZ: 60,
                            INT: 70,
                            EDU: 60,
                            skills: {
                                '侦查': 80,
                                '聆听': 70,
                                '图书馆使用': 60,
                                '说服': 50,
                                '潜行': 40,
                                '格斗(斗殴)': 60,
                                '射击': 50,
                                '急救': 50,
                                '医学': 30
                            }
                        };
                        if (saveCharacterStats(character, exampleStats)) {
                            sendAndSaveSystemMessage(`✅ ${character} 的示例数据已保存`);
                        }
                        break;
                        
                    case 'edit':
                        const currentStats = loadCharacterStats(character) || {};
                        sendAndSaveSystemMessage(`📝 请使用 /cocstat import char=${character} data='{...}' 导入修改后的数据`);
                        break;
                        
                    case 'export':
                        const exportJson = exportCharacterStats(character);
                        if (exportJson) {
                            const blob = new Blob([exportJson], {type: 'application/json'});
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${character}-coc-stats.json`;
                            a.click();
                            sendAndSaveSystemMessage(`✅ ${character} 的数据已导出`);
                        }
                        break;
                        
                    case 'import':
                        if (data) {
                            if (importCharacterStats(character, data)) {
                                sendAndSaveSystemMessage(`✅ ${character} 的数据已导入`);
                            }
                        } else {
                            sendAndSaveSystemMessage('❌ 请提供数据: /cocstat import char=李昂 data=\'{"stats":{...}}\'');
                        }
                        break;
                        
                    case 'list':
                        sendAndSaveSystemMessage('📋 可用命令:\n' +
                            '/cocstat get char=角色 - 读取\n' +
                            '/cocstat save char=角色 - 保存示例\n' +
                            '/cocstat edit char=角色 - 编辑\n' +
                            '/cocstat export char=角色 - 导出\n' +
                            '/cocstat import char=角色 data=\'{...}\' - 导入');
                        break;
                        
                    default:
                        sendAndSaveSystemMessage('用法:\n/cocstat list - 查看所有命令');
                }
                
                return '';
            }, ['cocstats'], '管理COC角色数据');
            
            // ==================== 注册/coc命令 ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 解析输入，支持格式: "侦查 @KP" 或 "100 @李昂"
                const input = value || '';
                
                // 解析角色名（如果有@）
                let targetChar = '未知角色';
                let command = input;
                
                const atMatch = input.match(/@(\S+)/);
                if (atMatch) {
                    targetChar = atMatch[1];
                    command = input.replace(/@\S+/, '').trim();
                }
                
                // 如果命令为空，显示帮助
                if (!command) {
                    sendAndSaveSystemMessage('❌ 用法: /coc 侦查 @KP 或 /coc 100 @李昂');
                    return '';
                }
                
                // 处理骰子逻辑
                let message = '';
                
                // 纯数字 - 例如 /coc 100 @KP
                if (/^\d+$/.test(command)) {
                    const max = parseInt(command);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `🎲 ${targetChar} 掷出 d${max} = **${roll}**`;
                }
                // 骰子公式 - 例如 /coc 2d6+3 @KP
                else if (command.includes('d')) {
                    try {
                        const result = parseDiceFormula(command);
                        message = `🎲 ${targetChar} 掷出 ${command} = `;
                        if (result.details) {
                            message += `${result.details} = **${result.total}**`;
                        } else {
                            message += `**${result.total}**`;
                        }
                    } catch (e) {
                        message = `❌ 骰子公式错误: ${command}`;
                    }
                }
                // 技能检定 - 例如 /coc 侦查 @KP
                else {
                    const skillName = command;
                    const roll = Math.floor(Math.random() * 100) + 1;
                    
                    // 从存储读取技能值
                    const skillValue = getSkillValue(targetChar, skillName);
                    
                    let result = '';
                    let emoji = '';
                    
                    if (roll === 100) {
                        result = '大失败'; emoji = '💀';
                    } else if (roll >= 96 && skillValue < 50) {
                        result = '大失败'; emoji = '💀';
                    } else if (roll <= Math.floor(skillValue / 5)) {
                        result = '极难成功'; emoji = '✨';
                    } else if (roll <= Math.floor(skillValue / 2)) {
                        result = '困难成功'; emoji = '⭐';
                    } else if (roll <= skillValue) {
                        result = '成功'; emoji = '✅';
                    } else {
                        result = '失败'; emoji = '❌';
                    }
                    
                    message = `**${targetChar}** 进行 **${skillName}** 检定\n` +
                             `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                             `结果: ${emoji} **${result}**`;
                }
                
                // 由系统发出消息
                sendAndSaveSystemMessage(message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC命令 - 用@指定角色，结果由系统发出');
            
            alert('✅ COC命令注册成功！\n\n' +
                  '【基本用法】\n' +
                  '/coc 100 @角色名 - 掷D100\n' +
                  '/coc 2d6+3 @角色名 - 掷骰子\n' +
                  '/coc 侦查 @角色名 - 技能检定\n\n' +
                  '【数据管理】\n' +
                  '/cocstat save char=角色 - 保存示例数据\n' +
                  '/cocstat get char=角色 - 读取数据\n' +
                  '/cocstat export char=角色 - 导出数据\n' +
                  '/cocstat import char=角色 data=\'{...}\' - 导入数据\n\n' +
                  '【示例】\n' +
                  '/coc 侦查 @KP\n' +
                  '/coc 100 @李昂\n\n' +
                  '【注意】\n' +
                  '结果由【系统】发出，AI不会混淆\n' +
                  '技能值会从存储自动读取');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// ==================== 辅助函数 ====================

// 解析骰子公式
function parseDiceFormula(formula) {
    formula = formula.toLowerCase().replace(/\s+/g, '');
    const match = formula.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) throw new Error('无效的骰子格式');
    
    const diceCount = match[1] ? parseInt(match[1]) : 1;
    const diceSides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let total = 0;
    let rolls = [];
    for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    if (modifier !== 0) total += modifier;
    
    let details = '';
    if (diceCount > 1) {
        details = `[${rolls.join('+')}]`;
        if (modifier !== 0) {
            details += `${modifier > 0 ? '+' : ''}${modifier}`;
        }
    }
    
    return { total, details };
}

// 发送系统消息并保存
function sendAndSaveSystemMessage(message) {
    try {
        const context = SillyTavern.getContext();
        
        const messageObj = {
            name: 'system',
            is_user: false,
            is_system: true,
            send_date: new Date().toLocaleString(),
            mes: message
        };
        
        if (!context.chat) context.chat = [];
        context.chat.push(messageObj);
        
        if (typeof context.addOneMessage === 'function') {
            context.addOneMessage(messageObj);
        }
        
        if (typeof context.saveChat === 'function') {
            context.saveChat();
        }
        
        setTimeout(() => {
            const chatArea = document.getElementById('chat');
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }, 100);
        
    } catch (e) {
        console.error('发送消息失败:', e);
    }
}
