// COC测试扩展 - 确保能用的版本
(function() {
    console.log('[COC] 扩展加载');
    
    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // 直接添加到DOM - 这是最可靠的方法
            const waitForSidebar = setInterval(() => {
                const sidebar = document.querySelector('#extensions-menu') || 
                               document.querySelector('.extensions_menu') ||
                               document.querySelector('[data-extension-buttons]');
                
                if (sidebar) {
                    clearInterval(waitForSidebar);
                    
                    const btn = document.createElement('div');
                    btn.className = 'extension_button';
                    btn.innerHTML = '🎲 COC';
                    btn.style.cssText = 'padding: 8px; cursor: pointer;';
                    btn.onclick = () => {
                        // 使用callPopup显示面板
                        if (typeof context.callPopup === 'function') {
                            context.callPopup(`
                                <div style="padding: 20px;">
                                    <h2>COC测试面板</h2>
                                    <p>✅ 扩展加载成功！</p>
                                    <p>版本: 1.0.0</p>
                                </div>
                            `, 'text');
                        } else {
                            alert('COC测试面板');
                        }
                    };
                    
                    sidebar.appendChild(btn);
                    console.log('[COC] 按钮添加成功');
                }
            }, 1000);
            
        } catch (e) {
            console.error('[COC] 错误:', e);
        }
    }, 2000);
})();
