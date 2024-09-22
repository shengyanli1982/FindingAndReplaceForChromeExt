chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("收到消息:", request);
    removeHighlights(request);
    if (request.action === "highlight") {
        console.log("开始执行高亮操作");
        sendResponse({ matchCount: highlightText(request) });
    } else if (request.action === "replace") {
        console.log("开始执行替换操作");
        sendResponse(replaceText(request));
    } else if (request.action === "removeHighlights") {
        sendResponse({ message: "所有高亮已移除" });
    }
    return true;
});

function removeHighlights({ startElementId }) {
    console.log("开始移除所有旧高亮");
    const startElement = startElementId ? document.getElementById(startElementId) : document.body;
    if (!startElement) {
        console.error("起始元素未找到");
        return 0;
    }
    const mainDocumentCount = removeHighlightsFromDocument(startElement);
    let iframeCount = 0;

    startElement.querySelectorAll("iframe").forEach(iframe => {
        try {
            if (canAccessIframe(iframe)) {
                iframeCount += removeHighlightsFromDocument(iframe.contentDocument || iframe.contentWindow.document);
            } else {
                console.log("无法访问 iframe 内容：可能是跨域限制");
            }
        } catch (e) {
            console.log("处理 iframe 时发生错误:", e.message);
        }
    });

    console.log(`总共移除了 ${mainDocumentCount + iframeCount} 个旧高亮`);
    return mainDocumentCount + iframeCount;
}

function canAccessIframe(iframe) {
    try {
        // 尝试访问 iframe 的 contentWindow 属性
        // 如果可以访问，则返回 true
        return !!iframe.contentWindow && !!iframe.contentWindow.document;
    } catch (e) {
        // 如果出现异常，说明无法访问
        return false;
    }
}

function removeHighlightsFromDocument(doc) {
    let removedCount = 0;
    doc.querySelectorAll("span.extension-highlight-wrapper").forEach(wrapper => {
        if (wrapper.parentNode) {
            const textNode = document.createTextNode(wrapper.textContent);
            wrapper.parentNode.replaceChild(textNode, wrapper);
            removedCount += wrapper.querySelectorAll("mark").length;
        }
    });
    return removedCount;
}

function highlightText({ searchText, matchType, caseSensitive, startElementId }) {
    console.log(
        `开始高亮文本。搜索文本: "${searchText}", 匹配类型: ${matchType}, 大小写敏感: ${caseSensitive}, 起始元素ID: ${startElementId}`
    );
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
        span.innerHTML = text.replace(
            regex,
            match => `<mark class="extension-highlight" style="background-color: ${highlightColor};">${match}</mark>`
        );
        textNode.parentNode.replaceChild(span, textNode);
        return matches.length;
    }
    return 0;
}

function processIframeContent(iframeNode, regex, highlightColor) {
    try {
        if (!canAccessIframe(iframeNode)) {
            console.log("无法访问 iframe 内容：可能是跨域限制");
            return 0;
        }
        const iframeDocument = iframeNode.contentDocument || iframeNode.contentWindow.document;
        return processNodeAndHighlight(iframeDocument.body, regex, highlightColor);
    } catch (e) {
        console.error("无法访问 iframe 内容, 错误:", e);
        return 0;
    }
}

function createSearchRegex(searchText, matchType, caseSensitive) {
    return new RegExp(matchType === "normal" ? escapeRegExp(searchText) : searchText, caseSensitive ? "g" : "gi");
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceText({ searchText, replaceText, matchType, caseSensitive, startElementId }) {
    console.log(
        `开始替换文本。搜索文本: "${searchText}", 替换文本: "${replaceText}", 匹配类型: ${matchType}, 大小写敏感: ${caseSensitive}, 起始元素ID: ${startElementId}`
    );
    const startElement = startElementId ? document.getElementById(startElementId) : document.body;
    if (!startElement) {
        console.error("起始元素未找到");
        return { matchCount: 0, replaceCount: 0 };
    }
    const regex = createSearchRegex(searchText, matchType, caseSensitive);
    const result = processNodeAndReplace(startElement, regex, replaceText);
    console.log(`总共替换了 ${result.replaceCount} 个匹配项`);
    return result;
}

function processNodeAndReplace(node, regex, replaceText) {
    let matchCount = 0;
    let replaceCount = 0;
    if (node.nodeType === Node.TEXT_NODE) {
        const result = applyReplaceToTextNode(node, regex, replaceText);
        matchCount += result.matchCount;
        replaceCount += result.replaceCount;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === "iframe") {
            const result = processIframeContentForReplace(node, regex, replaceText);
            matchCount += result.matchCount;
            replaceCount += result.replaceCount;
        } else if (!node.classList.contains("extension-highlight-wrapper")) {
            node.childNodes.forEach(childNode => {
                const result = processNodeAndReplace(childNode, regex, replaceText);
                matchCount += result.matchCount;
                replaceCount += result.replaceCount;
            });
        }
    }
    return { matchCount, replaceCount };
}

function applyReplaceToTextNode(textNode, regex, replaceText) {
    const text = textNode.textContent;
    const matches = text.match(regex);
    if (matches) {
        const newText = text.replace(regex, replaceText);
        textNode.textContent = newText;
        return { matchCount: matches.length, replaceCount: matches.length };
    }
    return { matchCount: 0, replaceCount: 0 };
}

function processIframeContentForReplace(iframeNode, regex, replaceText) {
    try {
        if (!canAccessIframe(iframeNode)) {
            console.log("无法访问 iframe 内容：可能是跨域限制");
            return { matchCount: 0, replaceCount: 0 };
        }
        const iframeDocument = iframeNode.contentDocument || iframeNode.contentWindow.document;
        return processNodeAndReplace(iframeDocument.body, regex, replaceText);
    } catch (e) {
        console.error("无法访问 iframe 内容, 错误:", e);
        return { matchCount: 0, replaceCount: 0 };
    }
}

console.log("Find and replace extension content script 已加载");
