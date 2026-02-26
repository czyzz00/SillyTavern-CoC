// ==================== COC 角色面板 MVP 一体版 ====================

(function () {
    'use strict';

    setTimeout(() => {
        try {

            const context = SillyTavern.getContext();
            const MODULE_NAME = 'coc-character-data';

            // ==================== 数据层 ====================

            function initStorage() {
                if (!context.chatMetadata[MODULE_NAME]) {
                    context.chatMetadata[MODULE_NAME] = {
                        characters: {}
                    };
                }
                return context.chatMetadata[MODULE_NAME];
            }

            function saveData() {
                context.saveMetadata();
                console.log('[COC] 数据已保存');
            }

            function getCharacter(name) {
                const storage = initStorage();
                return storage.characters?.[name] || null;
            }

            function setCharacter(name, stats) {
                const storage = initStorage();
                if (!storage.characters) storage.characters = {};
                storage.characters[name] = {
                    stats: stats,
                    updatedAt: new Date().toISOString()
                };
                saveData();
            }

            // ==================== UI 层 ====================

            function createPanel() {

                if (document.getElementById("coc-panel")) return;

                const panel = document.createElement("div");
                panel.id = "coc-panel";

                panel.style.position = "fixed";
                panel.style.bottom = "20px";
                panel.style.left = "50%";
                panel.style.transform = "translateX(-50%)";
                panel.style.width = "320px";
                panel.style.background = "#1e1e1e";
                panel.style.color = "white";
                panel.style.padding = "15px";
                panel.style.borderRadius = "12px";
                panel.style.zIndex = "9999999";
                panel.style.boxShadow = "0 0 20px rgba(0,0,0,0.6)";
                panel.style.fontSize = "14px";

                panel.innerHTML = `
                    <div style="font-weight:bold;margin-bottom:10px;">
                        COC角色面板
                    </div>

                    <div>角色名</div>
                    <input id="coc-name" style="width:100%;margin-bottom:8px;" />

                    <div>STR</div>
                    <input id="coc-str" type="number" style="width:100%;margin-bottom:8px;" />

                    <div>DEX</div>
                    <input id="coc-dex" type="number" style="width:100%;margin-bottom:8px;" />

                    <div>CON</div>
                    <input id="coc-con" type="number" style="width:100%;margin-bottom:12px;" />

                    <button id="coc-save" style="width:100%;padding:8px;">
                        保存
                    </button>
                `;

                document.body.appendChild(panel);
                bindEvents();
            }

            function bindEvents() {

                const nameInput = document.getElementById("coc-name");
                const strInput = document.getElementById("coc-str");
                const dexInput = document.getElementById("coc-dex");
                const conInput = document.getElementById("coc-con");

                const defaultName = context.name2;
                nameInput.value = defaultName;

                loadCharacter(defaultName);

                nameInput.addEventListener("change", () => {
                    loadCharacter(nameInput.value.trim());
                });

                document.getElementById("coc-save").onclick = () => {

                    const name = nameInput.value.trim();
                    if (!name) {
                        alert("角色名不能为空");
                        return;
                    }

                    const stats = {
                        STR: Number(strInput.value) || 0,
                        DEX: Number(dexInput.value) || 0,
                        CON: Number(conInput.value) || 0
                    };

                    setCharacter(name, stats);
                    alert("已保存");
                };

                function loadCharacter(name) {
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

            // 创建面板
            createPanel();

            // 防止被重绘清掉
            const observer = new MutationObserver(() => {
                if (!document.getElementById("coc-panel")) {
                    createPanel();
                }
            });

            observer.observe(document.body, { childList: true });

            console.log("COC 面板已启动");

        } catch (e) {
            alert("COC 初始化失败: " + e.message);
        }

    }, 2500);

})();
