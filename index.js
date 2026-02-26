(function () {

    alert("测试启动");

    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }

        const div = document.createElement("div");

        div.style.position = "fixed";
        div.style.top = "0";
        div.style.left = "0";
        div.style.width = "100vw";
        div.style.height = "100vh";
        div.style.background = "red";
        div.style.zIndex = "2147483647";

        div.innerText = "红色覆盖测试成功";

        document.body.appendChild(div);

        console.log("已插入");
    }

    waitForBody();

})();
