// ==================== 斜杠命令 ====================

function registerSlashCommands(context, data, core) {
    const { rollD100, rollWithBonusPenalty, parseDiceFormula, judgeCOC, calculateDB, calculateMaxHP } = core;
    
    // 获取角色技能值（从data获取）
    function getSkillValue(characterName, skillName) {
        return data.getSkill(characterName, skillName);
    }
    
    // 获取角色属性值
    function getAttributeValue(characterName, attributeName) {
        return data.getAttribute(characterName, attributeName);
    }
    
    // 发送消息（支持KP转发）
    function sendMessageAs(text, sender) {
        try {
            const kp = data.getKP();
            const finalSender = (sender === 'system' && kp) ? kp : sender;
            context.executeSlashCommands(`/send ${finalSender} ${text}`);
        } catch (e) {
            console.error('[COC] 发送消息失败:', e);
        }
    }
    
    // 理智检定函数（包含疯狂触发）
    function sanCheck(character, lossFormula, source = '未知恐怖') {
        const char = data.get(character);
        if (!char) return null;
        
        const currentSan = char.stats.SAN || 50;
        const roll = rollD100();
        const result = judgeCOC(roll, currentSan);
        
        const [successLoss, failLoss] = lossFormula.split('/');
        
        let loss;
        if (result.text === '成功' || result.text === '困难成功' || result.text === '极难成功') {
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
            isTemporaryInsanity: loss >= 5 && result.text === '失败',
            insanity
        };
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
    
    // ==================== 原有命令 ====================

    // /coc 命令
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
        else {
            const skillName = command;
            const roll = rollD100();
            const skillValue = getSkillValue(targetChar, skillName);
            const result = judgeCOC(roll, skillValue);
            
            message = `**${targetChar}** 进行 **${skillName}** 检定\n` +
                     `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                     `结果: ${result.emoji} **${result.text}**`;
        }
        
        sendMessageAs(message, 'system');
        return '';
        
    }, ['cocroll', 'cr'], 'COC命令 - 用@指定角色');

    // /san 命令（升级版，包含疯狂触发）
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

    // /setkp 命令
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
            sendMessageAs(`✅ 已将 ${kpName} 设置为KP。`, 'system');
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

    // ==================== 新增疯狂系统命令 ====================

    /**
     * /insanity 触发临时疯狂
     */
    context.registerSlashCommand('insanity', (args, value) => {
        const [charName, sanLoss = '5', ...sourceParts] = value.split(' ');
        const source = sourceParts.join(' ') || '未知恐怖';
        
        if (typeof window.triggerTemporaryInsanity !== 'function') {
            sendMessageAs('❌ 疯狂系统未加载', 'system');
            return '';
        }
        
        const result = window.triggerTemporaryInsanity(charName, parseInt(sanLoss), source);
        
        if (!result) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
            return '';
        }
        
        if (!result.triggered) {
            sendMessageAs(`✅ ${charName} 的智力检定失败，压抑了恐怖记忆（${result.reason}）`, 'system');
            return '';
        }
        
        sendMessageAs(`😱 **${charName} 陷入临时疯狂！**\n` +
                     `症状：${result.symptom}\n` +
                     `持续时间：${result.duration}小时\n` +
                     `来源：${result.source}`, 'system');
        
        return '';
    }, [], '触发临时疯狂 - 格式: /insanity 李昂 5 目睹深潜者');

    /**
     * /endinsanity 结束疯狂发作
     */
    context.registerSlashCommand('endinsanity', (args, value) => {
        const charName = value;
        
        if (typeof window.endInsanityEpisode !== 'function') {
            sendMessageAs('❌ 疯狂系统未加载', 'system');
            return '';
        }
        
        const result = window.endInsanityEpisode(charName);
        
        if (!result) {
            sendMessageAs(`❌ 角色 ${charName} 没有处于疯狂状态`, 'system');
            return '';
        }
        
        let message = `✅ **${charName}** 的疯狂发作结束，进入潜在疯狂阶段`;
        if (result.summarySymptom) {
            message += `\n总结症状：${result.summarySymptom}`;
        }
        
        sendMessageAs(message, 'system');
        return '';
    }, [], '结束疯狂发作 - 格式: /endinsanity 李昂');

    /**
     * /reality 现实认知检定
     */
    context.registerSlashCommand('reality', (args, value) => {
        const charName = value;
        
        if (typeof window.realityCheck !== 'function') {
            sendMessageAs('❌ 疯狂系统未加载', 'system');
            return '';
        }
        
        const result = window.realityCheck(charName);
        
        if (!result.allowed) {
            sendMessageAs(`❌ ${charName} 不在潜在疯狂阶段`, 'system');
            return '';
        }
        
        if (result.success) {
            sendMessageAs(`✨ **${charName}** 现实认知检定成功！\n` +
                         `🎲 D100 = ${result.roll} | 理智 ${result.san}\n` +
                         `结果：你意识到眼前景象的虚幻本质`, 'system');
        } else {
            sendMessageAs(`😵 **${charName}** 现实认知检定失败！\n` +
                         `🎲 D100 = ${result.roll} | 理智 ${result.san}\n` +
                         `结果：损失1点理智，剩余 ${result.newSan}`, 'system');
        }
        
        return '';
    }, [], '现实认知检定 - 格式: /reality 李昂');

    /**
     * /insanitystatus 查看疯狂状态
     */
    context.registerSlashCommand('insanitystatus', (args, value) => {
        const charName = value;
        const char = data.get(charName);
        
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
            return '';
        }
        
        const insanity = char.stats.insanity;
        if (!insanity) {
            sendMessageAs(`✅ ${charName} 目前神智清醒，无疯狂状态`, 'system');
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
        
        sendMessageAs(status, 'system');
        return '';
    }, [], '查看疯狂状态 - 格式: /insanitystatus 李昂');

    /**
     * /addphobia 添加恐惧症
     */
    context.registerSlashCommand('addphobia', (args, value) => {
        const [charName, ...phobiaParts] = value.split(' ');
        const phobia = phobiaParts.join(' ');
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
            return '';
        }
        
        if (!char.stats.phobias) char.stats.phobias = [];
        char.stats.phobias.push({
            name: phobia,
            source: 'KP设定'
        });
        
        data.save();
        sendMessageAs(`✅ 已为 ${charName} 添加恐惧症：${phobia}`, 'system');
        return '';
    }, [], '添加恐惧症 - 格式: /addphobia 李昂 恐高症');

    /**
     * /addmania 添加躁狂症
     */
    context.registerSlashCommand('addmania', (args, value) => {
        const [charName, ...maniaParts] = value.split(' ');
        const mania = maniaParts.join(' ');
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
            return '';
        }
        
        if (!char.stats.manias) char.stats.manias = [];
        char.stats.manias.push({
            name: mania,
            source: 'KP设定'
        });
        
        data.save();
        sendMessageAs(`✅ 已为 ${charName} 添加躁狂症：${mania}`, 'system');
        return '';
    }, [], '添加躁狂症 - 格式: /addmania 李昂 清洁癖');

    // ==================== 新增伤害系统命令 ====================

    /**
     * /damage 造成伤害
     */
    context.registerSlashCommand('damage', (args, value) => {
        const [charName, damage, ...sourceParts] = value.split(' ');
        const source = sourceParts.join(' ') || '未知';
        
        if (typeof window.takeDamage !== 'function') {
            sendMessageAs('❌ 伤害系统未加载', 'system');
            return '';
        }
        
        const result = window.takeDamage(charName, parseInt(damage), { location: source });
        
        if (!result) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
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
        
        sendMessageAs(message, 'system');
        return '';
    }, [], '造成伤害 - 格式: /damage 李昂 12 深潜者爪击');

    /**
     * /firstaid 急救
     */
    context.registerSlashCommand('firstaid', (args, value) => {
        const [charName, medicName] = value.split(' ');
        
        if (typeof window.firstAid !== 'function') {
            sendMessageAs('❌ 急救系统未加载', 'system');
            return '';
        }
        
        const result = window.firstAid(charName, medicName);
        sendMessageAs(result.message, 'system');
        return '';
    }, [], '急救 - 格式: /firstaid 李昂 张薇');

    /**
     * /medicine 医学治疗
     */
    context.registerSlashCommand('medicine', (args, value) => {
        const [charName, doctorName] = value.split(' ');
        
        if (typeof window.medicine !== 'function') {
            sendMessageAs('❌ 医学系统未加载', 'system');
            return '';
        }
        
        const result = window.medicine(charName, doctorName);
        sendMessageAs(result.message, 'system');
        return '';
    }, [], '医学治疗 - 格式: /medicine 李昂 张薇');

    /**
     * /heal 自然恢复
     */
    context.registerSlashCommand('heal', (args, value) => {
        const charName = value;
        
        if (typeof window.naturalHealing !== 'function') {
            sendMessageAs('❌ 恢复系统未加载', 'system');
            return '';
        }
        
        const result = window.naturalHealing(charName);
        sendMessageAs(result.message, 'system');
        return '';
    }, [], '自然恢复 - 格式: /heal 李昂');

    /**
     * /woundrecovery 重伤恢复检定
     */
    context.registerSlashCommand('woundrecovery', (args, value) => {
        const charName = value;
        
        if (typeof window.majorWoundRecovery !== 'function') {
            sendMessageAs('❌ 重伤系统未加载', 'system');
            return '';
        }
        
        const result = window.majorWoundRecovery(charName);
        if (!result) {
            sendMessageAs(`❌ ${charName} 不处于重伤状态`, 'system');
            return '';
        }
        sendMessageAs(result.message, 'system');
        return '';
    }, [], '重伤恢复检定 - 格式: /woundrecovery 李昂');

    /**
     * /dying 濒死体质检定
     */
    context.registerSlashCommand('dying', (args, value) => {
        const charName = value;
        
        if (typeof window.handleDying !== 'function') {
            sendMessageAs('❌ 濒死系统未加载', 'system');
            return '';
        }
        
        const result = window.handleDying(charName);
        sendMessageAs(result?.message || `❌ ${charName} 不处于濒死状态`, 'system');
        return '';
    }, [], '濒死体质检定 - 格式: /dying 李昂');

    // ==================== 新增幸运系统命令 ====================

    /**
     * /luck 查看幸运
     */
    context.registerSlashCommand('luck', (args, value) => {
        const charName = value;
        const char = data.get(charName);
        
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
            return '';
        }
        
        const luck = char.stats.luck || { current: 50, max: 50 };
        sendMessageAs(`✨ **${charName}** 的幸运值：${luck.current}/${luck.max}`, 'system');
        return '';
    }, [], '查看幸运 - 格式: /luck 李昂');

    /**
     * /spendluck 使用幸运
     */
    context.registerSlashCommand('spendluck', (args, value) => {
        const [charName, originalRoll, targetValue, points] = value.split(' ').map(v => isNaN(v) ? v : parseInt(v));
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
            return '';
        }
        
        const luck = char.stats.luck?.current || 0;
        
        if (points > luck) {
            sendMessageAs(`❌ 幸运不足（需要${points}，现有${luck}）`, 'system');
            return '';
        }
        
        if (originalRoll === 1 || originalRoll === 100) {
            sendMessageAs(`❌ 不能调整大成功/大失败`, 'system');
            return '';
        }
        
        const newRoll = originalRoll - points;
        char.stats.luck.current -= points;
        data.save();
        
        const newResult = judgeCOC(newRoll, targetValue);
        
        sendMessageAs(`✨ **${charName}** 使用 ${points} 点幸运\n` +
                     `🎲 ${originalRoll} → ${newRoll}\n` +
                     `结果：${newResult.emoji} **${newResult.text}**\n` +
                     `剩余幸运：${char.stats.luck.current}`, 'system');
        return '';
    }, [], '使用幸运 - 格式: /spendluck 李昂 67 50 10');

    /**
     * /push 孤注一掷
     */
    context.registerSlashCommand('push', (args, value) => {
        const [charName, skill, ...contextParts] = value.split(' ');
        const contextStr = contextParts.join(' ') || '未知情境';
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`, 'system');
            return '';
        }
        
        const skillValue = char.stats.skills?.[skill] || 50;
        const newRoll = rollD100();
        const result = judgeCOC(newRoll, skillValue);
        
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
        
        sendMessageAs(message, 'system');
        return '';
    }, [], '孤注一掷 - 格式: /push 李昂 侦查 再次检查暗格');

    // ==================== 帮助命令 ====================

    /**
     * /cochelp 查看所有命令
     */
    context.registerSlashCommand('cochelp', () => {
        const help = `
📋 **COC7 完整命令列表**

【基础命令】
/coc 侦查 @角色 - 技能检定
/coc 100 @角色 - 掷骰子
/san 1d3/1d6 @角色 - 理智检定

【KP设置】
/setkp name=角色 - 设置KP
/getkp - 查看当前KP

【疯狂系统】
/insanity 角色 损失 [来源] - 触发临时疯狂
/endinsanity 角色 - 结束疯狂发作
/reality 角色 - 现实认知检定
/insanitystatus 角色 - 查看疯狂状态
/addphobia 角色 恐惧症 - 添加恐惧症
/addmania 角色 躁狂症 - 添加躁狂症

【伤害系统】
/damage 角色 伤害 [来源] - 造成伤害
/firstaid 角色 施救者 - 急救
/medicine 角色 医生 - 医学治疗
/heal 角色 - 自然恢复
/woundrecovery 角色 - 重伤恢复
/dying 角色 - 濒死体质检定

【幸运系统】
/luck 角色 - 查看幸运
/spendluck 角色 原骰 目标值 点数 - 使用幸运
/push 角色 技能 情境 - 孤注一掷
        `;
        sendMessageAs(help, 'system');
        return '';
    }, [], '显示所有COC命令帮助');
}
