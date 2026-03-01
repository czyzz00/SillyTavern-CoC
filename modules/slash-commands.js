// ==================== 斜杠命令 ====================

function registerSlashCommands(context, data, core) {
    const { rollD100, parseDiceFormula, judgeCOC, calculateDB } = core;
    
    // 获取角色技能值（从data获取）
    function getSkillValue(characterName, skillName) {
        return data.getSkill(characterName, skillName);
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
    
    // 理智检定
    function sanCheck(character, lossFormula) {
        const currentSan = data.getSan(character);
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
        data.updateSan(character, newSan);
        
        return {
            roll,
            result,
            loss,
            newSan,
            isInsane: newSan <= 0,
            isTemporaryInsanity: loss >= 5 && currentSan - loss < currentSan
        };
    }
    
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
    
    // /san 命令
    context.registerSlashCommand('san', (args, value) => {
        const input = value || '';
        
        let targetChar = context.name2 || '未知角色';
        let lossFormula = '1d3/1d6';
        
        const atMatch = input.match(/@(\S+)/);
        if (atMatch) {
            targetChar = atMatch[1];
            const command = input.replace(/@\S+/, '').trim();
            if (command) lossFormula = command;
        } else if (input) {
            lossFormula = input;
        }
        
        try {
            const result = sanCheck(targetChar, lossFormula);
            
            let message = `**${targetChar}** 进行理智检定\n` +
                         `🎲 D100 = \`${result.roll}\` | 当前理智 \`${result.newSan + result.loss}\`\n` +
                         `结果: ${result.result.emoji} **${result.result.text}**，损失 \`${result.loss}\` 点理智\n` +
                         `剩余理智: **${result.newSan}**`;
            
            if (result.isInsane) {
                message += `\n💔 **角色永久疯狂！**`;
            } else if (result.isTemporaryInsanity) {
                message += `\n😱 **临时疯狂！**`;
            }
            
            sendMessageAs(message, 'system');
        } catch (e) {
            sendMessageAs(`❌ 理智检定格式错误: ${lossFormula}`, 'system');
        }
        
        return '';
    }, [], '理智检定 - 格式: /san 1d3/1d6 @角色名');
    
    // /setkp 命令
    context.registerSlashCommand(
        'setkp',
        (args, value) => {
            const kpName = value || args?.name || '';
            
            if (!kpName) {
                const availableChars = data.getAvailableCharacters().join('、');
                sendMessageAs(`❌ 请指定KP角色名。可用角色: ${availableChars}\n示例: /setkp 克苏鲁`, 'system');
                return '';
            }
            
            const availableChars = data.getAvailableCharacters();
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
                enumProvider: () => data.getAvailableCharacters()
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

    // 伤害命令
    context.registerSlashCommand('damage', (args, value) => {
        const [target, damage] = value.split(' ');
        const result = takeDamage(target, parseInt(damage));
        sendMessageAs(JSON.stringify(result), 'system');
        return '';
    }, [], '造成伤害: /damage 李昂 5');

    // 急救命令
    context.registerSlashCommand('firstaid', (args, value) => {
        const [target, medic] = value.split(' ');
        const result = firstAid(target, medic);
        sendMessageAs(result.message, 'system');
        return '';
    }, [], '急救: /firstaid 李昂 医生');

    // 燃运命令
    context.registerSlashCommand('luck', (args, value) => {
        const [target, points] = value.split(' ');
        // 需要结合上次检定结果
        sendMessageAs('需要指定检定', 'system');
        return '';
    }, [], '使用幸运: /luck 李昂 10');
}
