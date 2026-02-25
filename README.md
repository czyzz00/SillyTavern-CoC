```markdown
# COC Universal Core

适用于SillyTavern的克苏鲁呼唤7版规则扩展

## 📦 安装扩展

### 方法1：Git克隆（推荐）
```bash
cd SillyTavern/scripts/extensions/third-party/
git clone https://github.com/yourusername/coc-universal-core.git
```

然后重启SillyTavern

方法2：手动下载

1. 下载本仓库的ZIP文件
2. 解压到 SillyTavern/scripts/extensions/third-party/coc-universal-core/
3. 重启SillyTavern

⚠️ 重要：额外资源需要手动导入

本扩展包含的资源文件不会自动加载，需要你手动导入：

📖 1. 导入世界书（必须）

世界书提供了COC规则和输出规范，让AI理解检定系统。

操作步骤：

1. 打开SillyTavern，进入任意聊天
2. 点击右上角的「世界信息」图标（🌐）
3. 点击「导入世界信息」按钮
4. 依次选择以下两个文件（需要分别导入）：
   · worldbooks/coc-rules.json - COC7版核心规则
   · worldbooks/coc-format.json - KP输出格式规范
5. 导入后记得在角色管理中为KP角色启用这两个世界书

文件位置：

· 如果你用Git克隆：SillyTavern/scripts/extensions/third-party/coc-universal-core/worldbooks/
· 如果你手动下载：在你解压的文件夹里

🎭 2. 导入KP角色卡（推荐）

KP角色卡是一个预设的COC主持人角色。

操作步骤：

1. 打开SillyTavern
2. 进入「角色管理」
3. 点击「导入角色」按钮
4. 选择 characters/KP-Universal.card.png
5. 导入成功后就可以开始和KP对话

注意： 角色卡是PNG格式，这是SillyTavern的标准格式，里面嵌入了JSON数据。

⚙️ 3. 导入预设（可选）

预设可以优化AI的回复质量。

操作步骤：

1. 打开SillyTavern
2. 点击顶部的预设下拉菜单
3. 选择「导入预设」
4. 选择 presets/COC-Serious.json
5. 导入后可以在预设列表中看到"COC-Serious"

📁 文件路径速查表

资源类型 源文件位置（在你的电脑上） 需要导入到的位置
扩展本身 scripts/extensions/third-party/coc-universal-core/ 无需导入，自动加载
世界书 同上的 worldbooks/ 文件夹 SillyTavern UI中导入
角色卡 同上的 characters/ 文件夹 SillyTavern UI中导入
预设 同上的 presets/ 文件夹 SillyTavern UI中导入

🎲 使用说明

第一步：创建并绑定调查员

1. 安装扩展后，在SillyTavern右侧会看到「COC角色管理」面板
2. 点击「新增角色」，创建你的调查员
3. 关键步骤：在"绑定角色名"中，输入SillyTavern中对应的角色名
   · 例如：如果你在和"John"对话，就在绑定名中输入"John"
4. 设置属性和技能值

第二步：进行检定

方法1：使用骰子面板

· 打开「COC骰子系统」面板
· 点击常用技能按钮，或输入自定义技能名

方法2：聊天中输入指令

```
.r 侦查        # 技能检定
.ra STR        # 属性检定
.r 图书馆使用   # 中文技能名也支持
```

方法3：Slash命令

```
/coc-roll 侦查
/coc-attr STR
```

第三步：让KP使用规则

· 确保KP角色已经启用了导入的两个世界书
· 当进行检定时，系统会发送【系统】消息
· KP会根据系统消息的结果进行叙事

❓ 常见问题

Q：为什么我安装了扩展，但看不到世界书和角色卡？
A：扩展只包含代码，世界书和角色卡需要按上面的步骤手动导入。

Q：世界书导入后怎么用？
A：在角色管理中，点击KP角色旁边的🌐图标，勾选导入的两个世界书。

Q：绑定角色名填什么？
A：填SillyTavern聊天界面显示的角色名，区分大小写。

Q：.r 指令没反应？
A：检查是否成功绑定了角色，以及技能名是否正确。

📜 许可证

MIT
