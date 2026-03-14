// ==================== 斜杠命令 ====================

function registerSlashCommands(context, data, core) {
    const { rollD100, parseDiceFormula, sanCheck } = core;
    
    // 获取角色技能值（合并职业/兴趣/格斗）
    function getSkillValue(characterName, skillName) {
        return data.getSkill(characterName, skillName);
    }
    
    // 获取角色属性值
    function getAttributeValue(characterName, attributeName) {
        const char = data.get(characterName);
        return char?.stats?.[attributeName] || 50;
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
    function judgeCOC7(roll, targetValue) {
        if (roll === 1) return {
            success: true,
            text: '大成功',
            emoji: '🎯',
            level: 'critical_success'
        };
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

    function parseMentions(input) {
        const names = [];
        const cleaned = input.replace(/@([^\s]+)/g, (_, name) => {
            names.push(name);
            return '';
        });
        return { names, rest: cleaned.trim().replace(/\s+/g, ' ') };
    }

    // ==================== 1. 基础指令 ====================

    /**
     * /coc - 多功能指令（技能检定、掷骰子、属性检定）
     */
    context.registerSlashCommand('coc', (_, value) => {
        const input = value || '';
        
        let targetChar = context.name2 || '未知角色';
        let command = input;
        
        const parsed = parseMentions(input);
        if (parsed.names[0]) {
            targetChar = parsed.names[0];
            command = parsed.rest;
        }
        
        if (!command) {
            sendMessageAs('❌ 用法: /coc 侦查 @角色 或 /coc 100');
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
                     `结果: ${result.emoji} **${result.text}**\n` +
                     `判定等级: ${result.text}`;
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
                     `结果: ${result.emoji} **${result.text}**\n` +
                     `判定等级: ${result.text}`;
        }
        
        sendMessageAs(message);
        return '';
        
    }, ['cocroll', 'cr'], 'COC命令 - 用@指定角色');

    /**
     * /san - 理智检定
     */
    context.registerSlashCommand('san', (_, value) => {
        const input = value || '';
        
        let targetChar = context.name2 || '未知角色';
        let lossFormula = '1d3/1d6';
        let source = '未知恐怖';
        
        const parsed = parseMentions(input);
        if (parsed.names[0]) {
            targetChar = parsed.names[0];
        }
        const parts = (parsed.rest || input).split(' ').filter(Boolean);
        if (parts[0]) lossFormula = parts[0];
        if (parts[1]) source = parts.slice(1).join(' ');
        
        try {
            const result = sanCheck(targetChar, lossFormula, source, data);
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

    // ==================== 2. KP设置指令 ====================

    /**
     * /setkp - 设置KP
     */
    context.registerSlashCommand(
        'setkp',
        (_, value) => {
            const input = value || '';
            const parsed = parseMentions(input);
            const kpName = parsed.names[0] || parsed.rest || '';
            
            if (!kpName) {
                const availableChars = getAvailableCharacters().join('、');
                sendMessageAs(`❌ 请使用 @指定KP角色名。可用角色: ${availableChars}\n示例: /setkp @克苏鲁`);
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
        '设置KP角色'
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
    context.registerSlashCommand('insanity', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const parts = (parsed.rest || '').split(' ').filter(Boolean);
        const sanLoss = parseInt(parts[0]) || 5;
        const source = parts.slice(1).join(' ') || '未知恐怖';
        
        if (!charName) {
            sendMessageAs('❌ 用法: /insanity @角色 损失 [来源]');
            return '';
        }
        
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
    context.registerSlashCommand('endinsanity', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0] || parsed.rest;
        
        if (!charName) {
            sendMessageAs('❌ 用法: /endinsanity @角色');
            return '';
        }
        
        
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
    context.registerSlashCommand('reality', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0] || parsed.rest;
        
        if (!charName) {
            sendMessageAs('❌ 用法: /reality @角色');
            return '';
        }
        
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
    context.registerSlashCommand('insanitystatus', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0] || parsed.rest;

        if (!charName) {
            sendMessageAs('❌ 用法: /insanitystatus @角色');
            return '';
        }

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
    context.registerSlashCommand('addphobia', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const phobia = parsed.rest || '';

        if (!charName || !phobia) {
            sendMessageAs('❌ 用法: /addphobia @角色 恐惧症名');
            return '';
        }
        
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
    context.registerSlashCommand('addmania', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const mania = parsed.rest || '';

        if (!charName || !mania) {
            sendMessageAs('❌ 用法: /addmania @角色 躁狂症名');
            return '';
        }
        
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
    context.registerSlashCommand('damage', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const parts = (parsed.rest || '').split(' ').filter(Boolean);
        const damage = parseInt(parts[0]);
        const source = parts.slice(1).join(' ') || '未知';

        if (!charName || Number.isNaN(damage)) {
            sendMessageAs('❌ 用法: /damage @角色 伤害值 [来源]');
            return '';
        }
        
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
        if (result.isDead) {
            message += `☠️ **角色当场死亡！**\n`;
        } else if (result.isDying) {
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
    context.registerSlashCommand('firstaid', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const medicName = parsed.names[1] || parsed.rest;

        if (!charName || !medicName) {
            sendMessageAs('❌ 用法: /firstaid @伤者 @施救者');
            return '';
        }
        
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
    context.registerSlashCommand('medicine', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const doctorName = parsed.names[1] || parsed.rest;

        if (!charName || !doctorName) {
            sendMessageAs('❌ 用法: /medicine @伤者 @医生');
            return '';
        }
        
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
    context.registerSlashCommand('heal', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0] || parsed.rest;

        if (!charName) {
            sendMessageAs('❌ 用法: /heal @角色');
            return '';
        }
        
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
    context.registerSlashCommand('woundrecovery', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0] || parsed.rest;

        if (!charName) {
            sendMessageAs('❌ 用法: /woundrecovery @角色');
            return '';
        }
        
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
    context.registerSlashCommand('dying', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0] || parsed.rest;

        if (!charName) {
            sendMessageAs('❌ 用法: /dying @角色');
            return '';
        }
        
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
    context.registerSlashCommand('luck', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0] || parsed.rest;

        if (!charName) {
            sendMessageAs('❌ 用法: /luck @角色');
            return '';
        }

        const char = data.get(charName);
        
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        if (!char.stats.luck) {
            const fallback = char.stats.LUCK ?? 50;
            char.stats.luck = { current: fallback, max: fallback };
            data.save();
        }

        const luck = char.stats.luck;
        sendMessageAs(`✨ **${charName}** 的幸运值：${luck.current}/${luck.max}`);
        return '';
    }, [], '查看幸运 - 格式: /luck 李昂');

    /**
     * /spendluck - 使用幸运
     */
    context.registerSlashCommand('spendluck', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const parts = (parsed.rest || '').split(' ').filter(Boolean);
        const originalRoll = parseInt(parts[0]);
        const targetValue = parseInt(parts[1]);
        const points = parseInt(parts[2]);

        if (!charName || Number.isNaN(originalRoll) || Number.isNaN(targetValue) || Number.isNaN(points)) {
            sendMessageAs('❌ 用法: /spendluck @角色 原骰值 目标值 点数');
            return '';
        }
        
        const char = data.get(charName);
        if (!char) {
            sendMessageAs(`❌ 角色 ${charName} 不存在`);
            return '';
        }
        
        if (!char.stats.luck) {
            const fallback = char.stats.LUCK ?? 0;
            char.stats.luck = { current: fallback, max: fallback };
        }

        const luck = char.stats.luck?.current ?? 0;
        
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
    context.registerSlashCommand('push', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const charName = parsed.names[0];
        const parts = (parsed.rest || '').split(' ').filter(Boolean);
        const skill = parts[0];
        const contextStr = parts.slice(1).join(' ') || '未知情境';

        if (!charName || !skill) {
            sendMessageAs('❌ 用法: /push @角色 技能 情境');
            return '';
        }
        
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

    // ==================== 6. 时间系统指令 ====================

    /**
     * /time - 查看时间状态
     */
    context.registerSlashCommand('time', () => {
        const time = data.getTimeStatus();
        sendMessageAs(
            `🕒 当前时间状态\n` +
            `天数：第 ${time.day} 天\n` +
            `周数：第 ${time.week} 周\n` +
            `场次：第 ${time.session} 场\n` +
            `当日SAN累计损失：${time.daySanLoss}`
        );
        return '';
    }, [], '查看当前跑团时间状态');

    /**
     * /nextday - 进入新的一天
     */
    context.registerSlashCommand('nextday', () => {
        const time = data.advanceDay();
        sendMessageAs(`✅ 已进入新的一天：第 ${time.day} 天（第 ${time.week} 周）\n当日SAN累计损失已清零`);
        return '';
    }, [], '进入新的一天（清空当日SAN累计）');

    /**
     * /nextweek - 进入新的一周
     */
    context.registerSlashCommand('nextweek', () => {
        const time = data.advanceWeek();
        sendMessageAs(`✅ 已进入新的一周：第 ${time.week} 周（第 ${time.day} 天）\n当日SAN累计损失已清零\n建议进行重伤恢复检定`);
        return '';
    }, [], '进入新的一周（清空当日SAN累计）');

    /**
     * /sessionend - 结束场次
     */
    context.registerSlashCommand('sessionend', () => {
        const time = data.endSession();
        sendMessageAs(`✅ 已结束场次，进入第 ${time.session} 场`);
        return '';
    }, [], '结束当前场次');

    // ==================== 7. 战斗轮系统指令 ====================

    function buildCombatOrder(participants) {
        const unique = [...new Set(participants)].filter(Boolean);
        if (unique.length === 0) return [];

        const entries = unique.map(name => ({
            name,
            dex: getAttributeValue(name, 'DEX')
        }));

        return entries
            .sort((a, b) => b.dex - a.dex)
            .map(entry => entry.name);
    }

    function formatCombatOrder(order, acted = []) {
        return order.map((name, index) => {
            const actedMark = acted.includes(name) ? '✅' : '⬜';
            return `${index + 1}. ${actedMark} ${name}`;
        }).join('\n');
    }

    function formatCurrentActor(state) {
        if (!state.active || state.order.length === 0) return '当前无战斗轮进行中';
        const current = state.order[state.index] || state.order[0];
        return `当前行动者：${current}（第 ${state.round} 轮）`;
    }

    context.registerSlashCommand('combat', (_, value) => {
        const input = value || '';
        const parsed = parseMentions(input);
        const parts = parsed.rest.split(' ').filter(Boolean);
        const subCommand = (parts.shift() || '').toLowerCase();

        if (!subCommand) {
            sendMessageAs('❌ 用法: /combat start @角色们 | /combat next | /combat status | /combat end');
            return '';
        }

        const state = data.getCombatState();

        if (subCommand === 'start') {
            const participants = parsed.names;
            if (!participants.length) {
                sendMessageAs('❌ 用法: /combat start @角色们');
                return '';
            }

            const order = buildCombatOrder(participants);
            if (!order.length) {
                sendMessageAs('❌ 参战者为空，无法开始战斗轮');
                return '';
            }

            data.setCombatState({
                active: true,
                round: 1,
                order,
                index: 0,
                acted: [],
                participants
            });

            sendMessageAs(
                `⚔️ 战斗开始！\n` +
                `行动顺序（按DEX）：\n${formatCombatOrder(order)}\n` +
                `当前行动者：${order[0]}（第 1 轮）`
            );
            return '';
        }

        if (!state.active) {
            sendMessageAs('❌ 当前没有进行中的战斗轮，请先使用 /combat start');
            return '';
        }

        if (subCommand === 'status') {
            sendMessageAs(
                `⚔️ 战斗轮状态\n` +
                `${formatCurrentActor(state)}\n` +
                `行动顺序：\n${formatCombatOrder(state.order, state.acted)}`
            );
            return '';
        }

        if (subCommand === 'next') {
            const order = state.order || [];
            if (!order.length) {
                sendMessageAs('❌ 行动顺序为空，无法推进战斗轮');
                return '';
            }

            const current = order[state.index] || order[0];
            const acted = state.acted.includes(current) ? state.acted : [...state.acted, current];

            let nextIndex = (state.index + 1) % order.length;
            let nextRound = state.round;
            let nextActed = acted;

            if (nextIndex === 0) {
                nextRound += 1;
                nextActed = [];
            }

            data.setCombatState({
                round: nextRound,
                index: nextIndex,
                acted: nextActed
            });

            const nextState = data.getCombatState();
            sendMessageAs(
                `➡️ 轮到下一位行动者\n` +
                `${formatCurrentActor(nextState)}\n` +
                `行动顺序：\n${formatCombatOrder(nextState.order, nextState.acted)}`
            );
            return '';
        }

        if (subCommand === 'end') {
            data.clearCombatState();
            sendMessageAs('✅ 战斗结束，战斗轮状态已清空');
            return '';
        }

        sendMessageAs('❌ 未知子命令，用法: /combat start @角色们 | /combat next | /combat status | /combat end');
        return '';
    }, [], '战斗轮控制 - /combat start|next|status|end');

    // ==================== 8. 帮助指令 ====================

    /**
     * /cochelp - 显示所有指令
     */
    context.registerSlashCommand('cochelp', () => {
        const help = `
📋 **COC7 完整指令列表（统一@角色）**

【基础指令】
/coc 技能名 @角色 - 技能检定
/coc 数字 @角色 - 掷骰子
/coc 属性 @角色 - 属性检定（如 STR）
/san 损失公式 @角色 [来源] - 理智检定

【KP设置】
/setkp @角色 - 设置KP
/getkp - 查看当前KP

【疯狂系统】
/insanity @角色 损失 [来源] - 触发临时疯狂
/endinsanity @角色 - 结束疯狂发作
/reality @角色 - 现实认知检定
/insanitystatus @角色 - 查看疯狂状态
/addphobia @角色 恐惧症名 - 添加恐惧症
/addmania @角色 躁狂症名 - 添加躁狂症

【伤害系统】
/damage @角色 伤害值 [来源] - 造成伤害
/firstaid @伤者 @施救者 - 急救
/medicine @伤者 @医生 - 医学治疗
/heal @角色 - 自然恢复
/woundrecovery @角色 - 重伤恢复检定
/dying @角色 - 濒死体质检定

【幸运系统】
/luck @角色 - 查看幸运
/spendluck @角色 原骰值 目标值 点数 - 使用幸运
/push @角色 技能 情境 - 孤注一掷

【战斗轮系统】
/combat start @角色们 - 开始战斗轮（按DEX排序）
/combat next - 下一行动者
/combat status - 查看战斗轮状态
/combat end - 结束战斗轮

【时间系统】
/time - 查看时间状态
/nextday - 进入新的一天
/nextweek - 进入新的一周
/sessionend - 结束当前场次
        `;
        sendMessageAs(help);
        return '';
    }, [], '显示所有COC命令帮助');

    console.log('[COC] 斜杠命令注册成功');
}
