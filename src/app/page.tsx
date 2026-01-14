
'use client';

import React from 'react';
import parse, { domToReact, HTMLReactParserOptions, Element } from 'html-react-parser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import Draggable from 'react-draggable';

import { Send, Bot, User, Camera, Paperclip, X, SwitchCamera, Pen, Eraser, File as FileIcon, Clipboard, Volume2, VolumeX, Play, PlusCircle, AppWindow, ExternalLink, Minimize } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DEFAULT_AGENTS, Agent } from '@/lib/agents';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AddModelsSheet } from '@/components/AddModelsSheet';
import { getUserAgents, saveUserAgents } from '@/lib/user-agents';


// Since puter.js is loaded via a script tag, we need to declare it to TypeScript
declare const puter: any;

// We will load marked.js dynamically, so we'll declare it here.
declare const marked: any;

interface PuterFile {
    read: () => Promise<string | ArrayBuffer>;
    name: string;
    path: string;
    type: string;
}

const CodeBlock = ({ code, lang }: { code: string, lang: string }) => {
    const [isCopied, setIsCopied] = React.useState(false);
    const isPreviewable = ['html', 'javascript', 'js', 'css'].includes(lang);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handlePreview = () => {
        try {
            puter.ui.showHtml(code);
        } catch (error) {
            console.error("Error showing preview:", error);
            alert("Could not display preview. The code may not be valid HTML.");
        }
    };

    return (
        <div className="relative">
            <pre>
                <code>{code}</code>
            </pre>
            <div className="absolute top-2 right-2 flex items-center gap-1">
                {isPreviewable && (
                    <Button
                        onClick={handlePreview}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Preview Code"
                    >
                        <Play className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    onClick={handleCopy}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Copy code"
                >
                    <Clipboard className="h-4 w-4" />
                </Button>
                {isCopied && <span className="text-xs text-green-400">Copied!</span>}
            </div>
        </div>
    );
};


export default function ChatPage() {
    const [chatHistory, setChatHistory] = React.useState<{ role: string, content: any, attachments?: any[] }[]>([]);
    const [currentChatFile, setCurrentChatFile] = React.useState<string | null>(null);
    
    // Agent state
    const [agents, setAgents] = React.useState<Agent[]>(DEFAULT_AGENTS);
    const [currentAgentId, setCurrentAgentId] = React.useState<string>(DEFAULT_AGENTS[0].id);
    const [puterUser, setPuterUser] = React.useState<any>(null);

    const [status, setStatus] = React.useState<string>('Ready');
    
    // Attachments State
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = React.useState<PuterFile[]>([]);
    
    // Camera and Drawing State
    const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
    const [showCamera, setShowCamera] = React.useState(false);
    const [cameraFacingMode, setCameraFacingMode] = React.useState<'user' | 'environment'>('user');
    const [brushColor, setBrushColor] = React.useState('#FF0000'); // Default to red
    const [isDrawingActive, setIsDrawingActive] = React.useState(false);

    // TTS State
    const [speakingMessageIndex, setSpeakingMessageIndex] = React.useState<number | null>(null);

    // Add Models Sheet state
    const [isAddModelsSheetOpen, setIsAddModelsSheetOpen] = React.useState(false);
    
    // App Launcher State
    const [appLauncherState, setAppLauncherState] = React.useState<{isOpen: boolean; url: string; name: string} | null>(null);

    // Script loading state
    const [markedLoaded, setMarkedLoaded] = React.useState(false);


    const chatWindowRef = React.useRef<HTMLDivElement>(null);
    const userInputRef = React.useRef<HTMLInputElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const draggableNodeRef = React.useRef(null);
    
    const agentProviders = React.useMemo(() => {
        const providers = agents.reduce((acc, agent) => {
            if (!acc[agent.provider]) {
                acc[agent.provider] = [];
            }
            acc[agent.provider].push(agent);
            return acc;
        }, {} as Record<string, Agent[]>);
        return Object.entries(providers);
    }, [agents]);


    // --- Core Functions ---
    const addMessage = (role: string, content: any, attachments?: any[]) => {
        setChatHistory(prev => [...prev, { role, content, attachments }]);
    };
    
    const handleSend = async () => {
        const userText = userInputRef.current?.value || '';
        if (!userText && !capturedImage && attachedFiles.length === 0) return;
    
        const selectedAgent = agents.find(agent => agent.id === currentAgentId);
    
        // Create a deep copy for the API payload to avoid mutations
        const historyForApi = JSON.parse(JSON.stringify(chatHistory));
        let messagePayload: any[] = [];
    
        if (selectedAgent && selectedAgent.systemPrompt) {
            messagePayload.push({ role: 'system', content: selectedAgent.systemPrompt });
        }
    
        // Add previous messages from state
        historyForApi.forEach((msg: any) => {
            const role = msg.role === 'ai' ? 'assistant' : msg.role;
            let content = msg.content;
            
            if (typeof content !== 'string') {
                content = "[attachment in history]";
            }
            messagePayload.push({ role, content });
        });
    
        const currentUserMessage: { role: string; content: any; attachments: any[] } = {
            role: 'user',
            content: userText || 'File(s) attached',
            attachments: []
        };
    
        let userMessageContentForApi: any[] = [];
        if (userText) {
            userMessageContentForApi.push({ type: 'text', text: userText });
        }
    
        if (capturedImage) {
            userMessageContentForApi.push({ type: 'image', source: { data: capturedImage } });
            currentUserMessage.attachments.push({ type: 'image/jpeg', data: capturedImage, name: 'capture.jpg' });
        }
    
        for (const file of attachedFiles) {
            const content = await file.read();
            userMessageContentForApi.push({ type: 'text', text: `Attached file: ${file.name}\n\n${content}` });
            currentUserMessage.attachments.push({ type: file.type, data: content, name: file.name });
        }
    
        messagePayload.push({ role: 'user', content: userMessageContentForApi });
    
        const newHistoryWithUser = [...chatHistory, currentUserMessage];
        setChatHistory(newHistoryWithUser);

        if (userInputRef.current) userInputRef.current.value = '';
        setCapturedImage(null);
        setAttachedFiles([]);
    
        setStatus('Thinking...');
    
        try {
            const aiResponse = await puter.ai.chat(messagePayload, { model: currentAgentId, max_tokens: 8192 });
            
            let responseText;
            
            if (aiResponse && aiResponse.message && typeof aiResponse.message.content === 'string') {
                responseText = aiResponse.message.content;
            } else if (aiResponse && aiResponse.message && Array.isArray(aiResponse.message.content) && aiResponse.message.content[0]?.type === 'text') {
                responseText = aiResponse.message.content[0].text;
            } else if (aiResponse && Array.isArray(aiResponse) && aiResponse.length > 0 && typeof aiResponse[0].text === 'string') {
                responseText = aiResponse[0].text;
            } else if (typeof aiResponse === 'string') {
                responseText = aiResponse;
            } else {
                 throw new Error("The AI returned a response in an unexpected format: " + JSON.stringify(aiResponse));
            }
            
            const finalHistory = [...newHistoryWithUser, { role: 'ai', content: responseText }];
            setChatHistory(finalHistory);
            await handleSaveChat(finalHistory); // Auto-save after response
            setStatus('Ready');
    
        } catch (error: any) {
            console.error("Error from AI:", error);
            const errorMessage = "```json\n" + JSON.stringify(error, null, 2) + "\n```";
            setChatHistory(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error: ' + errorMessage }]);
            setStatus('Ready');
        }
    };

    const handleSaveChat = async (historyToSave?: any[]) => {
        const history = historyToSave || chatHistory;
        if (!puterUser) {
             alert('Please log in to save your chat history.');
             return;
        }
        // Don't save if there's only the initial AI message
        if (!history || history.length <= 1) return;

        let fileName = currentChatFile;
        if (!fileName) {
            const newFileName = `Chat_${Date.now()}.json`;
            setCurrentChatFile(newFileName);
            fileName = newFileName;
        }

        try {
            setStatus('Syncing...');
            await puter.fs.write(fileName, JSON.stringify(history, null, 2));
            setStatus('Ready');
        } catch (error) {
            console.error('Error saving chat:', error);
            setStatus('Error saving');
        }
    };

    const startNewChat = () => {
        setChatHistory([{ role: 'ai', content: 'Hello! How can I help you today?' }]);
        if(userInputRef.current) userInputRef.current.value = '';
        setCapturedImage(null);
        setAttachedFiles([]);
        setCurrentChatFile(null); // This is now a new chat
    };

    // --- Attachment Functions ---
    const handleFilePicker = async () => {
        try {
            const files = await puter.ui.showOpenFilePicker({
                multiple: true,
            });
            setAttachedFiles(prev => [...prev, ...files]);
        } catch (error) {
            console.log("File picker was cancelled.");
        }
    };

    const removeAttachedFile = (filePath: string) => {
        setAttachedFiles(prev => prev.filter(f => f.path !== filePath));
    };


    // --- Camera & Drawing Functions ---
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startCamera = async (facingMode: 'user' | 'environment') => {
        stopCamera();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
            setShowCamera(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            setShowCamera(false);
        }
    };
    
    const handleCameraClick = () => {
        if (showCamera) {
            closeCameraView();
        } else {
            startCamera(cameraFacingMode);
        }
    };

    const closeCameraView = () => {
        stopCamera();
        setShowCamera(false);
        setIsDrawingActive(false);
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleFlipCamera = () => {
        const newFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
        setCameraFacingMode(newFacingMode);
        startCamera(newFacingMode);
    };

    const takePicture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = video.videoWidth;
            finalCanvas.height = video.videoHeight;
            const finalContext = finalCanvas.getContext('2d');
            
            if(finalContext){
                finalContext.drawImage(video, 0, 0, finalCanvas.width, finalCanvas.height);
                finalContext.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);
                
                const dataUri = finalCanvas.toDataURL('image/jpeg');
                setCapturedImage(dataUri);
            }
        }
        closeCameraView();
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    // --- TTS Function ---
    const handleSpeak = (text: string, index: number) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            alert('Your browser does not support text-to-speech.');
            return;
        }

        if (speakingMessageIndex === index) {
            window.speechSynthesis.cancel();
            setSpeakingMessageIndex(null);
        } else {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => {
                setSpeakingMessageIndex(null);
            };
            setSpeakingMessageIndex(index);
            window.speechSynthesis.speak(utterance);
        }
    };

    // --- Agent Management ---
    const handleAgentsUpdated = (updatedAgents: Agent[]) => {
        const newAgentList = [...DEFAULT_AGENTS, ...updatedAgents];
        setAgents(newAgentList);
        saveUserAgents(updatedAgents);
        if (!newAgentList.find(a => a.id === currentAgentId)) {
            setCurrentAgentId(newAgentList[0].id);
        }
    };
    
    // --- App Launcher ---
    const apps = [
        { name: 'Google', url: 'https://www.google.com/search?igu=1' },
        { name: 'Google Drive', url: 'https://drive.google.com/' },
        { name: 'Google Sheets', url: 'https://docs.google.com/spreadsheets/' },
        { name: 'Google Docs', url: 'https://docs.google.com/document/' },
        { name: 'Google Slides', url: 'https://docs.google.com/presentation/' },
        { name: 'Google Calendar', url: 'https://calendar.google.com/' },
    ];
    
    const launchApp = (url: string, name: string) => {
        setAppLauncherState({ isOpen: true, url, name });
    };

    const handleLogin = async () => {
        try {
            const user = await puter.auth.authenticate();
            setPuterUser(user);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleMinimize = () => {
        if (puter && puter.window && typeof puter.window.minimize === 'function') {
            puter.window.minimize();
        } else {
            console.warn("Puter window API not available.");
        }
    };

    React.useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || !showCamera) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        
        const setCanvasSize = () => {
            if (video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
        };
        video.addEventListener('loadedmetadata', setCanvasSize);
        setCanvasSize();

        let isDrawing = false;

        const getCoords = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const startDrawing = (e: MouseEvent | TouchEvent) => {
            if (!isDrawingActive) return;
            e.preventDefault();
            const { x, y } = getCoords(e);
            context.beginPath();
            context.lineWidth = 5;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.strokeStyle = brushColor;
            context.moveTo(x, y);
            isDrawing = true;
        };
        
        const draw = (e: MouseEvent | TouchEvent) => {
            if (!isDrawing || !isDrawingActive) return;
            e.preventDefault();
            const { x, y } = getCoords(e);
            context.lineTo(x, y);
            context.stroke();
        };
        
        const stopDrawing = () => {
            if (!isDrawing) return;
            isDrawing = false;
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
            video.removeEventListener('loadedmetadata', setCanvasSize);
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);
            canvas.removeEventListener('touchstart', startDrawing);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopDrawing);
        };
    }, [brushColor, isDrawingActive, showCamera]);
    

    // --- Effects ---

    React.useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = () => setMarkedLoaded(true);
        document.body.appendChild(script);

        const userAgents = getUserAgents();
        if (userAgents.length > 0) {
            setAgents([...DEFAULT_AGENTS, ...userAgents]);
        }

        const handlePuterReady = async () => {
            try {
                const user = await puter.auth.getUser();
                setPuterUser(user);
            } catch (e) {
                // User is not logged in
                setPuterUser(null);
            }
        };

        if (window.hasOwnProperty('puter')) {
            handlePuterReady();
        } else {
            window.addEventListener('puter.loaded', handlePuterReady, { once: true });
        }

        if (chatHistory.length === 0) {
            startNewChat();
        }

        return () => {
            window.removeEventListener('puter.loaded', handlePuterReady);
            stopCamera();
            window.speechSynthesis?.cancel();
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    React.useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // --- Render ---

    const renderMessageContent = (content: any) => {
        if (typeof content !== 'string') return null;
        if (!markedLoaded || typeof parse === 'undefined') {
            return <div className="whitespace-pre-wrap">{content}</div>;
        }

        const html = marked.parse(content, { gfm: true, breaks: true });

        const options: HTMLReactParserOptions = {
            replace: (domNode) => {
                if (domNode instanceof Element && domNode.tagName === 'pre') {
                    const codeNode = domNode.children.find(
                        (child) => child instanceof Element && child.tagName === 'code'
                    ) as Element | undefined;

                    if (codeNode && codeNode.children[0] && codeNode.children[0].type === 'text') {
                        const codeText = codeNode.children[0].data;
                        const langClass = codeNode.attribs.class || '';
                        const lang = langClass.startsWith('language-') ? langClass.replace('language-', '') : '';
                        return <CodeBlock code={codeText} lang={lang} />;
                    }
                }
                 if (domNode instanceof Element && domNode.attribs && domNode.attribs.href) {
                    return (
                        <a href={domNode.attribs.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {domToReact(domNode.children, options)}
                        </a>
                    );
                }
            },
        };

        return <div className="prose prose-invert max-w-none">{parse(html, options)}</div>;
    };
    
    const AttachmentPreview = ({ attachment }: { attachment: {type: string, data: any, name: string} }) => {
        if (attachment.type.startsWith('image/') && typeof attachment.data === 'string') {
            return <img src={attachment.data} alt={attachment.name} className="mt-2 rounded-lg max-w-xs" />;
        }
        return (
            <div className="mt-2 p-2 bg-secondary/50 rounded-lg flex items-center gap-2">
                <FileIcon className="h-5 w-5" />
                <span className="text-sm">{attachment.name}</span>
            </div>
        );
    };

    const isThinking = status === 'Thinking...';

    return (
        <div className="flex h-screen bg-background text-foreground">
            <ResizablePanelGroup direction="horizontal" className="w-full">
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <aside className="w-full h-full flex flex-col border-r border-border bg-secondary/20">
                         <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
                            {puterUser ? (
                                <>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Logged in as {puterUser.username}. Your chats are saved to your Puter account.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => window.open('https://puter.com/files', '_blank')}
                                        disabled={isThinking}
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View Saved Chats
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Log in to save your chat history and view it on Puter.com.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleLogin}
                                    >
                                        Log In to Puter
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="p-2 border-t border-border space-y-2">
                             <Button className="w-full" variant="outline" onClick={() => handleSaveChat()} disabled={isThinking || !puterUser}>
                                Save Chat
                            </Button>
                            <Button className="w-full" onClick={startNewChat} disabled={isThinking}>
                                New Chat
                            </Button>
                        </div>
                    </aside>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={80}>
                    <main className="flex-1 flex flex-col h-full">
                        <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Infinity AI</span>
                                <Button onClick={handleMinimize} size="icon" variant="ghost" title="Minimize Window">
                                    <Minimize className="h-5 w-5" />
                                </Button>
                                 <Button onClick={() => setIsAddModelsSheetOpen(true)} size="icon" variant="ghost" title="Add/Remove Models">
                                    <PlusCircle className="h-5 w-5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" title="Launch App">
                                            <AppWindow className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {apps.map(app => (
                                            <DropdownMenuItem key={app.name} onClick={() => launchApp(app.url, app.name)}>
                                                {app.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <span className="text-primary text-sm">{status}</span>
                            </div>
                            <Select value={currentAgentId} onValueChange={setCurrentAgentId} disabled={isThinking}>
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Select an AI Agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agentProviders.map(([provider, agents]) => (
                                        <SelectGroup key={provider}>
                                            <SelectLabel>{provider}</SelectLabel>
                                            {agents.map(agent => (
                                                <SelectItem key={agent.id} value={agent.id}>
                                                    {agent.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        </header>

                        <div id="chat-window" ref={chatWindowRef} className="flex-1 overflow-y-auto p-6 space-y-8">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-4`}>
                                {msg.role === 'ai' && <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                                    <div className={`p-4 rounded-lg max-w-2xl group relative ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary pr-12'}`}>
                                        {renderMessageContent(msg.content)}
                                        {msg.attachments?.map((att: any, i: number) => (
                                            <AttachmentPreview key={i} attachment={att} />
                                        ))}
                                        {msg.role === 'ai' && typeof msg.content === 'string' && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                                                onClick={() => handleSpeak(msg.content, index)}
                                            >
                                                {speakingMessageIndex === index ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                {msg.role === 'user' && <Avatar><AvatarFallback className="bg-primary text-primary-foreground"><User /></AvatarFallback></Avatar>}
                                </div>
                            ))}
                        </div>
                        
                        {/* Camera View */}
                        {showCamera && (
                            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
                                <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" autoPlay muted playsInline />
                                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: isDrawingActive ? 'auto' : 'none' }}/>

                                {isDrawingActive && (
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 bg-black/50 p-2 rounded-lg">
                                        <Button size="icon" variant="ghost" onClick={() => setBrushColor('#FF0000')} className={brushColor === '#FF0000' ? 'border-2 border-white' : ''}>
                                            <div className="w-6 h-6 rounded-full bg-red-500"/>
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setBrushColor('#00FF00')} className={brushColor === '#00FF00' ? 'border-2 border-white' : ''}>
                                            <div className="w-6 h-6 rounded-full bg-green-500"/>
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setBrushColor('#0000FF')} className={brushColor === '#0000FF' ? 'border-2 border-white' : ''}>
                                            <div className="w-6 h-6 rounded-full bg-blue-500"/>
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={clearCanvas}>
                                            <Eraser className="text-white"/>
                                        </Button>
                                    </div>
                                )}

                                <div className="absolute bottom-10 w-full flex justify-center items-center gap-8">
                                    <Button onClick={closeCameraView} size="icon" variant="ghost" className="absolute left-10 bg-black/30 hover:bg-black/50">
                                        <X className="h-8 w-8 text-white"/>
                                    </Button>
                                    
                                    <Button onClick={takePicture} className="w-20 h-20 rounded-full border-4 border-white bg-white/30 hover:bg-white/50 ring-offset-0 focus:ring-0 focus:outline-none" />

                                    <Button onClick={() => setIsDrawingActive(!isDrawingActive)} size="icon" variant="ghost" className={`absolute right-24 bg-black/30 hover:bg-black/50 ${isDrawingActive ? 'bg-white/30' : ''}`}>
                                        <Pen className="h-8 w-8 text-white"/>
                                    </Button>
                                    <Button onClick={handleFlipCamera} size="icon" variant="ghost" className="absolute right-10 bg-black/30 hover:bg-black/50">
                                        <SwitchCamera className="h-8 w-8 text-white"/>
                                    </Button>
                                </div>
                            </div>
                        )}

                         {/* App Launcher Window */}
                        {appLauncherState?.isOpen && (
                            <Draggable nodeRef={draggableNodeRef} handle=".draggable-handle">
                                <div ref={draggableNodeRef} className="fixed top-1/4 left-1/4 z-50">
                                    <Dialog open onOpenChange={(open) => !open && setAppLauncherState(null)}>
                                        <DialogContent className="p-0 border-2 shadow-2xl w-[800px] h-[600px] flex flex-col gap-0 !rounded-lg overflow-hidden">
                                            <DialogHeader className="draggable-handle bg-secondary text-secondary-foreground p-2 flex flex-row items-center justify-between cursor-move !space-y-0">
                                                <DialogTitle className="text-sm font-medium">{appLauncherState.name}</DialogTitle>
                                                <DialogClose asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-4 w-4"/></Button>
                                                </DialogClose>
                                            </DialogHeader>
                                            <iframe src={appLauncherState.url} className="w-full h-full border-0" />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </Draggable>
                        )}


                        <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
                            {hasCameraPermission === false && (
                                <div className="max-w-3xl mx-auto mb-4">
                                    <Alert variant="destructive">
                                        <AlertTitle>Camera Access Denied</AlertTitle>
                                        <AlertDescription>
                                        Please allow camera access in your browser settings to use this feature.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            <div className="relative max-w-3xl mx-auto w-full">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {capturedImage && (
                                        <div className="flex items-center gap-2 bg-secondary p-1 pr-2 rounded-full">
                                            <Camera className="h-5 w-5 text-muted-foreground"/>
                                            <span className="text-sm text-muted-foreground">Image</span>
                                            <button onClick={() => setCapturedImage(null)} className="p-0.5 rounded-full hover:bg-background"><X className="h-3 w-3"/></button>
                                        </div>
                                    )}
                                    {attachedFiles.map(file => (
                                        <div key={file.path} className="flex items-center gap-2 bg-secondary p-1 pr-2 rounded-full">
                                            <FileIcon className="h-5 w-5 text-muted-foreground"/>
                                            <span className="text-sm text-muted-foreground truncate max-w-[100px]">{file.name}</span>
                                            <button onClick={() => removeAttachedFile(file.path)} className="p-0.5 rounded-full hover:bg-background"><X className="h-3 w-3"/></button>

                                        </div>
                                    ))}
                                </div>

                                <Input
                                    id="user-input"
                                    placeholder="Ask your agent anything..."
                                    ref={userInputRef}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                    className="pr-32 pl-4"
                                    style={{paddingLeft: `${(capturedImage ? 80 : 0) + attachedFiles.reduce((acc, file) => acc + Math.min(100, file.name.length * 7) + 40, 5)}px`}}
                                    disabled={isThinking}
                                />
                                <div className="absolute inset-y-0 right-2 flex items-center">
                                    <Button onClick={handleFilePicker} size="icon" variant="ghost" title="Attach Files" disabled={isThinking}>
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                    <Button onClick={handleCameraClick} size="icon" variant="ghost" title="Use Camera" disabled={isThinking}>
                                        <Camera className="h-5 w-5" />
                                    </Button>
                                    <Button onClick={() => handleSend()} size="icon" variant="ghost" title="Send Message" disabled={isThinking}>
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </main>
                </ResizablePanel>
            </ResizablePanelGroup>

             <AddModelsSheet
                isOpen={isAddModelsSheetOpen}
                onOpenChange={setIsAddModelsSheetOpen}
                currentAgents={agents}
                onAgentsUpdated={handleAgentsUpdated}
            />
        </div>
    );
}

    