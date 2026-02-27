// COC角色管理 - 最终版
// 用轮询确保body存在后再操作

(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    let panelElement = null;
    
    // 第一步：等待body存在
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        
        // body存在了，开始初始化
        initialize();
    }
    
    function initialize() {
        try {
            const context = SillyTavern.getContext();
            
            // 初始化存储
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = { characters: {} };
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
                settings.characters[name] = { stats: stats };
                context.saveSettingsDebounced();
                return true;
            }
            
            function deleteCharacter(name) {
                const settings = context.extensionSettings[MODULE_NAME];
                if (settings.characters?.[name]) {
                    delete settings.characters[name];
                    context.saveSettingsDebounced();
                    return true;
                }
                return false;
            }
            
            // 创建UI
            createUI();
            
            console.log('[COC] 初始化完成');
            
        } catch (error) {
            console.error('[COC] 初始化失败:', error);
        }
    }
    
    function createUI() {
        // 1. 创建浮动按钮（右下角）
        const floatingBtn = document.createElement('button');
        floatingBtn.id = 'coc-floating-btn';
        floatingBtn.textContent = '🎲';
        floatingBtn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 16px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #4CAF50;
            color: white;
            border: none;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-tap-highlight-color: transparent;
        `;
        
        floatingBtn.onclick = togglePanel;
        document.body.appendChild(floatingBtn);
        
        // 2. 创建遮罩和面板
        createPanel();
    }
    
    function createPanel() {
        // 遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'coc-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000000;
            display: none;
        `;
        overlay.onclick = (e) => {
            if (e.target === overlay) togglePanel();
        };
        
        // 面板
        const panel = document.createElement('div');
        panel.id = 'coc-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 400px;
            max-height: 80vh;
            background: var(--bg-color, #1a1a1a);
            border: 1px solid var(--border-color, #444);
            border-radius: 12px;
            z-index: 1000001;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        `;
        
        // 填充面板内容
        updatePanelContent(panel);
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        panelElement = { overlay, panel };
    }
    
    function updatePanelContent(panel) {
        const characters = getAllCharacters();
        const names = Object.keys(characters);
        
        let optionsHtml = '<option value="">-- 选择角色 --</option>';
        names.sort().forEach(name => {
            optionsHtml += `<option value="${name}">${name}</option>`;
        });
        
        panel.innerHTML = `
            <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="margin: 0; font-size: 1.2rem;">🎲 COC角色管理</h2>
                    <button id="coc-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px 8px;">✖</button>
                </div>
                
                <select id="coc-select" style="width: 100%; padding: 10px; margin-bottom: 16px; border-radius: 6px; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color);">
                    ${optionsHtml}
                </select>
                
                <div id="coc-data-container" style="display: none; margin-bottom: 16px;">
                    <pre id="coc-data-content" style="background: var(--input-bg, #2a2a2a); padding: 12px; border-radius: 6px; overflow: auto; white-space: pre-wrap; font-size: 12px;"></pre>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button id="coc-edit-btn" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 6px;">✏️ 编辑</button>
                        <button id="coc-delete-btn" style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 6px;">🗑️ 删除</button>
                    </div>
                </div>
                
                <div style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                    <h3 style="font-size: 1rem; margin-bottom: 8px;">➕ 新建角色</h3>
                    <input id="coc-new-name" placeholder="角色名" style="width: 100%; padding: 8px; margin-bottom: 8px; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px;">
                    <textarea id="coc-new-data" placeholder='{"STR":70,"skills":{"侦查":80}}' style="width: 100%; height: 100px; padding: 8px; margin-bottom: 8px; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-family: monospace;"></textarea>
                    <button id="coc-save-new" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 6px;">💾 保存新角色</button>
                </div>
                
                <div style="margin-top: 12px;">
                    <button class="coc-example-btn" data-example='{"STR":70,"skills":{"侦查":80}}' style="margin-right: 4px; padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px;">李昂</button>
                    <button class="coc-example-btn" data-example='{"STR":60,"skills":{"侦查":90}}' style="padding: 4px 8px; background: #9C27B0; color: white; border: none; border-radius: 4px;">张薇</button>
                </div>
            </div>
        `;
        
        // 绑定事件
        bindPanelEvents(panel);
    }
    
    function bindPanelEvents(panel) {
        // 关闭按钮
        panel.querySelector('#coc-close-btn').onclick = togglePanel;
        
        // 选择角色
        panel.querySelector('#coc-select').addEventListener('change', (e) => {
            const name = e.target.value;
            if (!name) {
                panel.querySelector('#coc-data-container').style.display = 'none';
                return;
            }
            
            const char = getCharacter(name);
            if (char) {
                panel.querySelector('#coc-data-content').textContent = JSON.stringify(char.stats, null, 2);
                panel.querySelector('#coc-data-container').style.display = 'block';
            }
        });
        
        // 编辑按钮
        panel.querySelector('#coc-edit-btn').onclick = () => {
            const name = panel.querySelector('#coc-select').value;
            if (!name) return;
            
            const newStats = prompt('编辑JSON:', JSON.stringify(getCharacter(name).stats));
            if (newStats) {
                try {
                    setCharacter(name, JSON.parse(newStats));
                    panel.querySelector('#coc-select').dispatchEvent(new Event('change'));
                } catch (e) {
                    alert('JSON格式错误');
                }
            }
        };
        
        // 删除按钮
        panel.querySelector('#coc-delete-btn').onclick = () => {
            const name = panel.querySelector('#coc-select').value;
            if (!name || !confirm(`删除 ${name}？`)) return;
            
            deleteCharacter(name);
            panel.querySelector('#coc-select').querySelector(`option[value="${name}"]`).remove();
            panel.querySelector('#coc-data-container').style.display = 'none';
        };
        
        // 保存新角色
        panel.querySelector('#coc-save-new').onclick = () => {
            const name = panel.querySelector('#coc-new-name').value.trim();
            const data = panel.querySelector('#coc-new-data').value.trim();
            
            if (!name || !data) {
                alert('请填写完整');
                return;
            }
            
            try {
                const stats = JSON.parse(data);
                setCharacter(name, stats);
                
                // 刷新下拉框
                const select = panel.querySelector('#coc-select');
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
                
                // 清空输入
                panel.querySelector('#coc-new-name').value = '';
                panel.querySelector('#coc-new-data').value = '';
                
                // 选中新角色
                select.value = name;
                select.dispatchEvent(new Event('change'));
                
                // 关闭面板
                setTimeout(togglePanel, 500);
            } catch (e) {
                alert('JSON格式错误: ' + e.message);
            }
        };
        
        // 示例按钮
        panel.querySelectorAll('.coc-example-btn').forEach(btn => {
            btn.onclick = () => {
                panel.querySelector('#coc-new-data').value = JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
            };
        });
    }
    
    function togglePanel() {
        if (!panelElement) return;
        const isVisible = panelElement.overlay.style.display === 'block';
        panelElement.overlay.style.display = isVisible ? 'none' : 'block';
    }
    
    // 启动轮询
    waitForBody();
    
})();
