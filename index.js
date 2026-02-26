// 直接执行 - 不需要 export
console.log('[COC测试] 文件被加载');
alert('✅ 文件被加载');

// 等SillyTavern初始化完成
setTimeout(() => {
    alert('⏱️ 开始注册面板');
    
    try {
        // 获取SillyTavern上下文 [citation:1][citation:5]
        const context = SillyTavern.getContext();
        alert('✅ 获取到上下文');
        
        // 注册面板 - 会自动添加到侧边栏 [citation:1]
        context.registerPanel({
            panelId: 'coc-test-panel',
            title: 'COC测试',
            content: '<div style="padding: 20px;"><h2>COC测试面板</h2><p>✅ 面板加载成功</p><p>时间: ' + new Date().toLocaleString() + '</p></div>',
            visible: true
        });
        
        alert('✅ 面板注册完成，请查看左上角三道杠菜单');
        
    } catch (e) {
        alert('❌ 错误: ' + e.message);
    }
}, 3000); // 等3秒确保SillyTavern完全加载
