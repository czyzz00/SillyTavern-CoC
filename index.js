// COC骰子系统 - 稳定版
// 用法: /coc skill=侦查 name=KP

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // 注册/coc命令
            context.registerSlashCommand('coc', (args, value) => {
                const input = value || '';
                
                // 解析参数
                let skillName = '';
                let diceNum = '';
                let formula = '';
                let targetName = context.name2 || '未知角色';
                
                // 解析 name=xxx
                const nameMatch = input.match(/name=(\S+)/);
                if (nameMatch) {
                    targetName = nameMatch[1];
                }
                
                // 解析 skill=xxx
                const skillMatch = input.match(/skill=(\S+)/);
                if (skillMatch) {
                    skillName = skillMatch[1];
                }
                
                // 解析 dice=xxx
                const diceMatch = input.match(/dice=(\d+)/);
                if (diceMatch) {
                    diceNum = diceMatch[1];
                }
                
                // 解析 formula=xxx
                const formulaMatch = input.match(/formula=(\S+)/);
                if (formulaMatch) {
                    formula = formulaMatch[1];
                }
                
                // 生成结果
                let message = '';
                
                if (skillName) {
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
                    
                    message = `**${targetName}** 进行 **${skillName}** 检定\n` +
                             `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                             `结果: ${emoji} **${result}**`;
                }
                else if (diceNum) {
                    const max = parseInt(diceNum);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `🎲 ${targetName} 掷出 d${max} = **${roll}**`;
                }
                else if (formula) {
                    try {
                        const result = parseDiceFormula(formula);
                        message = `🎲 ${targetName} 掷出 ${formula} = `;
                        if (result.details) {
                            message += `${result.details} = **${result.total}**`;
                        } else {
                            message += `**${result.total}**`;
                        }
                    } catch (e) {
                        message = `❌ 骰子公式错误: ${formula}`;
                    }
                }
                else {
                    message = '用法: /coc skill=侦查 name=KP 或 /coc dice=100 name=李昂';
                }
                
                // 直接用你之前测试成功的方式发送
                appendMessageToChat('system', message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC命令');
            
            alert('✅ COC命令注册成功！\n用法: /coc skill=侦查 name=KP');
            
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

// 你测试成功的发送函数
function appendMessageToChat(sender, message) {
    try {
        const context = SillyTavern.getContext();
        
        const messageObj = {
            name: sender,
            is_user: false,
            is_system: sender === 'system',
            send_date: new Date().toLocaleString(),
            mes: message
        };
        
        if (!context.chat) context.chat = [];
        context.chat.push(messageObj);
        
        // 用你之前测试成功的方式
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
