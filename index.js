// COC角色管理 - 完整功能版
(function() {
    alert('🔵 COC扩展启动');
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        
        // 等待SillyTavern上下文就绪
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
        
        // ==================== 初始化存储 ====================
        if (!context.extensionSettings[MODULE_NAME]) {
            context.extensionSettings[MODULE_NAME] = { characters: {} };
        }
        
        // 保存设置
        function saveSettings() {
            context.saveSettingsDebounced();
        }
        
        // 获取所有角色
        function getAllCharacters() {
            return context.extensionSettings[MODULE_NAME].characters || {};
        }
        
        // 获取单个角色
        function getCharacter(name) {
            return getAllCharacters()[name] || null;
        }
        
        // 保存角色
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
        
        // 删除角色
        function deleteCharacter(name) {
            const settings = context.extensionSettings[MODULE_NAME];
            if (settings.characters?.[name]) {
                delete settings.characters[name];
                saveSettings();
                return true;
            }
            return false;
        }
        
        // 发送系统消息（保留slash版功能）
        function sendSystemMessage(text) {
            try {
                context.sendMessage(text, 'system');
            } catch (e) {
                console.error('[COC] 发送消息失败:', e);
            }
        }
        
        // ==================== 构建UI ====================
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
        
        // 找到顶部栏高度
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
        
        // ==================== 拖动功能 ====================
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
            height: 450px;
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
        
        // 内容区
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: var(--bg-color, #1a1a1a);
        `;
        
        // 初始内容（后续会用函数更新）
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
        
        // 刷新面板内容
        function refreshPanel() {
            const content = panel.querySelector('div:last-child');
            content.innerHTML = getPanelHTML(api.getAllCharacters());
            bindPanelEvents();
        }
        
        // 绑定面板事件
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
                        document.getElementById('coc-stats-display').innerHTML = '<pre>未选择角色</pre>';
                        return;
                    }
                    
                    const char = api.getCharacter(name);
                    if (char) {
                        document.getElementById('coc-stats-display').innerHTML = 
                            `<pre style="margin:0; font-size:12px;">${JSON.stringify(char.stats, null, 2)}</pre>`;
                    }
                });
            }
            
            // 保存新角色
            const saveBtn = document.getElementById('coc-save-new');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    const name = document.getElementById('coc-new-name').value.trim();
                    const data = document.getElementById('coc-new-data').value.trim();
                    
                    if (!name || !data) {
                        api.sendSystemMessage('❌ 请填写完整');
                        return;
                    }
                    
                    try {
                        const stats = JSON.parse(data);
                        api.setCharacter(name, stats);
                        
                        // 清空输入
                        document.getElementById('coc-new-name').value = '';
                        document.getElementById('coc-new-data').value = '';
                        
                        // 刷新下拉框
                        refreshRoleSelect();
                        
                        // 选中新角色
                        const select = document.getElementById('coc-role-select');
                        const option = Array.from(select.options).find(opt => opt.value === name);
                        if (option) {
                            select.value = name;
                            select.dispatchEvent(new Event('change'));
                        }
                        
                        api.sendSystemMessage(`✅ ${name} 已保存`);
                    } catch (e) {
                        api.sendSystemMessage(`❌ JSON格式错误: ${e.message}`);
                    }
                };
            }
            
            // 删除按钮
            const deleteBtn = document.getElementById('coc-delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = () => {
                    const select = document.getElementById('coc-role-select');
                    const name = select.value;
                    
                    if (!name) {
                        api.sendSystemMessage('❌ 请先选择角色');
                        return;
                    }
                    
                    if (confirm(`确定删除角色 ${name} 吗？`)) {
                        api.deleteCharacter(name);
                        refreshRoleSelect();
                        document.getElementById('coc-stats-display').innerHTML = '<pre>未选择角色</pre>';
                        api.sendSystemMessage(`✅ ${name} 已删除`);
                    }
                };
            }
            
            // 导出按钮
            const exportBtn = document.getElementById('coc-export-btn');
            if (exportBtn) {
                exportBtn.onclick = () => {
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
                    a.download = `${name}.json`;
                    a.click();
                    
                    api.sendSystemMessage(`✅ ${name} 已导出`);
                };
            }
            
            // 示例按钮
            document.querySelectorAll('.coc-example').forEach(btn => {
                btn.onclick = () => {
                    document.getElementById('coc-new-data').value = 
                        JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
                };
            });
        }
        
        // 刷新角色下拉框
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
        
        // 生成面板HTML
        function getPanelHTML(characters) {
            const names = Object.keys(characters).sort();
            let optionsHtml = '<option value="">-- 选择角色 --</option>';
            names.forEach(name => {
                optionsHtml += `<option value="${name}">${name}</option>`;
            });
            
            return `
                <div style="margin-bottom: 16px;">
                    <label style="display:block; margin-bottom:4px;">选择角色</label>
                    <div style="display:flex; gap:8px;">
                        <select id="coc-role-select" style="flex:1; padding:10px; border-radius:6px;">
                            ${optionsHtml}
                        </select>
                        <button id="coc-delete-btn" style="padding:10px; background:#f44336; color:white; border:none; border-radius:6px;">🗑️</button>
                        <button id="coc-export-btn" style="padding:10px; background:#2196F3; color:white; border:none; border-radius:6px;">📤</button>
                    </div>
                </div>
                
                <div id="coc-stats-display" style="background:#2a2a2a; padding:12px; border-radius:6px; margin-bottom:16px;">
                    <pre style="margin:0; font-size:12px;">未选择角色</pre>
                </div>
                
                <div style="margin-bottom:16px;">
                    <label style="display:block; margin-bottom:4px;">新建角色</label>
                    <input type="text" id="coc-new-name" placeholder="角色名" style="width:100%; padding:10px; margin-bottom:8px; border-radius:6px;">
                    <textarea id="coc-new-data" placeholder='{"STR":70,"skills":{"侦查":80}}' rows="4" style="width:100%; padding:10px; border-radius:6px; font-family:monospace;"></textarea>
                    <button id="coc-save-new" style="width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:6px; margin-top:8px;">💾 保存新角色</button>
                </div>
                
                <div style="display:flex; gap:8px;">
                    <button class="coc-example" data-example='{"STR":70,"DEX":50,"skills":{"侦查":80,"聆听":70}}' style="flex:1; padding:8px; background:#2196F3; color:white; border:none; border-radius:6px;">李昂示例</button>
                    <button class="coc-example" data-example='{"STR":60,"DEX":70,"skills":{"侦查":90,"潜行":60}}' style="flex:1; padding:8px; background:#9C27B0; color:white; border:none; border-radius:6px;">张薇示例</button>
                </div>
            `;
        }
        
        // 初始绑定事件
        bindPanelEvents();
        
        alert('✅ COC角色管理已加载');
    }
    
    waitForBody();
})();
