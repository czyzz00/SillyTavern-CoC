// COC角色管理 - 模板加载版

(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    let panelElement = null;
    let buttonElement = null;
    
    setTimeout(async () => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 初始化存储 ====================
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = {
                    characters: {}
                };
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
            
            // ==================== 加载模板 ====================
            let panelHtml = '';
            try {
                panelHtml = await context.renderExtensionTemplateAsync(
                    'third-party/SillyTavern-CoC',
                    'templates/character-panel'
                );
                console.log('[COC] 模板加载成功');
            } catch (e) {
                console.error('[COC] 模板加载失败:', e);
                panelHtml = '<div style="padding:20px; color:red;">模板加载失败</div>';
            }
            
            // ==================== 创建UI ====================
            
            // 1. 创建侧边栏按钮
            function createSidebarButton() {
                const buttonContainer = document.getElementById('extensions_menu_container') || 
                                        document.querySelector('.extensions-menu') ||
                                        document.getElementById('extensions-menu');
                
                if (!buttonContainer) {
                    setTimeout(createSidebarButton, 1000);
                    return;
                }
                
                buttonElement = document.createElement('div');
                buttonElement.id = 'coc-menu-button';
                buttonElement.className = 'list-group-item flex-container flexGap5 extensions-menu-item';
                buttonElement.setAttribute('data-extension', 'coc');
                buttonElement.setAttribute('title', 'COC角色数据管理');
                buttonElement.innerHTML = `
                    <div class="flex-container alignItemsCenter">
                        <span class="fa-regular fa-dice-d20 extension-button-icon"></span>
                        <span class="extension-button-text">COC角色管理</span>
                    </div>
                `;
                
                buttonElement.addEventListener('click', togglePanel);
                buttonContainer.appendChild(buttonElement);
                console.log('[COC] 侧边栏按钮已添加');
            }
            
            // 2. 创建主面板
            function createPanel() {
                const mainContainer = document.getElementById('chat')?.parentElement ||
                                      document.querySelector('.chat-container');
                
                if (!mainContainer) {
                    setTimeout(createPanel, 1000);
                    return;
                }
                
                panelElement = document.createElement('div');
                panelElement.id = 'coc-character-panel';
                panelElement.className = 'coc-panel';
                panelElement.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    max-width: 90vw;
                    max-height: 80vh;
                    background: var(--bg-color, #1a1a1a);
                    border: 1px solid var(--border-color, #444);
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    z-index: 10000;
                    display: none;
                    overflow: auto;
                `;
                
                // 设置模板内容
                panelElement.innerHTML = panelHtml;
                
                document.body.appendChild(panelElement);
                console.log('[COC] 面板已创建');
                
                // 绑定事件
                bindPanelEvents();
            }
            
            // 3. 绑定面板事件
            function bindPanelEvents() {
                if (!panelElement) return;
                
                // 刷新下拉列表
                function refreshSelect() {
                    const select = panelElement.querySelector('#coc-character-select');
                    if (!select) return;
                    
                    const characters = getAllCharacters();
                    const names = Object.keys(characters);
                    
                    select.innerHTML = '<option value="">-- 请选择角色 --</option>';
                    names.sort().forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        select.appendChild(option);
                    });
                }
                
                // 显示角色数据
                function showCharacter(name) {
                    const char = getCharacter(name);
                    if (!char) return;
                    
                    const currentCharSpan = panelElement.querySelector('#coc-current-char');
                    const dataContent = panelElement.querySelector('#coc-data-content');
                    const dataDisplay = panelElement.querySelector('#coc-data-display');
                    const editSection = panelElement.querySelector('#coc-edit-section');
                    
                    if (currentCharSpan) currentCharSpan.textContent = name;
                    if (dataContent) dataContent.textContent = JSON.stringify(char.stats, null, 2);
                    if (dataDisplay) dataDisplay.style.display = 'block';
                    if (editSection) editSection.style.display = 'none';
                }
                
                // 关闭按钮
                panelElement.querySelector('#coc-close-panel')?.addEventListener('click', () => {
                    panelElement.style.display = 'none';
                });
                
                // 选择角色
                panelElement.querySelector('#coc-character-select')?.addEventListener('change', (e) => {
                    const name = e.target.value;
                    if (name) {
                        showCharacter(name);
                    } else {
                        const dataDisplay = panelElement.querySelector('#coc-data-display');
                        if (dataDisplay) dataDisplay.style.display = 'none';
                    }
                });
                
                // 刷新列表
                panelElement.querySelector('#coc-refresh-list')?.addEventListener('click', refreshSelect);
                
                // 编辑按钮
                panelElement.querySelector('#coc-edit-btn')?.addEventListener('click', () => {
                    const select = panelElement.querySelector('#coc-character-select');
                    const name = select?.value;
                    if (!name) return;
                    
                    const char = getCharacter(name);
                    const editCharSpan = panelElement.querySelector('#coc-edit-char');
                    const editTextarea = panelElement.querySelector('#coc-edit-textarea');
                    const dataDisplay = panelElement.querySelector('#coc-data-display');
                    const editSection = panelElement.querySelector('#coc-edit-section');
                    
                    if (editCharSpan) editCharSpan.textContent = name;
                    if (editTextarea) editTextarea.value = JSON.stringify(char.stats, null, 2);
                    if (dataDisplay) dataDisplay.style.display = 'none';
                    if (editSection) editSection.style.display = 'block';
                });
                
                // 保存编辑
                panelElement.querySelector('#coc-save-edit')?.addEventListener('click', () => {
                    const name = panelElement.querySelector('#coc-edit-char')?.textContent;
                    const textarea = panelElement.querySelector('#coc-edit-textarea');
                    
                    if (!name || !textarea) return;
                    
                    try {
                        const stats = JSON.parse(textarea.value);
                        setCharacter(name, stats);
                        refreshSelect();
                        showCharacter(name);
                        sendSystemMessage(`✅ ${name} 的数据已更新`);
                    } catch (e) {
                        sendSystemMessage(`❌ JSON错误: ${e.message}`);
                    }
                });
                
                // 取消编辑
                panelElement.querySelector('#coc-cancel-edit')?.addEventListener('click', () => {
                    const select = panelElement.querySelector('#coc-character-select');
                    const dataDisplay = panelElement.querySelector('#coc-data-display');
                    const editSection = panelElement.querySelector('#coc-edit-section');
                    
                    if (select?.value && dataDisplay) {
                        dataDisplay.style.display = 'block';
                    }
                    if (editSection) editSection.style.display = 'none';
                });
                
                // 导出按钮
                panelElement.querySelector('#coc-export-btn')?.addEventListener('click', () => {
                    const select = panelElement.querySelector('#coc-character-select');
                    const name = select?.value;
                    if (!name) return;
                    
                    const char = getCharacter(name);
                    const blob = new Blob([JSON.stringify({character: name, stats: char.stats}, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${name}-coc-stats.json`;
                    a.click();
                    sendSystemMessage(`✅ ${name} 的数据已导出`);
                });
                
                // 删除按钮
                panelElement.querySelector('#coc-delete-btn')?.addEventListener('click', () => {
                    const select = panelElement.querySelector('#coc-character-select');
                    const name = select?.value;
                    if (!name) return;
                    
                    if (confirm(`确定删除 ${name} 的数据吗？`)) {
                        deleteCharacter(name);
                        refreshSelect();
                        const dataDisplay = panelElement.querySelector('#coc-data-display');
                        if (dataDisplay) dataDisplay.style.display = 'none';
                        sendSystemMessage(`✅ ${name} 的数据已删除`);
                    }
                });
                
                // 保存新角色
                panelElement.querySelector('#coc-save-new')?.addEventListener('click', () => {
                    const nameInput = panelElement.querySelector('#coc-new-char-name');
                    const dataInput = panelElement.querySelector('#coc-new-char-data');
                    
                    const name = nameInput?.value.trim();
                    const data = dataInput?.value.trim();
                    
                    if (!name) {
                        sendSystemMessage('❌ 请输入角色名');
                        return;
                    }
                    
                    try {
                        const stats = JSON.parse(data);
                        setCharacter(name, stats);
                        if (nameInput) nameInput.value = '';
                        if (dataInput) dataInput.value = '';
                        refreshSelect();
                        sendSystemMessage(`✅ ${name} 的数据已保存`);
                        
                        // 自动选中新角色
                        const select = panelElement.querySelector('#coc-character-select');
                        if (select) {
                            select.value = name;
                            showCharacter(name);
                        }
                    } catch (e) {
                        sendSystemMessage(`❌ JSON错误: ${e.message}`);
                    }
                });
                
                // 示例按钮
                panelElement.querySelectorAll('.example-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const dataInput = panelElement.querySelector('#coc-new-char-data');
                        if (dataInput) {
                            dataInput.value = JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
                        }
                    });
                });
                
                // 初始化刷新
                refreshSelect();
            }
            
            // 4. 切换面板显示
            function togglePanel() {
                if (!panelElement) return;
                
                if (panelElement.style.display === 'none') {
                    panelElement.style.display = 'block';
                } else {
                    panelElement.style.display = 'none';
                }
            }
            
            // 5. 发送系统消息
            function sendSystemMessage(text) {
                const context = SillyTavern.getContext();
                context.sendMessage(text, 'system');
            }
            
            // 6. 开始创建UI
            createSidebarButton();
            createPanel();
            
            console.log('[COC] UI扩展初始化完成');
            
        } catch (error) {
            console.error('[COC] 初始化失败:', error);
        }
    }, 2000);
})();
