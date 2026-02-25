console.log("COC legacy test running");

(function() {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.left = "20px";
    div.style.background = "red";
    div.style.color = "white";
    div.style.padding = "10px";
    div.style.zIndex = "9999";
    div.textContent = "COC 旧式扩展运行中";
    document.body.appendChild(div);
})();
