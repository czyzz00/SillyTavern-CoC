// COC7 角色卡 - 定位分离版
(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    let panelElement = null;
    let api = null;
    let isEditing = false;
    let currentEditName = '';
    let currentEditStats = null;

    // 等待body存在
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        waitForContext();
    }

    // 等待SillyTavern上下文
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

    // 初始化存储
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
                settings.characters[name] = { 
                    stats: stats,
                    updatedAt: new Date().toISOString()
                };
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

    // 构建UI
    function buildUI() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        // 找到顶部栏高度
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
                
                // 设置面板位置 - 用之前验证过的安全区域
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

                // 绑定工具栏事件
                bindToolbarEvents();
                
                // 初始渲染
                renderViewMode();
                
                alert('✅ COC7角色卡已加载');
            })
            .catch(err => {
                console.error('[COC] 加载模板失败:', err);
            });
    }

    // 切换面板显示
    function togglePanel() {
        if (!panelElement) return;
        if (panelElement.style.display === 'none') {
            panelElement.style.display = 'flex';
            renderViewMode();
        } else {
            panelElement.style.display = 'none';
        }
    }

    // 计算HP最大值
    function calculateMaxHP(stats) {
        if (stats.CON && stats.SIZ) {
            return Math.floor((stats.CON + stats.SIZ) / 10);
        }
        return stats.HP || 10;
    }

    // 计算SAN最大值
    function calculateMaxSAN(stats) {
        return stats.POW || 60;
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

    // 计算体格
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

    // 计算伤害加值
    function calculateDamageBonus(stats) {
        const build = calculateBuild(stats);
        if (build <= -2) return '-2';
        if (build === -1) return '-1';
        if (build === 0) return '0';
        if (build === 1) return '+1d4';
        return '+1d6';
    }

    // 渲染角色卡片
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
                <!-- 基本信息 -->
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

                <!-- 状态条 -->
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

                <!-- 属性 -->
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

                <!-- 职业技能 -->
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

                <!-- 兴趣技能 -->
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

                <!-- 格斗技能 -->
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

                <!-- 背景故事 -->
                <div>
                    <div class="coc-section-title">📜 背景故事</div>
                    <div class="coc-backstory">${stats.backstory || '——'}</div>
                </div>

                <!-- 装备物品 -->
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

                <!-- 资产 -->
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

                <!-- 同伴关系 -->
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

                <!-- 编辑按钮 -->
                <button class="coc-btn edit" id="coc-edit-mode-btn">✏️ 编辑角色</button>
            </div>
        `;
    }

    // 渲染查看模式
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

    // 绑定工具栏事件
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

    // 进入编辑模式
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

    // 渲染编辑表单
    function renderEditForm(name, stats) {
        return `
            <div class="coc-edit-section">
                <div class="coc-edit-title">✏️ 编辑 ${name}</div>
                
                <!-- 基本信息 -->
                <div>
                    <div class="coc-edit-label">职业</div>
                    <input type="text" class="coc-edit-input coc-edit-occupation" value="${stats
