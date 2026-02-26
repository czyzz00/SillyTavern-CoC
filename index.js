// 当前
if (typeof context.saveChat === 'function') {
    context.saveChat();
}

// 修正为
if (typeof context.saveMetadata === 'function') {
    context.saveMetadata(); // 保存聊天元数据
}
// 或者直接依赖自动保存
