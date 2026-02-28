// COC骰子系统 - COC7规则完整版
(function() {
    'use strict';

    const MODULE_NAME = 'coc-kp-dice';
    
    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 初始化存储 ====================
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = {
                    kpCharacter: '',
                    characters: {}
                };
            }
            
            // ==================== 辅助函数 ====================
            
            // 掷D100
            function rollD100() {
                return Math.floor(Math.random() * 100) + 1;
            }
            
            // 带奖励/惩罚骰的掷骰
            function rollWithBonusPenalty(bonusCount = 0, penaltyCount = 0) {
                // 奖励骰：掷3次取十位数最小的
                // 惩罚骰：掷3次取十位数最大的
                const rolls = [];
                for (let i = 0; i < 3; i++) {
                    rolls.push(rollD100());
                }
                
                if (bonusCount > 0) {
                    // 奖励骰：按十位数排序取最小
                    rolls.sort((a, b) => Math.floor(a/10) - Math.floor(b/10));
                    return rolls[0];
                } else if (penaltyCount > 0) {
                    // 惩罚骰：按十位数排序取最大
                    rolls.sort((a, b) => Math.floor(b/10) - Math.floor(a/10));
                    return rolls[0];
                }
                return rolls[0];
            }
            
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
            
            // ✅ 修正版：COC7成功等级判定
            function judgeCOC(roll, skillValue) {
                if (roll === 100) return { text: '大失败', emoji: '💀' };
                if (roll >= 96 && roll <= 99 && skillValue < 50) return { text: '大失败', emoji: '💀' };
                if (roll <= Math.floor(skillValue / 5)) return { text: '极难成功', emoji: '✨' };
                if (roll <= Math.floor(skillValue / 2)) return { text: '困难成功', emoji: '⭐' };
                if (roll <= skillValue) return { text: '成功', emoji: '✅' };
                return { text: '失败', emoji: '❌' };
            }
            
            // 计算伤害加值 (DB)
            function calculateDB(str, siz) {
                const total = (str || 50) + (siz || 50);
                if (total <= 64) return '-2';
                if (total <= 84) return '-1';
                if (total <= 124) return '0';
                if (total <= 164) return '+1d4';
                return '+1d6';
            }
            
            // 计算体格 (Build)
            function calculateBuild(str, siz) {
                const total = (str || 50) + (siz || 50);
                if (total <= 64) return -2;
                if (total <= 84) return -1;
                if (total <= 124) return 0;
                if (total <= 164) return 1;
                return 2;
            }
            
            // 理智检定
            function sanCheck(character, lossFormula) {
                const settings = context.extensionSettings[MODULE_NAME];
                const char = settings.characters?.[character] || {};
                const currentSan = char.san?.current || 50;
                
                const roll = rollD100();
                const result = judgeCOC(roll, currentSan);
                
                // 解析损失公式 (格式: "1d3/1d6")
                const [successLoss, failLoss] = lossFormula.split('/');
                
                let loss;
                if (result.text === '成功' || result.text === '困难成功' || result.text === '极难成功') {
                    loss = parseDiceFormula(successLoss).total;
                } else {
                    loss = parseDiceFormula(failLoss).total;
                }
                
                const newSan = Math.max(0, currentSan - loss);
                
                // 更新存储
                if (settings.characters[character]) {
                    if (!settings.characters[character].san) {
                        settings.characters[character].san = {};
                    }
                    settings.characters[character].san.current = newSan;
                    settings.characters[character].san.max = settings.characters[character].san.max || 99;
                    context.saveSettingsDebounced();
                }
                
                return {
                    roll,
                    result,
                    loss,
                    newSan,
                    isInsane: newSan <= 0,
                    isTemporaryInsanity: loss >= 5 && currentSan - loss < currentSan
                };
            }
            
            // 获取角色技能值
            function getSkillValue(characterName, skillName) {
                const settings = context.extensionSettings[MODULE_NAME];
                const char = settings.characters?.[characterName];
                if (char?.skills && char.skills[skillName]) {
                    return char.skills[skillName];
                }
                return 50;
            }
            
            // 获取角色属性值
            function getAttributeValue(characterName, attributeName) {
                const settings = context.extensionSettings[MODULE_NAME];
                const char = settings.characters?.[characterName];
                return char?.[attributeName] || 50;
            }
            
            // 发送消息
            function sendMessageAs(text, sender) {
                try {
                    const kp = context.extensionSettings[MODULE_NAME].kpCharacter;
                    const finalSender = (sender === 'system' && kp) ? kp : sender;
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
            
            // ==================== Slash命令 ====================
            
            // 技能检定
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
            
            // 理智检定
            context.registerSlashCommand('san', (args, value) => {
                const input = value || '';
                
                let targetChar = context.name2 || '未知角色';
                let lossFormula = '1d3/1d6'; // 默认损失
                
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
            
            // 设置KP
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
                    
                    const settings = context.extensionSettings[MODULE_NAME];
                    settings.kpCharacter = kpName;
                    context.saveSettingsDebounced();
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
            
            // 查看当前KP
            context.registerSlashCommand('getkp', () => {
                const kp = context.extensionSettings[MODULE_NAME].kpCharacter;
                if (kp) {
                    sendMessageAs(`📋 当前KP: ${kp}`, 'system');
                } else {
                    sendMessageAs('📋 当前未设置KP', 'system');
                }
                return '';
            }, [], '查看当前KP');
            
            // ==================== 函数调用 ====================
            
            if (context.isToolCallingSupported()) {
                
                // 掷骰子
                context.registerFunctionTool({
                    name: "roll_dice",
                    displayName: "掷骰子",
                    description: "当需要掷骰子时调用。支持各种骰子表达式。",
                    parameters: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        type: 'object',
                        properties: {
                            expression: {
                                type: 'string',
                                description: '骰子表达式，例如："d100"、"2d6+3"'
                            },
                            character: {
                                type: 'string',
                                description: '进行检定的角色名'
                            }
                        },
                        required: ['expression', 'character']
                    },
                    action: async ({ expression, character }) => {
                        try {
                            const result = parseDiceFormula(expression);
                            const rollDetails = result.details ? `${result.details} = ` : '';
                            return `🎲 ${character} 掷出 ${expression} = ${rollDetails}**${result.total}**`;
                        } catch (e) {
                            return `❌ 骰子表达式错误: ${expression}`;
                        }
                    },
                    stealth: false
                });
                
                // ✅ 修正版：技能检定
                context.registerFunctionTool({
                    name: "coc_skill_check",
                    displayName: "COC技能检定",
                    description: "进行克苏鲁呼唤7版技能检定。",
                    parameters: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        type: 'object',
                        properties: {
                            character: {
                                type: 'string',
                                description: '进行检定的角色名'
                            },
                            skill: {
                                type: 'string',
                                description: '技能名称'
                            },
                            difficulty: {
                                type: 'string',
                                enum: ['普通', '困难', '极难'],
                                default: '普通'
                            },
                            bonus: {
                                type: 'integer',
                                description: '奖励骰数量',
                                default: 0
                            },
                            penalty: {
                                type: 'integer',
                                description: '惩罚骰数量',
                                default: 0
                            }
                        },
                        required: ['character', 'skill']
                    },
                    action: async ({ character, skill, difficulty = '普通', bonus = 0, penalty = 0 }) => {
                        const roll = rollWithBonusPenalty(bonus, penalty);
                        let skillValue = getSkillValue(character, skill);
                        
                        // 根据难度调整技能值
                        if (difficulty === '困难') {
                            skillValue = Math.floor(skillValue / 2);
                        } else if (difficulty === '极难') {
                            skillValue = Math.floor(skillValue / 5);
                        }
                        
                        const result = judgeCOC(roll, skillValue);
                        
                        let difficultyText = difficulty === '普通' ? '' : `（${difficulty}难度）`;
                        let bonusText = bonus > 0 ? ` [${bonus}奖励骰]` : penalty > 0 ? ` [${penalty}惩罚骰]` : '';
                        
                        return `**${character}** 进行 **${skill}** 检定${difficultyText}${bonusText}：\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${result.emoji} **${result.text}**`;
                    },
                    stealth: false
                });
                
                // ✅ 修正版：属性检定
                context.registerFunctionTool({
                    name: "coc_attribute_check",
                    displayName: "COC属性检定",
                    description: "进行克苏鲁呼唤7版属性检定。",
                    parameters: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        type: 'object',
                        properties: {
                            character: {
                                type: 'string',
                                description: '进行检定的角色名'
                            },
                            attribute: {
                                type: 'string',
                                description: '属性名称，中文或英文'
                            },
                            bonus: {
                                type: 'integer',
                                description: '奖励骰数量',
                                default: 0
                            },
                            penalty: {
                                type: 'integer',
                                description: '惩罚骰数量',
                                default: 0
                            }
                        },
                        required: ['character', 'attribute']
                    },
                    action: async ({ character, attribute, bonus = 0, penalty = 0 }) => {
                        const roll = rollWithBonusPenalty(bonus, penalty);
                        
                        const attributeMap = {
                            '力量': 'STR', '敏捷': 'DEX', '体质': 'CON', '外貌': 'APP',
                            '意志': 'POW', '体型': 'SIZ', '智力': 'INT', '教育': 'EDU',
                            '幸运': 'LUCK'
                        };
                        
                        let standardAttr = attributeMap[attribute] || attribute;
                        const attributeValue = getAttributeValue(character, standardAttr);
                        
                        // ✅ 修正：属性值直接作为成功率，不乘以5
                        const result = judgeCOC(roll, attributeValue);
                        
                        let bonusText = bonus > 0 ? ` [${bonus}奖励骰]` : penalty > 0 ? ` [${penalty}惩罚骰]` : '';
                        
                        return `**${character}** 进行 **${attribute}** 属性检定${bonusText}：\n` +
                               `🎲 D100 = \`${roll}\` | 属性值 \`${attributeValue}\`\n` +
                               `结果: ${result.emoji} **${result.text}**`;
                    },
                    stealth: false
                });
                
                // 理智检定
                context.registerFunctionTool({
                    name: "coc_sanity_check",
                    displayName: "COC理智检定",
                    description: "进行理智检定，自动扣除理智值。",
                    parameters: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        type: 'object',
                        properties: {
                            character: {
                                type: 'string',
                                description: '进行检定的角色名'
                            },
                            lossFormula: {
                                type: 'string',
                                description: '理智损失公式，格式: "1d3/1d6"'
                            }
                        },
                        required: ['character', 'lossFormula']
                    },
                    action: async ({ character, lossFormula }) => {
                        const result = sanCheck(character, lossFormula);
                        
                        let message = `**${character}** 进行理智检定：\n` +
                                     `🎲 D100 = \`${result.roll}\` | 当前理智 \`${result.newSan + result.loss}\`\n` +
                                     `结果: ${result.result.emoji} **${result.result.text}**，损失 \`${result.loss}\` 点理智\n` +
                                     `剩余理智: **${result.newSan}**`;
                        
                        if (result.isInsane) {
                            message += `\n💔 **角色永久疯狂！**`;
                        } else if (result.isTemporaryInsanity) {
                            message += `\n😱 **临时疯狂！**`;
                        }
                        
                        return message;
                    },
                    stealth: false
                });
                
                // 战斗检定
                context.registerFunctionTool({
                    name: "coc_combat",
                    displayName: "COC战斗检定",
                    description: "进行战斗检定，自动计算伤害加值。",
                    parameters: {
                        $schema: 'http://json-schema.org/draft-04/schema#',
                        type: 'object',
                        properties: {
                            attacker: {
                                type: 'string',
                                description: '攻击者'
                            },
                            defender: {
                                type: 'string',
                                description: '防御者'
                            },
                            weaponSkill: {
                                type: 'string',
                                description: '使用的武器技能'
                            },
                            weaponDamage: {
                                type: 'string',
                                description: '武器伤害，如"1d8"'
                            }
                        },
                        required: ['attacker', 'weaponSkill', 'weaponDamage']
                    },
                    action: async ({ attacker, defender, weaponSkill, weaponDamage }) => {
                        const skillValue = getSkillValue(attacker, weaponSkill);
                        const attackRoll = rollD100();
                        const attackResult = judgeCOC(attackRoll, skillValue);
                        
                        let message = `⚔️ **战斗检定**\n\n`;
                        message += `**${attacker}** 使用 **${weaponSkill}** 攻击：\n`;
                        message += `🎲 D100 = \`${attackRoll}\` | 技能值 \`${skillValue}\`\n`;
                        message += `攻击结果: ${attackResult.emoji} **${attackResult.text}**\n\n`;
                        
                        if (attackResult.text !== '失败' && attackResult.text !== '大失败') {
                            // 计算伤害
                            const damage = parseDiceFormula(weaponDamage).total;
                            
                            // 计算伤害加值
                            const attackerStr = getAttributeValue(attacker, 'STR');
                            const attackerSiz = getAttributeValue(attacker, 'SIZ');
                            const db = calculateDB(attackerStr, attackerSiz);
                            
                            let totalDamage = damage;
                            let damageText = `${weaponDamage} = ${damage}`;
                            
                            if (db !== '0') {
                                const dbMatch = db.match(/([+-])(\d+)d(\d+)/);
                                if (dbMatch) {
                                    const dbDamage = parseDiceFormula(dbMatch[2] + 'd' + dbMatch[3]).total;
                                    totalDamage += dbDamage * (dbMatch[1] === '+' ? 1 : -1);
                                    damageText += ` + DB(${db}) = ${totalDamage}`;
                                }
                            }
                            
                            message += `💥 造成伤害: **${totalDamage}** 点\n`;
                            
                            if (attackResult.text === '极难成功') {
                                message += `✨ 极难成功：伤害取最大值或增加效果！\n`;
                            } else if (attackResult.text === '困难成功') {
                                message += `⭐ 困难成功：伤害+1D4？\n`;
                            }
                        } else if (attackResult.text === '大失败') {
                            message += `💀 **攻击大失败！** 可能造成武器损坏或自伤。\n`;
                        }
                        
                        return message;
                    },
                    stealth: false
                });
                
                console.log('[COC] 函数调用注册成功');
            }
            
            // ==================== 启动提示 ====================
            const kpName = context.extensionSettings[MODULE_NAME].kpCharacter;
            alert(`✅ COC7规则完整版加载成功！\n\n` +
                  `【可用命令】\n` +
                  `/coc 侦查 @角色 - 技能检定\n` +
                  `/san 1d3/1d6 @角色 - 理智检定\n` +
                  `/setkp 角色 - 设置KP\n\n` +
                  `【当前KP】\n` +
                  `${kpName || '未设置'}\n\n` +
                  `【规则修正】\n` +
                  `✓ 大失败判定正确\n` +
                  `✓ 属性检定不乘5\n` +
                  `✓ 支持奖励/惩罚骰\n` +
                  `✓ 理智检定自动记录\n` +
                  `✓ 战斗检定带DB计算`);
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();
