// COC角色管理 - 修复版
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
            background: #4CAF50;
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
            height: 520px;
            background: var(--bg-color, #1a1a1a);
            border: 1px solid var(--border-color, #444);
            border-radius: 12px;
            z-index: 9999999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        `;
        
        // 标题栏 - 确保关闭按钮可点
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--bg-secondary, #333);
            border-bottom: 1px solid var(--border-color, #444);
            flex-shrink: 0;
        `;
        header.innerHTML = `
            <span style="font-size: 16px; font-weight: bold;">🎲 COC角色管理</span>
            <button id="coc-close-panel" style="
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 8px 12px;
                margin: -8px -12px;
                z-index: 10000000;
                pointer-events: auto;
            ">✖</button>
        `;
        
        // 内容区 - 可滚动
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 12px;
            overflow-y: auto;
            background: var(--bg-color, #1a1a1a);
        `;
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // 单独绑定关闭事件
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
        
        // 渲染查看模式
        function renderViewMode() {
            const characters = api.getAllCharacters();
            const names = Object.keys(characters).sort();
            
            let optionsHtml = '<option value="">选择角色</option>';
            names.forEach(name => {
                optionsHtml += `<option value="${name}">${name}</option>`;
            });
            
            content.innerHTML = `
                <!-- 第一块：顶部工具栏 -->
                <div style="display: flex; gap: 4px; margin-bottom: 12px; flex-shrink: 0;">
                    <select id="coc-role-select" style="flex: 2; padding: 8px; border-radius: 6px; font-size: 14px; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color);">
                        ${optionsHtml}
                    </select>
                    <button id="coc-import-btn" style="flex: 1; padding: 8px; background: #9C27B0; color: white; border: none; border-radius: 6px; font-size: 13px;">📥</button>
                    <button id="coc-export-btn" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 6px; font-size: 13px;">📤</button>
                    <button id="coc-delete-btn" style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 6px; font-size: 13px;">🗑️</button>
                </div>
                
                <!-- 第二块：角色信息面板（固定高度，可滚动） -->
                <div id="coc-stats-display" style="background: #2a2a2a; padding: 12px; border-radius: 8px; margin-bottom: 12px; max-height: 200px; overflow-y: auto;">
                    <div style="color: #888; text-align: center; padding: 30px;">👆 请选择角色</div>
                </div>
                
                <!-- 第三块：编辑区域（默认隐藏） -->
                <div id="coc-edit-section" style="display: none; max-height: 280px; overflow-y: auto;">
                    <div style="background: #2a2a2a; padding: 12px; border-radius: 8px;">
                        <div id="coc-edit-table"></div>
                        <div style="display: flex; gap: 8px; margin-top: 12px; position: sticky; bottom: 0; background: #2a2a2a; padding: 8px 0;">
                            <button id="coc-save-edit" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 6px;">💾 保存</button>
                            <button id="coc-cancel-edit" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 6px;">✖ 取消</button>
                        </div>
                    </div>
                </div>
                
                <!-- 示例按钮（小） -->
                <div style="margin-top: 8px; display: flex; gap: 4px; justify-content: flex-end; flex-shrink: 0;">
                    <button class="coc-example" data-example='{"STR":70,"DEX":50,"skills":{"侦查":80,"聆听":70}}' style="padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; font-size: 12px;">李昂</button>
                    <button class="coc-example" data-example='{"STR":60,"DEX":70,"skills":{"侦查":90,"潜行":60}}' style="padding: 4px 8px; background: #9C27B0; color: white; border: none; border-radius: 4px; font-size: 12px;">张薇</button>
                </div>
            `;
            
            bindViewEvents();
        }
        
        // 渲染编辑表格
        function renderEditTable(stats) {
            let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
            
            // 基础属性编辑
            html += '<div><div style="font-size: 12px; color: #888; margin-bottom: 4px;">基础属性</div>';
            html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;">';
            const baseAttrs = ['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'HP', 'SAN'];
            baseAttrs.forEach(attr => {
                const value = stats[attr] || 50;
                html += `
                    <div>
                        <div style="font-size: 10px; color: #888;">${attr}</div>
                        <input type="number" class="coc-edit-input" data-attr="${attr}" value="${value}" 
                               style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #444; background: #333; color: white;">
                    </div>
                `;
            });
            html += '</div></div>';
            
            // 技能编辑 - 用网格布局控制高度
            if (stats.skills) {
                html += '<div><div style="font-size: 12px; color: #888; margin-bottom: 4px;">技能</div>';
                html += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; max-height: 120px; overflow-y: auto; padding-right: 4px;">';
                
                Object.entries(stats.skills).forEach(([skill, value]) => {
                    html += `
                        <div style="display: flex; gap: 4px;">
                            <input type="text" class="coc-edit-skill-name" data-original="${skill}" value="${skill}" 
                                   style="flex: 2; padding: 4px; border-radius: 4px; border: 1px solid #444; background: #333; color: white;">
                            <input type="number" class="coc-edit-skill-value" data-skill="${skill}" value="${value}" 
                                   style="flex: 1; padding: 4px; border-radius: 4px; border: 1px solid #444; background: #333; color: white;">
                        </div>
                    `;
                });
                html += '</div>';
                
                // 添加新技能按钮
                html += `
                    <div style="margin-top: 8px;">
                        <button id="coc-add-skill" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px;">+ 添加技能</button>
                    </div>
                `;
                html += '</div>';
            }
            
            html += '</div>';
            return html;
        }
        
        // 从编辑表格收集数据
        function collectEditData() {
            const stats = {};
            
            // 收集基础属性
            document.querySelectorAll('.coc-edit-input').forEach(input => {
                const attr = input.dataset.attr;
                stats[attr] = parseInt(input.value) || 50;
            });
            
            // 收集技能
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
        
        // 格式化显示（可视化）
        function formatStats(stats) {
            let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
            
            // 基础属性
            const baseAttrs = ['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'HP', 'SAN'];
            html += '<div><div style="font-size:12px; color:#888; margin-bottom:4px;">基础属性</div>';
            html += '<div style="display:grid; grid-template-columns:repeat(5,1fr); gap:4px;">';
            baseAttrs.forEach(attr => {
                const value = stats[attr] || '—';
                html += `
                    <div style="text-align:center;">
                        <div style="font-size:10px; color:#888;">${attr}</div>
                        <div style="font-size:16px; font-weight:bold; color:#4CAF50;">${value}</div>
                    </div>
                `;
            });
            html += '</div></div>';
            
            // 技能
            if (stats.skills) {
                html += '<div><div style="font-size:12px; color:#888; margin-bottom:4px;">技能</div>';
                html += '<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:4px; max-height: 100px; overflow-y: auto;">';
                
                Object.entries(stats.skills).forEach(([skill, value]) => {
                    html += `
                        <div style="display:flex; justify-content:space-between; padding:6px 8px; background:#333; border-radius:4px;">
                            <span>${skill}</span>
                            <span style="color:#4CAF50; font-weight:bold;">${value}</span>
                        </div>
                    `;
                });
                html += '</div></div>';
            }
            
            // 编辑按钮
            html += `
                <div style="margin-top:8px;">
                    <button id="coc-edit-mode-btn" style="width:100%; padding:8px; background:#2196F3; color:white; border:none; border-radius:6px;">✏️ 编辑角色</button>
                </div>
            `;
            
            html += '</div>';
            return html;
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
            // 角色选择
            const select = document.getElementById('coc-role-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    const name = e.target.value;
                    if (!name) {
                        document.getElementById('coc-stats-display').innerHTML = '<div style="color:#888; text-align:center; padding:30px;">👆 请选择角色</div>';
                        return;
                    }
                    
                    const char = api.getCharacter(name);
                    if (char) {
                        document.getElementById('coc-stats-display').innerHTML = formatStats(char.stats);
                        bindStatsEvents(name, char.stats);
                    }
                });
            }
            
            // 导入
            document.getElementById('coc-import-btn').onclick = importFromFile;
            
            // 导出
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
            
            // 删除
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
            
            // 示例按钮
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
        
        // 绑定角色信息面板的事件（编辑按钮）
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
                    
                    document.getElementById('coc-edit-table').innerHTML = renderEditTable(currentEditStats);
                    
                    // 添加技能按钮
                    document.getElementById('coc-add-skill')?.addEventListener('click', () => {
                        const skillsContainer = document.querySelector('#coc-edit-table > div > div:nth-child(2) > div');
                        if (skillsContainer) {
                            const newSkillRow = document.createElement('div');
                            newSkillRow.style.cssText = 'display: flex; gap: 4px; margin-top: 4px;';
                            newSkillRow.innerHTML = `
                                <input type="text" class="coc-edit-skill-name" placeholder="新技能" style="flex:2; padding:4px; border-radius:4px; border:1px solid #444; background:#333; color:white;">
                                <input type="number" class="coc-edit-skill-value" value="50" style="flex:1; padding:4px; border-radius:4px; border:1px solid #444; background:#333; color:white;">
                            `;
                            skillsContainer.appendChild(newSkillRow);
                        }
                    });
                    
                    // 保存编辑
                    document.getElementById('coc-save-edit').onclick = () => {
                        const newStats = collectEditData();
                        api.setCharacter(name, newStats);
                        
                        isEditing = false;
                        document.getElementById('coc-stats-display').style.display = 'block';
                        document.getElementById('coc-edit-section').style.display = 'none';
                        
                        document.getElementById('coc-stats-display').innerHTML = formatStats(newStats);
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
        
        // 初始渲染
        renderViewMode();
        alert('✅ COC角色管理已加载');
    }
    
    waitForBody();
})();
