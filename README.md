[中文 README](README_CN.md)

# Chrome Extension: Find and Replace

This Chrome extension allows you to search for and replace text within the active tab's content. It supports both global and case-sensitive searches and provides a popup interface for easy access.

## Features

-   Support search for text using regular expressions.
-   Highlight search results.
-   Replace text within specific HTML elements.
-   Process content within iframes.

## Installation

1. Clone the repository:

    ```
    git clone https://github.com/shengyanli1982/find-and-replace-chrome-extension.git
    ```

2. Open Chrome (or any Chromium-based browser) and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked."
5. Select the `find-and-replace-extension` directory.
6. The extension should now be installed and ready to use.

## Usage

Interface preview:

![win](./assets/popup.png)

1. Click the extension icon in the Chrome toolbar.
2. Use the popup to enter your search and replace text, select match type, and specify the HTML element to start from.
3. Click "Highlight" to highlight all occurrences of the search text.
4. Click "Replace" to replace all occurrences of the search text with the specified replacement.

You can view the extension's process in the browser's console.

![console](./assets/console.png)

## Notes

-   The extension will only work on the current tab.
-   The extension will not work on all websites due to browser security policies.

## Development

### 1. Popup Interface

The popup interface is defined in `popup/popup.html` and styled using `popup.css`. It includes input fields for search and replace text, options for match type and case sensitivity, and buttons to trigger highlight and replace actions.

### 2. JavaScript Functionality

The main JavaScript logic is implemented in `popup/popup.js` and `scripts/content.js`.

#### `popup/popup.js`

-   **Event Listeners**: Initializes event listeners for the highlight and replace buttons.
-   **sendMessageToActiveTab**: Sends messages to the active tab to perform highlight or replace actions.
-   **updateStats**: Updates the statistics displayed in the popup.
-   **handleHighlight**: Handles the highlight action by sending a message to the active tab.
-   **handleReplace**: Handles the replace action by sending a message to the active tab.

#### `scripts/content.js`

-   **Message Listener**: Listens for messages from the popup and performs the corresponding actions (highlight, replace, remove highlights).
-   **createSearchRegex**: Creates a regular expression based on the search text and match type.
-   **highlightText**: Highlights all occurrences of the search text in the document.
-   **replaceText**: Replaces all occurrences of the search text with the replacement text in the document.
-   **removeHighlights**: Removes all highlights from the document.

### 3. Iframe Handling

The extension can process content within iframes, provided it has access to the iframe's content. This is handled by the `canAccessIframe` function in `scripts/content.js`.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
