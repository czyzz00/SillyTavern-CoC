// COC角色管理 - 超大居中测试版
(function() {
    alert('🔵 COC扩展启动');
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        
        buildUI();
    }
    
    function buildUI() {
        alert('🟢 开始构建UI');
        
        // 创建一个大的浮动面板（不是小按钮）
        const panel = document.createElement('div');
        panel.id = 'coc-test-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 200px;
            background: #4CAF50;
            color: white;
            border: 5px solid red;
            border-radius: 10px;
            z-index: 9999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 0 30px rgba(0,0,0,0.5);
        `;
        
        // 标题
        const title = document.createElement('div');
        title.textContent = '🎲 COC测试面板';
        title.style.marginBottom = '20px';
        
        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            padding: 10px 20px;
            background: white;
            color: #4CAF50;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => {
            panel.style.display = 'none';
        };
        
        panel.appendChild(title);
        panel.appendChild(closeBtn);
        
        document.body.appendChild(panel);
        alert('✅ 面板已添加到页面中央');
    }
    
    waitForBody();
})();
