// COC角色管理 - UI位置探测器
(function() {
    alert('🔵 开始探测UI位置');
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        
        detectUI();
    }
    
    function detectUI() {
        // 1. 获取各种尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        
        // 2. 获取可能遮挡的元素
        const possibleObstructions = [];
        
        // 检查底部导航栏
        const bottomNav = document.querySelector('[class*="bottom"]') || 
                         document.querySelector('[class*="nav"]') ||
                         document.querySelector('[class*="footer"]');
        
        // 检查顶部栏
        const topBar = document.querySelector('[class*="header"]') ||
                      document.querySelector('[class*="top"]') ||
                      document.querySelector('[class*="navbar"]');
        
        // 3. 收集信息
        let info = `📱 UI位置探测结果\n\n`;
        info += `窗口尺寸: ${windowWidth} x ${windowHeight}\n`;
        info += `屏幕尺寸: ${screenWidth} x ${screenHeight}\n`;
        info += `设备像素比: ${window.devicePixelRatio}\n\n`;
        
        if (topBar) {
            const rect = topBar.getBoundingClientRect();
            info += `顶部栏: height=${rect.height}px\n`;
        }
        
        if (bottomNav) {
            const rect = bottomNav.getBoundingClientRect();
            info += `底部栏: height=${rect.height}px, bottom=${rect.bottom}px\n`;
        }
        
        // 4. 测试位置
        info += `\n测试位置:\n`;
        info += `屏幕顶部(0): 可见\n`;
        info += `屏幕底部(${windowHeight}): 可见\n`;
        info += `中间(${windowHeight/2}): 可见\n`;
        
        // 5. 分多次弹窗显示（避免一次太长）
        alert(info);
        
        // 6. 测试不同位置的元素是否能显示
        testPositions();
    }
    
    function testPositions() {
        const positions = [
            { top: 10, left: 10, name: '左上角' },
            { top: 10, right: 10, name: '右上角' },
            { bottom: 10, left: 10, name: '左下角' },
            { bottom: 10, right: 10, name: '右下角' },
            { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', name: '正中间' }
        ];
        
        positions.forEach((pos, index) => {
            const div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.background = ['red', 'blue', 'green', 'yellow', 'purple'][index];
            div.style.color = 'white';
            div.style.padding = '10px';
            div.style.zIndex = '9999999';
            div.style.fontSize = '16px';
            div.textContent = pos.name;
            
            // 应用位置样式
            Object.assign(div.style, pos);
            
            document.body.appendChild(div);
            
            // 弹窗确认
            alert(`✅ 已添加${pos.name}的${['红色','蓝色','绿色','黄色','紫色'][index]}方块`);
        });
        
        alert('🎯 所有测试元素已添加，请截图告诉我哪些能看到');
    }
    
    waitForBody();
})();
