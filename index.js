// COC角色管理 - 安全区域版
(function() {
    alert('🔵 开始构建安全UI');
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        
        buildSafeUI();
    }
    
    function buildSafeUI() {
        // 获取安全区域
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        // 找到顶部栏高度
        const topBar = document.querySelector('[class*="header"]') || 
                      document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        
        // 安全区域（避开顶部栏）
        const safeTop = topBarHeight + 10;
        const safeBottom = winHeight - 10;
        const safeWidth = winWidth - 20;
        
        alert(`安全区域: 上=${safeTop}px, 下=${safeBottom}px, 宽=${safeWidth}px`);
        
        // 创建面板 - 放在安全区域顶部
        const panel = document.createElement('div');
        panel.id = 'coc-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${safeTop}px;
            left: 10px;
            width: ${safeWidth}px;
            height: 400px;
            background: #4CAF50;
            color: white;
            border: 3px solid #333;
            border-radius: 10px;
            z-index: 9999999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #333;
            color: white;
        `;
        header.innerHTML = `
            <span style="font-size: 18px;">🎲 COC角色管理</span>
            <button id="coc-close-btn" style="
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0 8px;
            ">✖</button>
        `;
        
        // 内容区（可滚动）
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: var(--bg-color, #1a1a1a);
        `;
        
        // 先放一些测试内容
        content.innerHTML = `
            <div style="margin-bottom: 15px;">
                <select style="width:100%; padding:8px;">
                    <option>选择角色</option>
                </select>
            </div>
            <div style="background:#333; padding:10px; border-radius:5px;">
                <pre>{"测试":"数据"}</pre>
            </div>
            <button style="width:100%; padding:10px; margin-top:10px; background:#4CAF50;">保存</button>
        `;
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // 关闭功能
        document.getElementById('coc-close-btn').onclick = () => {
            panel.remove();
        };
        
        // 再加一个浮动按钮（右下角安全区）
        const floatBtn = document.createElement('button');
        floatBtn.id = 'coc-float-btn';
        floatBtn.textContent = '🎲';
        floatBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #4CAF50;
            color: white;
            border: none;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999999;
            cursor: pointer;
        `;
        floatBtn.onclick = () => {
            if (panel.style.display === 'none') {
                panel.style.display = 'flex';
            } else {
                panel.style.display = 'none';
            }
        };
        document.body.appendChild(floatBtn);
        
        alert('✅ 面板已添加到安全区域');
    }
    
    waitForBody();
})();
