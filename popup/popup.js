document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded 事件已触发");
    const highlightButton = document.getElementById("highlightButton");
    const replaceButton = document.getElementById("replaceButton");

    if (highlightButton) {
        console.log("已找到高亮按钮");
        highlightButton.addEventListener("click", handleHighlight);
    } else {
        console.error("未找到高亮按钮");
    }

    if (replaceButton) {
        replaceButton.addEventListener("click", handleReplace);
    }
});

function handleHighlight() {
    const searchText = document.getElementById("searchText").value;

    // 检查 searchText 是否为空或只包含空白字符
    if (!searchText || searchText.trim() === "") {
        console.log("搜索文本为空，移除所有高亮并更新统计");
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "removeHighlights" }, function () {
                console.log("高亮已移除");
                updateStats(0, 0);
            });
        });
        return; // 如果为空，直接返回，不执行后续操作
    }

    const matchType = document.getElementById("matchType").value;
    const caseSensitive = document.getElementById("caseSensitive").checked;
    const startElementId = document.getElementById("startElementId").value;

    console.log("正在向 content script 发送消息", {
        action: "highlight",
        searchText,
        matchType,
        caseSensitive,
        startElementId,
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                action: "highlight",
                searchText: searchText,
                matchType: matchType,
                caseSensitive: caseSensitive,
                startElementId: startElementId,
            },
            function (response) {
                console.log("收到来自 content script 的响应", response);
                if (response && response.matchCount !== undefined) {
                    updateStats(response.matchCount, 0);
                }
            }
        );
    });
}

function handleReplace() {
    // 替换功能的实现将在未来添加
    console.log("替换功能尚未实现");
}

function updateStats(matchCount, replaceCount) {
    const statsElement = document.getElementById("stats");
    statsElement.textContent = `匹配: ${matchCount} | 替换: ${replaceCount}`;
}
