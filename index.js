// COC骰子系统 - AI自动触发版（基于官方文档）

(function() {
    'use strict';

    const SYSTEM_CHARACTER = "KP";  // 改成你的KP角色名

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // 注册/coc命令（保持不变）
            context.registerSlashCommand('coc', (args, value) => {
                const input = value || '';
                const speaker = context.name2 || '未知角色';
                
                // 处理骰子逻辑（同上）
                let message = '';
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `🎲 ${speaker} 掷出 d${max} = **${roll}**`;
                } else if (input.includes('d')) {
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
                } else {
                    const skillName = input;
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
                    
                    message = `**${speaker}** 进行 **${skillName}** 检定\n` +
                             `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                             `结果: ${emoji} **${result}**`;
                }
                
                sendAsCharacter(SYSTEM_CHARACTER, message);
                return '';
            }, ['cocroll', 'cr'], 'COC多功能命令');
            
            // ✅ 官方方式：监听AI消息事件
            // 根据文档，CHARACTER_MESSAGE_RENDERED 在AI消息显示后触发[citation:7]
            context.eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageIndex, generationType) => {
                // 获取刚发送的AI消息
                const lastMessage = context.chat[context.chat.length - 1];
                if (!lastMessage || lastMessage.is_user || lastMessage.is_system) return;
                
                // 检查消息中是否包含/coc指令
                const content = lastMessage.mes || '';
                const cocMatch = content.match(/\/coc\s+(.+)/);
                
                if (cocMatch) {
                    const commandText = cocMatch[1];
                    
                    // 延迟执行，避免与当前消息处理冲突
                    setTimeout(() => {
                        // 临时切换当前说话者为AI（让骰子结果显示为AI发的）
                        const originalName = context.name2;
                        context.name2 = lastMessage.name;
                        
                        // 执行命令 - 使用官方提供的API[citation:5]
                        context.executeSlashCommands(`/coc ${commandText}`);
                        
                        // 恢复当前说话者
                        context.name2 = originalName;
                    }, 100);
                }
            });
            
            alert(`✅ COC命令注册成功！\n\n` +
                  `用户输入: /coc 100\n` +
                  `AI输入: AI可以在回复中包含 /coc 侦查\n` +
                  `所有结果由【${SYSTEM_CHARACTER}】发出`);
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// 辅助函数（保持不变）
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

function sendAsCharacter(characterName, message) {
    try {
        const context = SillyTavern.getContext();
        // 使用官方 /send 命令[citation:1][citation:8]
        context.executeSlashCommands(`/send ${characterName} ${message}`);
    } catch (e) {
        console.error('发送消息失败:', e);
    }
}
