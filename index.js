// COC骰子系统 - 整合版
// 所有功能通过 /coc 命令实现

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 单一命令：/coc ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 解析输入
                const input = value || (args && args[0]) || '';
                
                // 获取当前说话的角色
                const speaker = context.name2 || '未知角色';
                
                // ===== 1. 纯数字 =====
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    appendMessageToChat('system', `🎲 ${speaker} 掷出 d${max} = **${roll}**`);
                    return '';
                }
                
                // ===== 2. 骰子公式 =====
                if (input.includes('d')) {
                    try {
                        const result = parseDiceFormula(input);
                        let message = `🎲 ${speaker} 掷出 ${input} = `;
                        if (result.details) {
                            message += `${result.details} = **${result.total}**`;
                        } else {
                            message += `**${result.total}**`;
                        }
                        appendMessageToChat('system', message);
                    } catch (e) {
                        appendMessageToChat('system', `❌ 骰子公式错误: ${input}`);
                    }
                    return '';
                }
                
                // ===== 3. 技能检定 =====
                const skillName = input;
                const roll = Math.floor(Math.random() * 100) + 1;
                const skillValue = 50; // 默认技能值
                
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
                
                const message = `**${speaker}** 进行 **${skillName}** 检定\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${emoji} **${result}**`;
                
                appendMessageToChat('system', message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC多功能命令\n用法:\n/coc 100 - 掷D100\n/coc 2d6+3 - 掷骰子\n/coc 侦查 - 技能检定');
            
            // ==================== /sayas 独立命令 ====================
            context.registerSlashCommand('sayas', (args, value) => {
                const parts = (value || '').split(' ');
                const characterName = parts[0];
                const message = parts.slice(1).join(' ') || '...';
                
                if (!characterName) {
                    appendMessageToChat('system', '❌ 请指定角色名: /sayas 李昂 你好');
                    return '';
                }
                
                appendMessageToChat(characterName, message);
                return '';
            }, [], '以指定角色身份发言');
            
            // 弹出成功提示
            alert('✅ COC命令注册成功！\n\n' +
                  '【/coc 命令】\n' +
                  '• 数字: /coc 100 → 掷D100\n' +
                  '• 公式: /coc 2d6+3 → 掷2D6加3\n' +
                  '• 技能: /coc 侦查 → 技能检定\n\n' +
                  '【/sayas】\n' +
                  '• /sayas 李昂 你好');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// ==================== 辅助函数 ====================

/**
 * 解析骰子公式
 */
function parseDiceFormula(formula) {
    formula = formula.toLowerCase().replace(/\s+/g, '');
    const match = formula.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) throw new Error('无效的骰子格式');
    
    const diceCount = match[1] ? parseInt(match[1]) : 1;
    const diceSides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    if (diceCount > 100) throw new Error('骰子数量不能超过100');
    
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

/**
 * 发送消息到聊天窗口
 */
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
