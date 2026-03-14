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
                characters: {},
                time: {
                    day: 1,
                    week: 1,
                    session: 1,
                    daySanLoss: 0,
                    lastDayReset: new Date().toISOString()
                },
                combat: {
                    active: false,
                    round: 0,
                    order: [],
                    index: 0,
                    acted: [],
                    participants: []
                }
            };
        }

        if (!this.context.extensionSettings[DATA_MODULE].time) {
            this.context.extensionSettings[DATA_MODULE].time = {
                day: 1,
                week: 1,
                session: 1,
                daySanLoss: 0,
                lastDayReset: new Date().toISOString()
            };
        }

        if (!this.context.extensionSettings[DATA_MODULE].combat) {
            this.context.extensionSettings[DATA_MODULE].combat = {
                active: false,
                round: 0,
                order: [],
                index: 0,
                acted: [],
                participants: []
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

    // ==================== 时间系统 ====================

    // 获取时间状态
    getTimeStatus() {
        return this.context.extensionSettings[DATA_MODULE].time || {
            day: 1,
            week: 1,
            session: 1,
            daySanLoss: 0,
            lastDayReset: new Date().toISOString()
        };
    }

    // 设置时间状态
    setTimeStatus(nextStatus) {
        this.context.extensionSettings[DATA_MODULE].time = {
            ...this.getTimeStatus(),
            ...nextStatus
        };
        this.save();
    }

    // 记录当日SAN损失
    addDaySanLoss(amount) {
        const time = this.getTimeStatus();
        time.daySanLoss = Math.max(0, (time.daySanLoss || 0) + amount);
        this.setTimeStatus(time);
        return time.daySanLoss;
    }

    // 清空当日SAN损失
    resetDaySanLoss() {
        const time = this.getTimeStatus();
        time.daySanLoss = 0;
        time.lastDayReset = new Date().toISOString();
        this.setTimeStatus(time);
    }

    // 推进一天
    advanceDay() {
        const time = this.getTimeStatus();
        const nextDay = (time.day || 1) + 1;
        const nextWeek = ((nextDay - 1) % 7 === 0) ? (time.week || 1) + 1 : (time.week || 1);
        this.setTimeStatus({
            day: nextDay,
            week: nextWeek,
            daySanLoss: 0,
            lastDayReset: new Date().toISOString()
        });
        return this.getTimeStatus();
    }

    // 推进一周
    advanceWeek() {
        const time = this.getTimeStatus();
        const nextWeek = (time.week || 1) + 1;
        const nextDay = (time.day || 1) + 7;
        this.setTimeStatus({
            day: nextDay,
            week: nextWeek,
            daySanLoss: 0,
            lastDayReset: new Date().toISOString()
        });
        return this.getTimeStatus();
    }

    // 结束场次
    endSession() {
        const time = this.getTimeStatus();
        const nextSession = (time.session || 1) + 1;
        this.setTimeStatus({ session: nextSession });
        return this.getTimeStatus();
    }
    
    // 设置KP
    setKP(name) {
        this.context.extensionSettings[DATA_MODULE].kpCharacter = name;
        this.save();
    }

    // ==================== 战斗轮系统 ====================

    getCombatState() {
        return this.context.extensionSettings[DATA_MODULE].combat || {
            active: false,
            round: 0,
            order: [],
            index: 0,
            acted: [],
            participants: []
        };
    }

    setCombatState(nextState) {
        this.context.extensionSettings[DATA_MODULE].combat = {
            ...this.getCombatState(),
            ...nextState
        };
        this.save();
    }

    clearCombatState() {
        this.setCombatState({
            active: false,
            round: 0,
            order: [],
            index: 0,
            acted: [],
            participants: []
        });
    }
    
    // 获取角色技能值（优先统一 skills，兼容分类技能）
    getSkill(characterName, skillName) {
        const char = this.get(characterName);
        if (char?.stats?.skills && char.stats.skills[skillName] !== undefined) {
            return char.stats.skills[skillName];
        }
        const allSkills = {
            ...(char?.stats?.occupationalSkills || {}),
            ...(char?.stats?.interestSkills || {}),
            ...(char?.stats?.fightingSkills || {})
        };
        return allSkills[skillName] || 50;
    }
    
    // 获取角色属性值
    getAttribute(characterName, attributeName) {
        const char = this.get(characterName);
        return char?.stats?.[attributeName] || 50;
    }
    
    // 获取角色理智（统一使用 SAN 字段）
    getSan(characterName) {
        const char = this.get(characterName);
        return char?.stats?.SAN || 50;
    }
    
    // 更新角色理智（统一使用 SAN 字段）
    updateSan(characterName, newSan) {
        const char = this.get(characterName);
        if (char) {
            char.stats.SAN = newSan;
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
