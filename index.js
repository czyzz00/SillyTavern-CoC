import { extension_settings } from "../../../extensions.js";

export async function onLoad() {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.right = "20px";
    div.style.background = "black";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.zIndex = "9999";
    div.innerHTML = `
        COC扩展运行中<br>
        <button id="coc-btn">测试</button>
    `;

    document.body.appendChild(div);

    document
        .getElementById("coc-btn")
        ?.addEventListener("click", () => {
            alert("UI 注入成功");
        });
}
