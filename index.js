// COC骰子系统 - 精简版
// 所有消息由指定的SYSTEM角色发出，删除了/sayas

(function() {
    'use strict';

    // 配置：指定谁发出消息（改成你的AI角色名）
    const SYSTEM_CHARACTER = "KP";  // ← 改成你的AI角色名

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 单一命令：/coc ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 获取用户输入（value就是斜杠后面的所有内容）
                const input = value || '';
                
                // 获取当前说话的角色（谁触发的命令）
                const speaker = context.name2 || '未知角色';
                
                // ===== 1. 纯数字 =====
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    // 由SYSTEM_CHARACTER发出消息
                    sendAsCharacter(SYSTEM_CHARACTER, `🎲 ${speaker} 掷出 d${max} = **${roll}**`);
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
                        sendAsCharacter(SYSTEM_CHARACTER, message);
                    } catch (e) {
                        sendAsCharacter(SYSTEM_CHARACTER, `❌ 骰子公式错误: ${input}`);
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
                
                sendAsCharacter(SYSTEM_CHARACTER, message);
                return '';
                
            }, ['cocroll', 'cr'], 'COC多功能命令\n用法:\n/coc 100 - 掷D100\n/coc 2d6+3 - 掷骰子\n/coc 侦查 - 技能检定');
            
            // 弹出成功提示
            alert(`✅ COC命令注册成功！\n\n所有消息将由【${SYSTEM_CHARACTER}】发出\n\n` +
                  '用法:\n' +
                  '/coc 100 - 掷D100\n' +
                  '/coc 2d6+3 - 掷骰子\n' +
                  '/coc 侦查 - 技能检定');
            
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
 * 以指定角色身份发送消息
 * 使用官方内置的 /sendas 命令[citation:5]
 */
function sendAsCharacter(characterName, message) {
    try {
        const context = SillyTavern.getContext();
        // 使用官方内置命令 /sendas [citat
        context.executeSlashCommands(`/sendas ${characterName} ${message}`);
    } catch (e) {
        console.error('发送消息失败:', e);
    }
}
