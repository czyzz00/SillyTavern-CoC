import { getContext } from "../../../extensions.js";

export async function onLoad() {
    console.log("COC EXTENSION LOADED");

    const context = getContext();

    context.addTab({
        id: "coc-test-tab",
        title: "COC TEST",
        icon: "fa-dice",
        render: (container) => {
            container.innerHTML = `
                <div style="padding:20px;">
                    <h2>COC 扩展成功加载</h2>
                    <button id="roll-btn">投 1d100</button>
                    <div id="result" style="margin-top:10px;"></div>
                </div>
            `;

            container.querySelector("#roll-btn").onclick = () => {
                const roll = Math.floor(Math.random() * 100) + 1;
                container.querySelector("#result").innerText = "结果: " + roll;
            };
        }
    });
}
