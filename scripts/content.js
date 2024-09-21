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
        sendResponse({ matchCount: matchCount });
    } else if (request.action === "removeHighlights") {
        removeHighlights();
        sendResponse({ message: "所有高亮已移除" });
    }
    return true; // 保持消息通道开放，以便异步发送响应
});

function removeHighlights() {
    console.log("开始移除所有旧高亮");

    // 处理主文档
    const mainDocumentCount = removeHighlightsFromDocument(document);
    console.log(`主文档旧高亮数: ${mainDocumentCount}`);
    // 处理所有 iframe
    const iframes = document.querySelectorAll("iframe");
    let iframeCount = 0;
    iframes.forEach(iframe => {
        try {
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            iframeCount += removeHighlightsFromDocument(iframeDocument);
            console.log(`访问 iframe 内容: ${iframe.src} 旧高亮数: ${iframeCount}`);
        } catch (e) {
            console.error("无法访问 iframe 内容，错误:", e);
        }
    });

    console.log(`总共移除了 ${mainDocumentCount + iframeCount} 个旧高亮`);
}

function removeHighlightsFromDocument(doc) {
    const highlights = doc.querySelectorAll("mark.extension-highlight");
    highlights.forEach(highlight => {
        const span = highlight.parentNode;
        const spanParent = span.parentNode;
        spanParent.replaceChild(doc.createTextNode(span.textContent), span);
        spanParent.normalize(); // 合并相邻的文本节点
    });
    return highlights.length;
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

    console.log(`总共高亮了 ${matchCount} 个匹配项`);

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
        span.className = "extension-highlight-wrapper";
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
        const iframeDocument = iframeNode.contentDocument || iframeNode.contentWindow.document;
        const matchCount = processNodeAndHighlight(iframeDocument.body, regex, highlightColor);
        console.log(`访问 iframe 内容: ${iframeNode.src || ""} 高亮数: ${matchCount}`);
        return matchCount;
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
