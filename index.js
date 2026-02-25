import { addTab, extension_settings } from "../../../extensions.js";

const extensionName = "coc-universal-core";

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = {
        test: "ok"
    };
}

export async function onLoad() {
    addTab({
        id: "coc-test-tab",
        title: "COC测试",
        icon: "🎲",
        html: `
            <div style="padding:15px;">
                <h2>COC 扩展正常运行</h2>
                <button id="coc-test-btn">点我测试</button>
            </div>
        `,
        onOpen: () => {
            document
                .getElementById("coc-test-btn")
                ?.addEventListener("click", () => {
                    alert("面板交互正常");
                });
        }
    });
}
