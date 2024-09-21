chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("收到消息:", request);
    if (request.action === "highlight") {
        console.log("开始执行高亮操作");
        removeHighlights();
        const matchCount = highlightText(
            request.searchText,
            request.matchType,
            request.caseSensitive,
            request.startElementId
        );
        console.log(`高亮操作完成，匹配数量: ${matchCount}`);
        sendResponse({ matchCount: matchCount });
    } else if (request.action === "removeHighlights") {
        removeHighlights();
        sendResponse({ message: "所有高亮已移除" });
    }
    return true; // 保持消息通道开放，以便异步发送响应
});

function removeHighlights() {
    console.log("开始移除旧的高亮");
    const highlights = document.querySelectorAll("mark.extension-highlight");
    console.log(`找到 ${highlights.length} 个旧的高亮`);
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize(); // 合并相邻的文本节点
    });
    console.log("旧的高亮已移除");
}

function highlightText(searchText, matchType, caseSensitive, startElementId) {
    console.log(
        `开始高亮文本。搜索文本: "${searchText}", 匹配类型: ${matchType}, 大小写敏感: ${caseSensitive}, 起始元素ID: ${startElementId}`
    );
    let matchCount = 0;
    const highlightColor = "yellow";

    // 如果指定了起始元素ID，从该元素开始搜索，否则从body开始
    const startElement = startElementId ? document.getElementById(startElementId) : document.body;

    if (!startElement) {
        console.error("起始元素未找到");
        return 0;
    }

    function highlightTextInNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            let matches;

            if (matchType === "normal") {
                const flags = caseSensitive ? "g" : "gi";
                const regex = new RegExp(escapeRegExp(searchText), flags);
                matches = text.match(regex);
            } else if (matchType === "regex") {
                const flags = caseSensitive ? "g" : "gi";
                const regex = new RegExp(searchText, flags);
                matches = text.match(regex);
            }

            if (matches) {
                matchCount += matches.length;
                console.log(`在节点中找到 ${matches.length} 个匹配`);
                const span = document.createElement("span");
                span.innerHTML = text.replace(
                    new RegExp(matches[0], "g"),
                    `<mark class="extension-highlight" style="background-color: ${highlightColor};">$&</mark>`
                );
                node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
            node.childNodes.forEach(highlightTextInNode);
        }
    }

    highlightTextInNode(startElement);
    console.log(`高亮完成，总共找到 ${matchCount} 个匹配`);
    return matchCount;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("content script 已加载");
