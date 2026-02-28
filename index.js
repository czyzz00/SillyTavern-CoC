// ==================== 极简测试版 ====================
(function() {
    'use strict';

    // 直接弹窗，不依赖任何模块
    alert('🔵 COC扩展JS已加载 - 极简测试');
    
    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            alert('🟢 获取到SillyTavern上下文');
            
            // 注册一个最简单的命令
            context.registerSlashCommand('cotest', () => {
                alert('🎲 测试命令执行成功');
                return '';
            }, [], '测试命令');
            
            alert('✅ 测试命令注册成功，输入 /cotest 试试');
            
            // 创建一个红色方块确认UI能操作
            const div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.top = '10px';
            div.style.left = '10px';
            div.style.width = '100px';
            div.style.height = '100px';
            div.style.backgroundColor = 'red';
            div.style.zIndex = '9999999';
            div.textContent = 'COC测试';
            document.body.appendChild(div);
            alert('✅ 红色方块已添加');
            
        } catch (e) {
            alert('❌ 错误: ' + e.message);
        }
    }, 2000);
})();
