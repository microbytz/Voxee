
'use client';

import { Agent } from './agents';

const USER_AGENTS_KEY = 'user_defined_agents';

// Retrieves user-defined agents from localStorage
export function getUserAgents(): Agent[] {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const storedAgents = localStorage.getItem(USER_AGENTS_KEY);
        if (storedAgents) {
            return JSON.parse(storedAgents) as Agent[];
        }
    } catch (error) {
        console.error("Failed to parse user agents from localStorage:", error);
        return [];
    }
    return [];
}

// Saves user-defined agents to localStorage
export function saveUserAgents(agents: Agent[]): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        localStorage.setItem(USER_AGENTS_KEY, JSON.stringify(agents));
    } catch (error) {
        console.error("Failed to save user agents to localStorage:", error);
    }
}

    