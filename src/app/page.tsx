'use client';

import {useEffect} from 'react';

export default function AIPage() {
  useEffect(() => {
    let currentPrompt = '';
    let currentResponse = '';

    const global = window as any;

    const askAI = async () => {
      const promptEl = document.getElementById('prompt') as HTMLTextAreaElement;
      const responseDiv = document.getElementById('response');
      const saveBtn = document.getElementById('saveBtn');

      if (!promptEl || !responseDiv || !saveBtn) return;

      const prompt = promptEl.value;
      if (!prompt) return;

      responseDiv.innerText = 'Thinking...';
      saveBtn.style.display = 'none';

      try {
        const response = await global.puter.ai.chat(prompt);
        currentPrompt = prompt;
        currentResponse = response;
        responseDiv.innerText = response;
        saveBtn.style.display = 'inline-block';
      } catch (e: any) {
        responseDiv.innerText = 'Error: ' + e.message;
      }
    };

    const saveToCloud = async () => {
      const time = new Date().toLocaleTimeString().replace(/:/g, '-');
      const fileName = `AI_Chat_${time}.txt`;
      const content = `PROMPT: ${currentPrompt}\n\nRESPONSE:\n${currentResponse}`;

      try {
        await global.puter.fs.write(fileName, content);
        alert('Saved to your cloud!');
        loadHistory(); // Refresh the list
      } catch (e: any) {
        alert('Save failed: ' + e.message);
      }
    };

    const loadHistory = async () => {
      const listDiv = document.getElementById('historyList');
      if (!listDiv) return;

      try {
        const items = await global.puter.fs.readdir('./');
        const chats = items.filter((item: any) =>
          item.name.startsWith('AI_Chat_')
        );

        if (chats.length === 0) {
          listDiv.innerHTML = '<small>No saved chats yet.</small>';
          return;
        }

        listDiv.innerHTML = chats
          .map(
            (file: any) =>
              `<div class="history-item" onclick="window.viewChat('${file.name}')">
                  📄 ${file.name.replace('AI_Chat_', '').replace('.txt', '')}
              </div>`
          )
          .join('');
      } catch (e) {
        listDiv.innerText = 'Error loading history.';
      }
    };

    const viewChat = async (fileName: string) => {
      const responseDiv = document.getElementById('response');
      const promptEl = document.getElementById('prompt') as HTMLTextAreaElement;
      const saveBtn = document.getElementById('saveBtn');

      if (!responseDiv || !promptEl || !saveBtn) return;

      responseDiv.innerText = 'Loading file...';
      try {
        const blob = await global.puter.fs.read(fileName);
        const content = await blob.text();
        responseDiv.innerText = content;
        promptEl.value = '';
        saveBtn.style.display = 'none';
      } catch (e) {
        responseDiv.innerText = 'Could not read file.';
      }
    };

    global.askAI = askAI;
    global.saveToCloud = saveToCloud;
    global.viewChat = viewChat;

    loadHistory();
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body { font-family: sans-serif; display: flex; height: 100vh; margin: 0; background: #f0f2f5; }
        #sidebar { width: 250px; background: #fff; border-right: 1px solid #ddd; padding: 20px; overflow-y: auto; }
        #sidebar h3 { font-size: 16px; margin-top: 0; }
        .history-item { padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 13px; }
        .history-item:hover { background: #f8f9fa; color: #007bff; }
        #main { flex: 1; padding: 40px; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; }
        textarea { width: 100%; padding: 15px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 15px; font-size: 16px; }
        .actions { display: flex; gap: 10px; }
        button { padding: 12px 24px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
        .btn-ask { background: #007bff; color: white; }
        .btn-save { background: #28a745; color: white; display: none; }
        #response { margin-top: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); min-height: 100px; white-space: pre-wrap; }
      `,
        }}
      />
      <div id="sidebar">
        <h3>Previous Chats</h3>
        <div id="historyList">Loading history...</div>
      </div>

      <div id="main">
        <h2>Personal AI Assistant</h2>
        <textarea
          id="prompt"
          rows={3}
          placeholder="Type your question here..."
        ></textarea>

        <div className="actions">
          <button className="btn-ask" onClick={() => (window as any).askAI()}>
            Ask AI
          </button>
          <button
            id="saveBtn"
            className="btn-save"
            onClick={() => (window as any).saveToCloud()}
          >
            💾 Save this Chat
          </button>
        </div>

        <div id="response">Your answer will appear here...</div>
      </div>
    </>
  );
}
