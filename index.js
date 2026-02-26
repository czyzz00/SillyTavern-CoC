// 第1步：文件被加载
alert('🔵 [1/7] COC扩展文件被加载');

// 第2步：等待SillyTavern初始化
setTimeout(() => {
    alert('🟡 [2/7] 开始初始化扩展');
    
    try {
        // 第3步：获取上下文
        const context = SillyTavern.getContext();
        alert('🟢 [3/7] 获取上下文成功\n\n' +
              '当前角色: ' + (context.name2 || '无') + '\n' +
              '聊天条数: ' + (context.chat?.length || 0));
        
        // 第4步：检查扩展设置
        const extensionName = 'coc-universal-core';
        if (!context.extensionSettings[extensionName]) {
            context.extensionSettings[extensionName] = {};
            context.saveSettingsDebounced();
            alert('🟢 [4/7] 已初始化扩展设置');
        } else {
            alert('🟢 [4/7] 扩展设置已存在');
        }
        
        // 第5步：检查可用的API
        const methods = Object.keys(context).filter(k => typeof context[k] === 'function');
        alert('🟢 [5/7] context共有 ' + methods.length + ' 个方法\n' +
              '前5个: ' + methods.slice(0, 5).join(', '));
        
        // 第6步：尝试注册Slash命令
        if (typeof context.registerSlashCommand === 'function') {
            context.registerSlashCommand('coc', (args, value) => {
                alert('🎲 COC命令执行\n参数: ' + args + '\n值: ' + value);
                return '';
            }, [], 'COC测试命令');
            alert('🟢 [6/7] Slash命令注册成功\n\n现在可以输入 /coc 测试');
        } else {
            alert('🔴 [6/7] registerSlashCommand 不可用');
        }
        
        // 第7步：完成
        alert('✅ [7/7] COC扩展初始化完成！\n\n' +
              '【重要】现在请：\n' +
              '1. 点左上角三道杠菜单\n' +
              '2. 点"扩展管理"或"Extensions"\n' +
              '3. 找到"COC测试面板"并启用\n\n' +
              '启用后输入 /coc 测试');
        
    } catch (error) {
        alert('❌ 错误: ' + error.message);
    }
}, 3000);

// 第8步：再等一会儿检查扩展是否被识别
setTimeout(() => {
    alert('🟣 [8/7] 检查扩展状态\n\n' +
          '如果看到这条弹窗，说明：\n' +
          '✓ 文件加载正常\n' +
          '✓ 定时器工作正常\n' +
          '✗ 但可能扩展未被SillyTavern识别\n\n' +
          '请确认manifest.json在正确位置');
}, 8000);
