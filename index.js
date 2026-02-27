// COC角色管理 - 可视化版
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
        
        // 拖动功能（同上）
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
            height: 500px;
            background: var(--bg-color, #1a1a1a);
            border: 1px solid var(--border-color, #444);
            border-radius: 12px;
            z-index: 9999999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        `;
        
        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--bg-secondary, #333);
            border-bottom: 1px solid var(--border-color, #444);
        `;
        header.innerHTML = `
            <span style="font-size: 18px; font-weight: bold;">🎲 COC角色管理</span>
            <button id="coc-close-panel" style="
                background: none;
                border: none;
                color: var(--text-color);
                font-size: 20px;
                cursor: pointer;
                padding: 0 8px;
            ">✖</button>
        `;
        
        // 内容区（可滚动）
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: var(--bg-color, #1a1a1a);
        `;
        
        content.innerHTML = getPanelHTML(api.getAllCharacters());
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // ==================== 面板功能 ====================
        function togglePanel() {
            if (panel.style.display === 'none') {
                panel.style.display = 'flex';
                refreshPanel();
            } else {
                panel.style.display = 'none';
            }
        }
        
        function refreshPanel() {
            const content = panel.querySelector('div:last-child');
            content.innerHTML = getPanelHTML(api.getAllCharacters());
            bindPanelEvents();
        }
        
        // 格式化显示属性
        function formatStats(stats) {
            let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
            
            // 显示基础属性
            const baseAttrs = ['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'HP', 'SAN'];
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
            html += '</div>';
            
            // 显示技能
            if (stats.skills) {
                html += '<div style="margin-top:8px;"><div style="font-size:12px; color:#888; margin-bottom:4px;">技能</div>';
                html += '<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:4px;">';
                
                Object.entries(stats.skills).forEach(([skill, value]) => {
                    html += `
                        <div style="display:flex; justify-content:space-between; padding:4px 8px; background:#2a2a2a; border-radius:4px;">
                            <span>${skill}</span>
                            <span style="color:#4CAF50; font-weight:bold;">${value}</span>
                        </div>
                    `;
                });
                html += '</div></div>';
            }
            
            html += '</div>';
            return html;
        }
        
        // 导入JSON文件
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
                        
                        // 支持两种格式：直接是stats对象，或者是带character字段的包装
                        let name, stats;
                        if (data.character && data.stats) {
                            name = data.character;
                            stats = data.stats;
                        } else {
                            // 如果没有character字段，就用文件名作为角色名
                            name = file.name.replace('.json', '').replace(/-coc-stats$/, '');
                            stats = data;
                        }
                        
                        api.setCharacter(name, stats);
                        refreshPanel();
                        api.sendSystemMessage(`✅ 已导入角色: ${name}`);
                        
                        // 自动选中
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
        
        function bindPanelEvents() {
            // 关闭按钮
            document.getElementById('coc-close-panel').onclick = () => {
                panel.style.display = 'none';
            };
            
            // 角色选择
            const select = document.getElementById('coc-role-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    const name = e.target.value;
                    if (!name) {
                        document.getElementById('coc-stats-display').innerHTML = '<div style="color:#888; text-align:center; padding:20px;">👤 未选择角色</div>';
                        return;
                    }
                    
                    const char = api.getCharacter(name);
                    if (char) {
                        document.getElementById('coc-stats-display').innerHTML = formatStats(char.stats);
                    }
                });
            }
            
            // 导入按钮
            document.getElementById('coc-import-btn').onclick = importFromFile;
            
            // 保存新角色
            document.getElementById('coc-save-new').onclick = () => {
                const name = document.getElementById('coc-new-name').value.trim();
                const data = document.getElementById('coc-new-data').value.trim();
                
                if (!name || !data) {
                    api.sendSystemMessage('❌ 请填写完整');
                    return;
                }
                
                try {
                    const stats = JSON.parse(data);
                    api.setCharacter(name, stats);
                    
                    document.getElementById('coc-new-name').value = '';
                    document.getElementById('coc-new-data').value = '';
                    
                    refreshRoleSelect();
                    
                    const select = document.getElementById('coc-role-select');
                    select.value = name;
                    select.dispatchEvent(new Event('change'));
                    
                    api.sendSystemMessage(`✅ ${name} 已保存`);
                } catch (e) {
                    api.sendSystemMessage(`❌ JSON格式错误: ${e.message}`);
                }
            };
            
            // 删除按钮
            document.getElementById('coc-delete-btn').onclick = () => {
                const select = document.getElementById('coc-role-select');
                const name = select.value;
                
                if (!name) {
                    api.sendSystemMessage('❌ 请先选择角色');
                    return;
                }
                
                if (confirm(`确定删除角色 ${name} 吗？`)) {
                    api.deleteCharacter(name);
                    refreshRoleSelect();
                    document.getElementById('coc-stats-display').innerHTML = '<div style="color:#888; text-align:center; padding:20px;">👤 未选择角色</div>';
                    api.sendSystemMessage(`✅ ${name} 已删除`);
                }
            };
            
            // 导出按钮
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
            
            // 示例按钮
            document.querySelectorAll('.coc-example').forEach(btn => {
                btn.onclick = () => {
                    document.getElementById('coc-new-data').value = 
                        JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
                };
            });
        }
        
        function refreshRoleSelect() {
            const select = document.getElementById('coc-role-select');
            if (!select) return;
            
            const characters = api.getAllCharacters();
            const names = Object.keys(characters).sort();
            
            select.innerHTML = '<option value="">-- 选择角色 --</option>';
            names.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        }
        
        function getPanelHTML(characters) {
            const names = Object.keys(characters).sort();
            let optionsHtml = '<option value="">-- 选择角色 --</option>';
            names.forEach(name => {
                optionsHtml += `<option value="${name}">${name}</option>`;
            });
            
            return `
                <div style="margin-bottom: 16px;">
                    <div style="display:flex; gap:8px; margin-bottom:8px;">
                        <select id="coc-role-select" style="flex:1; padding:10px; border-radius:6px;">
                            ${optionsHtml}
                        </select>
                        <button id="coc-import-btn" style="padding:10px; background:#9C27B0; color:white; border:none; border-radius:6px;">📥 导入</button>
                    </div>
                    <div style="display:flex; gap:4px;">
                        <button id="coc-delete-btn" style="flex:1; padding:8px; background:#f44336; color:white; border:none; border-radius:6px;">🗑️ 删除</button>
                        <button id="coc-export-btn" style="flex:1; padding:8px; background:#2196F3; color:white; border:none; border-radius:6px;">📤 导出</button>
                    </div>
                </div>
                
                <div id="coc-stats-display" style="background:#2a2a2a; padding:16px; border-radius:8px; margin-bottom:16px;">
                    <div style="color:#888; text-align:center; padding:20px;">👤 未选择角色</div>
                </div>
                
                <div style="margin-bottom:16px;">
                    <label style="display:block; margin-bottom:4px;">➕ 新建角色</label>
                    <input type="text" id="coc-new-name" placeholder="角色名" style="width:100%; padding:10px; margin-bottom:8px; border-radius:6px;">
                    <textarea id="coc-new-data" placeholder='{"STR":70,"skills":{"侦查":80}}' rows="4" style="width:100%; padding:10px; border-radius:6px; font-family:monospace;"></textarea>
                    <button id="coc-save-new" style="width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:6px; margin-top:8px;">💾 保存新角色</button>
                </div>
                
                <div style="display:flex; gap:8px;">
                    <button class="coc-example" data-example='{"STR":70,"DEX":50,"CON":60,"skills":{"侦查":80,"聆听":70,"图书馆使用":60}}' style="flex:1; padding:8px; background:#2196F3; color:white; border:none; border-radius:6px;">李昂示例</button>
                    <button class="coc-example" data-example='{"STR":60,"DEX":70,"CON":50,"skills":{"侦查":90,"潜行":60,"说服":70}}' style="flex:1; padding:8px; background:#9C27B0; color:white; border:none; border-radius:6px;">张薇示例</button>
                </div>
            `;
        }
        
        bindPanelEvents();
        alert('✅ COC角色管理已加载');
    }
    
    waitForBody();
})();
