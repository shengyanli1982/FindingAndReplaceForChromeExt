// 主要的消息监听器
// 处理来自扩展的各种消息请求，如高亮、替换、移除高亮和导航等
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("收到消息:", request);

    switch (request.action) {
        case "highlight":
            console.log("开始执行高亮操作");
            removeHighlights(request);
            const matchCount = highlightText(request);
            currentHighlightIndex = matchCount > 0 ? 0 : -1;
            sendResponse({ matchCount });
            break;

        case "replace":
            console.log("开始执行替换操作");
            removeHighlights(request);
            sendResponse(replaceText(request));
            break;

        case "removeHighlights":
            removeHighlights(request);
            highlightedElements = [];
            currentHighlightIndex = -1;
            sendResponse({ message: "所有高亮已移除" });
            break;

        case "navigate":
            navigateHighlights(request.direction, sendResponse);
            return true; // 保持消息通道开放以进行异步响应

        default:
            console.log("未知的操作:", request.action);
            sendResponse({ error: "未知的操作" });
    }

    return true;
});

// 全局变量
let highlightedElements = []; // 存储所有高亮的元素
let currentHighlightIndex = -1; // 当前聚焦的高亮元素索引

// 高亮文本的主函数
function highlightText({ searchText, matchType, caseSensitive, startElementId }) {
    console.log(
        `开始高亮文本。搜索文本: "${searchText}", 匹配类型: ${matchType}, 大小写敏感: ${caseSensitive}, 起始元素 id: ${startElementId}`
    );
    const startElement = startElementId ? document.getElementById(startElementId) : document.body;
    if (!startElement) {
        console.error("起始元素未找到");
        return 0;
    }
    const regex = createSearchRegex(searchText, matchType, caseSensitive);
    const matchCount = processNodeAndHighlight(startElement, regex, "yellow");
    console.log(`总共高亮了 ${matchCount} 个匹配项`);
    highlightedElements = document.querySelectorAll("mark.extension-highlight");
    return matchCount;
}

// 移除高亮的主函数
function removeHighlights({ startElementId }) {
    console.log("开始移除所有旧高亮");
    const startElement = startElementId ? document.getElementById(startElementId) : document.body;
    if (!startElement) {
        console.log("起始元素未找到");
        return { removedCount: 0, message: "起始元素未找到" };
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

    const totalRemovedCount = mainDocumentCount + iframeCount;
    console.log(`总共移除了 ${totalRemovedCount} 个旧高亮`);

    highlightedElements = [];
    currentHighlightIndex = -1;

    return { removedCount: totalRemovedCount, message: "所有高亮已移除" };
}

// 替换文本的主函数
function replaceText({ searchText, replaceText, matchType, caseSensitive, startElementId }) {
    console.log(
        `开始替换文本。搜索文本: "${searchText}", 替换文本: "${replaceText}", 匹配类型: ${matchType}, 大小写敏感: ${caseSensitive}, 起始元素 id: ${startElementId}`
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

// 在高亮元素间导航的函数
function navigateHighlights(direction, sendResponse) {
    if (highlightedElements.length === 0) {
        sendResponse({ currentIndex: 0, totalMatches: 0 });
        return;
    }

    // 移除之前聚焦元素的红色边框
    if (currentHighlightIndex !== -1) {
        highlightedElements[currentHighlightIndex].style.border = "";
    }

    if (direction === "next") {
        currentHighlightIndex = (currentHighlightIndex + 1) % highlightedElements.length;
    } else if (direction === "previous") {
        currentHighlightIndex = (currentHighlightIndex - 1 + highlightedElements.length) % highlightedElements.length;
    } else {
        sendResponse({ currentIndex: -1, totalMatches: -1 });
        console.log("未知的方向:", direction);
        return;
    }

    const currentElement = highlightedElements[currentHighlightIndex];
    currentElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // 添加红色边框到当前聚焦的元素
    currentElement.style.border = "2px solid red";

    sendResponse({
        currentIndex:
            direction === "next" ? currentHighlightIndex + 1 : highlightedElements.length - currentHighlightIndex,
        totalMatches: highlightedElements.length,
    });
}

// 递归处理节点并应用高亮
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

// 递归处理节点并应用替换
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

// 对文本节点应用高亮
function applyHighlightToTextNode(textNode, regex, highlightColor) {
    const text = textNode.textContent;
    const matches = text.match(regex);
    if (matches) {
        const fragment = document.createDocumentFragment();
        const span = document.createElement("span");
        span.className = "extension-highlight-wrapper";

        let lastIndex = 0;
        text.replace(regex, (match, offset) => {
            if (offset > lastIndex) {
                span.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
            }
            const mark = document.createElement("mark");
            mark.className = "extension-highlight";
            mark.style.backgroundColor = highlightColor;
            mark.textContent = match;
            span.appendChild(mark);
            lastIndex = offset + match.length;
        });

        if (lastIndex < text.length) {
            span.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        fragment.appendChild(span);
        textNode.parentNode.replaceChild(fragment, textNode);
        return matches.length;
    }
    return 0;
}

// 对文本节点应用替换
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

// 处理 iframe 内容的高亮
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

// 处理 iframe 内容的替换
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

// 创建搜索正则表达式
function createSearchRegex(searchText, matchType, caseSensitive) {
    return new RegExp(matchType === "normal" ? escapeRegExp(searchText) : searchText, caseSensitive ? "g" : "gi");
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 检查是否可以访问 iframe 内容
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

// 从文档中移除高亮
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

// 加载确认
console.log("Find and replace extension content script 已加载, runtime id: ", chrome.runtime.id);
