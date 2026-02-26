console.log("CoC PERMANENT UI INIT");

(function () {

    function createPanel() {

        if (document.getElementById("coc-floating-panel")) return;

        const panel = document.createElement("div");
        panel.id = "coc-floating-panel";

        panel.style.position = "fixed";
        panel.style.top = "80px";
        panel.style.right = "20px";
        panel.style.width = "260px";
        panel.style.background = "#111";
        panel.style.color = "white";
        panel.style.padding = "15px";
        panel.style.borderRadius = "10px";
        panel.style.zIndex = "999999999";

        panel.innerHTML = `
            <b>CoC UI</b><br>
            稳定运行中
        `;

        document.body.appendChild(panel);

        console.log("UI 已插入");
    }

    // 立即尝试创建
    createPanel();

    // 防止被 ST 刷新机制清掉
    const observer = new MutationObserver(() => {
        if (!document.getElementById("coc-floating-panel")) {
            console.log("UI 被移除，重新创建");
            createPanel();
        }
    });

    observer.observe(document.body, { childList: true });

})();
