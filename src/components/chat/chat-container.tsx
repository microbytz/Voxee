"use client";

import { useState, useCallback } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

import type { Message, Settings } from '@/lib/types';
import { useSpeech } from '@/hooks/use-speech';
import { handleUserRequest } from '@/app/actions';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiAvatar, Logo } from '@/components/icons';
import { SettingsPanel } from '@/components/chat/settings-panel';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';

const initialMessages: Message[] = [
    {
        id: '1',
        sender: 'ai',
        type: 'text',
        content: "Hello! I'm Voxee, your AI assistant. How can I help you today? You can ask me questions, upload a document to summarize, or try commands like `/imagine a futuristic city` or `/code python a function to sort a list`.",
    },
];

export function ChatContainer() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [settings, setSettings] = useState<Settings>({
        voice: '',
        pitch: 1,
        rate: 1,
        personality: 'default',
        verbosity: 'default',
        style: 'casual',
        autoSpeak: false,
    });

    const { speak, ...speechProps } = useSpeech(settings);

    const processUserMessage = useCallback(async (message: string, fileDataUri?: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            sender: 'user',
            type: 'text',
            content: message || (fileDataUri ? "Here's a file I uploaded." : ""),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsAiTyping(true);

        const aiResponse = await handleUserRequest({ message, fileDataUri });

        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            ...aiResponse,
        };

        setIsAiTyping(false);
        setMessages(prev => [...prev, aiMessage]);

        if (settings.autoSpeak && aiResponse.type === 'text' && aiResponse.content) {
            speak(aiResponse.content);
        }
    }, [settings.autoSpeak, speak]);


    return (
        <Card className="w-full max-w-3xl h-[95vh] flex flex-col shadow-2xl rounded-xl overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <Logo className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-bold font-headline">Voxee AI Assistant</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                    <SettingsIcon className="w-5 h-5" />
                    <span className="sr-only">Settings</span>
                </Button>
            </header>

            <ChatMessages messages={messages} isAiTyping={isAiTyping} speak={speak} />

            <div className="p-4 border-t bg-background/80">
                <ChatInput
                    onSubmit={processUserMessage}
                    speech={speechProps}
                />
            </div>

            <SettingsPanel
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                settings={settings}
                setSettings={setSettings}
                voices={speechProps.voices}
            />
        </Card>
    );
}
