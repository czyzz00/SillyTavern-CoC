// COC角色管理 - 官方API版

(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    let panelElement = null;
    let buttonElement = null;
    
    // 等待SillyTavern加载
    function waitForSillyTavern() {
        if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
            setTimeout(waitForSillyTavern, 500);
            return;
        }
        
        initializeExtension();
    }
    
    function initializeExtension() {
        try {
            const context = SillyTavern.getContext();
            
            // 初始化存储
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = { characters: {} };
            }
            
            // 数据操作函数
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
            
            // 监听UI就绪事件
            context.eventSource.on('APP_READY', () => {
                console.log('[COC] App ready, creating UI');
                createUI();
            });
            
            // 如果已经就绪，直接创建
            if (document.querySelector('.app-grid') || document.querySelector('.flex-container')) {
                createUI();
            }
            
            function createUI() {
                // 查找正确的挂载点
                const mountPoints = [
                    document.querySelector('.app-grid'),
                    document.querySelector('.flex-container'),
                    document.querySelector('.main-panel'),
                    document.body
                ];
                
                const mountPoint = mountPoints.find(p => p);
                if (!mountPoint) {
                    console.log('[COC] No mount point found');
                    return;
                }
                
                // 创建浮动按钮（放在右下角）
                const floatingBtn = document.createElement('button');
                floatingBtn.id = 'coc-floating-btn';
                floatingBtn.textContent = '🎲';
                floatingBtn.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    font-size: 24px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 9999;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    -webkit-tap-highlight-color: transparent;
                `;
                
                floatingBtn.onclick = togglePanel;
                document.body.appendChild(floatingBtn);
                
                // 创建面板
                createPanel();
                console.log('[COC] UI created');
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
                    z-index: 10000;
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
                    z-index: 10001;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                `;
                
                // 填充内容
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
                            <h2 style="margin: 0; font-size: 1.2rem;">🎲 COC角色</h2>
                            <button id="coc-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
                        </div>
                        
                        <select id="coc-select" style="width: 100%; padding: 10px; margin-bottom: 16px; border-radius: 6px;">
                            ${optionsHtml}
                        </select>
                        
                        <div id="coc-data-container" style="display: none; margin-bottom: 16px;">
                            <pre id="coc-data-content" style="background: #2a2a2a; padding: 12px; border-radius: 6px; overflow: auto;"></pre>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <button id="coc-edit-btn" style="flex: 1; padding: 8px;">✏️ 编辑</button>
                                <button id="coc-delete-btn" style="flex: 1; padding: 8px; background: #f44336;">🗑️ 删除</button>
                            </div>
                        </div>
                        
                        <div style="margin-top: 16px;">
                            <h3 style="font-size: 1rem; margin-bottom: 8px;">➕ 新建角色</h3>
                            <input id="coc-new-name" placeholder="角色名" style="width: 100%; padding: 8px; margin-bottom: 8px;">
                            <textarea id="coc-new-data" placeholder='{"STR":70,"skills":{"侦查":80}}' style="width: 100%; height: 100px; padding: 8px; margin-bottom: 8px;"></textarea>
                            <button id="coc-save-new" style="width: 100%; padding: 10px; background: #4CAF50;">保存</button>
                        </div>
                    </div>
                `;
                
                // 绑定事件
                panel.querySelector('#coc-close-btn').onclick = togglePanel;
                
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
                
                panel.querySelector('#coc-delete-btn').onclick = () => {
                    const name = panel.querySelector('#coc-select').value;
                    if (!name || !confirm('删除？')) return;
                    
                    deleteCharacter(name);
                    panel.querySelector('#coc-select').querySelector(`option[value="${name}"]`).remove();
                    panel.querySelector('#coc-data-container').style.display = 'none';
                };
                
                panel.querySelector('#coc-save-new').onclick = () => {
                    const name = panel.querySelector('#coc-new-name').value.trim();
                    const data = panel.querySelector('#coc-new-data').value.trim();
                    
                    if (!name || !data) return;
                    
                    try {
                        const stats = JSON.parse(data);
                        setCharacter(name, stats);
                        
                        const select = panel.querySelector('#coc-select');
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        select.appendChild(option);
                        
                        panel.querySelector('#coc-new-name').value = '';
                        panel.querySelector('#coc-new-data').value = '';
                        
                        select.value = name;
                        select.dispatchEvent(new Event('change'));
                    } catch (e) {
                        alert('JSON错误');
                    }
                };
            }
            
            function togglePanel() {
                if (!panelElement) return;
                const isVisible = panelElement.overlay.style.display === 'block';
                panelElement.overlay.style.display = isVisible ? 'none' : 'block';
            }
            
            console.log('[COC] 扩展初始化成功');
            
        } catch (error) {
            console.error('[COC] 初始化失败:', error);
        }
    }
    
    // 启动
    waitForSillyTavern();
})();
