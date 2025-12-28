
'use client';

import {useEffect} from 'react';

export default function AIPage() {
  useEffect(() => {
    const global = window as any;
    global.fullTranscript = '';

    const handleSend = async () => {
      const input = document.getElementById('userInput') as HTMLTextAreaElement;
      if (!input) return;

      const text = input.value.trim();
      if (!text) return;

      appendMessage('user', text);
      input.value = '';
      input.style.height = 'auto';

      try {
        const response = await global.puter.ai.chat(text);
        appendMessage('ai', response);

        global.fullTranscript += `User: ${text}\nAI: ${response}\n\n`;
      } catch (err: any) {
        appendMessage('ai', 'Error: ' + err.message);
      }
    };

    const appendMessage = (role: 'user' | 'ai', text: any) => {
      const chatWindow = document.getElementById('chat-window');
      if (!chatWindow) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'message-wrapper';

      const label = role === 'user' ? 'You' : 'Assistant';
      const msgClass = role === 'user' ? 'user-msg' : 'ai-msg';
      
      const safeText = String(text);

      const escapedText = safeText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      const contentHtml = escapedText.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
          return `<pre><code>${code}</code></pre>`;
      }).replace(/\n/g, '<br>');


      wrapper.innerHTML = `
        <div class="msg-label" style="${
          role === 'user' ? 'align-self: flex-end;' : ''
        }">${label}</div>
        <div class="message ${msgClass}">${contentHtml}</div>
      `;

      chatWindow.appendChild(wrapper);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    const saveCurrentChat = async () => {
      if (!global.fullTranscript) return alert('Nothing to save yet!');
      const fileName = `Chat_${Date.now()}.txt`;
      try {
        await global.puter.fs.write(fileName, global.fullTranscript);
        alert('Saved to cloud!');
        loadHistory();
      } catch (e: any) {
        alert('Save failed: ' + e.message);
      }
    };

    const loadHistory = async () => {
      const list = document.getElementById('historyList');
      if (!list) return;

      try {
        const items = await global.puter.fs.readdir('./');
        const chats = items.filter((f: any) => f.name.startsWith('Chat_'));
        list.innerHTML =
          chats
            .map(
              (f: any) => `
            <div class="history-item" onclick="viewChat('${f.name}')">
                📄 ${new Date(
                  parseInt(f.name.split('_')[1])
                ).toLocaleString()}
            </div>
        `
            )
            .join('') || 'No saved chats.';
      } catch (e) {
        list.innerText = 'Error loading.';
      }
    };

    const viewChat = async (name: string) => {
      const chatWindow = document.getElementById('chat-window');
      if (!chatWindow) return;

      try {
        const blob = await global.puter.fs.read(name);
        const text = await blob.text();
        const escapedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        chatWindow.innerHTML = `<div class="message-wrapper"><div class="message ai-msg" style="white-space:pre-wrap">${escapedText}</div></div>`;
      } catch (e) {
        alert('Error reading file.');
      }
    };

    const newChat = () => {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.innerHTML = `
                <div class="message-wrapper">
                    <div class="msg-label">System</div>
                    <div class="message ai-msg">
                        Hello! Ask me anything. Your conversations are saved to your private Puter cloud.
                    </div>
                </div>
            `;
        }
        global.fullTranscript = "";
    };


    global.handleSend = handleSend;
    global.saveCurrentChat = saveCurrentChat;
    global.viewChat = viewChat;
    global.newChat = newChat;


    loadHistory();

    const input = document.getElementById('userInput') as HTMLTextAreaElement;
    if(input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
            --bg-dark: #0b0e11;
            --sidebar-bg: #15191e;
            --chat-bg: #0b0e11;
            --user-bubble: #2b5aed;
            --ai-bubble: #1e2329;
            --text-main: #e9eaeb;
            --text-dim: #9ca3af;
            --accent: #3b82f6;
        }

        html, body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-main);
            display: flex;
            height: 100vh;
            margin: 0;
            overflow: hidden;
        }

        /* Sidebar */
        #sidebar {
            width: 280px;
            background: var(--sidebar-bg);
            border-right: 1px solid #2d343c;
            display: flex;
            flex-direction: column;
            padding: 20px 0;
        }

        .sidebar-header { padding: 0 20px 20px; border-bottom: 1px solid #2d343c; margin-bottom: 10px; font-weight: bold; color: var(--accent); }
        
        .new-chat-btn {
            display: block;
            width: calc(100% - 40px);
            margin: 0 20px 10px;
            padding: 12px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
            transition: background 0.2s;
        }

        .new-chat-btn:hover {
            background: #2563eb;
        }

        #historyList { flex: 1; overflow-y: auto; padding: 0 10px; }

        .history-item {
            padding: 12px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            margin-bottom: 5px;
            transition: 0.2s;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--text-dim);
        }

        .history-item:hover { background: #2d343c; color: white; }

        /* Main Chat Area */
        #main-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        #chat-window {
            flex: 1;
            overflow-y: auto;
            padding: 40px 20px 150px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .message-wrapper { width: 100%; max-width: 800px; margin-bottom: 25px; display: flex; flex-direction: column; }

        .message {
            max-width: 85%;
            padding: 14px 18px;
            border-radius: 18px;
            font-size: 15px;
            line-height: 1.6;
            word-wrap: break-word;
        }
        
        .message pre {
            background-color: #0d1117;
            color: #c9d1d9;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            white-space: pre;
            font-family: 'Courier New', Courier, monospace;
        }

        .user-msg { background: var(--user-bubble); align-self: flex-end; border-bottom-right-radius: 4px; }

        .ai-msg { background: var(--ai-bubble); align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid #2d343c; }

        .msg-label { font-size: 11px; margin-bottom: 6px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }

        /* Input Area */
        #input-area {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, var(--bg-dark) 30%);
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }

        .input-wrapper {
            width: 100%;
            max-width: 800px;
            background: #1e2329;
            border: 1px solid #3e454d;
            border-radius: 12px;
            display: flex;
            align-items: flex-end;
            padding: 10px 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        textarea {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            padding: 8px;
            resize: none;
            font-size: 15px;
            outline: none;
            max-height: 200px;
        }

        .btn-group { display: flex; gap: 8px; padding-bottom: 4px; }

        button {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: 0.2s;
        }

        .send-btn { background: var(--accent); color: white; }
        .save-btn { background: #2d343c; color: var(--text-dim); }
        .send-btn:hover { background: #2563eb; }
        .save-btn:hover { background: #3e454d; color: white; }
        `,
        }}
      />
      <div id="sidebar">
        <div className="sidebar-header">☁️ Cloud History</div>
        <button className="new-chat-btn" onClick={() => (window as any).newChat()}>+ New Chat</button>
        <div id="historyList">Loading...</div>
      </div>

      <div id="main-container">
        <div id="chat-window">
          <div className="message-wrapper">
            <div className="msg-label">System</div>
            <div className="message ai-msg">
              Hello! Ask me anything. Your conversations are saved to your
              private Puter cloud.
            </div>
          </div>
        </div>

        <div id="input-area">
          <div className="input-wrapper">
            <textarea
              id="userInput"
              placeholder="Ask AI..."
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '';
                target.style.height = target.scrollHeight + 'px';
              }}
            ></textarea>
            <div className="btn-group">
              <button
                className="save-btn"
                onClick={() => (window as any).saveCurrentChat()}
                title="Save session"
              >
                💾
              </button>
              <button
                className="send-btn"
                onClick={() => (window as any).handleSend()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

    