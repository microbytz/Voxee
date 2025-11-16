"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/chat/chat-message';
import { AiAvatar } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import type { Message } from '@/lib/types';

interface ChatMessagesProps {
    messages: Message[];
    isAiTyping: boolean;
    speak: (text: string) => void;
}

export function ChatMessages({ messages, isAiTyping, speak }: ChatMessagesProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, isAiTyping]);

    return (
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
                {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} onSpeak={() => speak(message.content)} />
                ))}
                {isAiTyping && (
                    <div className="flex items-end gap-3 animate-pulse">
                        <AiAvatar className="w-8 h-8 flex-shrink-0" />
                        <div className="flex items-center gap-1 p-3 rounded-lg bg-card max-w-max">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Voxee is typing...</span>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
