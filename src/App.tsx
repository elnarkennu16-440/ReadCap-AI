import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowUp, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Command, Copy, Ellipsis, FilePlus2, Globe2, Heart, Menu,
  MessageCircle, Mic, MoreHorizontal, Paperclip, Plus, Search, Settings2,
  Sparkles, Square, X, Zap,
} from 'lucide-react';
import { initialThreads, makeLocalReply, promptSuggestions, type Message, type Thread } from './data';

const stamp = () => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
const key = () => Math.random().toString(36).slice(2, 9);

function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={`brand-mark${small ? ' brand-mark--small' : ''}`} aria-hidden="true"><i /><b /><em /></span>;
}

function App() {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const [toolMenu, setToolMenu] = useState(false);
  const [modelMenu, setModelMenu] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [selectedTool, setSelectedTool] = useState('Thinking');
  const [attachedFile, setAttachedFile] = useState('');
  const [toast, setToast] = useState('');
  const [likedMessage, setLikedMessage] = useState<string | null>(null);
  const [now, setNow] = useState(stamp());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((thread) => thread.id === activeId) ?? null;
  const visibleThreads = useMemo(() => threads.filter((thread) => thread.title.toLowerCase().includes(search.toLowerCase())), [threads, search]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(stamp()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeThread) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeThread?.messages.length, typing]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2300);
  }

  function newChat() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setTyping(false);
    setActiveId(null);
    setDraft('');
    setAttachedFile('');
    setMobileOpen(false);
    setToolMenu(false);
    textareaRef.current?.focus();
  }

  function sendMessage(value = draft) {
    const content = value.trim();
    if ((!content && !attachedFile) || typing) return;
    const threadId = activeId ?? `thread-${key()}`;
    const nextMessage: Message = { id: `user-${key()}`, role: 'user', content: content || `Review this attachment: ${attachedFile}`, time: stamp() };
    const title = content.length > 38 ? `${content.slice(0, 38).trim()}…` : content || attachedFile;
    setThreads((current) => {
      const existing = current.find((thread) => thread.id === threadId);
      if (existing) return current.map((thread) => thread.id === threadId ? { ...thread, messages: [...thread.messages, nextMessage] } : thread);
      return [{ id: threadId, title, dateLabel: 'JUST NOW', messages: [nextMessage] }, ...current];
    });
    setActiveId(threadId);
    setDraft('');
    setAttachedFile('');
    setTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    timerRef.current = window.setTimeout(() => {
      const answer: Message = { id: `assistant-${key()}`, role: 'assistant', content: makeLocalReply(content || 'the attached file'), time: stamp() };
      setThreads((current) => current.map((thread) => thread.id === threadId ? { ...thread, messages: [...thread.messages, answer] } : thread));
      setTyping(false);
      timerRef.current = null;
    }, 1350);
  }

  function stopReply() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setTyping(false);
    notify('Response paused');
  }

  async function copyMessage(message: string) {
    try { await navigator.clipboard.writeText(message); notify('Copied to clipboard'); }
    catch { notify('Clipboard is unavailable here'); }
  }

  function selectThread(id: string) {
    setActiveId(id);
    setMobileOpen(false);
    setSearchOpen(false);
    setSearch('');
  }

  const sidebar = <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
    <div className="sidebar-top">
      <button className="brand-lockup" onClick={newChat} aria-label="ReadCap.ai home"><BrandMark /><span className="brand-word">ReadCap<span className="brand-dot">.</span><small>AI</small></span></button>
      <button className="icon-button collapse-control" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ArrowLeft size={16} /></button>
      <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
    </div>

    <div className="sidebar-actions">
      <button className="new-chat-button" onClick={newChat}><span className="new-chat-icon"><Plus size={16} /></span><span>New conversation</span><kbd>⌘ K</kbd></button>
      <div className="quick-actions">
        <button className="side-action" onClick={() => { setSearchOpen(!searchOpen); setSearch(''); }}><Search size={16} /><span>Search conversations</span><kbd>/</kbd></button>
        <button className="side-action" onClick={() => notify('Your reading room is up to date')}><Clock3 size={16} /><span>Reading room</span></button>
      </div>
    </div>

    {searchOpen && <div className="sidebar-search"><Search size={14} /><input autoFocus placeholder="Find a conversation" value={search} onChange={(event) => setSearch(event.target.value)} /><button onClick={() => { setSearchOpen(false); setSearch(''); }} aria-label="Close search"><X size={14} /></button></div>}

    <div className="history-heading"><span>Recent threads</span><button className="quiet-icon" onClick={() => notify('Showing your latest conversations')} aria-label="More history options"><Ellipsis size={17} /></button></div>
    <div className="thread-list">
      {visibleThreads.length === 0 && <p className="no-results">Nothing in this chapter.</p>}
      {visibleThreads.map((thread) => <button key={thread.id} className={`thread-item${activeId === thread.id ? ' is-active' : ''}`} onClick={() => selectThread(thread.id)} title={thread.title}>
        <span className="thread-glyph"><MessageCircle size={14} /></span><span className="thread-title">{thread.title}</span><span className="thread-more"><MoreHorizontal size={15} /></span>
      </button>)}
    </div>

    <div className="sidebar-bottom">
      <div className="edition-card"><span className="edition-icon"><Sparkles size={15} /></span><div><strong>ReadCap Studio</strong><small>Your ideas, in focus.</small></div><ChevronRight size={14} className="edition-arrow" /></div>
      <button className="profile-button" onClick={() => setProfileMenu(!profileMenu)}><span className="avatar avatar--user">J</span><span className="profile-copy"><strong>Jamie Rivera</strong><small>Personal workspace</small></span><MoreHorizontal size={17} className="profile-more" /></button>
      {profileMenu && <div className="profile-popover"><button onClick={() => notify('Profile settings are a frontend demo')}><Settings2 size={15} />Preferences</button><button onClick={() => notify('Help center coming soon')}><CircleHelp size={15} />Help & feedback</button></div>}
    </div>
  </aside>;

  return <div className="app-shell">
    {sidebar}
    {mobileOpen && <button className="drawer-scrim" onClick={() => setMobileOpen(false)} aria-label="Close sidebar overlay" />}
    <main className={`workspace${collapsed ? ' workspace--wide' : ''}`}>
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><strong>{activeThread?.title ?? 'New conversation'}</strong></div></div>
        <div className="topbar-right"><span className="live-time"><i />LOCAL SESSION <b>{now}</b></span><button className="topbar-help" onClick={() => notify('ReadCap is a frontend-only demo')}><CircleHelp size={15} /><span>Guide</span></button></div>
      </header>

      <div className="workspace-body" ref={scrollRef}>
        {!activeThread ? <section className="welcome-screen">
          <div className="welcome-eyebrow"><span className="eyebrow-rule" />YOUR THOUGHTS, WITH ROOM TO MOVE<span className="eyebrow-index">RC / 01</span></div>
          <div className="welcome-title-row"><div><h1>Make space<br />for <em>the signal.</em></h1><p className="welcome-copy">Bring the messy first thought.<br /><span>We’ll find the thread together.</span></p></div><div className="signal-orbit" aria-hidden="true"><span className="orbit orbit--one" /><span className="orbit orbit--two" /><span className="orbit-core"><BrandMark small /></span><span className="orbit-spark">✳</span><span className="orbit-dot" /></div></div>
          <div className="composer-zone">
            <PromptComposer
              draft={draft} setDraft={setDraft} onSend={sendMessage} typing={typing} onStop={stopReply}
              textareaRef={textareaRef} fileRef={fileRef} attachedFile={attachedFile} setAttachedFile={setAttachedFile}
              toolMenu={toolMenu} setToolMenu={setToolMenu} selectedTool={selectedTool} setSelectedTool={setSelectedTool}
              modelMenu={modelMenu} setModelMenu={setModelMenu} notify={notify}
            />
            <div className="composer-under"><span><Command size={12} /> <kbd>Enter</kbd> to send <span className="under-divider">·</span> <kbd>Shift + Enter</kbd> for a new line</span><span>PRIVATE BY DESIGN <i /></span></div>
          </div>
          <div className="suggestions-head"><span className="section-label">A PLACE TO BEGIN</span><span className="suggestion-count">THREE STARTING POINTS <b>↘</b></span></div>
          <div className="suggestion-list">{promptSuggestions.map((item) => <button key={item.number} className="suggestion-card" onClick={() => sendMessage(item.prompt)}><span className="suggestion-number">{item.number}</span><span className="suggestion-text"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="suggestion-arrow"><ArrowUp size={15} /></span></button>)}</div>
          <footer className="welcome-footer"><span><BrandMark small /> ReadCap is a thinking partner, not a final answer.</span><span>BUILT FOR THE IN-BETWEEN <b>© 2026</b></span></footer>
        </section> : <section className="conversation-screen">
          <div className="conversation-heading"><div><span className="section-label">WORKING THREAD <b>·</b> {activeThread.dateLabel}</span><h1>{activeThread.title}</h1></div><button className="conversation-options" onClick={() => notify('Thread options opened')} aria-label="Thread options"><MoreHorizontal size={19} /></button></div>
          <div className="message-stack">{activeThread.messages.map((message, index) => <article key={message.id} className={`message message--${message.role}`} style={{ animationDelay: `${Math.min(index * 65, 260)}ms` }}>
            <div className="message-rail">{message.role === 'assistant' ? <span className="avatar avatar--ai"><BrandMark small /></span> : <span className="avatar avatar--user">J</span>}</div>
            <div className="message-content"><div className="message-meta"><strong>{message.role === 'assistant' ? 'ReadCap' : 'You'}</strong><span>{message.time}</span>{message.role === 'assistant' && <span className="response-tag"><i />THINKING</span>}</div><div className="message-text">{message.content.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="inline-heading">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}</div>{message.role === 'assistant' && <div className="message-tools"><button onClick={() => copyMessage(message.content)}><Copy size={13} />Copy</button><button className={likedMessage === message.id ? 'liked' : ''} onClick={() => { setLikedMessage(likedMessage === message.id ? null : message.id); notify(likedMessage === message.id ? 'Feedback removed' : 'Thanks for the feedback'); }}><Heart size={13} fill={likedMessage === message.id ? 'currentColor' : 'none'} />Helpful</button><button onClick={() => notify('Response saved to your reading room')}><FilePlus2 size={13} />Save note</button></div>}</div>
          </article>)}{typing && <article className="message message--assistant typing-row"><div className="message-rail"><span className="avatar avatar--ai"><BrandMark small /></span></div><div className="message-content"><div className="message-meta"><strong>ReadCap</strong><span>now</span><span className="response-tag"><i />THINKING</span></div><div className="typing-indicator"><span /><span /><span /><small>finding the thread</small></div></div></article>}</div>
          <div className="conversation-composer"><PromptComposer
            draft={draft} setDraft={setDraft} onSend={sendMessage} typing={typing} onStop={stopReply}
            textareaRef={textareaRef} fileRef={fileRef} attachedFile={attachedFile} setAttachedFile={setAttachedFile}
            toolMenu={toolMenu} setToolMenu={setToolMenu} selectedTool={selectedTool} setSelectedTool={setSelectedTool}
            modelMenu={modelMenu} setModelMenu={setModelMenu} notify={notify}
          /><div className="conversation-disclaimer"><span>ReadCap can make mistakes. Check anything that matters.</span><span><Globe2 size={12} /> LOCAL DEMO MODE</span></div></div>
        </section>}
      </div>
      {toast && <div className="toast"><span className="toast-check"><Check size={13} /></span>{toast}</div>}
    </main>
  </div>;
}

