// COC骰子系统 - 函数调用版（基于官方文档）

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 注册Slash命令（手动使用）====================
            context.registerSlashCommand('coc', (args, value) => {
                const input = value || '';
                const speaker = context.name2 || '未知角色';
                
                // 处理骰子逻辑
                let message = '';
                
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `🎲 ${speaker} 掷出 d${max} = **${roll}**`;
                }
                else if (input.includes('d')) {
                    try {
                        const result = parseDiceFormula(input);
                        message = `🎲 ${speaker} 掷出 ${input} = `;
                        if (result.details) {
                            message += `${result.details} = **${result.total}**`;
                        } else {
                            message += `**${result.total}**`;
                        }
                    } catch (e) {
                        message = `❌ 骰子公式错误: ${input}`;
                    }
                }
                else {
                    const skillName = input;
                    const roll = Math.floor(Math.random() * 100) + 1;
                    const skillValue = 50;
                    
                    const result = judgeCOCRoll(roll, skillValue);
                    message = `**${speaker}** 进行 **${skillName}** 检定\n` +
                             `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                             `结果: ${result.emoji} **${result.text}**`;
                }
                
                appendMessageToChat(speaker, message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC多功能命令');
            
            // ==================== 注册函数调用（AI自动使用）====================
            if (context.isToolCallingSupported()) {
                
                // 1. 掷骰子函数
                context.registerFunctionTool({
                    name: "roll_dice",
                    displayName: "掷骰子",
                    description: "当需要掷骰子时调用。支持各种骰子表达式，如d100、2d6+3。",
                    parameters: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        type: 'object',
                        properties: {
                            expression: {
                                type: 'string',
                                description: '骰子表达式，例如："d100"、"2d6+3"、"3d8"'
                            },
                            reason: {
                                type: 'string',
                                description: '掷骰子的原因或目的'
                            }
                        },
                        required: ['expression']
                    },
                    action: async ({ expression, reason = '' }) => {
                        try {
                            const result = parseDiceFormula(expression);
                            const rollDetails = result.details ? `${result.details} = ` : '';
                            return `🎲 掷出 ${expression} = ${rollDetails}**${result.total}**`;
                        } catch (e) {
                            return `❌ 骰子表达式错误: ${expression}`;
                        }
                    },
                    formatMessage: ({ expression }) => {
                        return `🎲 掷骰子: ${expression}`;
                    }
                });
                
                // 2. COC技能检定函数
                context.registerFunctionTool({
                    name: "coc_skill_check",
                    displayName: "COC技能检定",
                    description: "进行克苏鲁呼唤7版技能检定。当角色尝试使用技能时调用。",
                    parameters: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        type: 'object',
                        properties: {
                            character: {
                                type: 'string',
                                description: '进行检定的角色名'
                            },
                            skill: {
                                type: 'string',
                                description: '技能名称，如："侦查"、"聆听"、"图书馆使用"'
                            },
                            skillValue: {
                                type: 'number',
                                description: '技能值，默认为50',
                                default: 50
                            }
                        },
                        required: ['character', 'skill']
                    },
                    action: async ({ character, skill, skillValue = 50 }) => {
                        const roll = Math.floor(Math.random() * 100) + 1;
                        const result = judgeCOCRoll(roll, skillValue);
                        
                        return `🎲 ${character}的${skill}检定: D100=${roll} | 技能值=${skillValue} | 结果: ${result.emoji} ${result.text}`;
                    },
                    formatMessage: ({ character, skill }) => {
                        return `🎲 ${character}进行${skill}检定`;
                    }
                });
                
                console.log('[COC] 函数调用注册成功');
                alert('✅ 函数调用已启用！AI可以自动掷骰子');
                
            } else {
                console.log('[COC] 当前模型不支持函数调用');
            }
            
            alert('✅ COC扩展加载成功！\n\n' +
                  '【手动指令】\n' +
                  '/coc 100 - 掷D100\n' +
                  '/coc 2d6+3 - 掷骰子\n' +
                  '/coc 侦查 - 技能检定\n\n' +
                  '【AI自动】\n' +
                  '如果模型支持函数调用，AI会自动掷骰子\n' +
                  '需要在设置中开启"启用函数调用"');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// ==================== 辅助函数 ====================

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

function judgeCOCRoll(roll, skillValue) {
    if (roll === 100) {
        return { text: '大失败', emoji: '💀' };
    }
    if (roll >= 96 && skillValue < 50) {
        return { text: '大失败', emoji: '💀' };
    }
    if (roll <= Math.floor(skillValue / 5)) {
        return { text: '极难成功', emoji: '✨' };
    }
    if (roll <= Math.floor(skillValue / 2)) {
        return { text: '困难成功', emoji: '⭐' };
    }
    if (roll <= skillValue) {
        return { text: '成功', emoji: '✅' };
    }
    return { text: '失败', emoji: '❌' };
}

function appendMessageToChat(sender, message) {
    try {
        const context = SillyTavern.getContext();
        
        const messageObj = {
            name: sender,
            is_user: sender === context.name1,
            is_system: sender === 'system',
            send_date: new Date().toLocaleString(),
            mes: message
        };
        
        if (!context.chat) context.chat = [];
        context.chat.push(messageObj);
        
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
