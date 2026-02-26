// COC角色管理 - 手机调试版

(function() {
    'use strict';

    const MODULE_NAME = 'coc-character-manager';
    let panelElement = null;
    
    setTimeout(async () => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 初始化存储 ====================
            if (!context.extensionSettings[MODULE_NAME]) {
                context.extensionSettings[MODULE_NAME] = { characters: {} };
            }
            
            // 数据操作函数（同上）
            function getAllCharacters() {
                return context.extensionSettings[MODULE_NAME].characters || {};
            }
            
            function getCharacter(name) {
                return getAllCharacters()[name] || null;
            }
            
            function setCharacter(name, stats) {
                const settings = context.extensionSettings[MODULE_NAME];
                if (!settings.characters) settings.characters = {};
                settings.characters[name] = { stats: stats, updatedAt: new Date().toISOString() };
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
            
            // ==================== 发送调试消息 ====================
            function sendDebugMessage(text) {
                try {
                    const context = SillyTavern.getContext();
                    const messageObj = {
                        name: 'system',
                        is_user: false,
                        is_system: true,
                        send_date: new Date().toLocaleString(),
                        mes: text
                    };
                    if (!context.chat) context.chat = [];
                    context.chat.push(messageObj);
                    if (typeof context.addOneMessage === 'function') {
                        context.addOneMessage(messageObj);
                    }
                } catch (e) {
                    console.error('发送消息失败:', e);
                }
            }
            
            // ==================== 尝试多种方式添加按钮 ====================
            
            // 方式1: 检查所有可能的容器
            setTimeout(() => {
                const possibleContainers = [
                    document.getElementById('extensions_menu_container'),
                    document.querySelector('.extensions-menu'),
                    document.querySelector('.bottom-nav'),
                    document.querySelector('.floating-buttons'),
                    document.querySelector('.mobile-toolbar'),
                    document.querySelector('.action-buttons'),
                    document.querySelector('.input-toolbar'),
                    document.querySelector('.chat-footer'),
                    document.querySelector('.panelControlBar'),
                    document.getElementById('form_sheld')
                ];
                
                let foundContainer = null;
                for (const container of possibleContainers) {
                    if (container) {
                        foundContainer = container;
                        sendDebugMessage(`✅ 找到容器: ${container.className || container.id}`);
                        break;
                    }
                }
                
                if (foundContainer) {
                    // 创建按钮
                    const btn = document.createElement('button');
                    btn.textContent = '🎲 COC';
                    btn.style.padding = '8px 12px';
                    btn.style.margin = '5px';
                    btn.style.borderRadius = '4px';
                    btn.style.background = '#4CAF50';
                    btn.style.color = 'white';
                    btn.style.border = 'none';
                    
                    btn.onclick = () => {
                        if (!panelElement) {
                            createSimplePanel();
                        }
                        panelElement.style.display = panelElement.style.display === 'none' ? 'block' : 'none';
                    };
                    
                    foundContainer.appendChild(btn);
                    sendDebugMessage(`✅ 按钮已添加到: ${foundContainer.className || foundContainer.id}`);
                } else {
                    sendDebugMessage('❌ 未找到任何容器，请截图告诉我界面长什么样');
                    
                    // 列出所有可能的元素ID
                    const allIds = [];
                    document.querySelectorAll('[id]').forEach(el => allIds.push(el.id));
                    sendDebugMessage(`📋 现有ID: ${allIds.join(', ').substring(0, 100)}...`);
                }
            }, 3000);
            
            // 创建简单面板
            function createSimplePanel() {
                panelElement = document.createElement('div');
                panelElement.id = 'coc-panel';
                panelElement.style.cssText = `
                    position: fixed;
                    top: 10%;
                    left: 5%;
                    width: 90%;
                    height: 80%;
                    background: var(--bg-color, #1a1a1a);
                    border: 1px solid #444;
                    border-radius: 8px;
                    z-index: 10000;
                    display: none;
                    overflow: auto;
                    padding: 15px;
                `;
                
                const characters = getAllCharacters();
                const names = Object.keys(characters);
                
                let optionsHtml = '';
                names.sort().forEach(name => {
                    optionsHtml += `<option value="${name}">${name}</option>`;
                });
                
                panelElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between;">
                        <h3>🎲 COC角色</h3>
                        <button onclick="document.getElementById('coc-panel').style.display='none'">✖</button>
                    </div>
                    
                    <select id="coc-select" style="width:100%; padding:8px; margin:10px 0;">
                        <option value="">选择角色</option>
                        ${optionsHtml}
                    </select>
                    
                    <pre id="coc-data" style="background:#2a2a2a; padding:10px; border-radius:4px; display:none;"></pre>
                    
                    <div style="margin-top:15px;">
                        <input id="coc-new-name" placeholder="新角色名" style="width:100%; padding:5px; margin:5px 0;">
                        <textarea id="coc-new-data" placeholder='{"STR":70,"skills":{"侦查":80}}' style="width:100%; height:100px; padding:5px;"></textarea>
                        <button id="coc-save-new" style="width:100%; padding:8px; background:#4CAF50; color:white; border:none; margin-top:5px;">保存新角色</button>
                    </div>
                `;
                
                document.body.appendChild(panelElement);
                
                // 绑定事件
                panelElement.querySelector('#coc-select').addEventListener('change', (e) => {
                    const name = e.target.value;
                    if (!name) return;
                    const char = getCharacter(name);
                    const dataEl = panelElement.querySelector('#coc-data');
                    dataEl.textContent = JSON.stringify(char.stats, null, 2);
                    dataEl.style.display = 'block';
                });
                
                panelElement.querySelector('#coc-save-new').addEventListener('click', () => {
                    const name = panelElement.querySelector('#coc-new-name').value.trim();
                    const data = panelElement.querySelector('#coc-new-data').value.trim();
                    if (!name || !data) return;
                    try {
                        const stats = JSON.parse(data);
                        setCharacter(name, stats);
                        sendDebugMessage(`✅ ${name} 已保存`);
                        panelElement.querySelector('#coc-new-name').value = '';
                        panelElement.querySelector('#coc-new-data').value = '';
                    } catch (e) {
                        sendDebugMessage(`❌ JSON错误`);
                    }
                });
            }
            
            // 发送初始调试消息
            sendDebugMessage('📱 手机调试模式启动，正在查找按钮位置...');
            
        } catch (error) {
            console.error('[COC] 初始化失败:', error);
        }
    }, 2000);
})();
