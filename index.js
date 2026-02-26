// COC骰子系统 - 基于测试结果优化版
// 利用内置命令，避免冲突

(function() {
    'use strict';

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();
            
            // ==================== 1. 基础骰子命令 ====================
            // 注意：不用注册 /d，直接用内置的 /roll
            // 官方内置：/roll 2d6, /roll d100 都支持 [citation:2]
            
            // ==================== 2. COC技能检定命令 ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 获取技能名
                const skillName = value || (args && args[0]) || '未知技能';
                
                // 获取当前说话的角色
                const speaker = context.name2 || '未知角色';
                
                // 掷D100骰子 - 使用内置roll命令的结果
                // 这里我们直接生成随机数，避免依赖其他命令
                const roll = Math.floor(Math.random() * 100) + 1;
                const skillValue = 50; // 默认技能值
                
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
                
                // 使用内置 /sys 命令发送系统消息
                context.executeSlashCommands(`/sys ${message}`);
                
                return '';
            }, ['cocroll', 'cr'], 'COC技能检定，例如 /coc 侦查');
            
            // ==================== 3. 指定角色发言命令 ====================
            context.registerSlashCommand('sayas', (args, value) => {
                // 格式: /sayas 角色名 要说的内容
                const parts = (value || '').split(' ');
                const characterName = parts[0];
                const message = parts.slice(1).join(' ') || '...';
                
                if (!characterName) {
                    context.executeSlashCommands('/sys ❌ 请指定角色名: /sayas 李昂 你好');
                    return '';
                }
                
                // 使用内置 /sendas 命令发送角色消息 [citation:2]
                context.executeSlashCommands(`/sendas ${characterName} ${message}`);
                
                return '';
            }, [], '以指定角色身份发言，例如 /sayas 李昂 你好');
            
            // ==================== 4. 调试命令 ====================
            context.registerSlashCommand('cotest', () => {
                const info = `当前角色: ${context.name2}\n` +
                            `聊天条数: ${context.chat?.length || 0}\n` +
                            `内置命令可用: /roll, /sys, /sendas`;
                
                context.executeSlashCommands(`/sys 📊 调试信息\n${info}`);
                return '';
            }, [], '显示调试信息');
            
            // 弹出成功提示
            alert('✅ COC命令注册成功！\n\n' +
                  '可用命令:\n' +
                  '/roll d100 - 掷D100骰子 (内置命令)\n' +
                  '/coc 技能名 - 技能检定\n' +
                  '/sayas 角色名 内容 - 指定角色发言\n' +
                  '/cotest - 显示调试信息\n\n' +
                  '所有结果都会在聊天窗口显示，不消耗API');
            
        } catch (error) {
            alert('❌ 初始化失败: ' + error.message);
        }
    }, 2000);
})();
