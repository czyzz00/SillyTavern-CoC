// COC骰子系统 - 系统发出结果版（带消息保存）
// 用法: /coc 技能名 @角色名 或 /coc 100 @角色名
// 结果由【系统】发出，避免AI混淆

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // 注册/coc命令
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
                    appendSystemMessage('❌ 用法: /coc 侦查 @KP 或 /coc 100 @李昂');
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
                
                // 由系统发出消息
                appendSystemMessage(message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC命令 - 用@指定角色，结果由系统发出');
            
            alert('✅ COC命令注册成功！\n\n' +
                  '【用法】\n' +
                  '/coc 100 @角色名 - 掷D100\n' +
                  '/coc 2d6+3 @角色名 - 掷骰子\n' +
                  '/coc 侦查 @角色名 - 技能检定\n\n' +
                  '【示例】\n' +
                  '/coc 侦查 @KP\n' +
                  '/coc 100 @李昂\n\n' +
                  '【注意】\n' +
                  '结果由【系统】发出，AI不会混淆\n' +
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

// 发送系统消息并保存
function appendSystemMessage(message) {
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
        
        // 保存聊天记录
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
