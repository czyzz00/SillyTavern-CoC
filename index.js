/**
 * COC Universal Core - 测试版本
 * 完全符合 SillyTavern 1.15 规范
 */

(function() {
    'use strict';

    const extensionName = 'coc-universal-core-test';

    // 注册扩展
    SillyTavern.registerExtension(extensionName, {
        onLoad: onExtensionLoad
    });

    function onExtensionLoad() {
        console.log('[COC测试] 扩展加载成功');

        // 注册面板 - 这会自动在侧边栏（三道杠）生成菜单项
        SillyTavern.registerPanel('coc-test-panel', {
            title: 'COC测试',           // 侧边栏显示的标题
            html: getPanelHTML(),        // 面板内容
            onShow: (panelElement) => {
                console.log('[COC测试] 面板显示');
                // 可以在这里初始化面板内容
                const content = panelElement.querySelector('#coc-test-content');
                if (content) {
                    content.innerHTML = '<p style="padding: 20px; color: green;">✅ 扩展加载成功！</p>';
                }
            },
            onHide: () => {
                console.log('[COC测试] 面板隐藏');
            }
        });

        console.log('[COC测试] 面板注册完成');
    }

    // 面板HTML内容
    function getPanelHTML() {
        return `
            <div style="padding: 20px; font-family: sans-serif;">
                <h2>COC测试面板</h2>
                <div id="coc-test-content">
                    <p>正在加载...</p>
                </div>
                <hr>
                <div style="margin-top: 20px;">
                    <p><strong>调试信息：</strong></p>
                    <p>扩展名称：${extensionName}</p>
                    <p>当前时间：${new Date().toLocaleString()}</p>
                </div>
            </div>
        `;
    }

})();
