(function () {
    console.log("COC legacy menu injection start");

    function injectButton() {
        // 查找左下角菜单容器
        const menu = document.querySelector("#left-nav-panel, #drawer-content, .drawer-content");

        if (!menu) {
            return false;
        }

        // 防止重复插入
        if (document.getElementById("coc-menu-button")) {
            return true;
        }

        const btn = document.createElement("div");
        btn.id = "coc-menu-button";
        btn.innerText = "🎲 CoC 骰子";
        btn.style.padding = "10px";
        btn.style.cursor = "pointer";
        btn.style.borderTop = "1px solid rgba(255,255,255,0.1)";

        btn.onclick = function () {
            const roll = Math.floor(Math.random() * 100) + 1;
            alert("1d100 = " + roll);
        };

        menu.appendChild(btn);

        console.log("COC menu button injected");
        return true;
    }

    const interval = setInterval(() => {
        if (injectButton()) {
            clearInterval(interval);
        }
    }, 1000);
})();
