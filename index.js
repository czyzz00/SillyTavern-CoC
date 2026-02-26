// COC骰子系统 - 严谨版
// 所有消息由指定的SYSTEM角色发出，使用精确的角色选择方式

(function() {
    'use strict';

    // 配置：指定谁发出消息（改成你的AI角色名）
    const SYSTEM_CHARACTER = "KP";  // ← 改成你的AI角色名

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 单一命令：/coc ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 获取用户输入
                const input = value || '';
                
                // 获取当前说话的角色（谁触发的命令）
                const speaker = context.name2 || '未知角色';
                
                // 生成骰子结果
                let message = '';
                
                // ===== 1. 纯数字 =====
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `🎲 ${speaker} 掷出 d${max} = **${roll}**`;
                }
                // ===== 2. 骰子公式 =====
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
                // ===== 3. 技能检定 =====
                else {
                    const skillName = input;
                    const roll = Math.floor(Math.random() * 100) + 1;
                    const skillValue = 50;
                    
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
                    
                    message = `**${speaker}** 进行 **${skillName}** 检定\n` +
                             `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                             `结果: ${emoji} **${result}**`;
                }
                
                // 使用精确的角色发送方式
                sendMessageAsCharacter(SYSTEM_CHARACTER, message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC多功能命令');
            
            alert(`✅ COC命令注册成功！\n\n所有消息将由【${SYSTEM_CHARACTER}】发出`);
            
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
 * 以指定角色身份发送消息 - 精确版本
 * 使用官方 /send 命令并指定角色ID
 */
function sendMessageAsCharacter(characterName, message) {
    try {
        const context = SillyTavern.getContext();
        
        // 方法1: 使用 /send 命令（最精确）
        // 格式: /send 角色名|角色ID 消息内容
        context.executeSlashCommands(`/send ${characterName} ${message}`);
        
    } catch (e) {
        console.error('发送消息失败:', e);
        // 降级方案：如果精确发送失败，直接添加到聊天记录
        try {
            const messageObj = {
                name: characterName,
                is_user: false,
                is_system: false,
                send_date: new Date().toLocaleString(),
                mes: message
            };
            
            if (!context.chat) context.chat = [];
            context.chat.push(messageObj);
            
            if (typeof context.addOneMessage === 'function') {
                context.addOneMessage(messageObj);
            }
        } catch (e2) {
            console.error('降级发送也失败:', e2);
        }
    }
}
