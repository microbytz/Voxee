
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Agent } from '@/lib/agents';
import { Loader2 } from 'lucide-react';

declare const puter: any;

interface PuterModel {
    id: string;
    name?: string;
    provider?: string;
    owner?: string;
}

interface AddModelsSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    currentAgents: Agent[];
    onAgentsUpdated: (updatedAgents: Agent[]) => void;
}

export function AddModelsSheet({ isOpen, onOpenChange, currentAgents, onAgentsUpdated }: AddModelsSheetProps) {
    const [allModels, setAllModels] = useState<PuterModel[]>([]);
    const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchModels = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const models = await puter.ai.models();
                    setAllModels(models);
                    
                    const initialSelected = new Set(currentAgents.map(a => a.id));
                    setSelectedModelIds(initialSelected);

                } catch (e) {
                    console.error("Failed to fetch models:", e);
                    setError("Could not load models from Puter. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchModels();
        }
    }, [isOpen, currentAgents]);

    const handleCheckboxChange = (modelId: string, checked: boolean) => {
        setSelectedModelIds(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(modelId);
            } else {
                newSet.delete(modelId);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        const userSelectedAgents: Agent[] = allModels
            .filter(model => selectedModelIds.has(model.id))
            .map(model => ({
                id: model.id,
                name: model.name || model.id,
                provider: model.provider || model.owner || 'Custom',
                systemPrompt: `You are ${model.name || model.id}.`, // Default prompt
            }));
        
        // We only want to save the agents that are NOT in the default list
        const defaultAgentIds = new Set(['gpt-5-nano', 'gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'anthropic/claude-3-opus', 'anthropic/claude-3-haiku', 'gemini-2.0-flash', 'gemini-1.5-pro', 'deepseek-chat', 'togetherai:meta-llama/meta-llama-3.1-70b-instruct-turbo', 'mistral-large', 'mixtral-8x7b']);
        const agentsToSave = userSelectedAgents.filter(agent => !defaultAgentIds.has(agent.id));
        
        onAgentsUpdated(agentsToSave);
        onOpenChange(false);
    };

    const modelsByProvider = allModels.reduce((acc, model) => {
        const provider = model.provider || model.owner || 'Unknown';
        if (!acc[provider]) {
            acc[provider] = [];
        }
        acc[provider].push(model);
        return acc;
    }, {} as Record<string, PuterModel[]>);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                    <SheetTitle>Add & Remove AI Models</SheetTitle>
                    <SheetDescription>
                        Select models from the Puter library to add them to your agent list.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-2">Loading models...</span>
                            </div>
                        ) : error ? (
                             <div className="text-destructive text-center p-4">{error}</div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(modelsByProvider).map(([provider, models]) => (
                                    <div key={provider}>
                                        <h3 className="font-semibold text-lg mb-2 capitalize">{provider}</h3>
                                        <div className="space-y-2">
                                            {models.map(model => (
                                                <div key={model.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary">
                                                    <Checkbox
                                                        id={model.id}
                                                        checked={selectedModelIds.has(model.id)}
                                                        onCheckedChange={(checked) => handleCheckboxChange(model.id, !!checked)}
                                                    />
                                                    <label
                                                        htmlFor={model.id}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {model.name || model.id}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>Save Changes</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
