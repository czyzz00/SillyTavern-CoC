// COC骰子系统 - 简易测试版
// 基于 SillyTavern 1.15+ 的 SlashCommand API

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
                
                // 发送消息到聊天窗口（作为系统消息）
                context.sendMessage(`🎲 掷出 d${max} = **${roll}**`, 'system');
                
                return ''; // Slash命令需要返回空字符串
            }, ['roll'], '掷骰子，例如 /d100、/d20、/d6');
            
            // ==================== 2. COC技能检定命令 ====================
            context.registerSlashCommand('coc', (args, value) => {
                // 获取技能名（可以是参数或值）
                const skillName = value || (args && args[0]) || '未知技能';
                
                // 获取当前说话的角色
                const speaker = context.name2 || '未知角色';
                
                // 掷D100骰子
                const roll = Math.floor(Math.random() * 100) + 1;
                
                // 假设技能值50（后续可以从世界书读取）
                const skillValue = 50;
                
                // COC成功等级判定
                let result = '';
                let color = '';
                
                if (roll === 100) {
                    result = '💀 **大失败**';
                    color = 'red';
                } else if (roll >= 96 && skillValue < 50) {
                    result = '💀 **大失败**';
                    color = 'red';
                } else if (roll <= skillValue / 5) {
                    result = '✨ **极难成功**';
                    color = 'purple';
                } else if (roll <= skillValue / 2) {
                    result = '⭐ **困难成功**';
                    color = 'blue';
                } else if (roll <= skillValue) {
                    result = '✅ **成功**';
                    color = 'green';
                } else {
                    result = '❌ **失败**';
                    color = 'gray';
                }
                
                // 构建消息 - 使用Markdown格式
                const message = `**${speaker}** 进行 **${skillName}** 检定\n` +
                               `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                               `结果: ${result}`;
                
                // 发送消息到聊天窗口（作为系统消息）
                context.sendMessage(message, 'system');
                
                return '';
            }, ['cocroll', 'cr'], 'COC技能检定，例如 /coc 侦查');
            
            // ==================== 3. 指定角色发言命令 ====================
            context.registerSlashCommand('sayas', (args, value) => {
                // 格式: /sayas 角色名 要说的内容
                // 或者: /sayas 角色名 "要说的内容"
                
                // 解析参数
                const parts = (value || '').split(' ');
                const characterName = parts[0];
                const message = parts.slice(1).join(' ') || '...';
                
                if (!characterName) {
                    context.sendMessage('❌ 请指定角色名: /sayas 李昂 你好', 'system');
                    return '';
                }
                
                // 发送消息作为指定角色
                context.sendMessage(message, characterName);
                
                return '';
            }, [], '以指定角色身份发言，例如 /sayas 李昂 你好');
            
            // ==================== 4. 测试命令 ====================
            context.registerSlashCommand('cotest', () => {
                // 显示当前上下文信息（调试用）
                const info = `当前角色: ${context.name2}\n` +
                            `聊天条数: ${context.chat?.length || 0}\n` +
                            `是否群聊: ${context.groupId ? '是' : '否'}`;
                
                context.sendMessage(`📊 调试信息\n${info}`, 'system');
                return '';
            }, [], '显示调试信息');
            
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
    }, 2000); // 等待2秒确保SillyTavern完全加载
})();
