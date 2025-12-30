
'use client';

import React, { useState, useEffect, useRef } from 'react';

// Since puter.js is loaded via a script tag, we need to declare it to TypeScript
declare const puter: any;

export default function ChatPage() {
    const [chatHistory, setChatHistory] = useState<{ role: string, content: any }[]>([]);
    const [historyFiles, setHistoryFiles] = useState<{ name: string, path: string }[]>([]);
    const [currentChatFile, setCurrentChatFile] = useState<{ name: string, path: string } | null>(null);
    const [imageURI, setImageURI] = useState<string | null>(null);
    const [fileData, setFileData] = useState<{ uri: string | null, name: string | null }>({ uri: null, name: null });

    const chatWindowRef = useRef<HTMLDivElement>(null);
    const userInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Core Functions ---

    const appendMessage = (role: string, content: any) => {
        setChatHistory(prev => [...prev, { role, content }]);
    };
    
    const handleSend = async (options = {}) => {
        const userText = userInputRef.current?.value || '';
        if (!userText && !imageURI && !fileData.uri) return;

        const messageContent: { text: string; image: string | null; file: { uri: string | null, name: string | null } } = {
            text: userText,
            image: imageURI,
            file: fileData,
        };
        
        appendMessage('user', messageContent);

        const aiPayload: any[] = chatHistory.map(msg => {
            const content = msg.content;
            if (typeof content === 'string') {
                return { role: msg.role, content };
            }
            // Ensure we are sending a simple text string for AI processing, even for complex messages
            return { role: msg.role, content: content.text || '' };
        });

        const userMessageForAI = {
            role: 'user',
            content: userText,
        } as { role: string; content: string; image?: string; file?: string; output?: string };
        
        if (imageURI) {
            userMessageForAI.image = imageURI;
        } else if (fileData.uri) {
            userMessageForAI.file = fileData.uri;
        }

        if (options && 'output' in options) {
            userMessageForAI.output = 'image';
        }

        aiPayload.push(userMessageForAI);
        
        if (userInputRef.current) {
            userInputRef.current.value = '';
        }
        setImageURI(null); 
        setFileData({ uri: null, name: null });

        try {
            const aiResponse = await puter.ai.chat(aiPayload);
            const aiText = aiResponse.toString();
            appendMessage('ai', { text: aiText });
        } catch (error) {
            console.error("Error from AI:", error);
            appendMessage('ai', { text: 'Sorry, I encountered an error.' });
        }
    };

    const saveChat = async () => {
        if (chatHistory.length === 0) {
            puter.ui.alert('Chat is empty. Nothing to save.');
            return;
        }

        const firstUserMessage = chatHistory.find(m => m.role === 'user')?.content.text || 'New Chat';
        const defaultName = firstUserMessage.substring(0, 30);
        
        const fileName = currentChatFile ?
            (await puter.ui.prompt('Enter new name or leave to overwrite:', currentChatFile.name)) :
            (await puter.ui.prompt('Enter a name for your chat:', defaultName));

        if (!fileName) return;

        try {
            const fileContent = JSON.stringify(chatHistory, null, 2);
            let savedFilePath = currentChatFile?.path;

            if (currentChatFile && currentChatFile.name !== fileName) {
                 await puter.fs.rename(currentChatFile.path, fileName);
                 savedFilePath = currentChatFile.path.replace(currentChatFile.name, fileName);
            }
            
            const finalPath = savedFilePath || fileName;
            const savedFile = await puter.fs.write(finalPath, fileContent);

            setCurrentChatFile(savedFile);
            puter.ui.alert('Chat saved!');
            loadHistory();
        } catch (error) {
            console.error('Error saving chat:', error);
            puter.ui.alert('Error saving chat. See console for details.');
        }
    };

    const loadHistory = async () => {
        try {
            const files = await puter.fs.readdir('/');
            setHistoryFiles(files);
        } catch (error) {
            console.error('Error loading history:', error);
            puter.ui.alert('Error loading history. See console for details.');
        }
    };

    const viewChat = async (file: { name: string, path: string }) => {
        try {
            const content = await puter.fs.read(file.path);
            const loadedHistory = JSON.parse(content);
            setChatHistory(loadedHistory);
            setCurrentChatFile(file);
        } catch (error) {
            console.error('Error viewing chat:', error);
            puter.ui.alert('Error loading chat.');
        }
    };
    
    const renameChat = async (file: { name: string, path: string }) => {
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
    };

    const startNewChat = () => {
        setChatHistory([{ role: 'ai', content: { text: 'Hello! How can I help you today?' } }]);
        setCurrentChatFile(null);
        setImageURI(null);
        setFileData({ uri: null, name: null });
        if(userInputRef.current) userInputRef.current.value = '';
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setImageURI(result);
                const currentText = userInputRef.current?.value || `Image attached: ${file.name}`;
                appendMessage('user', { text: currentText, image: result, file: { uri: null, name: null } });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
         const file = event.target.files?.[0];
         if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                const fileInfo = { uri: result, name: file.name };
                setFileData(fileInfo);
                const currentText = userInputRef.current?.value || `File attached: ${file.name}`;
                appendMessage('user', { text: currentText, image: null, file: fileInfo });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const copyCode = (codeText: string, button: EventTarget) => {
        navigator.clipboard.writeText(codeText).then(() => {
            const originalText = (button as HTMLButtonElement).textContent;
            (button as HTMLButtonElement).textContent = 'Copied!';
            setTimeout(() => {
                (button as HTMLButtonElement).textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
        });
    }

    // --- Effects ---

    useEffect(() => {
        const handlePuterReady = () => {
            loadHistory();
            startNewChat();
        };

        const script = document.createElement('script');
        script.src = "https://js.puter.com/v2/";
        document.body.appendChild(script);

        window.addEventListener('puter.loaded', handlePuterReady);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            window.removeEventListener('puter.loaded', handlePuterReady);
        }
    }, []);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chatHistory]);


    // --- Render ---

    const renderMessageContent = (content: any) => {
        if (typeof content === 'string') {
            return <span>{content}</span>;
        }

        const text = content.text || '';
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        let lastIndex = 0;
        const parts = [];

        let match;
        while ((match = codeBlockRegex.exec(text)) !== null) {
            // Text before code block
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
            }
            
            const code = match[2];
            // Code block
            parts.push(
                <div key={`code-${lastIndex}`} className="code-block-wrapper">
                    <button className="copy-code-btn" onClick={(e) => copyCode(code, e.target)}>Copy</button>
                    <pre><code>{code}</code></pre>
                </div>
            );
            lastIndex = match.index + match[0].length;
        }

        // Text after last code block
        if (lastIndex < text.length) {
            parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
        }
        
        return (
            <div>
                {content.image && <img src={content.image} className="preview-image" alt="User upload" />}
                {content.file && content.file.name && <p>File attached: {content.file.name}</p>}
                {parts.length > 0 ? parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>) : <span>{text}</span>}
            </div>
        );
    };


    return (
        <>
        <style jsx global>{`
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
                white-space: pre-wrap;
                word-wrap: break-word;
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
                margin-top: 10px;
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
        `}</style>
        <div id="sidebar">
            <button id="new-chat-button" onClick={startNewChat}>New Chat</button>
            <div id="history-list">
                {historyFiles.length === 0 && <p style={{textAlign: 'center', color: '#888', padding: '10px'}}>No saved chats.</p>}
                {historyFiles.map(file => {
                    let longPressTimeout: NodeJS.Timeout;
                    return (
                        <div
                            key={file.path}
                            className="history-item"
                            onClick={() => viewChat(file)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                renameChat(file);
                            }}
                            onTouchStart={() => {
                                longPressTimeout = setTimeout(() => renameChat(file), 500);
                            }}
                            onTouchEnd={() => clearTimeout(longPressTimeout)}
                            onTouchMove={() => clearTimeout(longPressTimeout)}
                        >
                            {file.name}
                        </div>
                    );
                })}
            </div>
        </div>

        <div id="chat-container">
            <div id="chat-window" ref={chatWindowRef}>
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}-message`}>
                        {renderMessageContent(msg.content)}
                    </div>
                ))}
            </div>
            <div id="input-area">
                <input type="text" id="user-input" placeholder="Type your message..." ref={userInputRef} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                <button id="save-button" onClick={saveChat}>💾</button>
                <button id="file-upload-button" onClick={() => fileInputRef.current?.click()}>📎</button>
                <button id="photo-button" onClick={() => photoInputRef.current?.click()}>📸</button>
                <button id="send-button" onClick={() => {
                    const userInputText = userInputRef.current?.value || '';
                    let options = {};
                    if (userInputText.toLowerCase().startsWith('generate image') || userInputText.toLowerCase().startsWith('/imagine')) {
                        options = { output: 'image' };
                    }
                    handleSend(options);
                }}>Send</button>
            </div>
        </div>
        
        <input type="file" id="file-input" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
        <input type="file" id="photo-input" style={{ display: 'none' }} accept="image/*" ref={photoInputRef} onChange={handleImageUpload} />
        </>
    );
}

    