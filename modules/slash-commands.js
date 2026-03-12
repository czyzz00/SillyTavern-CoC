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
    
    // ✅ 发送消息（统一由 system 发出）
    function sendMessageAs(text) {
        try {
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
    
    // ✅ COC7成功等级判定
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

    // ==================== 1. 基础指令 ====================

    /**
     * /coc - 多功能指令（技能检定、掷骰子、属性检定）
     */
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
        // 技能检定（包含中文）
        else if (command.match(/[^a-zA-Z]/)) {
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
        
        sendMessageAs(message);
        return '';
        
    }, ['cocroll', 'cr'], 'COC命令 - 用@指定角色');

    /**
     * /san - 理智检定
     */
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
            const char = data.get(targetChar);
            if (!char) {
                sendMessageAs(`❌ 角色 ${targetChar} 不存在`);
                return '';
            }
            
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
                insanity = window.triggerTemporaryInsanity(targetChar, loss, source);
            }
            
            data.save();
            
            let message = `**${targetChar}** 进行理智检定\n` +
                         `🎲 D100 = \`${roll}\` | 当前理智 \`${newSan + loss}\`\n` +
                         `结果: ${result.emoji} **${result.text}**，损失 \`${loss}\` 点理智\n` +
                         `剩余理智: **${newSan}**`;
            
            if (insanity) {
                if (insanity.type === 'permanent') {
                    message += `\n💔 **角色永久疯狂！**`;
                } else if (insanity.triggered) {
                    message += `\n😱 **触发临时疯狂！**\n症状：${insanity.symptom}\n持续时间：${insanity.duration}小时`;
                }
            } else if (loss >= 5 && result.success === false) {
                message += `\n😱 **临时疯狂！**`;
            }
            
            sendMessageAs(message);
        } catch (e) {
            sendMessageAs(`❌ 理智检定格式错误: ${lossFormula}`);
        }
        
        return '';
    }, [], '理智检定 - 格式: /san 1d3/1d6 @角色名 [来源]');

    // ==================== 2. KP设置指令 ====================

    /**
     * /setkp - 设置KP
     */
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
    
    /**
     * /getkp - 查看当前KP
     */
    context.registerSlashCommand('getkp', () => {
        const kp = data.getKP();
        if (kp) {
            sendMessageAs(`📋 当前KP: ${kp}`);
        } else {
            sendMessageAs('📋 当前未设置KP');
        }
        return '';
    }, [], '查看当前KP');

    // ==================== 3. 疯狂系统指令 ====================

    /**
     * /insanity - 触发临时疯狂
     */
    context.registerSlashCommand('insanity', (args, value) => {
        const parts = value.split(' ');
        const charName = parts[0];
        const sanLoss = parseInt(parts[1]) || 5;
        const source = parts.slice(2).join(' ') || '未知恐怖';
        
        if (typeof window.triggerTemporaryInsanity !== 'function') {
            sendMessageAs('❌ 疯狂系统未加载');
            return '';
        }
        
        const result = window.triggerTemporaryInsanity(charName, sanLoss, source);
        
        if (!result) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        if (!result.triggered) {
            sendMessageAs(`✅ ${charName} 的智力检定失败，压抑了恐怖记忆（${result.reason}）`);
            return '';
        }
        
        sendMessageAs(`😱 **${charName} 陷入临时疯狂！**\n` +
                     `症状：${result.symptom}\n` +
                     `持续时间：${result.duration}小时\n` +
                     `来源：${result.source}`);
        return '';
    }, [], '触发临时疯狂 - 格式: /insanity 李昂 5 目睹深潜者');

    /**
     * /endinsanity - 结束疯狂发作
     */
    context.registerSlashCommand('endinsanity', (args, value) => {
        const charName = value;
        
        if (typeof window.endInsanityEpisode !== 'function') {
            sendMessageAs('❌ 疯狂系统未加载');
            return '';
        }
        
        const result = window.endInsanityEpisode(charName);
        
        if (!result) {
            sendMessageAs(`❌ 角色 ${charName} 没有处于疯狂状态`);
            return '';
        }
        
        let message = `✅ **${charName}** 的疯狂发作结束，进入潜在疯狂阶段`;
        if (result.summarySymptom) {
            message += `\n总结症状：${result.summarySymptom}`;
        }
        
        sendMessageAs(message);
        return '';
    }, [], '结束疯狂发作 - 格式: /endinsanity 李昂');

    /**
     * /reality - 现实认知检定
     */
    context.registerSlashCommand('reality', (args, value) => {
        const charName = value;
        
        if (typeof window.realityCheck !== 'function') {
            sendMessageAs('❌ 疯狂系统未加载');
            return '';
        }
        
        const result = window.realityCheck(charName);
        
        if (!result || !result.allowed) {
            sendMessageAs(`❌ ${charName} 不在潜在疯狂阶段`);
            return '';
        }
        
        if (result.success) {
            sendMessageAs(`✨ **${charName}** 现实认知检定成功！\n` +
                         `🎲 D100 = ${result.roll} | 理智 ${result.san}\n` +
                         `结果：你意识到眼前景象的虚幻本质`);
        } else {
            sendMessageAs(`😵 **${charName}** 现实认知检定失败！\n` +
                         `🎲 D100 = ${result.roll} | 理智 ${result.san}\n` +
                         `结果：损失1点理智，剩余 ${result.newSan}`);
        }
        return '';
    }, [], '现实认知检定 - 格式: /reality 李昂');

    /**
     * /insanitystatus - 查看疯狂状态
     */
    context.registerSlashCommand('insanitystatus', (args, value) => {
        const charName = value;
        const char = data.get(charName);
        
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        const insanity = char.stats.insanity;
        if (!insanity) {
            sendMessageAs(`✅ ${charName} 目前神智清醒，无疯狂状态`);
            return '';
        }
        
        let status = '';
        if (insanity.phase === 'active') {
            status += '🔴 疯狂发作中\n';
        } else if (insanity.phase === 'latent') {
            status += '🟡 潜在疯狂\n';
        }
        
        if (insanity.type === 'temporary') {
            status += `类型：临时疯狂\n`;
            status += `症状：${insanity.symptom}\n`;
            status += `剩余时间：${insanity.duration}小时\n`;
        } else if (insanity.type === 'indefinite') {
            status += `类型：不定性疯狂\n`;
            status += `症状：${insanity.symptom}\n`;
        } else if (insanity.type === 'permanent') {
            status += `类型：永久疯狂\n`;
        }
        
        if (insanity.source) {
            status += `来源：${insanity.source}\n`;
        }
        
        const phobias = char.stats.phobias || [];
        if (phobias.length > 0) {
            status += `\n恐惧症：${phobias.map(p => p.name).join('、')}\n`;
        }
        
        const manias = char.stats.manias || [];
        if (manias.length > 0) {
            status += `躁狂症：${manias.map(m => m.name).join('、')}\n`;
        }
        
        sendMessageAs(status);
        return '';
    }, [], '查看疯狂状态 - 格式: /insanitystatus 李昂');

    /**
     * /addphobia - 添加恐惧症
     */
    context.registerSlashCommand('addphobia', (args, value) => {
        const parts = value.split(' ');
        const charName = parts[0];
        const phobia = parts.slice(1).join(' ');
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        if (!char.stats.phobias) char.stats.phobias = [];
        char.stats.phobias.push({
            name: phobia,
            source: 'KP设定'
        });
        
        data.save();
        sendMessageAs(`✅ 已为 ${charName} 添加恐惧症：${phobia}`);
        return '';
    }, [], '添加恐惧症 - 格式: /addphobia 李昂 恐高症');

    /**
     * /addmania - 添加躁狂症
     */
    context.registerSlashCommand('addmania', (args, value) => {
        const parts = value.split(' ');
        const charName = parts[0];
        const mania = parts.slice(1).join(' ');
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        if (!char.stats.manias) char.stats.manias = [];
        char.stats.manias.push({
            name: mania,
            source: 'KP设定'
        });
        
        data.save();
        sendMessageAs(`✅ 已为 ${charName} 添加躁狂症：${mania}`);
        return '';
    }, [], '添加躁狂症 - 格式: /addmania 李昂 清洁癖');

    // ==================== 4. 伤害系统指令 ====================

    /**
     * /damage - 造成伤害
     */
    context.registerSlashCommand('damage', (args, value) => {
        const parts = value.split(' ');
        const charName = parts[0];
        const damage = parseInt(parts[1]);
        const source = parts.slice(2).join(' ') || '未知';
        
        if (typeof window.takeDamage !== 'function') {
            sendMessageAs('❌ 伤害系统未加载');
            return '';
        }
        
        const result = window.takeDamage(charName, damage, { location: source });
        
        if (!result) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        let message = `💥 **${charName}** 受到 ${damage} 点伤害\n`;
        message += `HP: ${result.oldHP} → ${result.newHP}\n`;
        
        if (result.isMajorWound) {
            message += `⚠️ **造成重伤！**\n`;
        }
        if (result.isDying) {
            message += `💀 **角色进入濒死状态！**\n`;
        } else if (result.isUnconscious) {
            message += `😵 **角色昏迷！**\n`;
        }
        
        sendMessageAs(message);
        return '';
    }, [], '造成伤害 - 格式: /damage 李昂 12 深潜者爪击');

    /**
     * /firstaid - 急救
     */
    context.registerSlashCommand('firstaid', (args, value) => {
        const [charName, medicName] = value.split(' ');
        
        if (typeof window.firstAid !== 'function') {
            sendMessageAs('❌ 急救系统未加载');
            return '';
        }
        
        const result = window.firstAid(charName, medicName);
        sendMessageAs(result.message);
        return '';
    }, [], '急救 - 格式: /firstaid 李昂 张薇');

    /**
     * /medicine - 医学治疗
     */
    context.registerSlashCommand('medicine', (args, value) => {
        const [charName, doctorName] = value.split(' ');
        
        if (typeof window.medicine !== 'function') {
            sendMessageAs('❌ 医学系统未加载');
            return '';
        }
        
        const result = window.medicine(charName, doctorName);
        sendMessageAs(result.message);
        return '';
    }, [], '医学治疗 - 格式: /medicine 李昂 张薇');

    /**
     * /heal - 自然恢复
     */
    context.registerSlashCommand('heal', (args, value) => {
        const charName = value;
        
        if (typeof window.naturalHealing !== 'function') {
            sendMessageAs('❌ 恢复系统未加载');
            return '';
        }
        
        const result = window.naturalHealing(charName);
        sendMessageAs(result.message);
        return '';
    }, [], '自然恢复 - 格式: /heal 李昂');

    /**
     * /woundrecovery - 重伤恢复检定
     */
    context.registerSlashCommand('woundrecovery', (args, value) => {
        const charName = value;
        
        if (typeof window.majorWoundRecovery !== 'function') {
            sendMessageAs('❌ 重伤系统未加载');
            return '';
        }
        
        const result = window.majorWoundRecovery(charName);
        if (!result) {
            sendMessageAs(`❌ ${charName} 不处于重伤状态`);
            return '';
        }
        sendMessageAs(result.message);
        return '';
    }, [], '重伤恢复检定 - 格式: /woundrecovery 李昂');

    /**
     * /dying - 濒死体质检定
     */
    context.registerSlashCommand('dying', (args, value) => {
        const charName = value;
        
        if (typeof window.handleDying !== 'function') {
            sendMessageAs('❌ 濒死系统未加载');
            return '';
        }
        
        const result = window.handleDying(charName);
        sendMessageAs(result?.message || `❌ ${charName} 不处于濒死状态`);
        return '';
    }, [], '濒死体质检定 - 格式: /dying 李昂');

    // ==================== 5. 幸运/孤注一掷指令 ====================

    /**
     * /luck - 查看幸运
     */
    context.registerSlashCommand('luck', (args, value) => {
        const charName = value;
        const char = data.get(charName);
        
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        const luck = char.stats.luck || { current: 50, max: 50 };
        sendMessageAs(`✨ **${charName}** 的幸运值：${luck.current}/${luck.max}`);
        return '';
    }, [], '查看幸运 - 格式: /luck 李昂');

    /**
     * /spendluck - 使用幸运
     */
    context.registerSlashCommand('spendluck', (args, value) => {
        const parts = value.split(' ');
        const charName = parts[0];
        const originalRoll = parseInt(parts[1]);
        const targetValue = parseInt(parts[2]);
        const points = parseInt(parts[3]);
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        const luck = char.stats.luck?.current || 0;
        
        if (points > luck) {
            sendMessageAs(`❌ 幸运不足（需要${points}，现有${luck}）`);
            return '';
        }
        
        if (originalRoll === 1 || originalRoll === 100) {
            sendMessageAs(`❌ 不能调整大成功/大失败`);
            return '';
        }
        
        const newRoll = originalRoll - points;
        char.stats.luck.current -= points;
        data.save();
        
        const newResult = judgeCOC7(newRoll, targetValue);
        
        sendMessageAs(`✨ **${charName}** 使用 ${points} 点幸运\n` +
                     `🎲 ${originalRoll} → ${newRoll}\n` +
                     `结果：${newResult.emoji} **${newResult.text}**\n` +
                     `剩余幸运：${char.stats.luck.current}`);
        return '';
    }, [], '使用幸运 - 格式: /spendluck 李昂 67 50 10');

    /**
     * /push - 孤注一掷
     */
    context.registerSlashCommand('push', (args, value) => {
        const parts = value.split(' ');
        const charName = parts[0];
        const skill = parts[1];
        const contextStr = parts.slice(2).join(' ') || '未知情境';
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        const skillValue = char.stats.skills?.[skill] || 50;
        const newRoll = rollD100();
        const result = judgeCOC7(newRoll, skillValue);
        
        if (!char.stats.pushedRolls) char.stats.pushedRolls = [];
        char.stats.pushedRolls.push({
            skill,
            timestamp: new Date().toISOString(),
            context: contextStr,
            newRoll,
            result
        });
        
        data.save();
        
        const consequences = [
            '引起他人注意',
            '损坏工具/装备',
            '受伤（1D3伤害）',
            '浪费时间（错过机会）',
            '留下证据',
            '激怒目标'
        ];
        const consequence = consequences[Math.floor(Math.random() * consequences.length)];
        
        let message = `⚔️ **${charName}** 进行孤注一掷！\n`;
        message += `技能：${skill} (${skillValue}%)\n`;
        message += `🎲 D100 = ${newRoll}\n`;
        message += `结果：${result.emoji} **${result.text}**\n`;
        
        if (result.text === '失败' || result.text === '大失败') {
            message += `\n💀 **后果：${consequence}**`;
        } else {
            message += `\n✨ 孤注一掷成功！`;
        }
        
        sendMessageAs(message);
        return '';
    }, [], '孤注一掷 - 格式: /push 李昂 侦查 再次检查暗格');

    // ==================== 6. 帮助指令 ====================

    /**
     * /cochelp - 显示所有指令
     */
    context.registerSlashCommand('cochelp', () => {
        const help = `
📋 **COC7 完整指令列表**

【基础指令】
/coc 技能名 @角色名 - 技能检定
/coc 数字 @角色名 - 掷骰子
/coc 属性 @角色名 - 属性检定（如 STR）
/san 损失公式 @角色名 [来源] - 理智检定

【KP设置】
/setkp name=角色名 - 设置KP
/getkp - 查看当前KP

【疯狂系统】
/insanity 角色名 损失 [来源] - 触发临时疯狂
/endinsanity 角色名 - 结束疯狂发作
/reality 角色名 - 现实认知检定
/insanitystatus 角色名 - 查看疯狂状态
/addphobia 角色名 恐惧症名 - 添加恐惧症
/addmania 角色名 躁狂症名 - 添加躁狂症

【伤害系统】
/damage 角色名 伤害值 [来源] - 造成伤害
/firstaid 角色名 施救者名 - 急救
/medicine 角色名 医生名 - 医学治疗
/heal 角色名 - 自然恢复
/woundrecovery 角色名 - 重伤恢复检定
/dying 角色名 - 濒死体质检定

【幸运系统】
/luck 角色名 - 查看幸运
/spendluck 角色名 原骰值 目标值 点数 - 使用幸运
/push 角色名 技能名 情境 - 孤注一掷
        `;
        sendMessageAs(help);
        return '';
    }, [], '显示所有COC命令帮助');

    console.log('[COC] 斜杠命令注册成功');
}
