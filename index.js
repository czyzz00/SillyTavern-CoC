// COC7 角色卡 - 带可选择列表版
(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    let panelElement = null;
    let api = null;
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

    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        waitForContext();
    }

    function waitForContext() {
        if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
            setTimeout(waitForContext, 200);
            return;
        }
        
        try {
            const context = SillyTavern.getContext();
            initialize(context);
        } catch (e) {
            console.error('[COC] 获取context失败:', e);
            setTimeout(waitForContext, 200);
        }
    }

    function initialize(context) {
        if (!context.extensionSettings[MODULE_NAME]) {
            context.extensionSettings[MODULE_NAME] = { characters: {} };
        }

        api = {
            getAllCharacters: () => context.extensionSettings[MODULE_NAME].characters || {},
            getCharacter: (name) => (context.extensionSettings[MODULE_NAME].characters || {})[name] || null,
            setCharacter: (name, stats) => {
                const settings = context.extensionSettings[MODULE_NAME];
                if (!settings.characters) settings.characters = {};
                settings.characters[name] = { stats: stats, updatedAt: new Date().toISOString() };
                context.saveSettingsDebounced();
                return true;
            },
            deleteCharacter: (name) => {
                const settings = context.extensionSettings[MODULE_NAME];
                if (settings.characters?.[name]) {
                    delete settings.characters[name];
                    context.saveSettingsDebounced();
                    return true;
                }
                return false;
            },
            sendMessage: (text) => {
                try {
                    context.sendMessage(text, 'system');
                } catch (e) {
                    console.error('[COC] 发送消息失败:', e);
                }
            }
        };

        buildUI();
    }

    function buildUI() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        const topBar = document.querySelector('[class*="header"]') || document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        const safeTop = topBarHeight + 5;
        const safeBottom = winHeight - 60;

        // 创建浮动球
        const floatingBall = document.createElement('div');
        floatingBall.className = 'coc-floating-ball';
        floatingBall.id = 'coc-floating-ball';
        floatingBall.textContent = '🎲';
        floatingBall.style.top = (safeTop + 20) + 'px';
        floatingBall.style.right = '20px';
        document.body.appendChild(floatingBall);

        // 拖动功能
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        floatingBall.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            const rect = floatingBall.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            floatingBall.style.transform = 'none';
            floatingBall.style.top = startTop + 'px';
            floatingBall.style.left = startLeft + 'px';
            floatingBall.style.right = 'auto';
            
            isDragging = false;
        }, { passive: false });

        floatingBall.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (startX === undefined) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                isDragging = true;
            }
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            newLeft = Math.max(0, Math.min(winWidth - 56, newLeft));
            newTop = Math.max(safeTop, Math.min(safeBottom, newTop));
            
            floatingBall.style.top = newTop + 'px';
            floatingBall.style.left = newLeft + 'px';
        }, { passive: false });

        floatingBall.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            if (!isDragging) {
                togglePanel();
            }
            
            startX = startY = undefined;
            isDragging = false;
        });

        floatingBall.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            startX = startY = undefined;
            isDragging = false;
        });

        // 加载模板
        fetch('/scripts/extensions/third-party/SillyTavern-CoC/templates/character-panel.html')
            .then(response => response.text())
            .then(html => {
                document.body.insertAdjacentHTML('beforeend', html);
                panelElement = document.getElementById('coc-panel');
                
                // 设置面板位置
                const panelTop = safeTop;
                const panelLeft = 10;
                const panelWidth = winWidth - 20;
                const panelHeight = 560;
                
                panelElement.style.top = panelTop + 'px';
                panelElement.style.left = panelLeft + 'px';
                panelElement.style.width = panelWidth + 'px';
                panelElement.style.height = panelHeight + 'px';
                
                // 关闭按钮
                document.getElementById('coc-close-panel').onclick = (e) => {
                    e.stopPropagation();
                    panelElement.style.display = 'none';
                };

                bindToolbarEvents();
                renderViewMode();
                
                alert('✅ COC7角色卡已加载');
            })
            .catch(err => {
                console.error('[COC] 加载模板失败:', err);
                alert('❌ 加载模板失败，请检查文件路径');
            });
    }

    function togglePanel() {
        if (!panelElement) return;
        if (panelElement.style.display === 'none') {
            panelElement.style.display = 'flex';
            renderViewMode();
        } else {
            panelElement.style.display = 'none';
        }
    }

    function calculateMaxHP(stats) {
        if (stats.CON && stats.SIZ) {
            return Math.floor((stats.CON + stats.SIZ) / 10);
        }
        return stats.HP || 10;
    }

    function calculateMaxSAN(stats) {
        return stats.POW || 60;
    }

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

    function calculateBuild(stats) {
        const str = stats.STR || 50;
        const siz = stats.SIZ || 50;
        const total = str + siz;
        
        if (total <= 64) return -2;
        if (total <= 84) return -1;
        if (total <= 124) return 0;
        if (total <= 164) return 1;
        return 2;
    }

    function calculateDamageBonus(stats) {
        const build = calculateBuild(stats);
        if (build <= -2) return '-2';
        if (build === -1) return '-1';
        if (build === 0) return '0';
        if (build === 1) return '+1d4';
        return '+1d6';
    }

    function renderCharacterCard(name, stats) {
        stats = stats || {};
        
        const maxHP = calculateMaxHP(stats);
        const currentHP = stats.HP || maxHP;
        const hpPercent = Math.min(100, Math.max(0, (currentHP / maxHP) * 100));
        
        const maxSAN = calculateMaxSAN(stats);
        const currentSAN = stats.SAN || maxSAN;
        const sanPercent = Math.min(100, Math.max(0, (currentSAN / maxSAN) * 100));
        
        const move = calculateMove(stats);
        const build = calculateBuild(stats);
        const db = calculateDamageBonus(stats);
        const armor = stats.armor || 0;
        
        const occupation = stats.occupation || '调查员';
        const age = stats.age || '—';
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
                        <div class="coc-avatar">🦌</div>
                        <div>
                            <div class="coc-name">${name}</div>
                            <div class="coc-subtitle">${occupation} · ${age}岁</div>
                        </div>
                    </div>
                    <div class="coc-info-grid">
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
                        ${Object.entries(occupationalSkills).map(([skill, value]) => `
                            <div class="coc-skill-item">
                                <span class="coc-skill-name">${skill}</span>
                                <span class="coc-skill-value occupational">${value}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="coc-section-title">✨ 兴趣技能</div>
                    <div class="coc-skills-grid">
                        ${Object.entries(interestSkills).map(([skill, value]) => `
                            <div class="coc-skill-item">
                                <span class="coc-skill-name">${skill}</span>
                                <span class="coc-skill-value interest">${value}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="coc-section-title">⚔️ 格斗技能</div>
                    <div class="coc-skills-grid">
                        ${Object.entries(fightingSkills).map(([skill, value]) => `
                            <div class="coc-skill-item">
                                <span class="coc-skill-name">${skill}</span>
                                <span class="coc-skill-value fighting">${value}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="coc-section-title">📜 背景故事</div>
                    <div class="coc-backstory">${stats.backstory || '——'}</div>
                </div>

                <div>
                    <div class="coc-section-title">🎒 装备物品</div>
                    <div class="coc-weapons-list">
                        ${possessions.length > 0 ? possessions.map(item => `
                            <div class="coc-possession-row">
                                <span>${item.name}</span>
                                <span>${item.quantity || 1}x</span>
                            </div>
                        `).join('') : '<div style="color: #8e7c68; text-align: center;">无</div>'}
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
                        ${relationships.length > 0 ? relationships.map(rel => `
                            <div class="coc-relationship-row">
                                <span>${rel.name}</span>
                                <span>${rel.relationship}</span>
                            </div>
                        `).join('') : '<div style="color: #8e7c68; text-align: center;">无</div>'}
                    </div>
                </div>

                <button class="coc-btn edit" id="coc-edit-mode-btn">✏️ 编辑角色</button>
            </div>
        `;
    }

    function renderViewMode() {
        const characters = api.getAllCharacters();
        const names = Object.keys(characters).sort();
        const select = document.getElementById('coc-role-select');
        
        if (select) {
            select.innerHTML = '<option value="">选择角色</option>' + 
                names.map(name => `<option value="${name}">${name}</option>`).join('');
        }
        
        const display = document.getElementById('coc-stats-display');
        display.innerHTML = '<div class="coc-empty">👆 请选择角色</div>';
    }

    function bindToolbarEvents() {
        const select = document.getElementById('coc-role-select');
        if (select) {
            select.addEventListener('change', (e) => {
                const name = e.target.value;
                if (!name) {
                    document.getElementById('coc-stats-display').innerHTML = '<div class="coc-empty">👆 请选择角色</div>';
                    return;
                }
                
                const char = api.getCharacter(name);
                if (char) {
                    document.getElementById('coc-stats-display').innerHTML = renderCharacterCard(name, char.stats);
                    document.getElementById('coc-edit-mode-btn').onclick = () => {
                        enterEditMode(name, char.stats);
                    };
                }
            });
        }

        document.getElementById('coc-import-btn').onclick = () => importFromFile();
        document.getElementById('coc-export-btn').onclick = () => exportCharacter();
        document.getElementById('coc-delete-btn').onclick = () => deleteCharacter();

        document.querySelectorAll('.coc-example-btn').forEach(btn => {
            btn.onclick = () => {
                const example = btn.dataset.example === 'liang' ? {
                    occupation: '记者',
                    age: 28,
                    birthplace: '伦敦',
                    residence: '伦敦',
                    STR: 70,
                    DEX: 50,
                    CON: 60,
                    SIZ: 60,
                    INT: 70,
                    APP: 50,
                    POW: 60,
                    EDU: 60,
                    LUCK: 50,
                    occupationalSkills: { '侦查': 80, '聆听': 70, '图书馆使用': 60, '说服': 50, '潜行': 40 },
                    interestSkills: { '摄影': 70, '历史': 60, '外语': 50 },
                    fightingSkills: { '格斗(斗殴)': 60, '射击': 50 },
                    backstory: '曾是战地记者，见过太多超自然事件',
                    possessions: [{ name: '相机', quantity: 1 }, { name: '笔记本', quantity: 1 }],
                    assets: { spendingLevel: '$50', cash: '$500', assets: '$5000' },
                    relationships: [{ name: '张薇', relationship: '搭档' }]
                } : {
                    occupation: '图书管理员',
                    age: 32,
                    birthplace: '波士顿',
                    residence: '阿卡姆',
                    STR: 50,
                    DEX: 60,
                    CON: 50,
                    SIZ: 50,
                    INT: 80,
                    APP: 60,
                    POW: 70,
                    EDU: 80,
                    LUCK: 60,
                    occupationalSkills: { '图书馆使用': 90, '外语': 80, '历史': 70, '心理学': 60 },
                    interestSkills: { '侦查': 70, '潜行': 50, '说服': 60 },
                    fightingSkills: { '格斗(斗殴)': 40 },
                    backstory: '在米斯卡塔尼克大学图书馆工作，研究禁书',
                    possessions: [{ name: '古籍', quantity: 3 }, { name: '手电筒', quantity: 1 }],
                    assets: { spendingLevel: '$30', cash: '$200', assets: '$2000' },
                    relationships: [{ name: '李昂', relationship: '调查员同行' }]
                };
                
                api.setCharacter(btn.textContent.trim(), example);
                renderViewMode();
                api.sendMessage(`✅ 已添加示例: ${btn.textContent.trim()}`);
                
                setTimeout(() => {
                    const select = document.getElementById('coc-role-select');
                    select.value = btn.textContent.trim();
                    select.dispatchEvent(new Event('change'));
                }, 100);
            };
        });
    }

    function enterEditMode(name, stats) {
        isEditing = true;
        currentEditName = name;
        currentEditStats = JSON.parse(JSON.stringify(stats));
        
        document.getElementById('coc-stats-display').style.display = 'none';
        const editSection = document.getElementById('coc-edit-section');
        editSection.style.display = 'block';
        editSection.innerHTML = renderEditForm(name, currentEditStats);
        
        bindEditEvents();
    }

    // 生成技能选择下拉框HTML
    function renderSkillOptions(selectedSkill, type) {
        const list = SKILLS_LIST[type] || [];
        return list.map(skill => 
            `<option value="${skill}" ${skill === selectedSkill ? 'selected' : ''}>${skill}</option>`
        ).join('');
    }

    // 生成武器选择下拉框HTML
    function renderWeaponOptions(selectedWeapon) {
        return WEAPONS_LIST.map(weapon => 
            `<option value="${weapon.name}" ${weapon.name === selectedWeapon ? 'selected' : ''}>${weapon.name} (${weapon.damage})</option>`
        ).join('');
    }

    // 渲染编辑表单（带选择列表）
    function renderEditForm(name, stats) {
        return `
            <div class="coc-edit-section">
                <div class="coc-edit-title">✏️ 编辑 ${name}</div>
                
                <div>
                    <div class="coc-edit-label">职业</div>
                    <input type="text" class="coc-edit-input coc-edit-occupation" value="${stats.occupation || '调查员'}">
                </div>
                <div class="coc-edit-grid">
                    <div>
                        <div class="coc-edit-label">年龄</div>
                        <input type="number" class="coc-edit-input coc-edit-age" value="${stats.age || 30}">
                    </div>
                    <div>
                        <div class="coc-edit-label">出生地</div>
                        <input type="text" class="coc-edit-input coc-edit-birthplace" value="${stats.birthplace || ''}">
                    </div>
                    <div>
                        <div class="coc-edit-label">居住地</div>
                        <input type="text" class="coc-edit-input coc-edit-residence" value="${stats.residence || ''}">
                    </div>
                </div>

                <div class="coc-edit-label">属性</div>
                <div class="coc-edit-grid">
                    ${['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'LUCK'].map(attr => `
                        <div>
                            <div class="coc-edit-label">${attr}</div>
                            <input type="number" class="coc-edit-input coc-edit-input-attr" data-attr="${attr}" value="${stats[attr] || 50}">
                        </div>
                    `).join('')}
                </div>

                <!-- 职业技能（可选择） -->
                <div class="coc-edit-label">职业技能</div>
                <div id="coc-edit-occupational-skills" class="coc-select-list">
                    ${Object.entries(stats.occupationalSkills || {}).map(([skill, value]) => `
                        <div class="coc-select-row">
                            <select class="coc-edit-occ-skill-name">
                                <option value="">选择技能</option>
                                ${renderSkillOptions(skill, 'occupational')}
                            </select>
                            <input type="number" class="coc-edit-occ-skill-value" value="${value}" placeholder="数值">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-occ-skill">+ 添加职业技能</button>

                <!-- 兴趣技能（可选择） -->
                <div class="coc-edit-label">兴趣技能</div>
                <div id="coc-edit-interest-skills" class="coc-select-list">
                    ${Object.entries(stats.interestSkills || {}).map(([skill, value]) => `
                        <div class="coc-select-row">
                            <select class="coc-edit-int-skill-name">
                                <option value="">选择技能</option>
                                ${renderSkillOptions(skill, 'interest')}
                            </select>
                            <input type="number" class="coc-edit-int-skill-value" value="${value}" placeholder="数值">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-int-skill">+ 添加兴趣技能</button>

                <!-- 格斗技能（可选择） -->
                <div class="coc-edit-label">格斗技能</div>
                <div id="coc-edit-fighting-skills" class="coc-select-list">
                    ${Object.entries(stats.fightingSkills || {}).map(([skill, value]) => `
                        <div class="coc-select-row">
                            <select class="coc-edit-fight-skill-name">
                                <option value="">选择技能</option>
                                ${renderSkillOptions(skill, 'fighting')}
                            </select>
                            <input type="number" class="coc-edit-fight-skill-value" value="${value}" placeholder="数值">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-fight-skill">+ 添加格斗技能</button>

                <!-- 武器（可选择） -->
                <div class="coc-edit-label">武器</div>
                <div id="coc-edit-weapons" class="coc-select-list">
                    ${(stats.weapons || []).map(weapon => `
                        <div class="coc-select-row">
                            <select class="coc-edit-weapon-select" style="flex:1;">
                                <option value="">选择武器</option>
                                ${WEAPONS_LIST.map(w => 
                                    `<option value="${w.name}" ${w.name === weapon.name ? 'selected' : ''} data-skill="${w.skill}" data-damage="${w.damage}">${w.name} (${w.damage})</option>`
                                ).join('')}
                            </select>
                            <input type="text" class="coc-edit-weapon-skill" value="${weapon.skill}" placeholder="技能%" style="flex:0.5;">
                            <input type="text" class="coc-edit-weapon-damage" value="${weapon.damage}" placeholder="伤害" style="flex:0.5;">
                            <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
                        </div>
                    `).join('')}
                </div>
                <button class="coc-add-btn" id="coc-add-weapon">+ 添加武器</button>

                <div class="coc-edit-label">背景故事</div>
                <textarea class="coc-edit-textarea" id="coc-edit-backstory" rows="3">${stats.backstory || ''}</textarea>

                <div class="coc-edit-label">装备物品</div>
                <div id="coc-edit-possessions" class="coc-select-list">
                    ${(stats.possessions || []).map(item => `
                        <div class="coc-edit-possession-row">
                            <input type="text" class="coc-edit-input coc-edit-possession-name" value="${item.name}" placeholder="物品名">
                            <input type="number" class="coc-edit-input coc-edit-possession-qty" value="${item.quantity || 1}" placeholder="数量">
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
                            <input type="text" class="coc-edit-input coc-edit-rel-name" value="${rel.name}" placeholder="姓名">
                            <input type="text" class="coc-edit-input coc-edit-rel-desc" value="${rel.relationship}" placeholder="关系">
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

    function bindEditEvents() {
        // 添加职业技能
        document.getElementById('coc-add-occ-skill').onclick = () => {
            const container = document.getElementById('coc-edit-occupational-skills');
            const newRow = document.createElement('div');
            newRow.className = 'coc-select-row';
            newRow.innerHTML = `
                <select class="coc-edit-occ-skill-name">
                    <option value="">选择技能</option>
                    ${SKILLS_LIST.occupational.map(skill => `<option value="${skill}">${skill}</option>`).join('')}
                </select>
                <input type="number" class="coc-edit-occ-skill-value" value="50" placeholder="数值">
                <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
            `;
            container.appendChild(newRow);
        };

        // 添加兴趣技能
        document.getElementById('coc-add-int-skill').onclick = () => {
            const container = document.getElementById('coc-edit-interest-skills');
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
        };

        // 添加格斗技能
        document.getElementById('coc-add-fight-skill').onclick = () => {
            const container = document.getElementById('coc-edit-fighting-skills');
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
        };

        // 添加武器
        document.getElementById('coc-add-weapon').onclick = () => {
            const container = document.getElementById('coc-edit-weapons');
            const newRow = document.createElement('div');
            newRow.className = 'coc-select-row';
            newRow.innerHTML = `
                <select class="coc-edit-weapon-select" style="flex:1;" onchange="this.parentElement.querySelector('.coc-edit-weapon-skill').value = this.options[this.selectedIndex].dataset.skill; this.parentElement.querySelector('.coc-edit-weapon-damage').value = this.options[this.selectedIndex].dataset.damage">
                    <option value="">选择武器</option>
                    ${WEAPONS_LIST.map(w => `<option value="${w.name}" data-skill="${w.skill}" data-damage="${w.damage}">${w.name} (${w.damage})</option>`).join('')}
                </select>
                <input type="text" class="coc-edit-weapon-skill" placeholder="技能%" style="flex:0.5;">
                <input type="text" class="coc-edit-weapon-damage" placeholder="伤害" style="flex:0.5;">
                <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
            `;
            container.appendChild(newRow);

            // 添加武器选择自动填充事件
            newRow.querySelector('.coc-edit-weapon-select').addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                newRow.querySelector('.coc-edit-weapon-skill').value = selectedOption.dataset.skill || '';
                newRow.querySelector('.coc-edit-weapon-damage').value = selectedOption.dataset.damage || '';
            });
        };

        // 添加物品
        document.getElementById('coc-add-possession').onclick = () => {
            const container = document.getElementById('coc-edit-possessions');
            const newRow = document.createElement('div');
            newRow.className = 'coc-edit-possession-row';
            newRow.innerHTML = `
                <input type="text" class="coc-edit-input coc-edit-possession-name" placeholder="物品名">
                <input type="number" class="coc-edit-input coc-edit-possession-qty" value="1" placeholder="数量">
                <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
            `;
            container.appendChild(newRow);
        };

        // 添加关系
        document.getElementById('coc-add-relationship').onclick = () => {
            const container = document.getElementById('coc-edit-relationships');
            const newRow = document.createElement('div');
            newRow.className = 'coc-edit-relationship-row';
            newRow.innerHTML = `
                <input type="text" class="coc-edit-input coc-edit-rel-name" placeholder="姓名">
                <input type="text" class="coc-edit-input coc-edit-rel-desc" placeholder="关系">
                <button class="coc-remove-btn" onclick="this.parentElement.remove()">✖</button>
            `;
            container.appendChild(newRow);
        };

        // 为已有的武器选择框绑定自动填充事件
        document.querySelectorAll('.coc-edit-weapon-select').forEach(select => {
            select.addEventListener('change', function() {
                const row = this.closest('.coc-select-row');
                const selectedOption = this.options[this.selectedIndex];
                if (row) {
                    row.querySelector('.coc-edit-weapon-skill').value = selectedOption.dataset.skill || '';
                    row.querySelector('.coc-edit-weapon-damage').value = selectedOption.dataset.damage || '';
                }
            });
        });

        // 保存编辑
        document.getElementById('coc-save-edit').onclick = () => {
            const newStats = collectEditData();
            api.setCharacter(currentEditName, newStats);
            
            isEditing = false;
            document.getElementById('coc-stats-display').style.display = 'block';
            document.getElementById('coc-edit-section').style.display = 'none';
            
            document.getElementById('coc-stats-display').innerHTML = renderCharacterCard(currentEditName, newStats);
            document.getElementById('coc-edit-mode-btn').onclick = () => {
                enterEditMode(currentEditName, newStats);
            };
            
            api.sendMessage(`✅ ${currentEditName} 已更新`);
        };

        // 取消编辑
        document.getElementById('coc-cancel-edit').onclick = () => {
            isEditing = false;
            document.getElementById('coc-stats-display').style.display = 'block';
            document.getElementById('coc-edit-section').style.display = 'none';
        };
    }

    function collectEditData() {
        const stats = {};

        stats.occupation = document.querySelector('.coc-edit-occupation')?.value || '调查员';
        stats.age = parseInt(document.querySelector('.coc-edit-age')?.value) || 30;
        stats.birthplace = document.querySelector('.coc-edit-birthplace')?.value || '';
        stats.residence = document.querySelector('.coc-edit-residence')?.value || '';

        document.querySelectorAll('.coc-edit-input-attr').forEach(input => {
            const attr = input.dataset.attr;
            stats[attr] = parseInt(input.value) || 50;
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

        return stats;
    }

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
                    const data = JSON.parse(event.target.result);
                    
                    let name, stats;
                    if (data.character && data.stats) {
                        name = data.character;
                        stats = data.stats;
                    } else {
                        name = file.name.replace('.json', '').replace(/-coc-stats$/, '');
                        stats = data;
                    }
                    
                    api.setCharacter(name, stats);
                    renderViewMode();
                    api.sendMessage(`✅ 已导入: ${name}`);
                    
                    setTimeout(() => {
                        const select = document.getElementById('coc-role-select');
                        select.value = name;
                        select.dispatchEvent(new Event('change'));
                    }, 100);
                    
                } catch (error) {
                    api.sendMessage(`❌ 导入失败: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    function exportCharacter() {
        const select = document.getElementById('coc-role-select');
        const name = select.value;
        if (!name) {
            api.sendMessage('❌ 请先选择角色');
            return;
        }
        
        const char = api.getCharacter(name);
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
        
        api.sendMessage(`✅ ${name} 已导出`);
    }

    function deleteCharacter() {
        const select = document.getElementById('coc-role-select');
        const name = select.value;
        
        if (!name) {
            api.sendMessage('❌ 请先选择角色');
            return;
        }
        
        if (confirm(`确定删除 ${name} 吗？`)) {
            api.deleteCharacter(name);
            renderViewMode();
            api.sendMessage(`✅ ${name} 已删除`);
        }
    }

    waitForBody();
})();
