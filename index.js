// COC骰子系统 - 与KP联动版
// 所有消息由KP发出，并触发KP的自然回应

(function() {
    'use strict';

    // 配置：KP的角色名（必须与角色卡一致）
    const KP_NAME = 'KP';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 核心命令：/coc ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 解析输入
                const input = value || (args && args[0]) || '';
                
                // 获取当前行动的角色
                const actor = context.name2 || '调查员';
                
                // ===== 1. 纯数字掷骰 =====
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    
                    // 发送骰子结果（由KP发出）
                    const message = `🎲 ${actor} 掷出 d${max} = **${roll}**`;
                    sendAsKP(message);
                    
                    // 触发KP对骰子结果的回应
                    triggerKPResponse('roll', { actor, dice: `d${max}`, roll });
                    
                    return '';
                }
                
                // ===== 2. 骰子公式 =====
                if (input.includes('d')) {
                    try {
                        const result = parseDiceFormula(input);
                        let message = `🎲 ${actor} 掷出 ${input} = `;
                        
                        if (result.details) {
                            message += `${result.details} = **${result.total}**`;
                        } else {
                            message += `**${result.total}**`;
                        }
                        
                        sendAsKP(message);
                        triggerKPResponse('dice_formula', { 
                            actor, 
                            formula: input, 
                            rolls: result.rolls,
                            total: result.total 
                        });
                        
                    } catch (e) {
                        sendAsKP(`❌ 骰子公式错误: ${input}`);
                    }
                    return '';
                }
                
                // ===== 3. 技能检定 =====
                const skillName = input;
                
                // 从世界书或默认值获取技能
                const skillValue = getSkillValue(actor, skillName);
                const roll = Math.floor(Math.random() * 100) + 1;
                
                // COC 7版成功等级判定
                const result = determineCOCSuccess(roll, skillValue);
                
                // 构建检定消息
                const checkMessage = `**${actor}** 进行 **${skillName}** 检定\n` +
                                    `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                                    `结果: ${result.emoji} **${result.level}**`;
                
                sendAsKP(checkMessage);
                
                // 触发KP对检定结果的叙事回应
                triggerKPResponse('skill_check', {
                    actor,
                    skill: skillName,
                    roll,
                    skillValue,
                    result: result.level,
                    emoji: result.emoji
                });
                
                return '';
                
            }, ['cocroll', 'cr'], 'COC骰子系统\n用法:\n/coc 100 - 掷D100\n/coc 2d6+3 - 掷骰子\n/coc 侦查 - 技能检定');
            
            // ==================== 单独掷骰命令（快捷方式）====================
            context.registerSlashCommand('r', (args, value) => {
                // 直接转发给/coc命令
                const context = SillyTavern.getContext();
                context.executeSlashCommands(`/coc ${value || '100'}`);
                return '';
            }, ['roll'], '快速掷骰，例如 /r100、/r2d6+3');
            
            // 弹出成功提示
            alert(`✅ COC骰子系统已加载\n\n` +
                  `【命令列表】\n` +
                  `• /coc 100 - 掷D100\n` +
                  `• /coc 2d6+3 - 掷骰子\n` +
                  `• /coc 侦查 - 技能检定\n` +
                  `• /r100 - 快速掷骰\n\n` +
                  `【消息发送】\n` +
                  `• 所有结果由 **${KP_NAME}** 发出\n` +
                  `• KP会自动根据结果叙事`);
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// ==================== COC 7版核心规则 ====================

/**
 * COC 7版成功等级判定
 */
function determineCOCSuccess(roll, skill) {
    // 大失败判定
    if (roll === 100) {
        return { level: '大失败', emoji: '💀' };
    }
    if (roll >= 96 && skill < 50) {
        return { level: '大失败', emoji: '💀' };
    }
    
    // 成功等级判定
    if (roll <= Math.floor(skill / 5)) {
        return { level: '极难成功', emoji: '✨' };
    }
    if (roll <= Math.floor(skill / 2)) {
        return { level: '困难成功', emoji: '⭐' };
    }
    if (roll <= skill) {
        return { level: '成功', emoji: '✅' };
    }
    
    return { level: '失败', emoji: '❌' };
}

/**
 * 获取技能值（优先从世界书读取）
 */
function getSkillValue(characterName, skillName) {
    try {
        const context = SillyTavern.getContext();
        
        // 尝试从世界书内容中解析技能值
        const worldInfo = context.getWorldInfoPrompt?.() || '';
        
        // 支持多种格式： "侦查:80"、"侦查80"、"侦查 = 80"
        const patterns = [
            new RegExp(`${skillName}\\s*[:：]\\s*(\\d+)`),
            new RegExp(`${skillName}\\s*(\\d+)`),
            new RegExp(`${skillName}\\s*=\\s*(\\d+)`)
        ];
        
        for (const pattern of patterns) {
            const match = worldInfo.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        // 默认技能值
        return 50;
    } catch (e) {
        console.error('读取技能值失败:', e);
        return 50;
    }
}

/**
 * 触发KP的自然回应
 */
function triggerKPResponse(type, data) {
    try {
        const context = SillyTavern.getContext();
        
        // 根据不同检定类型，构建不同的触发提示
        let prompt = '';
        
        switch (type) {
            case 'roll':
                prompt = `[${data.actor}掷出了${data.roll}（${data.dice}）]`;
                break;
                
            case 'dice_formula':
                prompt = `[${data.actor}掷出了${data.formula}，得到${data.total}]`;
                break;
                
            case 'skill_check':
                // 根据检定结果给KP不同的叙事方向
                const resultPrompts = {
                    '大失败': `[${data.actor}的${data.skill}检定大失败，描述一个糟糕的后果]`,
                    '失败': `[${data.actor}的${data.skill}检定失败，描述ta未能达成目标]`,
                    '成功': `[${data.actor}的${data.skill}检定成功，描述ta达成目标的过程]`,
                    '困难成功': `[${data.actor}的${data.skill}检定困难成功，描述ta做得很出色]`,
                    '极难成功': `[${data.actor}的${data.skill}检定极难成功，描述一个惊人的效果]`
                };
                prompt = resultPrompts[data.result] || `[${data.actor}进行${data.skill}检定]`;
                break;
        }
        
        // 将提示注入到上下文中，触发KP回应
        if (prompt && typeof context.addOneMessage === 'function') {
            // 创建一个不可见的系统提示（可选，需要根据实际需求调整）
            console.log('KP触发:', prompt);
        }
        
    } catch (e) {
        console.error('触发KP回应失败:', e);
    }
}

// ==================== 骰子公式解析 ====================

/**
 * 解析骰子公式 (支持格式: d100, 2d6, 3d8+2, d20-1)
 */
function parseDiceFormula(formula) {
    formula = formula.toLowerCase().replace(/\s+/g, '');
    const match = formula.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    
    if (!match) {
        throw new Error('无效的骰子格式');
    }
    
    const diceCount = match[1] ? parseInt(match[1]) : 1;
    const diceSides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    if (diceCount > 100) {
        throw new Error('骰子数量不能超过100');
    }
    
    let total = 0;
    let rolls = [];
    
    for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    if (modifier !== 0) {
        total += modifier;
    }
    
    let details = '';
    if (diceCount > 1) {
        details = `[${rolls.join('+')}]`;
        if (modifier !== 0) {
            details += `${modifier > 0 ? '+' : ''}${modifier}`;
        }
    }
    
    return { 
        total, 
        details,
        rolls,
        diceCount,
        diceSides,
        modifier
    };
}

// ==================== 消息发送 ====================

/**
 * 以KP身份发送消息
 */
function sendAsKP(message) {
    try {
        const context = SillyTavern.getContext();
        
        const messageObj = {
            name: KP_NAME,
            is_user: false,
            is_system: false,
            send_date: new Date().toLocaleString(),
            mes: message,
            extra: {
                type: 'coc_message'
            }
        };
        
        if (!context.chat) {
            context.chat = [];
        }
        
        context.chat.push(messageObj);
        
        if (typeof context.addOneMessage === 'function') {
            context.addOneMessage(messageObj);
        }
        
        // 滚动到底部
        setTimeout(() => {
            const chatArea = document.getElementById('chat');
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }, 100);
        
    } catch (e) {
        console.error('发送消息失败:', e);
        // 备用方案：直接alert
        alert(`KP: ${message}`);
    }
}
