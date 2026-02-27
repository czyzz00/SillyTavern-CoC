// COC角色管理 - 精美风格版（修复血条）
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
            <span style="font-size: 20px; font-weight: 700; color: #e6d5b8;">🎲 COC 角色管理</span>
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
        
        // 计算HP最大值（COC规则： (CON+SIZ)/10 向下取整）
        function calculateMaxHP(stats) {
            if (stats.CON && stats.SIZ) {
                return Math.floor((stats.CON + stats.SIZ) / 10);
            }
            return stats.HP || 10;
        }
        
        // 计算SAN最大值（等于POW）
        function calculateMaxSAN(stats) {
            return stats.POW || 60;
        }
        
        // 精美风格的角色卡片
        function renderCharacterCard(name, stats) {
            // 确保stats对象存在
            stats = stats || {};
            
            // 计算HP
            const maxHP = calculateMaxHP(stats);
            const currentHP = stats.HP || maxHP;
            const hpPercent = Math.min(100, Math.max(0, (currentHP / maxHP) * 100));
            
            // 计算SAN
            const maxSAN = calculateMaxSAN(stats);
            const currentSAN = stats.SAN || maxSAN;
            const sanPercent = Math.min(100, Math.max(0, (currentSAN / maxSAN) * 100));
            
            // 技能列表
            const skills = stats.skills || {};
            const skillEntries = Object.entries(skills).slice(0, 6);
            while (skillEntries.length < 6) {
                skillEntries.push(['——', '—']);
            }
            
            // 武器列表
            const weapons = stats.weapons || [
                { name: '——', skill: '—', damage: '—' },
                { name: '——', skill: '—', damage: '—' }
            ];
            
            return `
                <div class="character-card" style="background: #2c241e; border-radius: 28px; padding: 20px; border: 1px solid #6d5b4a;">
                    <!-- 状态头部 -->
                    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #7e6b55;">
                        <div style="font-size: 52px; background: #3f352c; border-radius: 50%; width: 68px; height: 68px; display: flex; align-items: center; justify-content: center; border: 2px solid #7e6b55;">
                            🦌
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: #e6d5b8;">${name}</div>
                            <div style="font-size: 14px; color: #b8a68f;">调查员 · HP ${currentHP}/${maxHP} · SAN ${currentSAN}/${maxSAN}</div>
                        </div>
                    </div>
                    
                    <!-- 属性网格 -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px;">
                        ${['STR', 'CON', 'SIZ', 'DEX', 'INT', 'APP', 'POW', 'EDU'].map(attr => `
                            <div style="background: #3f352c; border-radius: 16px; padding: 12px 6px; text-align: center; border: 1px solid #4e4236;">
                                <div style="font-size: 11px; color: #b8a68f; margin-bottom: 4px;">${attr}</div>
                                <div style="font-size: 20px; font-weight: 700; color: #f0e6d8;">${stats[attr] || '—'}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- HP条 -->
                    <div style="margin-bottom: 14px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #d4c3aa;">
                            <span>❤️ 生命值</span>
                            <span>${currentHP} / ${maxHP}</span>
                        </div>
                        <div style="background: #4a3e33; height: 18px; border-radius: 30px; overflow: hidden;">
                            <div style="height: 100%; border-radius: 30px; background: #c88a5a; width: ${hpPercent}%;"></div>
                        </div>
                    </div>
                    
                    <!-- SAN条 -->
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #d4c3aa;">
                            <span>🧠 理智值</span>
                            <span>${currentSAN} / ${maxSAN}</span>
                        </div>
                        <div style="background: #4a3e33; height: 18px; border-radius: 30px; overflow: hidden;">
                            <div style="height: 100%; border-radius: 30px; background: #7ba6b8; width: ${sanPercent}%;"></div>
                        </div>
                    </div>
                    
                    <!-- 关键技能 -->
                    <div style="font-size: 16px; font-weight: 600; color: #e6d5b8; margin: 20px 0 12px 0;">🔍 关键技能</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                        ${skillEntries.map(([skill, value]) => `
                            <div style="display: flex; justify-content: space-between; background: #3f352c; padding: 10px 14px; border-radius: 12px; font-size: 14px; border: 1px solid #4e4236;">
                                <span style="color: #d4c3aa;">${skill}</span>
                                <span style="font-weight: 600; color: #f0e6d8;">${value}%</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- 武器列表 -->
                    <div style="background: #332b23; border-radius: 16px; padding: 14px; border: 1px solid #4e4236; margin-bottom: 16px;">
                        ${weapons.slice(0, 2).map(w => `
                            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #4e4236;">
                                <span style="color: #b8a68f;">${w.name}</span>
                                <span style="color: #f0e6d8;">${w.skill}% · ${w.damage}</span>
                            </div>
                        `).join('').replace(/,/g, '')}
                    </div>
                    
                    <!-- 编辑按钮 -->
                    <div style="margin-top: 8px;">
                        <button id="coc-edit-mode-btn" style="width:100%; padding:12px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; font-size:14px; font-weight:600; cursor:pointer;">✏️ 编辑角色</button>
                    </div>
                </div>
            `;
        }
        
        // 渲染编辑表格
        function renderEditTable(name, stats) {
            return `
                <div style="background: #332b23; border-radius: 16px; padding: 16px; border: 1px solid #4e4236;">
                    <div style="font-size: 18px; font-weight: 600; color: #e6d5b8; margin-bottom: 16px;">✏️ 编辑 ${name}</div>
                    
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">基础属性</div>
                        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
                            ${['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'HP', 'SAN'].map(attr => `
                                <div>
                                    <div style="font-size: 10px; color: #8e7c68;">${attr}</div>
                                    <input type="number" class="coc-edit-input" data-attr="${attr}" value="${stats[attr] || 50}" 
                                           style="width:100%; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #b8a68f; margin-bottom: 8px;">技能</div>
                        <div id="coc-skills-edit" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-height: 150px; overflow-y: auto; padding-right: 4px;">
                            ${Object.entries(stats.skills || {}).map(([skill, value]) => `
                                <div style="display: flex; gap: 4px;">
                                    <input type="text" class="coc-edit-skill-name" value="${skill}" 
                                           style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                    <input type="number" class="coc-edit-skill-value" value="${value}" 
                                           style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                                </div>
                            `).join('')}
                        </div>
                        <button id="coc-add-skill" style="width:100%; margin-top:8px; padding:8px; background:#7e6b55; color:#f0e6d8; border:none; border-radius:30px; cursor:pointer;">+ 添加技能</button>
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
                    <button class="coc-example" data-example='{"STR":70,"DEX":50,"CON":60,"SIZ":60,"INT":70,"APP":50,"POW":60,"EDU":60,"HP":12,"SAN":60,"skills":{"侦查":80,"聆听":70,"图书馆使用":60,"说服":50,"潜行":40}}' style="padding: 6px 12px; background: #7e6b55; color: #f0e6d8; border: none; border-radius: 30px; font-size: 12px; cursor:pointer;">李昂</button>
                    <button class="coc-example" data-example='{"STR":60,"DEX":70,"CON":50,"SIZ":50,"INT":80,"APP":70,"POW":70,"EDU":70,"HP":10,"SAN":70,"skills":{"侦查":90,"潜行":60,"说服":70,"聆听":80,"图书馆使用":80}}' style="padding: 6px 12px; background: #7e6b55; color: #f0e6d8; border: none; border-radius: 30px; font-size: 12px; cursor:pointer;">张薇</button>
                </div>
            `;
            
            bindViewEvents();
        }
        
        // 从编辑表格收集数据
        function collectEditData() {
            const stats = {};
            
            document.querySelectorAll('.coc-edit-input').forEach(input => {
                const attr = input.dataset.attr;
                stats[attr] = parseInt(input.value) || 50;
            });
            
            const skills = {};
            document.querySelectorAll('.coc-edit-skill-name').forEach((input, index) => {
                const skillName = input.value.trim();
                const skillValue = document.querySelectorAll('.coc-edit-skill-value')[index]?.value;
                if (skillName && skillValue) {
                    skills[skillName] = parseInt(skillValue) || 50;
                }
            });
            
            if (Object.keys(skills).length > 0) {
                stats.skills = skills;
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
                    
                    // 添加技能按钮
                    document.getElementById('coc-add-skill').onclick = () => {
                        const skillsDiv = document.getElementById('coc-skills-edit');
                        const newRow = document.createElement('div');
                        newRow.style.cssText = 'display: flex; gap: 4px; margin-top: 4px;';
                        newRow.innerHTML = `
                            <input type="text" class="coc-edit-skill-name" placeholder="新技能" style="flex:2; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                            <input type="number" class="coc-edit-skill-value" value="50" style="flex:1; padding:6px; border-radius:8px; border:1px solid #4e4236; background:#3f352c; color:#f0e6d8;">
                        `;
                        skillsDiv.appendChild(newRow);
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
        alert('✅ COC角色管理已加载');
    }
    
    waitForBody();
})();
