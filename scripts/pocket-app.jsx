// CTRL+S Pocket — root composer. Identity gate → customer or barista (PIN-gated).

const { useState: _usA, useEffect: _ueA, useMemo: _umA, useRef: _urA } = React;

function PocketTopBar({ view, setView, theme, setTheme }) {
  return (
    <div className="topbar">
      <div className="brand">
        <CursorArrow size={14} color="var(--charcoal)" />
        <span className="brand-text h-doodle">CTRL<span style={{ color: 'var(--mustard)' }}>+S</span></span>
      </div>
      <div className="topbar-right">
        <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="view-toggle">
          <button className={view === 'customer' ? 'active' : ''} onClick={() => setView('customer')}>order</button>
          <button className={view === 'barista' ? 'active' : ''} onClick={() => setView('barista')}>barista</button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div style={{ fontSize: 48 }}>☕</div>
      <div className="h-hand" style={{ marginTop: 16, fontSize: 18 }}>กำลังโหลด...</div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="loading-screen">
      <div style={{ fontSize: 40 }}>⚠️</div>
      <div className="h-hand" style={{ marginTop: 16, fontSize: 17 }}>{error}</div>
      <div className="mono dim" style={{ fontSize: 12, marginTop: 6 }}>ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่</div>
      <button className="btn-primary" style={{ marginTop: 24 }} onClick={onRetry}>ลองใหม่</button>
    </div>
  );
}

