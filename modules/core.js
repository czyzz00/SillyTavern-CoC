// ==================== COC7 核心函数 ====================
// 包含骰子规则、属性计算、职业系统

// ==================== 骰子核心函数 ====================

// 掷D100
function rollD100() {
    return Math.floor(Math.random() * 100) + 1;
}

function rollD10() {
    return Math.floor(Math.random() * 10);
}

function buildD100(tens, units) {
    const value = tens * 10 + units;
    return value === 0 ? 100 : value;
}

// 带奖励/惩罚骰的掷骰（标准COC7：个位共享，十位择优/择劣）
function rollWithBonusPenalty(bonusCount = 0, penaltyCount = 0) {
    const netBonus = (bonusCount || 0) - (penaltyCount || 0);
    const bonus = Math.max(0, netBonus);
    const penalty = Math.max(0, -netBonus);

    const units = rollD10();
    const tensRolls = [];
    const tensCount = 1 + Math.max(bonus, penalty);

    for (let i = 0; i < tensCount; i++) {
        tensRolls.push(rollD10());
    }

    if (bonus > 0) {
        const bestTens = Math.min(...tensRolls);
        return buildD100(bestTens, units);
    }

    if (penalty > 0) {
        const worstTens = Math.max(...tensRolls);
        return buildD100(worstTens, units);
    }

    return buildD100(tensRolls[0], units);
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

// COC7成功等级判定
function judgeCOC(roll, skillValue) {
    if (roll === 100) return { text: '大失败', emoji: '💀' };
    if (roll >= 96 && roll <= 99 && skillValue < 50) return { text: '大失败', emoji: '💀' };
    if (roll <= Math.floor(skillValue / 5)) return { text: '极难成功', emoji: '✨' };
    if (roll <= Math.floor(skillValue / 2)) return { text: '困难成功', emoji: '⭐' };
    if (roll <= skillValue) return { text: '成功', emoji: '✅' };
    return { text: '失败', emoji: '❌' };
}

// ==================== 属性计算函数 ====================

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

// 计算移动速度
function calculateMove(stats) {
    const str = stats.STR || 50;
    const dex = stats.DEX || 50;
    const siz = stats.SIZ || 50;
    const age = stats.age || 30;
    
    let base = 8;
    if (str < siz && dex < siz) base = 7;
    if (str > siz && dex > siz) base = 9;
    
    if (age >= 40 && age < 50) base -= 1;
    if (age >= 50 && age < 60) base -= 2;
    if (age >= 60 && age < 70) base -= 3;
    if (age >= 70 && age < 80) base -= 4;
    if (age >= 80) base -= 5;
    
    return Math.max(1, base);
}

// 计算最大HP
function calculateMaxHP(stats) {
    if (stats.CON && stats.SIZ) {
        return Math.floor((stats.CON + stats.SIZ) / 10);
    }
    return stats.HP || 10;
}

// 计算最大SAN
function calculateMaxSAN(stats) {
    return stats.POW || 60;
}

// ==================== 职业系统 ====================

const OCCUPATIONS = {
    // 2.1 学术/知识型 (12种)
    '会计师': {
        name: '会计师',
        pointFormula: 'EDU * 4',
        skills: ['会计', '法律', '图书馆使用', '聆听', '说服', '侦查', '打字', '母语'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '古董商': {
        name: '古董商',
        pointFormula: 'EDU * 4',
        skills: ['估价', '艺术/工艺', '历史', '图书馆使用', '侦查', '社交技能1项', '外语1项'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '建筑师': {
        name: '建筑师',
        pointFormula: 'EDU * 4',
        skills: ['艺术/工艺', '法律', '图书馆使用', '机械维修', '侦查', '科学(数学)'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '考古学家': {
        name: '考古学家',
        pointFormula: 'EDU * 4',
        skills: ['估价', '考古学', '历史', '外语', '图书馆使用', '机械维修', '科学(地质)'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '化学家': {
        name: '化学家',
        pointFormula: 'EDU * 4',
        skills: ['化学', '教育', '图书馆使用', '医学', '物理', '侦查', '科学(药学)'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '设计师': {
        name: '设计师',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['艺术/工艺', '机械维修', '心理', '社交技能2项', '侦查'],
        creditRating: '均可',
        era: '均可',
        category: '学术型'
    },
    '医生': {
        name: '医生',
        pointFormula: 'EDU * 4',
        skills: ['急救', '医学', '外语', '心理', '科学(生物)', '科学(药学)', '信用评级'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '工程师': {
        name: '工程师',
        pointFormula: 'EDU * 4',
        skills: ['艺术/工艺', '电气维修', '图书馆使用', '机械维修', '操作重型机械', '科学(物理)'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '记者': {
        name: '记者',
        pointFormula: 'EDU * 4',
        skills: ['艺术/工艺', '历史', '图书馆使用', '聆听', '心理', '写作', '社交技能1项'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '律师': {
        name: '律师',
        pointFormula: 'EDU * 4',
        skills: ['会计', '法律', '图书馆使用', '说服', '心理', '社交技能1项', '侦查'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '图书馆员': {
        name: '图书馆员',
        pointFormula: 'EDU * 4',
        skills: ['会计', '图书馆使用', '外语', '心理', '社交技能1项', '历史', '计算机使用(现代)'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },
    '教授': {
        name: '教授',
        pointFormula: 'EDU * 4',
        skills: ['图书馆使用', '外语', '心理', '社交技能2项', '侦查', '本专业学术技能2项'],
        creditRating: '职业技能',
        era: '均可',
        category: '学术型'
    },

    // 2.2 行动/执法型 (12种)
    '警察': {
        name: '警察',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['格斗', '射击', '恐吓', '法律', '侦查', '潜行', '驾驶', '心理', '急救'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '警探': {
        name: '警探',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['艺术/工艺', '射击', '恐吓', '法律', '聆听', '心理', '侦查', '格斗'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '联邦探员': {
        name: '联邦探员',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['射击', '法律', '聆听', '说服', '心理', '侦查', '格斗', '潜行'],
        creditRating: '职业技能',
        era: '现代',
        category: '行动型'
    },
    '军人': {
        name: '军人',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['射击', '格斗', '爆破', '躲藏', '潜行', '生存', '导航', '急救'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '士兵': {
        name: '士兵',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['射击', '格斗', '躲藏', '机械维修', '潜行', '生存', '聆听'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '军官': {
        name: '军官',
        pointFormula: 'EDU * 2 + POW * 2',
        skills: ['会计', '射击', '导航', '心理', '社交技能1项', '生存', '战术'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '保镖': {
        name: '保镖',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['格斗', '射击', '聆听', '侦查', '恐吓', '急救', '驾驶'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '猎人': {
        name: '猎人',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['射击', '聆听', '自然', '导航', '潜行', '追踪', '生存', '格斗'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '保安': {
        name: '保安',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['格斗', '射击', '聆听', '侦查', '法律', '急救', '驾驶'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '私家侦探': {
        name: '私家侦探',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['法律', '图书馆使用', '聆听', '摄影', '心理', '侦查', '乔装', '格斗'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },
    '法医': {
        name: '法医',
        pointFormula: 'EDU * 4',
        skills: ['医学', '人类学', '生物', '化学', '摄影', '侦查', '法律'],
        creditRating: '职业技能',
        era: '现代',
        category: '行动型'
    },
    '消防员': {
        name: '消防员',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['攀爬', '急救', '跳跃', '机械维修', '驾驶', '力量', '格斗'],
        creditRating: '职业技能',
        era: '均可',
        category: '行动型'
    },

    // 2.3 社交/艺术型 (12种)
    '演员': {
        name: '演员',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['艺术/工艺', '乔装', '心理', '社交技能3项', '聆听'],
        creditRating: '均可',
        era: '均可',
        category: '社交型'
    },
    '艺术家': {
        name: '艺术家',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['艺术/工艺', '历史', '心理', '侦查', '社交技能1项', '自然'],
        creditRating: '均可',
        era: '均可',
        category: '社交型'
    },
    '作家': {
        name: '作家',
        pointFormula: 'EDU * 4',
        skills: ['艺术/工艺', '历史', '图书馆使用', '自然', '心理', '社交技能1项'],
        creditRating: '均可',
        era: '均可',
        category: '社交型'
    },
    '音乐家': {
        name: '音乐家',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['艺术/工艺(乐器)', '心理', '社交技能2项', '聆听', '乔装'],
        creditRating: '均可',
        era: '均可',
        category: '社交型'
    },
    '摄影师': {
        name: '摄影师',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['艺术/工艺(摄影)', '化学', '乔装', '侦查', '机械维修', '心理'],
        creditRating: '均可',
        era: '均可',
        category: '社交型'
    },
    '神职人员': {
        name: '神职人员',
        pointFormula: 'EDU * 2 + POW * 2',
        skills: ['会计', '历史', '图书馆使用', '聆听', '心理', '社交技能1项', '说服'],
        creditRating: '职业技能',
        era: '均可',
        category: '社交型'
    },
    '社交名流': {
        name: '社交名流',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['艺术/工艺', '历史', '骑术', '心理', '社交技能2项', '外语'],
        creditRating: '均可',
        era: '1920s',
        category: '社交型'
    },
    '秘书': {
        name: '秘书',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['会计', '艺术/工艺', '图书馆使用', '心理', '社交技能2项', '打字'],
        creditRating: '均可',
        era: '均可',
        category: '社交型'
    },
    '外交官': {
        name: '外交官',
        pointFormula: 'EDU * 4',
        skills: ['外语2项', '心理', '社交技能2项', '法律', '历史', '说服'],
        creditRating: '职业技能',
        era: '均可',
        category: '社交型'
    },
    '酒吧老板': {
        name: '酒吧老板',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['会计', '社交技能2项', '心理', '聆听', '格斗', '射击'],
        creditRating: '均可',
        era: '均可',
        category: '社交型'
    },
    '妓女/男妓': {
        name: '妓女/男妓',
        pointFormula: 'EDU * 2 + APP * 2',
        skills: ['艺术/工艺', '乔装', '心理', '潜行', '社交技能2项', '聆听'],
        creditRating: '兴趣技能',
        era: '均可',
        category: '社交型'
    },

    // 2.4 技术/实用型 (12种)
    '驾驶员': {
        name: '驾驶员',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['汽车驾驶', '机械维修', '导航', '心理', '社交技能1项', '电气维修'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '机械师': {
        name: '机械师',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['艺术/工艺', '电气维修', '机械维修', '驾驶', '图书馆使用', '操作重型机械'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '技师': {
        name: '技师',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['艺术/工艺', '电气维修', '机械维修', '图书馆使用', '科学(物理)', '操作重型机械'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '电工': {
        name: '电工',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['电气维修', '机械维修', '图书馆使用', '科学(物理)', '攀爬'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '木匠': {
        name: '木匠',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['艺术/工艺(木工)', '机械维修', '攀爬', '数学', '驾驶'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '矿工': {
        name: '矿工',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['攀爬', '爆破', '机械维修', '操作重型机械', '生存', '地质'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '水手': {
        name: '水手',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['机械维修', '导航', '格斗', '潜行', '游泳', '投掷', '驾驶(船)'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '飞行员': {
        name: '飞行员',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['机械维修', '导航', '驾驶(飞机)', '电子', '气象', '无线电'],
        creditRating: '职业技能',
        era: '现代',
        category: '技术型'
    },
    '农夫': {
        name: '农夫',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['农业', '艺术/工艺', '汽车驾驶', '机械维修', '自然', '操作重型机械', '追踪'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '渔民': {
        name: '渔民',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['自然', '导航', '游泳', '格斗', '驾驶(船)', '生存', '机械维修'],
        creditRating: '职业技能',
        era: '均可',
        category: '技术型'
    },
    '快递员': {
        name: '快递员',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['驾驶', '潜行', '躲藏', '机械维修', '导航', '社交技能1项'],
        creditRating: '职业技能',
        era: '现代',
        category: '技术型'
    },
    '电话接线员': {
        name: '电话接线员',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['聆听', '打字', '社交技能2项', '心理', '计算机使用(现代)'],
        creditRating: '职业技能',
        era: '现代',
        category: '技术型'
    },

    // 2.5 底层/边缘型 (6种)
    '流浪汉': {
        name: '流浪汉',
        pointFormula: 'EDU * 2 + POW * 2',
        skills: ['躲藏', '聆听', '心理', '潜行', '社交技能1项', '生存', '攀爬'],
        creditRating: '兴趣技能',
        era: '均可',
        category: '边缘型'
    },
    '盗贼': {
        name: '盗贼',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['估价', '格斗', '躲藏', '聆听', '锁匠', '潜行', '偷窃', '攀爬'],
        creditRating: '兴趣技能',
        era: '均可',
        category: '边缘型'
    },
    '赌徒': {
        name: '赌徒',
        pointFormula: 'EDU * 2 + POW * 2',
        skills: ['艺术/工艺', '聆听', '心理', '侦查', '社交技能2项', '潜行'],
        creditRating: '兴趣技能',
        era: '均可',
        category: '边缘型'
    },
    '黑帮': {
        name: '黑帮',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['格斗', '射击', '恐吓', '聆听', '心理', '侦查', '驾驶', '法律'],
        creditRating: '职业技能',
        era: '均可',
        category: '边缘型'
    },
    '走私犯': {
        name: '走私犯',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['驾驶', '潜行', '躲藏', '社交技能1项', '侦查', '格斗', '射击'],
        creditRating: '兴趣技能',
        era: '均可',
        category: '边缘型'
    },
    '街头混混': {
        name: '街头混混',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['格斗', '躲藏', '聆听', '潜行', '偷窃', '攀爬', '跳跃'],
        creditRating: '兴趣技能',
        era: '均可',
        category: '边缘型'
    },

    // 2.6 特殊/复古型 (6种)
    '部落成员': {
        name: '部落成员',
        pointFormula: 'EDU * 2 + POW * 2',
        skills: ['格斗', '躲藏', '聆听', '自然', '潜行', '生存', '追踪', '投掷'],
        creditRating: '兴趣技能',
        era: '复古',
        category: '特殊型'
    },
    '萨满': {
        name: '萨满',
        pointFormula: 'EDU * 2 + POW * 2',
        skills: ['人类学', '自然', '心理', '医学(草药)', '社交技能1项', '神秘学'],
        creditRating: '兴趣技能',
        era: '复古',
        category: '特殊型'
    },
    '牛仔': {
        name: '牛仔',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['格斗', '射击', '骑术', '追踪', '生存', '自然', '投掷'],
        creditRating: '职业技能',
        era: '复古',
        category: '特殊型'
    },
    '探险家': {
        name: '探险家',
        pointFormula: 'EDU * 2 + STR * 2',
        skills: ['攀爬', '导航', '自然', '生存', '格斗', '射击', '外语'],
        creditRating: '职业技能',
        era: '均可',
        category: '特殊型'
    },
    '特技演员': {
        name: '特技演员',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['攀爬', '跳跃', '潜行', '格斗', '驾驶', '骑术', '游泳'],
        creditRating: '职业技能',
        era: '现代',
        category: '特殊型'
    },
    '马戏团演员': {
        name: '马戏团演员',
        pointFormula: 'EDU * 2 + DEX * 2',
        skills: ['艺术/工艺', '攀爬', '跳跃', '乔装', '潜行', '社交技能1项'],
        creditRating: '兴趣技能',
        era: '均可',
        category: '特殊型'
    }
};

// ==================== 职业信用评级范围 ====================
const CREDIT_RATING_RANGES = {
    '会计师': [30, 70], '古董商': [30, 60], '建筑师': [30, 70],
    '考古学家': [10, 40], '化学家': [10, 40], '设计师': [20, 50],
    '医生': [30, 80], '工程师': [30, 60], '记者': [10, 30],
    '律师': [30, 80], '图书馆员': [10, 35], '教授': [20, 60],
    '警察': [9, 30], '警探': [20, 50], '联邦探员': [20, 60],
    '军人': [8, 30], '士兵': [5, 20], '军官': [20, 50],
    '保镖': [15, 40], '猎人': [10, 30], '保安': [8, 20],
    '私家侦探': [20, 45], '法医': [20, 50], '消防员': [8, 20],
    '演员': [10, 40], '艺术家': [5, 30], '作家': [5, 30],
    '音乐家': [5, 30], '摄影师': [10, 30], '神职人员': [5, 30],
    '社交名流': [40, 80], '秘书': [10, 30], '外交官': [30, 70],
    '酒吧老板': [20, 40], '妓女/男妓': [1, 20],
    '驾驶员': [10, 30], '机械师': [10, 30], '技师': [10, 30],
    '电工': [10, 30], '木匠': [10, 30], '矿工': [5, 20],
    '水手': [5, 20], '飞行员': [20, 50], '农夫': [5, 20],
    '渔民': [5, 20], '快递员': [5, 20], '电话接线员': [5, 20],
    '流浪汉': [0, 5], '盗贼': [1, 20], '赌徒': [1, 20],
    '黑帮': [5, 30], '走私犯': [5, 20], '街头混混': [0, 5],
    '部落成员': [0, 5], '萨满': [0, 5], '牛仔': [5, 20],
    '探险家': [20, 50], '特技演员': [5, 20], '马戏团演员': [1, 15]
};

// 社交技能列表（用于"社交技能X项"的展开）
const SOCIAL_SKILLS = [
    '说服', '恐吓', '心理', '乔装', '快速交谈', '魅惑'
];

// 科学技能列表（用于"科学(XX)"的展开）
const SCIENCE_SKILLS = [
    '生物', '化学', '物理', '天文', '地质', '数学', '药学', '气象'
];

// 艺术/工艺技能列表
const CRAFT_SKILLS = [
    '绘画', '雕塑', '摄影', '写作', '演奏', '唱歌', '舞蹈', '木工', '裁缝'
];

// 外语列表
const LANGUAGE_SKILLS = [
    '英语', '汉语', '法语', '德语', '西班牙语', '拉丁语', '日语', '俄语', '阿拉伯语'
];

// 技能基础值表
const SKILL_BASE_VALUES = {
    '会计': 5, '人类学': 1, '估价': 5, '考古学': 1, '艺术/工艺': 5,
    '乔装': 5, '驾驶': 20, '电气维修': 10, '格斗': 25, '射击': 20,
    '急救': 30, '历史': 5, '恐吓': 15, '跳跃': 20, '法律': 5,
    '图书馆使用': 20, '聆听': 20, '锁匠': 1, '机械维修': 10,
    '医学': 1, '自然': 10, '导航': 10, '神秘学': 5, '操作重型机械': 1,
    '说服': 10, '心理': 10, '摄影': 5, '物理': 1, '潜行': 20,
    '生存': 10, '游泳': 20, '投掷': 20, '追踪': 10, '写作': 5,
    '信用评级': 0, '母语': 50, '外语': 1, '骑术': 5, '爆破': 1,
    '无线电': 1, '电子': 1, '气象': 1, '农业': 1, '打字': 20,
    '偷窃': 10, '躲藏': 10, '攀爬': 20, '战术': 1, '地质': 1,
    '药学': 1, '化学': 1, '生物': 1, '数学': 1, '天文': 1,
    '计算机使用': 5, '摄影': 5, '魅惑': 15, '快速交谈': 5
};

// ==================== 职业系统核心函数 ====================

/**
 * 计算职业技能点总数
 */
function calculateOccupationPoints(occupationName, attributes) {
    const occupation = OCCUPATIONS[occupationName];
    if (!occupation) return 0;
    
    const { STR, DEX, CON, APP, POW, INT, SIZ, EDU } = attributes;
    
    // 解析公式
    let formula = occupation.pointFormula;
    
    // 替换属性值为数字
    formula = formula.replace(/STR/g, STR)
                     .replace(/DEX/g, DEX)
                     .replace(/CON/g, CON)
                     .replace(/APP/g, APP)
                     .replace(/POW/g, POW)
                     .replace(/INT/g, INT)
                     .replace(/SIZ/g, SIZ)
                     .replace(/EDU/g, EDU);
    
    try {
        // 安全计算（公式只包含 + - * / 和数字）
        const total = eval(formula);
        return Math.floor(total);
    } catch (e) {
        console.error('公式计算错误:', formula);
        return 0;
    }
}

/**
 * 计算兴趣技能点总数
 */
function calculateInterestPoints(intelligence) {
    return intelligence * 2;
}

/**
 * 获取技能基础值
 */
function getSkillBaseValue(skillName) {
    // 处理艺术/工艺(具体)
    if (skillName.includes('艺术/工艺')) {
        return 5;
    }
    
    // 处理科学(具体)
    if (skillName.includes('科学(')) {
        return 1;
    }
    
    // 处理外语
    if (skillName.includes('外语')) {
        return 1;
    }
    
    // 精确匹配
    if (SKILL_BASE_VALUES[skillName] !== undefined) {
        return SKILL_BASE_VALUES[skillName];
    }
    
    // 部分匹配
    for (let key in SKILL_BASE_VALUES) {
        if (skillName.includes(key) || key.includes(skillName.split('(')[0])) {
            return SKILL_BASE_VALUES[key];
        }
    }
    
    return 5; // 默认值
}

/**
 * 展开职业的技能列表（处理"社交技能X项"等占位符）
 */
function expandOccupationSkills(occupation) {
    const expanded = [];
    
    occupation.skills.forEach(skill => {
        // 处理"社交技能X项"
        const socialMatch = skill.match(/社交技能(\d+)项/);
        if (socialMatch) {
            const count = parseInt(socialMatch[1]);
            // 注意：这里只是标记，实际需要玩家选择
            expanded.push(`社交技能(${count}项)`);
            return;
        }
        
        // 处理"外语X项"
        const langMatch = skill.match(/外语(\d+)项/);
        if (langMatch) {
            const count = parseInt(langMatch[1]);
            expanded.push(`外语(${count}项)`);
            return;
        }
        
        // 处理"本专业学术技能X项"
        const academicMatch = skill.match(/本专业学术技能(\d+)项/);
        if (academicMatch) {
            const count = parseInt(academicMatch[1]);
            expanded.push(`学术技能(${count}项)`);
            return;
        }
        
        // 普通技能
        expanded.push(skill);
    });
    
    return expanded;
}

/**
 * 验证技能分配
 */
function validateSkillAllocation(skillName, targetValue, source, occupationName) {
    const MAX_STARTING_SKILL = 75;
    
    // 检查是否超过75上限
    if (targetValue > MAX_STARTING_SKILL) {
        return {
            valid: false,
            reason: `技能初始值不能超过${MAX_STARTING_SKILL}%`
        };
    }
    
    const occupation = OCCUPATIONS[occupationName];
    if (!occupation) return { valid: true };
    
    // 如果是职业技能池的点数，检查技能是否在职业列表中
    if (source === 'occupational') {
        const isOccupationalSkill = occupation.skills.some(skill => 
            skill.includes(skillName) || skillName.includes(skill.split('(')[0])
        );
        
        if (!isOccupationalSkill) {
            return {
                valid: false,
                reason: `"${skillName}"不是${occupationName}的职业技能`
            };
        }
    }
    
    return { valid: true };
}

/**
 * 处理信用评级
 */
function handleCreditRating(occupationName, creditValue, source) {
    const occupation = OCCUPATIONS[occupationName];
    if (!occupation) return { source: '均可', allowed: true };
    
    const rule = occupation.creditRating;
    
    if (rule === '职业技能') {
        return { source: 'occupational', allowed: true };
    } else if (rule === '兴趣技能') {
        return { source: 'interest', allowed: true };
    } else {
        // '均可'
        return { source: source, allowed: true };
    }
}

/**
 * 获取所有职业名称列表
 */
function getOccupationNames() {
    return Object.keys(OCCUPATIONS).sort();
}

/**
 * 获取职业详情
 */
function getOccupationDetails(name) {
    return OCCUPATIONS[name] || null;
}

/**
 * 获取某类别的职业
 */
function getOccupationsByCategory(category) {
    return Object.values(OCCUPATIONS)
        .filter(occ => occ.category === category)
        .map(occ => occ.name);
}

/**
 * 获取某时代的职业
 */
function getOccupationsByEra(era) {
    return Object.values(OCCUPATIONS)
        .filter(occ => occ.era === era || occ.era === '均可')
        .map(occ => occ.name);
}

// ==================== 理智检定（公共） ====================

/**
 * 理智检定公共函数
 */
function sanCheck(characterName, lossFormula, source, data) {
    const char = data.get(characterName);
    if (!char) return null;

    const currentSan = char.stats.SAN || 50;
    const roll = rollD100();

    const result = {
        success: roll <= currentSan,
        text: roll <= currentSan ? '成功' : '失败',
        emoji: roll <= currentSan ? '✅' : '❌',
        level: roll <= currentSan ? 'success' : 'fail'
    };

    const [successLoss, failLoss] = lossFormula.split('/');

    let loss;
    if (result.success) {
        loss = parseDiceFormula(successLoss).total;
    } else {
        loss = parseDiceFormula(failLoss).total;
    }

    const newSan = Math.max(0, currentSan - loss);
    char.stats.SAN = newSan;

    if (typeof data?.addDaySanLoss === 'function') {
        data.addDaySanLoss(loss);
    }

    let insanity = null;
    if (newSan <= 0) {
        char.stats.insanity = {
            type: 'permanent',
            phase: 'active',
            startTime: new Date().toISOString()
        };
        insanity = { type: 'permanent' };
    } else if (loss >= 5 && typeof window.triggerTemporaryInsanity === 'function') {
        insanity = window.triggerTemporaryInsanity(characterName, loss, source);
    }

    data.save();

    return {
        roll,
        result,
        loss,
        newSan,
        isInsane: newSan <= 0,
        isTemporaryInsanity: loss >= 5 && result.success === false,
        insanity
    };
}

// ==================== 疯狂系统 ====================

// 临时疯狂 - 即时症状（1D10）
const INSTANT_INSANITY = [
    { name: "失忆", description: "玩家记起自己是谁，但不记得过去5分钟发生的事" },
    { name: "假性残疾", description: "心理原因导致身体机能丧失（失明、失聪、瘫痪等）" },
    { name: "暴力倾向", description: "对周围人无差别攻击，不分敌友" },
    { name: "偏执", description: "对所有人产生严重不信任，认为他们都要害自己" },
    { name: "仪式行为", description: "必须重复某个特定动作才能进行其他行动" },
    { name: "恐惧症", description: "对某事物产生极度恐惧，会不顾一切逃离" },
    { name: "躁狂症", description: "对某事物产生极度狂热，无法控制" },
    { name: "幻觉", description: "看到/听到不存在的事物，分不清现实" },
    { name: "人格解体", description: "感觉自己不是自己，像在观察陌生人" },
    { name: "道德障碍", description: "失去道德约束，做出极端行为" }
];

// 总结症状（疯狂发作后醒来）
const SUMMARY_INSANITY = [
    { name: "失忆", description: "不记得疯狂期间发生的事" },
    { name: "恐惧症", description: "获得一项新的恐惧症" },
    { name: "躁狂症", description: "获得一项新的躁狂症" },
    { name: "人格改变", description: "性格发生永久改变" },
    { name: "幻觉残留", description: "偶尔还会看到幻觉" }
];

// 恐惧症列表
const PHOBIAS = [
    "恐高症", "幽闭恐惧症", "社交恐惧症", "恐水症", "恐火症",
    "恐血恐惧症", "恐黑症", "恐惧动物症", "恐尸症", "恐惧神明症"
];

// 躁狂症列表
const MANIAS = [
    "洁癖", "囤积癖", "仪式行为", "说谎癖", "偷窃癖",
    "纵火癖", "暴露癖", "强迫性计数", "强迫性洗手", "嗜血"
];

// 触发临时疯狂
function triggerTemporaryInsanity(characterName) {
    const char = data.get(characterName);
    if (!char) return { success: false, message: '角色不存在' };
    
    // 智力检定决定是否意识到真相
    const int = char.stats.INT || 50;
    const roll = rollD100();
    const realize = roll <= int; // 成功才陷入疯狂
    
    if (realize) {
        const duration = Math.floor(Math.random() * 10) + 1; // 1D10小时
        const symptom = INSTANT_INSANITY[Math.floor(Math.random() * INSTANT_INSANITY.length)];
        
        // 记录疯狂状态
        if (!char.stats.insanity) char.stats.insanity = [];
        char.stats.insanity.push({
            type: 'temporary',
            symptom: symptom.name,
            description: symptom.description,
            duration,
            startTime: new Date().toISOString(),
            phase: 'active' // 疯狂发作阶段
        });
        
        // 克苏鲁神话技能增长（如果是神话相关）
        char.stats.skills['克苏鲁神话'] = (char.stats.skills['克苏鲁神话'] || 0) + 5;
        
        data.save();
        return {
            success: true,
            type: 'temporary',
            symptom: symptom.name,
            description: symptom.description,
            duration,
            message: `😱 ${characterName} 陷入临时疯狂！症状：${symptom.name} - ${symptom.description}，持续 ${duration} 小时`
        };
    }
    
    return {
        success: false,
        message: `🧠 ${characterName} 意志坚定，抵抗了疯狂`
    };
}

// 触发不定性疯狂
function triggerIndefiniteInsanity(characterName) {
    const char = data.get(characterName);
    if (!char) return { success: false, message: '角色不存在' };
    
    // 随机选择一个总结症状
    const summary = SUMMARY_INSANITY[Math.floor(Math.random() * SUMMARY_INSANITY.length)];
    
    // 如果是恐惧症或躁狂症，需要具体类型
    let specificType = '';
    if (summary.name === '恐惧症') {
        specificType = PHOBIAS[Math.floor(Math.random() * PHOBIAS.length)];
    } else if (summary.name === '躁狂症') {
        specificType = MANIAS[Math.floor(Math.random() * MANIAS.length)];
    }
    
    const fullDescription = specificType ? `${summary.name} - ${specificType}：${summary.description}` : summary.description;
    
    if (!char.stats.insanity) char.stats.insanity = [];
    char.stats.insanity.push({
        type: 'indefinite',
        symptom: summary.name,
        specificType,
        description: fullDescription,
        startTime: new Date().toISOString(),
        phase: 'active'
    });
    
    data.save();
    
    return {
        success: true,
        type: 'indefinite',
        symptom: summary.name,
        specificType,
        description: fullDescription,
        message: `😨 ${characterName} 陷入不定性疯狂！症状：${fullDescription}`
    };
}

// 触发永久疯狂
function triggerPermanentInsanity(characterName) {
    const char = data.get(characterName);
    if (!char) return { success: false, message: '角色不存在' };
    
    // 随机选择一个永久症状
    const summary = SUMMARY_INSANITY[Math.floor(Math.random() * SUMMARY_INSANITY.length)];
    let specificType = '';
    
    if (summary.name === '恐惧症') {
        specificType = PHOBIAS[Math.floor(Math.random() * PHOBIAS.length)];
    } else if (summary.name === '躁狂症') {
        specificType = MANIAS[Math.floor(Math.random() * MANIAS.length)];
    }
    
    const fullDescription = specificType ? `${summary.name} - ${specificType}：${summary.description}` : summary.description;
    
    if (!char.stats.insanity) char.stats.insanity = [];
    char.stats.insanity.push({
        type: 'permanent',
        symptom: summary.name,
        specificType,
        description: fullDescription,
        startTime: new Date().toISOString(),
        phase: 'permanent'
    });
    
    // SAN归零
    char.stats.SAN = 0;
    
    data.save();
    
    return {
        success: true,
        type: 'permanent',
        symptom: summary.name,
        specificType,
        description: fullDescription,
        message: `💔 ${characterName} 陷入永久疯狂！症状：${fullDescription}`
    };
}

// 根据理智损失触发疯狂
function checkInsanityFromSanLoss(characterName, loss, previousSan) {
    const char = data.get(characterName);
    if (!char) return null;
    
    const results = [];
    
    // 临时疯狂：一次损失 ≥5点SAN
    if (loss >= 5) {
        results.push(triggerTemporaryInsanity(characterName));
    }
    
    // 不定性疯狂：一天内损失 ≥当前SAN的1/5
    // 这里简化处理，需要记录每日损失
    const oneFifth = Math.floor(previousSan / 5);
    if (loss >= oneFifth) {
        results.push(triggerIndefiniteInsanity(characterName));
    }
    
    // 永久疯狂：SAN降至0
    if (char.stats.SAN <= 0) {
        results.push(triggerPermanentInsanity(characterName));
    }
    
    return results;
}

// ==================== 导出所有核心函数 ====================
const core = {
    // 骰子函数
    rollD100,
    rollWithBonusPenalty,
    parseDiceFormula,
    judgeCOC,
    
    // 属性计算
    calculateDB,
    calculateBuild,
    calculateMove,
    calculateMaxHP,
    calculateMaxSAN,
    
    // 职业系统
    calculateOccupationPoints,
    calculateInterestPoints,
    getSkillBaseValue,
    expandOccupationSkills,
    validateSkillAllocation,
    handleCreditRating,
    getOccupationNames,
    getOccupationDetails,
    getOccupationsByCategory,
    getOccupationsByEra,
    
    // 常量（供外部使用）
    OCCUPATIONS,
    SOCIAL_SKILLS,
    SCIENCE_SKILLS,
    CRAFT_SKILLS,
    SKILL_BASE_VALUES,
    LANGUAGE_SKILLS,
    CREDIT_RATING_RANGES,
    
    // 理智检定
    sanCheck,

    // 疯狂系统
    INSTANT_INSANITY,
    SUMMARY_INSANITY,
    PHOBIAS,
    MANIAS,
    triggerTemporaryInsanity,
    triggerIndefiniteInsanity,
    triggerPermanentInsanity,
    checkInsanityFromSanLoss
};
