
'use client';

import {useEffect} from 'react';

export default function AIPage() {
  useEffect(() => {
    const global = window as any;
    global.chatHistory = [];

    const handleSend = async (fileDataUri?: string) => {
      const input = document.getElementById('userInput') as HTMLTextAreaElement;
      if (!input) return;

      const text = input.value.trim();
      if (!text && !fileDataUri) return;

      if (text) {
        appendMessage('user', text);
        // Don't add to history here if a file is also being sent,
        // handleSend will be called again with the file data.
        if (!fileDataUri) {
          global.chatHistory.push({ role: 'user', content: text });
        }
      }
      
      input.value = '';
      input.style.height = 'auto';

      try {
        const payload = fileDataUri ? { file: fileDataUri, prompt: text } : text;
        const response = await global.puter.ai.chat(payload);
        const responseText = String(response); // Ensure response is a string
        
        appendMessage('ai', responseText);
        global.chatHistory.push({ role: 'ai', content: responseText });

        if(fileDataUri){
           const fileMessageIndex = global.chatHistory.findIndex((m: any) => m.content === fileDataUri);
           if (fileMessageIndex > -1) {
             // If there was also text, add it to the history now.
             if (text) {
                global.chatHistory.splice(fileMessageIndex + 1, 0, { role: 'user', content: text });
             }
           }
        }

      } catch (err: any) {
        const errorMessage = 'Error: ' + err.message;
        appendMessage('ai', errorMessage);
        global.chatHistory.push({ role: 'ai', content: errorMessage });
      }
    };

    const appendMessage = (role: 'user' | 'ai', content: any) => {
      const chatWindow = document.getElementById('chat-window');
      if (!chatWindow) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'message-wrapper';

      const label = role === 'user' ? 'You' : 'Assistant';
      const msgClass = role === 'user' ? 'user-msg' : 'ai-msg';
      
      let contentHtml;
      const safeContent = String(content);
      
      if (safeContent.startsWith('data:image')) {
          contentHtml = `<img src="${safeContent}" alt="User upload" style="max-width: 100%; border-radius: 10px;" />`;
      } else if (safeContent.startsWith('data:')) {
          contentHtml = `<div class="file-attachment">📄 File Attached</div>`
      } else {
          const escapedText = safeContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          
          contentHtml = escapedText.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
              const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
              return `<div class="code-block-wrapper">
                        <div class="code-block-header">
                            <span>${lang || 'code'}</span>
                            <button onclick="copyCode('${codeId}', this)">Copy</button>
                        </div>
                        <pre><code id="${codeId}">${escapedCode}</code></pre>
                      </div>`;
          }).replace(/\n/g, '<br>');
      }


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
      if (global.chatHistory.length === 0) return alert('Nothing to save yet!');
      const fileName = `Chat_${Date.now()}.json`;
      try {
        const chatJson = JSON.stringify(global.chatHistory, null, 2);
        await global.puter.fs.write(fileName, chatJson);
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
            const chats = items.filter((f: any) => f.name.startsWith('Chat_') && f.name.endsWith('.json'));
            
            list.innerHTML = ''; // Clear the list first

            if (chats.length === 0) {
                list.innerHTML = "<div class='history-item' style='cursor: default; color: var(--text-dim);'>No saved chats.</div>";
                return;
            }
            
            chats.sort((a:any, b:any) => parseInt(b.name.split('_')[1]) - parseInt(a.name.split('_')[1]));


            chats.forEach((f: any) => {
                const div = document.createElement('div');
                div.className = 'history-item';
                
                const nameParts = f.name.replace('.json', '').split('_');
                const timestamp = parseInt(nameParts[1]);
                let displayName = new Date(timestamp).toLocaleString();
                if (nameParts.length > 2) {
                    displayName = nameParts.slice(2).join('_').replace(/_/g, ' ');
                }
                
                div.innerHTML = `📄 ${displayName}`;
                div.onclick = () => viewChat(f.name);

                div.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleRename(div, f.name);
                });

                list.appendChild(div);
            });
        } catch (e) {
            list.innerText = 'Error loading history.';
        }
    };

    const handleRename = (div: HTMLElement, currentName: string) => {
        const nameParts = currentName.replace('.json', '').split('_');
        const originalTimestamp = nameParts[1];
        const currentCustomName = nameParts.length > 2 ? nameParts.slice(2).join('_').replace(/_/g, ' ') : '';
    
        div.innerHTML = `📄 <input type="text" value="${currentCustomName}" class="rename-input" />`;
        const input = div.querySelector('.rename-input') as HTMLInputElement;
        input.focus();
        input.select();
    
        const saveRename = async () => {
            const newName = input.value.trim();
            if (newName && newName !== currentCustomName) {
                const finalNewName = `Chat_${originalTimestamp}_${newName.replace(/ /g, '_')}.json`;
                try {
                    await global.puter.fs.rename(currentName, finalNewName);
                } catch (err: any) {
                    alert(`Rename failed: ${err.message}`);
                }
            }
            // Always refresh history to revert the input field
            loadHistory();
        };
    
        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveRename();
            } else if (e.key === 'Escape') {
                loadHistory(); // Revert by reloading
            }
        });
    };


    const viewChat = async (name: string) => {
      const chatWindow = document.getElementById('chat-window');
      if (!chatWindow) return;
      chatWindow.innerHTML = ''; // Clear current chat view

      try {
        const blob = await global.puter.fs.read(name);
        const text = await blob.text();
        const savedHistory = JSON.parse(text);
        
        global.chatHistory = savedHistory; // Load it into the current session

        savedHistory.forEach((msg: {role: 'user' | 'ai', content: string}) => {
            appendMessage(msg.role, msg.content);
        });

      } catch (e) {
        alert('Error reading or parsing file.');
        newChat(); // Reset to a clean state if loading fails
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
        global.chatHistory = [];
    };
    
    const copyCode = (codeId: string, buttonElement: HTMLButtonElement) => {
        const codeElement = document.getElementById(codeId);
        if (codeElement) {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                buttonElement.innerText = 'Copied!';
                setTimeout(() => {
                    buttonElement.innerText = 'Copy';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
                alert('Failed to copy code.');
            });
        }
    };

    const handleFileUpload = (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUri = e.target?.result as string;
            appendMessage('user', dataUri);
            global.chatHistory.push({ role: 'user', content: dataUri });
            handleSend(dataUri);
        };
        reader.readAsDataURL(file);
    };


    global.handleSend = handleSend;
    global.saveCurrentChat = saveCurrentChat;
    global.viewChat = viewChat;
    global.newChat = newChat;
    global.copyCode = copyCode;
    global.handleFileUpload = handleFileUpload;

    if (global.puter) {
      global.puter.ready(() => {
        loadHistory();
      });
    }

    const input = document.getElementById('userInput') as HTMLTextAreaElement;
    if(input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
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
            --code-bg: #0d1117;
            --code-header-bg: #2d343c;
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

        .rename-input {
            background: #2d343c;
            color: white;
            border: 1px solid var(--accent);
            border-radius: 4px;
            padding: 2px 5px;
            font-size: 13px;
            outline: none;
            width: calc(100% - 25px);
        }

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
        
        .file-attachment {
          font-style: italic;
          color: var(--text-dim);
        }

        .code-block-wrapper {
            background-color: var(--code-bg);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
            border: 1px solid var(--code-header-bg);
            position: relative;
        }

        .code-block-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: var(--code-header-bg);
            padding: 6px 12px;
            font-size: 12px;
            color: var(--text-dim);
        }

        .code-block-header button {
            background: #4a5568;
            color: white;
            border: none;
            padding: 4px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            position: absolute;
            top: 6px;
            right: 12px;
        }
        .code-block-header button:hover {
             background: #718096;
        }

        .message pre {
            margin: 0;
            padding: 16px;
            padding-top: 40px;
            overflow-x: auto;
            white-space: pre;
            font-family: 'Courier New', Courier, monospace;
            color: #c9d1d9;
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
        
        .icon-btn {
            background: #2d343c;
            color: var(--text-dim);
            padding: 8px;
        }
        .icon-btn:hover {
            background: #3e454d;
            color: white;
        }

        .send-btn { background: var(--accent); color: white; }
        .save-btn { background: #2d343c; color: var(--text-dim); }
        .send-btn:hover { background: #2563eb; }
        .save-btn:hover { background: #3e454d; color: white; }
        `,
        }}
      />
      <input type="file" id="fileInput" style={{ display: 'none' }} />
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
                className="icon-btn"
                onClick={() => (document.getElementById('fileInput') as HTMLInputElement).click()}
                title="Send File"
              >
                📎
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
