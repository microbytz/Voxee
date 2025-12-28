'use client';

import { ChatContainer } from '@/components/chat/chat-container';
import { Toaster } from '@/components/ui/toaster';

export default function AIPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <ChatContainer />
      <Toaster />
    </main>
  );
}
