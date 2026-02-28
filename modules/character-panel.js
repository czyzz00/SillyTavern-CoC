// ==================== 角色卡面板UI ====================

function registerCharacterPanel(context, data, core) {
    const { calculateMaxHP, calculateMaxSAN, calculateMove, calculateBuild, calculateDamageBonus } = core;
    
    let panelElement = null;
    let isEditing = false;
    let currentEditName = '';
    let currentEditStats = null;
    
    // 预定义技能列表（从原角色卡复制）
    const SKILLS_LIST = {
        occupational: [
            '会计', '人类学', '估价', '考古学', '艺术', '手艺', '信用评级', '克苏鲁神话',
            '戏剧', '驾驶', '电气维修', '电子学', '格斗(斗殴)', '射击(手枪)', '射击(步枪)',
            '急救', '历史', '恐吓', '跳跃', '法律', '图书馆使用', '聆听', '锁匠', '机械维修',
            '医学', '自然', '导航', '神秘学', '操作重型机械', '说服', '攀爬', '精神分析',
            '心理学', '骑术', '科学', '妙手', '侦查', '潜行', '生存', '游泳', '投掷', '追踪'
        ],
        interest: [
            '会计', '人类学', '估价', '考古学', '艺术', '手艺', '信用评级', '克苏鲁神话',
            '戏剧', '驾驶', '电气维修', '电子学', '格斗(斗殴)', '射击(手枪)', '射击(步枪)',
            '急救', '历史', '恐吓', '跳跃', '法律', '图书馆使用', '聆听', '锁匠', '机械维修',
            '医学', '自然', '导航', '神秘学', '操作重型机械', '说服', '攀爬', '精神分析',
            '心理学', '骑术', '科学', '妙手', '侦查', '潜行', '生存', '游泳', '投掷', '追踪'
        ],
        fighting: [
            '格斗(斗殴)', '格斗(刀)', '格斗(剑)', '格斗(棍)', '格斗(斧)', 
            '射击(手枪)', '射击(步枪)', '射击(冲锋枪)', '射击(猎枪)', '投掷'
        ]
    };
    
    // 预定义武器列表
    const WEAPONS_LIST = [
        { name: '拳头', skill: '格斗(斗殴)', damage: '1d3+db' },
        { name: '踢', skill: '格斗(斗殴)', damage: '1d6+db' },
        { name: '小刀', skill: '格斗(刀)', damage: '1d4+db' },
        { name: '短棍', skill: '格斗(棍)', damage: '1d6+db' },
        { name: '手枪', skill: '射击(手枪)', damage: '1d10' },
        { name: '左轮手枪', skill: '射击(手枪)', damage: '1d10' },
        { name: '猎枪', skill: '射击(猎枪)', damage: '2d6/1d6' },
        { name: '步枪', skill: '射击(步枪)', damage: '2d6' },
        { name: '冲锋枪', skill: '射击(冲锋枪)', damage: '1d10' },
        { name: '手榴弹', skill: '投掷', damage: '4d10' }
    ];
    
    // 头像上传处理
    function handleAvatarUpload(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    // 渲染头像
    function renderAvatar(avatarData, name) {
        if (avatarData) {
            return `<img src="${avatarData}" alt="${name}" style="width:100%; height:100%; object-fit:cover;">`;
        }
        return `<div style="font-size: 40px; color: var(--coc-text-muted);">🦌</div>`;
    }
    
    // 渲染角色卡片
    function renderCharacterCard(name, stats) {
        stats = stats || {};
        
        const maxHP = calculateMaxHP(stats);
        const currentHP = stats.HP || maxHP;
        const hpPercent = Math.min(100, Math.max(0, (currentHP / maxHP) * 100));
        
        const maxSAN = calculateMaxSAN(stats);
        const currentSAN = stats.SAN || maxSAN;
        const sanPercent = Math.min(100, Math.max(0, (currentSAN / maxSAN) * 100));
        
        const move = calculateMove(stats);
        const build = calculateBuild(stats.STR, stats.SIZ);
        const db = calculateDamageBonus(stats.STR, stats.SIZ);
        const armor = stats.armor || 0;
        
        const occupation = stats.occupation || '调查员';
        const age = stats.age || '—';
        const birthplace = stats.birthplace || '—';
        const residence = stats.residence || '—';
        
        const occupationalSkills = stats.occupationalSkills || {};
        const interestSkills = stats.interestSkills || {};
        const fightingSkills = stats.fightingSkills || {};
        const possessions = stats.possessions || [];
        const assets = stats.assets || { spendingLevel: '—', cash: '—', assets: '—' };
        const relationships = stats.relationships || [];
        
        // 此处省略 HTML 模板，直接从原角色卡复制 renderCharacterCard 函数的返回值部分
        // 由于 HTML 太长，这里不重复粘贴，实际使用时从原文件复制
        // ...
    }
    
    // 渲染查看模式
    function renderViewMode() {
        const characters = data.getAll();
        const names = Object.keys(characters).sort();
        const select = document.getElementById('coc-role-select');
        
        if (select) {
            let options = '<option value="">选择角色</option>';
            options += names.map(name => `<option value="${name}">${name}</option>`).join('');
            options += `<option value="__NEW__" class="coc-add-role-option">➕ 新增角色...</option>`;
            select.innerHTML = options;
        }
        
        const display = document.getElementById('coc-stats-display');
        display.innerHTML = '<div class="coc-empty">👆 请选择角色</div>';
    }
    
    // 绑定工具栏事件
    function bindToolbarEvents() {
        const select = document.getElementById('coc-role-select');
        if (select) {
            select.addEventListener('change', (e) => {
                const value = e.target.value;
                
                if (value === '__NEW__') {
                    const newName = prompt('请输入新角色名:');
                    if (newName && newName.trim()) {
                        const name = newName.trim();
                        if (data.get(name)) {
                            alert('❌ 角色已存在');
                        } else {
                            const defaultStats = {
                                occupation: '调查员',
                                age: 30,
                                birthplace: '',
                                residence: '',
                                STR: 50,
                                DEX: 50,
                                CON: 50,
                                SIZ: 50,
                                INT: 50,
                                APP: 50,
                                POW: 50,
                                EDU: 50,
                                LUCK: 50,
                                occupationalSkills: {},
                                interestSkills: {},
                                fightingSkills: {},
                                possessions: [],
                                assets: { spendingLevel: '', cash: '', assets: '' },
                                relationships: []
                            };
                            data.set(name, defaultStats);
                            renderViewMode();
                            
                            setTimeout(() => {
                                select.value = name;
                                select.dispatchEvent(new Event('change'));
                            }, 100);
                        }
                    } else {
                        select.value = '';
                    }
                    return;
                }
                
                if (!value) {
                    document.getElementById('coc-stats-display').innerHTML = '<div class="coc-empty">👆 请选择角色</div>';
                    return;
                }
                
                const char = data.get(value);
                if (char) {
                    document.getElementById('coc-stats-display').innerHTML = renderCharacterCard(value, char.stats);
                    document.getElementById('coc-edit-mode-btn').onclick = () => {
                        enterEditMode(value, char.stats);
                    };
                }
            });
        }
        
        document.getElementById('coc-import-btn').onclick = () => importFromFile();
        document.getElementById('coc-export-btn').onclick = () => exportCharacter();
        document.getElementById('coc-delete-btn').onclick = () => deleteCharacter();
    }
    
    // 进入编辑模式
    function enterEditMode(name, stats) {
        isEditing = true;
        currentEditName = name;
        currentEditStats = JSON.parse(JSON.stringify(stats));
        
        document.getElementById('coc-stats-display').style.display = 'none';
        const editSection = document.getElementById('coc-edit-section');
        editSection.style.display = 'block';
        editSection.innerHTML = renderEditForm(name, currentEditStats);
        
        bindEditEvents();
    }
    
    // 渲染技能选项
    function renderSkillOptions(selectedSkill, type) {
        const list = SKILLS_LIST[type] || [];
        return list.map(skill => 
            `<option value="${skill}" ${skill === selectedSkill ? 'selected' : ''}>${skill}</option>`
        ).join('');
    }
    
    // 渲染武器选项
    function renderWeaponOptions(selectedWeapon) {
        return WEAPONS_LIST.map(weapon => 
            `<option value="${weapon.name}" ${weapon.name === selectedWeapon ? 'selected' : ''} data-skill="${weapon.skill}" data-damage="${weapon.damage}">${weapon.name}</option>`
        ).join('');
    }
    
    // 渲染编辑表单（省略 HTML，从原文件复制）
    function renderEditForm(name, stats) {
        // 此处省略 HTML 模板，直接从原角色卡复制 renderEditForm 函数的返回值部分
        // ...
    }
    
    // 绑定编辑事件
    function bindEditEvents() {
        // 头像上传
        const uploadBtn = document.getElementById('coc-avatar-upload-btn');
        const avatarInput = document.getElementById('coc-avatar-input');
        const avatarPreview = document.getElementById('coc-avatar-preview');
        
        if (uploadBtn && avatarInput) {
            uploadBtn.onclick = () => avatarInput.click();
            
            avatarInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    handleAvatarUpload(file, (avatarData) => {
                        currentEditStats.avatar = avatarData;
                        avatarPreview.innerHTML = `<img src="${avatarData}" alt="avatar">`;
                    });
                }
            };
        }
        
        // 添加技能按钮事件（从原文件复制）
        // ...
        
        // 保存编辑
        document.getElementById('coc-save-edit').onclick = () => {
            const newStats = collectEditData();
            
            if (currentEditStats.avatar) {
                newStats.avatar = currentEditStats.avatar;
            }
            
            data.set(currentEditName, newStats);
            
            isEditing = false;
            document.getElementById('coc-stats-display').style.display = 'block';
            document.getElementById('coc-edit-section').style.display = 'none';
            
            document.getElementById('coc-stats-display').innerHTML = renderCharacterCard(currentEditName, newStats);
            
            document.getElementById('coc-edit-mode-btn').onclick = () => {
                enterEditMode(currentEditName, newStats);
            };
        };
        
        // 取消编辑
        document.getElementById('coc-cancel-edit').onclick = () => {
            isEditing = false;
            document.getElementById('coc-stats-display').style.display = 'block';
            document.getElementById('coc-edit-section').style.display = 'none';
        };
    }
    
    // 收集编辑数据（从原文件复制）
    function collectEditData() {
        // 从原角色卡复制 collectEditData 函数
        // ...
    }
    
    // 导入文件
    function importFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    let name, stats;
                    if (data.character && data.stats) {
                        name = data.character;
                        stats = data.stats;
                    } else {
                        name = file.name.replace('.json', '').replace(/-coc-stats$/, '');
                        stats = data;
                    }
                    
                    data.set(name, stats);
                    renderViewMode();
                    
                    setTimeout(() => {
                        const select = document.getElementById('coc-role-select');
                        select.value = name;
                        select.dispatchEvent(new Event('change'));
                    }, 100);
                    
                } catch (error) {
                    alert(`❌ 导入失败: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // 导出角色
    function exportCharacter() {
        const select = document.getElementById('coc-role-select');
        const name = select.value;
        if (!name) {
            alert('❌ 请先选择角色');
            return;
        }
        
        const char = data.get(name);
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
    }
    
    // 删除角色
    function deleteCharacter() {
        const select = document.getElementById('coc-role-select');
        const name = select.value;
        
        if (!name) {
            alert('❌ 请先选择角色');
            return;
        }
        
        if (confirm(`确定删除 ${name} 吗？`)) {
            data.delete(name);
            renderViewMode();
        }
    }
    
    // 构建UI（从原角色卡复制 buildUI 函数）
    function buildUI() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        const topBar = document.querySelector('[class*="header"]') || document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        const safeTop = topBarHeight + 5;
        
        // 加载模板
        fetch('/scripts/extensions/third-party/SillyTavern-CoC/templates/character-panel.html')
            .then(response => response.text())
            .then(html => {
                document.body.insertAdjacentHTML('beforeend', html);
                panelElement = document.getElementById('coc-panel');
                
                const panelTop = safeTop;
                const panelLeft = 10;
                const panelWidth = winWidth - 20;
                const panelHeight = 500;
                
                panelElement.style.top = panelTop + 'px';
                panelElement.style.left = panelLeft + 'px';
                panelElement.style.width = panelWidth + 'px';
                panelElement.style.height = panelHeight + 'px';
                
                document.getElementById('coc-close-panel').onclick = (e) => {
                    e.stopPropagation();
                    panelElement.style.display = 'none';
                };
                
                bindToolbarEvents();
                renderViewMode();
            })
            .catch(err => {
                console.error('[COC] 加载模板失败:', err);
            });
    }
    
    // 返回构建函数
    return buildUI;
}
