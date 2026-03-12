// ==================== 悬浮球拖动功能 ====================

function setupDraggableBall(floatingBall, togglePanel, safeTop, safeBottom, winWidth) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    function beginDrag(clientX, clientY) {
        startX = clientX;
        startY = clientY;

        const rect = floatingBall.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        floatingBall.style.transform = 'none';
        floatingBall.style.top = startTop + 'px';
        floatingBall.style.left = startLeft + 'px';
        floatingBall.style.right = 'auto';

        isDragging = false;
    }

    function moveDrag(clientX, clientY) {
        if (startX === undefined) return;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            isDragging = true;
        }

        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;

        newLeft = Math.max(0, Math.min(winWidth - 56, newLeft));
        newTop = Math.max(safeTop, Math.min(safeBottom, newTop));

        floatingBall.style.top = newTop + 'px';
        floatingBall.style.left = newLeft + 'px';
    }

    function endDrag() {
        if (!isDragging) {
            togglePanel();
        }

        startX = startY = undefined;
        isDragging = false;
    }

    floatingBall.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        beginDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    floatingBall.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        moveDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    floatingBall.addEventListener('touchend', (e) => {
        e.preventDefault();
        endDrag();
    });

    floatingBall.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        startX = startY = undefined;
        isDragging = false;
    });

    floatingBall.addEventListener('mousedown', (e) => {
        e.preventDefault();
        beginDrag(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (startX === undefined) return;
        moveDrag(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', (e) => {
        if (startX === undefined) return;
        e.preventDefault();
        endDrag();
    });
}
