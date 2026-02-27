// COC骰子系统 - KP联动版
// AI通过函数调用自动触发检定，同时保留手动slash命令

(function() {
    'use strict';

    const MODULE_NAME = 'coc-kp-dice';
    
    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 初始化存储 ====================
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = {
                    kpCharacter: '',  // 指定谁是KP
                    characters: {}     // 角色数据（可从之前的角色卡读取）
                };
            }
            
            // ==================== 辅助函数 ====================
            
            // 掷D100
            function rollD100() {
                return Math.floor(Math.random() * 100) + 1;
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
            
            // COC成功等级判定
            function judgeCOC(roll, skillValue) {
                if (roll === 100) return { text: '大失败', emoji: '💀' };
                if (roll >= 96 && skillValue < 50) return { text: '大失败', emoji: '💀' };
                if (roll <= Math.floor(skillValue / 5)) return { text: '极难成功', emoji: '✨' };
                if (roll <= Math.floor(skillValue / 2)) return { text: '困难成功', emoji: '⭐' };
                if (roll <= skillValue) return { text: '成功', emoji: '✅' };
                return { text: '失败', emoji: '❌' };
            }
            
            // 获取角色技能值
            function getSkillValue(characterName, skillName) {
                const settings = context.extensionSettings[MODULE_NAME];
                const char = settings.characters?.[characterName];
                if (char?.skills && char.skills[skillName]) {
                    return char.skills[skillName];
                }
                return 50; // 默认值
            }
            
            // 发送消息（由指定角色发出）
            function sendMessageAs(text, sender) {
                try {
                    // 如果指定了KP，且消息不是由用户触发，就用KP发
                    const kp = context.extensionSettings[MODULE_NAME].kpCharacter;
                    const finalSender = (sender === 'system' && kp) ? kp : sender;
                    
                    // 使用内置 /send 命令
                    context.executeSlashCommands(`/send ${finalSender} ${text}`);
                } catch (e) {
                    console.error('[COC] 发送消息失败:', e);
                }
            }
            
            // ==================== 注册Slash命令（手动使用）====================
            
            // /coc 技能名 @角色名 - 手动检定
            context.registerSlashCommand('coc', (args, value) => {
                const input = value || '';
                
                // 解析角色名（如果有@）
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
                
                // 纯数字
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
            
            // /setkp 角色名 - 设置谁是KP
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
            
            // ==================== 注册函数调用（AI自动使用）====================
            
            if (context.isToolCallingSupported()) {
                
                // 1. 基础掷骰子函数
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
                    stealth: false // 在聊天中显示调用结果
                });
                
                // 2. COC技能检定函数 - 这是核心！
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
                        
                        // 返回结构化结果，AI会用它继续叙事
                        return `**${character}** 进行 **${skill}** 检定${difficultyMod}：\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${result.emoji} **${result.text}**`;
                    },
                    stealth: false
                });
                
                // 3. 属性检定函数
                context.registerFunctionTool({
                    name: "coc_attribute_check",
                    displayName: "COC属性检定",
                    description: "进行克苏鲁呼唤7版属性检定。当需要测试角色属性时调用，如力量、敏捷等。",
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
                                enum: ['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'LUCK'],
                                description: '属性名称'
                            }
                        },
                        required: ['character', 'attribute']
                    },
                    action: async ({ character, attribute }) => {
                        const roll = rollD100();
                        // 属性检定成功率 = 属性值 * 5
                        const settings = context.extensionSettings[MODULE_NAME];
                        const attributeValue = settings.characters?.[character]?.[attribute] || 50;
                        const successRate = attributeValue * 5;
                        
                        const result = judgeCOC(roll, successRate);
                        
                        return `**${character}** 进行 **${attribute}** 属性检定：\n` +
                               `🎲 D100 = \`${roll}\` | 成功率 \`${successRate}%\`\n` +
                               `结果: ${result.emoji} **${result.text}**`;
                    },
                    stealth: false
                });
                
                console.log('[COC] 函数调用注册成功');
            } else {
                console.log('[COC] 当前模型不支持函数调用，AI将无法自动触发检定');
            }
            
            // ==================== 启动提示 ====================
            const kpName = context.extensionSettings[MODULE_NAME].kpCharacter;
            alert(`✅ COC骰子系统加载成功！\n\n` +
                  `【手动指令】\n` +
                  `/coc 100 @角色名 - 掷D100\n` +
                  `/coc 侦查 @角色名 - 技能检定\n` +
                  `/setkp 角色名 - 设置KP\n\n` +
                  `【AI自动】\n` +
                  `当前KP: ${kpName || '未设置'} (用 /setkp 设置)\n` +
                  `如果模型支持函数调用，AI会通过以下函数自动触发检定：\n` +
                  `- roll_dice(expression, character)\n` +
                  `- coc_skill_check(character, skill, difficulty)\n` +
                  `- coc_attribute_check(character, attribute)\n\n` +
                  `【使用步骤】\n` +
                  `1. 用 /setkp 指定AI角色为KP\n` +
                  `2. 在AI角色卡中提示它可以使用这些函数\n` +
                  `3. 玩家输入行动，AI决定何时检定`);
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();
