import { getContext } from "../../../extensions.js";

export async function onLoad() {
    console.log("COC TEST EXTENSION LOADED");

    const context = getContext();

    context.addExtensionTab({
        id: "coc-test-tab",
        name: "COC TEST",
        icon: "fa-solid fa-dice",
        content: `
            <div style="padding:20px;">
                <h2>COC 扩展已成功加载</h2>
                <button id="coc-roll-btn">投 1d100</button>
                <div id="coc-result" style="margin-top:10px;"></div>
            </div>
        `
    });

    setTimeout(() => {
        const btn = document.getElementById("coc-roll-btn");
        if (btn) {
            btn.onclick = () => {
                const roll = Math.floor(Math.random() * 100) + 1;
                document.getElementById("coc-result").innerText = "结果: " + roll;
            };
        }
    }, 500);
}
