<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Puter Chat</title>
    <script src="https://js.puter.com/v2/"></script>
    <style>
        body {
            font-family: sans-serif;
            display: flex;
            height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
            color: #1c1e21;
        }
        #sidebar {
            width: 250px;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            background-color: #fff;
        }
        #history-list {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
        }
        .history-item {
            padding: 10px;
            cursor: pointer;
            border-radius: 6px;
            margin-bottom: 5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .history-item:hover {
            background-color: #e9ebee;
        }
        #new-chat-button {
            padding: 15px;
            border: none;
            background-color: #42b72a;
            color: white;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            border-radius: 6px;
        }
        #new-chat-button:hover {
            background-color: #36a420;
        }
        #chat-container {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        #chat-window {
            flex-grow: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .message {
            max-width: 70%;
            padding: 10px 15px;
            border-radius: 18px;
            line-height: 1.4;
        }
        .user-message {
            background-color: #0084ff;
            color: white;
            align-self: flex-end;
        }
        .ai-message {
            background-color: #e4e6eb;
            color: #050505;
            align-self: flex-start;
        }
        .ai-message pre {
            background-color: #282c34;
            color: #abb2bf;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Courier New', Courier, monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        #input-area {
            border-top: 1px solid #ddd;
            padding: 15px;
            display: flex;
            gap: 10px;
            background-color: #fff;
        }
        #user-input {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 18px;
            font-size: 16px;
        }
        #input-area button {
            padding: 10px 15px;
            border: none;
            background-color: #0084ff;
            color: white;
            border-radius: 18px;
            cursor: pointer;
            font-size: 16px;
        }
        #input-area button:hover {
            background-color: #0073e6;
        }
        .code-block-wrapper {
            position: relative;
        }
        .copy-code-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: #555;
            color: white;
            border: none;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            opacity: 0.7;
        }
        .copy-code-btn:hover {
            opacity: 1;
        }
        .preview-image {
            max-width: 100%;
            max-height: 200px;
            border-radius: 8px;
            margin-top: 10px;
        }
    </style>
