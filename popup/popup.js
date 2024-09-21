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
            } else {
                updateStats(-1, -1);
                console.error("无法更新统计数据:", response);
            }
        }
    );
}

function handleReplace() {
    const searchText = document.getElementById("searchText").value.trim();
    const replaceText = document.getElementById("replaceText").value;

    if (!searchText) {
        console.log("搜索文本为空，无法执行替换操作");
        return;
    }

    sendMessageToActiveTab(
        {
            action: "replace",
            searchText,
            replaceText,
            matchType: document.getElementById("matchType").value,
            caseSensitive: document.getElementById("caseSensitive").checked,
            startElementId: document.getElementById("startElementId").value,
        },
        response => {
            if (response?.matchCount !== undefined && response?.replaceCount !== undefined) {
                updateStats(response.matchCount, response.replaceCount);
            } else {
                updateStats(-1, -1);
                console.error("无法更新统计数据:", response);
            }
        }
    );
}

function updateStats(matchCount, replaceCount) {
    document.getElementById("stats").textContent = `匹配: ${matchCount} | 替换: ${replaceCount}`;
}

function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, message, callback);
    });
}
