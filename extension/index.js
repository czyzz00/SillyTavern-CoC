let characters = JSON.parse(localStorage.getItem("coc_characters") || "{}");

function saveCharacters() {
    localStorage.setItem("coc_characters", JSON.stringify(characters));
}

function getCurrentSpeaker() {
    return SillyTavern.getContext().name;
}

function findBoundCharacter(name) {
    for (let key in characters) {
        if (characters[key].bind === name) {
            return characters[key];
        }
    }
    return null;
}

function rollD100() {
    return Math.floor(Math.random() * 100) + 1;
}

function judgeCOC(roll, skill) {
    if (roll === 100) return "大失败";
    if (roll >= 96 && skill < 50) return "大失败";
    if (roll <= skill / 5) return "极难成功";
    if (roll <= skill / 2) return "困难成功";
    if (roll <= skill) return "成功";
    return "失败";
}

function systemMessage(text) {
    SillyTavern.sendMessage(`【系统】\n${text}`);
}

window.cocRoll = function(skillName) {
    let speaker = getCurrentSpeaker();
    let char = findBoundCharacter(speaker);
    if (!char) {
        systemMessage("未找到绑定角色。");
        return;
    }

    let skill = char.skills?.[skillName];
    if (!skill) {
        systemMessage(`角色没有技能：${skillName}`);
        return;
    }

    let roll = rollD100();
    let result = judgeCOC(roll, skill);

    systemMessage(
        `${speaker} 进行 ${skillName} 检定\n技能值：${skill}\n骰值：${roll}\n结果：${result}`
    );
};

window.modifyStat = function(roleName, type, value) {
    if (!characters[roleName]) return;
    characters[roleName][type] += value;
    saveCharacters();
};
