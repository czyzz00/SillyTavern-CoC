/**
 * COC Universal Core - Main Extension
 */

const extensionName = 'coc-universal-core';
let extensionSettings = {};

// 初始化扩展
(function() {
    'use strict';

    // 注册扩展
    SillyTavern.registerExtension(extensionName, {
        onLoad: onExtensionLoad,
        onChatUpdate: onChatUpdate,
        settings: {
            characters: {},
            system: {
                autoJudge: true,
                showRolls: true
            }
        }
    });

    // 获取上下文
    const getContext = () => SillyTavern.getContext();

    /**
     * 扩展加载时执行
     */
    function onExtensionLoad() {
        console.log('[COC] 扩展加载成功');
        
        // 加载保存的设置
        const context = getContext();
        if (context.extensionSettings[extensionName]) {
            extensionSettings = context.extensionSettings[extensionName];
        } else {
            // 初始化默认设置
            extensionSettings = {
                characters: {},
                system: {
                    autoJudge: true,
                    showRolls: true
                }
            };
            saveSettings();
        }

        // 注册面板
        registerPanels();
        
        // 注册消息处理器
        registerMessageHandler();
        
        // 注册Slash命令
        registerSlashCommands();
    }

    /**
     * 聊天更新时执行
     */
    function onChatUpdate() {
        // 可以在这里处理实时更新
    }

    /**
     * 保存设置到SillyTavern
     */
    function saveSettings() {
        const context = getContext();
        context.extensionSettings[extensionName] = extensionSettings;
        context.saveSettingsDebounced();
    }

    /**
     * 注册UI面板
     */
    function registerPanels() {
        // 加载面板HTML模板
        loadTemplate('characters').then(html => {
            SillyTavern.registerPanel('coc-characters', {
                title: 'COC角色管理',
                html: html,
                onShow: initializeCharactersPanel
            });
        });

        loadTemplate('dice').then(html => {
            SillyTavern.registerPanel('coc-dice', {
                title: 'COC骰子系统',
                html: html,
                onShow: initializeDicePanel
            });
        });
    }

    /**
     * 加载HTML模板
     */
    async function loadTemplate(name) {
        const url = `/scripts/extensions/third-party/${extensionName}/src/templates/${name}.html`;
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (error) {
            console.error(`[COC] 加载模板失败: ${name}`, error);
            return `<div>加载失败</div>`;
        }
    }

    /**
     * 初始化角色管理面板
     */
    function initializeCharactersPanel(panelElement) {
        const container = panelElement.querySelector('.coc-characters-container');
        if (!container) return;

        renderCharacterList(container);

        // 添加新增按钮事件
        const addBtn = panelElement.querySelector('#add-character-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const name = prompt('请输入角色名:');
                if (name) addCharacter(name);
            });
        }
    }

    /**
     * 渲染角色列表
     */
    function renderCharacterList(container) {
        let html = '';
        for (const [name, data] of Object.entries(extensionSettings.characters)) {
            html += `
                <div class="coc-character-card" data-name="${name}">
                    <h3>${name}</h3>
                    <div class="coc-character-field">
                        <label>绑定角色名:</label>
                        <input type="text" class="coc-bind-input" value="${data.bind || ''}" data-char="${name}">
                    </div>
                    <div class="coc-attributes">
                        <div class="coc-attr-row">
                            <label>STR:</label>
                            <input type="number" class="coc-attr-input" data-char="${name}" data-attr="STR" value="${data.STR || 50}">
                        </div>
                        <div class="coc-attr-row">
                            <label>DEX:</label>
                            <input type="number" class="coc-attr-input" data-char="${name}" data-attr="DEX" value="${data.DEX || 50}">
                        </div>
                        <div class="coc-attr-row">
                            <label>HP:</label>
                            <input type="number" class="coc-attr-input" data-char="${name}" data-attr="HP" value="${data.HP || 10}">
                        </div>
                        <div class="coc-attr-row">
                            <label>SAN:</label>
                            <input type="number" class="coc-attr-input" data-char="${name}" data-attr="SAN" value="${data.SAN || 60}">
                        </div>
                    </div>
                    <div class="coc-skills">
                        <h4>技能</h4>
                        <div class="coc-skill-list" data-char="${name}">
                            ${renderSkills(name, data.skills || {})}
                        </div>
                        <button class="coc-add-skill-btn" data-char="${name}">+ 添加技能</button>
                    </div>
                    <button class="coc-delete-btn" data-char="${name}">删除角色</button>
                </div>
                <hr>
            `;
        }
        container.innerHTML = html;

        // 绑定事件
        attachCharacterEvents(container);
    }

    /**
     * 渲染技能
     */
    function renderSkills(charName, skills) {
        let html = '';
        for (const [skillName, value] of Object.entries(skills)) {
            html += `
                <div class="coc-skill-row">
                    <input type="text" class="coc-skill-name" value="${skillName}" data-char="${charName}" data-original="${skillName}">
                    <input type="number" class="coc-skill-value" value="${value}" data-char="${charName}" data-skill="${skillName}">
                    <button class="coc-remove-skill-btn" data-char="${charName}" data-skill="${skillName}">×</button>
                </div>
            `;
        }
        return html;
    }

    /**
     * 绑定角色面板事件
     */
    function attachCharacterEvents(container) {
        // 绑定输入
        container.querySelectorAll('.coc-bind-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const charName = e.target.dataset.char;
                if (extensionSettings.characters[charName]) {
                    extensionSettings.characters[charName].bind = e.target.value;
                    saveSettings();
                }
            });
        });

        // 属性输入
        container.querySelectorAll('.coc-attr-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const charName = e.target.dataset.char;
                const attr = e.target.dataset.attr;
                const value = parseInt(e.target.value) || 0;
                
                if (extensionSettings.characters[charName]) {
                    extensionSettings.characters[charName][attr] = value;
                    saveSettings();
                }
            });
        });

        // 技能值修改
        container.querySelectorAll('.coc-skill-value').forEach(input => {
            input.addEventListener('change', (e) => {
                const charName = e.target.dataset.char;
                const skillName = e.target.dataset.skill;
                const value = parseInt(e.target.value) || 0;
                
                if (extensionSettings.characters[charName]?.skills) {
                    extensionSettings.characters[charName].skills[skillName] = value;
                    saveSettings();
                }
            });
        });

        // 技能名修改
        container.querySelectorAll('.coc-skill-name').forEach(input => {
            input.addEventListener('change', (e) => {
                const charName = e.target.dataset.char;
                const oldName = e.target.dataset.original;
                const newName = e.target.value.trim();
                
                if (!newName || !extensionSettings.characters[charName]?.skills) return;
                
                // 重命名技能
                const skills = extensionSettings.characters[charName].skills;
                if (oldName !== newName && skills[oldName]) {
                    skills[newName] = skills[oldName];
                    delete skills[oldName];
                    saveSettings();
                    
                    // 重新渲染整个列表以更新data属性
                    const container = document.querySelector('.coc-characters-container');
                    if (container) renderCharacterList(container);
                }
            });
        });

        // 添加技能
        container.querySelectorAll('.coc-add-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charName = e.target.dataset.char;
                const skillName = prompt('输入技能名称:');
                const skillValue = prompt('输入技能值(1-100):', '50');
                
                if (skillName && skillValue) {
                    if (!extensionSettings.characters[charName].skills) {
                        extensionSettings.characters[charName].skills = {};
                    }
                    extensionSettings.characters[charName].skills[skillName] = parseInt(skillValue) || 50;
                    saveSettings();
                    
                    // 重新渲染
                    const container = document.querySelector('.coc-characters-container');
                    if (container) renderCharacterList(container);
                }
            });
        });

        // 删除技能
        container.querySelectorAll('.coc-remove-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charName = e.target.dataset.char;
                const skillName = e.target.dataset.skill;
                
                if (extensionSettings.characters[charName]?.skills) {
                    delete extensionSettings.characters[charName].skills[skillName];
                    saveSettings();
                    
                    // 重新渲染
                    const container = document.querySelector('.coc-characters-container');
                    if (container) renderCharacterList(container);
                }
            });
        });

        // 删除角色
        container.querySelectorAll('.coc-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charName = e.target.dataset.char;
                if (confirm(`确定删除角色 ${charName} 吗？`)) {
                    delete extensionSettings.characters[charName];
                    saveSettings();
                    renderCharacterList(container);
                }
            });
        });
    }

    /**
     * 添加新角色
     */
    function addCharacter(name) {
        if (!name) return;
        if (extensionSettings.characters[name]) {
            alert('角色已存在');
            return;
        }

        extensionSettings.characters[name] = {
            bind: '',
            STR: 50,
            DEX: 50,
            HP: 10,
            SAN: 60,
            skills: {
                '侦查': 50,
                '聆听': 50,
                '图书馆使用': 50,
                '说服': 50
            }
        };

        saveSettings();
        
        // 重新渲染
        const container = document.querySelector('.coc-characters-container');
        if (container) renderCharacterList(container);
    }

    /**
     * 初始化骰子面板
     */
    function initializeDicePanel(panelElement) {
        const container = panelElement.querySelector('.coc-dice-container');
        if (!container) return;

        // 快速检定按钮
        container.querySelectorAll('.coc-quick-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skill = e.target.dataset.skill;
                performSkillCheck(skill);
            });
        });

        // 自定义检定
        const customBtn = container.querySelector('#coc-custom-roll-btn');
        if (customBtn) {
            customBtn.addEventListener('click', () => {
                const skillInput = container.querySelector('#coc-custom-skill');
                const skill = skillInput?.value.trim();
                if (skill) {
                    performSkillCheck(skill);
                    skillInput.value = '';
                }
            });
        }

        // 属性检定下拉
        const attrSelect = container.querySelector('#coc-attr-select');
        if (attrSelect) {
            attrSelect.addEventListener('change', (e) => {
                performAttributeCheck(e.target.value);
            });
        }
    }

    /**
     * 注册消息处理器（用于监听骰子指令）
     */
    function registerMessageHandler() {
        const context = getContext();
        
        // 监听用户输入
        context.eventSource.on('message', (msg) => {
            // 检测.r 指令 (例如: .r 侦查)
            const rollMatch = msg.match(/^\.r\s+(\S+)/);
            if (rollMatch) {
                const skillName = rollMatch[1];
                performSkillCheck(skillName);
            }
            
            // 检测.ra 指令 (例如: .ra 力量)
            const attrMatch = msg.match(/^\.ra\s+(\S+)/);
            if (attrMatch) {
                const attrName = attrMatch[1];
                performAttributeCheck(attrName);
            }
        });
    }

    /**
     * 注册Slash命令
     */
    function registerSlashCommands() {
        const { SlashCommandParser, SlashCommand } = SillyTavern.getContext();
        
        if (SlashCommandParser) {
            // /coc-roll 技能名
            SlashCommandParser.addCommandObject(new SlashCommand(
                'coc-roll',
                '进行COC技能检定',
                (args, value) => {
                    performSkillCheck(value);
                    return '';
                },
                ['skill']
            ));
            
            // /coc-attr 属性名
            SlashCommandParser.addCommandObject(new SlashCommand(
                'coc-attr',
                '进行COC属性检定',
                (args, value) => {
                    performAttributeCheck(value);
                    return '';
                },
                ['attribute']
            ));
        }
    }

    /**
     * 执行技能检定
     */
    function performSkillCheck(skillName) {
        const context = getContext();
        const speaker = context.name2;  // 当前发言角色
        
        // 查找绑定角色
        let character = null;
        let charName = '';
        
        for (const [name, data] of Object.entries(extensionSettings.characters)) {
            if (data.bind === speaker) {
                character = data;
                charName = name;
                break;
            }
        }
        
        if (!character) {
            sendSystemMessage(`未找到绑定角色: ${speaker}，请先在角色管理中绑定`);
            return;
        }
        
        // 获取技能值
        const skillValue = character.skills?.[skillName];
        if (skillValue === undefined) {
            sendSystemMessage(`角色 ${charName} 没有技能: ${skillName}`);
            return;
        }
        
        // 掷骰
        const roll = rollD100();
        const result = judgeCOCRoll(roll, skillValue);
        
        // 发送结果
        const message = `【COC检定】\n` +
            `${charName} 进行 ${skillName} 检定\n` +
            `技能值: ${skillValue}\n` +
            `骰值: ${roll}\n` +
            `结果: ${result}`;
        
        sendSystemMessage(message);
    }

    /**
     * 执行属性检定
     */
    function performAttributeCheck(attrName) {
        const context = getContext();
        const speaker = context.name2;
        
        // 查找绑定角色
        let character = null;
        let charName = '';
        
        for (const [name, data] of Object.entries(extensionSettings.characters)) {
            if (data.bind === speaker) {
                character = data;
                charName = name;
                break;
            }
        }
        
        if (!character) {
            sendSystemMessage(`未找到绑定角色: ${speaker}，请先在角色管理中绑定`);
            return;
        }
        
        // 标准属性列表
        const standardAttrs = ['STR', 'DEX', 'CON', 'APP', 'POW', 'SIZ', 'INT', 'EDU', 'HP', 'SAN'];
        const normalizedAttr = attrName.toUpperCase();
        
        // 检查是否是标准属性
        if (!standardAttrs.includes(normalizedAttr)) {
            sendSystemMessage(`未知属性: ${attrName}，可用属性: ${standardAttrs.join(', ')}`);
            return;
        }
        
        // 获取属性值
        const attrValue = character[normalizedAttr];
        if (attrValue === undefined) {
            sendSystemMessage(`角色 ${charName} 没有属性: ${normalizedAttr}`);
            return;
        }
        
        // 掷骰（属性检定使用*5的规则，但这里直接用属性值作为成功率）
        const roll = rollD100();
        const result = judgeCOCRoll(roll, attrValue);
        
        // 发送结果
        const message = `【COC属性检定】\n` +
            `${charName} 进行 ${normalizedAttr} 检定\n` +
            `属性值: ${attrValue}\n` +
            `骰值: ${roll}\n` +
            `结果: ${result}`;
        
        sendSystemMessage(message);
    }

    /**
     * 掷D100骰子
     */
    function rollD100() {
        return Math.floor(Math.random() * 100) + 1;
    }

    /**
     * COC检定判定
     */
    function judgeCOCRoll(roll, skill) {
        if (roll === 100) return '大失败';
        if (roll >= 96 && skill < 50) return '大失败';
        if (roll <= skill / 5) return '极难成功';
        if (roll <= skill / 2) return '困难成功';
        if (roll <= skill) return '成功';
        return '失败';
    }

    /**
     * 发送系统消息
     */
    function sendSystemMessage(text) {
        const context = getContext();
        context.sendMessage(text, 'system');
    }

})();