</head>
<body>

    <div id="sidebar">
        <button id="new-chat-button">New Chat</button>
        <div id="history-list"></div>
    </div>

    <div id="chat-container">
        <div id="chat-window"></div>
        <div id="input-area">
            <input type="text" id="user-input" placeholder="Type your message...">
            <button id="save-button">💾</button>
            <button id="file-upload-button">📎</button>
            <button id="photo-button">📸</button>
            <button id="send-button">Send</button>
        </div>
    </div>
    
    <input type="file" id="file-input" style="display: none;" />
    <input type="file" id="photo-input" style="display: none;" accept="image/*" />


    <script>
        const chatWindow = document.getElementById('chat-window');
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        const saveButton = document.getElementById('save-button');
        const historyList = document.getElementById('history-list');
        const newChatButton = document.getElementById('new-chat-button');
        const photoButton = document.getElementById('photo-button');
        const photoInput = document.getElementById('photo-input');
        const fileUploadButton = document.getElementById('file-upload-button');
        const fileInput = document.getElementById('file-input');

        let chatHistory = [];
        let currentChatFile = null;
        let imageURI = null;
        let fileData = { uri: null, name: null };
        
        // --- Core Functions ---

        function appendMessage(role, content) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');

            // Sanitize content to prevent HTML injection
            const sanitizedContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
            let lastIndex = 0;
            let htmlContent = '';

            let match;
            while ((match = codeBlockRegex.exec(sanitizedContent)) !== null) {
                // Add text before the code block
                htmlContent += match.input.substring(lastIndex, match.index).replace(/\n/g, '<br>');
                
                const lang = match[1];
                const code = match[2];
                const codeId = `code-${Date.now()}-${Math.random()}`;

                // Add the code block with a wrapper and copy button
                htmlContent += `
                    <div class="code-block-wrapper">
                        <button class="copy-code-btn" onclick="copyCode('${codeId}')">Copy</button>
                        <pre><code id="${codeId}">${code}</code></pre>
                    </div>
                `;
                lastIndex = match.index + match[0].length;
            }

            // Add any remaining text after the last code block
            htmlContent += sanitizedContent.substring(lastIndex).replace(/\n/g, '<br>');

            messageElement.innerHTML = htmlContent;
            
            // Check for image URI and append image if it exists
            if (role === 'user' && imageURI) {
                const imgElement = document.createElement('img');
                imgElement.src = imageURI;
                imgElement.classList.add('preview-image');
                imgElement.alt = 'User uploaded image';
                messageElement.prepend(imgElement); // Add image before the text content
            }
            
            // Handle general file uploads
            if (role === 'user' && fileData.uri) {
                const fileInfoElement = document.createElement('p');
                fileInfoElement.textContent = `File attached: ${fileData.name}`;
                messageElement.prepend(fileInfoElement);
            }

            chatWindow.appendChild(messageElement);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        window.copyCode = function(elementId) {
            const codeElement = document.getElementById(elementId);
            const textToCopy = codeElement.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const button = codeElement.closest('.code-block-wrapper').querySelector('.copy-code-btn');
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
            });
        }
        
        async function handleSend(options = {}) {
            const userText = userInput.value;
            if (!userText && !imageURI && !fileData.uri) return;

            appendMessage('user', userText);
            chatHistory.push({ role: 'user', content: userText });
            
            userInput.value = '';
            
            const aiPayload = {
                messages: chatHistory,
                ...options
            };
            
             if (imageURI) {
                aiPayload.image = imageURI;
            } else if (fileData.uri) {
                aiPayload.file = fileData.uri;
            }

            try {
                const aiResponse = await puter.ai.chat(aiPayload);
                const aiText = aiResponse.toString();
                appendMessage('ai', aiText);
                chatHistory.push({ role: 'ai', content: aiText });
            } catch (error) {
                console.error("Error from AI:", error);
                appendMessage('ai', 'Sorry, I encountered an error.');
            } finally {
                imageURI = null; // Clear after sending
                fileData = { uri: null, name: null }; // Clear after sending
            }
        }
        
        async function saveChat() {
            if (chatHistory.length === 0) {
                puter.ui.alert('Chat is empty. Nothing to save.');
                return;
            }

            const defaultName = chatHistory[0].content.substring(0, 30) + '...';
            const fileName = currentChatFile ?
                (await puter.ui.prompt('Enter new name or leave to overwrite:', currentChatFile.name)) :
                (await puter.ui.prompt('Enter a name for your chat:', defaultName));

            if (!fileName) return;

            try {
                const fileContent = JSON.stringify(chatHistory, null, 2);
                if (currentChatFile && currentChatFile.name !== fileName) {
                    await puter.fs.rename(currentChatFile.path, fileName);
                }
                const savedFile = await puter.fs.write(fileName, fileContent);
                currentChatFile = savedFile;
                puter.ui.alert('Chat saved!');
                loadHistory();
            } catch (error) {
                console.error('Error saving chat:', error);
                puter.ui.alert('Error saving chat. See console for details.');
            }
        }

        async function loadHistory() {
            try {
                const files = await puter.fs.readdir('/');
                historyList.innerHTML = ''; // Clear existing list
                
                let timeout = null;
                files.forEach(file => {
                    const item = document.createElement('div');
                    item.textContent = file.name;
                    item.className = 'history-item';
                    item.onclick = () => viewChat(file);
                    
                    // Right-click for desktop
                    item.addEventListener('contextmenu', e => {
                        e.preventDefault();
                        renameChat(file);
                    });

                    // Long-press for touch devices
                    item.addEventListener('touchstart', e => {
                        timeout = setTimeout(() => {
                           e.preventDefault();
                           renameChat(file);
                        }, 500); // 500ms for long press
                    });

                    item.addEventListener('touchend', () => {
                        clearTimeout(timeout);
                    });
                     item.addEventListener('touchmove', () => {
                        clearTimeout(timeout);
                    });

                    historyList.appendChild(item);
                });
            } catch (error) {
                console.error('Error loading history:', error);
                historyList.innerHTML = 'Error loading history.';
            }
        }

        async function viewChat(file) {
            try {
                const content = await puter.fs.read(file.path);
                chatWindow.innerHTML = '';
                chatHistory = JSON.parse(content);
                chatHistory.forEach(msg => appendMessage(msg.role, msg.content));
                currentChatFile = file;
            } catch (error) {
                console.error('Error viewing chat:', error);
                puter.ui.alert('Error loading chat.');
            }
        }
        
        async function renameChat(file) {
            const newName = await puter.ui.prompt(`Rename '${file.name}':`, file.name);
            if (newName && newName !== file.name) {
                try {
                    await puter.fs.rename(file.path, newName);
                    loadHistory(); // Refresh the list
                } catch (error) {
                    console.error('Error renaming file:', error);
                    puter.ui.alert('Failed to rename chat.');
                }
            }
        }

        function startNewChat() {
            chatWindow.innerHTML = '';
            chatHistory = [];
            currentChatFile = null;
            imageURI = null;
            fileData = { uri: null, name: null };
            userInput.value = '';
            appendMessage('ai', 'Hello! How can I help you today?');
        }

        function handleImageUpload(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageURI = e.target.result;
                    appendMessage('user', userInput.value || `Image attached: ${file.name}`);
                    // Don't send yet, allow user to add text and press send
                };
                reader.readAsDataURL(file);
            }
        }
        
        function handleFileUpload(event) {
             const file = event.target.files[0];
             if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileData.uri = e.target.result;
                    fileData.name = file.name;
                    appendMessage('user', userInput.value || `File attached: ${file.name}`);
                };
                reader.readAsDataURL(file);
            }
        }

        // --- Event Listeners ---

        sendButton.addEventListener('click', () => handleSend());
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });
        
        document.getElementById('send-button').addEventListener('click', () => {
            const userInputText = userInput.value;
            let options = {};
            
            if (userInputText.toLowerCase().startsWith('generate image') || userInputText.toLowerCase().startsWith('/imagine')) {
                options = { output: 'image' };
            }
            
            handleSend(options);
        });

        saveButton.addEventListener('click', saveChat);
        newChatButton.addEventListener('click', startNewChat);

        photoButton.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', handleImageUpload);
        
        fileUploadButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
        

        // --- Initial Load ---
        
        puter.ready(() => {
            loadHistory();
            startNewChat();
        });

    </script>
</body>
</html>
