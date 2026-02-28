// ==================== AI函数调用 ====================

function registerFunctionCalls(context, data, core) {
    if (!context.isToolCallingSupported()) {
        console.log('[COC] 当前模型不支持函数调用');
        return;
    }
    
    const { rollD100, rollWithBonusPenalty, parseDiceFormula, judgeCOC, calculateDB } = core;
    
    // 理智检定（内部函数）
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
    
    // 技能检定
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
            let skillValue = data.getSkill(character, skill);
            
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
    
    // 属性检定
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
            const attributeValue = data.getAttribute(character, standardAttr);
            
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
            const skillValue = data.getSkill(attacker, weaponSkill);
            const attackRoll = rollD100();
            const attackResult = judgeCOC(attackRoll, skillValue);
            
            let message = `⚔️ **战斗检定**\n\n`;
            message += `**${attacker}** 使用 **${weaponSkill}** 攻击：\n`;
            message += `🎲 D100 = \`${attackRoll}\` | 技能值 \`${skillValue}\`\n`;
            message += `攻击结果: ${attackResult.emoji} **${attackResult.text}**\n\n`;
            
            if (attackResult.text !== '失败' && attackResult.text !== '大失败') {
                const damage = parseDiceFormula(weaponDamage).total;
                
                const attackerStr = data.getAttribute(attacker, 'STR');
                const attackerSiz = data.getAttribute(attacker, 'SIZ');
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
            } else if (attackResult.text === '大失败') {
                message += `💀 **攻击大失败！** 可能造成武器损坏或自伤。\n`;
            }
            
            return message;
        },
        stealth: false
    });
    
    console.log('[COC] 函数调用注册成功');
}
