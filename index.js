export async function onLoad() {
    // 强制修改整个页面背景色
    document.body.style.background = "red";

    // 强制在页面最顶层插入一个大字
    const div = document.createElement("div");
    div.innerText = "COC MODULE RUNNING";
    div.style.position = "fixed";
    div.style.top = "50%";
    div.style.left = "50%";
    div.style.transform = "translate(-50%, -50%)";
    div.style.fontSize = "40px";
    div.style.color = "white";
    div.style.zIndex = "999999";
    document.body.appendChild(div);
}
