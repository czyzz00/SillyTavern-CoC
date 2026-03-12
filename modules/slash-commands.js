// ==================== 斜杠命令 ====================

function registerSlashCommands(context, data, core) {
    const { rollD100, rollWithBonusPenalty, parseDiceFormula, judgeCOC, calculateDB, calculateMaxHP } = core;
    
    // 获取角色技能值
    function getSkillValue(characterName, skillName) {
        return data.getSkill(characterName, skillName);
    }
    
    // 获取角色属性值
    function getAttributeValue(characterName, attributeName) {
        return data.getAttribute(characterName, attributeName);
    }
    
    // ✅ 修正版：用 /sendas system 让系统发出消息
    function sendMessageAs(text, sender) {
        try {
            // 使用 /sendas system 而不是 /send system
            context.executeSlashCommands(`/sendas system ${text}`);
        } catch (e) {
            console.error('[COC] 发送消息失败:', e);
        }
    }
    
    // 获取可用角色
    function getAvailableCharacters() {
        const characters = [];
        
        if (context.characters) {
            context.characters.forEach(char => {
                if (char?.name) {
                    characters.push(char.name);
                }
            });
        }
        
        if (context.groups && context.groupId) {
            const currentGroup = context.groups.find(g => g.id === context.groupId);
            if (currentGroup?.members) {
                currentGroup.members.forEach(member => {
                    if (member?.name) {
                        characters.push(member.name);
                    }
                });
            }
        }
        
        return [...new Set(characters)].sort();
    }
    
    // ✅ 修正版：COC7成功等级判定
    function judgeCOC7(roll, targetValue, type = 'normal') {
        if (type === 'sanity') {
            return {
                success: roll <= targetValue,
                text: roll <= targetValue ? '成功' : '失败',
                emoji: roll <= targetValue ? '✅' : '❌',
                level: roll <= targetValue ? 'success' : 'fail'
            };
        }
        
        if (roll === 100) return { 
            success: false, 
            text: '大失败', 
            emoji: '💀',
            level: 'critical_fail' 
        };
        if (roll >= 96 && targetValue < 50) return { 
            success: false, 
            text: '大失败', 
            emoji: '💀',
            level: 'critical_fail' 
        };
        if (roll <= Math.floor(targetValue / 5)) return { 
            success: true, 
            text: '极难成功', 
            emoji: '✨',
            level: 'critical_success' 
        };
        if (roll <= Math.floor(targetValue / 2)) return { 
            success: true, 
            text: '困难成功', 
            emoji: '⭐',
            level: 'hard_success' 
        };
        if (roll <= targetValue) return { 
            success: true, 
            text: '成功', 
            emoji: '✅',
            level: 'success' 
        };
        return { 
            success: false, 
            text: '失败', 
            emoji: '❌',
            level: 'fail' 
        };
    }
    
    // 理智检定
    function sanCheck(character, lossFormula, source = '未知恐怖') {
        const char = data.get(character);
        if (!char) return null;
        
        const currentSan = char.stats.SAN || 50;
        const roll = rollD100();
        
        const result = judgeCOC7(roll, currentSan, 'sanity');
        
        const [successLoss, failLoss] = lossFormula.split('/');
        
        let loss;
        if (result.success) {
            loss = parseDiceFormula(successLoss).total;
        } else {
            loss = parseDiceFormula(failLoss).total;
        }
        
        const newSan = Math.max(0, currentSan - loss);
        char.stats.SAN = newSan;
        
        let insanity = null;
        if (newSan <= 0) {
            char.stats.insanity = {
                type: 'permanent',
                phase: 'active',
                startTime: new Date().toISOString()
            };
            insanity = { type: 'permanent' };
        } else if (loss >= 5 && typeof window.triggerTemporaryInsanity === 'function') {
            insanity = window.triggerTemporaryInsanity(character, loss, source);
        }
        
        data.save();
        
        return {
            roll,
            result,
            loss,
            newSan,
            isInsane: newSan <= 0,
            isTemporaryInsanity: loss >= 5 && result.success === false,
            insanity
        };
    }
    
    // 属性中文对照表
    const ATTRIBUTE_NAMES_CN = {
        'STR': '力量',
        'CON': '体质',
        'SIZ': '体型',
        'DEX': '敏捷',
        'APP': '外貌',
        'INT': '智力',
        'POW': '意志',
        'EDU': '教育',
        'LUCK': '幸运'
    };

    // ==================== 原有命令 ====================

    context.registerSlashCommand('coc', (args, value) => {
        const input = value || '';
        
        let targetChar = context.name2 || '未知角色';
        let command = input;
        
        const atMatch = input.match(/@(\S+)/);
        if (atMatch) {
            targetChar = atMatch[1];
            command = input.replace(/@\S+/, '').trim();
        }
        
        if (!command) {
            sendMessageAs('❌ 用法: /coc 侦查 @KP 或 /coc 100');
            return '';
        }
        
        let message = '';
        
        if (/^\d+$/.test(command)) {
            const max = parseInt(command);
            const roll = Math.floor(Math.random() * max) + 1;
            message = `🎲 ${targetChar} 掷出 d${max} = **${roll}**`;
        }
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
        else if (command.match(/[^a-zA-Z]/)) {
            const skillName = command;
            const roll = rollD100();
            const skillValue = getSkillValue(targetChar, skillName);
            const result = judgeCOC7(roll, skillValue);
            
            message = `**${targetChar}** 进行 **${skillName}** 检定\n` +
                     `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                     `结果: ${result.emoji} **${result.text}**`;
        }
        else {
            const attrName = command.toUpperCase();
            const attrValue = getAttributeValue(targetChar, attrName);
            const roll = rollD100();
            const result = judgeCOC7(roll, attrValue);
            
            const attrCN = ATTRIBUTE_NAMES_CN[attrName] || attrName;
            
            message = `**${targetChar}** 进行 **${attrCN}(${attrName})** 属性检定\n` +
                     `🎲 D100 = \`${roll}\` | 属性值 \`${attrValue}\`\n` +
                     `结果: ${result.emoji} **${result.text}**`;
        }
        
        sendMessageAs(message);
        return '';
        
    }, ['cocroll', 'cr'], 'COC命令 - 用@指定角色');

    context.registerSlashCommand('san', (args, value) => {
        const input = value || '';
        
        let targetChar = context.name2 || '未知角色';
        let lossFormula = '1d3/1d6';
        let source = '未知恐怖';
        
        const atMatch = input.match(/@(\S+)/);
        if (atMatch) {
            targetChar = atMatch[1];
            const remaining = input.replace(/@\S+/, '').trim();
            const parts = remaining.split(' ');
            if (parts[0]) lossFormula = parts[0];
            if (parts[1]) source = parts.slice(1).join(' ');
        } else {
            const parts = input.split(' ');
            if (parts[0]) lossFormula = parts[0];
            if (parts[1]) source = parts.slice(1).join(' ');
        }
        
        try {
            const result = sanCheck(targetChar, lossFormula, source);
            if (!result) {
                sendMessageAs(`❌ 角色 ${targetChar} 不存在`);
                return '';
            }
            
            let message = `**${targetChar}** 进行理智检定\n` +
                         `🎲 D100 = \`${result.roll}\` | 当前理智 \`${result.newSan + result.loss}\`\n` +
                         `结果: ${result.result.emoji} **${result.result.text}**，损失 \`${result.loss}\` 点理智\n` +
                         `剩余理智: **${result.newSan}**`;
            
            if (result.insanity) {
                if (result.insanity.type === 'permanent') {
                    message += `\n💔 **角色永久疯狂！**`;
                } else if (result.insanity.triggered) {
                    message += `\n😱 **触发临时疯狂！**\n症状：${result.insanity.symptom}\n持续时间：${result.insanity.duration}小时`;
                }
            } else if (result.isTemporaryInsanity) {
                message += `\n😱 **临时疯狂！**`;
            }
            
            sendMessageAs(message);
        } catch (e) {
            sendMessageAs(`❌ 理智检定格式错误: ${lossFormula}`);
        }
        
        return '';
    }, [], '理智检定 - 格式: /san 1d3/1d6 @角色名 [来源]');

    // /setkp 命令
    context.registerSlashCommand(
        'setkp',
        (args, value) => {
            const kpName = value || args?.name || '';
            
            if (!kpName) {
                const availableChars = getAvailableCharacters().join('、');
                sendMessageAs(`❌ 请指定KP角色名。可用角色: ${availableChars}\n示例: /setkp 克苏鲁`);
                return '';
            }
            
            const availableChars = getAvailableCharacters();
            if (!availableChars.includes(kpName)) {
                sendMessageAs(`❌ 角色 "${kpName}" 不存在。可用角色: ${availableChars.join('、')}`);
                return '';
            }
            
            data.setKP(kpName);
            sendMessageAs(`✅ 已将 ${kpName} 设置为KP。`);
            return '';
            
        },
        ['setkeeper', 'kp'],
        '设置KP角色',
        [
            {
                name: 'name',
                type: 'string',
                description: '角色名',
                required: true,
                enumProvider: () => getAvailableCharacters()
            }
        ]
    );
    
    // /getkp 命令
    context.registerSlashCommand('getkp', () => {
        const kp = data.getKP();
        if (kp) {
            sendMessageAs(`📋 当前KP: ${kp}`);
        } else {
            sendMessageAs('📋 当前未设置KP');
        }
        return '';
    }, [], '查看当前KP');

    // ==================== 其他命令（疯狂、伤害、幸运等）====================
    // ... 这些命令都用 sendMessageAs 发送，已经改好了
    
    console.log('[COC] 斜杠命令注册成功');
}
