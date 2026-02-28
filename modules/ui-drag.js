// ==================== 悬浮球拖动功能 ====================

function setupDraggableBall(floatingBall, togglePanel, safeTop, safeBottom, winWidth) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    floatingBall.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        const rect = floatingBall.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        floatingBall.style.transform = 'none';
        floatingBall.style.top = startTop + 'px';
        floatingBall.style.left = startLeft + 'px';
        floatingBall.style.right = 'auto';
        
        isDragging = false;
    }, { passive: false });

    floatingBall.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (startX === undefined) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            isDragging = true;
        }
        
        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;
        
        newLeft = Math.max(0, Math.min(winWidth - 56, newLeft));
        newTop = Math.max(safeTop, Math.min(safeBottom, newTop));
        
        floatingBall.style.top = newTop + 'px';
        floatingBall.style.left = newLeft + 'px';
    }, { passive: false });

    floatingBall.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        if (!isDragging) {
            togglePanel();
        }
        
        startX = startY = undefined;
        isDragging = false;
    });

    floatingBall.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        startX = startY = undefined;
        isDragging = false;
    });
}
