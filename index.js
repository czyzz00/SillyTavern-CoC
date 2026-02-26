console.log("CoC SMART INIT");

(function waitForST() {

    const main = document.querySelector("#app") 
              || document.querySelector(".app-content") 
              || document.body;

    if (!main) {
        console.log("等待 ST 容器...");
        setTimeout(waitForST, 300);
        return;
    }

    if (document.getElementById("coc-floating-panel")) return;

    const panel = document.createElement("div");
    panel.id = "coc-floating-panel";

    panel.innerHTML = `
        <div class="coc-title">
            CoC 面板
        </div>
        <div class="coc-content">
            UI 已稳定挂载。<br>
            这是正确初始化方式。
        </div>
    `;

    main.appendChild(panel);

    console.log("CoC UI 插入完成");

})();
