(function () {
    console.log("COC extension waiting for ST...");

    function waitForST() {
        if (!window.SillyTavern || !document.querySelector("#left-nav-panel")) {
            return false;
        }

        const menu = document.querySelector("#left-nav-panel");

        if (document.getElementById("coc-menu-button")) {
            return true;
        }

        const btn = document.createElement("div");
        btn.id = "coc-menu-button";
        btn.innerText = "CoC 骰子";
        btn.style.padding = "12px";
        btn.style.cursor = "pointer";
        btn.style.borderTop = "1px solid rgba(255,255,255,0.15)";

        btn.onclick = function () {
            const roll = Math.floor(Math.random() * 100) + 1;
            alert("1d100 = " + roll);
        };

        menu.appendChild(btn);

        console.log("COC button injected successfully");
        return true;
    }

    const interval = setInterval(() => {
        if (waitForST()) {
            clearInterval(interval);
        }
    }, 1000);
})();
