// CTRL+S Pocket — profile sheet: history, edit-order, avatar, share, subscription, settings.

const { useState: _usP, useEffect: _ueP, useMemo: _umP, useRef: _urP } = React;

// === Profile sheet (root) ===
function ProfileSheet({ state, setState, profile, setProfile, onClose, onLogout }) {
  const [tab, setTab] = _usP('history');
  const [editingOrder, setEditingOrder] = _usP(null);
  const [editingSub, setEditingSub] = _usP(null);

  const rank = CTRLS.rankFor(profile.cupCount);
  const next = CTRLS.nextRank(profile.cupCount);
  const progress = next ? (profile.cupCount - rank.min) / (next.min - rank.min) : 1;
  const mySubs = (state.subscriptions || []).filter((s) => s.profileId === profile.id);
  const myOrders = (state.orders || [])
    .filter((o) => CTRLS.isConfirmedOrder(o) && CTRLS.orderBelongsToProfile(o, profile))
    .sort((a, b) => b.ts - a.ts);
  const totalSpent = myOrders.reduce((s, o) => s + CTRLS.orderTotal(state, o), 0);

  function patch(p) { setProfile({ ...profile, ...p }); }
  function deleteOrder(id) {
    setState({ ...state, orders: state.orders.filter((x) => x.id !== id) });
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet profile" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="profile-head">
          <span className="h-doodle" style={{ fontSize: 26 }}>profile</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>

        {/* Identity card */}
        <div className="profile-card">
          <div className="name-row">
            <div className="avatar"><CatAvatar avatar={profile.avatar} size={56} /></div>
            <div className="name-block">
              <input className="name-edit" value={profile.name} onChange={(e) => patch({ name: e.target.value })} />
              <div className="rank-line">
                <span className="rank-pill">{rank.label}</span>
                <span className="rank-sub">{rank.sub}</span>
              </div>
            </div>
          </div>
          <div className="profile-bar"><div className="fill" style={{ width: Math.min(100, Math.max(4, progress * 100)) + '%' }} /></div>
          <div className="profile-bar-label">
            <span>{profile.cupCount} cups</span>
            <span>{next ? `${next.min - profile.cupCount} → ${next.label}` : 'max rank · saved ✓'}</span>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <div className="v">{profile.cupCount}</div>
            <div className="l">total cups</div>
          </div>
          <div className="profile-stat">
            <div className="v">฿{formatBaht(totalSpent)}</div>
            <div className="l">total spent</div>
          </div>
          <div className="profile-stat">
            <div className="v">{mySubs.filter((s) => s.active).length}</div>
            <div className="l">active subs</div>
          </div>
        </div>

        <div className="profile-tabs">
          {[
            { id: 'history', label: 'history' },
            { id: 'subs', label: 'subs' },
            { id: 'avatar', label: 'avatar' },
            { id: 'share', label: 'share' },
            { id: 'settings', label: '⚙' },
          ].map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="sheet-scroll no-scrollbar" style={{ paddingTop: 8 }}>
          {tab === 'history' && (
            <HistoryTab orders={myOrders} state={state} onEdit={setEditingOrder} onDelete={deleteOrder} />
          )}
          {tab === 'subs' && (
            <SubsTab subs={mySubs} state={state} setState={setState} profile={profile} onNew={() => setEditingSub('new')} onEdit={setEditingSub} />
          )}
          {tab === 'avatar' && (
            <AvatarTab profile={profile} setProfile={setProfile} />
          )}
          {tab === 'share' && (
            <ShareTab profile={profile} state={state} />
          )}
          {tab === 'settings' && (
            <SettingsTab state={state} profile={profile} setProfile={setProfile} onLogout={onLogout} />
          )}
        </div>

        {editingOrder && (
          <EditOrderSheet
            order={editingOrder}
            state={state}
            setState={setState}
            profile={profile}
            setProfile={setProfile}
            onClose={() => setEditingOrder(null)}
          />
        )}
        {editingSub && (
          <SubEditSheet
            sub={editingSub === 'new' ? null : editingSub}
            state={state}
            setState={setState}
            profile={profile}
            onClose={() => setEditingSub(null)}
          />
        )}
      </div>
    </div>
  );
}

function isOrderEditable(order) {
  return order.status === 'queued' && Date.now() < CTRLS.orderCutoffForDate(order.date).getTime();
}

// === History tab ===
function HistoryTab({ orders, state, onEdit, onDelete }) {
  if (orders.length === 0) {
    return (
      <div className="history-list">
        <div className="sub-empty">
          <div className="h-doodle">no orders yet</div>
          <div className="h-hand">your future cups will live here</div>
        </div>
      </div>
    );
  }
  return (
    <div className="history-list">
      {orders.map((o) => {
        const sd = shortDate(o.date);
        const editable = isOrderEditable(o);
        return (
          <div key={o.id} className="history-card">
            <div className="history-row1">
              <span className="d">{sd.dow} {sd.day} {sd.mon}</span>
              <span className="t">{new Date(o.ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="history-items">
              {o.items.map((it) => CTRLS.itemLabel(state, it)).join(' · ')}
            </div>
            <div className="history-row3">
              <span className={`badge ${o.status}`}>{o.status}</span>
              <span className="dim">✓ confirmed</span>
              <span className="price">฿{formatBaht(CTRLS.orderTotal(state, o))}</span>
            </div>
            {editable && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button className="edit-btn" style={{ flex: 1 }} onClick={() => onEdit(o)}>✎ swap drink</button>
                <button className="edit-btn" style={{ color: 'var(--terracotta)', flexShrink: 0 }} onClick={() => { if (confirm('Cancel this order?')) onDelete(o.id); }}>cancel</button>
              </div>
            )}
            {o.source === 'gift' && (
              <div className="mono dim" style={{ fontSize: 10, marginTop: 4 }}>
                🎁 gifted{o.gifterName ? ` by ${o.gifterName}` : ' anonymously'}
              </div>
            )}
            {o.source === 'subscription' && (
              <div className="mono dim" style={{ fontSize: 10, marginTop: 4 }}>📌 subscription</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// === Edit-order sheet ===
function EditOrderSheet({ order, state, setState, profile, setProfile, onClose }) {
  const [items, setItems] = _usP(order.items);
  const [picking, setPicking] = _usP(null);

  const origTotal = order.items.reduce((s, it) => s + CTRLS.priceForItem(state, it), 0);
  const newTotal = items.reduce((s, it) => s + CTRLS.priceForItem(state, it), 0);
  const diff = newTotal - origTotal;

  function swapAt(idx, newRef) {
    if (newRef === null) {
      setItems((arr) => arr.filter((_, i) => i !== idx));
    } else {
      setItems((arr) => arr.map((it, i) => i === idx ? newRef : it));
    }
    setPicking(null);
  }
  function save() {
    if (items.length === 0) {
      setState({ ...state, orders: state.orders.filter((o) => o.id !== order.id) });
      onClose();
      return;
    }
    setState({ ...state, orders: state.orders.map((o) => o.id === order.id ? { ...o, items, ts: o.ts } : o) });
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 26 }}>edit order</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          <div className="mono dim" style={{ marginBottom: 8 }}>
            {shortDate(order.date).dow} {shortDate(order.date).day} {shortDate(order.date).mon}
          </div>
          {items.length === 0 && <div className="empty mono">all items removed · saving will cancel & refund</div>}
          {items.map((it, i) => (
            <div key={i} className="edit-line">
              <Mug size={18} color="var(--charcoal)" fill={COLOR_TO_SOFT[CTRLS.itemColor(state, it)]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-hand" style={{ fontSize: 16, lineHeight: 1.1 }}>{CTRLS.itemLabel(state, it)}</div>
                <div className="mono dim" style={{ fontSize: 10 }}>฿{CTRLS.priceForItem(state, it)}</div>
              </div>
              <button className="edit-swap" onClick={() => setPicking(i)}>swap</button>
              <button className="x" onClick={() => swapAt(i, null)}>×</button>
            </div>
          ))}
          <button className="edit-btn" style={{ width: '100%', marginTop: 4 }} onClick={() => setPicking('add')}>+ add another cup</button>

          {picking !== null && (
            <PickItemSheet
              state={state}
              onPick={(item) => {
                if (picking === 'add') setItems((arr) => [...arr, item]);
                else swapAt(picking, item);
              }}
              onClose={() => setPicking(null)}
            />
          )}

          <div className="edit-diff-box">
            <div className="row"><span className="mono dim">original</span><span className="mono">฿{formatBaht(origTotal)}</span></div>
            <div className="row"><span className="mono dim">new</span><span className="mono">฿{formatBaht(newTotal)}</span></div>
            <div className="row diff">
              <span className="h-hand">{diff === 0 ? 'no change' : diff > 0 ? 'pay ฿' + formatBaht(diff) + ' more to barista' : '฿' + formatBaht(Math.abs(diff)) + ' cheaper'}</span>
              <span className={`v ${diff > 0 ? 'pos' : diff < 0 ? 'neg' : ''}`}>{diff === 0 ? '–' : (diff > 0 ? '+' : '−') + '฿' + formatBaht(Math.abs(diff))}</span>
            </div>
          </div>
        </div>
        <div className="sheet-foot">
          <button className="btn-primary" onClick={save}>save changes →</button>
        </div>
      </div>
    </div>
  );
}

function PickItemSheet({ state, onPick, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '70vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 24 }}>pick a cup</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          <div className="mono dim" style={{ marginBottom: 6 }}>signature</div>
          {(state.signatureMenu || CTRLS.DEFAULT_SIGNATURE_MENU).filter((m) => CTRLS.isAvailable(m)).map((m) => (
            <button key={m.id} className="asap-item" onClick={() => { onPick({ type: 'menu', refId: m.id, qty: 1 }); onClose(); }}>
              <div className="asap-left">
                <div className="asap-name h-hand">{m.name}</div>
                <div className="asap-notes">{m.tag}</div>
                <div className="asap-meta mono"><span className={`roast-pill ${CTRLS.itemRoast(m)}`}>{CTRLS.itemRoast(m)}</span></div>
              </div>
              <div className="asap-price h-doodle">฿{m.price}</div>
            </button>
          ))}
          <div className="mono dim" style={{ margin: '12px 0 6px' }}>asap menu</div>
          {[...state.asap].filter((a) => CTRLS.isAvailable(a)).sort((a, b) => CTRLS.ROAST_ORDER[CTRLS.itemRoast(a)] - CTRLS.ROAST_ORDER[CTRLS.itemRoast(b)]).map((a) => (
            <button key={a.id} className="asap-item" onClick={() => { onPick({ type: 'asap', refId: a.id, qty: 1 }); onClose(); }}>
              <div className="asap-left">
                <div className="asap-name h-hand">{a.name}</div>
                <div className="asap-meta mono"><span className={`roast-pill ${CTRLS.itemRoast(a)}`}>{CTRLS.itemRoast(a)}</span></div>
              </div>
              <div className="asap-price h-doodle">฿{a.price}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Subscriptions tab ===
function SubsTab({ subs, state, setState, profile, onNew, onEdit }) {
  function toggleActive(id) {
    setState({
      ...state,
      subscriptions: state.subscriptions.map((s) => s.id === id ? { ...s, active: !s.active } : s),
    });
  }
  function remove(id) {
    setState({ ...state, subscriptions: state.subscriptions.filter((s) => s.id !== id) });
  }
  if (subs.length === 0) {
    return (
      <div className="sub-stack">
        <div className="sub-empty">
          <div className="h-doodle">no subscription yet</div>
          <div className="h-hand">set a weekly template · pay monthly · cancel anytime.</div>
          <button className="btn-primary" onClick={onNew}>+ create one</button>
        </div>
        <div className="mono dim" style={{ fontSize: 10, padding: '0 4px', lineHeight: 1.5 }}>
          how it works · pick the days you want a cup · pick a default drink for each day (or let the cat decide) · ongoing until you cancel · billed monthly from the start date · edit / skip / swap any single day from history.
        </div>
      </div>
    );
  }
  return (
    <div className="sub-stack">
      {subs.map((s) => (
        <SubCard key={s.id} sub={s} state={state} onEdit={() => onEdit(s)} onToggle={() => toggleActive(s.id)} onDelete={() => { if (confirm('Cancel subscription? It will stop generating orders after today.')) remove(s.id); }} />
      ))}
      <button className="btn-primary" onClick={onNew}>+ another subscription</button>
    </div>
  );
}

function SubCard({ sub, state, onEdit, onToggle, onDelete }) {
  const dowShort = ['S','M','T','W','T','F','S'];
  const preview = CTRLS.previewMonthlyForSub(state, sub);
  const startSD = sub.startDate ? shortDate(sub.startDate) : null;
  const nextBillSD = sub.nextBillDate ? shortDate(sub.nextBillDate) : null;
  const hasSkippedItems = sub.days.some((dow) => sub.itemTemplate[dow] && !CTRLS.subscriptionTemplateAvailable(state, sub.itemTemplate[dow]));
  return (
    <div className={`sub-card ${sub.active ? 'active' : 'paused'}`}>
      <div className="sub-head">
        <div>
          <div className="sub-title">📌 {sub.name || 'my weekly'}</div>
          <div className="mono dim">{sub.active ? '· active' : '· paused'} {startSD ? `· since ${startSD.mon} ${startSD.day}` : ''}</div>
        </div>
        <button className="edit-swap" onClick={onToggle}>{sub.active ? 'pause' : 'resume'}</button>
      </div>
      <div className="sub-week">
        {[0,1,2,3,4,5,6].map((dow) => {
          const has = sub.days.includes(dow);
          const tpl = sub.itemTemplate[dow];
          let label = '—';
          if (has && tpl) {
            if (tpl.type === 'random') label = '🎲 ' + tpl.roast;
            else label = CTRLS.itemLabel(state, tpl);
          }
          const unavailable = has && tpl && !CTRLS.subscriptionTemplateAvailable(state, tpl);
          return (
            <div key={dow} className={`sub-day ${has ? 'has' : ''} ${unavailable ? 'unavailable' : ''}`}>
              <div className="dl">{dowShort[dow]}</div>
              <div className="it">{label}</div>
            </div>
          );
        })}
      </div>
      <div className="sub-billing">
        <div className="row">
          <span className="h-hand">monthly</span>
          <span className="h-doodle" style={{ fontSize: 22 }}>฿{formatBaht(preview.total)}</span>
        </div>
        <div className="row sub mono dim" style={{ fontSize: 10 }}>
          <span>{preview.cups} cups/mo</span>
          <span>{nextBillSD ? `next bill · ${nextBillSD.mon} ${nextBillSD.day}` : ''}</span>
        </div>
        {hasSkippedItems && (
          <div className="sub-alert mono">some days are paused because the menu is sold out</div>
        )}
      </div>
      <div className="sub-actions">
        <button onClick={onDelete}>cancel</button>
        <button className="primary" onClick={onEdit}>edit ✎</button>
      </div>
    </div>
  );
}

// === Subscription editor (used from profile + main page) ===
function SubEditSheet({ sub, state, setState, profile, onClose }) {
  const isNew = !sub;
  const [name, setName] = _usP(sub?.name || 'my weekly');
  const [days, setDays] = _usP(sub?.days || [1, 3, 5]);
  const [tpl, setTpl] = _usP(sub?.itemTemplate || {});
  const [picking, setPicking] = _usP(null);

  function setDow(dow, on) {
    setDays((cur) => {
      const next = on ? [...new Set([...cur, dow])] : cur.filter((d) => d !== dow);
      return next.sort();
    });
  }
  function save() {
    const startDate = sub?.startDate || CTRLS.isoToday();
    const newSub = {
      id: sub?.id || ('s' + Date.now().toString(36)),
      profileId: profile.id,
      name,
      days,
      itemTemplate: tpl,
      active: sub?.active ?? true,
      startDate,
      nextBillDate: sub?.nextBillDate || CTRLS.addMonths(startDate, 1),
      billingHistory: sub?.billingHistory || [],
    };
    const subs = state.subscriptions || [];
    if (isNew) setState({ ...state, subscriptions: [...subs, newSub] });
    else setState({ ...state, subscriptions: subs.map((s) => s.id === sub.id ? newSub : s) });
    onClose();
  }

  // Preview the monthly cost as user changes things
  const preview = _umP(() => {
    const fakeSub = { days, itemTemplate: tpl };
    return CTRLS.previewMonthlyForSub(state, fakeSub);
  }, [state, days, tpl]);

  const dowLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <div className="sheet-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 26 }}>{isNew ? 'new subscription' : 'edit subscription'}</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sub-edit">
          <input className="name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="name this subscription" />

          <div>
            <label className="field-label">days of week</label>
            <div className="dow-row" style={{ marginTop: 6 }}>
              {dowLabels.map((l, dow) => (
                <button
                  key={dow}
                  className={`dow-toggle ${days.includes(dow) ? 'on' : 'off'}`}
                  onClick={() => setDow(dow, !days.includes(dow))}
                >
                  {l.slice(0,3).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">what to brew each day</label>
            <div style={{ marginTop: 8 }}>
              {days.length === 0 && <div className="empty mono">pick some days first</div>}
              {days.map((dow) => {
                const cur = tpl[dow];
                let label = 'choose ›';
                if (cur) {
                  if (cur.type === 'random') label = "🎲 cat's pick · " + cur.roast;
                  else label = CTRLS.itemLabel(state, cur);
                }
                const unavailable = cur && !CTRLS.subscriptionTemplateAvailable(state, cur);
                return (
                  <div key={dow} className={`day-template ${unavailable ? 'unavailable' : ''}`}>
                    <span className="dt-label">{dowLabels[dow].slice(0,3).toLowerCase()}</span>
                    <span className="dt-name">{label}{unavailable ? ' · sold out' : ''}</span>
                    <button className="pick-btn" onClick={() => setPicking(dow)}>pick</button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="edit-diff-box" style={{ marginTop: 4 }}>
            <div className="row"><span className="mono dim">est. monthly</span><span className="h-doodle">฿{formatBaht(preview.total)}</span></div>
            <div className="row mono dim" style={{ fontSize: 10 }}><span>{preview.cups} cups / mo</span><span>billed every {CTRLS.addMonths(CTRLS.isoToday(), 0) ? '1 month' : ''} from start</span></div>
          </div>

          <div className="footnote mono" style={{ padding: 0, justifyContent: 'flex-start' }}>
            ongoing until cancelled · sold-out items are skipped automatically · edit/skip individual days anytime.
          </div>
        </div>
        <div className="sheet-foot">
          <button className="btn-primary" disabled={days.length === 0} onClick={save}>{isNew ? 'start brewing →' : 'save →'}</button>
        </div>

        {picking !== null && (
          <SubItemPicker
            state={state}
            onPick={(item) => { setTpl((t) => ({ ...t, [picking]: item })); setPicking(null); }}
            onClose={() => setPicking(null)}
          />
        )}
      </div>
    </div>
  );
}

function SubItemPicker({ state, onPick, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '75vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 24 }}>pick for this day</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          <div className="mono dim" style={{ marginBottom: 6 }}>let the cat decide 🎲</div>
          {CTRLS.ROAST_OPTIONS.map((r) => {
            const hasCandidates = CTRLS.subscriptionCandidatesForTemplate(state, { type: 'random', roast: r }).length > 0;
            return (
              <button key={r} disabled={!hasCandidates} className="asap-item" onClick={() => onPick({ type: 'random', roast: r, qty: 1 })}>
                <div className="asap-left">
                  <div className="asap-name h-hand">surprise · {r}</div>
                  <div className="asap-notes">{hasCandidates ? `cat picks any asap item in ${r}` : 'no available asap items'}</div>
                </div>
                <div className="asap-price h-doodle">🎲</div>
              </button>
            );
          })}
          <div className="mono dim" style={{ margin: '12px 0 6px' }}>signature</div>
          {(state.signatureMenu || CTRLS.DEFAULT_SIGNATURE_MENU).filter((m) => CTRLS.isAvailable(m)).map((m) => (
            <button key={m.id} className="asap-item" onClick={() => onPick({ type: 'menu', refId: m.id, qty: 1 })}>
              <div className="asap-left">
                <div className="asap-name h-hand">{m.name}</div>
                <div className="asap-notes">{m.tag}</div>
                <div className="asap-meta mono"><span className={`roast-pill ${CTRLS.itemRoast(m)}`}>{CTRLS.itemRoast(m)}</span></div>
              </div>
              <div className="asap-price h-doodle">฿{m.price}</div>
            </button>
          ))}
          <div className="mono dim" style={{ margin: '12px 0 6px' }}>asap menu</div>
          {[...state.asap].filter((a) => CTRLS.isAvailable(a)).sort((a, b) => CTRLS.ROAST_ORDER[CTRLS.itemRoast(a)] - CTRLS.ROAST_ORDER[CTRLS.itemRoast(b)]).map((a) => (
            <button key={a.id} className="asap-item" onClick={() => onPick({ type: 'asap', refId: a.id, qty: 1 })}>
              <div className="asap-left">
                <div className="asap-name h-hand">{a.name}</div>
                <div className="asap-meta mono"><span className={`roast-pill ${CTRLS.itemRoast(a)}`}>{CTRLS.itemRoast(a)}</span></div>
              </div>
              <div className="asap-price h-doodle">฿{a.price}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Sub list sheet (when tapped from main page strip) ===
function SubListSheet({ state, setState, profile, onClose }) {
  const [editing, setEditing] = _usP(null);
  const subs = (state.subscriptions || []).filter((s) => s.profileId === profile.id);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 26 }}>subscriptions</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          <SubsTab subs={subs} state={state} setState={setState} profile={profile} onNew={() => setEditing('new')} onEdit={setEditing} />
        </div>
        {editing && (
          <SubEditSheet sub={editing === 'new' ? null : editing} state={state} setState={setState} profile={profile} onClose={() => setEditing(null)} />
        )}
      </div>
    </div>
  );
}

// === Avatar customization ===
function RankGate({ unlockedAt, onPreview, children }) {
  const rank = CTRLS.RANKS.find((r) => r.key === unlockedAt);
  return (
    <div className="rank-locked" onClick={onPreview} title={`preview · unlock at ${rank?.label}`} style={{ cursor: 'pointer' }}>
      <div className="rank-locked-inner">{children}</div>
      <div className="rank-locked-overlay">
        <span className="rank-locked-label mono">{rank?.label}</span>
      </div>
    </div>
  );
}

function AvatarTab({ profile, setProfile }) {
  const a = CTRLS.normalizeAvatar(profile.avatar);
  const unlocks = CTRLS.unlocksForProfile(profile.cupCount);
  const rank = CTRLS.rankFor(profile.cupCount);
  const nextRank = CTRLS.nextRank(profile.cupCount);

  const [preview, setPreview] = _usP(null); // { category, item, unlockedAt }
  const timerRef = _urP(null);

  function startPreview(category, item, unlockedAt) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPreview({ category, item, unlockedAt });
    timerRef.current = setTimeout(() => setPreview(null), 6000);
  }
  function clearPreview() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPreview(null);
  }

  function patch(p) {
    clearPreview();
    setProfile({ ...profile, avatar: { ...a, ...p } });
  }

  function randomize() {
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    patch({
      body: rnd(unlocks.body),
      pattern: rnd(unlocks.pattern),
      accent: rnd(unlocks.accent),
      eyeColor: rnd(unlocks.eyeColor),
      expression: rnd(unlocks.expression),
      hat: rnd(unlocks.hat),
      face: rnd(unlocks.face),
      neck: rnd(unlocks.neck),
      hand: rnd(unlocks.hand),
      aura: rnd(unlocks.aura),
    });
  }

  // Find which rank first unlocks a given item
  function unlockedAtRank(category, item) {
    for (const key of CTRLS.RANK_ORDER) {
      if ((CTRLS.RANK_UNLOCKS[key][category] || []).includes(item)) return key;
    }
    return 'newfile';
  }

  // Preview avatar: overlay the previewed item on real avatar
  const displayAvatar = preview ? { ...a, [preview.category]: preview.item } : a;
  const previewRank = preview ? CTRLS.RANKS.find((r) => r.key === preview.unlockedAt) : null;

  const bodyFill = BODY_COLORS.find((c) => c.id === a.body)?.fill || '#F6F1E8';
  const accentFill = ACCENT_COLORS.find((c) => c.id === a.accent)?.fill || '#D5A23B';
  const eyeFill = EYE_COLORS.find((c) => c.id === a.eyeColor)?.fill;

  return (
    <div className="avatar-tab">
      <div className="avatar-preview">
        <div className="avatar-preview-inner">
          <div className="rank-avatar-wrap" style={{ position: 'relative', flexShrink: 0 }}>
            <CatAvatar avatar={displayAvatar} size={52} />
            {rank.badge === 'ring' && <div className="rank-ring" />}
            {rank.badge === 'crown' && <div className="rank-crown">✦</div>}
            {preview && (
              <div className="avatar-preview-locked-overlay" onClick={clearPreview}>🔒</div>
            )}
          </div>
          <div className="avatar-preview-meta">
            {preview ? (
              <div className="avatar-preview-badge mono" onClick={clearPreview}>
                🔒 locked · {previewRank?.label}<br/>
                <span style={{ fontSize: 9, opacity: 0.7 }}>tap to dismiss · auto-clears in 6s</span>
              </div>
            ) : (
              <>
                <div className="mono" style={{ fontSize: 11 }}>{rank.label} · {profile.cupCount} cups</div>
                {nextRank && <div className="mono dim" style={{ fontSize: 9 }}>{nextRank.min - profile.cupCount} to {nextRank.label}</div>}
              </>
            )}
            <button className="btn-mini" style={{ marginTop: 6 }} onClick={randomize}>🎲 shuffle</button>
          </div>
        </div>
      </div>

      <div className="avatar-section">
        <label className="field-label">expression</label>
        <div className="avatar-grid">
          {EXPRESSIONS.map((exp) => {
            const locked = !unlocks.expression.includes(exp);
            const tier = locked ? unlockedAtRank('expression', exp) : null;
            if (locked) return (
              <RankGate key={exp} unlockedAt={tier} onPreview={() => startPreview('expression', exp, tier)}>
                <CatBase size={48} fill="#EADFCB" stroke="#2B2B2B" expression={exp} accent="#D5A23B" prop="none" />
                <span className="lbl mono">{exp}</span>
              </RankGate>
            );
            return (
              <button key={exp} className={`avatar-cell ${a.expression === exp ? 'on' : ''}`} onClick={() => patch({ expression: exp })}>
                <CatBase size={48} fill={bodyFill} accent={accentFill} eyeColor={eyeFill} stroke="#2B2B2B" expression={exp} prop="none" />
                <span className="lbl mono">{exp}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="avatar-section">
        <label className="field-label">body color</label>
        <div className="avatar-swatch-row">
          {BODY_COLORS.map((c) => {
            const locked = !unlocks.body.includes(c.id);
            const tier = locked ? unlockedAtRank('body', c.id) : null;
            return (
              <button
                key={c.id}
                className={`swatch ${a.body === c.id ? 'on' : ''} ${locked ? 'swatch-locked' : ''}`}
                style={{ background: c.fill, position: 'relative' }}
                onClick={() => locked ? startPreview('body', c.id, tier) : patch({ body: c.id })}
                title={locked ? `preview · unlock at ${CTRLS.RANKS.find(r=>r.key===tier)?.label}` : c.id}
              >
                {locked && <span className="swatch-lock">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="avatar-section">
        <label className="field-label">coat pattern</label>
        <div className="avatar-grid">
          {PATTERNS.map((p) => {
            const locked = !unlocks.pattern.includes(p);
            const tier = locked ? unlockedAtRank('pattern', p) : null;
            if (locked) return (
              <RankGate key={p} unlockedAt={tier} onPreview={() => startPreview('pattern', p, tier)}>
                <CatBase size={48} fill="#EADFCB" stroke="#2B2B2B" expression="happy" accent="#D5A23B" pattern={p} />
                <span className="lbl mono">{p}</span>
              </RankGate>
            );
            return (
              <button key={p} className={`avatar-cell ${a.pattern === p ? 'on' : ''}`} onClick={() => patch({ pattern: p })}>
                <CatBase size={48} fill={bodyFill} accent={accentFill} eyeColor={eyeFill} stroke="#2B2B2B" expression="happy" pattern={p} />
                <span className="lbl mono">{p === 'solid' ? 'plain' : p}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="avatar-section">
        <label className="field-label">ear & blush</label>
        <div className="avatar-swatch-row">
          {ACCENT_COLORS.map((c) => {
            const locked = !unlocks.accent.includes(c.id);
            const tier = locked ? unlockedAtRank('accent', c.id) : null;
            return (
              <button
                key={c.id}
                className={`swatch ${a.accent === c.id ? 'on' : ''} ${locked ? 'swatch-locked' : ''}`}
                style={{ background: c.fill }}
                onClick={() => locked ? startPreview('accent', c.id, tier) : patch({ accent: c.id })}
                title={locked ? `preview · unlock at ${CTRLS.RANKS.find(r=>r.key===tier)?.label}` : c.id}
              >
                {locked && <span className="swatch-lock">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="avatar-section">
        <label className="field-label">eye color</label>
        <div className="avatar-swatch-row">
          {EYE_COLORS.map((c) => {
            const locked = !unlocks.eyeColor.includes(c.id);
            const tier = locked ? unlockedAtRank('eyeColor', c.id) : null;
            return (
              <button
                key={c.id}
                className={`swatch ${a.eyeColor === c.id ? 'on' : ''} ${locked ? 'swatch-locked' : ''}`}
                style={{ background: c.fill }}
                onClick={() => locked ? startPreview('eyeColor', c.id, tier) : patch({ eyeColor: c.id })}
                title={locked ? `preview · unlock at ${CTRLS.RANKS.find(r=>r.key===tier)?.label}` : c.id}
              >
                {locked && <span className="swatch-lock">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      {SLOTS.map((slot) => (
        <div className="avatar-section" key={slot.key}>
          <label className="field-label">{slot.label}</label>
          <div className="avatar-grid">
            {slot.items.map((item) => {
              const locked = item !== 'none' && !unlocks[slot.key].includes(item);
              const tier = locked ? unlockedAtRank(slot.key, item) : null;
              const previewProps = { [slot.key]: item };
              if (locked) return (
                <RankGate key={item} unlockedAt={tier} onPreview={() => startPreview(slot.key, item, tier)}>
                  <CatBase size={48} fill="#EADFCB" stroke="#2B2B2B" expression="happy" accent="#D5A23B" {...previewProps} />
                  <span className="lbl mono">{item}</span>
                </RankGate>
              );
              return (
                <button key={item} className={`avatar-cell ${(a[slot.key] || 'none') === item ? 'on' : ''}`} onClick={() => patch({ [slot.key]: item })}>
                  <CatBase size={48} fill={bodyFill} accent={accentFill} eyeColor={eyeFill} stroke="#2B2B2B" expression="happy" pattern={a.pattern} {...previewProps} />
                  <span className="lbl mono">{item === 'none' ? '∅' : item}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// === Share / brag card ===
function ShareTab({ profile, state }) {
  const [copied, setCopied] = _usP(false);
  const rank = CTRLS.rankFor(profile.cupCount);
  const myOrders = (state.orders || []).filter((o) => CTRLS.isConfirmedOrder(o) && CTRLS.orderBelongsToProfile(o, profile));

  // Drink counts
  const drinkCounts = {};
  myOrders.forEach((o) => o.items.forEach((it) => {
    const label = CTRLS.itemLabel(state, it);
    drinkCounts[label] = (drinkCounts[label] || 0) + 1;
  }));
  const sortedDrinks = Object.entries(drinkCounts).sort((a, b) => b[1] - a[1]);
  const fav = sortedDrinks[0];
  const uniqueDrinks = sortedDrinks.length;

  // Financials
  const totalSpent = myOrders.reduce((s, o) => s + CTRLS.orderTotal(state, o), 0);
  const avgPerCup = profile.cupCount > 0 ? Math.round(totalSpent / profile.cupCount) : 0;

  // Busiest day of week
  const dowCounts = [0,0,0,0,0,0,0];
  myOrders.forEach((o) => { dowCounts[new Date(o.date + 'T00:00:00').getDay()]++; });
  const busiestDowIdx = dowCounts.indexOf(Math.max(...dowCounts));
  const DOW_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Streak (consecutive open days with a paid order going backwards)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const iso = isoFromDate(d);
    if (!CTRLS.isOpen(state, iso)) continue;
    if (myOrders.some((o) => o.date === iso)) streak++;
    else if (streak > 0) break;
  }

  // Cups per week since first order
  const firstOrderDate = myOrders.length > 0
    ? myOrders.reduce((min, o) => o.date < min ? o.date : min, myOrders[0].date)
    : null;
  const weeksSince = firstOrderDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstOrderDate + 'T00:00:00')) / (7 * 86400000)))
    : 1;
  const cupsPerWeek = profile.cupCount > 0 ? (profile.cupCount / weeksSince).toFixed(1) : '0.0';

  // Joined label
  const joined = profile.joinedAt ? new Date(profile.joinedAt) : new Date();
  const member = joined.toLocaleString('en', { month: 'short', year: 'numeric' });

  async function copyStats() {
    const lines = [
      `☕ ${profile.name} @ CTRL+S COFFEE`,
      `rank · ${rank.label}`,
      `─────────────────────────`,
      `${profile.cupCount} cups brewed`,
      `฿${formatBaht(totalSpent)} total spent · ฿${avgPerCup}/cup avg`,
      `${myOrders.length} orders placed`,
      `${streak} day streak`,
      `${cupsPerWeek} cups/week avg`,
      `fav drink · ${fav ? `${fav[0]} (${fav[1]}×)` : '—'}`,
      `busiest day · ${myOrders.length > 0 ? DOW_SHORT[busiestDowIdx] : '—'}`,
      `unique drinks tried · ${uniqueDrinks}`,
      `member since ${member}`,
    ];
    if (await copyText(lines.join('\n'))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="share-tab">
      <div className="share-card" id="share-card">
        <div className="share-card-top">
          <div className="share-mini-brand">
            <CursorArrow size={14} color="var(--charcoal)" />
            <span className="h-doodle" style={{ fontSize: 22, lineHeight: 1 }}>CTRL<span style={{ color: 'var(--mustard)' }}>+S</span></span>
          </div>
          <div className="mono dim" style={{ fontSize: 9, letterSpacing: '0.15em' }}>· COFFEE ·</div>
        </div>
        <div className="share-cat">
          <CatAvatar avatar={profile.avatar} size={100} />
        </div>
        <div className="share-name h-doodle">{profile.name}</div>
        <div className="share-rank">
          <span className="rank-pill" style={{ background: 'var(--charcoal)', color: 'var(--cream)' }}>{rank.label}</span>
          <span className="h-hand" style={{ color: 'var(--brown)' }}>{rank.sub}</span>
        </div>
        <div className="share-stats-grid">
          <div className="share-stat">
            <div className="v h-doodle">{profile.cupCount}</div>
            <div className="l mono">cups brewed</div>
          </div>
          <div className="share-stat">
            <div className="v h-doodle">฿{formatBaht(totalSpent)}</div>
            <div className="l mono">total spent</div>
          </div>
          <div className="share-stat">
            <div className="v h-doodle">{myOrders.length}</div>
            <div className="l mono">orders</div>
          </div>
        </div>
        <div className="share-stats-grid" style={{ marginTop: 6 }}>
          <div className="share-stat">
            <div className="v h-doodle">{streak}</div>
            <div className="l mono">day streak</div>
          </div>
          <div className="share-stat">
            <div className="v h-hand" style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.2 }}>{fav ? fav[0] : '—'}</div>
            <div className="l mono">fav drink</div>
          </div>
          <div className="share-stat">
            <div className="v h-doodle">{myOrders.length > 0 ? DOW_SHORT[busiestDowIdx].toLowerCase() : '—'}</div>
            <div className="l mono">busiest day</div>
          </div>
        </div>
        <div className="share-card-foot">
          <span className="mono dim" style={{ fontSize: 9 }}>since {member}</span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--terracotta)' }}>ctrl+s coffee · {profile.code}</span>
        </div>
        <div className="share-corner-tape" />
      </div>

      <div className="nerd-stats-block">
        <div className="nerd-stats-head mono">nerd stats</div>
        <div className="nerd-stat-row"><span className="nk mono">avg per cup</span><span className="nv h-hand">฿{avgPerCup}</span></div>
        <div className="nerd-stat-row"><span className="nk mono">cups/week avg</span><span className="nv h-hand">{cupsPerWeek}</span></div>
        <div className="nerd-stat-row"><span className="nk mono">unique drinks tried</span><span className="nv h-hand">{uniqueDrinks}</span></div>
        <div className="nerd-stat-row"><span className="nk mono">busiest day</span><span className="nv h-hand">{myOrders.length > 0 ? DOW_SHORT[busiestDowIdx] : '—'}</span></div>
        {sortedDrinks.slice(0, 3).map(([name, count], i) => (
          <div key={name} className="nerd-stat-row">
            <span className="nk mono">#{i+1} drink</span>
            <span className="nv h-hand">{name} <span className="mono dim">({count}×)</span></span>
          </div>
        ))}
        <div className="nerd-stat-row"><span className="nk mono">member since</span><span className="nv h-hand">{member}</span></div>
      </div>

      <button className={`copy-btn ${copied ? 'copied' : ''}`} style={{ margin: '0 0 8px' }} onClick={copyStats}>
        {copied ? '✓ copied' : '📋 copy stats'}
      </button>
      <div className="footnote mono" style={{ padding: '4px 0 12px' }}>
        long-press the card → screenshot · or copy stats to paste anywhere ☕
      </div>
    </div>
  );
}


// === Settings tab ===
function SettingsTab({ state, profile, setProfile, onLogout }) {
  const [showCode, setShowCode] = _usP(false);
  const [copied, setCopied] = _usP(false);
  async function copyCode() {
    if (await copyText(profile.code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }
  return (
    <div className="sub-stack">
      <div className="sub-card">
        <div className="sub-title h-doodle">transfer code</div>
        <div className="h-hand" style={{ fontSize: 14, color: 'var(--brown)', marginTop: 4 }}>
          switching devices? enter this code in the new device and your profile rolls over · keep it private-ish (it's a soft key)
        </div>
        <div className="code-display">
          {showCode ? (
            <span className="code-text mono">{profile.code}</span>
          ) : (
            <span className="code-text mono dim">{'CAT-' + '•'.repeat(profile.code.length - 4)}</span>
          )}
          <button className="code-eye" onClick={() => setShowCode(!showCode)}>{showCode ? '👁' : '🙈'}</button>
          <button className={`code-copy ${copied ? 'copied' : ''}`} onClick={copyCode}>{copied ? '✓' : '📋'}</button>
        </div>
        <div className="mono dim" style={{ marginTop: 8, fontSize: 9 }}>
          joined: {new Date(profile.joinedAt).toLocaleDateString('en')}
        </div>
      </div>
      <button className="edit-btn" onClick={onLogout}>↪ sign out from this device</button>
      <button className="edit-btn" style={{ color: 'var(--terracotta)' }} onClick={() => {
        if (!confirm('Reset everything? This erases ALL profiles, orders, settings on this device.')) return;
        CTRLS.reset(); location.reload();
      }}>↺ reset everything (debug)</button>
      <div className="footnote mono" style={{ padding: '8px 0' }}>
        rank: collect cups, climb the ladder · CTRL+N → CTRL+C → CTRL+V → CTRL+Z → CTRL+S
      </div>
    </div>
  );
}

Object.assign(window, {
  ProfileSheet, EditOrderSheet, PickItemSheet,
  SubEditSheet, SubItemPicker, SubListSheet, SubsTab,
  AvatarTab, ShareTab, SettingsTab,
});
