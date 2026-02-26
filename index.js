// COC骰子系统 - 修正版
// 使用正确的API发送消息

(function() {
    'use strict';

    // 等待SillyTavern加载完成
    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 1. 基础骰子命令 ====================
            context.registerSlashCommand('d', (args, value) => {
                // 解析骰子表达式: d100, d20, d6
                const diceType = value || '100';
                const max = parseInt(diceType) || 100;
                const roll = Math.floor(Math.random() * max) + 1;
                
                // ✅ 正确API：直接调用 sendMessage (不是context.sendMessage)
                sendMessage(`🎲 掷出 d${max} = **${roll}**`, 'system');
                
                return '';
            }, ['roll'], '掷骰子，例如 /d100、/d20、/d6');
            
            // ==================== 2. COC技能检定命令 ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 获取技能名
                const skillName = value || (args && args[0]) || '未知技能';
                
                // 获取当前说话的角色
                const speaker = context.name2 || '未知角色';
                
                // 掷D100骰子
                const roll = Math.floor(Math.random() * 100) + 1;
                
                // 假设技能值50
                const skillValue = 50;
                
                // COC成功等级判定
                let result = '';
                
                if (roll === 100) {
                    result = '💀 **大失败**';
                } else if (roll >= 96 && skillValue < 50) {
                    result = '💀 **大失败**';
                } else if (roll <= skillValue / 5) {
                    result = '✨ **极难成功**';
                } else if (roll <= skillValue / 2) {
                    result = '⭐ **困难成功**';
                } else if (roll <= skillValue) {
                    result = '✅ **成功**';
                } else {
                    result = '❌ **失败**';
                }
                
                // 构建消息
                const message = `**${speaker}** 进行 **${skillName}** 检定\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${result}`;
                
                // ✅ 正确API
                sendMessage(message, 'system');
                
                return '';
            }, ['cocroll', 'cr'], 'COC技能检定，例如 /coc 侦查');
            
            // ==================== 3. 指定角色发言命令 ====================
            context.registerSlashCommand('sayas', (args, value) => {
                // 格式: /sayas 角色名 要说的内容
                const parts = (value || '').split(' ');
                const characterName = parts[0];
                const message = parts.slice(1).join(' ') || '...';
                
                if (!characterName) {
                    sendMessage('❌ 请指定角色名: /sayas 李昂 你好', 'system');
                    return '';
                }
                
                // ✅ 使用官方 /sendas 命令的功能
                // 注意：这里直接用 sendMessage 并指定角色名
                sendMessage(message, characterName);
                
                return '';
            }, [], '以指定角色身份发言，例如 /sayas 李昂 你好');
            
            // ==================== 4. 测试命令 ====================
            context.registerSlashCommand('cotest', () => {
                const info = `当前角色: ${context.name2}\n` +
                            `聊天条数: ${context.chat?.length || 0}\n` +
                            `是否群聊: ${context.groupId ? '是' : '否'}`;
                
                sendMessage(`📊 调试信息\n${info}`, 'system');
                return '';
            }, [], '显示调试信息');
            
            // ==================== 5. 内置骰子命令（官方推荐） ====================
            // 官方文档有 /roll 命令，但我们用自己的实现更灵活
            // 参考官方文档：/roll 2d6 [citation:1]
            
            // 弹出成功提示
            alert('✅ COC命令注册成功！\n\n' +
                  '可用命令:\n' +
                  '/d100 - 掷D100骰子\n' +
                  '/coc 技能名 - 技能检定\n' +
                  '/sayas 角色名 内容 - 指定角色发言\n' +
                  '/cotest - 显示调试信息\n\n' +
                  '所有结果都会在聊天窗口显示');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();

// ✅ 全局辅助函数：发送消息
function sendMessage(text, sender) {
    // sender 可以是 'system' 或角色名
    if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
        console.error('SillyTavern not ready');
        return;
    }
    
    const context = SillyTavern.getContext();
    
    // 根据官方文档，发送消息的正确方式
    if (sender === 'system') {
        // 使用内置的 /sys 命令功能
        context.executeSlashCommands(`/sys ${text}`);
    } else {
        // 使用内置的 /sendas 命令功能 [citation:1]
        context.executeSlashCommands(`/sendas ${sender} ${text}`);
    }
}
