// 第一层：文件加载
alert("🔵 1. 文件被加载");

// 第二层：onLoad 导出
export async function onLoad() {
    alert("🟢 2. onLoad 被执行");
    
    // 等待一下确保DOM加载完成
    setTimeout(() => {
        alert("🟡 3. 等待2秒后的回调");
    }, 2000);
}

// 第三层：检查是否有其他导出方式
export async function onImport() {
    alert("🟣 4. onImport 被执行");
}
