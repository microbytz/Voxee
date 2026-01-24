
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Agent } from '@/lib/agents';
import { getUserAgents, saveUserAgents } from '@/lib/user-agents';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { KeyRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AddApiKeySheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onAgentsUpdated: (updatedAgents: Agent[]) => void;
}

export function AddApiKeySheet({ isOpen, onOpenChange, onAgentsUpdated }: AddApiKeySheetProps) {
    const [agentName, setAgentName] = useState('');
    const [provider, setProvider] = useState('OpenAI');
    const [modelId, setModelId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        if (!agentName || !modelId || !apiKey) {
            setError('Please fill out Agent Name, Model ID, and API Key.');
            return;
        }
        setError(null);

        const newAgent: Agent = {
            id: `custom-${Date.now()}`,
            name: agentName,
            provider,
            model: modelId,
            apiKey,
            systemPrompt: systemPrompt || `You are a helpful assistant powered by ${modelId}.`,
            isCustom: true,
        };

        const existingAgents = getUserAgents();
        const updatedAgents = [...existingAgents, newAgent];
        
        // No need to call saveUserAgents here as onAgentsUpdated will do it.
        onAgentsUpdated(updatedAgents);
        onOpenChange(false);

        // Reset form
        setAgentName('');
        setProvider('OpenAI');
        setModelId('');
        setApiKey('');
        setSystemPrompt('');
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                    <SheetTitle>Add Custom Agent</SheetTitle>
                    <SheetDescription>
                        Bring your own API key to use any model you have access to.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-1">
                    <div className="space-y-4 py-4">
                        <Alert variant="destructive">
                            <KeyRound className="h-4 w-4" />
                            <AlertTitle>Security Warning</AlertTitle>
                            <AlertDescription>
                                API keys are stored in your browser's local storage. Do not use this feature in a shared or public browser.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label htmlFor="agent-name">Agent Name</Label>
                            <Input
                                id="agent-name"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                placeholder="My Custom GPT-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="provider">Provider</Label>
                             <Select value={provider} onValueChange={setProvider}>
                                <SelectTrigger id="provider">
                                    <SelectValue placeholder="Select a provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                                    {/* Add other providers here in the future */}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="model-id">Model ID</Label>
                            <Input
                                id="model-id"
                                value={modelId}
                                onChange={(e) => setModelId(e.target.value)}
                                placeholder="gpt-4-turbo"
                            />
                             <p className="text-xs text-muted-foreground">e.g., gpt-4-turbo, gpt-3.5-turbo</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="api-key">API Key</Label>
                            <Input
                                id="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
                            <Textarea
                                id="system-prompt"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="min-h-[150px]"
                                placeholder="You are a helpful assistant..."
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Agent</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
