// COC角色管理 - 完整COC7角色卡版
(function() {
    alert('🔵 COC扩展启动');
    
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
        const MODULE_NAME = 'coc-character-manager';
        
        if (!context.extensionSettings[MODULE_NAME]) {
            context.extensionSettings[MODULE_NAME] = { characters: {} };
        }
        
        function saveSettings() {
            context.saveSettingsDebounced();
        }
        
        function getAllCharacters() {
            return context.extensionSettings[MODULE_NAME].characters || {};
        }
        
        function getCharacter(name) {
            return getAllCharacters()[name] || null;
        }
        
        function setCharacter(name, stats) {
            const settings = context.extensionSettings[MODULE_NAME];
            if (!settings.characters) settings.characters = {};
            settings.characters[name] = { 
                stats: stats,
                updatedAt: new Date().toISOString()
            };
            saveSettings();
            return true;
        }
        
        function deleteCharacter(name) {
            const settings = context.extensionSettings[MODULE_NAME];
            if (settings.characters?.[name]) {
                delete settings.characters[name];
                saveSettings();
                return true;
            }
            return false;
        }
        
        function sendSystemMessage(text) {
            try {
                context.sendMessage(text, 'system');
            } catch (e) {
                console.error('[COC] 发送消息失败:', e);
            }
        }
        
        buildDraggableUI(context, {
            getAllCharacters,
            getCharacter,
            setCharacter,
            deleteCharacter,
            sendSystemMessage
        });
    }
    
    function buildDraggableUI(context, api) {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        const topBar = document.querySelector('[class*="header"]') || 
                      document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        const safeTop = topBarHeight + 5;
        const safeBottom = winHeight - 60;
        
        // ==================== 可拖动悬浮球 ====================
        const floatingBall = document.createElement('div');
        floatingBall.id = 'coc-floating-ball';
        floatingBall.textContent = '🎲';
        floatingBall.style.cssText = `
            position: fixed;
            top: ${safeTop + 20}px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: #c88a5a;
            color: white;
            font-size: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999998;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
            border: 1px solid #7e6b55;
        `;
        
        document.body.appendChild(floatingBall);
        
        // 拖动功能
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        function getCurrentPosition() {
            const rect = floatingBall.getBoundingClientRect();
            return { left: rect.left, top: rect.top };
        }
        
        function onTouchStart(e) {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            const pos = getCurrentPosition();
            startLeft = pos.left;
            startTop = pos.top;
            
            floatingBall.style.transform = 'none';
            floatingBall.style.top = startTop + 'px';
            floatingBall.style.left = startLeft + 'px';
            floatingBall.style.right = 'auto';
            
            isDragging = false;
        }
        
        function onTouchMove(e) {
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
        }
        
        function onTouchEnd(e) {
            e.preventDefault();
            
            if (!isDragging) {
                togglePanel();
            }
            
            startX = startY = undefined;
            isDragging = false;
        }
        
        floatingBall.addEventListener('touchstart', onTouchStart, { passive: false });
        floatingBall.addEventListener('touchmove', onTouchMove, { passive: false });
        floatingBall.addEventListener('touchend', onTouchEnd);
        floatingBall.addEventListener('touchcancel', onTouchEnd);
        
        // ==================== 主面板 ====================
        const panel = document.createElement('div');
        panel.id = 'coc-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${safeTop}px;
            left: 10px;
            width: ${winWidth - 20}px;
            height: 560px;
            background: #2c241e;
            border: 1px solid #6d5b4a;
            border-radius: 28px;
            z-index: 9999999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 12px 32px rgba(0,0,0,0.7);
            color: #f0e6d8;
        `;
        
        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: #2c241e;
            border-bottom: 2px solid #7e6b55;
            flex-shrink: 0;
        `;
        header.innerHTML = `
            <span style="font-size: 20px; font-weight: 700; color: #e6d5b8;">🎲 COC7 角色卡</span>
            <button id="coc-close-panel" style="
                background: none;
                border: none;
                color: #b8a68f;
                font-size: 24px;
                cursor: pointer;
                padding: 8px 12px;
                margin: -8px -12px;
                z-index: 10000000;
                pointer-events: auto;
            ">✖</button>
        `;
        
        // 内容区
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #2c241e;
        `;
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // 关闭按钮事件
        document.getElementById('coc-close-panel').onclick = (e) => {
            e.stopPropagation();
            panel.style.display = 'none';
        };
        
        // ==================== 核心功能 ====================
        let isEditing = false;
        let currentEditName = '';
        let currentEditStats = null;
        
        function togglePanel() {
            if (panel.style.display === 'none') {
                panel.style.display = 'flex';
                renderViewMode();
            } else {
                panel.style.display = 'none';
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
        
        // 计算护甲
        function calculateArmor(stats) {
            return stats.armor || 0;
        }
        
        // 精美风格的角色卡片（COC7完整版）
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
            const armor = calculateArmor(stats);
            
            // 基本信息
            const occupation = stats.occupation || '调查员';
            const age = stats.age || '—';
            const birthplace = stats.birthplace || '—';
            const residence = stats.residence || '—';
            
            // 调查员技能（职业和兴趣分开）
            const occupationalSkills = stats.occupationalSkills || {};
            const interestSkills = stats.interestSkills || {};
            
            // 格斗技能
            const fightingSkills = stats.fightingSkills || {};
            
            // 背景故事
            const backstory = stats.backstory || '——';
            
            // 装备和物品
            const possessions = stats.possessions || [];
            
            // 资产
            const assets = stats.assets || {
                spendingLevel: '—',
                cash: '—',
                assets: '—'
            };
            
            // 与其他同伴关系
            const relationships = stats.relationships || [];
            
            return `
                <div class="character-card" style="background: #2c241e; border-radius: 28px; padding: 20px; border: 1px solid #6d5b4a;">
                    <!-- 基本信息 -->
                    <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #7e6b55;">
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
                            <div style="font-size: 52px; background: #3f352c; border-radius: 50%; width: 68px; height: 68px; display: flex; align-items: center; justify-content: center; border: 2px solid #7e6b55;">
                                🦌
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: 700; color: #e6d5b8;">${name}</div>
                                <div style="font-size: 14px; color: #b8a68f;">${occupation} · ${age}岁</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                            <div><span style="color: #b8a68f;">出生地：</span> ${birthplace}</div>
                            <div><span style="color: #b8a68f;">居住地：</span> ${residence}</div>
                        </div>
                    </div>
                    
                    <!-- 属性 HP SAN 状态条 -->
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <div style="flex: 1; background: #3f352c; padding: 12px; border-radius: 16px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                                <span>❤️ HP</span>
                                <span>${currentHP}/${maxHP}</span>
                            </div>
                            <div style="background: #4a3e33; height: 10px; border-radius: 30px; overflow: hidden;">
                                <div style="height: 100%; border-radius: 30px; background: #c88a5a; width: ${hpPercent}%;"></div>
                            </div>
                        </div>
                        <div style="flex: 1; background: #3f352c; padding: 12px; border-radius: 16px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                                <span>🧠 SAN</span>
                                <span>${currentSAN}/${maxSAN}</span>
                            </div>
                            <div style="background: #4a3e33; height: 10px; border-radius: 30px; overflow: hidden;">
                                <div style="height: 100%; border-radius: 30px; background: #7ba6b8; width: ${sanPercent}%;"></div>
                            </div>
                        </div>
                        <div style="flex: 1; background: #3f352c; padding: 12px; border-radius: 16px; text-align: center;">
                            <div style="font-size: 11px; color: #b8a68f;">MOV</div>
                            <div style="font-size: 16px; font-weight: 700;">${move}</div>
                        </div>
                    </div>
                    
                    <!-- 属性网格 -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">📊 属性</div>
                        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
                            ${['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU', 'LUCK'].map(attr => `
                                <div style="background: #3f352c; border-radius: 12px; padding: 8px 4px; text-align: center; border: 1px solid #4e4236;">
                                    <div style="font-size: 10px; color: #b8a68f;">${attr}</div>
                                    <div style="font-size: 16px; font-weight: 700; color: #f0e6d8;">${stats[attr] || '—'}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <div style="flex: 1; background: #3f352c; border-radius: 12px; padding: 8px; text-align: center;">
                                <span style="color: #b8a68f;">体格 ${build} · 伤害加值 ${db} · 护甲 ${armor}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 调查员技能（职业和兴趣） -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">🔍 职业技能</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px;">
                            ${Object.entries(occupationalSkills).slice(0, 6).map(([skill, value]) => `
                                <div style="background: #3f352c; padding: 6px 8px; border-radius: 8px; display: flex; justify-content: space-between;">
                                    <span style="font-size: 12px; color: #d4c3aa;">${skill}</span>
                                    <span style="font-size: 12px; font-weight: 600; color: #c88a5a;">${value}%</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">✨ 兴趣技能</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                            ${Object.entries(interestSkills).slice(0, 6).map(([skill, value]) => `
                                <div style="background: #3f352c; padding: 6px 8px; border-radius: 8px; display: flex; justify-content: space-between;">
                                    <span style="font-size: 12px; color: #d4c3aa;">${skill}</span>
                                    <span style="font-size: 12px; font-weight: 600; color: #7ba6b8;">${value}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- 格斗技能 -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">⚔️ 格斗技能</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                            ${Object.entries(fightingSkills).map(([skill, value]) => `
                                <div style="background: #332b23; padding: 6px 8px; border-radius: 8px; border: 1px solid #4e4236; display: flex; justify-content: space-between;">
                                    <span style="font-size: 12px; color: #b8a68f;">${skill}</span>
                                    <span style="font-size: 12px; font-weight: 600; color: #b85a5a;">${value}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- 背景故事 -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">📜 背景故事</div>
                        <div style="background: #332b23; padding: 12px; border-radius: 12px; border: 1px solid #4e4236; font-size: 13px; color: #d4c3aa;">
                            ${backstory}
                        </div>
                    </div>
                    
                    <!-- 装备和物品 -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">🎒 装备和物品</div>
                        <div style="background: #332b23; padding: 12px; border-radius: 12px; border: 1px solid #4e4236;">
                            ${possessions.length > 0 ? possessions.map(item => `
                                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #4e4236;">
                                    <span style="color: #d4c3aa;">${item.name}</span>
                                    <span style="color: #b8a68f;">${item.quantity || 1}x</span>
                                </div>
                            `).join('') : '<div style="color: #8e7c68; text-align: center;">无</div>'}
                        </div>
                    </div>
                    
                    <!-- 资产 -->
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">💰 资产</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            <div style="background: #332b23; padding: 8px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 11px; color: #b8a68f;">消费水平</div>
                                <div style="font-size: 14px; font-weight: 600;">${assets.spendingLevel}</div>
                            </div>
                            <div style="background: #332b23; padding: 8px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 11px; color: #b8a68f;">现金</div>
                                <div style="font-size: 14px; font-weight: 600;">${assets.cash}</div>
                            </div>
                            <div style="background: #332b23; padding: 8px; border-radius: 12px; text-align: center;">
                                <div style="font-size: 11px; color: #b8a68f;">资产</div>
                                <div style="font-size: 14px; font-weight: 600;">${assets.assets}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 与其他同伴关系 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; font-weight: 600; color: #e6d5b8; margin-bottom: 8px;">🤝 同伴关系</div>
                        <div style="background: #332b23; padding: 12px; border-radius: 12px; border: 1px solid #4e4236;">
                            ${relationships.length > 0 ? relationships.map(rel => `
                                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #4e4236;">
                                    <span style="color: #d4c3aa;">${rel.name}</span>
                                    <span style="color: #b8a68f;">${rel.relationship}</span>
                                </div>
                            `).join('') : '<div style="color: #8e7c68; text-align: center;">无</div>'}
                        </div>
                    </div>
                    
                    <!-- 编辑按钮 -->
                    <div style="margin-top: 8px;">
                        <button id="coc-edit-mode-btn" style="width:100%; padding:12px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; font-size:14px; font-weight:600; cursor:pointer;">✏️ 编辑角色</button>
                    </div>
                </div>
            `;
        }
        
        // 渲染编辑表格（COC7完整版）
        function renderEditTable(name, stats) {
            return `
                <div style="background: #332b23; border-radius: 16px; padding: 16px; border: 1px solid #4e4236;">
                    <div style="font-size: 18px; font-weight: 600; color: #e6d5b8; margin-bottom: 16px;">✏️ 编辑 ${name}</div>
                    
                    <!-- 基本信息编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">基本信息</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            <input type="text" class="coc-edit-occupation" placeholder="职业" value="${stats.occupation || '调查员'}" style="padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="number" class="coc-edit-age" placeholder="年龄" value="${stats.age || 30}" style="padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="text" class="coc-edit-birthplace" placeholder="出生地" value="${stats.birthplace || ''}" style="padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="text" class="coc-edit-residence" placeholder="居住地" value="${stats.residence || ''}" style="padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        </div>
                    </div>
                    
                    <!-- 属性编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">属性</div>
                        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
                            ${['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'LUCK', 'HP', 'SAN'].map(attr => `
                                <div>
                                    <div style="font-size: 10px; color: #8e7c68;">${attr}</div>
                                    <input type="number" class="coc-edit-input" data-attr="${attr}" value="${stats[attr] || 50}" 
                                           style="width:100%; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- 职业技能编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">职业技能</div>
                        <div id="coc-occupational-skills-edit" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-height: 120px; overflow-y: auto; padding-right: 4px;">
                            ${Object.entries(stats.occupationalSkills || {}).map(([skill, value]) => `
                                <div style="display: flex; gap: 4px;">
                                    <input type="text" class="coc-edit-occupational-skill-name" value="${skill}" 
                                           style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                    <input type="number" class="coc-edit-occupational-skill-value" value="${value}" 
                                           style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                        <button id="coc-add-occupational-skill" style="width:100%; margin-top:8px; padding:8px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; cursor:pointer;">+ 添加职业技能</button>
                    </div>
                    
                    <!-- 兴趣技能编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">兴趣技能</div>
                        <div id="coc-interest-skills-edit" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-height: 120px; overflow-y: auto; padding-right: 4px;">
                            ${Object.entries(stats.interestSkills || {}).map(([skill, value]) => `
                                <div style="display: flex; gap: 4px;">
                                    <input type="text" class="coc-edit-interest-skill-name" value="${skill}" 
                                           style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                    <input type="number" class="coc-edit-interest-skill-value" value="${value}" 
                                           style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                        <button id="coc-add-interest-skill" style="width:100%; margin-top:8px; padding:8px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; cursor:pointer;">+ 添加兴趣技能</button>
                    </div>
                    
                    <!-- 格斗技能编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">格斗技能</div>
                        <div id="coc-fighting-skills-edit" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            ${Object.entries(stats.fightingSkills || {}).map(([skill, value]) => `
                                <div style="display: flex; gap: 4px;">
                                    <input type="text" class="coc-edit-fighting-skill-name" value="${skill}" 
                                           style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                    <input type="number" class="coc-edit-fighting-skill-value" value="${value}" 
                                           style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                        <button id="coc-add-fighting-skill" style="width:100%; margin-top:8px; padding:8px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; cursor:pointer;">+ 添加格斗技能</button>
                    </div>
                    
                    <!-- 背景故事编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">背景故事</div>
                        <textarea id="coc-edit-backstory" rows="3" style="width:100%; padding:8px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">${stats.backstory || ''}</textarea>
                    </div>
                    
                    <!-- 装备物品编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">装备物品</div>
                        <div id="coc-possessions-edit">
                            ${(stats.possessions || []).map((item, index) => `
                                <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                                    <input type="text" class="coc-edit-possession-name" value="${item.name}" placeholder="物品名" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                    <input type="number" class="coc-edit-possession-quantity" value="${item.quantity || 1}" placeholder="数量" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                        <button id="coc-add-possession" style="width:100%; margin-top:8px; padding:8px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; cursor:pointer;">+ 添加物品</button>
                    </div>
                    
                    <!-- 资产编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">资产</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            <input type="text" class="coc-edit-spending" placeholder="消费水平" value="${stats.assets?.spendingLevel || ''}" style="padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="text" class="coc-edit-cash" placeholder="现金" value="${stats.assets?.cash || ''}" style="padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="text" class="coc-edit-assets" placeholder="资产" value="${stats.assets?.assets || ''}" style="padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        </div>
                    </div>
                    
                    <!-- 同伴关系编辑 -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">同伴关系</div>
                        <div id="coc-relationships-edit">
                            ${(stats.relationships || []).map((rel, index) => `
                                <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                                    <input type="text" class="coc-edit-relationship-name" value="${rel.name}" placeholder="姓名" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                    <input type="text" class="coc-edit-relationship-desc" value="${rel.relationship}" placeholder="关系" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                        <button id="coc-add-relationship" style="width:100%; margin-top:8px; padding:8px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; cursor:pointer;">+ 添加关系</button>
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                        <button id="coc-save-edit" style="flex:1; padding:12px; background:#c88a5a; color:white; border:none; border-radius:30px; cursor:pointer;">💾 保存</button>
                        <button id="coc-cancel-edit" style="flex:1; padding:12px; background:#4e4236; color:#b8a68f; border:none; border-radius:30px; cursor:pointer;">✖ 取消</button>
                    </div>
                </div>
            `;
        }
        
        // 渲染查看模式
        function renderViewMode() {
            const characters = api.getAllCharacters();
            const names = Object.keys(characters).sort();
            
            let optionsHtml = '<option value="">选择角色</option>';
            names.forEach(name => {
                optionsHtml += `<option value="${name}">${name}</option>`;
            });
            
            content.innerHTML = `
                <!-- 顶部工具栏 -->
                <div style="display: flex; gap: 6px; margin-bottom: 16px; background: #332b23; padding: 12px; border-radius: 16px; border: 1px solid #4e4236;">
                    <select id="coc-role-select" style="flex: 2; padding: 10px; border-radius: 30px; font-size: 14px; background: #3f352c; color: #f0e6d8; border: 1px solid #4e4236;">
                        ${optionsHtml}
                    </select>
                    <button id="coc-import-btn" style="flex: 1; padding: 10px; background: #7ba6b8; color: white; border: none; border-radius: 30px; font-size: 14px; cursor:pointer;">📥</button>
                    <button id="coc-export-btn" style="flex: 1; padding: 10px; background: #7e6b55; color: white; border: none; border-radius: 30px; font-size: 14px; cursor:pointer;">📤</button>
                    <button id="coc-delete-btn" style="flex: 1; padding: 10px; background: #b85a5a; color: white; border: none; border-radius: 30px; font-size: 14px; cursor:pointer;">🗑️</button>
                </div>
                
                <!-- 角色卡片区 -->
                <div id="coc-stats-display" style="margin-bottom: 16px;">
                    <div style="background: #332b23; border-radius: 28px; padding: 30px; text-align: center; color: #8e7c68; border: 1px solid #4e4236;">
                        👆 请选择角色
                    </div>
                </div>
                
                <!-- 编辑区（默认隐藏） -->
                <div id="coc-edit-section" style="display: none;"></div>
                
                <!-- 示例按钮 -->
                <div style="margin-top: 8px; display: flex; gap: 4px; justify-content: flex-end;">
                    <button class="coc-example" data-example='{"occupation":"记者","age":28,"birthplace":"伦敦","residence":"伦敦","STR":70,"DEX":50,"CON":60,"SIZ":60,"INT":70,"APP":50,"POW":60,"EDU":60,"HP":12,"SAN":60,"LUCK":50,"occupationalSkills":{"侦查":80,"聆听":70,"图书馆使用":60,"说服":50,"潜行":40},"interestSkills":{"摄影":70,"历史":60,"外语":50},"fightingSkills":{"格斗(斗殴)":60,"射击":50},"backstory":"曾是战地记者，见过太多超自然事件","possessions":[{"name":"相机","quantity":1},{"name":"笔记本","quantity":1}],"assets":{"spendingLevel":"$50","cash":"$500","assets":"$5000"},"relationships":[{"name":"张薇","relationship":"搭档"}]}' style="padding: 6px 12px; background: #7e6b55; color: #f0e6d8; border: none; border-radius: 30px; font-size: 12px; cursor:pointer;">李昂</button>
                </div>
            `;
            
            bindViewEvents();
        }
        
        // 从编辑表格收集数据
        function collectEditData() {
            const stats = {};
            
            // 基本信息
            stats.occupation = document.querySelector('.coc-edit-occupation')?.value || '调查员';
            stats.age = parseInt(document.querySelector('.coc-edit-age')?.value) || 30;
            stats.birthplace = document.querySelector('.coc-edit-birthplace')?.value || '';
            stats.residence = document.querySelector('.coc-edit-residence')?.value || '';
            
            // 属性
            document.querySelectorAll('.coc-edit-input').forEach(input => {
                const attr = input.dataset.attr;
                stats[attr] = parseInt(input.value) || 50;
            });
            
            // 职业技能
            const occupationalSkills = {};
            document.querySelectorAll('.coc-edit-occupational-skill-name').forEach((input, index) => {
                const skillName = input.value.trim();
                const skillValue = document.querySelectorAll('.coc-edit-occupational-skill-value')[index]?.value;
                if (skillName && skillValue) {
                    occupationalSkills[skillName] = parseInt(skillValue) || 50;
                }
            });
            if (Object.keys(occupationalSkills).length > 0) {
                stats.occupationalSkills = occupationalSkills;
            }
            
            // 兴趣技能
            const interestSkills = {};
            document.querySelectorAll('.coc-edit-interest-skill-name').forEach((input, index) => {
                const skillName = input.value.trim();
                const skillValue = document.querySelectorAll('.coc-edit-interest-skill-value')[index]?.value;
                if (skillName && skillValue) {
                    interestSkills[skillName] = parseInt(skillValue) || 50;
                }
            });
            if (Object.keys(interestSkills).length > 0) {
                stats.interestSkills = interestSkills;
            }
            
            // 格斗技能
            const fightingSkills = {};
            document.querySelectorAll('.coc-edit-fighting-skill-name').forEach((input, index) => {
                const skillName = input.value.trim();
                const skillValue = document.querySelectorAll('.coc-edit-fighting-skill-value')[index]?.value;
                if (skillName && skillValue) {
                    fightingSkills[skillName] = parseInt(skillValue) || 50;
                }
            });
            if (Object.keys(fightingSkills).length > 0) {
                stats.fightingSkills = fightingSkills;
            }
            
            // 背景故事
            stats.backstory = document.getElementById('coc-edit-backstory')?.value || '';
            
            // 装备物品
            const possessions = [];
            document.querySelectorAll('.coc-edit-possession-name').forEach((input, index) => {
                const name = input.value.trim();
                const quantity = document.querySelectorAll('.coc-edit-possession-quantity')[index]?.value;
                if (name) {
                    possessions.push({
                        name: name,
                        quantity: parseInt(quantity) || 1
                    });
                }
            });
            if (possessions.length > 0) {
                stats.possessions = possessions;
            }
            
            // 资产
            stats.assets = {
                spendingLevel: document.querySelector('.coc-edit-spending')?.value || '',
                cash: document.querySelector('.coc-edit-cash')?.value || '',
                assets: document.querySelector('.coc-edit-assets')?.value || ''
            };
            
            // 同伴关系
            const relationships = [];
            document.querySelectorAll('.coc-edit-relationship-name').forEach((input, index) => {
                const name = input.value.trim();
                const rel = document.querySelectorAll('.coc-edit-relationship-desc')[index]?.value;
                if (name && rel) {
                    relationships.push({
                        name: name,
                        relationship: rel
                    });
                }
            });
            if (relationships.length > 0) {
                stats.relationships = relationships;
            }
            
            return stats;
        }
        
        // 导入文件（保持不变）
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
                        api.sendSystemMessage(`✅ 已导入: ${name}`);
                        
                        setTimeout(() => {
                            const select = document.getElementById('coc-role-select');
                            if (select) {
                                select.value = name;
                                select.dispatchEvent(new Event('change'));
                            }
                        }, 100);
                        
                    } catch (error) {
                        api.sendSystemMessage(`❌ 导入失败: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        }
        
        // 绑定查看模式事件
        function bindViewEvents() {
            const select = document.getElementById('coc-role-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    const name = e.target.value;
                    if (!name) {
                        document.getElementById('coc-stats-display').innerHTML = '<div style="background: #332b23; border-radius: 28px; padding: 30px; text-align: center; color: #8e7c68;">👆 请选择角色</div>';
                        return;
                    }
                    
                    const char = api.getCharacter(name);
                    if (char) {
                        document.getElementById('coc-stats-display').innerHTML = renderCharacterCard(name, char.stats);
                        bindStatsEvents(name, char.stats);
                    }
                });
            }
            
            document.getElementById('coc-import-btn').onclick = importFromFile;
            
            document.getElementById('coc-export-btn').onclick = () => {
                const select = document.getElementById('coc-role-select');
                const name = select.value;
                if (!name) {
                    api.sendSystemMessage('❌ 请先选择角色');
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
                
                api.sendSystemMessage(`✅ ${name} 已导出`);
            };
            
            document.getElementById('coc-delete-btn').onclick = () => {
                const select = document.getElementById('coc-role-select');
                const name = select.value;
                
                if (!name) {
                    api.sendSystemMessage('❌ 请先选择角色');
                    return;
                }
                
                if (confirm(`确定删除 ${name} 吗？`)) {
                    api.deleteCharacter(name);
                    renderViewMode();
                    api.sendSystemMessage(`✅ ${name} 已删除`);
                }
            };
            
            document.querySelectorAll('.coc-example').forEach(btn => {
                btn.onclick = () => {
                    const name = btn.textContent.trim();
                    const stats = JSON.parse(btn.dataset.example);
                    api.setCharacter(name, stats);
                    renderViewMode();
                    api.sendSystemMessage(`✅ 已添加示例: ${name}`);
                    
                    setTimeout(() => {
                        const select = document.getElementById('coc-role-select');
                        select.value = name;
                        select.dispatchEvent(new Event('change'));
                    }, 100);
                };
            });
        }
        
        // 绑定角色卡片的事件
        function bindStatsEvents(name, stats) {
            const editBtn = document.getElementById('coc-edit-mode-btn');
            if (editBtn) {
                editBtn.onclick = () => {
                    isEditing = true;
                    currentEditName = name;
                    currentEditStats = JSON.parse(JSON.stringify(stats));
                    
                    document.getElementById('coc-stats-display').style.display = 'none';
                    const editSection = document.getElementById('coc-edit-section');
                    editSection.style.display = 'block';
                    editSection.innerHTML = renderEditTable(name, currentEditStats);
                    
                    // 添加职业技能按钮
                    document.getElementById('coc-add-occupational-skill').onclick = () => {
                        const skillsDiv = document.getElementById('coc-occupational-skills-edit');
                        const newRow = document.createElement('div');
                        newRow.style.cssText = 'display: flex; gap: 4px; margin-top: 4px;';
                        newRow.innerHTML = `
                            <input type="text" class="coc-edit-occupational-skill-name" placeholder="技能名" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="number" class="coc-edit-occupational-skill-value" value="50" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        `;
                        skillsDiv.appendChild(newRow);
                    };
                    
                    // 添加兴趣技能按钮
                    document.getElementById('coc-add-interest-skill').onclick = () => {
                        const skillsDiv = document.getElementById('coc-interest-skills-edit');
                        const newRow = document.createElement('div');
                        newRow.style.cssText = 'display: flex; gap: 4px; margin-top: 4px;';
                        newRow.innerHTML = `
                            <input type="text" class="coc-edit-interest-skill-name" placeholder="技能名" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="number" class="coc-edit-interest-skill-value" value="50" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        `;
                        skillsDiv.appendChild(newRow);
                    };
                    
                    // 添加格斗技能按钮
                    document.getElementById('coc-add-fighting-skill').onclick = () => {
                        const skillsDiv = document.getElementById('coc-fighting-skills-edit');
                        const newRow = document.createElement('div');
                        newRow.style.cssText = 'display: flex; gap: 4px; margin-top: 4px;';
                        newRow.innerHTML = `
                            <input type="text" class="coc-edit-fighting-skill-name" placeholder="技能名" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="number" class="coc-edit-fighting-skill-value" value="50" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        `;
                        skillsDiv.appendChild(newRow);
                    };
                    
                    // 添加物品按钮
                    document.getElementById('coc-add-possession').onclick = () => {
                        const possessionsDiv = document.getElementById('coc-possessions-edit');
                        const newRow = document.createElement('div');
                        newRow.style.cssText = 'display: flex; gap: 4px; margin-top: 4px;';
                        newRow.innerHTML = `
                            <input type="text" class="coc-edit-possession-name" placeholder="物品名" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="number" class="coc-edit-possession-quantity" value="1" placeholder="数量" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        `;
                        possessionsDiv.appendChild(newRow);
                    };
                    
                    // 添加关系按钮
                    document.getElementById('coc-add-relationship').onclick = () => {
                        const relDiv = document.getElementById('coc-relationships-edit');
                        const newRow = document.createElement('div');
                        newRow.style.cssText = 'display: flex; gap: 4px; margin-top: 4px;';
                        newRow.innerHTML = `
                            <input type="text" class="coc-edit-relationship-name" placeholder="姓名" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="text" class="coc-edit-relationship-desc" placeholder="关系" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        `;
                        relDiv.appendChild(newRow);
                    };
                    
                    // 保存编辑
                    document.getElementById('coc-save-edit').onclick = () => {
                        const newStats = collectEditData();
                        api.setCharacter(name, newStats);
                        
                        isEditing = false;
                        document.getElementById('coc-stats-display').style.display = 'block';
                        document.getElementById('coc-edit-section').style.display = 'none';
                        
                        document.getElementById('coc-stats-display').innerHTML = renderCharacterCard(name, newStats);
                        bindStatsEvents(name, newStats);
                        
                        api.sendSystemMessage(`✅ ${name} 已更新`);
                    };
                    
                    // 取消编辑
                    document.getElementById('coc-cancel-edit').onclick = () => {
                        isEditing = false;
                        document.getElementById('coc-stats-display').style.display = 'block';
                        document.getElementById('coc-edit-section').style.display = 'none';
                    };
                };
            }
        }
        
        renderViewMode();
        alert('✅ COC7角色卡已加载');
    }
    
    waitForBody();
})();
