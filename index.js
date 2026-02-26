// COC骰子系统 - 官方API版

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // 定义name参数的枚举提供器（用于自动补全）
            const characterEnumProvider = () => {
                const characters = [];
                
                // 获取所有角色
                if (context.characters) {
                    context.characters.forEach(char => {
                        if (char?.name) {
                            characters.push(char.name);
                        }
                    });
                }
                
                // 群聊成员
                if (context.groups && context.groupId) {
                    const currentGroup = context.groups.find(g => g.id === context.groupId);
                    if (currentGroup?.members) {
                        currentGroup.members.forEach(member => {
                            if (member?.name) {
                                characters.push(member.name);
                            }
                        });
                    }
                }
                
                return [...new Set(characters)];
            };
            
            // 注册/coc命令 - 按照官方API格式
            context.registerSlashCommand(
                'coc',                                   // 命令名
                (args, value) => {                       // 回调函数
                    const skillName = value || '';
                    const targetChar = args?.name || context.name2 || '未知角色';
                    
                    if (!skillName) {
                        sendAndSaveSystemMessage('❌ 用法: /coc 侦查 name=zeen');
                        return '';
                    }
                    
                    // 处理骰子逻辑
                    let message = '';
                    
                    if (/^\d+$/.test(skillName)) {
                        const max = parseInt(skillName);
                        const roll = Math.floor(Math.random() * max) + 1;
                        message = `🎲 ${targetChar} 掷出 d${max} = **${roll}**`;
                    }
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
                    
                    sendAndSaveSystemMessage(message);
                    return '';
                },
                ['cocroll', 'cr'],                        // 别名数组
                'COC命令 - 用 name=角色名 指定角色',       // 帮助文本
                [                                          // 命名参数定义
                    {
                        name: 'name',
                        type: 'string',
                        description: '选择角色',
                        enumProvider: characterEnumProvider, // 自动补全提供器
                        required: false
                    }
                ],
                [                                          // 无名参数定义（可选）
                    {
                        type: 'string',
                        description: '技能名或骰子公式',
                        required: true
                    }
                ]
            );
            
            alert('✅ COC命令注册成功！\n\n' +
                  '【用法】\n' +
                  '/coc 侦查 name=zeen\n' +
                  '/coc 100 name=KP\n' +
                  '/coc 2d6+3 name=李昂\n\n' +
                  '输入 name= 时会自动弹出角色列表');
            
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
