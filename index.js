// COC骰子系统 - KP联动版（修复参数匹配）
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
            
            function rollD100() {
                return Math.floor(Math.random() * 100) + 1;
            }
            
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
            
            function judgeCOC(roll, skillValue) {
                if (roll === 100) return { text: '大失败', emoji: '💀' };
                if (roll >= 96 && skillValue < 50) return { text: '大失败', emoji: '💀' };
                if (roll <= Math.floor(skillValue / 5)) return { text: '极难成功', emoji: '✨' };
                if (roll <= Math.floor(skillValue / 2)) return { text: '困难成功', emoji: '⭐' };
                if (roll <= skillValue) return { text: '成功', emoji: '✅' };
                return { text: '失败', emoji: '❌' };
            }
            
            function getSkillValue(characterName, skillName) {
                const settings = context.extensionSettings[MODULE_NAME];
                const char = settings.characters?.[characterName];
                if (char?.skills && char.skills[skillName]) {
                    return char.skills[skillName];
                }
                return 50;
            }
            
            function sendMessageAs(text, sender) {
                try {
                    const kp = context.extensionSettings[MODULE_NAME].kpCharacter;
                    const finalSender = (sender === 'system' && kp) ? kp : sender;
                    context.executeSlashCommands(`/send ${finalSender} ${text}`);
                } catch (e) {
                    console.error('[COC] 发送消息失败:', e);
                }
            }
            
            // ==================== 注册Slash命令 ====================
            
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
            
            context.registerSlashCommand('setkp', (args, value) => {
                const kpName = value || args?.name || '';
                if (!kpName) {
                    sendMessageAs('❌ 请指定KP角色名: /setkp 克苏鲁', 'system');
                    return '';
                }
                
                const settings = context.extensionSettings[MODULE_NAME];
                settings.kpCharacter = kpName;
                context.saveSettingsDebounced();
                sendMessageAs(`✅ 已将 ${kpName} 设置为KP`, 'system');
                return '';
                
            }, [], '设置KP角色');
            
            // ==================== 注册函数调用 ====================
            
            if (context.isToolCallingSupported()) {
                
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
                                description: '骰子表达式，例如："d100"、"2d6+3"、"3d8"'
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
                
                context.registerFunctionTool({
                    name: "coc_skill_check",
                    displayName: "COC技能检定",
                    description: "进行克苏鲁呼唤7版技能检定。当角色尝试使用技能时调用，例如侦查、聆听、图书馆使用等。",
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
                                description: '技能名称，如："侦查"、"聆听"、"图书馆使用"、"说服"、"潜行"'
                            },
                            difficulty: {
                                type: 'string',
                                enum: ['普通', '困难', '极难'],
                                description: '检定难度，默认普通',
                                default: '普通'
                            }
                        },
                        required: ['character', 'skill']
                    },
                    action: async ({ character, skill, difficulty = '普通' }) => {
                        const roll = rollD100();
                        const skillValue = getSkillValue(character, skill);
                        const result = judgeCOC(roll, skillValue);
                        
                        let difficultyMod = '';
                        if (difficulty === '困难') {
                            difficultyMod = '（困难难度）';
                        } else if (difficulty === '极难') {
                            difficultyMod = '（极难难度）';
                        }
                        
                        return `**${character}** 进行 **${skill}** 检定${difficultyMod}：\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${result.emoji} **${result.text}**`;
                    },
                    stealth: false
                });
                
                // ✅ 修复版：属性检定函数（接受中英文）
                context.registerFunctionTool({
                    name: "coc_attribute_check",
                    displayName: "COC属性检定",
                    description: "进行克苏鲁呼唤7版属性检定。当需要测试角色属性时调用，如力量、敏捷等。接受中文或英文参数。",
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
                                description: '属性名称，可以是中文或英文，如："力量"/"STR"、"敏捷"/"DEX"等'
                            }
                        },
                        required: ['character', 'attribute']
                    },
                    action: async ({ character, attribute }) => {
                        const roll = rollD100();
                        
                        // 属性名称映射表
                        const attributeMap = {
                            // 中文 -> 英文
                            '力量': 'STR', '敏捷': 'DEX', '体质': 'CON', '外貌': 'APP',
                            '意志': 'POW', '体型': 'SIZ', '智力': 'INT', '教育': 'EDU',
                            '幸运': 'LUCK',
                            // 英文别名
                            'STRENGTH': 'STR', 'DEXTERITY': 'DEX', 'CONSTITUTION': 'CON',
                            'APPEARANCE': 'APP', 'POWER': 'POW', 'SIZE': 'SIZ',
                            'INTELLIGENCE': 'INT', 'EDUCATION': 'EDU', 'LUCK': 'LUCK'
                        };
                        
                        // 获取标准英文属性名
                        let standardAttr = attributeMap[attribute] || attributeMap[attribute.toUpperCase()];
                        if (!standardAttr) {
                            // 如果没找到，尝试直接使用输入（可能是STR/DEX等）
                            standardAttr = attribute.toUpperCase();
                        }
                        
                        // 读取角色属性值
                        const settings = context.extensionSettings[MODULE_NAME];
                        const attributeValue = settings.characters?.[character]?.[standardAttr] || 50;
                        const successRate = attributeValue * 5;
                        
                        const result = judgeCOC(roll, successRate);
                        
                        // 在返回消息中使用原始输入（保持用户看到的是"力量"而不是"STR"）
                        return `**${character}** 进行 **${attribute}** 属性检定：\n` +
                               `🎲 D100 = \`${roll}\` | 成功率 \`${successRate}%\`\n` +
                               `结果: ${result.emoji} **${result.text}**`;
                    },
                    stealth: false
                });
                
                console.log('[COC] 函数调用注册成功');
            } else {
                console.log('[COC] 当前模型不支持函数调用');
            }
            
            const kpName = context.extensionSettings[MODULE_NAME].kpCharacter;
            alert(`✅ COC骰子系统加载成功！\n\n` +
                  `【手动指令】\n` +
                  `/coc 100 @角色名 - 掷D100\n` +
                  `/coc 侦查 @角色名 - 技能检定\n` +
                  `/setkp 角色名 - 设置KP\n\n` +
                  `【AI自动】\n` +
                  `当前KP: ${kpName || '未设置'}\n` +
                  `支持中文/英文属性名称：力量/STR、敏捷/DEX等`);
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();
