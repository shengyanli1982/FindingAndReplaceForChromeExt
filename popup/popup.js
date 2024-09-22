// 页面加载完成后的初始化
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded 事件已触发");

    document.getElementById("highlightButton")?.addEventListener("click", handleHighlight);
    document.getElementById("replaceButton")?.addEventListener("click", handleReplace);
});

// 辅助函数：向活动标签页发送消息
function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, message, callback);
    });
}

// 辅助函数：更新统计信息
function updateStats(matchCount, replaceCount) {
    document.getElementById("stats").textContent = `匹配: ${matchCount} | 替换: ${replaceCount}`;
}

// 主要功能：处理高亮
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

// 主要功能：处理替换
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
