// ==================== 数据存储 ====================
// ✅ 统一 MODULE_NAME，让两个系统共享数据
const DATA_MODULE = 'coc-character-data';

class CharacterData {
    constructor(context) {
        this.context = context;
        this.init();
    }
    
    init() {
        if (!this.context.extensionSettings[DATA_MODULE]) {
            this.context.extensionSettings[DATA_MODULE] = {
                kpCharacter: '',
                characters: {}
            };
        }
    }
    
    // 保存设置
    save() {
        this.context.saveSettingsDebounced();
    }
    
    // 获取所有角色
    getAll() {
        return this.context.extensionSettings[DATA_MODULE].characters || {};
    }
    
    // 获取单个角色
    get(name) {
        return this.getAll()[name] || null;
    }
    
    // 设置角色
    set(name, stats) {
        const settings = this.context.extensionSettings[DATA_MODULE];
        if (!settings.characters) settings.characters = {};
        settings.characters[name] = { 
            stats: stats, 
            updatedAt: new Date().toISOString() 
        };
        this.save();
        return true;
    }
    
    // 删除角色
    delete(name) {
        const settings = this.context.extensionSettings[DATA_MODULE];
        if (settings.characters?.[name]) {
            delete settings.characters[name];
            this.save();
            return true;
        }
        return false;
    }
    
    // 获取KP
    getKP() {
        return this.context.extensionSettings[DATA_MODULE].kpCharacter || '';
    }
    
    // 设置KP
    setKP(name) {
        this.context.extensionSettings[DATA_MODULE].kpCharacter = name;
        this.save();
    }
    
    // 获取角色技能值
    getSkill(characterName, skillName) {
        const char = this.get(characterName);
        if (char?.stats?.skills && char.stats.skills[skillName]) {
            return char.stats.skills[skillName];
        }
        return 50;
    }
    
    // 获取角色属性值
    getAttribute(characterName, attributeName) {
        const char = this.get(characterName);
        return char?.stats?.[attributeName] || 50;
    }
    
    // 获取角色理智
    getSan(characterName) {
        const char = this.get(characterName);
        return char?.stats?.san?.current || char?.stats?.POW || 50;
    }
    
    // 更新角色理智
    updateSan(characterName, newSan) {
        const char = this.get(characterName);
        if (char) {
            if (!char.stats.san) char.stats.san = {};
            char.stats.san.current = newSan;
            char.stats.san.max = char.stats.san.max || 99;
            this.save();
        }
    }
    
    // 获取可用角色列表（用于下拉框）
    getAvailableCharacters() {
        const characters = [];
        
        if (this.context.characters) {
            this.context.characters.forEach(char => {
                if (char?.name) {
                    characters.push(char.name);
                }
            });
        }
        
        if (this.context.groups && this.context.groupId) {
            const currentGroup = this.context.groups.find(g => g.id === this.context.groupId);
            if (currentGroup?.members) {
                currentGroup.members.forEach(member => {
                    if (member?.name) {
                        characters.push(member.name);
                    }
                });
            }
        }
        
        return [...new Set(characters)].sort();
    }
    
    // 标记技能使用
    markSkillUsed(characterName, skillName) {
        const char = this.get(characterName);
        if (char) {
            if (!char.stats.usedSkills) char.stats.usedSkills = [];
            if (!char.stats.usedSkills.includes(skillName)) {
                char.stats.usedSkills.push(skillName);
                this.save();
            }
            return true;
        }
        return false;
    }
}
