// 等待页面加载完成
document.addEventListener("DOMContentLoaded", () => {
    createCoCUITestPanel();
});

function createCoCUITestPanel() {

    // 如果已经存在就不重复创建
    if (document.getElementById("coc-ui-test")) return;

    const panel = document.createElement("div");
    panel.id = "coc-ui-test";

    panel.innerHTML = `
        <div class="coc-ui-header">
            CoC UI 测试面板
            <button id="coc-close-btn">X</button>
        </div>
        <div class="coc-ui-body">
            这是测试UI。<br>
            如果你能看到这个块，说明挂载成功。
        </div>
    `;

    document.body.appendChild(panel);

    // 关闭按钮
    document.getElementById("coc-close-btn").onclick = () => {
        panel.style.display = "none";
    };
}
