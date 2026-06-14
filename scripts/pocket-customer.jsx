// CTRL+S Pocket — customer flow: greeting, calendar, menu, cart, pay.

const { useState: _usC, useEffect: _ueC, useMemo: _umC, useRef: _urC } = React;

// === Identity gate (first time or after logout) ===
function IdentityGate({ onClaim, onActivateCode }) {
  const [tab, setTab] = _usC('new'); // 'new' | 'code'
  const [name, setName] = _usC('');
  const [avatarSeed, setAvatarSeed] = _usC(0);
  const [codeInput, setCodeInput] = _usC('');
  const [codeError, setCodeError] = _usC(null);
  const [outOfTeam, setOutOfTeam] = _usC(false);
  const [lineId, setLineId] = _usC('');

  // Starter avatars — only CTRL+N-unlocked items so the chosen avatar is immediately valid.
  const avatarOptions = _umC(() => {
    const bodies = ['cream', 'beige', 'sand'];
    const accents = ['mustard', 'pink'];
    const necks = ['none', 'bow', 'collar'];
    const exps = ['happy', 'closed', 'sleepy'];
    const eyes = ['black', 'brown'];
    const arr = [];
    for (let i = 0; i < 4; i++) {
      const seed = (avatarSeed * 4 + i) * 7919;
      arr.push({
        ...CTRLS.DEFAULT_AVATAR,
        body: bodies[seed % bodies.length],
        accent: accents[(seed * 3) % accents.length],
        neck: necks[(seed * 11) % necks.length],
        expression: exps[(seed * 17) % exps.length],
        eyeColor: eyes[(seed * 23) % eyes.length],
      });
    }
    return arr;
  }, [avatarSeed]);
  const [pickedAvatar, setPickedAvatar] = _usC(0);

  function claim() {
    onClaim(name.trim(), avatarOptions[pickedAvatar], { outOfTeam, lineId: outOfTeam ? lineId.trim() : '' });
  }
  function tryCode() {
    const c = codeInput.trim().toUpperCase().replace(/\s/g, '');
    if (!onActivateCode(c)) {
      setCodeError('not found · double-check the code');
      setTimeout(() => setCodeError(null), 2400);
    }
  }

  return (
    <div className="identity-screen">
      <div className="brand-stack">
        <CursorArrow size={20} color="var(--charcoal)" />
        <span className="h-doodle" style={{ fontSize: 38, letterSpacing: '-1px' }}>CTRL<span style={{ color: 'var(--mustard)' }}>+S</span></span>
      </div>
      <div className="mono dim" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>·  coffee  ·</div>

      <div className="id-mode-tabs">
        <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>new here</button>
        <button className={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}>i have a code</button>
      </div>

      {tab === 'new' && (
        <div className="id-sticky">
          <div className="h-doodle">claim a handle</div>
          <div className="h-hand">pick a vibe · we'll remember you. you'll get a 4-letter code to roll over to other devices.</div>

          <div className="id-avatar-row">
            {avatarOptions.map((a, i) => (
              <button
                key={i}
                className={`id-avatar-pick ${pickedAvatar === i ? 'on' : ''}`}
                onClick={() => setPickedAvatar(i)}
              >
                <CatAvatar avatar={a} size={56} />
              </button>
            ))}
            <button className="id-avatar-reroll" onClick={() => { setAvatarSeed(avatarSeed + 1); setPickedAvatar(0); }}>↻</button>
          </div>
          <div className="mono dim" style={{ fontSize: 9, textAlign: 'center', marginTop: 4 }}>customize fully after sign-up</div>

          <input
            className="name-input"
            placeholder="your name (e.g. Pim)"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim() && (!outOfTeam || lineId.trim())) claim(); }}
          />

          <div className="team-ask">
            <div className="h-hand" style={{ fontSize: 13, marginBottom: 6 }}>on the creative team?</div>
            <div className="team-pills">
              <button
                type="button"
                className={`team-pill ${!outOfTeam ? 'on' : ''}`}
                onClick={() => setOutOfTeam(false)}
              >yep, on the team</button>
              <button
                type="button"
                className={`team-pill ${outOfTeam ? 'on' : ''}`}
                onClick={() => setOutOfTeam(true)}
              >another team / office</button>
            </div>
          </div>
          {outOfTeam && (
            <div className="outteam-box">
              <input
                className="name-input"
                style={{ marginTop: 0 }}
                placeholder="LINE ID (so we can send your bill ☕)"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim() && lineId.trim()) claim(); }}
              />
            </div>
          )}

          <button className="btn-primary" disabled={!name.trim() || (outOfTeam && !lineId.trim())} onClick={claim}>let's brew →</button>
        </div>
      )}

      {tab === 'code' && (
        <div className="id-sticky" style={{ background: 'var(--sage-soft)' }}>
          <div className="h-doodle">enter your code</div>
          <div className="h-hand">find your code in the old device · profile → settings → transfer code</div>
          <input
            className="name-input"
            style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)', fontSize: 18 }}
            placeholder="CAT-XXXX"
            value={codeInput}
            autoFocus
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter' && codeInput.trim()) tryCode(); }}
          />
          {codeError && <div className="mono" style={{ color: 'var(--terracotta)', fontSize: 11, textAlign: 'center', marginTop: 6 }}>{codeError}</div>}
          <button className="btn-primary" disabled={!codeInput.trim()} onClick={tryCode}>find me →</button>
        </div>
      )}

      <div className="id-mottoline">
        save files. save mind. <strong style={{ color: 'var(--terracotta)' }}>save me from this deadline.</strong>
      </div>
    </div>
  );
}

// === Welcome strip ===
function WelcomeStrip({ profile, state, onOpenProfile }) {
  const rank = CTRLS.rankFor(profile.cupCount);
  const todayIso = CTRLS.isoToday();
  const todayCount = (state.orders || []).filter((o) => o.name === profile.name && o.date === todayIso).length;
  const upcoming = (state.orders || []).filter((o) => o.name === profile.name && o.date > todayIso).length;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const statuses = [
    '🔄 syncing brain.exe…',
    '✨ ready to commit',
    '🐛 still debugging life',
    '☕ caffeine: refilling',
    '🚀 deploy mode: on',
    '🧠 cache: full',
    '📎 last save: a while ago',
  ];
  const status = statuses[dayOfYear % statuses.length];
  return (
    <div className="welcome-wrap">
      <div className="welcome-row">
        <div className="welcome-sticky">
          <div className="motto">
            save files. save mind.<br/>
            <strong>save me from this deadline.</strong>
          </div>
          <div className="shop-mini mono">— ctrl+s coffee</div>
          <div className="welcome-quip mono">{'>'} {status}</div>
        </div>
        <button className="welcome-profile-btn" onClick={onOpenProfile} title="profile">
          <CatAvatar avatar={profile.avatar} size={44} />
          <span className="welcome-profile-name h-hand">{profile.name}</span>
          <span className="welcome-profile-rank mono">{rank.label}</span>
        </button>
      </div>
      {(profile.credit > 0 || todayCount > 0 || upcoming > 0) && (
        <div className="welcome-pills">
          {profile.credit > 0 && <span className="welcome-pill credit">credit ฿{profile.credit}</span>}
          {todayCount > 0 && <span className="welcome-pill streak">{todayCount} today</span>}
          {upcoming > 0 && <span className="welcome-pill">+{upcoming} upcoming</span>}
        </div>
      )}
    </div>
  );
}

