(function () {

    alert("测试启动");

    const div = document.createElement("div");

    div.style.position = "fixed";
    div.style.top = "0";
    div.style.left = "0";
    div.style.width = "100vw";
    div.style.height = "100vh";
    div.style.background = "red";
    div.style.zIndex = "2147483647";

    div.innerText = "如果你看到红色，全屏覆盖成功";

    window.addEventListener("load", () => {
        document.body.appendChild(div);
        console.log("已插入");
    });

})();
