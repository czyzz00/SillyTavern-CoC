// COC角色管理

(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    let panelElement = null;
    let isVisible = false;
    
    setTimeout(async () => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 初始化存储 ====================
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
            
            // ==================== 创建按钮和面板 ====================
            
            // 1. 等待主布局容器加载
            function waitForContainer() {
                const containers = [
                    document.querySelector('.app-content'),
                    document.querySelector('.main-content'),
                    document.querySelector('.flex-container'),
                    document.body
                ];
                
                return containers.find(c => c);
            }
            
            // 2. 创建浮动按钮（悬浮在右下角，类似RPG Companion）
            function createFloatingButton() {
                const btn = document.createElement('button');
                btn.id = 'coc-floating-btn';
                btn.innerHTML = '🎲';
                btn.style.cssText = `
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
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    z-index: 9999;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                `;
                
                btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
                btn.onmouseleave = () => btn.style.transform = 'scale(1)';
                btn.onclick = togglePanel;
                
                document.body.appendChild(btn);
                return btn;
            }
            
            // 3. 创建主面板（浮动在中央，带遮罩）
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
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                    z-index: 10001;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                `;
                
                // 构建面板内容
                buildPanelContent(panel);
                
                overlay.appendChild(panel);
                document.body.appendChild(overlay);
                
                return { overlay, panel };
            }
            
            // 4. 构建面板HTML
            function buildPanelContent(panel) {
                const characters = getAllCharacters();
                const names = Object.keys(characters);
                
                let optionsHtml = '<option value="">-- 选择角色 --</option>';
                names.sort().forEach(name => {
                    optionsHtml += `<option value="${name}">${name}</option>`;
                });
                
                panel.innerHTML = `
                    <div style="padding: 16px; background: var(--bg-color, #1a1a1a);">
                        <!-- 标题栏 -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h2 style="margin: 0; font-size: 1.2rem;">🎲 COC角色管理</h2>
                            <button id="coc-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
                        </div>
                        
                        <!-- 角色选择 -->
                        <div style="margin-bottom: 16px;">
                            <select id="coc-select" style="width: 100%; padding: 10px; border-radius: 6px; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color);">
                                ${optionsHtml}
                            </select>
                        </div>
                        
                        <!-- 数据展示 -->
                        <div id="coc-data-container" style="display: none; margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span id="coc-current-name" style="font-weight: bold;"></span>
                                <div>
                                    <button class="coc-icon-btn" id="coc-edit-btn" style="margin-right: 8px;">✏️</button>
                                    <button class="coc-icon-btn" id="coc-export-btn" style="margin-right: 8px;">📤</button>
                                    <button class="coc-icon-btn" id="coc-delete-btn">🗑️</button>
                                </div>
                            </div>
                            <pre id="coc-data-content" style="background: var(--input-bg, #2a2a2a); padding: 12px; border-radius: 6px; font-size: 12px; overflow: auto;"></pre>
                        </div>
                        
                        <!-- 编辑区 -->
                        <div id="coc-edit-container" style="display: none; margin-bottom: 16px;">
                            <textarea id="coc-edit-textarea" style="width: 100%; min-height: 200px; padding: 8px; font-family: monospace; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px;"></textarea>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <button id="coc-save-edit" style="flex: 1; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 6px;">保存</button>
                                <button id="coc-cancel-edit" style="flex: 1; padding: 8px; background: #666; color: white; border: none; border-radius: 6px;">取消</button>
                            </div>
                        </div>
                        
                        <!-- 新建角色 -->
                        <div style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                            <h3 style="font-size: 1rem; margin-bottom: 8px;">➕ 新建角色</h3>
                            <input type="text" id="coc-new-name" placeholder="角色名" style="width: 100%; padding: 8px; margin-bottom: 8px; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px;">
                            <textarea id="coc-new-data" placeholder='{"STR":70,"skills":{"侦查":80}}' style="width: 100%; height: 100px; padding: 8px; font-family: monospace; background: var(--input-bg, #2a2a2a); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px;"></textarea>
                            <button id="coc-save-new" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 6px;">保存新角色</button>
                        </div>
                        
                        <!-- 示例按钮 -->
                        <div style="margin-top: 12px;">
                            <button class="coc-example-btn" data-example='{"STR":70,"skills":{"侦查":80}}' style="margin-right: 4px; padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px;">李昂</button>
                            <button class="coc-example-btn" data-example='{"STR":60,"skills":{"侦查":90}}' style="padding: 4px 8px; background: #9C27B0; color: white; border: none; border-radius: 4px;">张薇</button>
                        </div>
                    </div>
                `;
            }
            
            // 5. 绑定事件
            function bindEvents(overlay, panel) {
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
                        panel.querySelector('#coc-current-name').textContent = name;
                        panel.querySelector('#coc-data-content').textContent = JSON.stringify(char.stats, null, 2);
                        panel.querySelector('#coc-data-container').style.display = 'block';
                        panel.querySelector('#coc-edit-container').style.display = 'none';
                    }
                });
                
                // 编辑按钮
                panel.querySelector('#coc-edit-btn').onclick = () => {
                    const select = panel.querySelector('#coc-select');
                    const name = select.value;
                    if (!name) return;
                    
                    const char = getCharacter(name);
                    panel.querySelector('#coc-edit-textarea').value = JSON.stringify(char.stats, null, 2);
                    panel.querySelector('#coc-data-container').style.display = 'none';
                    panel.querySelector('#coc-edit-container').style.display = 'block';
                };
                
                // 保存编辑
                panel.querySelector('#coc-save-edit').onclick = () => {
                    const name = panel.querySelector('#coc-select').value;
                    try {
                        const stats = JSON.parse(panel.querySelector('#coc-edit-textarea').value);
                        setCharacter(name, stats);
                        panel.querySelector('#coc-edit-container').style.display = 'none';
                        panel.querySelector('#coc-select').dispatchEvent(new Event('change'));
                        showToast(`✅ ${name} 已更新`);
                    } catch (e) {
                        showToast('❌ JSON格式错误');
                    }
                };
                
                // 取消编辑
                panel.querySelector('#coc-cancel-edit').onclick = () => {
                    panel.querySelector('#coc-edit-container').style.display = 'none';
                    panel.querySelector('#coc-data-container').style.display = 'block';
                };
                
                // 导出按钮
                panel.querySelector('#coc-export-btn').onclick = () => {
                    const name = panel.querySelector('#coc-select').value;
                    if (!name) return;
                    
                    const char = getCharacter(name);
                    const blob = new Blob([JSON.stringify({character: name, stats: char.stats}, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${name}.json`;
                    a.click();
                    showToast(`✅ ${name} 已导出`);
                };
                
                // 删除按钮
                panel.querySelector('#coc-delete-btn').onclick = () => {
                    const name = panel.querySelector('#coc-select').value;
                    if (!name || !confirm(`确定删除 ${name}？`)) return;
                    
                    deleteCharacter(name);
                    panel.querySelector('#coc-select').remove(panel.querySelector('#coc-select').selectedIndex);
                    panel.querySelector('#coc-data-container').style.display = 'none';
                    showToast(`✅ ${name} 已删除`);
                };
                
                // 保存新角色
                panel.querySelector('#coc-save-new').onclick = () => {
                    const name = panel.querySelector('#coc-new-name').value.trim();
                    const data = panel.querySelector('#coc-new-data').value.trim();
                    
                    if (!name || !data) {
                        showToast('❌ 请填写完整');
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
                        
                        showToast(`✅ ${name} 已保存`);
                    } catch (e) {
                        showToast('❌ JSON格式错误');
                    }
                };
                
                // 示例按钮
                panel.querySelectorAll('.coc-example-btn').forEach(btn => {
                    btn.onclick = () => {
                        panel.querySelector('#coc-new-data').value = JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
                    };
                });
            }
            
            // 6. 切换面板显示
            function togglePanel() {
                if (!panelElement) {
                    const { overlay, panel } = createPanel();
                    panelElement = { overlay, panel };
                    bindEvents(overlay, panel);
                }
                
                isVisible = !isVisible;
                panelElement.overlay.style.display = isVisible ? 'block' : 'none';
            }
            
            // 7. 显示提示
            function showToast(text) {
                const toast = document.createElement('div');
                toast.textContent = text;
                toast.style.cssText = `
                    position: fixed;
                    bottom: 150px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    z-index: 10002;
                    font-size: 14px;
                `;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            }
            
            // 8. 启动
            const container = waitForContainer();
            if (container) {
                createFloatingButton();
                console.log('[COC] 手机版启动成功');
            }
            
        } catch (error) {
            console.error('[COC] 初始化失败:', error);
        }
    }, 2000);
})();
