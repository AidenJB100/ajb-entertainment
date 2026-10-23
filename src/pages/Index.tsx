import { useMemo, useRef, useState } from "react";
import { Bell, Bookmark, Check, ChevronDown, Compass, Heart, Home, ImagePlus, LockKeyhole, MessageCircle, MoreHorizontal, Plus, Search, Send, Sparkles, Upload, Users, Video, X } from "lucide-react";

type Post = { id: number; name: string; handle: string; avatar: string; time: string; text: string; image?: string; likes: number };
type Message = { from: string; text: string; time: string };

export default function Index() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => { try { return JSON.parse(localStorage.getItem("loopline-user") || "null"); } catch { return null; } });
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("loopline-posts") || "[]") as Post[];
      const realPosts = saved.filter(post => post.id > 3);
      localStorage.setItem("loopline-posts", JSON.stringify(realPosts));
      return realPosts;
    } catch { return []; }
  });
  const [view, setView] = useState("For you");
  const [modal, setModal] = useState<"auth" | "post" | "upload" | "messages" | "">("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authError, setAuthError] = useState("");
  const [draft, setDraft] = useState("");
  const [imageData, setImageData] = useState("");
  const [following, setFollowing] = useState<string[]>([]);
  const [liked, setLiked] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => { try { return JSON.parse(localStorage.getItem("loopline-messages") || "{}"); } catch { return {}; } });
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const persistPosts = (next: Post[]) => { setPosts(next); localStorage.setItem("loopline-posts", JSON.stringify(next)); };
  const gate = (action: () => void) => user ? action() : (setAuthMode("signup"), setModal("auth"));
  const filteredPosts = useMemo(() => posts.filter(p => `${p.name} ${p.handle} ${p.text}`.toLowerCase().includes(query.toLowerCase())), [posts, query]);

  function submitAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setAuthError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "").trim().replace(/^@/, "");
    if (authMode === "signup" && (!name || name.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(name))) { setAuthError("Choose a handle with at least 3 letters, numbers, dots or underscores."); return; }
    let accounts: { name: string; email: string; password: string }[] = [];
    try { accounts = JSON.parse(localStorage.getItem("loopline-demo-accounts") || "[]"); } catch { accounts = []; }
    if (authMode === "signup") {
      if (accounts.some(a => a.name.toLowerCase() === name.toLowerCase())) { setAuthError("That handle is already taken in this browser."); return; }
      if (accounts.some(a => a.email === email)) { setAuthError("An account with that email already exists in this browser."); return; }
      accounts.push({ name, email, password }); localStorage.setItem("loopline-demo-accounts", JSON.stringify(accounts));
      const next = { name, email }; localStorage.setItem("loopline-user", JSON.stringify(next)); setUser(next); setModal("");
    } else {
      const found = accounts.find(a => a.email === email && a.password === password);
      if (!found) { setAuthError("No matching demo account. Create one to try AJB Entertainment."); return; }
      const next = { name: found.name, email }; localStorage.setItem("loopline-user", JSON.stringify(next)); setUser(next); setModal("");
    }
  }
  function createPost() {
    if (!draft.trim() && !imageData) return;
    const next: Post = { id: Date.now(), name: user?.name || "you", handle: user?.name || "you", avatar: "", time: "Just now", text: draft.trim(), ...(imageData ? { image: imageData } : {}), likes: 0 };
    persistPosts([next, ...posts]); setDraft(""); setImageData(""); setModal(""); setView("For you");
  }
  function sendMessage() {
    if (!messageDraft.trim() || !user) return;
    const key = user.email;
    const next = { ...messages, [key]: [...(messages[key] || []), { from: user.name, text: messageDraft.trim(), time: "now" }] };
    setMessages(next); localStorage.setItem("loopline-messages", JSON.stringify(next)); setMessageDraft("");
  }
  function uploadFile(file?: File) {
    if (!file) return;
    if (file.size > 2_500_000) { setNotice("For this local demo, choose a video under 2.5 MB."); return; }
    setUploadedVideos(prev => [URL.createObjectURL(file), ...prev]); setNotice("Video added to your local demo library."); setTimeout(() => setNotice(""), 3000); setModal("");
  }
  const navItems = [{ name: "For you", icon: Home }, { name: "Explore", icon: Compass }, { name: "Videos", icon: Video }, { name: "Messages", icon: MessageCircle }, { name: "Saved", icon: Bookmark }];
  return <div className="loopline min-h-screen bg-[#faf9f7] text-[#242226]">
    <header className="topbar sticky top-0 z-30 flex h-[72px] items-center border-b border-[#eeece9] bg-white/95 px-4 backdrop-blur md:px-8">
      <button className="brand" onClick={() => { setView("For you"); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span>AJB Entertainment</span></button>
      <div className="searchbox mx-auto hidden max-w-[390px] flex-1 items-center gap-2 rounded-full bg-[#f5f4f2] px-4 md:flex"><Search size={17} className="text-[#88847f]"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search creators, videos, posts..." aria-label="Search"/></div>
      <div className="ml-auto flex items-center gap-2 md:gap-4"><button className="search-mobile icon-button md:hidden" aria-label="Search" onClick={() => document.getElementById("feed-search")?.focus()}><Search size={19}/></button><button className="icon-button relative" onClick={() => gate(() => setModal("messages"))} aria-label="Open messages"><Bell size={19}/></button>{user ? <button onClick={() => { localStorage.removeItem("loopline-user"); setUser(null); }} className="user-pill"><span className="avatar-small">{user.name[0]?.toUpperCase()}</span><span className="hidden sm:inline">@{user.name}</span><ChevronDown size={14}/></button> : <button onClick={() => { setAuthMode("signin"); setModal("auth"); }} className="signin-top">Sign in</button>}</div>
    </header>
    <div className="searchbox mx-4 mt-3 flex items-center gap-2 rounded-full bg-[#f0efed] px-4 md:hidden"><Search size={16}/><input id="feed-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search creators, videos, posts..." aria-label="Search"/></div>
    <div className="layout mx-auto flex max-w-[1320px] gap-8 px-4 md:px-8">
      <aside className="sidebar sticky top-[88px] hidden h-[calc(100vh-100px)] w-[212px] shrink-0 flex-col pt-8 md:flex"><div className="nav-label">YOUR SPACE</div>{navItems.map(({ name, icon: Icon }) => <button key={name} onClick={() => name === "Messages" ? gate(() => setModal("messages")) : setView(name)} className={`nav-item ${view === name ? "active" : ""}`}><Icon size={19}/>{name}{name === "Messages" && <span className="nav-lock"><LockKeyhole size={11}/></span>}</button>)}
        <div className="sidebar-rule"/><div className="nav-label">CREATOR TOOLS</div><button className="nav-item" onClick={() => gate(() => setModal("upload"))}><Upload size={19}/>Upload video</button><button className="nav-item" onClick={() => gate(() => setModal("post"))}><Plus size={19}/>Create a post</button>
        <div className="sidebar-bottom"><div className="sidebar-promo"><div className="sparkle"><Sparkles size={18}/></div><strong>Your people<br/>are out there.</strong><p>Find your corner of the creator community.</p><button onClick={() => setView("Explore")}>Explore creators <span>↗</span></button></div><div className="sidebar-foot">A place for things worth sharing. <span>✳</span></div></div>
      </aside>
      <main className="feed min-w-0 flex-1 pb-24 pt-6 md:pt-8">
        {!user && <div className="preview-banner"><div className="preview-icon"><Users size={20}/></div><div><strong>You're in preview mode</strong><p>It's quiet here for now. Join to share your first post or video.</p></div><button onClick={() => { setAuthMode("signup"); setModal("auth"); }}>Join now <span>↗</span></button></div>}
        <section className="empty-welcome"><div className="empty-art"><div className="empty-art-circle"><Sparkles size={34}/></div><span className="empty-art-dot dot-a"/><span className="empty-art-dot dot-b"/><span className="empty-art-star">✳</span></div><div className="kicker">A FRESH START</div><h1>Your next favorite<br/>creator hasn't joined yet.</h1><p>This is a brand-new community. Be one of the first to share what you make, find your people, and shape what's next.</p><button onClick={() => gate(() => setModal("post"))}>Share the first post <span>↗</span></button></section>
        <section className="posts-section"><div className="section-heading"><div><div className="kicker">FROM THE COMMUNITY</div><h2>The conversation <span>✳</span></h2></div><button className="text-link" onClick={() => gate(() => setModal("post"))}><Plus size={16}/> Write a post</button></div><div className="feed-tabs">{["For you", "Following", "Latest"].map(t => <button key={t} onClick={() => t === "Following" ? gate(() => setView(t)) : setView(t)} className={view === t ? "selected" : ""}>{t}{t === "Following" && <LockKeyhole size={12}/>}</button>)}</div>
          {!user && view === "Following" ? <div className="locked-feed"><LockKeyhole size={22}/><strong>Your feed, your people.</strong><span>Sign in to follow creators and build your feed.</span><button onClick={() => { setAuthMode("signup"); setModal("auth"); }}>Sign in or join</button></div> : filteredPosts.length ? <div className="post-list">{filteredPosts.map(post => <article key={post.id} className="post-card"><div className="post-header">{post.avatar ? <img className="post-avatar" src={post.avatar} alt=""/> : <span className="avatar-small">{post.name[0]?.toUpperCase()}</span>}<div className="post-by"><strong>{post.name}</strong><span>@{post.handle} · {post.time}</span></div><button className="more-button" aria-label="More post options"><MoreHorizontal size={19}/></button></div>{post.text && <p className="post-text">{post.text}</p>}{post.image && <img className="post-image" src={post.image} alt="Community post"/>}<div className="post-actions"><button onClick={() => gate(() => setLiked(l => l.includes(post.id) ? l.filter(x => x !== post.id) : [...l, post.id]))} className={liked.includes(post.id) ? "liked" : ""}><Heart size={18} fill={liked.includes(post.id) ? "currentColor" : "none"}/>{post.likes + (liked.includes(post.id) ? 1 : 0)}</button><button onClick={() => gate(() => setModal("messages"))}><MessageCircle size={18}/> Reply</button><button className="post-save" onClick={() => gate(() => setNotice("Saved to your collection."))}><Bookmark size={18}/></button></div></article>)}</div> : <div className="empty-feed"><MessageCircle size={22}/><strong>No posts yet</strong><span>When someone shares something, it'll show up here.</span><button onClick={() => gate(() => setModal("post"))}>Be the first to post</button></div>}
        </section>
        {uploadedVideos.length > 0 && <section className="uploaded-list"><div className="kicker">YOUR LOCAL DEMO LIBRARY</div>{uploadedVideos.map((src, i) => <video key={`${src}-${i}`} className="uploaded-video" src={src} controls/> )}</section>}
        {!user && <div className="join-card"><div className="join-art"><div className="art-phone"><span className="art-play">AJB</span><span className="art-lines"/><span className="art-photo"/></div><span className="float-bubble bubble-one"><MessageCircle size={16}/></span><span className="float-bubble bubble-two"><Heart size={17} fill="currentColor"/></span><span className="float-star">✳</span></div><div className="join-copy"><div className="kicker">THIS IS YOUR SPACE TOO</div><h2>Good things happen<br/>when we share.</h2><p>Start conversations, share what you're making, and find the people who just get it.</p><button onClick={() => { setAuthMode("signup"); setModal("auth"); }}>Come on in <span>↗</span></button></div></div>}
        <footer className="feed-footer">Made for the things worth sharing <span>✳</span></footer>
      </main>
      <aside className="rightbar hidden w-[250px] shrink-0 pt-8 xl:block"><div className="right-title"><div><div className="kicker">YOUR CREATOR COMMUNITY</div><h3>Make it yours</h3></div></div><div className="empty-people"><Users size={21}/><p>No creators here yet.</p><span>You'll find them as people join AJB Entertainment.</span></div><div className="trend-card"><div className="kicker">A BRAND-NEW SPACE</div><h3>It's yours to shape.</h3><p>Share your first idea, post a photo, or introduce yourself to the community.</p><button onClick={() => gate(() => setModal("post"))}><span>Create a post<small>Start the conversation</small></span><Plus size={14}/></button></div><div className="right-note"><LockKeyhole size={13}/> Local demo — no accounts are connected.</div></aside>
    </div>
    <nav className="mobile-nav md:hidden">{[{name:"For you",icon:Home},{name:"Explore",icon:Compass},{name:"Create",icon:Plus},{name:"Videos",icon:Video},{name:"Messages",icon:MessageCircle}].map(({name,icon:Icon})=><button key={name} onClick={()=>name==="Create"?gate(()=>setModal("post")):name==="Messages"?gate(()=>setModal("messages")):setView(name)}><Icon size={20}/><span>{name}</span></button>)}</nav>
    {notice && <div className="toast-note">{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}
    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal("")}><section className={`modal-card ${modal === "messages" ? "messages-modal" : ""}`} role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setModal("")} aria-label="Close"><X size={19}/></button>
      {modal === "auth" && <div className="auth-content"><div className="brand auth-brand"><span>AJB Entertainment</span></div><div className="kicker">YOUR SPACE IS WAITING</div><h2>{authMode === "signup" ? "Come on in." : "Good to see you."}</h2><p className="auth-description">{authMode === "signup" ? "Make an account to share, follow, and find your people." : "Pick up where your people left off."}</p><form onSubmit={submitAuth}>{authMode === "signup" && <label>Your handle<input name="name" placeholder="e.g. mayamakes" autoComplete="username" required minLength={3}/><small>Unique in this browser · letters, numbers, dots & underscores</small></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required/></label><label>Password<input name="password" type="password" placeholder="At least 6 characters" autoComplete={authMode === "signup" ? "new-password" : "current-password"} required minLength={6}/></label>{authError && <div className="form-error">{authError}</div>}<button className="auth-submit" type="submit">{authMode === "signup" ? "Create your account" : "Sign in"}<span>↗</span></button></form><div className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New around here?"}<button onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setAuthError(""); }}>{authMode === "signup" ? "Sign in" : "Create an account"}</button></div><div className="demo-warning"><LockKeyhole size={14}/><span>Demo only: accounts stay in this browser. Don't use a real password. This is not secure authentication.</span></div></div>}
      {modal === "post" && <div className="compose-modal"><div className="kicker">SHARE A THOUGHT</div><h2>What's on your mind?</h2><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Start a conversation..." rows={5} autoFocus/><div className="compose-tools"><button onClick={()=>fileRef.current?.click()}><ImagePlus size={18}/> Add a photo</button><button className="post-publish" onClick={createPost} disabled={!draft.trim()&&!imageData}>Share post <span>↗</span></button></div>{imageData&&<img className="compose-preview" src={imageData} alt="Selected preview"/>}<input ref={fileRef} hidden type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file){const r=new FileReader();r.onload=()=>setImageData(String(r.result));r.readAsDataURL(file);}}}/><div className="demo-warning"><LockKeyhole size={14}/><span>Posts are saved only in this browser in the demo.</span></div></div>}
      {modal === "upload" && <div className="compose-modal"><div className="kicker">YOUR CREATOR STUDIO</div><h2>Share a video.</h2><p className="auth-description">Pick a video from your device. It stays in this browser and isn't uploaded anywhere.</p><label className="upload-drop"><input type="file" accept="video/*" onChange={e=>uploadFile(e.target.files?.[0])}/><span><Upload size={24}/></span><strong>Choose a video</strong><small>MP4, WebM · under 2.5 MB for this demo</small></label><div className="demo-warning"><LockKeyhole size={14}/><span>This local demo does not upload or publish videos online.</span></div></div>}
      {modal === "messages" && <div className="messages-layout"><div className="chat-list"><div className="kicker">YOUR INBOX</div><h2>Messages</h2><p className="chat-demo-note"><LockKeyhole size={13}/> Local demo · not a secure private inbox</p><div className="empty-inbox">No conversations yet.</div></div><div className="chat-window"><div className="chat-history"><div className="chat-empty"><MessageCircle size={24}/><strong>Your inbox is empty</strong><span>When people join, conversations will show up here.</span></div></div>{user && <form className="chat-compose" onSubmit={e=>{e.preventDefault();sendMessage();}}><input value={messageDraft} onChange={e=>setMessageDraft(e.target.value)} placeholder="Write a message..."/><button aria-label="Send message" disabled={!messageDraft.trim()}><Send size={17}/></button></form>}</div></div>}
    </section></div>}
  </div>;
}
