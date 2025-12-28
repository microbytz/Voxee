// @ts-nocheck
'use client';
import { useEffect, useRef } from 'react';

export default function AIPage() {
  const chatLogRef = useRef(null);

  useEffect(() => {
    let currentPrompt = '';
    let currentResponse = '';

    const scrollToBottom = () => {
      if (chatLogRef.current) {
        chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
      }
    };
    
    const addMessage = (sender, text) => {
        const chatLog = document.getElementById('chat-log');
        if (!chatLog) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.innerText = sender === 'user' ? '🧑' : '🤖';

        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.innerText = text;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(textDiv);
        chatLog.appendChild(messageDiv);
        scrollToBottom();
    };


    const askAI = async () => {
      const promptEl = document.getElementById('prompt') as HTMLTextAreaElement;
      const saveBtn = document.getElementById('saveBtn');

      if (!promptEl || !saveBtn) return;
      
      const prompt = promptEl.value.trim();
      if (!prompt) return;

      addMessage('user', prompt);
      promptEl.value = '';
      promptEl.style.height = 'auto'; // Reset height
      
      const thinkingDiv = document.createElement('div');
      thinkingDiv.id = 'thinking';
      thinkingDiv.className = 'message ai';
      thinkingDiv.innerHTML = `<div class="avatar">🤖</div><div class="text">Thinking...</div>`;
      document.getElementById('chat-log')?.appendChild(thinkingDiv);
      scrollToBottom();

      saveBtn.style.display = 'none';

      try {
        const response = await window.puter.ai.chat(prompt);
        currentPrompt = prompt;
        currentResponse = response;
        
        const thinkingEl = document.getElementById('thinking');
        if(thinkingEl) {
            thinkingEl.querySelector('.text').innerText = response;
            thinkingEl.id = '';
        }

        saveBtn.style.display = 'inline-block';
      } catch (e) {
        const thinkingEl = document.getElementById('thinking');
        if(thinkingEl) {
            thinkingEl.querySelector('.text').innerText = "Error: " + (e as Error).message;
            thinkingEl.id = '';
        }
      }
      scrollToBottom();
    };

    const saveToCloud = async () => {
      const time = new Date().toLocaleTimeString().replace(/:/g, '-');
      const fileName = `AI_Chat_${time}.txt`;
      // We now save the whole chat log instead of just the last exchange
      const chatLog = document.getElementById('chat-log');
      let content = "Chat History:\n\n";
      chatLog.querySelectorAll('.message').forEach(msg => {
          const sender = msg.classList.contains('user') ? 'User' : 'AI';
          const text = msg.querySelector('.text').innerText;
          content += `${sender}: ${text}\n\n`;
      });


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
        const chats = items.filter((item) => item.name.startsWith('AI_Chat_')).sort((a, b) => b.name.localeCompare(a.name));

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
        const chatLog = document.getElementById('chat-log');
        const promptEl = document.getElementById('prompt') as HTMLTextAreaElement;
        const saveBtn = document.getElementById('saveBtn');

        if (!chatLog || !promptEl || !saveBtn) return;

        chatLog.innerHTML = `<div class="message ai"><div class="avatar">🤖</div><div class="text">Loading file...</div></div>`;
        
        try {
            const blob = await window.puter.fs.read(fileName);
            const content = await blob.text();
            
            chatLog.innerHTML = ''; // Clear loading message

            // Simple parser for the saved format
            const lines = content.replace('Chat History:\n\n', '').split('\n\n');
            lines.forEach(line => {
                if (line.startsWith('User: ')) {
                    addMessage('user', line.substring(6));
                } else if (line.startsWith('AI: ')) {
                    addMessage('ai', line.substring(4));
                }
            });

            promptEl.value = '';
            saveBtn.style.display = 'none';
        } catch (e) {
            chatLog.innerHTML = `<div class="message ai"><div class="avatar">🤖</div><div class="text">Could not read file.</div></div>`;
        }
        scrollToBottom();
    };
    
    // Attach event listeners
    const askButton = document.querySelector('.btn-ask');
    if (askButton) {
      askButton.addEventListener('click', askAI);
    }
    
    const promptEl = document.getElementById('prompt');
    if (promptEl) {
        promptEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askAI();
            }
        });
        promptEl.addEventListener('input', () => {
          promptEl.style.height = 'auto';
          promptEl.style.height = (promptEl.scrollHeight) + 'px';
        });
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
        #sidebar { width: 250px; background: #fff; border-right: 1px solid #ddd; padding: 20px; display: flex; flex-direction: column; }
        #sidebar h3 { font-size: 16px; margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        #historyList { flex: 1; overflow-y: auto; }
        .history-item { padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .history-item:hover { background: #f8f9fa; color: #007bff; }
        
        /* Main Chat Styles */
        #main { flex: 1; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; height: 100vh; padding: 0; }
        #chat-log { flex-grow: 1; padding: 20px; overflow-y: auto; }
        .message { display: flex; gap: 15px; margin-bottom: 20px; max-width: 90%; }
        .message .avatar { font-size: 24px; }
        .message .text { padding: 15px; border-radius: 12px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
        .message.user { align-self: flex-end; flex-direction: row-reverse; }
        .message.user .text { background: #007bff; color: white; border-top-right-radius: 0; }
        .message.ai { align-self: flex-start; }
        .message.ai .text { background: #fff; color: #333; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-top-left-radius: 0; }

        /* Input Area Styles */
        #input-area { padding: 20px; border-top: 1px solid #ddd; background: #f8f9fa; }
        .input-wrapper { display: flex; gap: 10px; align-items: flex-end; }
        textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px; resize: none; max-height: 150px; }
        button { padding: 12px 24px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }
        .btn-ask { background: #007bff; color: white; }
        .btn-save { background: #28a745; color: white; display: none; }
      `}</style>
      <div id="sidebar">
        <h3>Previous Chats</h3>
        <div id="historyList">Loading history...</div>
      </div>
      <div id="main">
        <div id="chat-log" ref={chatLogRef}>
            <div className="message ai">
                <div className="avatar">🤖</div>
                <div className="text">Hello! Ask me anything.</div>
            </div>
        </div>
        <div id="input-area">
          <div className="actions" style={{ paddingBottom: '10px', textAlign: 'right' }}>
              <button id="saveBtn" className="btn-save">💾 Save this Chat</button>
          </div>
          <div className="input-wrapper">
            <textarea id="prompt" rows="1" placeholder="Type your question here..."></textarea>
            <button className="btn-ask">Ask</button>
          </div>
        </div>
      </div>
    </>
  );
}
