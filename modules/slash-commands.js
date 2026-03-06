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
    
    // ✅ 修正：发送消息（强制用KP发）
    function sendMessageAs(text, sender) {
        try {
            const kp = data.getKP();
            // 如果有KP，所有消息都由KP发出，忽略sender参数
            const finalSender = kp || sender || 'system';
            context.executeSlashCommands(`/send ${finalSender} ${text}`);
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
    
    // ✅ 修正版：COC7成功等级判定（带类型参数）
    function judgeCOC7(roll, targetValue, type = 'normal') {
        if (type === 'sanity') {
            // 理智检定只有成功/失败
            return {
                success: roll <= targetValue,
                text: roll <= targetValue ? '成功' : '失败',
                emoji: roll <= targetValue ? '✅' : '❌',
                level: roll <= targetValue ? 'success' : 'fail'
            };
        }
        
        // 正常检定有成功等级
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
    
    // ✅ 修正版：理智检定
    function sanCheck(character, lossFormula, source = '未知恐怖') {
        const char = data.get(character);
        if (!char) return null;
        
        const currentSan = char.stats.SAN || 50;
        const roll = rollD100();
        
        // 使用理智检定的判断规则
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
        
        // 检查是否触发疯狂
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
    
    // ==================== 属性中文对照表 ====================
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

    // ✅ 修正版：/coc 命令 - 使用新的judgeCOC7
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
            sendMessageAs('❌ 用法: /coc 侦查 @KP 或 /coc 100', 'system');
            return '';
        }
        
        let message = '';
        
        // 纯数字 - 掷骰子
        if (/^\d+$/.test(command)) {
            const max = parseInt(command);
            const roll = Math.floor(Math.random() * max) + 1;
            message = `🎲 ${targetChar} 掷出 d${max} = **${roll}**`;
        }
        // 骰子公式
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
        // 技能检定
        else if (command.match(/[^a-zA-Z]/)) { // 包含中文，视为技能
            const skillName = command;
            const roll = rollD100();
            const skillValue = getSkillValue(targetChar, skillName);
            const result = judgeCOC7(roll, skillValue);
            
            message = `**${targetChar}** 进行 **${skillName}** 检定\n` +
                     `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                     `结果: ${result.emoji} **${result.text}**`;
        }
        // 属性检定（英文缩写）
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
        
        sendMessageAs(message, 'system');
        return '';
        
    }, ['cocroll', 'cr'], 'COC命令 - 用@指定角色');

    // ✅ 修正版：/san 命令 - 使用新的理智检定
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
                sendMessageAs(`❌ 角色 ${targetChar} 不存在`, 'system');
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
            
            sendMessageAs(message, 'system');
        } catch (e) {
            sendMessageAs(`❌ 理智检定格式错误: ${lossFormula}`, 'system');
        }
        
        return '';
    }, [], '理智检定 - 格式: /san 1d3/1d6 @角色名 [来源]');

    // /setkp 命令（不变）
    context.registerSlashCommand(
        'setkp',
        (args, value) => {
            const kpName = value || args?.name || '';
            
            if (!kpName) {
                const availableChars = getAvailableCharacters().join('、');
                sendMessageAs(`❌ 请指定KP角色名。可用角色: ${availableChars}\n示例: /setkp 克苏鲁`, 'system');
                return '';
            }
            
            const availableChars = getAvailableCharacters();
            if (!availableChars.includes(kpName)) {
                sendMessageAs(`❌ 角色 "${kpName}" 不存在。可用角色: ${availableChars.join('、')}`, 'system');
                return '';
            }
            
            data.setKP(kpName);
            sendMessageAs(`✅ 已将 ${kpName} 设置为KP。从此所有系统消息将由该角色发出。`, 'system');
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
            sendMessageAs(`📋 当前KP: ${kp}`, 'system');
        } else {
            sendMessageAs('📋 当前未设置KP', 'system');
        }
        return '';
    }, [], '查看当前KP');

    // ==================== 其余命令保持不变（但都使用新的 sendMessageAs）====================
    
    // ... 其他命令代码（疯狂、伤害、幸运等）...
    // 注意：所有命令中的 sendMessageAs 已经修改为强制用KP发送
    
    console.log('[COC] 斜杠命令注册成功');
}
