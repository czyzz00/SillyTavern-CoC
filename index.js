alert('COC扩展加载');

export async function onLoad() {
    alert('onLoad执行');
    
    // 等待页面完全加载
    setTimeout(() => {
        // 查找左下角区域
        const bottomLeft = document.querySelector('.bottom-bar, .footer, [class*="bottom"]');
        
        if (bottomLeft) {
            const btn = document.createElement('button');
            btn.textContent = '🎲 COC';
            btn.style.cssText = `
                padding: 8px 12px;
                margin: 5px;
                background: #8B4513;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `;
            btn.onclick = () => {
                alert('COC规则面板');
                showCOCDialog();
            };
            bottomLeft.appendChild(btn);
            alert('按钮已添加到左下角');
        } else {
            alert('未找到左下角区域');
        }
    }, 3000);
}

function showCOCDialog() {
    // 使用SillyTavern的弹窗API
    const context = SillyTavern.getContext();
    if (context.createPopup) {
        context.createPopup({
            title: 'COC规则',
            content: '这是COC规则测试',
            buttons: ['确定']
        });
    } else {
        alert('COC规则测试');
    }
}
