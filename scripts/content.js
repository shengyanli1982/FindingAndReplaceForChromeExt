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
    const highlightColor = "yellow";

    const startElement = getStartElement(startElementId);
    if (!startElement) {
        console.error("起始元素未找到");
        return 0;
    }

    const regex = createSearchRegex(searchText, matchType, caseSensitive);
    const matchCount = processNodeAndHighlight(startElement, regex, highlightColor);

    return matchCount;
}

function getStartElement(startElementId) {
    return startElementId ? document.getElementById(startElementId) : document.body;
}

function processNodeAndHighlight(node, regex, highlightColor) {
    let matchCount = 0;

    if (node.nodeType === Node.TEXT_NODE) {
        matchCount += applyHighlightToTextNode(node, regex, highlightColor);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === "iframe") {
            matchCount += processIframeContent(node, regex, highlightColor);
        } else {
            node.childNodes.forEach(childNode => {
                matchCount += processNodeAndHighlight(childNode, regex, highlightColor);
            });
        }
    }

    return matchCount;
}

function applyHighlightToTextNode(textNode, regex, highlightColor) {
    const text = textNode.textContent;
    const matches = text.match(regex);

    if (matches) {
        const span = document.createElement("span");
        span.innerHTML = text.replace(
            regex,
            `<mark class="extension-highlight" style="background-color: ${highlightColor};">$&</mark>`
        );
        textNode.parentNode.replaceChild(span, textNode);
        return matches.length;
    }

    return 0;
}

function processIframeContent(iframeNode, regex, highlightColor) {
    try {
        console.log("访问 iframe 内容:", iframeNode.src || "");
        const iframeDocument = iframeNode.contentDocument || iframeNode.contentWindow.document;
        return processNodeAndHighlight(iframeDocument.body, regex, highlightColor);
    } catch (e) {
        console.error("无法访问 iframe 内容, 错误:", e);
        return 0;
    }
}

function createSearchRegex(searchText, matchType, caseSensitive) {
    const flags = caseSensitive ? "g" : "gi";
    if (matchType === "normal") {
        return new RegExp(escapeRegExp(searchText), flags);
    } else if (matchType === "regex") {
        return new RegExp(searchText, flags);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("Find and replace extension content script 已加载");
