[English README](README.md)

# Chrome Extension: Find and Replace

这个 Chrome 扩展程序允许你在活动标签页的内容中搜索和替换文本。它支持全局和区分大小写的搜索，并提供一个弹出界面以便于访问。

## 功能

-   支持使用正则表达式搜索文本。
-   高亮显示搜索结果。
-   在特定 HTML 元素内替换文本。
-   处理 iframe 中的内容。

## 安装

1. 克隆仓库：

    ```
    git clone https://github.com/shengyanli1982/find-and-replace-chrome-extension.git
    ```

2. 打开 Chrome（或任何基于 Chromium 的浏览器）并导航到 `chrome://extensions/`。
3. 在右上角启用“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择 `find-and-replace-extension` 目录。
6. 现在扩展程序应该已经安装并可以使用了。

## 使用方法

界面预览：

![win](./assets/popup.png)

1. 点击 Chrome 工具栏中的扩展程序图标。
2. 使用弹出窗口输入你的搜索和替换文本，选择匹配类型，并指定要开始的 HTML 元素。
3. 点击“高亮”以高亮显示所有搜索文本的出现位置。
4. 点击“替换”以将所有搜索文本替换为指定的替换文本。

你可以在浏览器的控制台中查看扩展程序的处理过程。

![console](./assets/console.png)

## 注意事项

-   扩展程序仅在当前标签页中工作。
-   由于浏览器的安全策略，扩展程序并不适用于所有网站。

## 开发

### 1. 弹出界面

弹出界面定义在 `popup/popup.html` 中，并使用 `popup.css` 进行样式设置。它包括搜索和替换文本的输入字段、匹配类型和区分大小写的选项，以及触发高亮和替换操作的按钮。

### 2. JavaScript 功能

主要的 JavaScript 逻辑实现于 `popup/popup.js` 和 `scripts/content.js` 中。

#### `popup/popup.js`

-   **Event Listeners**：初始化高亮和替换按钮的事件监听器。
-   **sendMessageToActiveTab**：向活动标签页发送消息以执行高亮或替换操作。
-   **updateStats**：更新弹出窗口中显示的统计信息。
-   **handleHighlight**：通过向活动标签页发送消息处理高亮操作。
-   **handleReplace**：通过向活动标签页发送消息处理替换操作。

#### `scripts/content.js`

-   **Message Listener**：监听来自弹出窗口的消息并执行相应的操作（高亮、替换、移除高亮）。
-   **createSearchRegex**：根据搜索文本和匹配类型创建正则表达式。
-   **highlightText**：在文档中高亮显示所有搜索文本的出现位置。
-   **replaceText**：在文档中将所有搜索文本替换为替换文本。
-   **removeHighlights**：移除文档中的所有高亮显示。

### 3. Iframe 处理

扩展程序可以处理 iframe 中的内容，前提是它有权访问 iframe 的内容。这由 `scripts/content.js` 中的 `canAccessIframe` 函数处理。

## 贡献

1. Fork 仓库。
2. 创建一个新分支（`git checkout -b feature-branch`）。
3. 进行修改。
4. 提交修改（`git commit -am 'Add new feature'`）。
5. 推送到分支（`git push origin feature-branch`）。
6. 创建一个新的 Pull Request。

## 许可证

此项目根据 MIT 许可证授权。详情请参阅 [LICENSE](LICENSE) 文件。
