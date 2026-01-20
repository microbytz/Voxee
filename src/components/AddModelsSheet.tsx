
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Agent, DEFAULT_AGENTS } from '@/lib/agents';
import { Loader2, Pen } from 'lucide-react';

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

    // State for editing agents
    const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedPrompt, setEditedPrompt] = useState('');
    const [customizations, setCustomizations] = useState<Record<string, Partial<Agent>>>({});


    useEffect(() => {
        if (isOpen) {
            const fetchModelsAndSetup = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const models = await puter.ai.listModels();
                    setAllModels(models);
                    
                    const initialSelected = new Set(currentAgents.map(a => a.id));
                    setSelectedModelIds(initialSelected);

                    // Pre-fill customizations from current agents that are not default
                    const initialCustoms: Record<string, Partial<Agent>> = {};
                    currentAgents.forEach(agent => {
                        const isDefault = DEFAULT_AGENTS.some(d => d.id === agent.id && d.name === agent.name && d.systemPrompt === agent.systemPrompt);
                        if (!isDefault) {
                            initialCustoms[agent.id] = { name: agent.name, systemPrompt: agent.systemPrompt };
                        }
                    });
                    setCustomizations(initialCustoms);

                } catch (e) {
                    console.error("Failed to fetch models:", e);
                    setError("Could not load models from Puter. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchModelsAndSetup();
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

    const handleEditClick = (model: PuterModel) => {
        const customData = customizations[model.id];
        const currentAgent = currentAgents.find(a => a.id === model.id);
        const defaultAgent = DEFAULT_AGENTS.find(a => a.id === model.id);

        const agent: Agent = {
            id: model.id,
            name: customData?.name || currentAgent?.name || defaultAgent?.name || model.name || model.id,
            provider: currentAgent?.provider || defaultAgent?.provider || model.provider || model.owner || 'Custom',
            systemPrompt: customData?.systemPrompt || currentAgent?.systemPrompt || defaultAgent?.systemPrompt || `You are ${model.name || model.id}.`,
        };
        
        setAgentToEdit(agent);
        setEditedName(agent.name);
        setEditedPrompt(agent.systemPrompt);
    };

    const handleDialogSave = () => {
        if (!agentToEdit) return;
        setCustomizations(prev => ({
            ...prev,
            [agentToEdit.id]: { name: editedName, systemPrompt: editedPrompt }
        }));
        setAgentToEdit(null);
    };

    const handleSave = () => {
        // 1. Get all selected models and create Agent objects for them, applying customizations.
        const allSelectedAgents: Agent[] = allModels
            .filter(model => selectedModelIds.has(model.id))
            .map(model => {
                const customData = customizations[model.id];
                const defaultAgent = DEFAULT_AGENTS.find(a => a.id === model.id);
                const baseName = model.name || model.id;

                return {
                    id: model.id,
                    name: customData?.name || defaultAgent?.name || baseName,
                    provider: defaultAgent?.provider || model.provider || model.owner || 'Custom',
                    systemPrompt: customData?.systemPrompt || defaultAgent?.systemPrompt || `You are ${baseName}.`,
                };
            });

        // 2. Figure out which of these need to be saved to localStorage.
        // These are the ones that are NOT default agents, or ARE default agents but are customized.
        const agentsForStorage = allSelectedAgents.filter(agent => {
            const defaultAgent = DEFAULT_AGENTS.find(d => d.id === agent.id);
            if (!defaultAgent) {
                return true; // It's a custom model from Puter, not one of the app's defaults
            }
            // It is a default agent. Check if it's different.
            if (agent.name !== defaultAgent.name || agent.systemPrompt !== defaultAgent.systemPrompt) {
                return true; // It's a customized default agent.
            }
            return false;
        });

        onAgentsUpdated(agentsForStorage);
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
        <>
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Add & Remove AI Models</SheetTitle>
                        <SheetDescription>
                            Select models to add them to your agent list. Click the edit icon to customize an agent's name and prompt.
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
                                            <div className="space-y-1">
                                                {models.map(model => {
                                                    const customData = customizations[model.id];
                                                    const agentName = customData?.name || model.name || model.id;
                                                    return (
                                                        <div key={model.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary group">
                                                            <Checkbox
                                                                id={model.id}
                                                                checked={selectedModelIds.has(model.id)}
                                                                onCheckedChange={(checked) => handleCheckboxChange(model.id, !!checked)}
                                                            />
                                                            <label
                                                                htmlFor={model.id}
                                                                className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                            >
                                                                {agentName}
                                                                {customData && <span className="text-primary text-xs ml-2">(customized)</span>}
                                                            </label>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(model)}>
                                                                <Pen className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
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
            
            <Dialog open={!!agentToEdit} onOpenChange={(open) => !open && setAgentToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Customize Agent: {agentToEdit?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="agent-name">Agent Name</Label>
                            <Input 
                                id="agent-name" 
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="system-prompt">System Prompt</Label>
                            <Textarea
                                id="system-prompt"
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                className="min-h-[200px]"
                                placeholder="You are a helpful assistant..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAgentToEdit(null)}>Cancel</Button>
                        <Button onClick={handleDialogSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

