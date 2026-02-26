// COC角色管理 - UI面板版
// 基于官方API实现

(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    
    setTimeout(async () => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 初始化存储 ====================
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = {
                    characters: {}  // { "李昂": { stats: {...} } }
                };
            }
            
            // 保存设置
            function saveSettings() {
                context.saveSettingsDebounced();
            }
            
            // ==================== 数据操作 ====================
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
            
            // ==================== 加载HTML模板 ====================
            const panelHtml = await context.renderExtensionTemplateAsync(
                'third-party/coc-universal-core',  // 扩展文件夹名
                'templates/character-panel'        // 模板名（不带.html）
            );
            
            // ==================== 注册面板 ====================
            SillyTavern.registerPanel({
                panelId: 'coc-character-panel',
                title: 'COC角色管理',
                content: panelHtml,
                visible: true,
                onShow: initializePanel
            });
            
            // ==================== 初始化面板UI ====================
            function initializePanel(panelElement) {
                console.log('[COC] 面板显示');
                
                // 获取DOM元素
                const select = panelElement.querySelector('#coc-character-select');
                const dataDisplay = panelElement.querySelector('#coc-data-display');
                const dataContent = panelElement.querySelector('#coc-data-content');
                const currentCharSpan = panelElement.querySelector('#coc-current-char');
                const editSection = panelElement.querySelector('#coc-edit-section');
                const editTextarea = panelElement.querySelector('#coc-edit-textarea');
                const editCharSpan = panelElement.querySelector('#coc-edit-char');
                const newCharName = panelElement.querySelector('#coc-new-char-name');
                const newCharData = panelElement.querySelector('#coc-new-char-data');
                
                // 刷新下拉列表
                function refreshSelect() {
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
                    
                    currentCharSpan.textContent = name;
                    dataContent.textContent = JSON.stringify(char.stats, null, 2);
                    dataDisplay.style.display = 'block';
                    editSection.style.display = 'none';
                }
                
                // 刷新列表
                refreshSelect();
                
                // ===== 选择角色 =====
                select.addEventListener('change', (e) => {
                    const name = e.target.value;
                    if (name) {
                        showCharacter(name);
                    } else {
                        dataDisplay.style.display = 'none';
                    }
                });
                
                // ===== 刷新列表按钮 =====
                panelElement.querySelector('#coc-refresh-list').addEventListener('click', () => {
                    refreshSelect();
                });
                
                // ===== 编辑按钮 =====
                panelElement.querySelector('#coc-edit-btn').addEventListener('click', () => {
                    const currentName = select.value;
                    if (!currentName) return;
                    
                    const char = getCharacter(currentName);
                    editCharSpan.textContent = currentName;
                    editTextarea.value = JSON.stringify(char.stats, null, 2);
                    dataDisplay.style.display = 'none';
                    editSection.style.display = 'block';
                });
                
                // ===== 保存编辑 =====
                panelElement.querySelector('#coc-save-edit').addEventListener('click', () => {
                    const name = editCharSpan.textContent;
                    try {
                        const newStats = JSON.parse(editTextarea.value);
                        setCharacter(name, newStats);
                        showCharacter(name);
                        sendSystemMessage(`✅ ${name} 的数据已更新`);
                    } catch (e) {
                        sendSystemMessage(`❌ JSON解析错误: ${e.message}`);
                    }
                });
                
                // ===== 取消编辑 =====
                panelElement.querySelector('#coc-cancel-edit').addEventListener('click', () => {
                    const currentName = select.value;
                    if (currentName) {
                        showCharacter(currentName);
                    } else {
                        dataDisplay.style.display = 'none';
                        editSection.style.display = 'none';
                    }
                });
                
                // ===== 导出按钮 =====
                panelElement.querySelector('#coc-export-btn').addEventListener('click', () => {
                    const name = select.value;
                    if (!name) return;
                    
                    const char = getCharacter(name);
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
                    sendSystemMessage(`✅ ${name} 的数据已导出`);
                });
                
                // ===== 删除按钮 =====
                panelElement.querySelector('#coc-delete-btn').addEventListener('click', () => {
                    const name = select.value;
                    if (!name) return;
                    
                    if (confirm(`确定删除 ${name} 的数据吗？`)) {
                        deleteCharacter(name);
                        refreshSelect();
                        dataDisplay.style.display = 'none';
                        sendSystemMessage(`✅ ${name} 的数据已删除`);
                    }
                });
                
                // ===== 保存新角色 =====
                panelElement.querySelector('#coc-save-new').addEventListener('click', () => {
                    const name = newCharName.value.trim();
                    const data = newCharData.value.trim();
                    
                    if (!name) {
                        sendSystemMessage('❌ 请输入角色名');
                        return;
                    }
                    
                    try {
                        const stats = JSON.parse(data);
                        setCharacter(name, stats);
                        refreshSelect();
                        newCharName.value = '';
                        newCharData.value = '';
                        sendSystemMessage(`✅ ${name} 的数据已保存`);
                        
                        // 自动选中新角色
                        select.value = name;
                        showCharacter(name);
                    } catch (e) {
                        sendSystemMessage(`❌ JSON解析错误: ${e.message}`);
                    }
                });
                
                // ===== 示例数据按钮 =====
                panelElement.querySelectorAll('.example-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        newCharData.value = JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
                    });
                });
            }
            
            // ==================== 保留命令行作为补充 ====================
            context.registerSlashCommand(
                'coclist',
                () => {
                    const chars = Object.keys(getAllCharacters());
                    if (chars.length === 0) {
                        sendSystemMessage('📭 还没有任何角色数据');
                    } else {
                        sendSystemMessage(`📋 已有角色: ${chars.join('、')}`);
                    }
                    return '';
                },
                [],
                '列出所有COC角色'
            );
            
            // 发送系统消息的辅助函数
            function sendSystemMessage(text) {
                const context = SillyTavern.getContext();
                context.sendMessage(text, 'system');
            }
            
            alert('✅ COC角色管理面板加载成功！\n\n点击左上角三道杠 → COC角色管理');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();
