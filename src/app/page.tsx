
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Paperclip, Camera, Send, PlusCircle } from 'lucide-react';

// Since puter.js is loaded via a script tag, we need to declare it to TypeScript
declare const puter: any;

export default function ChatPage() {
    const [chatHistory, setChatHistory] = React.useState<{ role: string, content: any }[]>([]);
    const [historyFiles, setHistoryFiles] = React.useState<{ name: string, path: string }[]>([]);
    const [currentChatFile, setCurrentChatFile] = React.useState<{ name: string, path: string } | null>(null);
    const [imageURI, setImageURI] = React.useState<string | null>(null);
    const [fileData, setFileData] = React.useState<{ uri: string | null, name: string | null }>({ uri: null, name: null });

    const chatWindowRef = React.useRef<HTMLDivElement>(null);
    const userInputRef = React.useRef<HTMLInputElement>(null);
    const photoInputRef = React.useRef<HTMLInputElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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

        const aiPayload = chatHistory.map(msg => {
            const content = msg.content;
            let textContent = '';
            
            if(typeof content === 'string') {
                textContent = content;
            } else if (typeof content === 'object' && content !== null && content.text) {
                textContent = content.text;
            }

            return { role: msg.role, content: textContent };
        });

        const userMessageForAI: any = {
            role: 'user',
            content: userText,
        };
        
        if (imageURI) {
            userMessageForAI.content = [
                { type: 'text', text: userText },
                { type: 'image_url', image_url: { url: imageURI } }
            ]
        } else if (fileData.uri) {
            userMessageForAI.content = `The user has attached a file named ${fileData.name}. The file content is: ${fileData.uri}. The user's message is: ${userText}`;
        }
        
        if (userInputRef.current) {
            userInputRef.current.value = '';
        }
        setImageURI(null); 
        setFileData({ uri: null, name: null });

        try {
            const aiResponse = await puter.ai.chat(aiPayload);

            if(typeof aiResponse === 'object' && aiResponse.toString().startsWith('data:image')) {
                appendMessage('ai', { image: aiResponse.toString() });
            } else {
                appendMessage('ai', { text: aiResponse.toString() });
            }

        } catch (error)
        {
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
            (await puter.ui.prompt('Enter new name or leave to overwrite:', currentChatFile.name.replace('.json',''))) :
            (await puter.ui.prompt('Enter a name for your chat:', defaultName));

        if (!fileName) return;

        try {
            const fileContent = JSON.stringify(chatHistory, null, 2);
            let savedFilePath = currentChatFile?.path;
            
            if (currentChatFile && currentChatFile.name.replace('.json','') !== fileName) {
                 const newPath = currentChatFile.path.replace(currentChatFile.name, fileName + '.json');
                 await puter.fs.rename(currentChatFile.path, newPath);
                 savedFilePath = newPath;
            }
            
            const finalPath = savedFilePath || fileName + '.json';
            await puter.fs.write(finalPath, fileContent);

            setCurrentChatFile({name: fileName + '.json', path: finalPath});
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
            const chatFiles = files.filter((f: {name: string}) => f.name.endsWith('.json'));
            setHistoryFiles(chatFiles);
        } catch (error) {
            console.error('Error loading history:', error);
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

    React.useEffect(() => {
        const handlePuterReady = () => {
            loadHistory();
            startNewChat();
        };

        if (window.hasOwnProperty('puter')) {
            handlePuterReady();
        } else {
            window.addEventListener('puter.loaded', handlePuterReady, { once: true });
        }

        return () => {
            window.removeEventListener('puter.loaded', handlePuterReady);
        }
    }, []);

    React.useEffect(() => {
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
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
            }
            const code = match[2];
            parts.push(
                <div key={`code-${lastIndex}`} className="relative bg-gray-800 rounded-md my-2 p-4 text-sm text-white">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-auto px-2 py-1 text-xs"
                        onClick={(e) => copyCode(code, e.target)}
                    >
                        Copy
                    </Button>
                    <pre><code className="font-mono">{code}</code></pre>
                </div>
            );
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
        }
        
        return (
            <div>
                {content.image && <img src={content.image} className="max-w-xs rounded-md my-2" alt="Upload" />}
                {content.file && content.file.name && <p className="text-sm text-gray-500">File attached: {content.file.name}</p>}
                {parts.length > 0 ? parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>) : <span className="whitespace-pre-wrap">{text}</span>}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 flex flex-col border-r bg-white">
                <div className="p-4 border-b">
                    <Button className="w-full" onClick={startNewChat}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Chat
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <h2 className="px-2 mb-2 text-lg font-semibold tracking-tight">History</h2>
                    <div className="space-y-1">
                        {historyFiles.length === 0 && <p className="text-center text-sm text-gray-500 pt-4">No saved chats.</p>}
                        {historyFiles.map(file => (
                            <Button
                                key={file.path}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => viewChat(file)}
                            >
                                <span className="truncate">{file.name.replace('.json', '')}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <div id="chat-window" ref={chatWindowRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'ai' && <div className="h-8 w-8 rounded-full bg-gray-300 flex-shrink-0"></div>}
                            <div className={`p-3 rounded-lg max-w-xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}>
                                {renderMessageContent(msg.content)}
                            </div>
                            {msg.role === 'user' && <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">U</div>}
                        </div>
                    ))}
                    {(imageURI || (fileData && fileData.name)) && (
                        <div className="flex justify-end">
                            <Card className="max-w-xl">
                                <CardContent className="p-3">
                                {imageURI && <img src={imageURI} className="max-w-xs rounded-md" alt="Preview" />}
                                {fileData && fileData.name && <p className="text-sm text-gray-500">File ready: {fileData.name}</p>}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>


                <div className="p-4 border-t bg-white">
                    <div className="relative">
                        <Input
                            id="user-input"
                            placeholder="Type your message..."
                            ref={userInputRef}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            className="pr-40"
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={saveChat} title="Save Chat">
                                <Save className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload File">
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => photoInputRef.current?.click()} title="Upload Photo">
                                <Camera className="h-5 w-5" />
                            </Button>
                            <Button onClick={() => handleSend()} title="Send Message">
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            
            <input type="file" id="file-input" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
            <input type="file" id="photo-input" style={{ display: 'none' }} accept="image/*" ref={photoInputRef} onChange={handleImageUpload} />
        </div>
    );
}
