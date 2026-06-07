/* global React, ReactDOM, Sidebar, HomeScreen, ProjectsScreen, ProjectScreen, IdeasScreen, SearchScreen, Reentry, Icon, TodayScreen */
const { useState, useEffect } = React;

function Login({ onEnter }) {
  return (
    <div className="login">
      <div className="lglow"></div>
      <div className="login-inner fade-in">
        <div className="lmark"><div className="cos-logo">COS</div></div>
        <h1>Welcome<br/>back.</h1>
        <p className="lsub">Your context is exactly where you left it. Sign in and pick up.</p>
        <input className="lfield" placeholder="you@email.com" defaultValue="founder@cos.app" />
        <input className="lfield" type="password" placeholder="Password" defaultValue="········" />
        <button className="lbtn" onClick={onEnter}>Continue →</button>
        <div className="lfoot">Resume where you left off.</div>
      </div>
    </div>
  );
}

function App() {
  const [authed, setAuthed] = useState(false);
  const [route, setRoute] = useState("home");
  const [projectId, setProjectId] = useState(null);
  const [theme, setTheme] = useState("bold");
  const [collapsed, setCollapsed] = useState(false);
  const [reentry, setReentry] = useState(null);
  const [ideaId, setIdeaId] = useState(null);
  const [brainstorm, setBrainstorm] = useState(null);
  const [doc, setDoc] = useState(null);
  const [searchSeed, setSearchSeed] = useState("");
  const D = window.COS_DATA;

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  // persist position
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("cos-state") || "{}");
      if (s.authed) setAuthed(true);
      if (s.route) setRoute(s.route);
      if (s.projectId) setProjectId(s.projectId);
      if (s.theme) setTheme(s.theme);
      if (s.collapsed) setCollapsed(true);
    } catch (e) {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("cos-state", JSON.stringify({ authed, route, projectId, theme, collapsed })); } catch (e) {}
  }, [authed, route, projectId, theme, collapsed]);

  const mainRef = React.useRef(null);
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [route, projectId, ideaId]);

  const goProject = (id) => { setProjectId(id); setRoute("project"); };
  const goIdea = (id) => { setIdeaId(id); setRoute("idea"); };
  const goNav = (r) => { if (r === "search") setSearchSeed(""); setRoute(r); };

  // "Continue" — dormant projects trigger re-entry; active ones go straight in
  const onContinue = (id, fromInside) => {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return;
    if (!fromInside && (p.status === "dormant" || p.away === "3 weeks")) {
      setReentry(p);
    } else {
      goProject(id);
    }
  };
  // sidebar / index click — dormant projects greet you with re-entry, active ones open directly
  const onProjectClick = (id) => {
    const p = D.projects.find((x) => x.id === id);
    if (p && p.status === "dormant") setReentry(p);
    else goProject(id);
  };
  const resumeFromReentry = (id) => { setReentry(null); goProject(id); };

  if (!authed) return <Login onEnter={() => { setAuthed(true); setRoute("home"); }} />;

  const project = projectId ? D.projects.find((p) => p.id === projectId) : null;
  const idea = ideaId ? D.ideas.find((i) => i.id === ideaId) : null;

  return (
    <div className="app">
      <Sidebar route={route} projectId={projectId} theme={theme} setTheme={setTheme}
        collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}
        onNav={goNav} onProject={onProjectClick} onAsk={() => goNav("search")} />
      <main className="main" ref={mainRef}>
        {route === "home" && <HomeScreen onProject={goProject} onNav={goNav} onContinue={onContinue} />}
        {route === "today" && <TodayScreen onProject={goProject} />}
        {route === "projects" && <ProjectsScreen onProject={onProjectClick} onContinue={onContinue} />}
        {route === "project" && project && <ProjectScreen project={project} onContinue={onContinue} onBrainstorm={() => setBrainstorm(project)} onOpenDoc={(d, accent) => setDoc({ d, accent })} />}
        {route === "ideas" && <IdeasScreen onIdea={goIdea} />}
        {route === "idea" && idea && <IdeaDetail idea={idea} onProject={goProject} onBack={() => goNav("ideas")} />}
        {route === "search" && <SearchScreen onProject={goProject} initialQuery={searchSeed} />}
      </main>
      {reentry && <Reentry project={reentry} onClose={() => setReentry(null)} onResume={resumeFromReentry} />}
      {brainstorm && <BrainstormPanel project={brainstorm} onClose={() => setBrainstorm(null)} />}
      {doc && <DocViewer doc={doc.d} accent={doc.accent} onClose={() => setDoc(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);