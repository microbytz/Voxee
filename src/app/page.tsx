
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Since puter.js and marked.js are loaded via script tags, we need to declare them to TypeScript
declare const puter: any;
declare const marked: any;

export default function ChatPage() {
    const [chatHistory, setChatHistory] = React.useState<{ role: string, content: any }[]>([]);
    const [historyFiles, setHistoryFiles] = React.useState<{ name: string, path: string }[]>([]);
    const [currentAgent, setCurrentAgent] = React.useState<string>('gpt-5-nano');
    const [status, setStatus] = React.useState<string>('Ready');

    const chatWindowRef = React.useRef<HTMLDivElement>(null);
    const userInputRef = React.useRef<HTMLInputElement>(null);

    // --- Core Functions ---

    const addMessage = (role: string, content: any) => {
        setChatHistory(prev => [...prev, { role, content }]);
    };
    
    const handleSend = async () => {
        const userText = userInputRef.current?.value || '';
        if (!userText) return;
    
        const newHistory = [...chatHistory, { role: 'user', content: userText }];
        setChatHistory(newHistory);
    
        if (userInputRef.current) {
            userInputRef.current.value = '';
        }
    
        setStatus('Thinking...');
    
        try {
            // The puter.ai.chat function handles conversation history automatically.
            // We only need to send the latest user message.
            const aiResponse = await puter.ai.chat(userText, { model: currentAgent });
            
            if (!aiResponse) {
                throw new Error("The AI returned an empty response. This could be due to a network issue or a problem with the AI model. Please try again.");
            }
            addMessage('ai', aiResponse);
            
            const finalHistoryForSave = [...newHistory, { role: 'ai', content: aiResponse }];
            // Auto-save chat
            await puter.fs.write(`Chat_${Date.now()}.json`, JSON.stringify(finalHistoryForSave, null, 2));
            loadHistory(); // Refresh history list
    
        } catch (error: any) {
            console.error("Error from AI:", error);
            const errorMessage = error.message || 'The AI returned an empty response. This could be due to a network issue or a problem with the AI model. Please try again.';
            addMessage('ai', 'Sorry, I encountered an error: ' + errorMessage);
        } finally {
            setStatus('Ready');
        }
    };

    const loadHistory = async () => {
        try {
            const files = await puter.fs.readdir('/');
            const chatFiles = files
              .filter((f: {name: string}) => f.name.startsWith('Chat_') && f.name.endsWith('.json'))
              .sort((a: {name: string}, b: {name: string}) => b.name.localeCompare(a.name)); // Sort descending
            setHistoryFiles(chatFiles);
        } catch (error: any) {
            console.error('Error loading history:', error.message || error);
        }
    };

    const viewChat = async (file: { name: string, path: string }) => {
        try {
            const content = await puter.fs.read(file.path);
            const loadedHistory = JSON.parse(content);
            setChatHistory(loadedHistory);
        } catch (error: any) {
            console.error('Error viewing chat:', error);
            alert('Error loading chat.');
        }
    };
    
    const startNewChat = () => {
        setChatHistory([{ role: 'ai', content: 'Hello! How can I help you today?' }]);
        if(userInputRef.current) userInputRef.current.value = '';
    };

    // --- Effects ---

    React.useEffect(() => {
        const handlePuterReady = async () => {
            startNewChat();
            loadHistory();
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
        if (typeof content !== 'string') return null;
        if (typeof marked === 'undefined') {
            return <div className="whitespace-pre-wrap">{content}</div>;
        }
        const html = marked.parse(content);
        return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="flex h-screen bg-background text-foreground">
            <aside className="w-64 flex flex-col border-r border-border bg-secondary/20">
                <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-semibold tracking-tight">☁️ Cloud History</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                        {historyFiles.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">No saved chats.</p>}
                        {historyFiles.map(file => (
                            <Button
                                key={file.path}
                                variant="ghost"
                                className="w-full justify-start text-muted-foreground hover:text-foreground"
                                onClick={() => viewChat(file)}
                            >
                                <span className="truncate">📄 {new Date(parseInt(file.name.replace('Chat_', '').replace('.json',''))).toLocaleString()}</span>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="p-2 border-t border-border">
                    <Button className="w-full" onClick={startNewChat}>
                         New Chat
                    </Button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                 <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm">
                    <div className="font-bold">Infinity AI <span className="text-primary text-sm ml-2">{status}</span></div>
                    <Select value={currentAgent} onValueChange={setCurrentAgent}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select an AI Agent" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gpt-5-nano">⚡ GPT-5 Nano (Fast & Free)</SelectItem>
                            <SelectItem value="claude-3-5-sonnet">🧠 Claude 3.5 Sonnet (Logic)</SelectItem>
                            <SelectItem value="gemini-2.0-flash">🚀 Gemini 2.0 Flash (Fast)</SelectItem>
                            <SelectItem value="deepseek-chat">🤖 DeepSeek V3 (Coding)</SelectItem>
                            <SelectItem value="meta-llama/llama-3.1-70b">🦙 Llama 3.1 (Open Source)</SelectItem>
                        </SelectContent>
                    </Select>
                </header>

                <div id="chat-window" ref={chatWindowRef} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4`}>
                           {msg.role === 'ai' && <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                            <div className={`p-4 rounded-lg max-w-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary'}`}>
                                {renderMessageContent(msg.content)}
                            </div>
                           {msg.role === 'user' && <Avatar><AvatarFallback className="bg-primary text-primary-foreground"><User /></AvatarFallback></Avatar>}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
                    <div className="relative max-w-3xl mx-auto">
                        <Input
                            id="user-input"
                            placeholder="Ask your agent anything..."
                            ref={userInputRef}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            className="pr-16 bg-secondary"
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <Button onClick={() => handleSend()} size="icon" variant="ghost" title="Send Message">
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
