// COC骰子系统 - 支持AI自动触发版

(function() {
    'use strict';

    let isProcessingAI = false; // 防止递归触发

    setTimeout(() => {
        try {
            const context = SillyTavern.getContext();

            /* ===============================
               核心骰子处理函数（统一入口）
            =============================== */
            function handleCocCommand(input, speaker) {
                input = input.trim();
                let message = '';

                // 纯数字
                if (/^\d+$/.test(input)) {
                    const max = parseInt(input);
                    const roll = Math.floor(Math.random() * max) + 1;
                    message = `🎲 ${speaker} 掷出 d${max} = **${roll}**`;
                }

                // 骰子公式
                else if (/^\d*d\d+([+-]\d+)?$/i.test(input)) {
                    try {
                        const result = parseDiceFormula(input);
                        message = `🎲 ${speaker} 掷出 ${input} = `;
                        message += result.details
                            ? `${result.details} = **${result.total}**`
                            : `**${result.total}**`;
                    } catch (e) {
                        message = `❌ 骰子公式错误: ${input}`;
                    }
                }

                // 技能检定
                else if (input) {
                    const roll = Math.floor(Math.random() * 100) + 1;
                    const skillValue = 50;

                    let result = '';
                    let emoji = '';

                    if (roll === 100 || (roll >= 96 && skillValue < 50)) {
                        result = '大失败'; emoji = '💀';
                    } else if (roll <= Math.floor(skillValue / 5)) {
                        result = '极难成功'; emoji = '✨';
                    } else if (roll <= Math.floor(skillValue / 2)) {
                        result = '困难成功'; emoji = '⭐';
                    } else if (roll <= skillValue) {
                        result = '成功'; emoji = '✅';
                    } else {
                        result = '失败'; emoji = '❌';
                    }

                    message = `**${speaker}** 进行 **${input}** 检定\n` +
                              `🎲 D100 = \`${roll}\` | 技能值 \`${skillValue}\`\n` +
                              `结果: ${emoji} **${result}**`;
                }

                else {
                    message = '❌ 用法: /coc 100 或 /coc 侦查 或 /coc 2d6+3';
                }

                appendMessageToChat(speaker, message);
            }

            /* ===============================
               注册 Slash 命令
            =============================== */
            context.registerSlashCommand(
                'coc',
                (args, value) => {
                    const speaker = context.name2 || '未知角色';
                    handleCocCommand(value || '', speaker);
                    return '';
                },
                ['cocroll', 'cr'],
                'COC多功能命令'
            );

            /* ===============================
               监听 AI 消息自动触发
            =============================== */
            if (context.eventSource) {
                context.eventSource.on('ai_message', (event) => {
                    if (isProcessingAI) return;

                    const text = event?.data?.message || '';
                    const match = text.match(/\/coc\s+([^\n]+)/i);

                    if (match) {
                        isProcessingAI = true;

                        const speaker = context.name2 || 'AI';
                        const commandArg = match[1];

                        handleCocCommand(commandArg, speaker);

                        setTimeout(() => {
                            isProcessingAI = false;
                        }, 100);
                    }
                });
            }

            console.log('✅ COC命令注册 + AI监听成功');

        } catch (error) {
            console.error('❌ 初始化失败:', error);
        }

    }, 2000);
})();
