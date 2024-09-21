chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("收到消息:", request);
    if (request.action === "highlight") {
        console.log("开始执行高亮操作");
        removeHighlights();
        sendResponse({
            matchCount: highlightText(
                request.searchText,
                request.matchType,
                request.caseSensitive,
                request.startElementId
            )
        });
    } else if (request.action === "removeHighlights") {
        removeHighlights();
        sendResponse({ message: "所有高亮已移除" });
    }
    return true;
});

function removeHighlights() {
    console.log("开始移除所有旧高亮");
    const mainDocumentCount = removeHighlightsFromDocument(document);
    let iframeCount = 0;
    document.querySelectorAll("iframe").forEach(iframe => {
        try {
            iframeCount += removeHighlightsFromDocument(iframe.contentDocument || iframe.contentWindow.document);
        } catch (e) {
            console.error("无法访问 iframe 内容，错误:", e);
        }
    });
    console.log(`总共移除了 ${mainDocumentCount + iframeCount} 个旧高亮`);
}

function removeHighlightsFromDocument(doc) {
    let removedCount = 0;
    doc.querySelectorAll("span.extension-highlight-wrapper").forEach(wrapper => {
        if (wrapper.parentNode) {
            const textNode = doc.createTextNode(wrapper.textContent);
            wrapper.parentNode.replaceChild(textNode, wrapper);
            removedCount += wrapper.querySelectorAll("mark").length;
        }
    });
    return removedCount;
}

function highlightText(searchText, matchType, caseSensitive, startElementId) {
    console.log(`开始高亮文本。搜索文本: "${searchText}", 匹配类型: ${matchType}, 大小写敏感: ${caseSensitive}, 起始元素ID: ${startElementId}`);
    const startElement = startElementId ? document.getElementById(startElementId) : document.body;
    if (!startElement) {
        console.error("起始元素未找到");
        return 0;
    }
    const regex = createSearchRegex(searchText, matchType, caseSensitive);
    const matchCount = processNodeAndHighlight(startElement, regex, "yellow");
    console.log(`总共高亮了 ${matchCount} 个匹配项`);
    return matchCount;
}

function processNodeAndHighlight(node, regex, highlightColor) {
    let matchCount = 0;
    if (node.nodeType === Node.TEXT_NODE) {
        matchCount += applyHighlightToTextNode(node, regex, highlightColor);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === "iframe") {
            matchCount += processIframeContent(node, regex, highlightColor);
        } else if (!node.classList.contains("extension-highlight-wrapper")) {
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
        span.innerHTML = text.replace(regex, match => 
            `<mark class="extension-highlight" style="background-color: ${highlightColor};">${match}</mark>`
        );
        textNode.parentNode.replaceChild(span, textNode);
        return matches.length;
    }
    return 0;
}

function processIframeContent(iframeNode, regex, highlightColor) {
    try {
        const iframeDocument = iframeNode.contentDocument || iframeNode.contentWindow.document;
        return processNodeAndHighlight(iframeDocument.body, regex, highlightColor);
    } catch (e) {
        console.error("无法访问 iframe 内容, 错误:", e);
        return 0;
    }
}

function createSearchRegex(searchText, matchType, caseSensitive) {
    const flags = caseSensitive ? "g" : "gi";
    return new RegExp(matchType === "normal" ? escapeRegExp(searchText) : searchText, flags);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("Find and replace extension content script 已加载");
