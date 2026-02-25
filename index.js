import { extension_settings } from "../../../extensions.js";

const extensionName = "coc-universal-core";

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = {
        characters: {}
    };
}

export async function onLoad() {
    console.log("COC loaded");

    addUI();
}

function addUI() {
    const btn = document.createElement("button");
    btn.textContent = "COC测试按钮";
    btn.onclick = () => alert("扩展正常工作");
    
    document.body.appendChild(btn);
}
