// COC骰子系统 - 正式版（基于官方文档）

(function() {
    'use strict';

    const MODULE_NAME = 'coc-universal-core'; // 官方推荐的模块名常量[citation:2]

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            const eventSource = context.eventSource; // 官方事件总线[citation:2]
            
            // 获取群聊中的所有角色
            function getAllCharacterNames() {
                const names = [];
                if (context.name1) names.push(context.name1);
                
                if (context.characters && Array.isArray(context.characters)) {
                    context.characters.forEach(char => {
                        if (char && char.name) names.push(char.name);
                    });
                }
                
                if (context.groups && context.groupId) {
                    const currentGroup = context.groups.find(g => g.id === context.groupId);
                    if (currentGroup && currentGroup.members) {
                        currentGroup.members.forEach(member => {
                            if (member && member.name) names.push(member.name);
                        });
                    }
                }
                
                return [...new Set(names)];
            }
            
            // 注册/coc命令[citation:4]
            context.registerSlashCommand('coc', (args, value) => {
                const input = value || '';
                
                // 解析参数
                let skillName = '';
                let diceNum = '';
                let formula = '';
                let targetName = context.name2 || '未知角色';
                
                const nameMatch = input.match(/name=(\S+)/);
                if (nameMatch) {
                    targetName = nameMatch[1];
                }
                
                const skillMatch = input.match(/skill=(\S+)/);
                if (skillMatch) {
                    skillName = skillMatch[1];
                }
                
                const diceMatch = input.match(/dice=(\d+)/);
                if (diceMatch) {
                    diceNum = diceMatch[1];
                }
                
                const formulaMatch = input.match(/formula=(\S+)/);
                if (formulaMatch) {
                    formula = formulaMatch[1];
                }
                
                let message = '';
                
                // 技能检定
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
                    
                    message = `【COC】**${targetName}** 进行 **${skillName}** 检定\n` +
                             `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                             `结果: ${emoji} **${result}**`;
                }
                // 简单掷骰子
                else if (diceNum) {
                    const max = parseInt(diceNum);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `【COC】🎲 ${targetName} 掷出 d${max} = **${roll}**`;
                }
                // 复杂骰子公式
                else if (formula) {
                    try {
                        const result = parseDiceFormula(formula);
                        message = `【COC】🎲 ${targetName} 掷出 ${formula} = `;
                        if (result.details) {
                            message += `${result.details} = **${result.total}**`;
                        } else {
                            message += `**${result.total}**`;
                        }
                    } catch (e) {
                        message = `【COC】❌ 骰子公式错误: ${formula}`;
                    }
                }
                else {
                    const characters = getAllCharacterNames().join('、');
                    message = `【COC】用法:\n` +
                             `/coc skill=侦查 name=KP - 技能检定\n` +
                             `/coc dice=100 name=李昂 - 掷D100\n` +
                             `/coc formula=2d6+3 name=张薇 - 复杂骰子\n\n` +
                             `当前可用角色: ${characters}`;
                }
                
                // 发送系统消息（使用官方方式）
                appendSystemMessage(context, eventSource, message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC命令 - 格式: skill=名称 name=角色');
            
            // 显示成功提示
            setTimeout(() => {
                const characters = getAllCharacterNames().join('、');
                alert(`✅ COC命令注册成功！\n\n` +
                      `【用法】\n` +
                      `• /coc skill=侦查 name=KP\n` +
                      `• /coc dice=100 name=李昂\n` +
                      `• /coc formula=2d6+3 name=张薇\n\n` +
                      `【当前可用角色】\n${characters}`);
            }, 3000);
            
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

// 发送系统消息（官方推荐方式）[citation:2][citation:4]
function appendSystemMessage(context, eventSource, message) {
    try {
        const messageObj = {
            name: 'system',
            is_user: false,
            is_system: true,
            send_date: new Date().toLocaleString(),
            mes: message
        };
        
        // 添加到聊天记录
        if (!context.chat) context.chat = [];
        context.chat.push(messageObj);
        
        // 触发渲染事件（官方方式）
        if (eventSource && typeof eventSource.emit === 'function') {
            eventSource.emit('MESSAGE_RENDERED', { message: messageObj });
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
    }
}
