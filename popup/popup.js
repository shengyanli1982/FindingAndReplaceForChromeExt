// 检查存储API是否可用
const storage = chrome.storage && chrome.storage.local ? chrome.storage.local : localStorage;

// 页面加载完成后的初始化
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("highlightButton")?.addEventListener("click", handleHighlight);
    document.getElementById("replaceButton")?.addEventListener("click", handleReplace);
    document.getElementById("clearButton")?.addEventListener("click", handleClear);

    // 加载保存的内容
    loadSavedContent();
});

// 加载保存的内容
function loadSavedContent() {
    if (storage === localStorage) {
        // 使用 localStorage
        const result = {
            searchText: localStorage.getItem("searchText") || "",
            replaceText: localStorage.getItem("replaceText") || "",
            matchType: localStorage.getItem("matchType") || "normal",
            caseSensitive: localStorage.getItem("caseSensitive") === "true",
            startElementId: localStorage.getItem("startElementId") || "",
        };
        updateUI(result);
    } else {
        // 使用 chrome.storage.local
        storage.get(["searchText", "replaceText", "matchType", "caseSensitive", "startElementId"], result => {
            updateUI(result);
        });
    }
}

// 更新UI
function updateUI(result) {
    document.getElementById("searchText").value = result.searchText || "";
    document.getElementById("replaceText").value = result.replaceText || "";
    document.getElementById("matchType").value = result.matchType || "normal";
    document.getElementById("caseSensitive").checked = result.caseSensitive || false;
    document.getElementById("startElementId").value = result.startElementId || "";
}

// 保存内容
function saveContent() {
    const content = {
        searchText: document.getElementById("searchText").value,
        replaceText: document.getElementById("replaceText").value,
        matchType: document.getElementById("matchType").value,
        caseSensitive: document.getElementById("caseSensitive").checked,
        startElementId: document.getElementById("startElementId").value,
    };

    if (storage === localStorage) {
        // 使用 localStorage
        Object.keys(content).forEach(key => localStorage.setItem(key, content[key]));
        console.log("保存内容到 localStorage:", content);
    } else {
        // 使用 chrome.storage.local
        storage.set(content, () => {
            console.log("保存内容到 chrome.storage.local:", content);
        });
    }
}

// 处理清除按钮点击
function handleClear() {
    document.getElementById("searchText").value = "";
    document.getElementById("replaceText").value = "";
    document.getElementById("matchType").value = "normal";
    document.getElementById("caseSensitive").checked = false;
    document.getElementById("startElementId").value = "";
    updateStats(0, 0);
    saveContent();
}

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
                console.error("无法更新统计数据!!");
            }
            saveContent();
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
                console.error("无法更新统计数据!!");
            }
            saveContent();
        }
    );
}
