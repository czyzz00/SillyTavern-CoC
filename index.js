// 最简单版本
SillyTavern.registerExtension('coc-simple', {
    onLoad: () => {
        alert('COC扩展加载成功！');
        
        // 添加一个简单的按钮到侧边栏
        setTimeout(() => {
            const sidebar = document.querySelector('.sidebar-actions');
            if (sidebar) {
                const btn = document.createElement('button');
                btn.textContent = '🎲 COC';
                btn.onclick = () => {
                    alert('COC面板将在下个版本显示');
                };
                sidebar.appendChild(btn);
            }
        }, 2000);
    }
});
