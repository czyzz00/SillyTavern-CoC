// ==================== COC7 完整工具包 - 最终修复版 ====================
(function() {
    'use strict';

    // 用传统script标签加载模块（最稳妥）
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`[COC] 加载成功: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`[COC] 加载失败: ${src}`);
                reject(new Error(`加载失败: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    // 按顺序加载所有模块
    async function loadAllModules() {
        const basePath = '/scripts/extensions/third-party/SillyTavern-CoC/modules/';
        const modules = [
            'core.js',
            'data.js',
            'slash-commands.js',
            'function-calls.js',
            'character-panel.js',
            'ui-drag.js'
        ];
        
        for (const module of modules) {
            try {
                await loadScript(basePath + module);
                console.log(`[COC] ✅ ${module} 加载成功`);
            } catch (e) {
                console.error(`[COC] ❌ ${module} 加载失败`);
                alert(`❌ 加载失败: ${module}\n请检查文件是否存在`);
                return false;
            }
        }
        return true;
    }

    // 等待body存在
    function waitForBody() {
        if (!document.body) {
            setTimeout(waitForBody, 100);
            return;
        }
        // body存在后，先加载模块
        loadAllModules().then(success => {
            if (success) {
                waitForContext();
            }
        });
    }

    // 等待SillyTavern上下文
    function waitForContext() {
        if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
            setTimeout(waitForContext, 200);
            return;
        }
        
        try {
            const context = SillyTavern.getContext();
            initialize(context);
        } catch (e) {
            console.error('[COC] 获取context失败:', e);
            setTimeout(waitForContext, 200);
        }
    }

    // 初始化所有功能
    function initialize(context) {
        try {
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
            
            // 6. 注册斜杠命令
            registerSlashCommands(context, data, core);
            
            // 7. 注册函数调用
            if (context.isToolCallingSupported()) {
                registerFunctionCalls(context, data, core);
            }
            
            // 8. 成功提示
            const kpName = data.getKP();
            alert(`✅ COC7完整工具包加载成功！\n\n` +
                  `🎲 点击右下角球打开角色面板\n` +
                  `📝 输入 /coc 侦查 @角色 测试`);
            
        } catch (e) {
            console.error('[COC] 初始化失败:', e);
            alert('❌ 初始化失败: ' + e.message);
        }
    }

    // 启动
    waitForBody();
})();
