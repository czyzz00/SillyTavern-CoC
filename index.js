// 调试版本 - 显示所有可用的context方法
alert('✅ COC扩展文件被加载');

setTimeout(() => {
    try {
        const context = SillyTavern.getContext();
        
        // 列出所有context的方法和属性
        let methods = [];
        for (let key in context) {
            try {
                if (typeof context[key] === 'function') {
                    methods.push(key);
                }
            } catch(e) {}
        }
        
        alert('可用context方法: ' + methods.join(', '));
        
        // 也检查SillyTavern全局对象
        let globalMethods = [];
        for (let key in SillyTavern) {
            try {
                if (typeof SillyTavern[key] === 'function') {
                    globalMethods.push(key);
                }
            } catch(e) {}
        }
        
        alert('可用SillyTavern全局方法: ' + globalMethods.join(', '));
        
    } catch (e) {
        alert('错误: ' + e.message);
    }
}, 3000);
