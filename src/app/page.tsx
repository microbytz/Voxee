// @ts-nocheck
'use client';
import { useEffect } from 'react';

export default function AIPage() {
  useEffect(() => {
    let currentPrompt = '';
    let currentResponse = '';

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
        const response = await window.puter.ai.chat(prompt);
        currentPrompt = prompt;
        currentResponse = response;
        responseDiv.innerText = response;
        saveBtn.style.display = 'inline-block';
      } catch (e) {
        responseDiv.innerText = 'Error: ' + (e as Error).message;
      }
    };

    const saveToCloud = async () => {
      const time = new Date().toLocaleTimeString().replace(/:/g, '-');
      const fileName = `AI_Chat_${time}.txt`;
      const content = `PROMPT: ${currentPrompt}\n\nRESPONSE:\n${currentResponse}`;

      try {
        await window.puter.fs.write(fileName, content);
        alert('Saved to your cloud!');
        loadHistory(); // Refresh the list
      } catch (e) {
        alert('Save failed: ' + (e as Error).message);
      }
    };

    const loadHistory = async () => {
      const listDiv = document.getElementById('historyList');
      if (!listDiv) return;

      try {
        const items = await window.puter.fs.readdir('./');
        const chats = items.filter((item) => item.name.startsWith('AI_Chat_'));

        if (chats.length === 0) {
          listDiv.innerHTML = '<small>No saved chats yet.</small>';
          return;
        }

        listDiv.innerHTML = chats
          .map(
            (file) =>
              `<div class="history-item" data-filename="${file.name}">
                  📄 ${file.name.replace('AI_Chat_', '').replace('.txt', '')}
              </div>`
          )
          .join('');
      } catch (e) {
        listDiv.innerText = 'Error loading history.';
      }
    };

    const viewChat = async (fileName) => {
      const responseDiv = document.getElementById('response');
      const promptEl = document.getElementById('prompt') as HTMLTextAreaElement;
      const saveBtn = document.getElementById('saveBtn');

      if (!responseDiv || !promptEl || !saveBtn) return;

      responseDiv.innerText = 'Loading file...';
      try {
        const blob = await window.puter.fs.read(fileName);
        const content = await blob.text();
        responseDiv.innerText = content;
        promptEl.value = '';
        saveBtn.style.display = 'none';
      } catch (e) {
        responseDiv.innerText = 'Could not read file.';
      }
    };
    
    // Attach event listeners
    const askButton = document.querySelector('.btn-ask');
    if (askButton) {
      askButton.addEventListener('click', askAI);
    }
    
    const saveButton = document.getElementById('saveBtn');
    if (saveButton) {
      saveButton.addEventListener('click', saveToCloud);
    }

    const historyList = document.getElementById('historyList');
    if (historyList) {
        historyList.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest('.history-item');
            if (item && item.dataset.filename) {
                viewChat(item.dataset.filename);
            }
        });
    }

    loadHistory();

    // Cleanup function to remove event listeners
    return () => {
        if (askButton) {
            askButton.removeEventListener('click', askAI);
        }
        if (saveButton) {
            saveButton.removeEventListener('click', saveToCloud);
        }
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        body { font-family: sans-serif; display: flex; height: 100vh; margin: 0; background: #f0f2f5; }
        /* Sidebar Styles */
        #sidebar { width: 250px; background: #fff; border-right: 1px solid #ddd; padding: 20px; overflow-y: auto; }
        #sidebar h3 { font-size: 16px; margin-top: 0; }
        .history-item { padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 13px; }
        .history-item:hover { background: #f8f9fa; color: #007bff; }
        
        /* Main Chat Styles */
        #main { flex: 1; padding: 40px; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; }
        textarea { width: 100%; padding: 15px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 15px; font-size: 16px; }
        .actions { display: flex; gap: 10px; }
        button { padding: 12px 24px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
        .btn-ask { background: #007bff; color: white; }
        .btn-save { background: #28a745; color: white; display: none; }
        #response { margin-top: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); min-height: 100px; white-space: pre-wrap; }
      `}</style>
      <div id="sidebar">
        <h3>Previous Chats</h3>
        <div id="historyList">Loading history...</div>
      </div>
      <div id="main">
        <h2>Personal AI Assistant</h2>
        <textarea id="prompt" rows="3" placeholder="Type your question here..."></textarea>
        <div className="actions">
          <button className="btn-ask">Ask AI</button>
          <button id="saveBtn" className="btn-save">💾 Save this Chat</button>
        </div>
        <div id="response">Your answer will appear here...</div>
      </div>
    </>
  );
}
