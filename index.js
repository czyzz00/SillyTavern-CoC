// COC角色数据管理 - 纯测试版
// 用官方 chatMetadata 存储角色数据

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // 模块唯一标识
            const MODULE_NAME = 'coc-character-data';
            
            // ==================== 数据操作函数 ====================
            
            // 初始化存储结构
            function initStorage() {
                if (!context.chatMetadata[MODULE_NAME]) {
                    context.chatMetadata[MODULE_NAME] = {
                        characters: {}  // { "李昂": { stats: {...} } }
                    };
                }
                return context.chatMetadata[MODULE_NAME];
            }
            
            // 保存数据（立即生效）
            function saveData() {
                context.saveMetadata();
                console.log('[COC] 数据已保存');
            }
            
            // 获取所有角色数据
            function getAllCharacters() {
                const storage = initStorage();
                return storage.characters || {};
            }
            
            // 获取单个角色数据
            function getCharacter(characterName) {
                const storage = initStorage();
                return storage.characters?.[characterName] || null;
            }
            
            // 保存角色数据
            function setCharacter(characterName, stats) {
                const storage = initStorage();
                if (!storage.characters) storage.characters = {};
                storage.characters[characterName] = {
                    stats: stats,
                    updatedAt: new Date().toISOString()
                };
                saveData();
                return true;
            }
            
            // 删除角色数据
            function deleteCharacter(characterName) {
                const storage = initStorage();
                if (storage.characters?.[characterName]) {
                    delete storage.characters[characterName];
                    saveData();
                    return true;
                }
                return false;
            }
            
            // ==================== 注册数据管理命令 ====================
            
            context.registerSlashCommand(
                'cocdata',  // 命令名
                (args, value) => {
                    // 解析参数
                    const action = args?.action || 'list';
                    const character = args?.char || context.name2;
                    const jsonData = args?.data || value || '';
                    
                    switch (action) {
                        case 'list':
                            const allChars = getAllCharacters();
                            const names = Object.keys(allChars);
                            if (names.length === 0) {
                                sendMessage('📭 还没有任何角色数据');
                            } else {
                                sendMessage(`📋 已有角色数据: ${names.join('、')}`);
                            }
                            break;
                            
                        case 'get':
                            const charData = getCharacter(character);
                            if (charData) {
                                sendMessage(`📊 ${character} 的数据:\n${JSON.stringify(charData.stats, null, 2)}`);
                            } else {
                                sendMessage(`❌ ${character} 没有数据`);
                            }
                            break;
                            
                        case 'save':
                            // 如果没有提供data，保存示例数据
                            let statsToSave;
                            if (jsonData) {
                                try {
                                    statsToSave = JSON.parse(jsonData);
                                } catch (e) {
                                    sendMessage(`❌ JSON解析失败: ${e.message}`);
                                    return '';
                                }
                            } else {
                                // 示例数据
                                statsToSave = {
                                    STR: 70,
                                    DEX: 50,
                                    CON: 60,
                                    skills: {
                                        '侦查': 80,
                                        '聆听': 70,
                                        '图书馆使用': 60
                                    }
                                };
                            }
                            
                            if (setCharacter(character, statsToSave)) {
                                sendMessage(`✅ ${character} 的数据已保存`);
                            }
                            break;
                            
                        case 'delete':
                            if (deleteCharacter(character)) {
                                sendMessage(`✅ ${character} 的数据已删除`);
                            } else {
                                sendMessage(`❌ ${character} 没有数据`);
                            }
                            break;
                            
                        case 'export':
                            const exportData = getCharacter(character);
                            if (exportData) {
                                const exportJson = JSON.stringify({
                                    character: character,
                                    stats: exportData.stats,
                                    exportDate: new Date().toISOString()
                                }, null, 2);
                                
                                // 创建下载
                                const blob = new Blob([exportJson], {type: 'application/json'});
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${character}-coc-stats.json`;
                                a.click();
                                sendMessage(`✅ ${character} 的数据已导出`);
                            } else {
                                sendMessage(`❌ ${character} 没有数据`);
                            }
                            break;
                            
                        case 'import':
                            if (!jsonData) {
                                sendMessage('❌ 请提供JSON数据');
                                return '';
                            }
                            try {
                                const importData = JSON.parse(jsonData);
                                // 支持两种格式：直接stats对象，或带character字段的包装
                                const targetChar = importData.character || character;
                                const stats = importData.stats || importData;
                                
                                if (setCharacter(targetChar, stats)) {
                                    sendMessage(`✅ ${targetChar} 的数据已导入`);
                                }
                            } catch (e) {
                                sendMessage(`❌ 导入失败: ${e.message}`);
                            }
                            break;
                            
                        default:
                            sendMessage(
                                '📋 COC数据管理命令:\n' +
                                '/cocdata list - 列出所有角色\n' +
                                '/cocdata action=get char=角色 - 读取\n' +
                                '/cocdata action=save char=角色 - 保存示例\n' +
                                '/cocdata action=save char=角色 data=\'{...}\' - 保存自定义\n' +
                                '/cocdata action=delete char=角色 - 删除\n' +
                                '/cocdata action=export char=角色 - 导出\n' +
                                '/cocdata action=import char=角色 data=\'{...}\' - 导入'
                            );
                    }
                    
                    return '';
                },
                ['cocd'],  // 别名
                '管理COC角色数据',
                [  // 命名参数定义
                    {
                        name: 'action',
                        type: 'string',
                        description: '操作: list/get/save/delete/export/import',
                        enumProvider: () => ['list', 'get', 'save', 'delete', 'export', 'import']
                    },
                    {
                        name: 'char',
                        type: 'string',
                        description: '角色名',
                        required: false
                    },
                    {
                        name: 'data',
                        type: 'string',
                        description: 'JSON数据（用于save/import）',
                        required: false
                    }
                ]
            );
            
            // 发送消息的辅助函数
            function sendMessage(text) {
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
                    
                    if (typeof context.saveChat === 'function') {
                        context.saveChat();
                    }
                } catch (e) {
                    console.error('发送消息失败:', e);
                }
            }
            
            alert('✅ COC数据管理注册成功！\n\n' +
                  '可用命令:\n' +
                  '/cocdata list - 列出所有角色\n' +
                  '/cocdata action=get char=李昂 - 读取\n' +
                  '/cocdata action=save char=李昂 - 保存示例\n' +
                  '/cocdata action=delete char=李昂 - 删除\n' +
                  '/cocdata action=export char=李昂 - 导出\n' +
                  '/cocdata action=import char=李昂 data=\'{"STR":60}\' - 导入\n\n' +
                  '数据保存在聊天元数据中，切换聊天会变化');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();
