// ==================== COC 物理稳定版 ====================

(function () {
    'use strict';

    console.log("COC 强制UI启动");

    // ===== 1. 先创建纯UI（不依赖ST）=====

    function createPanel() {
        if (document.getElementById("coc-panel")) return;

        const panel = document.createElement("div");
        panel.id = "coc-panel";

        panel.style.position = "fixed";
        panel.style.bottom = "20px";
        panel.style.left = "50%";
        panel.style.transform = "translateX(-50%)";
        panel.style.width = "320px";
        panel.style.background = "#111";
        panel.style.color = "white";
        panel.style.padding = "15px";
        panel.style.borderRadius = "12px";
        panel.style.zIndex = "999999999";

        panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:10px;">
                COC角色面板
            </div>

            <input id="coc-name" placeholder="角色名" style="width:100%;margin-bottom:8px;" />
            <input id="coc-str" type="number" placeholder="STR" style="width:100%;margin-bottom:8px;" />
            <input id="coc-dex" type="number" placeholder="DEX" style="width:100%;margin-bottom:8px;" />
            <input id="coc-con" type="number" placeholder="CON" style="width:100%;margin-bottom:12px;" />

            <button id="coc-save" style="width:100%;padding:6px;">
                保存
            </button>
        `;

        document.body.appendChild(panel);
    }

    createPanel();

    // ===== 2. 等待 ST 再绑定数据逻辑 =====

    function waitForContext() {
        if (typeof SillyTavern === "undefined" || !SillyTavern.getContext) {
            setTimeout(waitForContext, 500);
            return;
        }

        const context = SillyTavern.getContext();
        const MODULE_NAME = 'coc-character-data';

        function initStorage() {
            if (!context.chatMetadata[MODULE_NAME]) {
                context.chatMetadata[MODULE_NAME] = { characters: {} };
            }
            return context.chatMetadata[MODULE_NAME];
        }

        function saveData() {
            context.saveMetadata();
        }

        function getCharacter(name) {
            const storage = initStorage();
            return storage.characters?.[name] || null;
        }

        function setCharacter(name, stats) {
            const storage = initStorage();
            storage.characters[name] = {
                stats,
                updatedAt: new Date().toISOString()
            };
            saveData();
        }

        bindUI(context, getCharacter, setCharacter);
    }

    function bindUI(context, getCharacter, setCharacter) {

        const nameInput = document.getElementById("coc-name");
        const strInput = document.getElementById("coc-str");
        const dexInput = document.getElementById("coc-dex");
        const conInput = document.getElementById("coc-con");

        nameInput.value = context.name2 || "";

        load(nameInput.value);

        nameInput.onchange = () => load(nameInput.value);

        document.getElementById("coc-save").onclick = () => {

            const name = nameInput.value.trim();
            if (!name) return alert("角色名不能为空");

            setCharacter(name, {
                STR: Number(strInput.value) || 0,
                DEX: Number(dexInput.value) || 0,
                CON: Number(conInput.value) || 0
            });

            alert("已保存");
        };

        function load(name) {
            const data = getCharacter(name);
            if (!data) {
                strInput.value = "";
                dexInput.value = "";
                conInput.value = "";
                return;
            }

            strInput.value = data.stats.STR || "";
            dexInput.value = data.stats.DEX || "";
            conInput.value = data.stats.CON || "";
        }
    }

    waitForContext();

})();
