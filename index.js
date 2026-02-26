// COC骰子系统 - 完全自包含版
// 不依赖任何内置命令，全部自己实现

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 1. 骰子命令（完全自己实现）====================
            context.registerSlashCommand('d', (args, value) => {
                // 解析骰子表达式: d100, d20, d6, 2d6, 3d8+2
                const formula = value || '100';
                
                try {
                    // 解析骰子公式
                    const result = parseDiceFormula(formula);
                    
                    // 构建结果消息
                    let message = `🎲 掷出 ${formula} = `;
                    if (result.details) {
                        message += `${result.details} = **${result.total}**`;
                    } else {
                        message += `**${result.total}**`;
                    }
                    
                    // 直接发送消息到聊天窗口（不依赖任何内置命令）
                    appendMessageToChat('system', message);
                    
                } catch (e) {
                    appendMessageToChat('system', `❌ 骰子公式错误: ${formula}`);
                }
                
                return '';
            }, ['roll', 'r'], '掷骰子，例如 /d100、/d20、/2d6+3');
            
            // ==================== 2. COC技能检定命令 ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 获取技能名
                const skillName = value || (args && args[0]) || '未知技能';
                
                // 获取当前说话的角色
                const speaker = context.name2 || '未知角色';
                
                // 掷D100骰子
                const roll = Math.floor(Math.random() * 100) + 1;
                
                // 从世界书或默认值获取技能
                const skillValue = getSkillValue(speaker, skillName);
                
                // COC成功等级判定
                let result = '';
                let emoji = '';
                
                if (roll === 100) {
                    result = '大失败';
                    emoji = '💀';
                } else if (roll >= 96 && skillValue < 50) {
                    result = '大失败';
                    emoji = '💀';
                } else if (roll <= Math.floor(skillValue / 5)) {
                    result = '极难成功';
                    emoji = '✨';
                } else if (roll <= Math.floor(skillValue / 2)) {
                    result = '困难成功';
                    emoji = '⭐';
                } else if (roll <= skillValue) {
                    result = '成功';
                    emoji = '✅';
                } else {
                    result = '失败';
                    emoji = '❌';
                }
                
                // 构建消息
                const message = `**${speaker}** 进行 **${skillName}** 检定\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${emoji} **${result}**`;
                
                // 直接发送消息
                appendMessageToChat('system', message);
                
                return '';
            }, ['cocroll', 'cr'], 'COC技能检定，例如 /coc 侦查');
            
            // ==================== 3. 指定角色发言命令 ====================
            context.registerSlashCommand('sayas', (args, value) => {
                // 格式: /sayas 角色名 要说的内容
                const parts = (value || '').split(' ');
                const characterName = parts[0];
                const message = parts.slice(1).join(' ') || '...';
                
                if (!characterName) {
                    appendMessageToChat('system', '❌ 请指定角色名: /sayas 李昂 你好');
                    return '';
                }
                
                // 直接以指定角色发送消息
                appendMessageToChat(characterName, message);
                
                return '';
            }, [], '以指定角色身份发言，例如 /sayas 李昂 你好');
            
            // ==================== 4. 调试命令 ====================
            context.registerSlashCommand('cotest', () => {
                const info = `当前角色: ${context.name2}\n` +
                            `聊天条数: ${context.chat?.length || 0}\n` +
                            `可用命令: /d, /coc, /sayas`;
                
                appendMessageToChat('system', `📊 调试信息\n${info}`);
                return '';
            }, [], '显示调试信息');
            
            // 弹出成功提示
            alert('✅ COC命令注册成功！\n\n' +
                  '可用命令:\n' +
                  '/d100 - 掷D100骰子\n' +
                  '/coc 侦查 - 技能检定\n' +
                  '/sayas 李昂 你好 - 指定角色发言\n' +
                  '/cotest - 显示调试信息');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// ==================== 辅助函数 ====================

/**
 * 解析骰子公式 (支持格式: d100, 2d6, 3d8+2, d20-1)
 */
function parseDiceFormula(formula) {
    // 移除空格转为小写
    formula = formula.toLowerCase().replace(/\s+/g, '');
    
    // 匹配模式: (数字?)d(数字)(+/-数字)?
    const match = formula.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) {
        throw new Error('无效的骰子格式');
    }
    
    const diceCount = match[1] ? parseInt(match[1]) : 1; // 默认1个骰子
    const diceSides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    if (diceCount > 100) {
        throw new Error('骰子数量不能超过100');
    }
    
    // 掷骰
    let total = 0;
    let rolls = [];
    for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    // 加上调整值
    if (modifier !== 0) {
        total += modifier;
    }
    
    // 构建详细信息
    let details = '';
    if (diceCount > 1) {
        details = `[${rolls.join('+')}]`;
        if (modifier !== 0) {
            details += `${modifier > 0 ? '+' : ''}${modifier}`;
        }
    }
    
    return {
        total: total,
        details: details
    };
}

/**
 * 获取技能值 (优先从世界书读取，否则返回默认值50)
 */
function getSkillValue(characterName, skillName) {
    // 这里可以从世界书解析
    // 简单实现：返回默认值50
    // 后续可以扩展从世界书读取
    return 50;
}

/**
 * 直接发送消息到聊天窗口（不依赖任何内置命令）
 */
function appendMessageToChat(sender, message) {
    try {
        const context = SillyTavern.getContext();
        
        // 创建消息对象
        const messageObj = {
            name: sender,
            is_user: sender === context.name1, // 如果是用户
            is_system: sender === 'system',
            send_date: new Date().toLocaleString(),
            mes: message
        };
        
        // 添加到聊天记录
        if (!context.chat) {
            context.chat = [];
        }
        context.chat.push(messageObj);
        
        // 刷新UI
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
        alert('消息: ' + message); // 备用方案
    }
}
