// ==================== 角色卡面板UI ====================

function registerCharacterPanel(context, data, core) {
    const { calculateMaxHP, calculateMaxSAN, calculateMove, calculateBuild, calculateDB, rollD100, parseDiceFormula, OCCUPATIONS, SOCIAL_SKILLS, SCIENCE_SKILLS, CRAFT_SKILLS, SKILL_BASE_VALUES, LANGUAGE_SKILLS } = core;
    
    let panelElement = null;
    let isEditing = false;
    let currentEditName = '';
    let currentEditStats = null;
    
    // 预定义技能列表
    const SKILLS_LIST = {
        occupational: [
            '会计', '人类学', '估价', '考古学', '艺术/工艺', '信用评级', '克苏鲁神话',
            '乔装', '驾驶', '电气维修', '电子', '格斗(斗殴)', '射击(手枪)', '射击(步枪)',
            '急救', '历史', '恐吓', '跳跃', '法律', '图书馆使用', '聆听', '锁匠', '机械维修',
            '医学', '自然', '导航', '神秘学', '操作重型机械', '说服', '攀爬', '精神分析',
            '心理', '骑术', '科学', '妙手', '侦查', '潜行', '生存', '游泳', '投掷', '追踪'
        ],
        interest: [
            '会计', '人类学', '估价', '考古学', '艺术/工艺', '信用评级', '克苏鲁神话',
            '乔装', '驾驶', '电气维修', '电子', '格斗(斗殴)', '射击(手枪)', '射击(步枪)',
            '急救', '历史', '恐吓', '跳跃', '法律', '图书馆使用', '聆听', '锁匠', '机械维修',
            '医学', '自然', '导航', '神秘学', '操作重型机械', '说服', '攀爬', '精神分析',
            '心理', '骑术', '科学', '妙手', '侦查', '潜行', '生存', '游泳', '投掷', '追踪'
        ],
        fighting: [
            '格斗(斗殴)', '格斗(刀)', '格斗(剑)', '格斗(棍)', '格斗(斧)', 
            '射击(手枪)', '射击(步枪)', '射击(冲锋枪)', '射击(猎枪)', '投掷'
        ]
    };
    
    // 预定义武器列表
    const WEAPONS_LIST = [
        { name: '拳头', skill: '格斗(斗殴)', damage: '1d3+db' },
        { name: '踢', skill: '格斗(斗殴)', damage: '1d6+db' },
        { name: '小刀', skill: '格斗(刀)', damage: '1d4+db' },
        { name: '短棍', skill: '格斗(棍)', damage: '1d6+db' },
        { name: '手枪', skill: '射击(手枪)', damage: '1d10' },
        { name: '左轮手枪', skill: '射击(手枪)', damage: '1d10' },
        { name: '猎枪', skill: '射击(猎枪)', damage: '2d6/1d6' },
        { name: '步枪', skill: '射击(步枪)', damage: '2d6' },
        { name: '冲锋枪', skill: '射击(冲锋枪)', damage: '1d10' },
        { name: '手榴弹', skill: '投掷', damage: '4d10' }
    ];
    
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

    // ==================== 疯狂系统常量 ====================
    const INSTANT_INSANITY_SYMPTOMS = [
        "失忆：不记得过去5分钟发生的事，也无法建立新的短期记忆",
        "假性残疾：心理原因导致身体机能丧失（失明、失聪、失声等）",
        "暴力倾向：对周围人无差别攻击，优先攻击最近的目标",
        "偏执：对所有人产生严重不信任，认为他们想伤害自己",
        "仪式行为：必须重复某个动作才能行动（如洗手、数数、转圈）",
        "恐惧症：对某事物产生极度恐惧，会避开或逃离该事物",
        "躁狂症：对某事物产生极度狂热，会不顾一切追求该事物",
        "幻觉：看到/听到不存在的事物，并根据幻觉行动",
        "人格解体：感觉自己不是自己，像在看别人的生活",
        "道德障碍：失去道德约束，做出平时不会做的事"
    ];

    const SUMMARY_INSANITY_SYMPTOMS = [
        "失忆：不记得疯狂期间发生的事",
        "恐惧症：获得一项新的恐惧症",
        "躁狂症：获得一项新的躁狂症",
        "人格改变：性格发生永久改变（KP根据情况设定）",
        "幻觉残留：偶尔还会看到幻觉，但能意识到是假的"
    ];

    const PHOBIAS = [
        "恐高症", "幽闭恐惧症", "广场恐惧症", "社交恐惧症", "黑暗恐惧症",
        "恐血恐惧症", "恐水恐惧症", "火焰恐惧症", "雷电恐惧症", "动物恐惧症",
        "蜘蛛恐惧症", "蛇类恐惧症", "死亡恐惧症", "疾病恐惧症", "疯狂恐惧症",
        "尸体恐惧症", "镜子恐惧症", "数字恐惧症", "神明恐惧症", "孤独恐惧症"
    ];

    const MANIAS = [
        "清洁癖", "囤积癖", "偷窃癖", "纵火癖", "赌博癖",
        "谎言癖", "购物癖", "暴食癖", "酗酒癖", "药物癖",
        "工作狂", "运动狂", "宗教狂", "权力狂", "知识狂",
        "收藏癖", "仪式癖", "自虐癖", "虐待癖", "暴露癖"
    ];

    // ==================== 属性生成和年龄修正函数 ====================

    function getAgeAdjustmentRule(age) {
        if (!Number.isFinite(age)) return null;
        if (age >= 15 && age <= 19) {
            return { eduGrowthTimes: 0, eduLoss: 5, appLoss: 0, physicalLoss: 5, physicalFields: ['STR', 'SIZ'] };
        }
        if (age >= 20 && age <= 39) {
            return { eduGrowthTimes: 1, eduLoss: 0, appLoss: 0, physicalLoss: 0, physicalFields: [] };
        }
        if (age >= 40 && age <= 49) {
            return { eduGrowthTimes: 2, eduLoss: 0, appLoss: 5, physicalLoss: 5, physicalFields: ['STR', 'CON', 'DEX'] };
        }
        if (age >= 50 && age <= 59) {
            return { eduGrowthTimes: 3, eduLoss: 0, appLoss: 10, physicalLoss: 10, physicalFields: ['STR', 'CON', 'DEX'] };
        }
        if (age >= 60 && age <= 69) {
            return { eduGrowthTimes: 4, eduLoss: 0, appLoss: 15, physicalLoss: 20, physicalFields: ['STR', 'CON', 'DEX'] };
        }
        if (age >= 70 && age <= 79) {
            return { eduGrowthTimes: 4, eduLoss: 0, appLoss: 20, physicalLoss: 40, physicalFields: ['STR', 'CON', 'DEX'] };
        }
        if (age >= 80 && age <= 89) {
            return { eduGrowthTimes: 4, eduLoss: 0, appLoss: 25, physicalLoss: 80, physicalFields: ['STR', 'CON', 'DEX'] };
        }
        return null;
    }

    function normalizeAgeAdjustments(age, adjustments = {}) {
        const rule = getAgeAdjustmentRule(age);
        if (!rule || rule.physicalLoss <= 0) return { normalized: {}, rule };

        const normalized = {};
        const fields = rule.physicalFields;
        let total = 0;
        fields.forEach((field, index) => {
            const value = Math.max(0, parseInt(adjustments[field]) || 0);
            normalized[field] = value;
            total += value;
        });

        if (total > rule.physicalLoss) {
            let overflow = total - rule.physicalLoss;
            for (let i = fields.length - 1; i >= 0 && overflow > 0; i -= 1) {
                const field = fields[i];
                const reduce = Math.min(normalized[field], overflow);
                normalized[field] -= reduce;
                overflow -= reduce;
            }
        } else if (total < rule.physicalLoss && fields.length > 0) {
            normalized[fields[0]] += (rule.physicalLoss - total);
        }

        return { normalized, rule };
    }

    // 3D6 × 5
    function roll3d6x5() {
        const roll = Math.floor(Math.random() * 6) + 1 + 
                     Math.floor(Math.random() * 6) + 1 + 
                     Math.floor(Math.random() * 6) + 1;
        return roll * 5;
    }

    // (2D6+6) × 5
    function roll2d6plus6x5() {
        const roll = Math.floor(Math.random() * 6) + 1 + 
                     Math.floor(Math.random() * 6) + 1 + 6;
        return roll * 5;
    }

    // 生成基础属性（骰子原始值）
    function generateBaseAttributes(age = 30) {
        const luckRolls = [roll3d6x5()];
        if (age >= 15 && age <= 19) {
            luckRolls.push(roll3d6x5());
        }

        return {
            baseSTR: roll3d6x5(),
            baseDEX: roll3d6x5(),
            baseCON: roll3d6x5(),
            baseAPP: roll3d6x5(),
            basePOW: roll3d6x5(),
            baseSIZ: roll2d6plus6x5(),
            baseINT: roll2d6plus6x5(),
            baseEDU: roll2d6plus6x5(),
            baseLUCK: Math.max(...luckRolls)
        };
    }

    // 教育成长判定：1D100 > 当前EDU 则 +1D10
    function applyEduGrowth(currentEdu) {
        const roll = Math.floor(Math.random() * 100) + 1;
        if (roll > currentEdu) {
            const growth = Math.floor(Math.random() * 10) + 1;
            return currentEdu + growth;
        }
        return currentEdu;
    }

    // 根据年龄应用属性修正
    function applyAgeEffects(baseAttrs, age, adjustments = {}) {
        // 复制基础值
        let result = {
            STR: baseAttrs.baseSTR,
            DEX: baseAttrs.baseDEX,
            CON: baseAttrs.baseCON,
            APP: baseAttrs.baseAPP,
            POW: baseAttrs.basePOW,
            SIZ: baseAttrs.baseSIZ,
            INT: baseAttrs.baseINT,
            EDU: baseAttrs.baseEDU,
            LUCK: baseAttrs.baseLUCK
        };

        const rule = getAgeAdjustmentRule(age);
        if (!rule) return result;

        for (let i = 0; i < rule.eduGrowthTimes; i += 1) {
            result.EDU = applyEduGrowth(result.EDU);
        }

        if (rule.eduLoss > 0) {
            result.EDU = Math.max(0, result.EDU - rule.eduLoss);
        }

        if (rule.appLoss > 0) {
            result.APP = Math.max(15, result.APP - rule.appLoss);
        }

        if (rule.physicalLoss > 0 && rule.physicalFields.length > 0) {
            const { normalized } = normalizeAgeAdjustments(age, adjustments);
            rule.physicalFields.forEach(field => {
                const loss = normalized[field] || 0;
                result[field] = Math.max(15, result[field] - loss);
            });
        }

        return result;
    }

    // ==================== 技能点计算 ====================

    function calculateOccupationPoints(occupationName, attributes) {
        const occupation = OCCUPATIONS[occupationName];
        if (!occupation) return 0;
        
        const { STR, DEX, CON, APP, POW, INT, SIZ, EDU } = attributes;
        
        let formula = occupation.pointFormula;
        formula = formula.replace(/STR/g, STR)
                         .replace(/DEX/g, DEX)
                         .replace(/CON/g, CON)
                         .replace(/APP/g, APP)
                         .replace(/POW/g, POW)
                         .replace(/INT/g, INT)
                         .replace(/SIZ/g, SIZ)
                         .replace(/EDU/g, EDU);
        
        try {
            const total = eval(formula);
            return Math.floor(total);
        } catch (e) {
            console.error('公式计算错误:', formula);
            return 0;
        }
    }

    function calculateInterestPoints(intelligence) {
        return intelligence * 2;
    }

    function getSkillBaseValue(skillName) {
        if (skillName.includes('艺术/工艺')) return 5;
        if (skillName.includes('科学(')) return 1;
        if (skillName.includes('外语')) return 1;
        
        if (SKILL_BASE_VALUES[skillName] !== undefined) {
            return SKILL_BASE_VALUES[skillName];
        }
        
        for (let key in SKILL_BASE_VALUES) {
            if (skillName.includes(key) || key.includes(skillName.split('(')[0])) {
                return SKILL_BASE_VALUES[key];
            }
        }
        
        return 5;
    }

    function getOccupationNames() {
        return Object.keys(OCCUPATIONS).sort();
    }

    // 获取职业的技能列表（展开占位符）
    function getOccupationSkillList(occupationName) {
        const occupation = OCCUPATIONS[occupationName];
        if (!occupation) return [];
        
        let skillList = [];
        occupation.skills.forEach(skill => {
            if (skill.includes('社交技能')) {
                const match = skill.match(/社交技能(\d+)项/);
                const count = match ? parseInt(match[1]) : 1;
                for (let i = 0; i < count; i++) {
                    skillList.push('社交技能');
                }
            } else if (skill.includes('外语')) {
                const match = skill.match(/外语(\d+)项/);
                const count = match ? parseInt(match[1]) : 1;
                for (let i = 0; i < count; i++) {
                    skillList.push('外语');
                }
            } else if (skill.includes('科学(')) {
                skillList.push(skill);
            } else if (skill.includes('艺术/工艺')) {
                if (skill.includes('(')) {
                    skillList.push(skill);
                } else {
                    skillList.push('艺术/工艺');
                }
            } else if (skill.includes('本专业学术技能')) {
                const match = skill.match(/本专业学术技能(\d+)项/);
                const count = match ? parseInt(match[1]) : 1;
                for (let i = 0; i < count; i++) {
                    skillList.push('学术技能');
                }
            } else {
                skillList.push(skill);
            }
        });
        
        return skillList;
    }

    // 渲染技能选项（支持职业过滤）
    function renderSkillOptions(selectedSkill, type, occupationName) {
        let list = [];
        
        if (type === 'occupational') {
            const occupation = OCCUPATIONS[occupationName];
            if (occupation) {
                list = getOccupationSkillList(occupationName);
                list = list.map(skill => {
                    if (skill === '社交技能') {
                        return SOCIAL_SKILLS;
                    } else if (skill === '外语') {
                        return LANGUAGE_SKILLS;
                    } else if (skill === '艺术/工艺') {
                        return CRAFT_SKILLS.map(s => `艺术/工艺(${s})`);
                    } else if (skill === '学术技能') {
                        return SCIENCE_SKILLS.map(s => `科学(${s})`);
                    } else if (skill.includes('科学(')) {
                        return [skill];
                    } else if (skill.includes('艺术/工艺(')) {
                        return [skill];
                    } else {
                        return skill;
                    }
                }).flat();
            } else {
                list = SKILLS_LIST.occupational;
            }
        } else if (type === 'interest') {
            list = SKILLS_LIST.interest;
        } else {
            list = SKILLS_LIST[type] || [];
        }
        
        list = [...new Set(list)].sort();
        
        return list.map(skill => 
            `<option value="${skill}" ${skill === selectedSkill ? 'selected' : ''}>${skill}</option>`
        ).join('');
    }
    
    // ==================== 头像上传处理 ====================
    
    function handleAvatarUpload(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    // 渲染头像
    function renderAvatar(avatarData, name) {
        if (avatarData) {
            return `<img src="${avatarData}" alt="${name}" style="width:100%; height:100%; object-fit:cover;">`;
        }
        return `<div style="font-size: 40px; color: var(--coc-text-muted);">🦌</div>`;
    }
    
    // 渲染疯狂状态
    function renderInsanityStatus(insanity) {
        if (!insanity) return '';
        
        let status = '';
        if (insanity.phase === 'active') {
            status = '🔴 疯狂发作中';
        } else if (insanity.phase === 'latent') {
            status = '🟡 潜在疯狂';
        }
        
        if (insanity.type === 'temporary') {
            status += ` (临时 · ${insanity.duration}小时)`;
            if (insanity.symptom) {
                status += `<br><small>症状：${insanity.symptom}</small>`;
            }
        } else if (insanity.type === 'indefinite') {
            status += ' (不定性)';
        } else if (insanity.type === 'permanent') {
            status = '💔 永久疯狂';
        }
        
        return `<div class="coc-insanity-status" style="margin:8px 0; padding:8px; background:#332b23; border-radius:8px;">${status}</div>`;
    }
    
    // 渲染角色卡片
    function renderCharacterCard(name, stats) {
        try {
            stats = stats || {};
            
            const maxHP = calculateMaxHP(stats);
            const currentHP = stats.HP || maxHP;
            const hpPercent = Math.min(100, Math.max(0, (currentHP / maxHP) * 100));
            
            const maxSAN = calculateMaxSAN(stats);
            const currentSAN = stats.SAN || maxSAN;
            const sanPercent = Math.min(100, Math.max(0, (currentSAN / maxSAN) * 100));
            
            const move = calculateMove(stats);
            const build = calculateBuild(stats.STR, stats.SIZ);
            const db = calculateDB(stats.STR, stats.SIZ);
            const armor = stats.armor || 0;
            
            const occupation = stats.occupation || '调查员';
            const gender = stats.gender || '—';
            const birthYear = stats.birthYear || '—';
            const currentYear = stats.currentYear || '—';
            const age = (currentYear && birthYear && currentYear !== '—' && birthYear !== '—') ? currentYear - birthYear : '—';
            const birthplace = stats.birthplace || '—';
            const residence = stats.residence || '—';
            
            const occupationalSkills = stats.occupationalSkills || {};
            const interestSkills = stats.interestSkills || {};
            const fightingSkills = stats.fightingSkills || {};
            const possessions = stats.possessions || [];
            const assets = stats.assets || { spendingLevel: '—', cash: '—', assets: '—' };
            const relationships = stats.relationships || [];
            const insanity = stats.insanity || [];

            return `
                <div class="coc-card">
                    <div>
                        <div class="coc-profile">
                            <div class="coc-avatar" style="overflow:hidden;">
                                ${renderAvatar(stats.avatar, name)}
                            </div>
                            <div>
                                <div class="coc-name">${name}</div>
                                <div class="coc-subtitle">${occupation} · ${gender} · ${age}岁</div>
                            </div>
                        </div>
                        ${renderInsanityStatus(stats.insanity)}
                        <div class="coc-info-grid" style="grid-template-columns: repeat(3, 1fr);">
                            <div><span class="coc-info-label">出生年份：</span> ${birthYear}</div>
                            <div><span class="coc-info-label">当前年份：</span> ${currentYear}</div>
                            <div><span class="coc-info-label">出生地：</span> ${birthplace}</div>
                            <div><span class="coc-info-label">居住地：</span> ${residence}</div>
                        </div>
                    </div>

                    <div class="coc-bar-container">
                        <div class="coc-bar-item">
                            <div class="coc-bar-header">
                                <span>❤️ HP</span>
                                <span>${currentHP}/${maxHP}</span>
                            </div>
                            <div class="coc-bar-bg">
                                <div class="coc-bar-fill hp" style="width: ${hpPercent}%;"></div>
                            </div>
                        </div>
                        <div class="coc-bar-item">
                            <div class="coc-bar-header">
                                <span>🧠 SAN</span>
                                <span>${currentSAN}/${maxSAN}</span>
                            </div>
                            <div class="coc-bar-bg">
                                <div class="coc-bar-fill san" style="width: ${sanPercent}%;"></div>
                            </div>
                        </div>
                        <div class="coc-bar-item" style="text-align: center;">
                            <div class="coc-bar-header" style="justify-content: center;">MOV</div>
                            <div style="font-size: 16px; font-weight: 700;">${move}</div>
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">📊 属性</div>
                        <div class="coc-stats-grid">
                            ${['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU', 'LUCK'].map(attr => `
                                <div class="coc-stat-item">
                                    <div class="coc-stat-label">${attr}<br><span style="font-size:9px; color:#b8a68f;">${ATTRIBUTE_NAMES_CN[attr]}</span></div>
                                    <div class="coc-stat-value">${stats[attr] || '—'}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="coc-stat-row">
                            <div class="coc-stat-row-item">体格 ${build} · 伤害加值 ${db} · 护甲 ${armor}</div>
                        </div>
                        <div class="coc-stat-row">
                            <div class="coc-stat-row-item">⚡ 闪避: ${Math.floor(stats.DEX / 2)}%</div>
                        </div>
                        <div class="coc-stat-row">
                            <div class="coc-stat-row-item">🍀 幸运: ${stats.luck?.current ?? stats.LUCK ?? '—'}/${stats.luck?.max ?? stats.LUCK ?? '—'}</div>
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">🔍 职业技能</div>
                        <div class="coc-skills-grid">
                            ${Object.keys(occupationalSkills).length > 0 
                                ? Object.entries(occupationalSkills).map(([skill, value]) => `
                                    <div class="coc-skill-item">
                                        <span class="coc-skill-name">${skill}</span>
                                        <span class="coc-skill-value occupational">${value}%</span>
                                    </div>
                                `).join('')
                                : '<div class="coc-skill-item"><span class="coc-skill-name">无职业技能</span></div>'
                            }
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">✨ 兴趣技能</div>
                        <div class="coc-skills-grid">
                            ${Object.keys(interestSkills).length > 0
                                ? Object.entries(interestSkills).map(([skill, value]) => `
                                    <div class="coc-skill-item">
                                        <span class="coc-skill-name">${skill}</span>
                                        <span class="coc-skill-value interest">${value}%</span>
                                    </div>
                                `).join('')
                                : '<div class="coc-skill-item"><span class="coc-skill-name">无兴趣技能</span></div>'
                            }
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">⚔️ 格斗技能</div>
                        <div class="coc-skills-grid">
                            ${Object.keys(fightingSkills).length > 0
                                ? Object.entries(fightingSkills).map(([skill, value]) => `
                                    <div class="coc-skill-item">
                                        <span class="coc-skill-name">${skill}</span>
                                        <span class="coc-skill-value fighting">${value}%</span>
                                    </div>
                                `).join('')
                                : '<div class="coc-skill-item"><span class="coc-skill-name">无格斗技能</span></div>'
                            }
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">📜 背景故事</div>
                        <div class="coc-backstory">${stats.backstory || '——'}</div>
                    </div>

                    <div>
                        <div class="coc-section-title">🎒 装备物品</div>
                        <div class="coc-weapons-list">
                            ${possessions.length > 0 
                                ? possessions.map(item => `
                                    <div class="coc-possession-row">
                                        <span>${item.name}</span>
                                        <span>${item.quantity || 1}x</span>
                                    </div>
                                `).join('') 
                                : '<div style="color: #8e7c68; text-align: center; padding: 8px;">无</div>'}
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">💰 资产</div>
                        <div class="coc-assets-grid">
                            <div class="coc-asset-item">
                                <div class="coc-asset-label">消费水平</div>
                                <div class="coc-asset-value">${assets.spendingLevel}</div>
                            </div>
                            <div class="coc-asset-item">
                                <div class="coc-asset-label">现金</div>
                                <div class="coc-asset-value">${assets.cash}</div>
                            </div>
                            <div class="coc-asset-item">
                                <div class="coc-asset-label">资产</div>
                                <div class="coc-asset-value">${assets.assets}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">😨 恐惧症</div>
                        <div class="coc-weapons-list">
                            ${(stats.phobias || []).length > 0 
                                ? stats.phobias.map(p => `
                                    <div class="coc-relationship-row">
                                        <span>${p.name}</span>
                                        <span>${p.source || ''}</span>
                                    </div>
                                `).join('') 
                                : '<div style="color: #8e7c68;">无</div>'}
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">😈 躁狂症</div>
                        <div class="coc-weapons-list">
                            ${(stats.manias || []).length > 0 
                                ? stats.manias.map(m => `
                                    <div class="coc-relationship-row">
                                        <span>${m.name}</span>
                                        <span>${m.source || ''}</span>
                                    </div>
                                `).join('') 
                                : '<div style="color: #8e7c68;">无</div>'}
                        </div>
                    </div>

                    <div>
                        <div class="coc-section-title">🤝 同伴关系</div>
                        <div class="coc-weapons-list">
                            ${relationships.length > 0 
                                ? relationships.map(rel => `
                                    <div class="coc-relationship-row">
                                        <span>${rel.name}</span>
                                        <span>${rel.relationship}</span>
                                    </div>
                                `).join('') 
                                : '<div style="color: #8e7c68; text-align: center; padding: 8px;">无</div>'}
                        </div>
                    </div>

                    <button class="coc-btn edit" id="coc-edit-mode-btn">✏️ 编辑角色</button>
                </div>
            `;
        } catch (e) {
            console.error('[COC] 渲染卡片出错:', e);
            return `
                <div class="coc-card" style="padding:20px;">
                    <div style="color:red; margin-bottom:10px;">❌ 渲染错误: ${e.message}</div>
                    <div style="margin-bottom:10px;">角色名: ${name}</div>
                    <button class="coc-btn edit" id="coc-edit-mode-btn">✏️ 编辑角色</button>
                </div>
            `;
        }
    }
    
    // 渲染查看模式
    function renderViewMode() {
        const characters = data.getAll();
        const names = Object.keys(characters).sort();
        const select = document.getElementById('coc-role-select');
        
        if (select) {
            let options = '<option value="">选择角色</option>';
            options += names.map(name => `<option value="${name}">${name}</option>`).join('');
            options += `<option value="__NEW__" class="coc-add-role-option">➕ 新增角色...</option>`;
            select.innerHTML = options;
        }
        
        const display = document.getElementById('coc-stats-display');
        if (display) {
            display.innerHTML = '<div class="coc-empty">👆 请选择角色</div>';
        }
    }
    
    // 绑定工具栏事件
    function bindToolbarEvents() {
        const select = document.getElementById('coc-role-select');
        if (select) {
            select.addEventListener('change', (e) => {
                const value = e.target.value;
                
                if (value === '__NEW__') {
                    // 默认年龄30岁（20-39区间）
                    const defaultAge = 30;

                    // 生成基础属性
                    const baseAttrs = generateBaseAttributes(defaultAge);
                    const defaultAdjustments = { STR: 0, CON: 0, DEX: 0, SIZ: 0 };
                    const normalized = normalizeAgeAdjustments(defaultAge, defaultAdjustments);
                    
                    // 应用年龄修正
                    const finalAttrs = applyAgeEffects(baseAttrs, defaultAge, normalized.normalized);
                    
                    const newName = prompt('请输入新角色名:');
                    if (newName && newName.trim()) {
                        const name = newName.trim();
                        if (data.get(name)) {
                            alert('❌ 角色已存在');
                        } else {
                            const defaultStats = {
                                occupation: '调查员',
                                gender: '男',
                                birthYear: 1895,
                                currentYear: 1925,
                                birthplace: '',
                                residence: '',
                                baseSTR: baseAttrs.baseSTR,
                                baseDEX: baseAttrs.baseDEX,
                                baseCON: baseAttrs.baseCON,
                                baseAPP: baseAttrs.baseAPP,
                                basePOW: baseAttrs.basePOW,
                                baseSIZ: baseAttrs.baseSIZ,
                                baseINT: baseAttrs.baseINT,
                                baseEDU: baseAttrs.baseEDU,
                                baseLUCK: baseAttrs.baseLUCK,
                                ageAdjustments: normalized.normalized,
                                ...finalAttrs,
                                HP: Math.floor((finalAttrs.CON + finalAttrs.SIZ) / 10),
                                SAN: finalAttrs.POW,
                                luck: { current: finalAttrs.LUCK, max: finalAttrs.LUCK },
                                occupationalSkills: {},
                                interestSkills: {},
                                fightingSkills: {},
                                skills: {},
                                possessions: [],
                                assets: { spendingLevel: '', cash: '', assets: '' },
                                relationships: [],
                                insanity: [],
                                phobias: [],
                                manias: []
                            };
                            data.set(name, defaultStats);
                            renderViewMode();
                            
                            setTimeout(() => {
                                select.value = name;
                                select.dispatchEvent(new Event('change'));
                            }, 100);
                        }
                    } else {
                        select.value = '';
                    }
                    return;
                }
                
                if (!value) {
                    const display = document.getElementById('coc-stats-display');
                    if (display) {
                        display.innerHTML = '<div class="coc-empty">👆 请选择角色</div>';
                    }
                    return;
                }
                
                const char = data.get(value);
                if (char) {
                    try {
                        const cardHtml = renderCharacterCard(value, char.stats);
                        const display = document.getElementById('coc-stats-display');
                        if (display) {
                            display.innerHTML = cardHtml;
                            
                            setTimeout(() => {
                                const editBtn = document.getElementById('coc-edit-mode-btn');
                                if (editBtn) {
                                    editBtn.onclick = () => {
                                        enterEditMode(value, char.stats);
                                    };
                                } else {
                                    console.error('[COC] 编辑按钮未找到');
                                }
                            }, 50);
                        }
                    } catch (e) {
                        console.error('[COC] 显示卡片出错:', e);
                        const display = document.getElementById('coc-stats-display');
                        if (display) {
                            display.innerHTML = `<div style="color:red; padding:20px;">❌ 显示错误: ${e.message}</div>`;
                        }
                    }
                } else {
                    const display = document.getElementById('coc-stats-display');
                    if (display) {
                        display.innerHTML = '<div class="coc-empty">👆 角色数据为空</div>';
                    }
                }
            });
        }
        
        const importBtn = document.getElementById('coc-import-btn');
        if (importBtn) importBtn.onclick = () => importFromFile();
        
        const exportBtn = document.getElementById('coc-export-btn');
        if (exportBtn) exportBtn.onclick = () => exportCharacter();
        
        const deleteBtn = document.getElementById('coc-delete-btn');
        if (deleteBtn) deleteBtn.onclick = () => deleteCharacter();
    }
    
    // 进入编辑模式
    function enterEditMode(name, stats) {
        isEditing = true;
        currentEditName = name;
        currentEditStats = JSON.parse(JSON.stringify(stats));

        currentEditStats.baseSTR = currentEditStats.baseSTR ?? currentEditStats.STR;
        currentEditStats.baseDEX = currentEditStats.baseDEX ?? currentEditStats.DEX;
        currentEditStats.baseCON = currentEditStats.baseCON ?? currentEditStats.CON;
        currentEditStats.baseAPP = currentEditStats.baseAPP ?? currentEditStats.APP;
        currentEditStats.basePOW = currentEditStats.basePOW ?? currentEditStats.POW;
        currentEditStats.baseSIZ = currentEditStats.baseSIZ ?? currentEditStats.SIZ;
        currentEditStats.baseINT = currentEditStats.baseINT ?? currentEditStats.INT;
        currentEditStats.baseEDU = currentEditStats.baseEDU ?? currentEditStats.EDU;
        currentEditStats.baseLUCK = currentEditStats.baseLUCK ?? currentEditStats.LUCK;
        
        const display = document.getElementById('coc-stats-display');
        if (display) display.style.display = 'none';
        
        const editSection = document.getElementById('coc-edit-section');
        if (editSection) {
            editSection.style.display = 'block';
            editSection.innerHTML = renderEditForm(name, currentEditStats);
        }
        
        bindEditEvents();
    }
    
    // 渲染技能选项（已有，但上面已定义）
    
    // 渲染武器选项
    function renderWeaponOptions(selectedWeapon) {
        return WEAPONS_LIST.map(weapon => 
            `<option value="${weapon.name}" ${weapon.name === selectedWeapon ? 'selected' : ''} data-skill="${weapon.skill}" data-damage="${weapon.damage}">${weapon.name}</option>`
        ).join('');
    }
    
    // 渲染编辑表单
    function renderEditForm(name, stats) {
        const occupationNames = getOccupationNames();
        const currentOccupation = stats.occupation || '调查员';
        
        const attributes = {
            STR: stats.STR || 50,
            DEX: stats.DEX || 50,
            CON: stats.CON || 50,
            APP: stats.APP || 50,
            POW: stats.POW || 50,
            INT: stats.INT || 50,
            SIZ: stats.SIZ || 50,
            EDU: stats.EDU || 50
        };
        
        const occPoints = calculateOccupationPoints(currentOccupation, attributes);
        const intPoints = calculateInterestPoints(attributes.INT);
        
        return `
            <div class="coc-edit-section">
                <div class="coc-edit-title">✏️ 编辑 ${name}</div>
                
                <div class="coc-edit-avatar">
                    <div class="coc-edit-avatar-preview" id="coc-avatar-preview">
                        ${stats.avatar 
                            ? `<img src="${stats.avatar}" alt="avatar">` 
                            : '<div class="coc-edit-avatar-placeholder">🦌</div>'}
                    </div>
                    <button class="coc-edit-avatar-btn" id="coc-avatar-upload-btn">📷 上传头像</button>
                    <input type="file" id="coc-avatar-input" accept="image/png,image/jpeg,image/gif,image/webp" style="display: none;">
                </div>
                
                <div>
                    <div class="coc-edit-label">职业</div>
                    <select class="coc-edit-input coc-edit-occupation-select" id="coc-occupation-select">
                        <option value="">选择职业</option>
                        ${occupationNames.map(occName => 
                            `<option value="${occName}" ${occName === currentOccupation ? 'selected' : ''}>${occName}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="coc-edit-grid" style="margin-top: 8px;">
                    <div>
                        <div class="coc-edit-label">职业技能点</div>
                        <div class="coc-stat-value" style="text-align:center;" id="occ-points-total">${occPoints}</div>
                    </div>
                    <div>
                        <div class="coc-edit-label">兴趣技能点</div>
                        <div class="coc-stat-value" style="text-align:center;" id="int-points-total">${intPoints}</div>
                    </div>
                </div>
                
                <div class="coc-edit-grid" style="margin-top: 8px;">
                    <div>
                        <div class="coc-edit-label">性别</div>
                        <select class="coc-edit-input coc-edit-gender" id="coc-edit-gender">
                            <option value="男" ${stats.gender === '男' ? 'selected' : ''}>男</option>
                            <option value="女" ${stats.gender === '女' ? 'selected' : ''}>女</option>
                            <option value="其他" ${stats.gender === '其他' ? 'selected' : ''}>其他</option>
                        </select>
                    </div>
                    <div>
                        <div class="coc-edit-label">出生年份</div>
                        <input type="number" class="coc-edit-input coc-edit-birth-year" id="coc-edit-birth-year" value="${stats.birthYear || 1890}" placeholder="1890">
                    </div>
                    <div>
                        <div class="coc-edit-label">当前年份</div>
                        <input type="number" class="coc-edit-input coc-edit-current-year" id="coc-edit-current-year" value="${stats.currentYear || 1925}" placeholder="1925">
                    </div>
                </div>
                
                <div class="coc-edit-grid">
                    <div>
                        <div class="coc-edit-label">出生地</div>
                        <input type="text" class="coc-edit-input coc-edit-birthplace" value="${stats.birthplace || ''}">
                    </div>
                    <div>
                        <div class="coc-edit-label">居住地</div>
                        <input type="text" class="coc-edit-input coc-edit-residence" value="${stats.residence || ''}">
                    </div>
                </div>

                <div class="coc-edit-label">年龄修正（可分配扣点）</div>
                <div class="coc-edit-grid" id="coc-age-adjustment-grid">
                    ${['STR', 'CON', 'DEX', 'SIZ'].map(attr => `
                        <div>
                            <div class="coc-edit-label">${attr}</div>
                            <input type="number" min="0" class="coc-edit-input coc-edit-age-${attr}" value="${(stats.ageAdjustments && stats.ageAdjustments[attr]) || 0}">
                        </div>
                    `).join('')}
                </div>
                <div class="coc-edit-label" id="coc-age-adjustment-hint" style="color:#b8a68f; font-size:11px;">年龄修正会在保存时自动校正总值</div>

                <div class="coc-edit-label">属性</div>
                <div class="coc-edit-grid">
                    ${['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'LUCK'].map(attr => `
                        <div>
                            <div class="coc-edit-label">${attr}</div>
                            <input type="number" class="coc-edit-input" id="coc-attr-${attr}" value="${stats[attr] || 50}" readonly style="background:#555; color:#aaa;">
                        </div>
                    `).join('')}
                </div>

                <div class="coc-edit-label">幸运</div>
                <div class="coc-edit-grid">
                    <div>
                        <div class="coc-edit-label">当前幸运</div>
                        <input type="number" class="coc-edit-input" id="coc-edit-luck-current" value="${stats.luck?.current ?? stats.LUCK ?? 50}">
                    </div>
                    <div>
                        <div class="coc-edit-label">幸运上限</div>
                        <input type="number" class="coc-edit-input" id="coc-edit-luck-max" value="${stats.luck?.max ?? stats.LUCK ?? 50}">
                    </div>
                </div>

                <div class="coc-edit-label">职业技能</div>
                <div id="coc-edit-occupational-skills" class="coc-select-list">
                    ${Object.entries(stats.occupationalSkills || {}).map(([skill, value]) => `
                        <div class="coc-select-row">
                            <select class="coc-edit-occ-skill-name">
                                <option value="">选择技能</option>
                                ${renderSkillOptions(skill, 'occupational', currentOccupation)}
                            </select>
                            <input type="number" class="coc-edit-occ-skill-value" value="${value}" placeholder="数值">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-occ-skill">+ 添加职业技能</button>

                <div class="coc-edit-label">兴趣技能</div>
                <div id="coc-edit-interest-skills" class="coc-select-list">
                    ${Object.entries(stats.interestSkills || {}).map(([skill, value]) => `
                        <div class="coc-select-row">
                            <select class="coc-edit-int-skill-name">
                                <option value="">选择技能</option>
                                ${renderSkillOptions(skill, 'interest', currentOccupation)}
                            </select>
                            <input type="number" class="coc-edit-int-skill-value" value="${value}" placeholder="数值">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-int-skill">+ 添加兴趣技能</button>

                <div class="coc-edit-label">格斗技能</div>
                <div id="coc-edit-fighting-skills" class="coc-select-list">
                    ${Object.entries(stats.fightingSkills || {}).map(([skill, value]) => `
                        <div class="coc-select-row">
                            <select class="coc-edit-fight-skill-name">
                                <option value="">选择技能</option>
                                ${renderSkillOptions(skill, 'fighting', currentOccupation)}
                            </select>
                            <input type="number" class="coc-edit-fight-skill-value" value="${value}" placeholder="数值">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-fight-skill">+ 添加格斗技能</button>

                <div class="coc-edit-label">武器</div>
                <div id="coc-edit-weapons" class="coc-select-list">
                    ${(stats.weapons || []).map(weapon => `
                        <div class="coc-select-row" style="display: flex; gap: 4px; align-items: center;">
                            <select class="coc-edit-weapon-select" style="flex: 1; padding: 4px; font-size: 11px;">
                                <option value="">选择</option>
                                ${renderWeaponOptions(weapon.name)}
                            </select>
                            <input type="text" class="coc-edit-weapon-skill" value="${weapon.skill}" placeholder="技能%" style="flex: 0.6; padding: 4px; font-size: 11px;">
                            <input type="text" class="coc-edit-weapon-damage" value="${weapon.damage}" placeholder="伤害" style="flex: 0.6; padding: 4px; font-size: 11px;">
                            <button class="coc-remove-btn" style="width: 20px; height: 20px; font-size: 10px;" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-weapon">+ 添加武器</button>

                <div class="coc-edit-label">背景故事</div>
                <textarea class="coc-edit-textarea" id="coc-edit-backstory" rows="2">${stats.backstory || ''}</textarea>

                <div class="coc-edit-label">装备物品</div>
                <div id="coc-edit-possessions" class="coc-select-list">
                    ${(stats.possessions || []).map(item => `
                        <div class="coc-edit-possession-row">
                            <input type="text" class="coc-edit-input coc-edit-possession-name" value="${item.name}" placeholder="物品名" style="flex:1; padding:4px; font-size:11px;">
                            <input type="number" class="coc-edit-input coc-edit-possession-qty" value="${item.quantity || 1}" placeholder="数量" style="width:60px; padding:4px; font-size:11px;">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-possession">+ 添加物品</button>

                <div class="coc-edit-label">资产</div>
                <div class="coc-edit-grid">
                    <div>
                        <div class="coc-edit-label">消费水平</div>
                        <input type="text" class="coc-edit-input coc-edit-spending" value="${stats.assets?.spendingLevel || ''}">
                    </div>
                    <div>
                        <div class="coc-edit-label">现金</div>
                        <input type="text" class="coc-edit-input coc-edit-cash" value="${stats.assets?.cash || ''}">
                    </div>
                    <div>
                        <div class="coc-edit-label">资产</div>
                        <input type="text" class="coc-edit-input coc-edit-assets" value="${stats.assets?.assets || ''}">
                    </div>
                </div>

                <div class="coc-edit-label">同伴关系</div>
                <div id="coc-edit-relationships" class="coc-select-list">
                    ${(stats.relationships || []).map(rel => `
                        <div class="coc-edit-relationship-row">
                            <input type="text" class="coc-edit-input coc-edit-rel-name" value="${rel.name}" placeholder="姓名" style="flex:1; padding:4px; font-size:11px;">
                            <input type="text" class="coc-edit-input coc-edit-rel-desc" value="${rel.relationship}" placeholder="关系" style="flex:1; padding:4px; font-size:11px;">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-relationship">+ 添加关系</button>

                <div class="coc-edit-actions">
                    <button class="coc-edit-save" id="coc-save-edit">💾 保存</button>
                    <button class="coc-edit-cancel" id="coc-cancel-edit">✖ 取消</button>
                </div>
            </div>
        `;
    }
    
    // 绑定编辑事件
    function bindEditEvents() {
        const occupationSelect = document.getElementById('coc-occupation-select');
        if (occupationSelect) {
            occupationSelect.addEventListener('change', (e) => {
                const newOccupation = e.target.value;
                if (newOccupation) {
                    const attributes = {
                        STR: currentEditStats.STR || 50,
                        DEX: currentEditStats.DEX || 50,
                        CON: currentEditStats.CON || 50,
                        APP: currentEditStats.APP || 50,
                        POW: currentEditStats.POW || 50,
                        INT: currentEditStats.INT || 50,
                        SIZ: currentEditStats.SIZ || 50,
                        EDU: currentEditStats.EDU || 50
                    };
                    
                    const occPoints = calculateOccupationPoints(newOccupation, attributes);
                    const intPoints = calculateInterestPoints(attributes.INT);
                    
                    document.getElementById('occ-points-total').textContent = occPoints;
                    document.getElementById('int-points-total').textContent = intPoints;
                    
                    const occSkillContainer = document.getElementById('coc-edit-occupational-skills');
                    if (occSkillContainer) {
                        const rows = occSkillContainer.querySelectorAll('.coc-select-row');
                        rows.forEach(row => {
                            const select = row.querySelector('.coc-edit-occ-skill-name');
                            if (select) {
                                const currentValue = select.value;
                                const skillOptions = renderSkillOptions(currentValue, 'occupational', newOccupation);
                                select.innerHTML = `<option value="">选择技能</option>${skillOptions}`;
                                select.value = currentValue;
                            }
                        });
                    }
                }
            });
        }
        
        const birthYearInput = document.getElementById('coc-edit-birth-year');
        const currentYearInput = document.getElementById('coc-edit-current-year');
        
        function recalcAgeAndAttributes() {
            const birthYear = parseInt(birthYearInput.value) || 1890;
            const currentYear = parseInt(currentYearInput.value) || 1925;
            const age = currentYear - birthYear;
            const adjustments = {
                STR: parseInt(document.querySelector('.coc-edit-age-STR')?.value) || 0,
                CON: parseInt(document.querySelector('.coc-edit-age-CON')?.value) || 0,
                DEX: parseInt(document.querySelector('.coc-edit-age-DEX')?.value) || 0,
                SIZ: parseInt(document.querySelector('.coc-edit-age-SIZ')?.value) || 0
            };
            
            const baseAttrs = {
                baseSTR: currentEditStats.baseSTR,
                baseDEX: currentEditStats.baseDEX,
                baseCON: currentEditStats.baseCON,
                baseAPP: currentEditStats.baseAPP,
                basePOW: currentEditStats.basePOW,
                baseSIZ: currentEditStats.baseSIZ,
                baseINT: currentEditStats.baseINT,
                baseEDU: currentEditStats.baseEDU,
                baseLUCK: currentEditStats.baseLUCK
            };

            const normalized = normalizeAgeAdjustments(age, adjustments);
            currentEditStats.ageAdjustments = normalized.normalized;
            
            const newAttrs = applyAgeEffects(baseAttrs, age, normalized.normalized);
            
            currentEditStats.STR = newAttrs.STR;
            currentEditStats.DEX = newAttrs.DEX;
            currentEditStats.CON = newAttrs.CON;
            currentEditStats.APP = newAttrs.APP;
            currentEditStats.POW = newAttrs.POW;
            currentEditStats.SIZ = newAttrs.SIZ;
            currentEditStats.INT = newAttrs.INT;
            currentEditStats.EDU = newAttrs.EDU;
            currentEditStats.LUCK = newAttrs.LUCK;
            
            document.getElementById('coc-attr-STR').value = newAttrs.STR;
            document.getElementById('coc-attr-DEX').value = newAttrs.DEX;
            document.getElementById('coc-attr-CON').value = newAttrs.CON;
            document.getElementById('coc-attr-APP').value = newAttrs.APP;
            document.getElementById('coc-attr-POW').value = newAttrs.POW;
            document.getElementById('coc-attr-SIZ').value = newAttrs.SIZ;
            document.getElementById('coc-attr-INT').value = newAttrs.INT;
            document.getElementById('coc-attr-EDU').value = newAttrs.EDU;
            document.getElementById('coc-attr-LUCK').value = newAttrs.LUCK;

            if (normalized.rule) {
                const hint = document.getElementById('coc-age-adjustment-hint');
                if (hint) {
                    const total = normalized.rule.physicalLoss;
                    const currentTotal = Object.values(normalized.normalized).reduce((sum, value) => sum + value, 0);
                    hint.textContent = `年龄修正需分配 ${total} 点（当前 ${currentTotal}）`;
                }
            }
            
            const occPoints = calculateOccupationPoints(currentEditStats.occupation, newAttrs);
            const intPoints = calculateInterestPoints(newAttrs.INT);
            document.getElementById('occ-points-total').textContent = occPoints;
            document.getElementById('int-points-total').textContent = intPoints;
        }
        
        if (birthYearInput && currentYearInput) {
            birthYearInput.addEventListener('change', recalcAgeAndAttributes);
            currentYearInput.addEventListener('change', recalcAgeAndAttributes);
        }

        document.querySelectorAll('#coc-age-adjustment-grid input').forEach(input => {
            input.addEventListener('change', recalcAgeAndAttributes);
        });

        recalcAgeAndAttributes();
        
        const uploadBtn = document.getElementById('coc-avatar-upload-btn');
        const avatarInput = document.getElementById('coc-avatar-input');
        const avatarPreview = document.getElementById('coc-avatar-preview');
        
        if (uploadBtn && avatarInput) {
            uploadBtn.onclick = () => avatarInput.click();
            
            avatarInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    handleAvatarUpload(file, (avatarData) => {
                        currentEditStats.avatar = avatarData;
                        avatarPreview.innerHTML = `<img src="${avatarData}" alt="avatar">`;
                    });
                }
            };
        }

        const addOccSkill = document.getElementById('coc-add-occ-skill');
        if (addOccSkill) {
            addOccSkill.onclick = () => {
                const container = document.getElementById('coc-edit-occupational-skills');
                if (container) {
                    const occupationSelect = document.getElementById('coc-occupation-select');
                    const currentOccupation = occupationSelect ? occupationSelect.value : '调查员';
                    
                    const newRow = document.createElement('div');
                    newRow.className = 'coc-select-row';
                    newRow.innerHTML = `
                        <select class="coc-edit-occ-skill-name">
                            <option value="">选择技能</option>
                            ${renderSkillOptions('', 'occupational', currentOccupation)}
                        </select>
                        <input type="number" class="coc-edit-occ-skill-value" value="50" placeholder="数值">
                        <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                    `;
                    container.appendChild(newRow);
                }
            };
        }

        const addIntSkill = document.getElementById('coc-add-int-skill');
        if (addIntSkill) {
            addIntSkill.onclick = () => {
                const container = document.getElementById('coc-edit-interest-skills');
                if (container) {
                    const newRow = document.createElement('div');
                    newRow.className = 'coc-select-row';
                    newRow.innerHTML = `
                        <select class="coc-edit-int-skill-name">
                            <option value="">选择技能</option>
                            ${SKILLS_LIST.interest.map(skill => `<option value="${skill}">${skill}</option>`).join('')}
                        </select>
                        <input type="number" class="coc-edit-int-skill-value" value="50" placeholder="数值">
                        <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                    `;
                    container.appendChild(newRow);
                }
            };
        }

        const addFightSkill = document.getElementById('coc-add-fight-skill');
        if (addFightSkill) {
            addFightSkill.onclick = () => {
                const container = document.getElementById('coc-edit-fighting-skills');
                if (container) {
                    const newRow = document.createElement('div');
                    newRow.className = 'coc-select-row';
                    newRow.innerHTML = `
                        <select class="coc-edit-fight-skill-name">
                            <option value="">选择技能</option>
                            ${SKILLS_LIST.fighting.map(skill => `<option value="${skill}">${skill}</option>`).join('')}
                        </select>
                        <input type="number" class="coc-edit-fight-skill-value" value="50" placeholder="数值">
                        <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                    `;
                    container.appendChild(newRow);
                }
            };
        }

        const addWeapon = document.getElementById('coc-add-weapon');
        if (addWeapon) {
            addWeapon.onclick = () => {
                const container = document.getElementById('coc-edit-weapons');
                if (container) {
                    const newRow = document.createElement('div');
                    newRow.className = 'coc-select-row';
                    newRow.style.cssText = 'display: flex; gap: 4px; align-items: center; margin-bottom: 4px;';
                    newRow.innerHTML = `
                        <select class="coc-edit-weapon-select" style="flex:1; padding:4px; font-size:11px;">
                            <option value="">选择武器</option>
                            ${WEAPONS_LIST.map(w => `<option value="${w.name}" data-skill="${w.skill}" data-damage="${w.damage}">${w.name}</option>`).join('')}
                        </select>
                        <input type="text" class="coc-edit-weapon-skill" placeholder="技能%" style="flex:0.6; padding:4px; font-size:11px;">
                        <input type="text" class="coc-edit-weapon-damage" placeholder="伤害" style="flex:0.6; padding:4px; font-size:11px;">
                        <button class="coc-remove-btn" style="width:20px; height:20px; font-size:10px;" onclick="this.parentElement.remove()">✖</button>
                    `;
                    container.appendChild(newRow);

                    newRow.querySelector('.coc-edit-weapon-select').addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        const skillInput = newRow.querySelector('.coc-edit-weapon-skill');
                        const damageInput = newRow.querySelector('.coc-edit-weapon-damage');
                        if (selectedOption.dataset.skill) {
                            skillInput.value = selectedOption.dataset.skill;
                        }
                        if (selectedOption.dataset.damage) {
                            damageInput.value = selectedOption.dataset.damage;
                        }
                    });
                }
            };
        }

        const addPossession = document.getElementById('coc-add-possession');
        if (addPossession) {
            addPossession.onclick = () => {
                const container = document.getElementById('coc-edit-possessions');
                if (container) {
                    const newRow = document.createElement('div');
                    newRow.className = 'coc-edit-possession-row';
                    newRow.style.cssText = 'display: flex; gap: 4px; margin-bottom: 4px; align-items: center;';
                    newRow.innerHTML = `
                        <input type="text" class="coc-edit-input coc-edit-possession-name" placeholder="物品名" style="flex:1; padding:4px; font-size:11px;">
                        <input type="number" class="coc-edit-input coc-edit-possession-qty" value="1" placeholder="数量" style="width:60px; padding:4px; font-size:11px;">
                        <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                    `;
                    container.appendChild(newRow);
                }
            };
        }

        const addRelationship = document.getElementById('coc-add-relationship');
        if (addRelationship) {
            addRelationship.onclick = () => {
                const container = document.getElementById('coc-edit-relationships');
                if (container) {
                    const newRow = document.createElement('div');
                    newRow.className = 'coc-edit-relationship-row';
                    newRow.style.cssText = 'display: flex; gap: 4px; margin-bottom: 4px; align-items: center;';
                    newRow.innerHTML = `
                        <input type="text" class="coc-edit-input coc-edit-rel-name" placeholder="姓名" style="flex:1; padding:4px; font-size:11px;">
                        <input type="text" class="coc-edit-input coc-edit-rel-desc" placeholder="关系" style="flex:1; padding:4px; font-size:11px;">
                        <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                    `;
                    container.appendChild(newRow);
                }
            };
        }

        document.querySelectorAll('.coc-edit-weapon-select').forEach(select => {
            select.addEventListener('change', function() {
                const row = this.closest('.coc-select-row');
                const selectedOption = this.options[this.selectedIndex];
                if (row) {
                    const skillInput = row.querySelector('.coc-edit-weapon-skill');
                    const damageInput = row.querySelector('.coc-edit-weapon-damage');
                    if (selectedOption.dataset.skill) {
                        skillInput.value = selectedOption.dataset.skill;
                    }
                    if (selectedOption.dataset.damage) {
                        damageInput.value = selectedOption.dataset.damage;
                    }
                }
            });
        });

        const saveEdit = document.getElementById('coc-save-edit');
        if (saveEdit) {
            saveEdit.onclick = () => {
                const newStats = collectEditData();
                
                if (currentEditStats.avatar) {
                    newStats.avatar = currentEditStats.avatar;
                }
                
                data.set(currentEditName, newStats);
                
                isEditing = false;
                const display = document.getElementById('coc-stats-display');
                if (display) display.style.display = 'block';
                
                const editSection = document.getElementById('coc-edit-section');
                if (editSection) editSection.style.display = 'none';
                
                if (display) {
                    display.innerHTML = renderCharacterCard(currentEditName, newStats);
                    
                    setTimeout(() => {
                        const editBtn = document.getElementById('coc-edit-mode-btn');
                        if (editBtn) {
                            editBtn.onclick = () => {
                                enterEditMode(currentEditName, newStats);
                            };
                        }
                    }, 50);
                }
            };
        }

        const cancelEdit = document.getElementById('coc-cancel-edit');
        if (cancelEdit) {
            cancelEdit.onclick = () => {
                isEditing = false;
                const display = document.getElementById('coc-stats-display');
                if (display) display.style.display = 'block';
                
                const editSection = document.getElementById('coc-edit-section');
                if (editSection) editSection.style.display = 'none';
            };
        }
    }
    
    // 收集编辑数据
    function collectEditData() {
        const stats = { ...currentEditStats };

        stats.occupation = document.getElementById('coc-occupation-select')?.value || '调查员';
        stats.gender = document.querySelector('.coc-edit-gender')?.value || '男';
        stats.birthYear = parseInt(document.getElementById('coc-edit-birth-year')?.value) || 1890;
        stats.currentYear = parseInt(document.getElementById('coc-edit-current-year')?.value) || 1925;

        const age = stats.currentYear - stats.birthYear;
        const adjustments = {
            STR: parseInt(document.querySelector('.coc-edit-age-STR')?.value) || 0,
            CON: parseInt(document.querySelector('.coc-edit-age-CON')?.value) || 0,
            DEX: parseInt(document.querySelector('.coc-edit-age-DEX')?.value) || 0,
            SIZ: parseInt(document.querySelector('.coc-edit-age-SIZ')?.value) || 0
        };
        const normalized = normalizeAgeAdjustments(age, adjustments);
        stats.ageAdjustments = normalized.normalized;

        const baseAttrs = {
            baseSTR: stats.baseSTR,
            baseDEX: stats.baseDEX,
            baseCON: stats.baseCON,
            baseAPP: stats.baseAPP,
            basePOW: stats.basePOW,
            baseSIZ: stats.baseSIZ,
            baseINT: stats.baseINT,
            baseEDU: stats.baseEDU,
            baseLUCK: stats.baseLUCK
        };

        const recalculated = applyAgeEffects(baseAttrs, age, normalized.normalized);
        stats.STR = recalculated.STR;
        stats.DEX = recalculated.DEX;
        stats.CON = recalculated.CON;
        stats.APP = recalculated.APP;
        stats.POW = recalculated.POW;
        stats.SIZ = recalculated.SIZ;
        stats.INT = recalculated.INT;
        stats.EDU = recalculated.EDU;
        stats.LUCK = recalculated.LUCK;

        const luckCurrent = parseInt(document.getElementById('coc-edit-luck-current')?.value);
        const luckMax = parseInt(document.getElementById('coc-edit-luck-max')?.value);
        stats.luck = {
            current: Number.isNaN(luckCurrent) ? (stats.luck?.current ?? stats.LUCK ?? 50) : luckCurrent,
            max: Number.isNaN(luckMax) ? (stats.luck?.max ?? stats.LUCK ?? 50) : luckMax
        };

        const occupationalSkills = {};
        document.querySelectorAll('#coc-edit-occupational-skills .coc-select-row').forEach(row => {
            const select = row.querySelector('.coc-edit-occ-skill-name');
            const valueInput = row.querySelector('.coc-edit-occ-skill-value');
            if (select && valueInput && select.value) {
                occupationalSkills[select.value] = parseInt(valueInput.value) || 50;
            }
        });
        if (Object.keys(occupationalSkills).length > 0) {
            stats.occupationalSkills = occupationalSkills;
        }

        const interestSkills = {};
        document.querySelectorAll('#coc-edit-interest-skills .coc-select-row').forEach(row => {
            const select = row.querySelector('.coc-edit-int-skill-name');
            const valueInput = row.querySelector('.coc-edit-int-skill-value');
            if (select && valueInput && select.value) {
                interestSkills[select.value] = parseInt(valueInput.value) || 50;
            }
        });
        if (Object.keys(interestSkills).length > 0) {
            stats.interestSkills = interestSkills;
        }

        const fightingSkills = {};
        document.querySelectorAll('#coc-edit-fighting-skills .coc-select-row').forEach(row => {
            const select = row.querySelector('.coc-edit-fight-skill-name');
            const valueInput = row.querySelector('.coc-edit-fight-skill-value');
            if (select && valueInput && select.value) {
                fightingSkills[select.value] = parseInt(valueInput.value) || 50;
            }
        });
        if (Object.keys(fightingSkills).length > 0) {
            stats.fightingSkills = fightingSkills;
        }

        const mergedSkills = {
            ...(stats.skills || {}),
            ...occupationalSkills,
            ...interestSkills,
            ...fightingSkills
        };

        stats.skills = mergedSkills;

        const weapons = [];
        document.querySelectorAll('#coc-edit-weapons .coc-select-row').forEach(row => {
            const select = row.querySelector('.coc-edit-weapon-select');
            const skillInput = row.querySelector('.coc-edit-weapon-skill');
            const damageInput = row.querySelector('.coc-edit-weapon-damage');
            if (select && select.value) {
                weapons.push({
                    name: select.value,
                    skill: skillInput?.value || '',
                    damage: damageInput?.value || ''
                });
            }
        });
        if (weapons.length > 0) {
            stats.weapons = weapons;
        }

        stats.backstory = document.getElementById('coc-edit-backstory')?.value || '';

        const possessions = [];
        document.querySelectorAll('#coc-edit-possessions .coc-edit-possession-row').forEach(row => {
            const nameInput = row.querySelector('.coc-edit-possession-name');
            const qtyInput = row.querySelector('.coc-edit-possession-qty');
            if (nameInput && nameInput.value.trim()) {
                possessions.push({
                    name: nameInput.value.trim(),
                    quantity: parseInt(qtyInput?.value) || 1
                });
            }
        });
        if (possessions.length > 0) {
            stats.possessions = possessions;
        }

        stats.assets = {
            spendingLevel: document.querySelector('.coc-edit-spending')?.value || '',
            cash: document.querySelector('.coc-edit-cash')?.value || '',
            assets: document.querySelector('.coc-edit-assets')?.value || ''
        };

        const relationships = [];
        document.querySelectorAll('#coc-edit-relationships .coc-edit-relationship-row').forEach(row => {
            const nameInput = row.querySelector('.coc-edit-rel-name');
            const relInput = row.querySelector('.coc-edit-rel-desc');
            if (nameInput && nameInput.value.trim() && relInput && relInput.value.trim()) {
                relationships.push({
                    name: nameInput.value.trim(),
                    relationship: relInput.value.trim()
                });
            }
        });
        if (relationships.length > 0) {
            stats.relationships = relationships;
        }

        if (stats.HP === undefined || stats.HP === null || Number.isNaN(stats.HP)) {
            stats.HP = Math.floor((stats.CON + stats.SIZ) / 10);
        }

        if (stats.SAN === undefined || stats.SAN === null || Number.isNaN(stats.SAN)) {
            stats.SAN = stats.POW;
        }

        if (!stats.luck) {
            stats.luck = { current: stats.LUCK || 50, max: stats.LUCK || 50 };
        } else {
            if (stats.luck.current === undefined) stats.luck.current = stats.LUCK || stats.luck.max || 50;
            if (stats.luck.max === undefined) stats.luck.max = stats.LUCK || stats.luck.current || 50;
        }

        return stats;
    }
    
    // 导入文件
    function importFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);
                    
                    let name, stats;
                    if (jsonData.character && jsonData.stats) {
                        name = jsonData.character;
                        stats = jsonData.stats;
                    } else {
                        name = file.name.replace('.json', '').replace(/-coc-stats$/, '');
                        stats = jsonData;
                    }
                    
                    data.set(name, stats);
                    renderViewMode();
                    
                    setTimeout(() => {
                        const select = document.getElementById('coc-role-select');
                        if (select) {
                            select.value = name;
                            select.dispatchEvent(new Event('change'));
                        }
                    }, 100);
                    
                } catch (error) {
                    alert(`❌ 导入失败: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // 导出角色
    function exportCharacter() {
        const select = document.getElementById('coc-role-select');
        if (!select) return;
        
        const name = select.value;
        if (!name) {
            alert('❌ 请先选择角色');
            return;
        }
        
        const char = data.get(name);
        if (!char) return;
        
        const exportData = {
            character: name,
            stats: char.stats,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}-coc-stats.json`;
        a.click();
    }
    
    // 删除角色
    function deleteCharacter() {
        const select = document.getElementById('coc-role-select');
        if (!select) return;
        
        const name = select.value;
        
        if (!name) {
            alert('❌ 请先选择角色');
            return;
        }
        
        if (confirm(`确定删除 ${name} 吗？`)) {
            data.delete(name);
            renderViewMode();
        }
    }
    
    // 构建UI
    function buildUI() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        const topBar = document.querySelector('[class*="header"]') || document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        /* 可修改配置：面板与顶部/底部的安全间距 */
        const safeTop = topBarHeight + 5;
        const safeBottom = 60;
        
        fetch('/scripts/extensions/third-party/SillyTavern-CoC/templates/character-panel.html')
            .then(response => response.text())
            .then(html => {
                document.body.insertAdjacentHTML('beforeend', html);
                panelElement = document.getElementById('coc-panel');
                
                if (!panelElement) return;
                
                /* 可修改配置：面板与顶部距离、宽度、底部距离 */
                const panelTop = safeTop + 10;
                const panelWidth = Math.min(420, winWidth - 20);
                const panelLeft = Math.max(10, Math.floor((winWidth - panelWidth) / 2));
                const panelHeight = Math.max(520, Math.min(720, winHeight - panelTop - safeBottom));
                
                panelElement.style.top = panelTop + 'px';
                panelElement.style.left = panelLeft + 'px';
                panelElement.style.width = panelWidth + 'px';
                panelElement.style.height = panelHeight + 'px';
                
                const closeBtn = document.getElementById('coc-close-panel');
                if (closeBtn) {
                    closeBtn.onclick = (e) => {
                        e.stopPropagation();
                        panelElement.style.display = 'none';
                    };
                }
                
                bindToolbarEvents();
                renderViewMode();
            })
            .catch(err => {
                console.error('[COC] 加载模板失败:', err);
            });
    }
    
    // 成长面板函数
    function renderGrowthPanel(name, stats) {
        const usedSkills = stats.usedSkills || [];
        const allSkills = {
            ...(stats.occupationalSkills || {}),
            ...(stats.interestSkills || {}),
            ...(stats.fightingSkills || {}),
            ...(stats.skills || {})
        };
        
        return `
            <div class="coc-edit-section">
                <div class="coc-edit-title">📈 幕间成长 - ${name}</div>
                <div class="coc-edit-label">本次剧本使用过的技能：</div>
                <div id="coc-used-skills" class="coc-select-list">
                    ${usedSkills.length > 0 ? usedSkills.map(skill => `
                        <div class="coc-select-row">
                            <span class="coc-skill-name">${skill}</span>
                            <span class="coc-skill-value">${allSkills[skill] || 0}%</span>
                            <button class="coc-btn small" onclick="applySkillGrowth('${name}', '${skill}')">📈 成长</button>
                        </div>
                    `).join('') : '<div style="color: #8e7c68;">本次剧本未使用技能</div>'}
                </div>
                <button class="coc-add-btn" id="coc-mark-skill-btn">➕ 手动标记技能使用</button>
                <div class="coc-edit-actions">
                    <button class="coc-edit-save" id="coc-growth-done">完成</button>
                </div>
            </div>
        `;
    }
    
    // 应用技能成长
    function applySkillGrowth(characterName, skillName) {
        const char = data.get(characterName);
        if (!char) return;

        const stats = char.stats || {};

        // 优先从分类技能读取（更符合UI）
        const currentValue =
            (stats.occupationalSkills && stats.occupationalSkills[skillName] !== undefined) ? stats.occupationalSkills[skillName]
            : (stats.interestSkills && stats.interestSkills[skillName] !== undefined) ? stats.interestSkills[skillName]
            : (stats.fightingSkills && stats.fightingSkills[skillName] !== undefined) ? stats.fightingSkills[skillName]
            : (stats.skills && stats.skills[skillName] !== undefined) ? stats.skills[skillName]
            : 50;

        const roll = rollD100();

        if (roll > currentValue) {
            const increase = Math.floor(Math.random() * 10) + 1;
            const newValue = currentValue + increase;

            // 回写到对应分类；如果找不到分类，就回写到 skills
            if (stats.occupationalSkills && stats.occupationalSkills[skillName] !== undefined) {
                stats.occupationalSkills[skillName] = newValue;
            } else if (stats.interestSkills && stats.interestSkills[skillName] !== undefined) {
                stats.interestSkills[skillName] = newValue;
            } else if (stats.fightingSkills && stats.fightingSkills[skillName] !== undefined) {
                stats.fightingSkills[skillName] = newValue;
            } else {
                if (!stats.skills) stats.skills = {};
                stats.skills[skillName] = newValue;
            }

            // 同步到 skills（保证斜杠命令/工具调用总能读到最新值）
            if (!stats.skills) stats.skills = {};
            stats.skills[skillName] = newValue;

            if (stats.usedSkills) {
                stats.usedSkills = stats.usedSkills.filter(s => s !== skillName);
            }

            char.stats = stats;
            data.save();

            alert(`✅ ${skillName} 成长成功！ ${currentValue}% → ${newValue}% (+${increase})`);
        } else {
            alert(`❌ ${skillName} 成长失败，未能突破当前值`);
        }
    }

    // ==================== 伤害/恢复系统核心函数 ====================

    function ensureHealthState(stats) {
        if (!stats.health) stats.health = {};
        if (stats.health.isMajorWound === undefined) stats.health.isMajorWound = false;
        if (stats.health.isDying === undefined) stats.health.isDying = false;
        if (stats.health.isUnconscious === undefined) stats.health.isUnconscious = false;
        if (!stats.health.naturalHealing) stats.health.naturalHealing = {};
        if (!stats.health.majorWoundRecovery) stats.health.majorWoundRecovery = {};
    }

    function isSameDay(a, b) {
        return new Date(a).toDateString() === new Date(b).toDateString();
    }

    function takeDamage(characterName, damage, { location } = {}) {
        const char = data.get(characterName);
        if (!char) return null;

        const stats = char.stats || {};
        const maxHP = calculateMaxHP(stats);
        const oldHP = stats.HP ?? maxHP;
        const newHP = Math.max(0, oldHP - Math.max(0, damage));

        stats.HP = newHP;
        ensureHealthState(stats);

        const instantDeath = damage >= maxHP;
        const isMajorWound = damage >= Math.floor(maxHP / 2);
        const isDying = newHP === 0 && !instantDeath;
        const isUnconscious = newHP <= 0 || isDying;

        stats.health.isMajorWound = stats.health.isMajorWound || isMajorWound;
        stats.health.isDying = isDying;
        stats.health.isUnconscious = isUnconscious;
        stats.health.isDead = instantDeath;
        stats.health.lastDamage = {
            amount: damage,
            location: location || '未知',
            time: new Date().toISOString()
        };

        char.stats = stats;
        data.save();

        return {
            oldHP,
            newHP,
            maxHP,
            isMajorWound: stats.health.isMajorWound,
            isDying,
            isUnconscious,
            isDead: stats.health.isDead
        };
    }

    function firstAid(characterName, medicName) {
        const char = data.get(characterName);
        if (!char) return { message: `❌ 角色 ${characterName} 不存在` };

        const stats = char.stats || {};
        ensureHealthState(stats);

        if (stats.health.isDead) {
            return { message: `❌ ${characterName} 已死亡，无法急救` };
        }

        if (stats.health.isDying && stats.HP <= 0) {
            stats.HP = 1;
            stats.health.isDying = false;
            stats.health.isUnconscious = false;
        }

        char.stats = stats;
        data.save();

        return {
            message: `✅ ${medicName} 对 ${characterName} 进行急救，稳定伤势（HP：${stats.HP}/${calculateMaxHP(stats)}）`
        };
    }

    function medicine(characterName, doctorName) {
        const char = data.get(characterName);
        if (!char) return { message: `❌ 角色 ${characterName} 不存在` };

        const stats = char.stats || {};
        ensureHealthState(stats);

        if (stats.health.isDead) {
            return { message: `❌ ${characterName} 已死亡，无法治疗` };
        }

        if (stats.health.isMajorWound && stats.HP <= 0) {
            return { message: `❌ ${characterName} 处于濒死状态，需先急救` };
        }

        stats.HP = Math.min(calculateMaxHP(stats), (stats.HP ?? calculateMaxHP(stats)) + 1);
        char.stats = stats;
        data.save();

        return {
            message: `✅ ${doctorName} 对 ${characterName} 进行医学治疗（HP：${stats.HP}/${calculateMaxHP(stats)}）`
        };
    }

    function naturalHealing(characterName) {
        const char = data.get(characterName);
        if (!char) return { message: `❌ 角色 ${characterName} 不存在` };

        const stats = char.stats || {};
        ensureHealthState(stats);

        const time = data.getTimeStatus();
        const lastHeal = stats.health.naturalHealing.lastAt;
        if (lastHeal && time.lastDayReset && !isSameDay(lastHeal, time.lastDayReset)) {
            stats.health.naturalHealing.lastAt = null;
        }

        if (stats.health.naturalHealing.lastAt) {
            return { message: `❌ ${characterName} 今天已经进行过自然恢复` };
        }

        stats.HP = Math.min(calculateMaxHP(stats), (stats.HP ?? calculateMaxHP(stats)) + 1);
        stats.health.naturalHealing.lastAt = new Date().toISOString();
        char.stats = stats;
        data.save();

        return { message: `🌿 ${characterName} 自然恢复 1 点 HP（HP：${stats.HP}/${calculateMaxHP(stats)}）` };
    }

    function majorWoundRecovery(characterName) {
        const char = data.get(characterName);
        if (!char) return null;

        const stats = char.stats || {};
        ensureHealthState(stats);

        if (!stats.health.isMajorWound) {
            return null;
        }

        const time = data.getTimeStatus();
        const lastWeek = stats.health.majorWoundRecovery.lastWeek || 0;
        if (lastWeek >= time.week) {
            return { message: `❌ ${characterName} 本周已进行过重伤恢复检定` };
        }

        const con = stats.CON || 50;
        const roll = rollD100();
        const success = roll <= con;

        stats.health.majorWoundRecovery.lastWeek = time.week;

        if (success) {
            stats.health.isMajorWound = false;
            stats.health.isUnconscious = false;
        }

        char.stats = stats;
        data.save();

        return {
            message: `🩹 ${characterName} 重伤恢复检定：D100=${roll} / CON=${con} → ${success ? '成功（脱离重伤）' : '失败（仍为重伤）'}`
        };
    }

    function handleDying(characterName) {
        const char = data.get(characterName);
        if (!char) return null;

        const stats = char.stats || {};
        ensureHealthState(stats);

        if (stats.health.isDead) {
            return { message: `❌ ${characterName} 已死亡` };
        }

        if (!stats.health.isDying) {
            return { message: `❌ ${characterName} 不处于濒死状态` };
        }

        const con = stats.CON || 50;
        const roll = rollD100();
        const success = roll <= con;

        if (success) {
            stats.health.isDying = false;
            stats.health.isUnconscious = true;
            stats.HP = Math.max(1, stats.HP || 0);
        }

        char.stats = stats;
        data.save();

        return {
            message: `💀 ${characterName} 濒死体质检定：D100=${roll} / CON=${con} → ${success ? '成功（稳定）' : '失败（仍濒死）'}`
        };
    }

    // ==================== 疯狂系统核心函数 ====================

    function triggerTemporaryInsanity(characterName, sanLoss, source) {
        const char = data.get(characterName);
        if (!char) return null;
        
        if (sanLoss < 5) return { triggered: false, reason: 'SAN损失不足' };
        
        const int = char.stats.INT;
        const intRoll = rollD100();
        const intSuccess = intRoll <= int;
        
        if (!intSuccess) {
            return {
                triggered: false,
                reason: '智力检定失败，压抑了恐怖记忆',
                intRoll,
                int
            };
        }
        
        const duration = Math.floor(Math.random() * 10) + 1;
        const symptom = INSTANT_INSANITY_SYMPTOMS[Math.floor(Math.random() * INSTANT_INSANITY_SYMPTOMS.length)];
        
        char.stats.insanity = {
            type: 'temporary',
            symptom,
            duration,
            source,
            startTime: new Date().toISOString(),
            phase: 'active',
            intRoll,
            int
        };
        
        if (source && source.includes('神话')) {
            const currentMythos = char.stats.skills?.['克苏鲁神话'] || 0;
            if (!char.stats.skills) char.stats.skills = {};
            if (currentMythos === 0) {
                char.stats.skills['克苏鲁神话'] = 5;
            } else {
                char.stats.skills['克苏鲁神话'] = currentMythos + 1;
            }
        }
        
        data.save();
        
        return {
            triggered: true,
            type: 'temporary',
            symptom,
            duration,
            intRoll,
            int,
            source
        };
    }

    function checkIndefiniteInsanity(characterName, totalLossToday) {
        const char = data.get(characterName);
        if (!char) return null;
        
        const currentSan = char.stats.SAN || 50;
        const threshold = Math.floor(currentSan / 5);
        const timeStatus = typeof data.getTimeStatus === 'function' ? data.getTimeStatus() : null;
        const effectiveLoss = (typeof totalLossToday === 'number')
            ? totalLossToday
            : (timeStatus?.daySanLoss || 0);
        
        if (effectiveLoss < threshold) {
            return { triggered: false, reason: '损失不足', totalLossToday: effectiveLoss, threshold };
        }
        
        const symptom = INSTANT_INSANITY_SYMPTOMS[Math.floor(Math.random() * INSTANT_INSANITY_SYMPTOMS.length)];
        
        char.stats.insanity = {
            type: 'indefinite',
            symptom,
            source: 'cumulative trauma',
            startTime: new Date().toISOString(),
            phase: 'active',
            totalLossToday: effectiveLoss
        };
        
        data.save();
        
        return {
            triggered: true,
            type: 'indefinite',
            symptom,
            totalLossToday: effectiveLoss,
            threshold
        };
    }

    function endInsanityEpisode(characterName) {
        const char = data.get(characterName);
        if (!char || !char.stats.insanity) return null;
        
        char.stats.insanity.phase = 'latent';
        char.stats.insanity.episodeEndTime = new Date().toISOString();
        
        if (char.stats.insanity.type === 'temporary') {
            const summarySymptom = SUMMARY_INSANITY_SYMPTOMS[
                Math.floor(Math.random() * SUMMARY_INSANITY_SYMPTOMS.length)
            ];
            char.stats.insanity.summarySymptom = summarySymptom;
            
            if (summarySymptom.includes('恐惧症')) {
                if (!char.stats.phobias) char.stats.phobias = [];
                const phobia = PHOBIAS[Math.floor(Math.random() * PHOBIAS.length)];
                char.stats.phobias.push({
                    name: phobia,
                    source: char.stats.insanity.source
                });
            } else if (summarySymptom.includes('躁狂症')) {
                if (!char.stats.manias) char.stats.manias = [];
                const mania = MANIAS[Math.floor(Math.random() * MANIAS.length)];
                char.stats.manias.push({
                    name: mania,
                    source: char.stats.insanity.source
                });
            }
        }
        
        data.save();
        
        return char.stats.insanity;
    }

    function realityCheck(characterName) {
        const char = data.get(characterName);
        if (!char) return null;
        
        if (!char.stats.insanity || char.stats.insanity.phase !== 'latent') {
            return { allowed: false, reason: '不在潜在疯狂阶段' };
        }
        
        const currentSan = char.stats.SAN || 50;
        const roll = rollD100();
        const success = roll <= currentSan;
        
        if (success) {
            char.stats.insanity.realityCheckPassed = true;
            data.save();
            return {
                success: true,
                roll,
                san: currentSan,
                message: '你意识到眼前景象的虚幻本质'
            };
        } else {
            const newSan = Math.max(0, currentSan - 1);
            char.stats.SAN = newSan;
            data.save();
            return {
                success: false,
                roll,
                san: currentSan,
                newSan,
                message: '你无法分辨真实与虚幻，理智受到侵蚀'
            };
        }
    }

    // 暴露全局函数
    window.applySkillGrowth = applySkillGrowth;
    window.triggerTemporaryInsanity = triggerTemporaryInsanity;
    window.checkIndefiniteInsanity = checkIndefiniteInsanity;
    window.endInsanityEpisode = endInsanityEpisode;
    window.realityCheck = realityCheck;
    window.takeDamage = takeDamage;
    window.firstAid = firstAid;
    window.medicine = medicine;
    window.naturalHealing = naturalHealing;
    window.majorWoundRecovery = majorWoundRecovery;
    window.handleDying = handleDying;
    
    return buildUI;
}
