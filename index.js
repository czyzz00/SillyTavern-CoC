(function () {
    console.log("COC legacy extension loaded");

    function addButton() {
        const btn = document.createElement("button");
        btn.innerText = "COC骰子";
        btn.style.position = "fixed";
        btn.style.bottom = "20px";
        btn.style.right = "20px";
        btn.style.zIndex = "9999";
        btn.onclick = () => alert("1d100 = " + (Math.floor(Math.random() * 100) + 1));
        document.body.appendChild(btn);
    }

    // 等待页面加载完成
    const interval = setInterval(() => {
        if (document.body) {
            clearInterval(interval);
            addButton();
        }
    }, 500);
})();
