"use client";

import Image from 'next/image';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar, AiAvatar } from '@/components/icons';

interface ChatMessageProps {
    message: Message;
    onSpeak: () => void;
}

export function ChatMessage({ message, onSpeak }: ChatMessageProps) {
    const { sender, content, type, codeLanguage } = message;
    const isUser = sender === 'user';

    const renderContent = () => {
        switch (type) {
            case 'image':
                return (
                    <Image
                        src={content}
                        alt="Generated image"
                        width={400}
                        height={400}
                        className="rounded-lg object-cover"
                    />
                );
            case 'code':
                return (
                    <div className="w-full">
                        <div className="bg-gray-800 text-white p-2 rounded-t-lg text-xs flex justify-between items-center">
                            <span>{codeLanguage}</span>
                        </div>
                        <pre className="bg-gray-900 text-white p-4 rounded-b-lg overflow-x-auto text-sm">
                            <code>{content}</code>
                        </pre>
                    </div>
                );
            case 'summary':
                return <p className="text-sm italic">{content}</p>;
            default:
                return <p className="leading-relaxed whitespace-pre-wrap">{content}</p>;
        }
    };

    return (
        <div className={cn("flex items-end gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && <AiAvatar className="w-8 h-8 flex-shrink-0" />}
            
            <Card className={cn(
                "max-w-xl shadow-md",
                isUser ? "bg-primary text-primary-foreground" : "bg-card"
            )}>
                <CardContent className="p-3 relative group">
                    {renderContent()}
                    {!isUser && type === 'text' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={onSpeak}
                        >
                            <Volume2 className="w-4 h-4" />
                        </Button>
                    )}
                </CardContent>
            </Card>

            {isUser && <UserAvatar className="w-8 h-8 flex-shrink-0" />}
        </div>
    );
}