function PocketApp() {
  const [state, setState] = _usA(null); // null = loading from Supabase
  const [loadError, setLoadError] = _usA(null);
  const [tick, setTick] = _usA(0);
  const profile = _umA(() => state ? CTRLS.getActiveProfile(state) : null, [state, tick]);

  const [view, setView] = _usA(() => {
    try {
      const h = window.location.hash.replace('#', '');
      return h === 'barista' ? 'barista' : 'customer';
    } catch { return 'customer'; }
  });
  const [theme, setTheme] = _usA('light');
  const [baristaUnlocked, setBaristaUnlocked] = _usA(() => {
    try { return sessionStorage.getItem('ctrls_barista_session') === '1'; } catch { return false; }
  });
  const [profileOpen, setProfileOpen] = _usA(false);
  const [syncError, setSyncError] = _usA(null);
  const [syncOnline, setSyncOnline] = _usA(false);

  // PWA install prompt
  const installPromptRef = _urA(null);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const [showInstall, setShowInstall] = _usA(
    () => !isStandalone && !localStorage.getItem('ctrls_install_dismissed')
  );

  _ueA(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    // Listen for browser install prompt (Android / desktop)
    const handler = e => { e.preventDefault(); installPromptRef.current = e; };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function handleInstall() {
    if (installPromptRef.current) {
      installPromptRef.current.prompt();
      installPromptRef.current.userChoice.then(() => {
        installPromptRef.current = null;
        localStorage.setItem('ctrls_install_dismissed', '1');
        setShowInstall(false);
      });
    } else {
      localStorage.setItem('ctrls_install_dismissed', '1');
      setShowInstall(false);
    }
  }
  function dismissInstall() {
    localStorage.setItem('ctrls_install_dismissed', '1');
    setShowInstall(false);
  }
  const pushTimerRef = _urA(null);
  const applyingRemoteRef = _urA(false); // true = state นี้มาจาก server, อย่า push กลับ (กัน echo loop)

  // Load from Supabase on mount — show error screen if fails (no silent fallback)
  function loadFromSupabase() {
    setLoadError(null);
    setSyncOnline(false);
    CTRLS.pullRemoteState()
      .then(({ state: remoteState }) => {
        applyingRemoteRef.current = true;
        setState(remoteState);
        setSyncOnline(true);
        setSyncError(null);
      })
      .catch((err) => {
        console.warn('CTRL+S load failed:', err);
        setLoadError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — กรุณาตรวจสอบอินเทอร์เน็ต');
      });
  }

  _ueA(() => {
    loadFromSupabase();

    // Realtime: update state directly from server — no local merge
    const unsubscribe = CTRLS.subscribeRemoteState(
      (remoteState) => { applyingRemoteRef.current = true; setState(remoteState); setSyncOnline(true); },
      (err) => { console.warn('CTRL+S realtime issue:', err); setSyncOnline(false); setSyncError('realtime หลุด — โหลดใหม่เพื่ออัปเดต'); }
    );

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      unsubscribe();
    };
  }, []);

  // Push to Supabase whenever state changes (debounced 350ms)
  _ueA(() => {
    if (!state || !syncOnline) return;
    if (applyingRemoteRef.current) { applyingRemoteRef.current = false; return; } // state จาก server — ไม่ต้อง push กลับ
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      CTRLS.pushRemoteState(state)
        .then(() => { setSyncError(null); setSyncOnline(true); })
        .catch((err) => { console.warn('CTRL+S push failed:', err); setSyncOnline(false); setSyncError('บันทึกไม่สำเร็จ — กรุณาโหลดใหม่'); });
    }, 350);
  }, [state]);
  _ueA(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  _ueA(() => { try { window.location.hash = view; } catch {} }, [view]);

  // === Profile mutation helper: keeps state.profiles in sync. ===
  function setProfile(nextProfile) {
    setState((s) => {
      const code = CTRLS.activeCode();
      const currentProfile = (s.profiles || {})[code] || CTRLS.getActiveProfile(s);
      const updatedProfile = typeof nextProfile === 'function'
        ? nextProfile(currentProfile)
        : nextProfile;
      if (!updatedProfile || !updatedProfile.code) return s;
      return CTRLS.upsertProfile(s, updatedProfile);
    });
  }
  function claimNewProfile(name, avatar, meta) {
    const normalizeName = (value) => (value || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const cleanName = name.trim();
    const existing = Object.values(state.profiles || {}).find((p) => {
      const id = p.id || p.code;
      const deleted = id && (state.peopleMeta || {})[id]?.deleted;
      return !deleted && normalizeName(p.name) === normalizeName(cleanName);
    });
    if (existing?.code) {
      const updated = {
        ...existing,
        avatar: avatar || existing.avatar,
        outOfTeam: meta ? !!meta.outOfTeam : !!existing.outOfTeam,
        lineId: meta ? (meta.lineId || '') : (existing.lineId || ''),
      };
      setState((s) => CTRLS.upsertProfile(s, updated));
      CTRLS.setActiveCode(existing.code);
      setTick((t) => t + 1);
      return;
    }
    const existingCodes = Object.keys(state.profiles || {});
    const p = CTRLS.newProfile(cleanName, existingCodes);
    if (avatar) p.avatar = avatar;
    if (meta) { p.outOfTeam = !!meta.outOfTeam; p.lineId = meta.lineId || ''; }
    setState((s) => CTRLS.upsertProfile(s, p));
    CTRLS.setActiveCode(p.code);
    setTick((t) => t + 1);
  }
  function activateCode(code) {
    const found = CTRLS.profileByCode(state, code);
    if (!found) return false;
    CTRLS.setActiveCode(code);
    setTick((t) => t + 1);
    return true;
  }
  function logout() {
    CTRLS.setActiveCode(null);
    setTick((t) => t + 1);
    setProfileOpen(false);
  }

  // === Loading / error gate (Supabase first) ===
  if (loadError) return <ErrorScreen error={loadError} onRetry={() => window.location.reload()} />;
  if (!state) return <LoadingScreen />;

  // === Identity gate ===
  if (!profile) {
    return (
      <div className="pocket-app">
        <IdentityGate
          onClaim={claimNewProfile}
          onActivateCode={activateCode}
        />
      </div>
    );
  }

  return (
    <div className="pocket-app">
      <PocketTopBar view={view} setView={setView} theme={theme} setTheme={setTheme} />

      {showInstall && (
        <div className="install-banner">
          <div className="install-banner-icon">☕</div>
          <div className="install-banner-text">
            <div className="h-doodle" style={{ fontSize: 15 }}>ลงแอปไว้หน้าจอ</div>
            {isIOS
              ? <div className="mono dim" style={{ fontSize: 11 }}>แตะ <span style={{ fontSize: 13 }}>⎙</span> Share → "Add to Home Screen"</div>
              : <div className="mono dim" style={{ fontSize: 11 }}>สั่งกาแฟได้ง่ายขึ้น · ใช้ได้แบบ offline</div>
            }
          </div>
          {isIOS
            ? <button className="install-banner-btn" onClick={dismissInstall}>โอเค</button>
            : <button className="install-banner-btn" onClick={handleInstall}>ลงเลย</button>
          }
          <button className="install-banner-close" onClick={dismissInstall}>✕</button>
        </div>
      )}
      {syncError && (
        <div className="sync-banner" onClick={() => window.location.reload()} title="แตะเพื่อโหลดใหม่">
          ⚠️ {syncError} · แตะเพื่อลองใหม่
        </div>
      )}
      {!syncError && (
        <div className={'sync-dot ' + (syncOnline ? 'sync-dot-online' : 'sync-dot-connecting')}
             title={syncOnline ? 'เชื่อมต่อเซิร์ฟเวอร์อยู่' : 'กำลังเชื่อมต่อ…'}>
          <span className="sync-dot-led" />
          {syncOnline ? 'ออนไลน์' : 'กำลังเชื่อมต่อ…'}
        </div>
      )}
      {view === 'customer' && (
        <CustomerPocket
          state={state}
          setState={setState}
          profile={profile}
          setProfile={setProfile}
          openProfile={() => setProfileOpen(true)}
        />
      )}
      {view === 'barista' && (
        baristaUnlocked
          ? <BaristaPocket state={state} setState={setState} profile={profile} onLock={() => { try { sessionStorage.removeItem('ctrls_barista_session'); } catch {} setBaristaUnlocked(false); }} />
          : <BaristaPinGate state={state} onUnlock={() => setBaristaUnlocked(true)} />
      )}
      {profileOpen && (
        <ProfileSheet
          state={state}
          setState={setState}
          profile={profile}
          setProfile={setProfile}
          onClose={() => setProfileOpen(false)}
          onLogout={logout}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PocketApp />);
