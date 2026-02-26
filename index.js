console.log("CoC EXTENSION LOADED");

// 强制立即执行
(function(){

    alert("CoC 插件 JS 已执行");

    console.log("开始创建调试UI");

    // 创建一个极端明显的全屏红色遮罩
    const debugDiv = document.createElement("div");
    debugDiv.id = "coc-debug-overlay";

    debugDiv.style.position = "fixed";
    debugDiv.style.top = "0";
    debugDiv.style.left = "0";
    debugDiv.style.width = "100vw";
    debugDiv.style.height = "100vh";
    debugDiv.style.background = "rgba(255,0,0,0.8)";
    debugDiv.style.zIndex = "999999999";
    debugDiv.style.display = "flex";
    debugDiv.style.alignItems = "center";
    debugDiv.style.justifyContent = "center";
    debugDiv.style.fontSize = "30px";
    debugDiv.style.color = "white";

    debugDiv.innerHTML = `
        CoC DEBUG UI<br>
        如果你能看到红色全屏，说明UI插入成功<br>
        <button id="coc-close">关闭</button>
    `;

    document.body.appendChild(debugDiv);

    document.getElementById("coc-close").onclick = () => {
        debugDiv.remove();
    };

    console.log("调试UI已插入");

})();
