// 直接执行 - 不需要 export
console.log('[COC测试] 文件被加载');
alert('✅ 文件被加载');

// 等SillyTavern初始化完成
setTimeout(() => {
    alert('⏱️ 开始注册面板');
    
    try {
        // 获取SillyTavern上下文（用于后续操作）
        const context = SillyTavern.getContext();
        alert('✅ 获取到上下文');
        
        // ✅ 正确的API：使用全局 SillyTavern.registerPanel
        if (typeof SillyTavern.registerPanel === 'function') {
            SillyTavern.registerPanel({
                panelId: 'coc-test-panel',      // 面板ID（唯一标识）
                title: 'COC测试',                // 侧边栏显示的标题
                content: getPanelHTML(),          // 面板内容
                visible: true                     // 注册后是否可见
            });
            
            alert('✅ 面板注册成功！\n请查看左上角三道杠菜单');
        } 
        // 备选方案：尝试旧版API
        else if (typeof context.addPanel === 'function') {
            context.addPanel({
                id: 'coc-test-panel',
                title: 'COC测试',
                content: getPanelHTML(),
                visible: true
            });
            alert('✅ 使用addPanel注册成功');
        }
        else {
            // 如果都不行，显示所有SillyTavern全局方法
            const globalMethods = Object.keys(SillyTavern).filter(
                key => typeof SillyTavern[key] === 'function'
            );
            alert('❌ 未找到registerPanel\n可用全局方法:\n' + globalMethods.join('\n'));
        }
        
    } catch (e) {
        alert('❌ 错误: ' + e.message + '\n' + e.stack);
    }
}, 3000); // 等待SillyTavern完全加载

// 生成面板HTML
function getPanelHTML() {
    return `
        <div style="padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
            <h2 style="color: #4a4a4a; border-bottom: 2px solid #646cff; padding-bottom: 10px;">
                🎲 COC测试面板
            </h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="color: #2e7d32; font-weight: bold; font-size: 16px;">
                    ✅ 扩展加载成功！
                </p>
                <p>扩展名称: coc-universal-core</p>
                <p>加载时间: ${new Date().toLocaleString()}</p>
                <p style="margin-top: 15px; color: #666; font-size: 14px;">
                    这个面板出现在左上角三道杠菜单中<br>
                    点击"COC测试"即可打开
                </p>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                <p style="margin: 0; color: #0d47a1;">
                    📌 下一步：可以在这里添加角色管理、骰子系统等功能
                </p>
            </div>
        </div>
    `;
}
