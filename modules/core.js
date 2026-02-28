// ==================== COC7 核心函数 ====================
// 统一 MODULE_NAME，与骰子系统一致
const CORE_MODULE = 'coc-character-data';

// 掷D100
function rollD100() {
    return Math.floor(Math.random() * 100) + 1;
}

// 带奖励/惩罚骰的掷骰
function rollWithBonusPenalty(bonusCount = 0, penaltyCount = 0) {
    const rolls = [];
    for (let i = 0; i < 3; i++) {
        rolls.push(rollD100());
    }
    
    if (bonusCount > 0) {
        rolls.sort((a, b) => Math.floor(a/10) - Math.floor(b/10));
        return rolls[0];
    } else if (penaltyCount > 0) {
        rolls.sort((a, b) => Math.floor(b/10) - Math.floor(a/10));
        return rolls[0];
    }
    return rolls[0];
}

// 解析骰子公式
function parseDiceFormula(formula) {
    formula = formula.toLowerCase().replace(/\s+/g, '');
    const match = formula.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) throw new Error('无效的骰子格式');
    
    const diceCount = match[1] ? parseInt(match[1]) : 1;
    const diceSides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let total = 0;
    let rolls = [];
    for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    if (modifier !== 0) total += modifier;
    
    let details = '';
    if (diceCount > 1) {
        details = `[${rolls.join('+')}]`;
        if (modifier !== 0) {
            details += `${modifier > 0 ? '+' : ''}${modifier}`;
        }
    }
    
    return { total, details };
}

// COC7成功等级判定
function judgeCOC(roll, skillValue) {
    if (roll === 100) return { text: '大失败', emoji: '💀' };
    if (roll >= 96 && roll <= 99 && skillValue < 50) return { text: '大失败', emoji: '💀' };
    if (roll <= Math.floor(skillValue / 5)) return { text: '极难成功', emoji: '✨' };
    if (roll <= Math.floor(skillValue / 2)) return { text: '困难成功', emoji: '⭐' };
    if (roll <= skillValue) return { text: '成功', emoji: '✅' };
    return { text: '失败', emoji: '❌' };
}

// 计算伤害加值 (DB)
function calculateDB(str, siz) {
    const total = (str || 50) + (siz || 50);
    if (total <= 64) return '-2';
    if (total <= 84) return '-1';
    if (total <= 124) return '0';
    if (total <= 164) return '+1d4';
    return '+1d6';
}

// 计算体格 (Build)
function calculateBuild(str, siz) {
    const total = (str || 50) + (siz || 50);
    if (total <= 64) return -2;
    if (total <= 84) return -1;
    if (total <= 124) return 0;
    if (total <= 164) return 1;
    return 2;
}

// 计算移动速度
function calculateMove(stats) {
    const str = stats.STR || 50;
    const dex = stats.DEX || 50;
    const siz = stats.SIZ || 50;
    const age = stats.age || 30;
    
    let base = 8;
    if (str < siz && dex < siz) base = 7;
    if (str > siz && dex > siz) base = 9;
    
    if (age >= 40 && age < 50) base -= 1;
    if (age >= 50 && age < 60) base -= 2;
    if (age >= 60 && age < 70) base -= 3;
    if (age >= 70 && age < 80) base -= 4;
    if (age >= 80) base -= 5;
    
    return Math.max(1, base);
}

// 计算最大HP
function calculateMaxHP(stats) {
    if (stats.CON && stats.SIZ) {
        return Math.floor((stats.CON + stats.SIZ) / 10);
    }
    return stats.HP || 10;
}

// 计算最大SAN
function calculateMaxSAN(stats) {
    return stats.POW || 60;
}
