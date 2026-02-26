console.log("CoC DIRECT EXECUTE");

(function(){

    console.log("开始创建UI");

    if (document.getElementById("coc-floating-panel")) return;

    const panel = document.createElement("div");
    panel.id = "coc-floating-panel";

    panel.style.position = "fixed";
    panel.style.top = "80px";
    panel.style.right = "20px";
    panel.style.width = "260px";
    panel.style.background = "black";
    panel.style.color = "white";
    panel.style.padding = "15px";
    panel.style.zIndex = "999999999";

    panel.innerHTML = `
        CoC UI 成功插入<br>
        如果你能看到我，说明OK
    `;

    document.body.appendChild(panel);

    console.log("UI 已插入");

})();
