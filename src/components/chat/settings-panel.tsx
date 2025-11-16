"use client";

import type { Dispatch, SetStateAction } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { Settings, AiPersonality, AiVerbosity, AiStyle } from '@/lib/types';

interface SettingsPanelProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    settings: Settings;
    setSettings: Dispatch<SetStateAction<Settings>>;
    voices: SpeechSynthesisVoice[];
}

export function SettingsPanel({
    isOpen,
    onOpenChange,
    settings,
    setSettings,
    voices,
}: SettingsPanelProps) {

    const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full max-w-md">
                <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                    <SheetDescription>
                        Customize your Voxee AI assistant experience.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-6 py-6">
                    <h3 className="font-semibold text-lg">Voice Interaction</h3>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="auto-speak">Auto-Speak Responses</Label>
                        <Switch
                            id="auto-speak"
                            checked={settings.autoSpeak}
                            onCheckedChange={(checked) => handleSettingChange('autoSpeak', checked)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="voice-select">Voice</Label>
                        <Select
                            value={settings.voice}
                            onValueChange={(value) => handleSettingChange('voice', value)}
                        >
                            <SelectTrigger id="voice-select">
                                <SelectValue placeholder="Default" />
                            </SelectTrigger>
                            <SelectContent>
                                {voices.map((voice) => (
                                    <SelectItem key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.lang})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pitch">Pitch</Label>
                        <Slider
                            id="pitch"
                            min={0}
                            max={2}
                            step={0.1}
                            value={[settings.pitch]}
                            onValueChange={([value]) => handleSettingChange('pitch', value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="rate">Speed</Label>
                        <Slider
                            id="rate"
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[settings.rate]}
                            onValueChange={([value]) => handleSettingChange('rate', value)}
                        />
                    </div>

                    <h3 className="font-semibold text-lg mt-4">AI Personality (UI Only)</h3>
                    <div className="grid gap-2">
                      <Label>Personality</Label>
                      <RadioGroup value={settings.personality} onValueChange={(v) => handleSettingChange('personality', v as AiPersonality)} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="default" id="p-default" /><Label htmlFor="p-default">Default</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="creative" id="p-creative" /><Label htmlFor="p-creative">Creative</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="technical" id="p-technical" /><Label htmlFor="p-technical">Technical</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="grid gap-2">
                      <Label>Verbosity</Label>
                       <RadioGroup value={settings.verbosity} onValueChange={(v) => handleSettingChange('verbosity', v as AiVerbosity)} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="concise" id="v-concise" /><Label htmlFor="v-concise">Concise</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="default" id="v-default" /><Label htmlFor="v-default">Default</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="verbose" id="v-verbose" /><Label htmlFor="v-verbose">Verbose</Label></div>
                      </RadioGroup>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
