// ==================== COC7 完整工具包 - 主入口 ====================

(function() {
    'use strict';

    // 动态加载所有模块
    async function loadModules() {
        const basePath = '/scripts/extensions/third-party/SillyTavern-CoC/modules/';
        
        // 按依赖顺序加载
        const modules = [
            'core.js',           // 核心函数，无依赖
            'data.js',           // 依赖 core
            'slash-commands.js', // 依赖 core, data
            'function-calls.js', // 依赖 core, data
            'character-panel.js',// 依赖 core, data
            'ui-drag.js'         // 无依赖
        ];
        
        for (const module of modules) {
            try {
                await import(basePath + module);
                console.log(`[COC] 加载模块: ${module}`);
            } catch (e) {
                console.error(`[COC] 加载模块失败: ${module}`, e);
            }
        }
    }

    // 等待body存在
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        waitForContext();
    }

    // 等待SillyTavern上下文
    function waitForContext() {
        if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
            setTimeout(waitForContext, 200);
            return;
        }
        
        try {
            const context = SillyTavern.getContext();
            
            // 先加载模块
            loadModules().then(() => {
                // 所有模块加载完成后，初始化
                initialize(context);
            });
            
        } catch (e) {
            console.error('[COC] 获取context失败:', e);
            setTimeout(waitForContext, 200);
        }
    }

    // 初始化（此时所有模块已可用）
    function initialize(context) {
        // 模块加载后，全局会有这些对象
        // core, data, slashCommands, functionCalls, panel, drag
        
        // 1. 初始化数据存储
        const data = new CharacterData(context);
        
        // 2. 计算安全区域
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const topBar = document.querySelector('[class*="header"]') || document.querySelector('[class*="top"]');
        const topBarHeight = topBar ? topBar.getBoundingClientRect().height : 0;
        const safeTop = topBarHeight + 5;
        const safeBottom = winHeight - 60;
        
        // 3. 创建浮动球
        const floatingBall = document.createElement('div');
        floatingBall.className = 'coc-floating-ball';
        floatingBall.id = 'coc-floating-ball';
        floatingBall.textContent = '🎲';
        floatingBall.style.top = (safeTop + 20) + 'px';
        floatingBall.style.right = '20px';
        document.body.appendChild(floatingBall);
        
        // 4. 构建角色卡面板
        const buildPanel = registerCharacterPanel(context, data, core);
        let panelBuilt = false;
        
        function togglePanel() {
            if (!panelBuilt) {
                buildPanel();
                panelBuilt = true;
            }
            const panel = document.getElementById('coc-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            }
        }
        
        // 5. 设置拖动
        setupDraggableBall(floatingBall, togglePanel, safeTop, safeBottom, winWidth);
        
        // 6. 注册命令
        registerSlashCommands(context, data, core);
        
        // 7. 注册函数调用
        if (context.isToolCallingSupported()) {
            registerFunctionCalls(context, data, core);
        }
        
        // 8. 提示
        const kpName = data.getKP();
        alert(`✅ COC7完整工具包加载成功！`);
    }

    // 启动
    waitForBody();
})();
