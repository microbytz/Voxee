"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Settings } from '@/lib/types';

export function useSpeech(settings: Pick<Settings, 'voice' | 'pitch' | 'rate' | 'autoSpeak'>) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognition = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    return rec;
  }, []);

  const populateVoiceList = useCallback(() => {
    if (typeof window === 'undefined') return;
    const newVoices = window.speechSynthesis.getVoices();
    setVoices(newVoices);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    populateVoiceList();
    window.speechSynthesis.onvoiceschanged = populateVoiceList;
  }, [populateVoiceList]);

  const startListening = useCallback(() => {
    if (!recognition) return;
    setIsListening(true);
    setTranscript('');
    recognition.start();
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    setIsListening(false);
    recognition.stop();
  }, [recognition]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find((v) => v.name === settings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [settings.voice, settings.pitch, settings.rate, voices]);
  
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopListening();
    };

    recognition.onend = () => {
      if (isListening) {
        // In continuous mode, it can stop. We might want to auto-restart.
        // For this app, manual stop is better.
        setIsListening(false);
      }
    };

    return () => {
      recognition.abort();
    };
  }, [recognition, isListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    transcript,
    setTranscript,
    startListening,
    stopListening,
    speak,
    voices,
    supported: !!recognition,
  };
}
