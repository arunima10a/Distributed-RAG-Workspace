import React, { useState, useEffect, useRef } from 'react'

import { useChat } from './hooks/useChat'
import { marked } from 'marked'
import Auth from './components/Auth'
import { Lock, Database, Send, Plus, Hash, User, X, Sparkles, ShieldCheck, Paperclip, Sun, Moon, Zap } from 'lucide-react'

const getSession = () => {
  let stored = sessionStorage.getItem("session");

  if (!stored) {
    stored = localStorage.getItem("session");
    if (stored) {
      sessionStorage.setItem("session", stored);
    }
  }

  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);

    if (parsed.expiry < Date.now()) {
      localStorage.removeItem("session");
      sessionStorage.removeItem("session");
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

function App() {
  const [room, setRoom] = useState("general");

  const [rooms, setRooms] = useState(["general"]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  const [isPrivateOpen, setIsPrivateOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [input, setInput] = useState("");
  const [privateInput, setPrivateInput] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomMode, setRoomMode] = useState("join");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [roomPassInput, setRoomPassInput] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const session = getSession();

  const [token, setToken] = useState(session?.token || null);

  const [userData, setUserData] = useState(() => {
    return session?.user
      ? { id: session.user.user_id, name: session.user.username }
      : {};
  });


  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!token || !userData.id) return;
    fetch(`http://localhost:8081/groups/my-groups?user_id=${userData.id}`)
      .then(res => res.json())
      .then(groups => {
        // ← guard against null/undefined from backend
        const safeGroups = Array.isArray(groups) ? groups : [];
        const userRooms = ["general", ...safeGroups.filter(g => g !== "general")];
        setRooms(userRooms);
      })
      .catch(err => console.error("Failed to fetch rooms:", err));
  }, [userData.id, token]);

  const handleLoginSuccess = (data) => {
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 1 day

    const sessionData = {
      token: data.token,
      user: data,
      expiry
    };

    localStorage.setItem("session", JSON.stringify(sessionData));
    sessionStorage.setItem("session", JSON.stringify(sessionData));

    setToken(data.token);
    setUserData({ id: data.user_id, name: data.username });
  };

  const handleLogout = () => {
    localStorage.removeItem("session");
    sessionStorage.removeItem("session");
    setToken(null);
    window.location.reload();
  };

  const handleRoomAction = async () => {
    if (!roomNameInput || !roomPassInput) return alert("Fill all fields");
    const endpoint = roomMode === "create" ? "create" : "join";
    try {
      const res = await fetch(`http://localhost:8081/groups/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomNameInput,
          group_name: roomNameInput,
          password: roomPassInput,
          user_id: userData.id
        })
      });
      if (res.ok) {
        if (roomMode === "create") {
          alert("🎉 Room created! Now switching to Join tab to enter.");
          setRoomMode("join");
        } else {
          alert(`✅ Joined #${roomNameInput}`);
          const groupsRes = await fetch(`http://localhost:8081/groups/my-groups?user_id=${userData.id}`);
          const groups = await groupsRes.json();
          setRooms(["general", ...groups.filter(g => g !== "general")]);
          setRoom(roomNameInput.toLowerCase());
          setIsRoomModalOpen(false);
          setRoomNameInput("");
          setRoomPassInput("");
        }
      } else {
        alert("❌ Error: Invalid password or group name.");
      }
    } catch (e) { alert("Connection failed"); }
  };

  const handleFileUpload = async (file, isPrivate = false) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const uploadUrl = `http://localhost:8083/ingest-file?room=${room}&user_id=${isPrivate ? userData.id : 0}`;
    try {
      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json();
      alert(data.message);
    } catch (e) { alert("Upload failed"); }
  };

  const { messages, privateHistory, streamingContent, privateStreaming, roomSummary, typingUser, sendMessage, sendTyping } = useChat(token, room, userData.id, userData.name);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentRoom = urlParams.get('room');
    if (currentRoom) setRoom(currentRoom.toLowerCase());
  }, []);

  useEffect(() => {
    if (privateStreaming) setLastResponse(privateStreaming);
  }, [privateStreaming]);

  if (!token) {
    return <Auth onLogin={handleLoginSuccess} />;
  }

  const dm = darkMode;

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${dm ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-900'}`}
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`w-64 flex flex-col flex-shrink-0 relative ${dm ? 'bg-gray-900 border-r border-gray-800' : 'bg-[#0F172A] border-r border-white/5'}`}>

        {/* subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Logo */}
        <div className="relative p-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div>
              <div className="text-white font-black text-base tracking-tight leading-none">Collab.AI</div>
              <div className="text-[10px] text-white/30 font-medium mt-0.5">Workspace</div>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="relative px-4 pt-4 pb-2">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 mb-2 px-1">You</div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {(userData.name || "?")[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-900" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{userData.name || 'Connecting...'}</div>
              <div className="text-[10px] text-emerald-400/80">online</div>
            </div>
          </div>
        </div>

        {/* Channels */}
        <div className="relative flex-1 px-4 pt-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">Channels</div>
            <button onClick={() => setIsRoomModalOpen(true)}
              className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all">
              <Plus size={11} />
            </button>
          </div>
          <div className="space-y-0.5">
            {rooms.map(r => (
              <button key={r} onClick={() => {
                setRoom(r);
                const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${r}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
              }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${room === r
                  ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white shadow-lg shadow-violet-900/40'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                <Hash size={13} className={room === r ? 'text-violet-300' : 'text-white/25 group-hover:text-white/40'} />
                <span className="truncate text-xs">{r}</span>
                {room === r && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-300" />}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="relative p-4 space-y-1.5 border-t border-white/5">
          <button onClick={() => setIsKnowledgeOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all group text-xs font-medium">
            <Database size={14} className="group-hover:text-violet-400 transition-colors" />
            Knowledge Base
          </button>
          <button onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all group text-xs font-medium">
            {darkMode ? <Sun size={14} className="group-hover:text-amber-400 transition-colors" /> : <Moon size={14} className="group-hover:text-indigo-400 transition-colors" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs font-medium">
            <X size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 relative">

        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-6 flex-shrink-0 border-b ${dm
          ? 'bg-gray-900/80 border-gray-800 backdrop-blur-md'
          : 'bg-white/80 border-slate-200/80 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${dm ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <Hash size={14} className={dm ? 'text-violet-400' : 'text-violet-600'} />
              <span className={`font-bold text-sm ${dm ? 'text-gray-100' : 'text-slate-800'}`}>{room}</span>
              <ShieldCheck size={13} className="text-emerald-500" />
            </div>
            {roomSummary && (
              <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border animate-in fade-in slide-in-from-left duration-500 ${dm
                ? 'bg-violet-950/50 border-violet-800/50 text-violet-300'
                : 'bg-violet-50 border-violet-200/60 text-violet-700'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="font-semibold opacity-60 uppercase text-[9px] tracking-wider">TL;DR</span>
                <span className="max-w-xs truncate">{roomSummary}</span>
              </div>
            )}
          </div>
          <button onClick={() => setIsPrivateOpen(!isPrivateOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isPrivateOpen
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
              : dm
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-400 hover:text-violet-600'}`}>
            <Lock size={13} />
            {isPrivateOpen ? 'Close ThinkSpace' : 'ThinkSpace'}
          </button>
        </header>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 ${dm ? 'bg-gray-950' : 'bg-slate-50'}`}>
          {(messages || []).map((m, i) => {
            const msgUser = (m.username || "").toLowerCase().trim();
            const currentUser = (userData?.name || "").toLowerCase().trim();
            const isAI = msgUser.includes("ai");
            const isMe = m.user_id ? m.user_id === userData.id : msgUser === currentUser;

            return (
              <div key={i} className={`flex flex-col max-w-[72%] ${isAI ? 'self-start' : isMe ? 'self-end' : 'self-start'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-1 ${isMe
                  ? dm ? 'text-violet-400 text-right' : 'text-violet-600 text-right'
                  : dm ? 'text-gray-500' : 'text-slate-400'}`}>
                  {m.username}
                </span>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isAI
                  ? dm
                    ? 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                  : isMe
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-violet-500/20'
                    : dm
                      ? 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                  }`}>
                  <div className="prose prose-sm max-w-none"
                    style={{ color: 'inherit' }}
                    dangerouslySetInnerHTML={{ __html: marked.parse(m.content || "") }} />
                </div>
              </div>
            );
          })}

          {streamingContent && (
            <div className="self-start max-w-[72%]">
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-1 block ${dm ? 'text-violet-400' : 'text-violet-600'}`}>
                AI Assistant
              </span>
              <div className={`px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm border shadow-sm ${dm
                ? 'bg-gray-800 border-violet-800/50 text-gray-100'
                : 'bg-white border-violet-200 text-slate-800'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider">Generating</span>
                </div>
                <div className="prose prose-sm max-w-none" style={{ color: 'inherit' }}
                  dangerouslySetInnerHTML={{ __html: marked.parse(streamingContent) }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <div className={`px-6 h-5 flex items-center ${dm ? 'bg-gray-950' : 'bg-slate-50'}`}>
          {typingUser && (
            <span className={`text-[11px] italic animate-pulse ${dm ? 'text-gray-500' : 'text-slate-400'}`}>
              {typingUser} is typing...
            </span>
          )}
        </div>

        {/* Input */}
        <footer className={`p-4 border-t flex-shrink-0 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <label className={`cursor-pointer p-2.5 rounded-xl transition-all flex-shrink-0 ${dm
              ? 'bg-gray-800 text-gray-400 hover:text-violet-400 hover:bg-gray-700'
              : 'bg-slate-100 text-slate-400 hover:text-violet-600 hover:bg-violet-50'}`}>
              <Paperclip size={18} />
              <input type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], false)} />
            </label>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (!typingTimeout.current) sendTyping();
                clearTimeout(typingTimeout.current);
                typingTimeout.current = setTimeout(() => { typingTimeout.current = null; }, 2000);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { sendMessage(input); setInput(""); }
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${dm
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-violet-600'
                : 'bg-slate-100 border-transparent text-slate-900 placeholder-slate-400 focus:border-violet-300 focus:bg-white'}`}
              placeholder={`Message #${room}...`}
            />
            <button
              onClick={() => { sendMessage(input); setInput(""); }}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-500/25 flex-shrink-0">
              <Send size={17} />
            </button>
          </div>
        </footer>
      </main>

      {/* ── PRIVATE AI SIDEBAR ──────────────────────────── */}
      {isPrivateOpen && (
        <aside className={`w-96 flex flex-col border-l flex-shrink-0 animate-in slide-in-from-right duration-300 ${dm
          ? 'bg-gray-900 border-gray-800'
          : 'bg-white border-slate-200'}`}>
          <div className={`p-5 border-b flex items-center justify-between ${dm ? 'border-gray-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <div className={`text-sm font-bold ${dm ? 'text-gray-100' : 'text-slate-800'}`}>ThinkSpace</div>
                <div className={`text-[10px] ${dm ? 'text-gray-500' : 'text-slate-400'}`}>Ask AI • Only visible to you</div>
              </div>
            </div>
            <button onClick={() => setIsPrivateOpen(false)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${dm
                ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
              <X size={15} />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${dm ? 'bg-gray-950/50' : 'bg-slate-50/50'}`}>
            {privateHistory.map((m, i) => {
              const isMe = m.username?.toLowerCase() === userData?.name?.toLowerCase() || m.username === "Me";
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[78%] shadow-sm ${isMe
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
                    : dm
                      ? 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {privateStreaming && (
              <div className="flex justify-start">
                <div className={`px-3.5 py-3 rounded-2xl rounded-bl-sm text-xs max-w-[78%] border ${dm
                  ? 'bg-gray-800 border-gray-700 text-gray-200'
                  : 'bg-white border-slate-200 text-slate-700'}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[9px] font-semibold text-violet-500 uppercase tracking-wider">Thinking</span>
                  </div>
                  <div className="prose prose-xs max-w-none" style={{ color: 'inherit' }}
                    dangerouslySetInnerHTML={{ __html: marked.parse(privateStreaming || lastResponse || "") }} />
                </div>
              </div>
            )}
          </div>

          <div className={`p-4 border-t ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100'}`}>
            <textarea
              value={privateInput}
              onChange={(e) => setPrivateInput(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-xs outline-none border transition-all resize-none ${dm
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-violet-600'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-300'}`}
              rows="3"
              placeholder="Ask privately about the chat..."
            />
            <button
              onClick={() => { sendMessage(privateInput, true); setPrivateInput(""); }}
              className="w-full mt-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-violet-500/20 active:scale-95">
              Ask Privately
            </button>
          </div>
        </aside>
      )}

      {/* ── KNOWLEDGE MODAL ──────────────────────────────────── */}
      {isKnowledgeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className={`rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 ${dm ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${dm ? 'border-gray-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Database size={17} className="text-emerald-500" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${dm ? 'text-gray-100' : 'text-slate-800'}`}>AI Knowledge</div>
                  <div className={`text-[10px] ${dm ? 'text-gray-500' : 'text-slate-400'}`}>Feed facts to the AI</div>
                </div>
              </div>
              <button onClick={() => setIsKnowledgeOpen(false)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${dm ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea id="km-input-react"
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all resize-none ${dm
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-400'}`}
                rows="5" placeholder="Type a fact to teach the AI..." />
              <div className="flex gap-3">
                <button onClick={() => setIsKnowledgeOpen(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${dm
                    ? 'border-gray-700 text-gray-400 hover:bg-gray-800'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const text = document.getElementById('km-input-react').value;
                    await fetch(`http://localhost:8083/ingest?room=${room}&user_id=0`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: text })
                    });
                    alert("AI Knowledge Updated!");
                    setIsKnowledgeOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20">
                  Save Fact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ROOM MODAL ───────────────────────────────────────── */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <div className={`rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 ${dm ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
            <div className={`flex border-b ${dm ? 'border-gray-800' : 'border-slate-100'}`}>
              {['join', 'create'].map(mode => (
                <button key={mode}
                  onClick={() => { setRoomMode(mode); setRoomNameInput(""); setRoomPassInput(""); }}
                  className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all ${roomMode === mode
                    ? dm
                      ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/5'
                      : 'text-violet-600 border-b-2 border-violet-500 bg-violet-50/50'
                    : dm
                      ? 'text-gray-500 hover:text-gray-300'
                      : 'text-slate-400 hover:text-slate-600'}`}>
                  {mode === 'join' ? 'Join Group' : 'Create New'}
                </button>
              ))}
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${dm ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}>
                  {roomMode === 'join' ? <Hash size={26} className="text-violet-500" /> : <Plus size={26} className="text-violet-500" />}
                </div>
                <div className={`font-bold text-base ${dm ? 'text-gray-100' : 'text-slate-800'}`}>
                  {roomMode === 'join' ? 'Join a Workspace' : 'Create a Workspace'}
                </div>
                <div className={`text-xs mt-1 ${dm ? 'text-gray-500' : 'text-slate-400'}`}>Enter the group details below</div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Room Name', value: roomNameInput, setter: setRoomNameInput, type: 'text', placeholder: 'e.g. science-lab' },
                  { label: 'Password', value: roomPassInput, setter: setRoomPassInput, type: 'password', placeholder: '••••••••' }
                ].map(({ label, value, setter, type, placeholder }) => (
                  <div key={label}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${dm ? 'text-gray-500' : 'text-slate-400'}`}>{label}</div>
                    <input type={type} value={value} onChange={e => setter(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all ${dm
                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-violet-600'
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400'}`}
                      placeholder={placeholder} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsRoomModalOpen(false)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${dm
                    ? 'border-gray-700 text-gray-400 hover:bg-gray-800'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  Cancel
                </button>
                <button onClick={handleRoomAction}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/25 active:scale-95">
                  {roomMode === 'join' ? 'Join Room' : 'Create Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
