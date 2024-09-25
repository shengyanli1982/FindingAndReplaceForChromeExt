// 检查存储API是否可用，优先使用chrome.storage.local，否则使用localStorage
const storage = chrome.storage && chrome.storage.local ? chrome.storage.local : localStorage;

// 页面加载完成后的初始化
document.addEventListener("DOMContentLoaded", () => {
    // 为按钮添加事件监听器
    document.getElementById("highlightButton")?.addEventListener("click", handleHighlight);
    document.getElementById("replaceButton")?.addEventListener("click", showConfirmModal);
    document.getElementById("clearButton")?.addEventListener("click", handleClear);
    document.getElementById("previousButton")?.addEventListener("click", handleNavPrevious);
    document.getElementById("nextButton")?.addEventListener("click", handleNavNext);
    document.getElementById("confirmReplace")?.addEventListener("click", handleConfirmedReplace);

    // 初始化时禁用导航按钮并重置导航统计
    updateNavigationButtons(false);
    updateNavStats({ currentIndex: 0, totalMatches: 0 });

    // 加载保存的内容
    loadSavedContent();
});

// 添加这个新函数
function showConfirmModal() {
    $("#confirmModal").modal("show");
}

// 添加这个新函数
function handleConfirmedReplace() {
    $("#confirmModal").modal("hide");
    handleReplace();
}

// 处理高亮功能
function handleHighlight() {
    const searchText = document.getElementById("searchText").value.trim();

    if (!searchText) {
        console.log("搜索文本为空，移除所有高亮并更新统计");
        sendMessageToActiveTab({ action: "removeHighlights" }, response => {
            updateStats(0, 0);
            updateNavigationButtons(false);
            updateNavStats({ currentIndex: 0, totalMatches: 0 });
            console.log(response.message);
        });
        return;
    }

    // 发送高亮请求到活动标签页
    sendMessageToActiveTab(
        {
            action: "highlight",
            searchText,
            matchType: document.querySelector('input[name="matchType"]:checked').value,
            caseSensitive: document.getElementById("caseSensitive").checked,
            startElementId: document.getElementById("startElementId").value,
        },
        response => {
            if (response?.matchCount !== undefined) {
                updateStats(response.matchCount, 0);
                updateNavigationButtons(response.matchCount > 0);
                updateNavStats({ currentIndex: 0, totalMatches: response.matchCount });
            } else {
                updateStats(-1, -1);
                updateNavigationButtons(false);
                updateNavStats({ currentIndex: 0, totalMatches: 0 });
                console.error("无法更新统计数据!!");
            }
            saveContent();
        }
    );
}

// 处理替换功能
function handleReplace() {
    const searchText = document.getElementById("searchText").value.trim();
    const replaceText = document.getElementById("replaceText").value;

    if (!searchText) {
        console.log("搜索文本为空，无法执行替换操作");
        return;
    }

    // 发送替换请求到活动标签页
    sendMessageToActiveTab(
        {
            action: "replace",
            searchText,
            replaceText,
            matchType: document.querySelector('input[name="matchType"]:checked').value,
            caseSensitive: document.getElementById("caseSensitive").checked,
            startElementId: document.getElementById("startElementId").value,
        },
        response => {
            if (response?.matchCount !== undefined && response?.replaceCount !== undefined) {
                updateStats(response.matchCount, response.replaceCount);
                // 替换后禁用导航按钮并重置导航统计
                updateNavigationButtons(false);
                updateNavStats({ currentIndex: 0, totalMatches: 0 });
            } else {
                updateStats(-1, -1);
                console.error("无法更新统计数据!!");
            }
            saveContent();
        }
    );
}

// 处理清除功能
function handleClear() {
    // 清空输入框
    document.getElementById("searchText").value = "";
    document.getElementById("replaceText").value = "";
    document.getElementById("startElementId").value = "";

    // 重置 radio 按钮和复选框
    document.getElementById("normalMatch").checked = true;
    document.getElementById("regexMatch").checked = false;
    document.getElementById("caseSensitive").checked = false;

    // 重置统计信息
    updateStats(0, 0);
    updateNavigationButtons(false);
    updateNavStats({ currentIndex: 0, totalMatches: 0 });

    // 发送移除高亮请求到活动标签页
    sendMessageToActiveTab({ action: "removeHighlights" }, response => {
        console.log(response.message);
    });

    // 保存清除后的内容
    saveContent();
}

// 处理导航到上一个匹配项
function handleNavPrevious() {
    sendMessageToActiveTab({ action: "navigate", direction: "previous" }, updateNavStats);
}

// 处理导航到下一个匹配项
function handleNavNext() {
    sendMessageToActiveTab({ action: "navigate", direction: "next" }, updateNavStats);
}

// 从存储中加载保存的内容
function loadSavedContent() {
    const keys = ["searchText", "replaceText", "matchType", "caseSensitive", "startElementId"];

    if (storage === localStorage) {
        // 使用 localStorage
        const result = keys.reduce((acc, key) => {
            acc[key] = localStorage.getItem(key) || "";
            return acc;
        }, {});
        updateUI(result);
    } else {
        // 使用 chrome.storage.local
        storage.get(keys, updateUI);
    }
}

// 保存当前内容到存储
function saveContent() {
    const content = {
        searchText: document.getElementById("searchText").value,
        replaceText: document.getElementById("replaceText").value,
        matchType: document.querySelector('input[name="matchType"]:checked').value,
        caseSensitive: document.getElementById("caseSensitive").checked,
        startElementId: document.getElementById("startElementId").value,
    };

    if (storage === localStorage) {
        // 使用 localStorage
        Object.entries(content).forEach(([key, value]) => localStorage.setItem(key, value));
    } else {
        // 使用 chrome.storage.local
        storage.set(content);
    }
    console.log(`保存内容到 ${storage === localStorage ? "localStorage" : "chrome.storage.local"}:`, content);
}

// 更新UI元素的值
function updateUI(result) {
    document.getElementById("searchText").value = result.searchText || "";
    document.getElementById("replaceText").value = result.replaceText || "";
    const matchTypeRadio = document.querySelector(`input[name="matchType"][value="${result.matchType || "normal"}"]`);
    if (matchTypeRadio) {
        matchTypeRadio.checked = true;
    }
    document.getElementById("caseSensitive").checked = result.caseSensitive || false;
    document.getElementById("startElementId").value = result.startElementId || "";
}

// 更新匹配和替换统计信息
function updateStats(matchCount, replaceCount) {
    document.getElementById("stats").textContent = `匹配: ${matchCount} | 替换: ${replaceCount}`;
}

// 更新导航按钮的状态（启用/禁用）
function updateNavigationButtons(enabled) {
    const prevButton = document.getElementById("previousButton");
    const nextButton = document.getElementById("nextButton");

    prevButton.classList.toggle("disabled", !enabled);
    nextButton.classList.toggle("disabled", !enabled);

    prevButton.disabled = !enabled;
    nextButton.disabled = !enabled;

    prevButton.setAttribute("aria-disabled", !enabled);
    nextButton.setAttribute("aria-disabled", !enabled);
}

// 更新导航统计信息
function updateNavStats(response) {
    if (response && response.currentIndex !== undefined && response.totalMatches !== undefined) {
        document.getElementById("nav-stats").textContent = `${response.currentIndex}/${response.totalMatches}`;
    }
}

// 向当前活动标签页发送消息
function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, message, callback);
    });
}
