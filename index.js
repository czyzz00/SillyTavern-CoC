console.log("CoC UI START");

window.addEventListener("load", function () {

    if (document.getElementById("coc-floating-panel")) return;

    const panel = document.createElement("div");
    panel.id = "coc-floating-panel";

    panel.innerHTML = `
        <div class="coc-title">
            CoC 面板
            <button id="coc-toggle">—</button>
        </div>
        <div class="coc-content">
            UI 已成功挂载。<br>
            现在这是一个固定浮动层。
        </div>
    `;

    document.body.appendChild(panel);

    document.getElementById("coc-toggle").onclick = function () {
        panel.classList.toggle("collapsed");
    };

});