// === Subscription strip on main view ===
function SubscriptionStrip({ state, profile, onOpen, onCreate, compact }) {
  const mySubs = (state.subscriptions || []).filter((s) => s.profileId === profile.id && s.active);
  // compact = a small chip that sits beside the profile button in the header
  if (compact) {
    if (mySubs.length === 0) {
      return (
        <button className="sub-chip" onClick={onCreate} title="start a subscription">
          <span className="sub-chip-ico">✨</span>
          <span className="sub-chip-meta">
            <span className="h-hand sub-chip-title">subscribe?</span>
            <span className="mono sub-chip-sub">auto-brew your usual every week</span>
          </span>
          <span className="sub-chip-end">＋</span>
        </button>
      );
    }
    const sub = mySubs[0];
    const extra = mySubs.length - 1;
    return (
      <button className="sub-chip active" onClick={onOpen} title="edit subscription">
        <span className="sub-chip-ico">📌</span>
        <span className="sub-chip-meta">
          <span className="h-hand sub-chip-title">{sub.name || 'weekly'}{extra > 0 ? ` +${extra}` : ''}</span>
          <span className="mono sub-chip-sub">your auto-brew · tap to edit</span>
        </span>
      </button>
    );
  }
  if (mySubs.length === 0) {
    return (
      <div className="section sub-strip-empty">
        <button className="sub-strip-cta" onClick={onCreate}>
          <div className="sub-strip-icon"><CatAvatar avatar={{ body: 'beige', accent: 'mustard', expression: 'smug', prop: 'beret' }} size={42} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h-doodle" style={{ fontSize: 20, color: 'var(--charcoal)' }}>subscription?</div>
            <div className="h-hand" style={{ fontSize: 13, color: 'var(--brown)' }}>auto-brew your usual every week · cancel anytime</div>
          </div>
          <span className="sub-strip-arrow">＋</span>
        </button>
      </div>
    );
  }
  return (
    <div className="section">
      {mySubs.map((sub) => {
        const preview = CTRLS.previewMonthlyForSub(state, sub);
        const dowShort = ['S','M','T','W','T','F','S'];
        return (
          <button key={sub.id} className="sub-strip-active" onClick={onOpen}>
            <div className="sub-strip-head">
              <span className="h-doodle" style={{ fontSize: 18 }}>📌 {sub.name || 'your weekly'}</span>
              <span className="mono dim" style={{ fontSize: 10 }}>active · tap to edit</span>
            </div>
            <div className="sub-strip-days">
              {[0,1,2,3,4,5,6].map((dow) => {
                const has = sub.days.includes(dow);
                const tpl = sub.itemTemplate[dow];
                let label = '';
                if (has && tpl) {
                  if (tpl.type === 'random') label = '🎲';
                  else label = (CTRLS.itemLabel(state, tpl) || '').slice(0, 8);
                }
                return (
                  <div key={dow} className={`sub-strip-day ${has ? 'has' : ''}`}>
                    <div className="dl">{dowShort[dow]}</div>
                    {has && <div className="it">{label}</div>}
                  </div>
                );
              })}
            </div>
            <div className="sub-strip-foot">
              <span className="mono">≈ ฿{formatBaht(preview.total)} / mo · {preview.cups} cups</span>
              <span className="mono dim">next bill {sub.nextBillDate ? shortDate(sub.nextBillDate).mon + ' ' + shortDate(sub.nextBillDate).day : '—'}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// === Day picker — week scroll OR month grid, with order avatars ===
function DayPicker({ state, selectedDate, setSelectedDate, cart, profile }) {
  const [mode, setMode] = _usC('week');
  const [weekStart, setWeekStart] = _usC(() => CTRLS.isoToday());
  const [monthCursor, setMonthCursor] = _usC(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const todayIso = CTRLS.isoToday();
  const weekDays = _umC(() => nextNDays(7, weekStart), [weekStart]);

  // Index confirmed orders by date.
  const ordersByDate = _umC(() => {
    const map = {};
    for (const o of (state.orders || [])) {
      if (!CTRLS.isConfirmedOrder(o)) continue;
      (map[o.date] ||= []).push(o);
    }
    return map;
  }, [state.orders]);

  function bumpWeek(delta) {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7 * delta);
    setWeekStart(isoFromDate(d));
  }
  function bumpMonth(delta) {
    let { y, m } = monthCursor;
    m += delta;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonthCursor({ y, m });
  }

  const weekLabel = (() => {
    const sd = shortDate(weekDays[0]);
    const ed = shortDate(weekDays[6]);
    return `${sd.mon} ${sd.day} – ${ed.mon} ${ed.day}`;
  })();
  const monthLabel = (() => {
    const d = new Date(monthCursor.y, monthCursor.m, 1);
    return d.toLocaleString('en', { month: 'long', year: 'numeric' });
  })();

  return (
    <div className="section">
      <div className="daypicker-head">
        <span className="mono">01 ·</span>
        <span className="h-hand">pick a day</span>
        <SegToggle
          value={mode}
          onChange={setMode}
          options={[{ value: 'week', label: 'week' }, { value: 'month', label: 'month' }]}
        />
      </div>

      {mode === 'week' && (
        <>
          <div className="daypicker-head" style={{ marginBottom: 8, marginTop: -4 }}>
            <div className="daypicker-nav">
              <button className="nav-btn" onClick={() => bumpWeek(-1)} title="prev week">‹</button>
              <button className="nav-btn" onClick={() => setWeekStart(CTRLS.isoToday())} title="this week" style={{ width: 'auto', padding: '0 10px', borderRadius: 999 }}>today</button>
              <button className="nav-btn" onClick={() => bumpWeek(1)} title="next week">›</button>
            </div>
            <span className="range-label">{weekLabel}</span>
          </div>
          <div className="dayscroll no-scrollbar">
            {weekDays.map((iso) => {
              const open = CTRLS.isOpen(state, iso);
              const sel = iso === selectedDate;
              const today = iso === todayIso;
              const sd = shortDate(iso);
              const myCartCount = (cart[iso] || []).length;
              const ordersHere = ordersByDate[iso] || [];
              const others = ordersHere.filter((o) => o.name !== profile.name);
              return (
                <button key={iso} className={`daycard ${sel ? 'selected' : ''} ${!open ? 'closed' : ''}`} onClick={() => setSelectedDate(iso)}>
                  <div className="dow mono">{sd.dow}</div>
                  <div className="day h-doodle">{sd.day}</div>
                  <div className="mon mono dim">{sd.mon}</div>
                  {today && <div className="today-dot" />}
                  {!open && <div className="closed-mark"><PawPrint size={10} color="var(--brown-light)" /></div>}
                  {myCartCount > 0 && <div className="day-badge">{myCartCount}</div>}
                  {others.length > 0 && open && (
                    <div className="day-faces">
                      {others.slice(0, 2).map((o) => (
                        <span key={o.id} className={`day-face ${o.rankKey === 'save' ? 'day-face-crown' : o.rankKey === 'undo' ? 'day-face-ring' : ''}`}>
                          <CatAvatar avatar={o.avatar || { body: 'beige', expression: 'happy' }} size={18} />
                          {o.rankKey === 'save' && <span className="day-face-star">✦</span>}
                        </span>
                      ))}
                      {others.length > 2 && <span className="day-face-more mono">+{others.length - 2}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === 'month' && (
        <>
          <div className="daypicker-head" style={{ marginBottom: 10, marginTop: -4 }}>
            <div className="daypicker-nav">
              <button className="nav-btn" onClick={() => bumpMonth(-1)} title="prev month">‹</button>
              <button className="nav-btn" onClick={() => { const d = new Date(); setMonthCursor({ y: d.getFullYear(), m: d.getMonth() }); }} style={{ width: 'auto', padding: '0 10px', borderRadius: 999 }}>now</button>
              <button className="nav-btn" onClick={() => bumpMonth(1)} title="next month">›</button>
            </div>
            <span className="range-label">{monthLabel}</span>
          </div>
          <div className="month-grid">
            {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="month-dow">{d}</div>)}
            {monthMatrix(monthCursor.y, monthCursor.m).map((c, i) => {
              if (c.otherMonth) return <div key={i} className="month-cell blank" />;
              const open = CTRLS.isOpen(state, c.iso);
              const sel = c.iso === selectedDate;
              const today = c.iso === todayIso;
              const myCartCount = (cart[c.iso] || []).length;
              const ordersHere = ordersByDate[c.iso] || [];
              const others = ordersHere.filter((o) => o.name !== profile.name);
              return (
                <button
                  key={i}
                  disabled={!open}
                  className={`month-cell ${sel ? 'selected' : ''} ${!open ? 'closed' : ''} ${today ? 'today' : ''}`}
                  onClick={() => setSelectedDate(c.iso)}
                >
                  <span className="num">{c.day}</span>
                  {myCartCount > 0 && <span className="mc-badge">{myCartCount}</span>}
                  {others.length > 0 && open && (
                    <div className="month-faces">
                      {others.slice(0, 2).map((o, i) => (
                        <span key={o.id} className="month-face">
                          <CatAvatar avatar={o.avatar || { body: 'beige', expression: 'happy' }} size={11} />
                        </span>
                      ))}
                      {others.length > 2 && <span className="month-face-more">+{others.length - 2}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// === Menu cards ===
// === Café lounge — everyone with an order on the selected day, sitting together ===
function CafeLounge({ state, selectedDate, profile }) {
  const patrons = _umC(() => {
    const byPerson = {};
    (state.orders || []).forEach((o) => {
      if (!CTRLS.isConfirmedOrder(o) || o.date !== selectedDate) return;
      const key = o.profileId || o.name || 'someone';
      if (!byPerson[key]) {
        byPerson[key] = { key, name: o.name || 'someone', avatar: o.avatar, cups: 0, ts: o.ts || 0 };
      }
      byPerson[key].cups += (o.items || []).length;
      // keep the most recent avatar
      if ((o.ts || 0) >= byPerson[key].ts) { byPerson[key].avatar = o.avatar; byPerson[key].ts = o.ts || 0; }
    });
    return Object.values(byPerson).sort((a, b) => a.ts - b.ts);
  }, [state.orders, selectedDate]);

  // The owner/you are always present in the café — standing by the counter even
  // without an order that day (also doubles as a showcase for your avatar props).
  const meHasOrder = patrons.some((p) => p.key === profile.id || p.name === profile.name);
  const standingMe = meHasOrder
    ? null
    : { key: profile.id || 'me', name: profile.name, avatar: profile.avatar, cups: 0, standing: true };

  const isToday = selectedDate === CTRLS.isoToday();

  return (
    <div className="section cafe-section">
      <div className="cafe-strip">
        <div className="cafe-lane">
          {standingMe && (
            <div className="cafe-walker standing me" title={`${standingMe.name} · standing by`}>
              <span className="cafe-name mono">you</span>
              <span className="cat-bob"><CatAvatar avatar={standingMe.avatar || { body: 'beige', expression: 'happy' }} size={34} /></span>
            </div>
          )}
          {patrons.map((p, i) => {
            const isMe = p.key === profile.id || p.name === profile.name;
            // alternate walking direction + stagger so the lane feels alive
            const dir = i % 2 === 0 ? 'rtl' : 'ltr';
            const delay = -(i * 1.7) % 9;
            return (
              <div
                key={p.key}
                className={`cafe-walker ${dir} ${isMe ? 'me' : ''}`}
                style={{ animationDelay: `${delay}s` }}
                title={`${p.name} · ${p.cups} cup${p.cups !== 1 ? 's' : ''}`}
              >
                <span className="cafe-name mono">{isMe ? 'you' : p.name}</span>
                <span className="cat-bob"><CatAvatar avatar={p.avatar || { body: 'beige', expression: 'happy' }} size={34} /></span>
              </div>
            );
          })}
        </div>
        <div className="cafe-floorline" />
      </div>
      <div className="mono dim cafe-hint">
        {patrons.length === 0
          ? 'just you at the café for now ☕'
          : (isToday
              ? `${patrons.length} ${patrons.length === 1 ? 'cat' : 'cats'} hanging out today ☕`
              : `${patrons.length} ${patrons.length === 1 ? 'cat' : 'cats'} that day`)}
      </div>
    </div>
  );
}

// === "Miss a bean?" — vote to bring back retired/sold-out ASAP roasts ===
function MissedBeans({ state, setState, profile }) {
  const threshold = state.barista?.beanLoveThreshold || 8;
  const beanLove = state.beanLove || {};
  const missed = (state.asap || []).filter((a) => !CTRLS.isAvailable(a));
  if (!missed.length) return null;

  function toggleVote(id) {
    setState((s) => {
      const bl = { ...(s.beanLove || {}) };
      const voters = new Set(bl[id] || []);
      if (voters.has(profile.id)) voters.delete(profile.id); else voters.add(profile.id);
      bl[id] = [...voters];
      return { ...s, beanLove: bl };
    });
  }

  return (
    <div className="section missed-section">
      <div className="daypicker-head" style={{ marginBottom: 2 }}>
        <span className="mono dim">sold out · 💭 miss one?</span>
      </div>
      <div className="mono dim" style={{ fontSize: 10, marginBottom: 8 }}>
        vote to bring a retired roast back — enough love and {state.barista?.name || 'the barista'} restocks it
      </div>
      {missed.map((a) => {
        const voters = beanLove[a.id] || [];
        const voted = voters.includes(profile.id);
        const pct = Math.min(100, Math.round((voters.length / threshold) * 100));
        return (
          <div key={a.id} className="missed-bean">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-hand missed-name" style={{ fontSize: 15 }}>{a.name} <span className="missed-tag mono">sold out</span></div>
              <div className="missed-bar"><div className="missed-fill" style={{ width: pct + '%' }} /></div>
              <div className="mono dim" style={{ fontSize: 10 }}>{voters.length}/{threshold} want it back{voters.length >= threshold ? ' · 🎉 restocking soon!' : ''}</div>
            </div>
            <button className={`btn-mini ${voted ? '' : 'ghost'}`} onClick={() => toggleVote(a.id)}>
              {voted ? '💛 voted' : '🥺 bring back'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MenuList({ state, isClosed, onAdd }) {
  const [showAsap, setShowAsap] = _usC(false);
  const [activeRoast, setActiveRoast] = _usC('all');

  const filteredAsap = _umC(() => {
    const availableAsap = (state.asap || []).filter((a) => CTRLS.isAvailable(a));
    const arr = activeRoast === 'all' ? [...availableAsap] : availableAsap.filter((a) => CTRLS.itemRoast(a) === activeRoast);
    return arr.sort((a, b) => (CTRLS.ROAST_ORDER[CTRLS.itemRoast(a)] - CTRLS.ROAST_ORDER[CTRLS.itemRoast(b)]) || a.name.localeCompare(b.name));
  }, [state.asap, activeRoast]);

  function addAndFly(e, type, refId, color) {
    if (isClosed) return;
    onAdd(type, refId);
    playBrewAnim(e.currentTarget, color);
  }

  const accentForColor = { mustard: '#D5A23B', pink: '#E7A2AC', terracotta: '#C97B5F', sage: '#8FA287', charcoal: '#D5A23B' };
  const bodyForColor   = { mustard: '#F6F1E8', pink: '#EADFCB', terracotta: '#F6F1E8', sage: '#EADFCB', charcoal: '#F6F1E8' };

  return (
    <div className="section">
      <div className="daypicker-head" style={{ marginBottom: 14 }}>
        <span className="mono">02 ·</span>
        <span className="h-hand">set your mood</span>
      </div>

      {/* Today's Roast — barista-pinned ASAP item */}
      {(() => {
        const featId = state.barista?.featuredAsap;
        if (!featId) return null;
        const feat = CTRLS.asapById(state, featId);
        if (!feat || !CTRLS.isAvailable(feat)) return null;
        return (
          <button
            key="featured-roast"
            disabled={isClosed}
            className="featured-roast"
            onClick={(e) => addAndFly(e, 'asap', feat.id, 'terracotta')}
          >
            <div className="featured-roast-badge">📌 today's roast</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="mood-cat" style={{ width: 52, height: 52, flexShrink: 0 }}>
                <CatASAP size={52} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-hand" style={{ fontSize: 20, lineHeight: 1.1, color: 'var(--charcoal)' }}>{feat.name}</div>
                <div style={{ fontSize: 12, color: 'var(--brown)', margin: '3px 0 5px', lineHeight: 1.3 }}>{feat.notes}</div>
                <span className={`roast-pill ${CTRLS.itemRoast(feat)}`}>{CTRLS.itemRoast(feat)}</span>
              </div>
              <div className="h-doodle" style={{ fontSize: 28, color: 'var(--terracotta)', flexShrink: 0 }}>฿{feat.price}</div>
            </div>
          </button>
        );
      })()}

      <div className="mood-grid">
      {(state.signatureMenu || CTRLS.DEFAULT_SIGNATURE_MENU).filter((m) => CTRLS.isAvailable(m)).map((m) => (
        <button key={m.id} disabled={isClosed} className="mood-card" style={{ '--accent': COLOR_TO_VAR[m.color] || COLOR_TO_VAR.mustard }} onClick={(e) => addAndFly(e, 'menu', m.id, m.color)}>
          <div className="mood-head">
            <div className="mood-cat">
              <CatBase size={64}
                fill={bodyForColor[m.color] || '#F6F1E8'}
                stroke="#2B2B2B"
                expression={m.catStyle || 'happy'}
                accent={accentForColor[m.color] || '#D5A23B'}
              />
            </div>
            <div className="mood-text">
              <div className="mood-name h-doodle">{m.name}</div>
              <div className="mood-tag mono">{m.tag}</div>
              <div className="mood-meta"><span className={`roast-pill ${CTRLS.itemRoast(m)}`}>{CTRLS.itemRoast(m)}</span></div>
            </div>
          </div>
          <div className="mood-foot">
            <div className="mood-tagline h-hand">{m.tagline}</div>
            <div className="mood-cta">
              <div className="mood-price h-doodle">฿{m.price}</div>
              <div className="mood-emoji">{m.mood}</div>
            </div>
          </div>
        </button>
      ))}
      </div>

      <button disabled={isClosed} className="mood-card asap" onClick={() => setShowAsap(!showAsap)}>
        <div className="mood-cat"><CatASAP size={64} /></div>
        <div className="mood-text">
          <div className="mood-name h-doodle" style={{ color: 'var(--terracotta)' }}>ASAP</div>
          <div className="mood-tag mono">surprise blend / unpredictable</div>
          <div className="mood-tagline h-hand">trust the cat. it knows.</div>
        </div>
        <div className="mood-cta">
          <div className="mood-price h-doodle">฿40·60</div>
          <div className="mood-emoji" style={{ fontSize: 20 }}>{showAsap ? '−' : '＋'}</div>
        </div>
      </button>

      {showAsap && (
        <div className="asap-list">
          <div className="roast-tabs">
            {['all', ...CTRLS.ROAST_OPTIONS].map((r) => (
              <button key={r} className={activeRoast === r ? 'active' : ''} onClick={() => setActiveRoast(r)}>
                <span className="mono">{r}</span>
                {r !== 'all' && r !== 'non-coffee' && (
                  <span className="beans">
                    {Array.from({ length: r === 'light' ? 1 : r === 'medium' ? 2 : 3 }).map((_, i) => (
                      <Bean key={i} size={9} color={r === 'light' ? '#D5A23B' : r === 'medium' ? '#A88B72' : '#6B4E3D'} />
                    ))}
                  </span>
                )}
                {r === 'non-coffee' && <span className="beans">✦</span>}
              </button>
            ))}
          </div>
          {filteredAsap.map((a) => (
            <button key={a.id} disabled={isClosed} className="asap-item" onClick={(e) => addAndFly(e, 'asap', a.id, 'terracotta')}>
              <div className="asap-left">
                <div className="asap-name h-hand">{a.name}</div>
                <div className="asap-notes">{a.notes}</div>
                <div className="asap-meta mono">
                  <span className={`roast-pill ${CTRLS.itemRoast(a)}`}>{CTRLS.itemRoast(a)}</span>
                </div>
              </div>
              <div className="asap-price h-doodle">฿{a.price}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TodayNoteCard({ state }) {
  const note = state.barista?.todayNote || {};
  if (!note.enabled || !String(note.body || '').trim()) return null;
  return (
    <div className="section today-note-section">
      <div className="today-note-card">
        <div className="today-note-head">
          <span className="mono">{note.title || "today's note"}</span>
          <span className="today-note-dot">●</span>
        </div>
        <div className="h-hand today-note-body">{note.body}</div>
      </div>
    </div>
  );
}

// === Cart + confirm sheet (merged: review, edit, and place in one step) ===
function CartSheet({ state, profile, cart, onClose, onRemove, onConfirm }) {
  const dates = Object.keys(cart).sort();
  const total = Object.values(cart).flat().reduce((s, it) => s + CTRLS.priceForItem(state, it), 0);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 28 }}>your cups ☕</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          {dates.length === 0 && <div className="empty mono">no cups yet</div>}
          {dates.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 2px' }}>
              <CatAvatar avatar={{ ...(profile?.avatar || {}), expression: 'sparkle' }} size={68} />
            </div>
          )}
          {dates.map((d) => {
            const sd = shortDate(d);
            return (
              <div key={d} className="cart-group">
                <div className="cart-group-head">
                  <span className="h-doodle" style={{ fontSize: 22 }}>{sd.dow} {sd.day} {sd.mon}</span>
                  <span className="mono dim">{cart[d].length} item{cart[d].length > 1 ? 's' : ''}</span>
                </div>
                {cart[d].map((it, i) => (
                  <div key={i} className="cart-line">
                    <span className="h-hand" style={{ flex: 1 }}>{CTRLS.itemLabel(state, it)}</span>
                    <span className="mono dim">฿{CTRLS.priceForItem(state, it)}</span>
                    <button className="x" onClick={() => onRemove(d, i)}>×</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="sheet-foot">
          {dates.length > 0 && (
            <div className="total-row">
              <span className="h-hand">total</span>
              <span className="h-doodle" style={{ fontSize: 32 }}>฿{formatBaht(total)}</span>
            </div>
          )}
          <button className="btn-primary" disabled={dates.length === 0} onClick={() => onConfirm(total)}>
            place order →
          </button>
          <div className="footnote mono">pickup at your desk · pay the barista directly</div>
        </div>
      </div>
    </div>
  );
}

function DoneSheet({ onClose, name, profile }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet done" onClick={(e) => e.stopPropagation()}>
        <div className="done-cat"><CatAvatar avatar={{ ...(profile?.avatar || {}), expression: 'lol' }} size={120} /></div>
        <div className="h-doodle" style={{ fontSize: 40, textAlign: 'center' }}>brewing soon!</div>
        <div className="h-hand" style={{ textAlign: 'center', fontSize: 18, color: 'var(--brown)' }}>{name || 'friend'}, your cups are in the queue ☕</div>
        <div className="mono dim" style={{ textAlign: 'center', marginTop: 8 }}>we'll drop them at your desk</div>
        <button className="btn-primary" onClick={onClose}>got it</button>
      </div>
    </div>
  );
}

// === Today/day items list — your stuff + who else ===
function DayItemsList({ state, selectedDate, dayItems, onRemove, profile }) {
  const ordersByDay = (state.orders || []).filter((o) => CTRLS.isConfirmedOrder(o) && o.date === selectedDate);
  const others = ordersByDay.filter((o) => o.name !== profile.name);
  const hasAnything = dayItems.length > 0 || others.length > 0;
  if (!hasAnything) return null;
  const sd = shortDate(selectedDate);
  return (
    <div className="section">
      <div className="daypicker-head">
        <span className="mono">03 ·</span>
        <span className="h-hand">{sd.dow.toLowerCase()} {sd.day}</span>
      </div>
      {dayItems.length > 0 && (
        <div className="dayitems" style={{ marginBottom: 12 }}>
          {dayItems.map((it, i) => (
            <div key={i} className="dayitem">
              <Mug size={18} color="var(--charcoal)" fill={COLOR_TO_SOFT[CTRLS.itemColor(state, it)] || 'var(--terracotta-soft)'} />
              <span className="h-hand" style={{ flex: 1 }}>{CTRLS.itemLabel(state, it)}</span>
              <span className="mono dim">฿{CTRLS.priceForItem(state, it)}</span>
              <button className="x" onClick={() => onRemove(selectedDate, i)}>×</button>
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="others-block">
          <div className="mono dim" style={{ fontSize: 10, marginBottom: 6 }}>also brewing today · {others.length}</div>
          {others.map((o) => (
            <div key={o.id} className="other-row">
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <CatAvatar avatar={o.avatar || { body: 'beige', expression: 'happy' }} size={28} />
                {o.rankKey === 'save' && <span className="other-rank-crown">✦</span>}
                {o.rankKey === 'undo' && <span className="other-rank-ring" />}
              </div>
              <div className="other-mid">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className="h-hand" style={{ fontSize: 14, lineHeight: 1 }}>{o.name}</div>
                  {(o.rankKey === 'save' || o.rankKey === 'undo') && (
                    <span className="mono" style={{ fontSize: 8, color: o.rankKey === 'save' ? 'var(--mustard)' : 'var(--sage)', fontWeight: 700 }}>
                      {o.rankKey === 'save' ? 'CTRL+S' : 'CTRL+Z'}
                    </span>
                  )}
                </div>
                <div className="mono dim" style={{ fontSize: 10 }}>{o.items.map((it) => CTRLS.itemLabel(state, it)).join(' · ')}</div>
              </div>
              <span className={`status-dot status-${o.status}`} title={o.status}></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderInfoCard({ state, selectedDate }) {
  const cutoff = CTRLS.orderCutoffForDate(selectedDate);
  const cutoffLabel = cutoff.toLocaleString('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const openDays = (state.openDays || [])
    .slice()
    .sort((a, b) => a - b)
    .map((d) => CTRLS.DOW_EN[d])
    .join(' / ');
  const selectedOrderable = CTRLS.canOrderDate(state, selectedDate);

  return (
    <div className="section order-info-section">
      <div className="order-info-card">
        <div className="order-info-head">
          <span className="mono">how ordering works</span>
          <span className={`order-info-pill ${selectedOrderable ? 'open' : 'closed'}`}>
            {selectedOrderable ? 'open' : 'closed'}
          </span>
        </div>
        <div className="order-info-grid">
          <div>
            <div className="h-hand">cutoff</div>
            <div className="mono dim">23:59 the day before serving</div>
            <div className="order-info-small">selected day closes {cutoffLabel}</div>
          </div>
          <div>
            <div className="h-hand">serving days</div>
            <div className="mono dim">{openDays || 'set by barista'}</div>
            <div className="order-info-small">one-off open/closed days may override this</div>
          </div>
          <div>
            <div className="h-hand">after confirm</div>
            <div className="mono dim">your cup goes straight to the queue</div>
            <div className="order-info-small">swap or cancel before the cutoff</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Gift: send sheet ===
function GiftSheet({ state, profile, onClose, onSend }) {
  const [recipient, setRecipient] = _usC(null);
  const [tier, setTier] = _usC(40);
  const [anonymous, setAnonymous] = _usC(false);

  const knownPeople = _umC(() => {
    const map = {};
    Object.values(state.profiles || {}).forEach((p) => {
      const id = p.id || p.code;
      const meta = (state.peopleMeta || {})[id] || {};
      if (!id || id === profile.id || meta.hiddenFromGift || meta.deleted) return;
      map[id] = { profileId: id, name: p.name || 'friend', avatar: p.avatar };
    });
    (state.orders || []).forEach((o) => {
      const meta = (state.peopleMeta || {})[o.profileId] || {};
      if (o.profileId && o.profileId !== profile.id && !map[o.profileId] && !meta.hiddenFromGift && !meta.deleted) {
        map[o.profileId] = { profileId: o.profileId, name: o.name, avatar: o.avatar };
      }
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.profiles, state.orders, state.peopleMeta, profile.id]);

  function send() {
    onSend({
      id: 'g' + Date.now() + Math.random().toString(36).slice(2, 5),
      fromProfileId: profile.id,
      fromName: profile.name,
      fromAvatar: profile.avatar,
      anonymous,
      toProfileId: recipient.profileId,
      toName: recipient.name,
      tier,
      claimed: false,
      claimedOrderId: null,
      ts: Date.now(),
    });
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 28 }}>🎁 gift a cup</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          {knownPeople.length === 0 ? (
            <div className="sub-empty">
              <div className="h-hand">no teammates yet</div>
              <div className="mono dim" style={{ fontSize: 12, marginTop: 4 }}>ask them to create a profile first</div>
            </div>
          ) : (
            <>
              <div className="mono dim" style={{ marginBottom: 8 }}>send to</div>
              {knownPeople.map((p) => (
                <button key={p.profileId} className={`gift-recipient-row ${recipient?.profileId === p.profileId ? 'selected' : ''}`} onClick={() => setRecipient(p)}>
                  <CatAvatar avatar={p.avatar || CTRLS.DEFAULT_AVATAR} size={36} />
                  <span className="h-hand" style={{ flex: 1, fontSize: 16 }}>{p.name}</span>
                  {recipient?.profileId === p.profileId && <span className="mono" style={{ color: 'var(--mustard)' }}>✓</span>}
                </button>
              ))}

              <div className="mono dim" style={{ margin: '16px 0 8px' }}>tier</div>
              <div className="gift-tier-row">
                {[{ v: 40, label: 'house blend' }, { v: 60, label: 'premium roast' }].map(({ v, label }) => (
                  <button key={v} className={`gift-tier-btn ${tier === v ? 'on' : ''}`} onClick={() => setTier(v)}>
                    <div className="h-doodle" style={{ fontSize: 26 }}>฿{v}</div>
                    <div className="mono dim" style={{ fontSize: 10 }}>{label}</div>
                  </button>
                ))}
              </div>

              <div className="mono dim" style={{ margin: '16px 0 8px' }}>from</div>
              <div className="gift-anon-row">
                <button className={`gift-anon-btn ${!anonymous ? 'on' : ''}`} onClick={() => setAnonymous(false)}>
                  <CatAvatar avatar={profile.avatar} size={28} />
                  <span className="h-hand" style={{ fontSize: 13 }}>{profile.name}</span>
                </button>
                <button className={`gift-anon-btn ${anonymous ? 'on' : ''}`} onClick={() => setAnonymous(true)}>
                  <span style={{ fontSize: 22 }}>🎭</span>
                  <span className="h-hand" style={{ fontSize: 13 }}>anonymous</span>
                </button>
              </div>
            </>
          )}
        </div>
        <div className="sheet-foot">
          <button className="btn-primary" disabled={!recipient} onClick={send}>send gift →</button>
          <div className="footnote mono">they'll see it when they open the app next ☕</div>
        </div>
      </div>
    </div>
  );
}

// === Gift: receive notification ===
function GiftNotificationSheet({ gift, state, profile, onClaim, onDismiss }) {
  const [picked, setPicked] = _usC(null);
  const [catDecide, setCatDecide] = _usC(false);

  const itemsAtTier = _umC(() => {
    const sig = (state.signatureMenu || CTRLS.DEFAULT_SIGNATURE_MENU).filter((m) => CTRLS.isAvailable(m) && m.price === gift.tier);
    const asap = state.asap.filter((a) => CTRLS.isAvailable(a) && a.price === gift.tier);
    return [
      ...sig.map((m) => ({ type: 'menu', refId: m.id, label: m.name })),
      ...asap.map((a) => ({ type: 'asap', refId: a.id, label: a.name })),
    ];
  }, [gift.tier, state]);

  function claim() {
    let item = catDecide || !picked
      ? itemsAtTier[Math.floor(Math.random() * itemsAtTier.length)]
      : picked;
    if (!item) return;
    let date = CTRLS.isoToday();
    if (!CTRLS.canOrderDate(state, date)) {
      for (let i = 1; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        const iso = isoFromDate(d);
        if (CTRLS.canOrderDate(state, iso)) { date = iso; break; }
      }
    }
    onClaim(gift, { type: item.type, refId: item.refId, qty: 1 }, date);
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet gift-notif-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="gift-notif-top">
          <div className="gift-notif-cats">
            {gift.anonymous
              ? <span style={{ fontSize: 48 }}>🎭</span>
              : <CatAvatar avatar={gift.fromAvatar || CTRLS.DEFAULT_AVATAR} size={56} />}
            <span className="gift-notif-arrow">🎁</span>
            <div style={{ position: 'relative' }}>
              <CatAvatar avatar={profile.avatar} size={56} />
            </div>
          </div>
          <div className="h-doodle" style={{ fontSize: 28, textAlign: 'center', marginTop: 10 }}>you've got a gift!</div>
          <div className="h-hand" style={{ textAlign: 'center', fontSize: 14, color: 'var(--brown)', marginTop: 4 }}>
            {gift.anonymous ? 'a mystery friend' : gift.fromName} sent you a coffee
          </div>
          <div className="gift-tier-badge">฿{gift.tier} · {gift.tier === 40 ? 'house blend' : 'premium roast'}</div>
        </div>
        <div className="mono dim" style={{ padding: '12px 16px 6px', fontSize: 10 }}>pick your drink</div>
        <div className="sheet-scroll no-scrollbar" style={{ maxHeight: 220 }}>
          {itemsAtTier.map((item) => (
            <button key={item.refId} className={`asap-item ${picked?.refId === item.refId && !catDecide ? 'gift-item-selected' : ''}`}
              onClick={() => { setPicked(item); setCatDecide(false); }}>
              <div className="asap-left"><div className="asap-name h-hand">{item.label}</div></div>
              {picked?.refId === item.refId && !catDecide && <span className="mono" style={{ color: 'var(--mustard)' }}>✓</span>}
            </button>
          ))}
          <button className={`asap-item ${catDecide ? 'gift-item-selected' : ''}`}
            onClick={() => { setCatDecide(true); setPicked(null); }}>
            <div className="asap-left">
              <div className="asap-name h-hand">🎲 let the cat decide</div>
              <div className="asap-notes mono">random pick from this tier</div>
            </div>
            {catDecide && <span className="mono" style={{ color: 'var(--mustard)' }}>✓</span>}
          </button>
        </div>
        <div className="sheet-foot">
          <button className="btn-primary" disabled={!picked && !catDecide} onClick={claim}>claim my gift →</button>
          <button className="edit-btn" style={{ width: '100%', marginTop: 6 }} onClick={onDismiss}>maybe later</button>
        </div>
      </div>
    </div>
  );
}

// === Main customer view ===
function CustomerPocket({ state, setState, profile, setProfile, openProfile }) {
  const [cart, setCart] = useStored('ctrls_cart_v2', {});
  const [selectedDate, setSelectedDate] = _usC(() => {
    const todayIso = CTRLS.isoToday();
    if (CTRLS.canOrderDate(state, todayIso)) return todayIso;
    for (let i = 1; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = isoFromDate(d);
      if (CTRLS.canOrderDate(state, iso)) return iso;
    }
    return todayIso;
  });
  const [showCart, setShowCart] = _usC(false);
  const [checkout, setCheckout] = _usC(null);
  const [subSheet, setSubSheet] = _usC(null);
  const [showGiftSheet, setShowGiftSheet] = _usC(false);
  const [giftDismissed, setGiftDismissed] = _usC(false);

  const dayItems = cart[selectedDate] || [];
  const cartCount = Object.values(cart).reduce((s, arr) => s + arr.length, 0);
  const cartTotal = Object.values(cart).flat().reduce((s, it) => s + CTRLS.priceForItem(state, it), 0);
  const shopClosed = !CTRLS.isOpen(state, selectedDate);
  const orderClosed = !shopClosed && !CTRLS.canOrderDate(state, selectedDate);
  const isClosed = shopClosed || orderClosed;

  // Pending gift for this user
  const pendingGift = _umC(() =>
    (state.gifts || []).find((g) => g.toProfileId === profile.id && !g.claimed),
    [state.gifts, profile.id]
  );

  // Known teammates (for gift button visibility)
  const hasTeammates = _umC(() => {
    const ids = new Set();
    Object.values(state.profiles || {}).forEach((p) => {
      const id = p.id || p.code;
      const meta = (state.peopleMeta || {})[id] || {};
      if (id && id !== profile.id && !meta.hiddenFromGift && !meta.deleted) ids.add(id);
    });
    (state.orders || []).forEach((o) => {
      const meta = (state.peopleMeta || {})[o.profileId] || {};
      if (o.profileId && o.profileId !== profile.id && !meta.hiddenFromGift && !meta.deleted) ids.add(o.profileId);
    });
    return ids.size > 0;
  }, [state.profiles, state.orders, state.peopleMeta, profile.id]);

  // Auto-generate subscription orders on mount
  _ueC(() => {
    const mySubs = (state.subscriptions || []).filter((s) => s.profileId === profile.id && s.active);
    if (!mySubs.length) return;
    const newOrders = [];
    for (const sub of mySubs) {
      for (let i = 0; i <= 13; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        const iso = isoFromDate(d);
        if (!CTRLS.canOrderDate(state, iso)) continue;
        const dow = d.getDay();
        if (!sub.days.includes(dow)) continue;
        const orderId = `sub_${sub.id}_${iso}`;
        if (state.orders.some((o) => o.id === orderId)) continue;
        const tpl = sub.itemTemplate[dow];
        if (!tpl) continue;
        const candidates = CTRLS.subscriptionCandidatesForTemplate(state, tpl);
        if (!candidates.length) continue;
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        const items = [{ ...picked, qty: picked.qty || 1 }];
        newOrders.push({
          id: orderId,
          name: profile.name,
          profileId: profile.id,
          avatar: profile.avatar,
          rankKey: CTRLS.rankFor(profile.cupCount).key,
          date: iso,
          items,
          status: 'queued',
          paid: 'confirmed',
          source: 'subscription',
          subId: sub.id,
          outOfTeam: !!profile.outOfTeam,
          lineId: profile.lineId || '',
          ts: Date.now() + i,
        });
      }
    }
    if (newOrders.length > 0) {
      setState((s) => ({ ...s, orders: [...s.orders, ...newOrders] }));
      setProfile((p) => ({ ...p, cupCount: p.cupCount + newOrders.length }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function addItem(type, refId) {
    if (isClosed) return;
    setCart((c) => ({ ...c, [selectedDate]: [...(c[selectedDate] || []), { type, refId, qty: 1 }] }));
  }
  function removeItem(dateIso, idx) {
    setCart((c) => {
      const arr = [...(c[dateIso] || [])];
      arr.splice(idx, 1);
      const next = { ...c };
      if (arr.length === 0) delete next[dateIso]; else next[dateIso] = arr;
      return next;
    });
  }
  function placeOrder(total) {
    const rankKey = CTRLS.rankFor(profile.cupCount).key;
    const newOrders = Object.entries(cart).map(([date, items]) => ({
      id: 'o' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: profile.name,
      profileId: profile.id,
      avatar: profile.avatar,
      rankKey,
      date,
      items,
      status: 'queued',
      paid: 'confirmed',
      outOfTeam: !!profile.outOfTeam,
      lineId: profile.lineId || '',
      ts: Date.now(),
    }));
    const cupsAdded = newOrders.reduce((s, o) => s + o.items.length, 0);
    setState((s) => ({ ...s, orders: [...s.orders, ...newOrders] }));
    setProfile((p) => ({
      ...p,
      cupCount: p.cupCount + cupsAdded,
      orderIds: [...(p.orderIds || []), ...newOrders.map((o) => o.id)],
      stats: { ...p.stats, firstOrderDate: p.stats?.firstOrderDate || CTRLS.isoToday() },
    }));
    setCart({});
    const orderIds = newOrders.map((o) => o.id);
    const nextState = { ...state, orders: [...state.orders, ...newOrders] };
    if (!CTRLS.remoteEnabled()) {
      setCheckout({ step: 'done', total, sync: 'offline', orderIds });
    } else {
      setCheckout({ step: 'done', total, sync: 'sending', orderIds });
      CTRLS.confirmOrders(nextState, orderIds)
        .then((r) => setCheckout((c) => (c && c.step === 'done') ? { ...c, sync: r.ok ? 'sent' : 'failed' } : c))
        .catch(() => setCheckout((c) => (c && c.step === 'done') ? { ...c, sync: 'failed' } : c));
    }
  }

  function retryOrderSync(orderIds) {
    if (!orderIds || !CTRLS.remoteEnabled()) { setCheckout((c) => (c && c.step === 'done') ? { ...c, sync: 'offline' } : c); return; }
    setCheckout((c) => (c && c.step === 'done') ? { ...c, sync: 'sending' } : c);
    CTRLS.confirmOrders(state, orderIds)
      .then((r) => setCheckout((c) => (c && c.step === 'done') ? { ...c, sync: r.ok ? 'sent' : 'failed' } : c))
      .catch(() => setCheckout((c) => (c && c.step === 'done') ? { ...c, sync: 'failed' } : c));
  }

  function sendGift(gift) {
    setState((s) => ({ ...s, gifts: [...(s.gifts || []), gift] }));
  }
  function claimGift(gift, item, date) {
    const orderId = 'go_' + gift.id;
    const newOrder = {
      id: orderId,
      name: profile.name,
      profileId: profile.id,
      avatar: profile.avatar,
      rankKey: CTRLS.rankFor(profile.cupCount).key,
      date,
      items: [item],
      status: 'queued',
      paid: 'confirmed',
      source: 'gift',
      giftId: gift.id,
      gifterName: gift.anonymous ? null : gift.fromName,
      ts: Date.now(),
    };
    setState((s) => ({
      ...s,
      orders: [...s.orders, newOrder],
      gifts: (s.gifts || []).map((g) => g.id === gift.id ? { ...g, claimed: true, claimedOrderId: orderId } : g),
    }));
    setProfile((p) => ({ ...p, cupCount: p.cupCount + 1 }));
    setGiftDismissed(true);
  }

  return (
    <div className="customer-scroll no-scrollbar order-compact">
      {/* compact header — profile + subscription chip share one row */}
      <div className="order-header">
        <button className="order-profile-btn" onClick={openProfile} title="profile">
          <CatAvatar avatar={profile.avatar} size={38} />
          <span className="order-profile-meta">
            <span className="h-hand order-profile-name">{profile.name}</span>
            <span className="mono order-profile-rank">{CTRLS.rankFor(profile.cupCount).label}</span>
          </span>
        </button>
        <SubscriptionStrip
          compact
          state={state}
          profile={profile}
          onOpen={() => setSubSheet('list')}
          onCreate={() => setSubSheet('new')}
        />
      </div>

      <TodayNoteCard state={state} />
      <DayPicker state={state} selectedDate={selectedDate} setSelectedDate={setSelectedDate} cart={cart} profile={profile} />

      {/* one-screen order grid: café on one half, menu on the other
          (stacked top/bottom on phones, side-by-side left/right on wide screens) */}
      <div className="order-grid">
        <div className="order-aside">
          <CafeLounge state={state} selectedDate={selectedDate} profile={profile} />
        </div>
        <div className="order-menu">
          {isClosed && (
            <div className="closed-banner">
              <span className="h-hand">{shopClosed ? "shop's napping today 😴" : 'orders closed for this day'}</span>
              <span className="mono dim">{shopClosed ? (() => { const d = new Date(selectedDate + 'T00:00:00'); return CTRLS.DOW_EN[d.getDay()].toLowerCase(); })() : 'cutoff · 23:59 day before'}</span>
            </div>
          )}
          <MenuList state={state} isClosed={isClosed} onAdd={addItem} />
        </div>
      </div>

      <MissedBeans state={state} setState={setState} profile={profile} />

      {hasTeammates && (
        <div className="section" style={{ paddingTop: 0 }}>
          <button className="gift-entry-card" onClick={() => setShowGiftSheet(true)}>
            <span style={{ fontSize: 28 }}>🎁</span>
            <div style={{ flex: 1 }}>
              <div className="h-hand" style={{ fontSize: 16 }}>gift a cup</div>
              <div className="mono dim" style={{ fontSize: 11 }}>฿40 or ฿60 · they pick the drink</div>
            </div>
            <span className="mono dim">→</span>
          </button>
        </div>
      )}

      <DayItemsList state={state} selectedDate={selectedDate} dayItems={dayItems} onRemove={removeItem} profile={profile} />
      <OrderInfoCard state={state} selectedDate={selectedDate} />
      <div className="footnote mono">
        <PawPrint size={10} color="var(--brown-light)" />
        ctrl+s coffee · {profile.name} · {CTRLS.rankFor(profile.cupCount).label}
      </div>

      {cartCount > 0 && (
        <button className="order-bar" onClick={() => setShowCart(true)}>
          <Mug size={22} color="var(--cream)" fill="var(--terracotta)" />
          <span className="h-doodle order-bar-cups" style={{ fontSize: 22 }}>{cartCount} cup{cartCount > 1 ? 's' : ''}</span>
          <span className="order-bar-total mono">฿{formatBaht(cartTotal)}</span>
          <span className="order-bar-cta h-hand">confirm →</span>
        </button>
      )}

      {showCart && (
        <CartSheet
          state={state}
          profile={profile}
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={removeItem}
          onConfirm={(total) => { setShowCart(false); placeOrder(total); }}
        />
      )}
      {checkout?.step === 'done' && (
        <DoneSheet onClose={() => setCheckout(null)} name={profile.name} profile={profile} />
      )}
      {checkout?.step === 'done' && checkout.sync && (
        <div className={'order-sync order-sync-' + checkout.sync}>
          {checkout.sync === 'sending' && <span>⏳ กำลังส่งออเดอร์ไปที่ร้าน…</span>}
          {checkout.sync === 'sent' && <span>✅ ร้านได้รับออเดอร์เรียบร้อยแล้ว</span>}
          {checkout.sync === 'failed' && <span>❌ ส่งไม่สำเร็จ ออเดอร์ยังไม่ถึงร้าน <button className="order-sync-retry" onClick={() => retryOrderSync(checkout.orderIds)}>ลองใหม่</button></span>}
          {checkout.sync === 'offline' && <span>⚠️ ออฟไลน์ ออเดอร์ยังไม่ถึงร้าน <button className="order-sync-retry" onClick={() => retryOrderSync(checkout.orderIds)}>ลองใหม่</button></span>}
        </div>
      )}

      {showGiftSheet && (
        <GiftSheet state={state} profile={profile} onClose={() => setShowGiftSheet(false)} onSend={sendGift} />
      )}

      {pendingGift && !giftDismissed && (
        <GiftNotificationSheet
          gift={pendingGift}
          state={state}
          profile={profile}
          onClaim={claimGift}
          onDismiss={() => setGiftDismissed(true)}
        />
      )}

      {subSheet === 'new' && (
        <SubEditSheet sub={null} state={state} setState={setState} profile={profile} onClose={() => setSubSheet(null)} />
      )}
      {subSheet === 'list' && (
        <SubListSheet state={state} setState={setState} profile={profile} onClose={() => setSubSheet(null)} />
      )}
    </div>
  );
}

Object.assign(window, {
  IdentityGate, CustomerPocket, WelcomeStrip, SubscriptionStrip,
});
