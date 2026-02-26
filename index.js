// COC骰子系统 - 精简版
// 让KP发出检定结果

(function() {
    'use strict';

    // KP角色名（必须与角色卡一致）
    const KP_NAME = 'KP';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 核心命令：/coc ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 解析输入
                const input = value || (args && args[0]) || '';
                
                // 获取当前说话的角色
                const actor = context.name2 || '调查员';
                
                // ===== 1. 纯数字掷骰 =====
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    const message = `🎲 ${actor} 掷出 d${max} = **${roll}**`;
                    sendAsKP(message);
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
                    } catch (e) {
                        sendAsKP(`❌ 骰子公式错误: ${input}`);
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
                
                const message = `**${actor}** 进行 **${skillName}** 检定\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${emoji} **${result}**`;
                
                sendAsKP(message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC骰子系统');
            
            // 弹出成功提示
            alert(`✅ COC骰子系统已加载\n所有结果由 ${KP_NAME} 发出`);
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// ==================== 骰子公式解析 ====================
function parseDiceFormula(formula) {
    formula = formula.toLowerCase().replace(/\s+/g, '');
    const match = formula.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    
    if (!match) {
        throw new Error('无效的骰子格式');
    }
    
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
    
    return { total, details };
}

// ==================== 消息发送 ====================
function sendAsKP(message) {
    try {
        const context = SillyTavern.getContext();
        
        // 创建消息对象
        const messageObj = {
            name: KP_NAME,
            is_user: false,
            is_system: false,
            send_date: new Date().toLocaleString(),
            mes: message
        };
        
        // 添加到聊天记录
        if (!context.chat) {
            context.chat = [];
        }
        context.chat.push(messageObj);
        
        // 显示在界面上
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
        alert(`KP: ${message}`); // 备用
    }
}
