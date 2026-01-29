
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface SpeechSettings {
    voiceURI: string;
    rate: number;
    pitch: number;
}

interface SettingsSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    settings: SpeechSettings;
    onSettingsChange: (settings: SpeechSettings) => void;
}

export function SettingsSheet({ isOpen, onOpenChange, settings, onSettingsChange }: SettingsSheetProps) {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [currentSettings, setCurrentSettings] = useState<SpeechSettings>(settings);
    const { toast } = useToast();

    useEffect(() => {
        // Voices are loaded asynchronously. We need to listen for the 'voiceschanged' event.
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            // If the saved voice isn't available, fall back to default
            if (settings.voiceURI !== 'default' && !availableVoices.some(v => v.voiceURI === settings.voiceURI)) {
                 setCurrentSettings(s => ({ ...s, voiceURI: 'default' }));
            }
        };

        // Initial load
        loadVoices();
        
        // Add event listener
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

        // Cleanup
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        };
    }, [settings.voiceURI]);
    
    // Update internal state if props change
    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings]);

    const handleTestVoice = () => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance('Hello! This is a test of the selected voice.');
        
        const selectedVoice = voices.find(v => v.voiceURI === currentSettings.voiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = currentSettings.rate;
        utterance.pitch = currentSettings.pitch;

        window.speechSynthesis.speak(utterance);
    };

    const handleSave = () => {
        onSettingsChange(currentSettings);
        try {
            localStorage.setItem('speech_settings', JSON.stringify(currentSettings));
            toast({
                title: "Settings Saved",
                description: "Your voice settings have been updated.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save settings.",
            });
        }
        onOpenChange(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle>Voice & Personality</SheetTitle>
                    <SheetDescription>
                        Customize the voice, rate, and pitch of the AI's speech.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 space-y-6 py-4 overflow-y-auto px-1">
                    <div className="space-y-2">
                        <Label htmlFor="voice-select">Voice</Label>
                        <Select
                            value={currentSettings.voiceURI}
                            onValueChange={(value) => setCurrentSettings(s => ({ ...s, voiceURI: value }))}
                        >
                            <SelectTrigger id="voice-select">
                                <SelectValue placeholder="Select a voice" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Browser Default</SelectItem>
                                {voices.map((voice) => (
                                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                        {`${voice.name} (${voice.lang})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rate-slider">Speech Rate ({currentSettings.rate.toFixed(1)})</Label>
                        <Slider
                            id="rate-slider"
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[currentSettings.rate]}
                            onValueChange={([value]) => setCurrentSettings(s => ({ ...s, rate: value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pitch-slider">Pitch ({currentSettings.pitch.toFixed(1)})</Label>
                        <Slider
                            id="pitch-slider"
                            min={0}
                            max={2}
                            step={0.1}
                            value={[currentSettings.pitch]}
                            onValueChange={([value]) => setCurrentSettings(s => ({ ...s, pitch: value }))}
                        />
                    </div>

                    <Button variant="outline" className="w-full" onClick={handleTestVoice}>
                        Test Voice
                    </Button>
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
