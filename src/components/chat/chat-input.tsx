"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { useSpeech } from '@/hooks/use-speech';

interface ChatInputProps {
    onSubmit: (message: string, fileDataUri?: string) => void;
    speech: Omit<ReturnType<typeof useSpeech>, 'speak' | 'isSpeaking' | 'voices'>;
}

export function ChatInput({ onSubmit, speech }: ChatInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [fileDataUri, setFileDataUri] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isListening, transcript, startListening, stopListening, setTranscript, supported: speechSupported } = speech;

    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (transcript) {
            setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
            setTranscript('');
        }
    }, [transcript, setTranscript]);
    
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [inputValue]);

    const handleMicToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const finalInput = inputValue.trim();
        if (!finalInput && !fileDataUri) return;

        setIsSubmitting(true);
        await onSubmit(finalInput, fileDataUri);
        setInputValue('');
        setFileDataUri(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsSubmitting(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUri = e.target?.result as string;
                setFileDataUri(dataUri);
                toast({
                    title: "File attached",
                    description: `${file.name} is ready to be sent.`,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={isListening ? "Listening..." : "Type a message or command..."}
                rows={1}
                className="flex-1 resize-none max-h-40 pr-24"
                disabled={isSubmitting}
            />
            <div className="absolute right-3 bottom-2 flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                    <Paperclip className="w-5 h-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                {isClient && speechSupported && (
                    <Button type="button" variant={isListening ? "destructive" : "ghost"} size="icon" onClick={handleMicToggle} disabled={isSubmitting}>
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                    </Button>
                )}
                
                <Button type="submit" size="icon" disabled={isSubmitting || (!inputValue && !fileDataUri)}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </form>
    );
}
