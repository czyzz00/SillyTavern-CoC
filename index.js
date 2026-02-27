// 最简单的诊断代码
(function() {
    // 第一步：弹窗确认JS已执行
    alert('🔵 COC扩展JS已加载');
    
    // 第二步：轮询body并添加红色方块
    function checkBody() {
        if (!document.body) {
            alert('🟡 body不存在，等待中...');
            setTimeout(checkBody, 500);
            return;
        }
        
        alert('🟢 body已存在，准备添加元素');
        
        // 添加红色方块
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '10px';
        div.style.left = '10px';
        div.style.width = '100px';
        div.style.height = '100px';
        div.style.backgroundColor = 'red';
        div.style.zIndex = '9999999';
        div.style.color = 'white';
        div.style.padding = '10px';
        div.textContent = 'COC';
        
        document.body.appendChild(div);
        alert('✅ 元素已添加到body');
    }
    
    checkBody();
})();
