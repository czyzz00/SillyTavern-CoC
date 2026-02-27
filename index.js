// COC角色管理 - 基于成功模板的稳定版
(function() {
    // 第一步：弹窗确认JS已加载
    alert('🔵 COC扩展启动');
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        
        // body存在，开始构建UI
        buildUI();
    }
    
    function buildUI() {
        alert('🟢 开始构建UI');
        
        // 创建浮动按钮（右下角）
        const btn = document.createElement('button');
        btn.textContent = '🎲';
        btn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 16px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #4CAF50;
            color: white;
            border: none;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            cursor: pointer;
        `;
        
        btn.onclick = () => {
            alert('🎲 按钮被点击');
            // 这里后续添加面板功能
        };
        
        document.body.appendChild(btn);
        alert('✅ 按钮已添加');
    }
    
    waitForBody();
})();
