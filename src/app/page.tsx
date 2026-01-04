
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Send, Bot, User, Camera, Paperclip, X, SwitchCamera, Pen, Eraser, File as FileIcon, Save } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AGENTS, Agent } from '@/lib/agents';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '@/components/ui/scroll-area';


// Since puter.js and marked.js are loaded via script tags, we need to declare them to TypeScript
declare const puter: any;
declare const marked: any;

interface PuterFile {
    read: () => Promise<string | ArrayBuffer>;
    name: string;
    path: string;
    type: string;
}

export default function ChatPage() {
    const [chatHistory, setChatHistory] = React.useState<{ role: string, content: any }[]>([]);
    const [historyFiles, setHistoryFiles] = React.useState<{ name: string, path: string }[]>([]);
    const [currentAgentId, setCurrentAgentId] = React.useState<string>(AGENTS[0].id);
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


    const chatWindowRef = React.useRef<HTMLDivElement>(null);
    const userInputRef = React.useRef<HTMLInputElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    
    const agentProviders = React.useMemo(() => {
        const providers = AGENTS.reduce((acc, agent) => {
            if (!acc[agent.provider]) {
                acc[agent.provider] = [];
            }
            acc[agent.provider].push(agent);
            return acc;
        }, {} as Record<string, Agent[]>);
        return Object.entries(providers);
    }, []);


    // --- Core Functions ---

    const addMessage = (role: string, content: any) => {
        setChatHistory(prev => [...prev, { role, content }]);
    };
    
    const handleSend = async () => {
        const userText = userInputRef.current?.value || '';
        if (!userText && !capturedImage && attachedFiles.length === 0) return;
    
        const selectedAgent = AGENTS.find(agent => agent.id === currentAgentId);
        
        let messageContent: any = [];
        if (selectedAgent && selectedAgent.systemPrompt) {
            messageContent.push({ role: 'system', content: selectedAgent.systemPrompt });
        }
    
        let userMessage: any = { role: 'user', content: [] };
        if(userText) userMessage.content.push({ type: 'text', text: userText });
    
        const currentMessageForHistory = {
            role: 'user',
            content: userText || 'File(s) attached',
            attachments: [] as {type: string, data: string | ArrayBuffer, name: string}[]
        };
    
        if (capturedImage) {
            userMessage.content.push({ type: 'image', source: { data: capturedImage } });
            currentMessageForHistory.attachments.push({ type: 'image/jpeg', data: capturedImage, name: 'capture.jpg' });
        }
        
        for (const file of attachedFiles) {
            const content = await file.read();
            userMessage.content.push({ type: 'text', text: `Attached file: ${file.name}`});
            // A more robust implementation would handle different file types
            if (typeof content === 'string') {
                 userMessage.content.push({ type: 'text', text: content });
            }
            currentMessageForHistory.attachments.push({ type: file.type, data: content, name: file.name });
        }
        
        messageContent.push(userMessage);
    
        const newHistory = [...chatHistory, currentMessageForHistory];
        setChatHistory(newHistory);
        
        if (userInputRef.current) userInputRef.current.value = '';
        setCapturedImage(null);
        setAttachedFiles([]);
        
        setStatus('Thinking...');
    
        try {
            const aiResponse = await puter.ai.chat(messageContent, { model: currentAgentId, max_tokens: 8192 });
            
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
            
            addMessage('ai', responseText);
    
        } catch (error: any) {
            console.error("Error from AI:", error);
            const errorMessage = "```json\n" + JSON.stringify(error, null, 2) + "\n```";
            addMessage('ai', 'Sorry, I encountered an error: ' + errorMessage);
        } finally {
            setStatus('Ready');
        }
    };

    const handleSaveChat = async () => {
        if (chatHistory.length === 0) return;
        try {
            setStatus('Saving...');
            await puter.fs.write(`Chat_${Date.now()}.json`, JSON.stringify(chatHistory, null, 2));
            await loadHistory();
            setStatus('Ready');
        } catch (error) {
            console.error('Error saving chat:', error);
            setStatus('Error saving');
        }
    };

    const loadHistory = async () => {
        try {
            const files = await puter.fs.readdir('/');
            const chatFiles = files
              .filter((f: {name: string}) => f.name.startsWith('Chat_') && f.name.endsWith('.json'))
              .sort((a: {name: string}, b: {name: string}) => b.name.localeCompare(a.name)); 
            setHistoryFiles(chatFiles);
        } catch (error: any) {
            console.error('Error loading history:', error);
        }
    };

    const viewChat = async (file: { name: string, path: string }) => {
        try {
            const content = await puter.fs.read(file.path);
            const loadedHistory = JSON.parse(content as string);
            setChatHistory(loadedHistory);
        } catch (error: any) {
            console.error('Error viewing chat:', error);
            alert('Error loading chat.');
        }
    };
    
    const startNewChat = () => {
        setChatHistory([{ role: 'ai', content: 'Hello! How can I help you today?' }]);
        if(userInputRef.current) userInputRef.current.value = '';
        setCapturedImage(null);
        setAttachedFiles([]);
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
                // Draw video frame
                finalContext.drawImage(video, 0, 0, finalCanvas.width, finalCanvas.height);
                // Draw drawings from the other canvas on top
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
        const handlePuterReady = async () => {
            try {
              await puter.auth.getUser(); 
              loadHistory(); 
            } catch(e) {
                // Not logged in
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

    return (
        <div className="flex h-screen bg-background text-foreground">
            <ResizablePanelGroup direction="horizontal" className="w-full">
                <ResizablePanel defaultSize={20} minSize={10} maxSize={30}>
                    <aside className="w-full h-full flex-col border-r border-border bg-secondary/20 flex">
                        <div className="p-4 border-b border-border">
                            <h2 className="text-lg font-semibold tracking-tight">☁️ Cloud History</h2>
                        </div>
                        <ScrollArea className="flex-1 overflow-y-auto p-2">
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
                        </ScrollArea>
                        <div className="p-2 border-t border-border">
                            <Button className="w-full" onClick={startNewChat}>
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
                                <Button onClick={handleSaveChat} size="icon" variant="ghost" title="Save Chat">
                                    <Save className="h-5 w-5" />
                                </Button>
                                <span className="text-primary text-sm">{status}</span>
                            </div>
                            <Select value={currentAgentId} onValueChange={setCurrentAgentId}>
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
                                    <div className={`p-4 rounded-lg max-w-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary'}`}>
                                        {renderMessageContent(msg.content)}
                                        {(msg as any).attachments?.map((att: any, i: number) => (
                                            <AttachmentPreview key={i} attachment={att} />
                                        ))}
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
                                />
                                <div className="absolute inset-y-0 right-2 flex items-center">
                                    <Button onClick={handleFilePicker} size="icon" variant="ghost" title="Attach Files">
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                    <Button onClick={handleCameraClick} size="icon" variant="ghost" title="Use Camera">
                                        <Camera className="h-5 w-5" />
                                    </Button>
                                    <Button onClick={() => handleSend()} size="icon" variant="ghost" title="Send Message">
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </main>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
