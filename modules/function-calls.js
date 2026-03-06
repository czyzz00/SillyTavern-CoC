// ==================== AI函数调用 ====================

function registerFunctionCalls(context, data, core) {
    if (!context.isToolCallingSupported()) {
        console.log('[COC] 当前模型不支持函数调用');
        return;
    }
    
    const { rollD100, rollWithBonusPenalty, parseDiceFormula, judgeCOC, calculateDB } = core;
    
    // ==================== 原有函数 ====================
    
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
        description: "进行理智检定，自动扣除理智值，并可能触发疯狂。",
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
                },
                source: {
                    type: 'string',
                    description: '理智损失的来源（用于疯狂触发）',
                    default: '未知恐怖'
                }
            },
            required: ['character', 'lossFormula']
        },
        action: async ({ character, lossFormula, source = '未知恐怖' }) => {
            const result = sanCheck(character, lossFormula, source);
            
            let message = `**${character}** 进行理智检定：\n` +
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

    // ==================== 新增疯狂相关函数 ====================

    /**
     * 触发临时疯狂
     */
    context.registerFunctionTool({
        name: "coc_trigger_temporary_insanity",
        displayName: "触发临时疯狂",
        description: "手动触发角色的临时疯狂。用于KP在角色目睹恐怖事物后调用。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                },
                sanLoss: {
                    type: 'integer',
                    description: '本次损失的SAN值',
                    default: 5
                },
                source: {
                    type: 'string',
                    description: '疯狂来源',
                    default: '未知恐怖'
                }
            },
            required: ['character']
        },
        action: async ({ character, sanLoss = 5, source = '未知恐怖' }) => {
            // 需要从 window 对象获取全局函数
            if (typeof window.triggerTemporaryInsanity !== 'function') {
                return '❌ 疯狂系统未加载';
            }
            
            const result = window.triggerTemporaryInsanity(character, sanLoss, source);
            
            if (!result) {
                return `❌ 角色 ${character} 不存在`;
            }
            
            if (!result.triggered) {
                return `✅ ${character} 的智力检定失败，压抑了恐怖记忆（${result.reason}）`;
            }
            
            return `😱 **${character} 陷入临时疯狂！**\n` +
                   `症状：${result.symptom}\n` +
                   `持续时间：${result.duration}小时\n` +
                   `来源：${result.source || '未知'}`;
        },
        stealth: false
    });

    /**
     * 结束疯狂发作
     */
    context.registerFunctionTool({
        name: "coc_end_insanity",
        displayName: "结束疯狂发作",
        description: "结束角色的疯狂发作阶段，进入潜在疯狂。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                }
            },
            required: ['character']
        },
        action: async ({ character }) => {
            if (typeof window.endInsanityEpisode !== 'function') {
                return '❌ 疯狂系统未加载';
            }
            
            const result = window.endInsanityEpisode(character);
            
            if (!result) {
                return `❌ 角色 ${character} 没有处于疯狂状态`;
            }
            
            let message = `✅ **${character}** 的疯狂发作结束，进入潜在疯狂阶段\n`;
            
            if (result.summarySymptom) {
                message += `总结症状：${result.summarySymptom}\n`;
            }
            
            return message;
        },
        stealth: false
    });

    /**
     * 现实认知检定
     */
    context.registerFunctionTool({
        name: "coc_reality_check",
        displayName: "现实认知检定",
        description: "进行现实认知检定，判断角色是否能看穿幻觉。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                }
            },
            required: ['character']
        },
        action: async ({ character }) => {
            if (typeof window.realityCheck !== 'function') {
                return '❌ 疯狂系统未加载';
            }
            
            const result = window.realityCheck(character);
            
            if (!result.allowed) {
                return `❌ ${character} 不在潜在疯狂阶段，无法进行现实认知检定`;
            }
            
            if (result.success) {
                return `✨ **${character}** 现实认知检定成功！\n` +
                       `🎲 D100 = ${result.roll} | 理智 ${result.san}\n` +
                       `结果：你意识到眼前景象的虚幻本质`;
            } else {
                return `😵 **${character}** 现实认知检定失败！\n` +
                       `🎲 D100 = ${result.roll} | 理智 ${result.san}\n` +
                       `结果：损失1点理智，剩余 ${result.newSan}`;
            }
        },
        stealth: false
    });

    /**
     * 检查不定性疯狂
     */
    context.registerFunctionTool({
        name: "coc_check_indefinite_insanity",
        displayName: "检查不定性疯狂",
        description: "检查角色是否触发不定性疯狂（一天内累计损失≥当前SAN的1/5）。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                },
                totalLossToday: {
                    type: 'integer',
                    description: '本日累计理智损失'
                }
            },
            required: ['character', 'totalLossToday']
        },
        action: async ({ character, totalLossToday }) => {
            if (typeof window.checkIndefiniteInsanity !== 'function') {
                return '❌ 疯狂系统未加载';
            }
            
            const result = window.checkIndefiniteInsanity(character, totalLossToday);
            
            if (!result) {
                return `❌ 角色 ${character} 不存在`;
            }
            
            if (!result.triggered) {
                return `✅ ${character} 未触发不定性疯狂（${result.reason}）`;
            }
            
            return `⚠️ **${character} 触发不定性疯狂！**\n` +
                   `症状：${result.symptom}\n` +
                   `类型：不定性疯狂（持续整个模组）`;
        },
        stealth: false
    });

    /**
     * 获取角色疯狂状态
     */
    context.registerFunctionTool({
        name: "coc_get_insanity_status",
        displayName: "获取疯狂状态",
        description: "查看角色的当前疯狂状态。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                }
            },
            required: ['character']
        },
        action: async ({ character }) => {
            const char = data.get(character);
            if (!char) return `❌ 角色 ${character} 不存在`;
            
            const insanity = char.stats.insanity;
            if (!insanity) return `✅ ${character} 目前神智清醒，无疯狂状态`;
            
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
            
            return status;
        },
        stealth: false
    });

    /**
     * 添加恐惧症（KP手动）
     */
    context.registerFunctionTool({
        name: "coc_add_phobia",
        displayName: "添加恐惧症",
        description: "手动为角色添加恐惧症。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                },
                phobiaName: {
                    type: 'string',
                    description: '恐惧症名称'
                },
                source: {
                    type: 'string',
                    description: '来源',
                    default: 'KP设定'
                }
            },
            required: ['character', 'phobiaName']
        },
        action: async ({ character, phobiaName, source = 'KP设定' }) => {
            const char = data.get(character);
            if (!char) return `❌ 角色 ${character} 不存在`;
            
            if (!char.stats.phobias) char.stats.phobias = [];
            char.stats.phobias.push({
                name: phobiaName,
                source
            });
            
            data.save();
            
            return `✅ 已为 ${character} 添加恐惧症：${phobiaName}`;
        },
        stealth: false
    });

    /**
     * 添加躁狂症（KP手动）
     */
    context.registerFunctionTool({
        name: "coc_add_mania",
        displayName: "添加躁狂症",
        description: "手动为角色添加躁狂症。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                },
                maniaName: {
                    type: 'string',
                    description: '躁狂症名称'
                },
                source: {
                    type: 'string',
                    description: '来源',
                    default: 'KP设定'
                }
            },
            required: ['character', 'maniaName']
        },
        action: async ({ character, maniaName, source = 'KP设定' }) => {
            const char = data.get(character);
            if (!char) return `❌ 角色 ${character} 不存在`;
            
            if (!char.stats.manias) char.stats.manias = [];
            char.stats.manias.push({
                name: maniaName,
                source
            });
            
            data.save();
            
            return `✅ 已为 ${character} 添加躁狂症：${maniaName}`;
        },
        stealth: false
    });

    // ==================== 新增伤害/恢复函数 ====================

    /**
     * 造成伤害
     */
    context.registerFunctionTool({
        name: "coc_take_damage",
        displayName: "造成伤害",
        description: "对角色造成伤害，自动处理重伤、濒死状态。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                },
                damage: {
                    type: 'integer',
                    description: '伤害值'
                },
                source: {
                    type: 'string',
                    description: '伤害来源',
                    default: '未知'
                }
            },
            required: ['character', 'damage']
        },
        action: async ({ character, damage, source = '未知' }) => {
            if (typeof window.takeDamage !== 'function') {
                return '❌ 伤害系统未加载';
            }
            
            const result = window.takeDamage(character, damage, { location: source });
            
            if (!result) {
                return `❌ 角色 ${character} 不存在`;
            }
            
            let message = `💥 **${character}** 受到 ${damage} 点伤害\n`;
            message += `HP: ${result.oldHP} → ${result.newHP}\n`;
            
            if (result.isMajorWound) {
                message += `⚠️ **造成重伤！**\n`;
            }
            if (result.isDying) {
                message += `💀 **角色进入濒死状态！**\n`;
            } else if (result.isUnconscious) {
                message += `😵 **角色昏迷！**\n`;
            }
            
            return message;
        },
        stealth: false
    });

    /**
     * 急救
     */
    context.registerFunctionTool({
        name: "coc_first_aid",
        displayName: "急救",
        description: "对濒死角色进行急救。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '受伤角色名'
                },
                medic: {
                    type: 'string',
                    description: '施救者名'
                }
            },
            required: ['character', 'medic']
        },
        action: async ({ character, medic }) => {
            if (typeof window.firstAid !== 'function') {
                return '❌ 急救系统未加载';
            }
            
            const result = window.firstAid(character, medic);
            return result.message;
        },
        stealth: false
    });

    /**
     * 医学治疗
     */
    context.registerFunctionTool({
        name: "coc_medicine",
        displayName: "医学治疗",
        description: "进行医学治疗，恢复HP。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '受伤角色名'
                },
                doctor: {
                    type: 'string',
                    description: '医生名'
                }
            },
            required: ['character', 'doctor']
        },
        action: async ({ character, doctor }) => {
            if (typeof window.medicine !== 'function') {
                return '❌ 医学系统未加载';
            }
            
            const result = window.medicine(character, doctor);
            return result.message;
        },
        stealth: false
    });

    /**
     * 自然恢复
     */
    context.registerFunctionTool({
        name: "coc_natural_healing",
        displayName: "自然恢复",
        description: "进行自然恢复（每天一次）。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                }
            },
            required: ['character']
        },
        action: async ({ character }) => {
            if (typeof window.naturalHealing !== 'function') {
                return '❌ 恢复系统未加载';
            }
            
            const result = window.naturalHealing(character);
            return result.message;
        },
        stealth: false
    });

    /**
     * 重伤恢复检定
     */
    context.registerFunctionTool({
        name: "coc_major_wound_recovery",
        displayName: "重伤恢复检定",
        description: "进行重伤恢复检定（每周一次）。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                }
            },
            required: ['character']
        },
        action: async ({ character }) => {
            if (typeof window.majorWoundRecovery !== 'function') {
                return '❌ 重伤系统未加载';
            }
            
            const result = window.majorWoundRecovery(character);
            if (!result) {
                return `❌ ${character} 不处于重伤状态`;
            }
            return result.message;
        },
        stealth: false
    });

    /**
     * 濒死体质检定
     */
    context.registerFunctionTool({
        name: "coc_dying_check",
        displayName: "濒死体质检定",
        description: "濒死角色进行体质检定（每个行动轮一次）。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                }
            },
            required: ['character']
        },
        action: async ({ character }) => {
            if (typeof window.handleDying !== 'function') {
                return '❌ 濒死系统未加载';
            }
            
            const result = window.handleDying(character);
            return result?.message || `❌ ${character} 不处于濒死状态`;
        },
        stealth: false
    });

    // ==================== 新增幸运/孤注一掷函数 ====================

    /**
     * 使用幸运
     */
    context.registerFunctionTool({
        name: "coc_spend_luck",
        displayName: "使用幸运",
        description: "消耗幸运值调整检定结果。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                },
                originalRoll: {
                    type: 'integer',
                    description: '原始掷骰结果'
                },
                targetValue: {
                    type: 'integer',
                    description: '目标技能/属性值'
                },
                points: {
                    type: 'integer',
                    description: '使用的幸运点数'
                }
            },
            required: ['character', 'originalRoll', 'targetValue', 'points']
        },
        action: async ({ character, originalRoll, targetValue, points }) => {
            const char = data.get(character);
            if (!char) return `❌ 角色 ${character} 不存在`;
            
            const luck = char.stats.luck?.current || 0;
            
            if (points > luck) {
                return `❌ 幸运不足（需要${points}，现有${luck}）`;
            }
            
            if (originalRoll === 1 || originalRoll === 100) {
                return `❌ 不能调整大成功/大失败`;
            }
            
            const newRoll = originalRoll - points;
            char.stats.luck.current -= points;
            data.save();
            
            const newResult = judgeCOC(newRoll, targetValue);
            
            return `✨ **${character}** 使用 ${points} 点幸运\n` +
                   `🎲 ${originalRoll} → ${newRoll}\n` +
                   `结果：${newResult.emoji} **${newResult.text}**\n` +
                   `剩余幸运：${char.stats.luck.current}`;
        },
        stealth: false
    });

    /**
     * 孤注一掷
     */
    context.registerFunctionTool({
        name: "coc_push_roll",
        displayName: "孤注一掷",
        description: "技能检定失败后进行孤注一掷。",
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                character: {
                    type: 'string',
                    description: '角色名'
                },
                skill: {
                    type: 'string',
                    description: '技能名称'
                },
                context: {
                    type: 'string',
                    description: '检定情境描述'
                }
            },
            required: ['character', 'skill', 'context']
        },
        action: async ({ character, skill, context }) => {
            const char = data.get(character);
            if (!char) return `❌ 角色 ${character} 不存在`;
            
            const skillValue = char.stats.skills?.[skill] || 50;
            const newRoll = rollD100();
            const result = judgeCOC(newRoll, skillValue);
            
            if (!char.stats.pushedRolls) char.stats.pushedRolls = [];
            char.stats.pushedRolls.push({
                skill,
                timestamp: new Date().toISOString(),
                context,
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
            
            let message = `⚔️ **${character}** 进行孤注一掷！\n`;
            message += `技能：${skill} (${skillValue}%)\n`;
            message += `🎲 D100 = ${newRoll}\n`;
            message += `结果：${result.emoji} **${result.text}**\n`;
            
            if (result.text === '失败' || result.text === '大失败') {
                message += `\n💀 **后果：${consequence}**`;
            } else {
                message += `\n✨ 孤注一掷成功！`;
            }
            
            return message;
        },
        stealth: false
    });

    console.log('[COC] 函数调用注册成功（包含疯狂、伤害、幸运系统）');
}
