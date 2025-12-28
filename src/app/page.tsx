// @ts-nocheck
'use client';
import { useEffect, useRef } from 'react';

export default function AIPage() {
  const chatLogRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // --- Helper Functions ---
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
        
        const textContainer = document.createElement('div');
        textContainer.className = 'text';

        // Code Detection and Preview Button
        if (sender === 'ai' && text.includes('```html')) {
            const codeBlock = text.substring(text.indexOf('```html') + 7, text.lastIndexOf('```'));
            
            // Add a container for the code and button
            const codeWrapper = document.createElement('div');
            
            // Add formatted code view
            const preElement = document.createElement('pre');
            const codeElement = document.createElement('code');
            codeElement.textContent = codeBlock;
            preElement.appendChild(codeElement);
            codeWrapper.appendChild(preElement);

            // Add Preview Button
            const previewBtn = document.createElement('button');
            previewBtn.innerText = '🚀 Preview Code';
            previewBtn.className = 'btn-preview';
            previewBtn.onclick = () => previewCode(codeBlock);
            codeWrapper.appendChild(previewBtn);
            
            textContainer.appendChild(codeWrapper);

        } else {
            textContainer.innerText = text;
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(textContainer);
        chatLog.appendChild(messageDiv);
        scrollToBottom();
    };

    const askAI = async () => {
      const promptEl = document.getElementById('prompt');
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
        
        const thinkingEl = document.getElementById('thinking');
        if(thinkingEl) {
            chatLogRef.current.removeChild(thinkingEl);
        }
        addMessage('ai', response);

        saveBtn.style.display = 'inline-block';
      } catch (e) {
        const thinkingEl = document.getElementById('thinking');
        if(thinkingEl) {
            thinkingEl.querySelector('.text').innerText = "Error: " + e.message;
            thinkingEl.id = '';
        }
      }
      scrollToBottom();
    };

    const saveToCloud = async () => {
      const time = new Date().toLocaleTimeString().replace(/:/g, '-');
      const fileName = `AI_Chat_${time}.txt`;
      const chatLog = document.getElementById('chat-log');
      let content = "Chat History:\n\n";
      chatLog.querySelectorAll('.message').forEach(msg => {
          const sender = msg.classList.contains('user') ? 'User' : 'AI';
          const textEl = msg.querySelector('.text');
          const codeEl = textEl.querySelector('code');
          let text = '';
          if (codeEl) {
            text = '```html\n' + codeEl.textContent + '\n```';
          } else {
            text = textEl.innerText;
          }
          content += `${sender}: ${text}\n\n`;
      });


      try {
        await window.puter.fs.write(fileName, content);
        alert('Saved to your cloud!');
        loadHistory(); 
      } catch (e) {
        alert('Save failed: ' + e.message);
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
        const promptEl = document.getElementById('prompt');
        const saveBtn = document.getElementById('saveBtn');

        if (!chatLog || !promptEl || !saveBtn) return;

        chatLog.innerHTML = `<div class="message ai"><div class="avatar">🤖</div><div class="text">Loading file...</div></div>`;
        
        try {
            const blob = await window.puter.fs.read(fileName);
            const content = await blob.text();
            
            chatLog.innerHTML = ''; // Clear loading message
            
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

    const previewCode = (code) => {
        const modal = document.getElementById('previewModal');
        const iframe = document.getElementById('previewIframe');
        if (!modal || !iframe) return;
        
        iframe.srcdoc = code;
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        const modal = document.getElementById('previewModal');
        if(modal) modal.style.display = 'none';
        const iframe = document.getElementById('previewIframe');
        if(iframe) iframe.srcdoc = '';
    }

    const openFileUpload = (type) => {
      if (fileInputRef.current) {
        fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
        fileInputRef.current.click();
      }
    };

    const handleFileSelected = (event) => {
      const file = event.target.files[0];
      if (file) {
        alert(`File selected: ${file.name}`);
        // Here you would typically read the file and prepare it for upload
        // For example:
        // const reader = new FileReader();
        // reader.onload = (e) => {
        //   const fileData = e.target.result;
        //   // Now you have the file data to send to the AI
        // };
        // reader.readAsDataURL(file);
      }
    };
    
    // --- Event Listeners ---
    const askButton = document.querySelector('.btn-ask');
    if (askButton) askButton.addEventListener('click', askAI);

    const attachFileButton = document.querySelector('.btn-attach-file');
    if (attachFileButton) attachFileButton.addEventListener('click', () => openFileUpload('any'));
    
    const uploadPictureButton = document.querySelector('.btn-upload-picture');
    if (uploadPictureButton) uploadPictureButton.addEventListener('click', () => openFileUpload('image'));

    if (fileInputRef.current) {
      fileInputRef.current.addEventListener('change', handleFileSelected);
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
    if (saveButton) saveButton.addEventListener('click', saveToCloud);

    const historyList = document.getElementById('historyList');
    if (historyList) {
        historyList.addEventListener('click', (e) => {
            const target = e.target;
            const item = target.closest('.history-item');
            if (item && item.dataset.filename) {
                viewChat(item.dataset.filename);
            }
        });
    }
    
    const closeBtn = document.querySelector('.modal-close');
    if(closeBtn) closeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
      const modal = document.getElementById('previewModal');
      if (event.target == modal) {
        closeModal();
      }
    });

    loadHistory();

    return () => {
        if (askButton) askButton.removeEventListener('click', askAI);
        if (saveButton) saveButton.removeEventListener('click', saveToCloud);
        if (attachFileButton) attachFileButton.removeEventListener('click', () => openFileUpload('any'));
        if (uploadPictureButton) uploadPictureButton.removeEventListener('click', () => openFileUpload('image'));
        if (fileInputRef.current) {
          fileInputRef.current.removeEventListener('change', handleFileSelected);
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
        #main { flex: 1; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; height: 100vh; padding: 0; background-color: #f0f2f5; }
        #chat-log { flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; }
        .message { display: flex; gap: 15px; margin-bottom: 20px; max-width: 90%; }
        .message .avatar { font-size: 24px; flex-shrink: 0; }
        .message .text { padding: 15px; border-radius: 12px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
        .message.user { align-self: flex-end; flex-direction: row-reverse; }
        .message.user .text { background: #007bff; color: white; border-top-right-radius: 0; }
        .message.ai { align-self: flex-start; }
        .message.ai .text { background: #fff; color: #333; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-top-left-radius: 0; }
        .message pre { background: #2d2d2d; color: #f1f1f1; padding: 15px; border-radius: 8px; overflow-x: auto; font-family: 'Courier New', Courier, monospace; }
        
        /* Input Area Styles */
        #input-area { padding: 20px; border-top: 1px solid #ddd; background: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);}
        .input-wrapper { display: flex; gap: 10px; align-items: flex-end; }
        textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px; resize: none; max-height: 150px; background: #f8f9fa; }
        button { padding: 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; transition: background-color 0.2s; line-height: 1; font-size: 18px; }
        .btn-ask { background: #007bff; color: white; padding: 12px 24px; font-size: 16px; }
        .btn-ask:hover { background: #0056b3; }
        .btn-attach-file, .btn-upload-picture { background: #f0f2f5; color: #555; }
        .btn-attach-file:hover, .btn-upload-picture:hover { background: #e2e6ea; }
        .btn-save { background: #28a745; color: white; display: none; padding: 8px 16px; font-size: 14px;}
        .btn-save:hover { background: #1e7e34; }
        .btn-preview { background: #6f42c1; color: white; padding: 8px 16px; font-size: 12px; margin-top: 10px; }
        .btn-preview:hover { background: #5a359a; }

        /* Modal Styles */
        #previewModal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
        .modal-content { background-color: #fefefe; margin: auto; padding: 20px; border: 1px solid #888; width: 80%; height: 80%; box-shadow: 0 5px 15px rgba(0,0,0,0.3); border-radius: 10px; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .modal-header h2 { margin: 0; }
        .modal-close { color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer; }
        .modal-close:hover, .modal-close:focus { color: black; }
        #previewIframe { width: 100%; height: 100%; border: none; margin-top: 15px; }
      `}</style>

      {/* --- App HTML --- */}
      <div id="sidebar">
        <h3>Previous Chats</h3>
        <div id="historyList">Loading history...</div>
      </div>
      <div id="main">
        <div id="chat-log" ref={chatLogRef}>
            <div className="message ai">
                <div className="avatar">🤖</div>
                <div className="text">Hello! Ask me to create something with HTML, and I'll show you a preview. For example: "create a simple game with a bouncing ball".</div>
            </div>
        </div>
        <div id="input-area">
          <div className="actions" style={{ paddingBottom: '10px', textAlign: 'right' }}>
              <button id="saveBtn" className="btn-save">💾 Save this Chat</button>
          </div>
          <div className="input-wrapper">
            <textarea id="prompt" rows="1" placeholder="Type your question here..."></textarea>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} />
            <button className="btn-attach-file" title="Attach File">📎</button>
            <button className="btn-upload-picture" title="Upload Picture">🖼️</button>
            <button className="btn-ask">Ask</button>
          </div>
        </div>
      </div>

      {/* --- Modal for Code Preview --- */}
      <div id="previewModal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Code Preview</h2>
            <span className="modal-close">&times;</span>
          </div>
          <iframe id="previewIframe" title="Code Preview"></iframe>
        </div>
      </div>
    </>
  );
}
