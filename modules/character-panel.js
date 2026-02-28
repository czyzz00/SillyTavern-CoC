// ==================== 角色卡面板UI ====================

function registerCharacterPanel(context, data, core) {
    const { calculateMaxHP, calculateMaxSAN, calculateMove, calculateBuild, calculateDamageBonus, calculateDB } = core;
    
    let panelElement = null;
    let isEditing = false;
    let currentEditName = '';
    let currentEditStats = null;
    
    // 预定义技能列表
    const SKILLS_LIST = {
        occupational: [
            '会计', '人类学', '估价', '考古学', '艺术', '手艺', '信用评级', '克苏鲁神话',
            '戏剧', '驾驶', '电气维修', '电子学', '格斗(斗殴)', '射击(手枪)', '射击(步枪)',
            '急救', '历史', '恐吓', '跳跃', '法律', '图书馆使用', '聆听', '锁匠', '机械维修',
            '医学', '自然', '导航', '神秘学', '操作重型机械', '说服', '攀爬', '精神分析',
            '心理学', '骑术', '科学', '妙手', '侦查', '潜行', '生存', '游泳', '投掷', '追踪'
        ],
        interest: [
            '会计', '人类学', '估价', '考古学', '艺术', '手艺', '信用评级', '克苏鲁神话',
            '戏剧', '驾驶', '电气维修', '电子学', '格斗(斗殴)', '射击(手枪)', '射击(步枪)',
            '急救', '历史', '恐吓', '跳跃', '法律', '图书馆使用', '聆听', '锁匠', '机械维修',
            '医学', '自然', '导航', '神秘学', '操作重型机械', '说服', '攀爬', '精神分析',
            '心理学', '骑术', '科学', '妙手', '侦查', '潜行', '生存', '游泳', '投掷', '追踪'
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
    
    // 社交技能列表
    const SOCIAL_SKILLS = ['说服', '恐吓', '心理', '乔装', '快速交谈', '魅惑'];
    
    // 科学技能列表
    const SCIENCE_SKILLS = ['生物', '化学', '物理', '天文', '地质', '数学', '药学', '气象'];
    
    // 艺术/工艺技能列表
    const CRAFT_SKILLS = ['绘画', '雕塑', '摄影', '写作', '演奏', '唱歌', '舞蹈', '木工', '裁缝'];
    
    // 外语列表
    const LANGUAGE_SKILLS = ['英语', '汉语', '法语', '德语', '西班牙语', '拉丁语', '日语', '俄语', '阿拉伯语'];

    // ==================== 完整的60种职业数据库 ====================
    
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
        '药学': 1, '化学': 1, '生物': 1, '数学': 1, '天文': 1
    };

    // ==================== 属性生成函数 ====================

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

    // 生成所有属性
    function generateRandomAttributes() {
        return {
            STR: roll3d6x5(),
            DEX: roll3d6x5(),
            CON: roll3d6x5(),
            APP: roll3d6x5(),
            POW: roll3d6x5(),
            SIZ: roll2d6plus6x5(),
            INT: roll2d6plus6x5(),
            EDU: roll2d6plus6x5(),
            LUCK: roll3d6x5()
        };
    }

    // 年龄修正表
    const AGE_MODIFIERS = {
        '15-19': { eduMod: -5, strSizMod: -5, luckDouble: true },
        '20-39': { eduGrowth: 1 },
        '40-49': { eduGrowth: 2, strConDexMod: -5, appMod: -5 },
        '50-59': { eduGrowth: 3, strConDexMod: -10, appMod: -10 },
        '60-69': { eduGrowth: 4, strConDexMod: -20, appMod: -15 },
        '70-79': { eduGrowth: 4, strConDexMod: -40, appMod: -20 },
        '80-89': { eduGrowth: 4, strConDexMod: -80, appMod: -25 }
    };

    // 应用年龄修正
    function applyAgeModifiers(attributes, ageRange) {
        const mod = AGE_MODIFIERS[ageRange];
        if (!mod) return attributes;

        const newAttrs = { ...attributes };

        // 教育成长判定
        if (mod.eduGrowth) {
            for (let i = 0; i < mod.eduGrowth; i++) {
                const roll = Math.floor(Math.random() * 100) + 1;
                if (roll > newAttrs.EDU) {
                    newAttrs.EDU += Math.floor(Math.random() * 10) + 1;
                }
            }
        }

        // 教育减值
        if (mod.eduMod) {
            newAttrs.EDU = Math.max(0, newAttrs.EDU + mod.eduMod);
        }

        // 属性减值
        if (mod.strSizMod) {
            newAttrs.STR = Math.max(15, newAttrs.STR + mod.strSizMod);
            newAttrs.SIZ = Math.max(15, newAttrs.SIZ + mod.strSizMod);
        }

        if (mod.strConDexMod) {
            newAttrs.STR = Math.max(15, newAttrs.STR + mod.strConDexMod);
            newAttrs.CON = Math.max(15, newAttrs.CON + mod.strConDexMod);
            newAttrs.DEX = Math.max(15, newAttrs.DEX + mod.strConDexMod);
        }

        if (mod.appMod) {
            newAttrs.APP = Math.max(15, newAttrs.APP + mod.appMod);
        }

        return newAttrs;
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

    // ✅ 修复：计算技能的实际加点值（减去基础值）
    function getSkillPointsSpent(skillName, skillValue) {
        const baseValue = getSkillBaseValue(skillName);
        return Math.max(0, skillValue - baseValue);
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
    
    // 渲染角色卡片
    function renderCharacterCard(name, stats) {
        try {
            stats = stats || {};
            
            // 添加默认属性值
            if (!stats.CON) stats.CON = 50;
            if (!stats.SIZ) stats.SIZ = 50;
            if (!stats.STR) stats.STR = 50;
            if (!stats.POW) stats.POW = 50;
            if (!stats.DEX) stats.DEX = 50;
            if (!stats.APP) stats.APP = 50;
            if (!stats.INT) stats.INT = 50;
            if (!stats.EDU) stats.EDU = 50;
            if (!stats.LUCK) stats.LUCK = 50;
            
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
                                    <div class="coc-stat-label">${attr}</div>
                                    <div class="coc-stat-value">${stats[attr] || '—'}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="coc-stat-row">
                            <div class="coc-stat-row-item">体格 ${build} · 伤害加值 ${db} · 护甲 ${armor}</div>
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
                    // ✅ 随机生成属性
                    const randomAttrs = generateRandomAttributes();
                    
                    const newName = prompt('请输入新角色名:');
                    if (newName && newName.trim()) {
                        const name = newName.trim();
                        if (data.get(name)) {
                            alert('❌ 角色已存在');
                        } else {
                            const defaultStats = {
                                occupation: '调查员',
                                gender: '男',
                                birthYear: 1890,
                                currentYear: 1925,
                                birthplace: '',
                                residence: '',
                                ...randomAttrs,
                                HP: Math.floor((randomAttrs.CON + randomAttrs.SIZ) / 10),
                                SAN: randomAttrs.POW,
                                occupationalSkills: {},
                                interestSkills: {},
                                fightingSkills: {},
                                possessions: [],
                                assets: { spendingLevel: '', cash: '', assets: '' },
                                relationships: []
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
        
        // 计算当前属性值
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
        
        // 计算技能点
        const occPoints = calculateOccupationPoints(currentOccupation, attributes);
        const intPoints = calculateInterestPoints(attributes.INT);
        
        // ✅ 修复：计算已使用点数（只算超出基础值的部分）
        let usedOccPoints = 0;
        if (stats.occupationalSkills) {
            Object.entries(stats.occupationalSkills).forEach(([skill, value]) => {
                usedOccPoints += getSkillPointsSpent(skill, value);
            });
        }
        
        let usedIntPoints = 0;
        if (stats.interestSkills) {
            Object.entries(stats.interestSkills).forEach(([skill, value]) => {
                usedIntPoints += getSkillPointsSpent(skill, value);
            });
        }
        
        return `
            <div class="coc-edit-section">
                <div class="coc-edit-title">✏️ 编辑 ${name}</div>
                
                <!-- 头像上传区 -->
                <div class="coc-edit-avatar">
                    <div class="coc-edit-avatar-preview" id="coc-avatar-preview">
                        ${stats.avatar 
                            ? `<img src="${stats.avatar}" alt="avatar">` 
                            : '<div class="coc-edit-avatar-placeholder">🦌</div>'}
                    </div>
                    <button class="coc-edit-avatar-btn" id="coc-avatar-upload-btn">📷 上传头像</button>
                    <input type="file" id="coc-avatar-input" accept="image/png,image/jpeg,image/gif,image/webp" style="display: none;">
                </div>
                
                <!-- 职业选择 -->
                <div>
                    <div class="coc-edit-label">职业</div>
                    <select class="coc-edit-input coc-edit-occupation-select" id="coc-occupation-select">
                        <option value="">选择职业</option>
                        ${occupationNames.map(occName => 
                            `<option value="${occName}" ${occName === currentOccupation ? 'selected' : ''}>${occName}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <!-- 技能点显示（实时更新） -->
                <div class="coc-edit-grid" style="margin-top: 8px;">
                    <div>
                        <div class="coc-edit-label">职业技能点</div>
                        <div class="coc-stat-value" style="text-align:center;" id="occ-points-total">${occPoints}</div>
                        <div class="coc-edit-label" style="font-size:8px;">已用: <span id="occ-points-used">${usedOccPoints}</span> / 剩余: <span id="occ-points-remaining">${occPoints - usedOccPoints}</span></div>
                    </div>
                    <div>
                        <div class="coc-edit-label">兴趣技能点</div>
                        <div class="coc-stat-value" style="text-align:center;" id="int-points-total">${intPoints}</div>
                        <div class="coc-edit-label" style="font-size:8px;">已用: <span id="int-points-used">${usedIntPoints}</span> / 剩余: <span id="int-points-remaining">${intPoints - usedIntPoints}</span></div>
                    </div>
                </div>
                
                <!-- 年龄和年份 -->
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
                        <input type="number" class="coc-edit-input coc-edit-birth-year" value="${stats.birthYear || 1890}" placeholder="1890">
                    </div>
                    <div>
                        <div class="coc-edit-label">当前年份</div>
                        <input type="number" class="coc-edit-input coc-edit-current-year" value="${stats.currentYear || 1925}" placeholder="1925">
                    </div>
                </div>
                
                <!-- 出生地和居住地 -->
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

                <!-- 属性（不可编辑，只读） -->
                <div class="coc-edit-label">属性（随机生成，不可修改）</div>
                <div class="coc-edit-grid">
                    ${['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'LUCK'].map(attr => `
                        <div>
                            <div class="coc-edit-label">${attr}</div>
                            <input type="number" class="coc-edit-input" value="${stats[attr] || 50}" readonly style="background:#555; color:#aaa;">
                        </div>
                    `).join('')}
                </div>

                <div class="coc-edit-label">职业技能</div>
                <div id="coc-edit-occupational-skills" class="coc-select-list">
                    ${Object.entries(stats.occupationalSkills || {}).map(([skill, value]) => `
                        <div class="coc-select-row">
                            <select class="coc-edit-occ-skill-name">
                                <option value="">选择技能</option>
                                ${renderSkillOptions(skill, 'occupational', currentOccupation)}
                            </select>
                            <input type="number" class="coc-edit-occ-skill-value" value="${value}" placeholder="数值" onchange="updatePointsDisplay()" oninput="updatePointsDisplay()">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove(); setTimeout(updatePointsDisplay, 10)">✖</button>
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
                            <input type="number" class="coc-edit-int-skill-value" value="${value}" placeholder="数值" onchange="updatePointsDisplay()" oninput="updatePointsDisplay()">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove(); setTimeout(updatePointsDisplay, 10)">✖</button>
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
    
    // ✅ 修复：更新点数显示（考虑基础值）
    function updatePointsDisplay() {
        const occTotal = parseInt(document.getElementById('occ-points-total')?.textContent) || 0;
        const intTotal = parseInt(document.getElementById('int-points-total')?.textContent) || 0;
        
        let occUsed = 0;
        document.querySelectorAll('#coc-edit-occupational-skills .coc-select-row').forEach(row => {
            const select = row.querySelector('.coc-edit-occ-skill-name');
            const valueInput = row.querySelector('.coc-edit-occ-skill-value');
            if (select && valueInput && select.value) {
                const skillName = select.value;
                const skillValue = parseInt(valueInput.value) || 0;
                occUsed += getSkillPointsSpent(skillName, skillValue);
            }
        });
        
        let intUsed = 0;
        document.querySelectorAll('#coc-edit-interest-skills .coc-select-row').forEach(row => {
            const select = row.querySelector('.coc-edit-int-skill-name');
            const valueInput = row.querySelector('.coc-edit-int-skill-value');
            if (select && valueInput && select.value) {
                const skillName = select.value;
                const skillValue = parseInt(valueInput.value) || 0;
                intUsed += getSkillPointsSpent(skillName, skillValue);
            }
        });
        
        document.getElementById('occ-points-used').textContent = occUsed;
        document.getElementById('int-points-used').textContent = intUsed;
        document.getElementById('occ-points-remaining').textContent = occTotal - occUsed;
        document.getElementById('int-points-remaining').textContent = intTotal - intUsed;
    }
    
    // 绑定编辑事件
    function bindEditEvents() {
        // 职业选择变更事件
        const occupationSelect = document.getElementById('coc-occupation-select');
        if (occupationSelect) {
            occupationSelect.addEventListener('change', (e) => {
                const newOccupation = e.target.value;
                if (newOccupation) {
                    // 重新计算技能点显示
                    const attributes = {
                        STR: parseInt(document.querySelector('[data-attr="STR"]')?.value) || 50,
                        DEX: parseInt(document.querySelector('[data-attr="DEX"]')?.value) || 50,
                        CON: parseInt(document.querySelector('[data-attr="CON"]')?.value) || 50,
                        APP: parseInt(document.querySelector('[data-attr="APP"]')?.value) || 50,
                        POW: parseInt(document.querySelector('[data-attr="POW"]')?.value) || 50,
                        INT: parseInt(document.querySelector('[data-attr="INT"]')?.value) || 50,
                        SIZ: parseInt(document.querySelector('[data-attr="SIZ"]')?.value) || 50,
                        EDU: parseInt(document.querySelector('[data-attr="EDU"]')?.value) || 50
                    };
                    
                    const occPoints = calculateOccupationPoints(newOccupation, attributes);
                    const intPoints = calculateInterestPoints(attributes.INT);
                    
                    document.getElementById('occ-points-total').textContent = occPoints;
                    document.getElementById('int-points-total').textContent = intPoints;
                    updatePointsDisplay();
                    
                    // 刷新职业技能下拉框
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
        
        // 头像上传
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

        // 添加职业技能
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
                        <input type="number" class="coc-edit-occ-skill-value" value="50" placeholder="数值" onchange="updatePointsDisplay()" oninput="updatePointsDisplay()">
                        <button class="coc-remove-btn" onclick="this.parentElement.remove(); setTimeout(updatePointsDisplay, 10)">✖</button>
                    `;
                    container.appendChild(newRow);
                    
                    // 绑定输入事件
                    newRow.querySelector('.coc-edit-occ-skill-value').addEventListener('input', updatePointsDisplay);
                    newRow.querySelector('.coc-edit-occ-skill-value').addEventListener('change', updatePointsDisplay);
                }
            };
        }

        // 添加兴趣技能
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
                        <input type="number" class="coc-edit-int-skill-value" value="50" placeholder="数值" onchange="updatePointsDisplay()" oninput="updatePointsDisplay()">
                        <button class="coc-remove-btn" onclick="this.parentElement.remove(); setTimeout(updatePointsDisplay, 10)">✖</button>
                    `;
                    container.appendChild(newRow);
                    
                    newRow.querySelector('.coc-edit-int-skill-value').addEventListener('input', updatePointsDisplay);
                    newRow.querySelector('.coc-edit-int-skill-value').addEventListener('change', updatePointsDisplay);
                }
            };
        }

        // 为所有现有技能输入绑定事件
        document.querySelectorAll('.coc-edit-occ-skill-value, .coc-edit-int-skill-value').forEach(input => {
            input.addEventListener('input', updatePointsDisplay);
            input.addEventListener('change', updatePointsDisplay);
        });

        // 添加格斗技能
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

        // 添加武器
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

        // 添加物品
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

        // 添加关系
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

        // 为已有的武器选择框绑定自动填充事件
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

        // 保存编辑
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

        // 取消编辑
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

        // 初始化点数显示
        setTimeout(updatePointsDisplay, 100);
    }
    
    // 收集编辑数据
    function collectEditData() {
        const stats = {};

        stats.occupation = document.getElementById('coc-occupation-select')?.value || '调查员';
        stats.gender = document.querySelector('.coc-edit-gender')?.value || '男';
        stats.birthYear = parseInt(document.querySelector('.coc-edit-birth-year')?.value) || 1890;
        stats.currentYear = parseInt(document.querySelector('.coc-edit-current-year')?.value) || 1925;
        stats.birthplace = document.querySelector('.coc-edit-birthplace')?.value || '';
        stats.residence = document.querySelector('.coc-edit-residence')?.value || '';

        // 保留原有属性值（不可修改）
        document.querySelectorAll('.coc-edit-input[readonly]').forEach(input => {
            // 从父元素找属性名
            const parent = input.closest('div');
            if (parent) {
                const label = parent.querySelector('.coc-edit-label');
                if (label) {
                    const attr = label.textContent.trim();
                    stats[attr] = parseInt(input.value) || 50;
                }
            }
        });

        // 收集职业技能
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

        // 收集兴趣技能
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

        // 收集格斗技能
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

        // 收集武器
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

        // 收集装备物品
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

        // 收集同伴关系
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

        // 重新计算HP和SAN
        stats.HP = Math.floor((stats.CON + stats.SIZ) / 10);
        stats.SAN = stats.POW;

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
        const safeTop = topBarHeight + 5;
        
        fetch('/scripts/extensions/third-party/SillyTavern-CoC/templates/character-panel.html')
            .then(response => response.text())
            .then(html => {
                document.body.insertAdjacentHTML('beforeend', html);
                panelElement = document.getElementById('coc-panel');
                
                if (!panelElement) return;
                
                const panelTop = safeTop;
                const panelLeft = 10;
                const panelWidth = winWidth - 20;
                const panelHeight = 500;
                
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
    
    // 将更新函数暴露给全局
    window.updatePointsDisplay = updatePointsDisplay;
    
    return buildUI;
}
