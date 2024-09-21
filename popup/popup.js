document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded 事件已触发");

    document.getElementById("highlightButton")?.addEventListener("click", handleHighlight);
    document.getElementById("replaceButton")?.addEventListener("click", handleReplace);
});

function handleHighlight() {
    const searchText = document.getElementById("searchText").value.trim();

    if (!searchText) {
        console.log("搜索文本为空，移除所有高亮并更新统计");
        sendMessageToActiveTab({ action: "removeHighlights" }, () => updateStats(0, 0));
        return;
    }

    sendMessageToActiveTab(
        {
            action: "highlight",
            searchText,
            matchType: document.getElementById("matchType").value,
            caseSensitive: document.getElementById("caseSensitive").checked,
            startElementId: document.getElementById("startElementId").value,
        },
        response => {
            if (response?.matchCount !== undefined) {
                updateStats(response.matchCount, 0);
            }
        }
    );
}

function handleReplace() {
    // 替换功能的实现将在未来添加
    console.log("替换功能尚未实现");
}

function updateStats(matchCount, replaceCount) {
    document.getElementById("stats").textContent = `匹配: ${matchCount} | 替换: ${replaceCount}`;
}

function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, message, callback);
    });
}
