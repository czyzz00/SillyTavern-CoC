// 扩展被加载时立即执行
alert("✅ COC扩展文件被加载");

// 扩展主函数 - SillyTavern 1.15+ 会调用这个 export
export async function onLoad() {
    alert("✅ COC onLoad 被执行");
    
    // 注册面板到侧边栏（三道杠菜单）
    const panel = SillyTavern.getContext().createPanel({
        id: 'coc-test-panel',
        title: 'COC测试',
        content: getPanelHTML(),
        visible: true
    });
    
    alert("✅ 面板创建成功，请查看左上角三道杠菜单");
    
    // 也可以直接操作DOM添加提示
    setTimeout(() => {
        const menuItems = document.querySelectorAll('.menu_item');
        alert(`当前菜单项数量: ${menuItems.length}`);
    }, 2000);
}

// 也可以使用 onImport 如果存在
export async function onImport() {
    alert("✅ COC onImport 被执行");
}

// 获取面板HTML
function getPanelHTML() {
    return `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">COC测试面板</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                <p style="color: green; font-weight: bold;">✅ 扩展加载成功！</p>
                <p>扩展名称: coc-universal-core</p>
                <p>加载时间: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
}
