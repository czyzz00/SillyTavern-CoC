(function() {
    alert('🔵 开始检测屏幕边界');
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        
        // 获取各种尺寸
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const screenHeight = screen.height;
        const screenWidth = screen.width;
        
        // 检查是否有底部导航栏占用空间
        const bodyHeight = document.body.clientHeight;
        const htmlHeight = document.documentElement.clientHeight;
        
        // 获取SillyTavern主要元素的位置
        const chatArea = document.getElementById('chat');
        const chatRect = chatArea?.getBoundingClientRect();
        
        // 组装信息
        const info = {
            window: `${windowWidth}x${windowHeight}`,
            screen: `${screenWidth}x${screenHeight}`,
            body: `${document.body.clientWidth}x${bodyHeight}`,
            html: `${document.documentElement.clientWidth}x${htmlHeight}`,
            chat: chatRect ? 
                `top:${Math.round(chatRect.top)} bottom:${Math.round(chatRect.bottom)} height:${Math.round(chatRect.height)}` : 
                '未找到'
        };
        
        // 显示信息
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 9999999;
            font-size: 14px;
            white-space: pre-wrap;
        `;
        div.textContent = JSON.stringify(info, null, 2);
        
        document.body.appendChild(div);
        
        setTimeout(() => div.remove(), 5000);
    }
    
    waitForBody();
})();
