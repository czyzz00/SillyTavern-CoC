// COC骰子系统 - 带自动补全和消息保存
// 用法: /coc 技能名 name=角色名 或 /coc 100 name=角色名

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 注册/coc命令 ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 解析参数
                let skillName = '';
                let targetChar = '未知角色';
                
                // 检查是否有name=参数
                if (args && args.name) {
                    targetChar = args.name;
                    skillName = value || '';
                } else {
                    // 兼容旧格式：侦查 @KP
                    const input = value || '';
                    const atMatch = input.match(/@(\S+)/);
                    if (atMatch) {
                        targetChar = atMatch[1];
                        skillName = input.replace(/@\S+/, '').trim();
                    } else {
                        skillName = input;
                        targetChar = context.name2 || '未知角色';
                    }
                }
                
                if (!skillName) {
                    sendAndSaveSystemMessage('❌ 用法: /coc 侦查 name=KP');
                    return '';
                }
                
                // 处理骰子逻辑
                let message = '';
                
                // 纯数字
                if (/^\d+$/.test(skillName)) {
                    const max = parseInt(skillName);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `🎲 ${targetChar} 掷出 d${max} = **${roll}**`;
                }
                // 骰子公式
                else if (skillName.includes('d')) {
                    try {
                        const result = parseDiceFormula(skillName);
                        message = `🎲 ${targetChar} 掷出 ${skillName} = `;
                        if (result.details) {
                            message += `${result.details} = **${result.total}**`;
                        } else {
                            message += `**${result.total}**`;
                        }
                    } catch (e) {
                        message = `❌ 骰子公式错误: ${skillName}`;
                    }
                }
                // 技能检定
                else {
                    const roll = Math.floor(Math.random() * 100) + 1;
                    const skillValue = 50;
                    
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
                
                // 发送并保存系统消息
                sendAndSaveSystemMessage(message);
                return '';
                
            }, 
            ['cocroll', 'cr'], 
            'COC命令 - 用 name=角色名 指定角色',
            // 参数定义 - 这会触发自动补全
            {
                name: {
                    type: 'string',
                    description: '角色名',
                    choices: () => {
                        // 获取所有可用的角色名
                        const context = SillyTavern.getContext();
                        const characters = [];
                        
                        // 添加当前聊天中的角色
                        if (context.characters) {
                            context.characters.forEach(char => {
                                if (char && char.name) {
                                    characters.push(char.name);
                                }
                            });
                        }
                        
                        // 如果是群聊，添加群成员
                        if (context.groups && context.groupId) {
                            const currentGroup = context.groups.find(g => g.id === context.groupId);
                            if (currentGroup && currentGroup.members) {
                                currentGroup.members.forEach(member => {
                                    if (member && member.name) {
                                        characters.push(member.name);
                                    }
                                });
                            }
                        }
                        
                        // 去重
                        return [...new Set(characters)];
                    }
                }
            });
            
            alert('✅ COC命令注册成功！\n\n' +
                  '【用法】\n' +
                  '/coc 100 name=KP - 掷D100\n' +
                  '/coc 2d6+3 name=李昂 - 掷骰子\n' +
                  '/coc 侦查 name=张薇 - 技能检定\n\n' +
                  '【提示】\n' +
                  '输入 name= 时会自动弹出角色列表供选择\n' +
                  '系统消息会自动保存，刷新后不会消失');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

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

// 发送并保存系统消息
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
        
        // 保存到聊天记录
        if (typeof context.saveChat === 'function') {
            context.saveChat();
        }
        
        if (typeof context.addOneMessage === 'function') {
            context.addOneMessage(messageObj);
        }
        
        setTimeout(() => {
            const chatArea = document.getElementById('chat');
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        }, 100);
        
    } catch (e) {
        console.error('发送消息失败:', e);
    }
}
