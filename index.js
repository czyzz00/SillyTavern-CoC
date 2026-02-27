// COC角色管理 - 精准拖动版
(function() {
    alert('🔵 COC扩展启动');
    
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        buildDraggableUI();
    }
    
    function buildDraggableUI() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        // 找到顶部栏高度
        const topBar = document.querySelector('[class*="header"]') || 
                      document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        const safeTop = topBarHeight + 5;
        const safeBottom = winHeight - 60;
        
        // ==================== 创建可拖动悬浮球 ====================
        const floatingBall = document.createElement('div');
        floatingBall.id = 'coc-floating-ball';
        floatingBall.textContent = '🎲';
        floatingBall.style.cssText = `
            position: fixed;
            top: ${safeTop + 20}px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: #4CAF50;
            color: white;
            font-size: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999998;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
        `;
        
        document.body.appendChild(floatingBall);
        
        // ==================== 拖动功能（修正版）====================
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        let currentLeft = safeTop + 20;
        let currentRight = 20;
        
        // 获取元素当前位置（使用getBoundingClientRect，最准确）
        function getCurrentPosition() {
            const rect = floatingBall.getBoundingClientRect();
            return {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom
            };
        }
        
        function onTouchStart(e) {
            e.preventDefault();
            const touch = e.touches[0];
            
            // 记录手指起始位置
            startX = touch.clientX;
            startY = touch.clientY;
            
            // 记录元素当前位置
            const pos = getCurrentPosition();
            startLeft = pos.left;
            startTop = pos.top;
            
            // 重置transform，因为我们要用top/left定位
            floatingBall.style.transform = 'none';
            floatingBall.style.top = startTop + 'px';
            floatingBall.style.left = startLeft + 'px';
            floatingBall.style.right = 'auto'; // 取消right定位
            
            isDragging = false;
        }
        
        function onTouchMove(e) {
            e.preventDefault();
            if (startX === undefined || startY === undefined) return;
            
            const touch = e.touches[0];
            
            // 计算手指移动距离
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            // 如果移动距离超过5px，认为是拖动
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                isDragging = true;
            }
            
            // 计算新位置
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // 边界限制
            newLeft = Math.max(0, Math.min(winWidth - 56, newLeft));
            newTop = Math.max(safeTop, Math.min(safeBottom, newTop));
            
            // 直接设置top/left定位
            floatingBall.style.top = newTop + 'px';
            floatingBall.style.left = newLeft + 'px';
        }
        
        function onTouchEnd(e) {
            e.preventDefault();
            
            if (!isDragging) {
                // 这是点击事件，打开面板
                togglePanel();
            }
            
            // 保存当前位置到变量
            const pos = getCurrentPosition();
            currentLeft = pos.left;
            currentTop = pos.top;
            
            // 重置
            startX = startY = undefined;
            isDragging = false;
        }
        
        // 绑定触摸事件
        floatingBall.addEventListener('touchstart', onTouchStart, { passive: false });
        floatingBall.addEventListener('touchmove', onTouchMove, { passive: false });
        floatingBall.addEventListener('touchend', onTouchEnd);
        floatingBall.addEventListener('touchcancel', onTouchEnd);
        
        // ==================== 创建主面板 ====================
        const panel = document.createElement('div');
        panel.id = 'coc-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${safeTop}px;
            left: 10px;
            width: ${winWidth - 20}px;
            height: 400px;
            background: var(--bg-color, #1a1a1a);
            border: 1px solid var(--border-color, #444);
            border-radius: 12px;
            z-index: 9999999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        `;
        
        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--bg-secondary, #333);
            border-bottom: 1px solid var(--border-color, #444);
        `;
        header.innerHTML = `
            <span style="font-size: 18px; font-weight: bold;">🎲 COC角色管理</span>
            <button id="coc-close-panel" style="
                background: none;
                border: none;
                color: var(--text-color);
                font-size: 20px;
                cursor: pointer;
                padding: 0 8px;
            ">✖</button>
        `;
        
        // 内容区（可滚动）
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: var(--bg-color, #1a1a1a);
        `;
        
        // 填充内容
        content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <label style="display:block; margin-bottom:4px;">选择角色</label>
                <select id="coc-role-select" style="width:100%; padding:10px; border-radius:6px;">
                    <option value="">-- 请选择 --</option>
                </select>
            </div>
            
            <div id="coc-stats-display" style="background:#2a2a2a; padding:12px; border-radius:6px; margin-bottom:16px;">
                <pre style="margin:0; font-size:12px;">未选择角色</pre>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block; margin-bottom:4px;">新建角色</label>
                <input type="text" id="coc-new-name" placeholder="角色名" style="width:100%; padding:10px; margin-bottom:8px; border-radius:6px;">
                <textarea id="coc-new-data" placeholder='{"STR":70,"skills":{"侦查":80}}' rows="4" style="width:100%; padding:10px; border-radius:6px; font-family:monospace;"></textarea>
                <button id="coc-save-new" style="width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:6px; margin-top:8px;">保存新角色</button>
            </div>
            
            <div style="display:flex; gap:8px;">
                <button class="coc-example" data-example='{"STR":70,"skills":{"侦查":80}}' style="flex:1; padding:8px; background:#2196F3;">李昂示例</button>
                <button class="coc-example" data-example='{"STR":60,"skills":{"侦查":90}}' style="flex:1; padding:8px; background:#9C27B0;">张薇示例</button>
            </div>
        `;
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // ==================== 面板功能 ====================
        function togglePanel() {
            if (panel.style.display === 'none') {
                panel.style.display = 'flex';
                // 刷新下拉列表（后续实现）
            } else {
                panel.style.display = 'none';
            }
        }
        
        // 关闭按钮
        document.getElementById('coc-close-panel').onclick = () => {
            panel.style.display = 'none';
        };
        
        // 示例按钮
        document.querySelectorAll('.coc-example').forEach(btn => {
            btn.onclick = () => {
                document.getElementById('coc-new-data').value = 
                    JSON.stringify(JSON.parse(btn.dataset.example), null, 2);
            };
        });
        
        alert('✅ 精准拖动悬浮球已创建');
    }
    
    waitForBody();
})();
