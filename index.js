// COC角色管理 - 完整版
(function() {
    'use strict';

    alert('🔵 COC扩展启动');
    
    const MODULE_NAME = 'coc-character-manager';
    let panel = null;
    let floatingBall = null;
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        initialize();
    }
    
    function initialize() {
        try {
            const context = SillyTavern.getContext();
            
            // 初始化存储
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = { characters: {} };
            }
            
            // 数据操作函数
            window.cocData = {
                getAll: () => context.extensionSettings[MODULE_NAME].characters || {},
                get: (name) => (context.extensionSettings[MODULE_NAME].characters || {})[name]?.stats || null,
                set: (name, stats) => {
                    if (!context.extensionSettings[MODULE_NAME].characters) {
                        context.extensionSettings[MODULE_NAME].characters = {};
                    }
                    context.extensionSettings[MODULE_NAME].characters[name] = { stats };
                    context.saveSettingsDebounced();
                    return true;
                },
                delete: (name) => {
                    if (context.extensionSettings[MODULE_NAME].characters?.[name]) {
                        delete context.extensionSettings[MODULE_NAME].characters[name];
                        context.saveSettingsDebounced();
                        return true;
                    }
                    return false;
                }
            };
            
            // 构建UI
            buildUI();
            
        } catch (error) {
            console.error('[COC] 初始化失败:', error);
            alert('❌ 初始化失败: ' + error.message);
        }
    }
    
    function buildUI() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        // 找到顶部栏高度
        const topBar = document.querySelector('[class*="header"]') || 
                      document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        const safeTop = topBarHeight + 10;
        const safeBottom = winHeight - 70;
        
        // 创建浮动球
        floatingBall = document.createElement('div');
        floatingBall.className = 'coc-floating-ball';
        floatingBall.textContent = '🎲';
        floatingBall.style.top = safeTop + 20 + 'px';
        floatingBall.style.right = '20px';
        document.body.appendChild(floatingBall);
        
        // 创建主面板
        panel = document.createElement('div');
        panel.className = 'coc-panel';
        panel.style.top = safeTop + 'px';
        
        // 面板头部
        const header = document.createElement('div');
        header.className = 'coc-panel-header';
        header.innerHTML = `
            <span class="coc-panel-title">🎲 COC角色管理</span>
            <button class="coc-close-btn">✖</button>
        `;
        
        // 面板内容
        const content = document.createElement('div');
        content.className = 'coc-panel-content';
        content.id = 'coc-panel-content';
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // 刷新面板内容
        refreshPanelContent();
        
        // 绑定事件
        floatingBall.addEventListener('touchstart', startDrag);
        floatingBall.addEventListener('touchmove', onDrag);
        floatingBall.addEventListener('touchend', endDrag);
        
        header.querySelector('.coc-close-btn').onclick = () => {
            panel.style.display = 'none';
        };
        
        floatingBall.addEventListener('click', () => {
            if (panel.style.display === 'none') {
                panel.style.display = 'flex';
                refreshPanelContent();
            } else {
                panel.style.display = 'none';
            }
        });
        
        alert('✅ COC角色管理已启动');
    }
    
    function refreshPanelContent() {
        const content = document.getElementById('coc-panel-content');
        if (!content) return;
        
        const characters = window.cocData.getAll();
        const names = Object.keys(characters);
        
        let optionsHtml = '<option value="">-- 选择角色 --</option>';
        names.sort().forEach(name => {
            optionsHtml += `<option value="${name}">${name}</option>`;
        });
        
        content.innerHTML = `
            <div>
                <label class="coc-label">选择角色</label>
                <select id="coc-select" class="coc-select">
                    ${optionsHtml}
                </select>
            </div>
            
            <div id="coc-data-container" style="display: none;">
                <div class="coc-data-display">
                    <pre id="coc-data-content" class="coc-data-content"></pre>
                </div>
                
                <div class="coc-button-group">
                    <button id="coc-edit-btn" class="coc-btn coc-btn-secondary coc-btn-small">✏️ 编辑</button>
                    <button id="coc-delete-btn" class="coc-btn coc-btn-danger coc-btn-small">🗑️ 删除</button>
                </div>
            </div>
            
            <div class="coc-divider"></div>
            
            <div>
                <label class="coc-label">新建角色</label>
                <input type="text" id="coc-new-name" class="coc-input" placeholder="角色名">
                <textarea id="coc-new-data" class="coc-textarea" placeholder='{"STR":70,"skills":{"侦查":80}}'></textarea>
                <button id="coc-save-new" class="coc-btn coc-btn-primary">💾 保存新角色</button>
            </div>
            
            <div class="coc-button-group" style="margin-top: 12px;">
                <button class="coc-btn coc-btn-secondary coc-btn-small example-btn" data-example='{"STR":70,"skills":{"侦查":80}}'>李昂示例</button>
                <button class="coc-btn coc-btn-secondary coc-btn-small example-btn" data-example='{"STR":60,"skills":{"侦查":90}}'>张薇示例</button>
            </div>
        `;
        
        // 绑定事件
        const select = document.getElementById('coc-select');
        select.addEventListener('change', (e) => {
            const name = e.target.value;
            if (!name) {
                document.getElementById('coc-data-container').style.display = 'none';
                return;
            }
            
            const stats = window.cocData.get(name);
            if (stats) {
                document.getElementById('coc-data-content').textContent = JSON.stringify(stats, null, 2);
                document.getElementById('coc-data-container').style.display = 'block';
            }
        });
        
        document.getElementById('coc-delete-btn')?.addEventListener('click', () => {
            const name = select.value;
            if (!name || !confirm(`删除 ${name}？`)) return;
            
            window.cocData.delete(name);
            select.querySelector(`option[value="${name}"]`)?.remove();
            document.getElementById('coc-data-container').style.display = 'none';
            showToast(`✅ ${name} 已删除`);
        });
        
        document.getElementById('coc-save-new')?.addEventListener('click', () => {
            const name = document.getElementById('coc-new-name').value.trim();
            const data = document.getElementById('coc-new-data').value.trim();
            
            if (!name || !data) {
                showToast('❌ 请填写完整');
                return;
            }
            
            try {
                const stats = JSON.parse(data);
                window.cocData.set(name, stats);
                
                // 刷新下拉框
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
                
                // 清空输入
                document.getElementById('coc-new-name').value = '';
                document.getElementById('coc-new-data').value = '';
                
                // 选中新角色
                select.value = name;
                select.dispatchEvent(new Event('change'));
                
                showToast(`✅ ${name} 已保存`);
            } catch (e) {
                showToast('❌ JSON格式错误');
            }
        });
        
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('coc-new-data').value = 
                    JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
            });
        });
    }
    
    // 拖动功能
    let startX, startY, startLeft, startTop, isDragging = false;
    
    function startDrag(e) {
        e.preventDefault();
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        const rect = floatingBall.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        floatingBall.style.right = 'auto';
        floatingBall.style.left = startLeft + 'px';
        floatingBall.style.top = startTop + 'px';
        
        isDragging = false;
    }
    
    function onDrag(e) {
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
        
        // 边界限制
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        newLeft = Math.max(0, Math.min(winWidth - 56, newLeft));
        newTop = Math.max(10, Math.min(winHeight - 70, newTop));
        
        floatingBall.style.left = newLeft + 'px';
        floatingBall.style.top = newTop + 'px';
    }
    
    function endDrag(e) {
        e.preventDefault();
        startX = startY = undefined;
        isDragging = false;
    }
    
    function showToast(text) {
        const toast = document.createElement('div');
        toast.className = 'coc-toast';
        toast.textContent = text;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    waitForBody();
})();