type ComposerProps = {
  draft: string; setDraft: (value: string) => void; onSend: (value?: string) => void; typing: boolean; onStop: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>; fileRef: React.RefObject<HTMLInputElement | null>;
  attachedFile: string; setAttachedFile: (value: string) => void;
  toolMenu: boolean; setToolMenu: (value: boolean) => void; selectedTool: string; setSelectedTool: (value: string) => void;
  modelMenu: boolean; setModelMenu: (value: boolean) => void; notify: (message: string) => void;
};

function PromptComposer(props: ComposerProps) {
  const { draft, setDraft, onSend, typing, onStop, textareaRef, fileRef, attachedFile, setAttachedFile, toolMenu, setToolMenu, selectedTool, setSelectedTool, modelMenu, setModelMenu, notify } = props;
  const hasText = draft.trim().length > 0 || attachedFile.length > 0;
  function changeDraft(value: string) {
    setDraft(value);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 156)}px`; }
  }
  return <div className="prompt-composer">
    {attachedFile && <div className="attachment-chip"><Paperclip size={12} /><span>{attachedFile}</span><button onClick={() => setAttachedFile('')} aria-label="Remove attachment"><X size={12} /></button></div>}
    <textarea ref={textareaRef} value={draft} rows={1} placeholder="Write the thought you haven’t quite finished…" onChange={(event) => changeDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); } }} aria-label="Message ReadCap" />
    <input ref={fileRef} className="visually-hidden" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) setAttachedFile(file.name); event.currentTarget.value = ''; }} />
    <div className="composer-controls">
      <div className="composer-left-controls">
        <button className="composer-tool-button" onClick={() => fileRef.current?.click()} aria-label="Attach a file"><Paperclip size={16} /><span>Attach</span></button>
        <div className="tool-select-wrap"><button className={`composer-tool-button${toolMenu ? ' control-active' : ''}`} onClick={() => { setToolMenu(!toolMenu); setModelMenu(false); }}><Zap size={15} /><span>{selectedTool}</span><ChevronDown size={12} /></button>{toolMenu && <div className="control-popover tool-popover"><span className="popover-label">THINKING MODE</span>{['Thinking', 'Web search', 'Read a document'].map((tool) => <button key={tool} onClick={() => { setSelectedTool(tool); setToolMenu(false); notify(`${tool} mode selected`); }}><span className="tool-option-icon">{tool === 'Thinking' ? <Sparkles size={14} /> : tool === 'Web search' ? <Globe2 size={14} /> : <FilePlus2 size={14} />}</span><span>{tool}<small>{tool === 'Thinking' ? 'Careful, considered answers' : tool === 'Web search' ? 'Frontend demo control' : 'Read attached material'}</small></span>{selectedTool === tool && <Check size={14} className="option-check" />}</button>)}</div>}</div>
        <div className="tool-select-wrap model-select-wrap"><button className={`composer-model-button${modelMenu ? ' control-active' : ''}`} onClick={() => { setModelMenu(!modelMenu); setToolMenu(false); }}><span className="model-gem"><Sparkles size={11} /></span><span>ReadCap / 01</span><ChevronDown size={12} /></button>{modelMenu && <div className="control-popover model-popover"><span className="popover-label">YOUR WORKSPACE</span><button onClick={() => { setModelMenu(false); notify('ReadCap / 01 is active'); }}><span className="model-gem"><Sparkles size={11} /></span><span>ReadCap / 01<small>Balanced · clear thinking</small></span><Check size={14} className="option-check" /></button><div className="popover-note">Model selection is visual in this demo.</div></div>}</div>
      </div>
      <div className="composer-right-controls"><button className="icon-button mic-button" onClick={() => notify('Voice input is a frontend demo')} aria-label="Voice input"><Mic size={16} /></button><button className={`send-button${hasText || typing ? ' send-button--active' : ''}${typing ? ' send-button--stop' : ''}`} onClick={typing ? onStop : () => onSend()} disabled={!hasText && !typing} aria-label={typing ? 'Stop response' : 'Send message'}>{typing ? <Square size={13} fill="currentColor" /> : <ArrowUp size={17} />}</button></div>
    </div>
  </div>;
}

export default App;
