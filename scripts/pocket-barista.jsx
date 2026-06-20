// CTRL+S Pocket — barista flow: PIN gate, queue, menu mgmt, schedule, summary.

const { useState: _usB, useEffect: _ueB, useMemo: _umB } = React;

// === PIN gate ===
function BaristaPinGate({ state, onUnlock }) {
  const [pin, setPin] = _usB('');
  const [bad, setBad] = _usB(false);
  function submit() {
    if (pin === state.barista.baristaPin) {
      try { sessionStorage.setItem('ctrls_barista_session', '1'); } catch {}
      // mark this device as the owner → unlocks all avatar props in profile
      try { localStorage.setItem('ctrls_owner', '1'); } catch {}
      onUnlock();
    } else {
      setBad(true);
      setTimeout(() => setBad(false), 300);
      setPin('');
    }
  }
  return (
    <div className="pin-gate">
      <div className="brand-stack" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CursorArrow size={18} color="var(--charcoal)" />
        <span className="h-doodle" style={{ fontSize: 26 }}>CTRL<span style={{ color: 'var(--mustard)' }}>+S</span></span>
      </div>
      <div className="pin-card">
        <div className="h-doodle" style={{ fontSize: 24 }}>barista only</div>
        <div className="h-hand" style={{ fontSize: 14, color: 'var(--brown)', margin: '4px 0 8px' }}>punch in your PIN to access the kitchen</div>
        <input
          className={`pin-input ${bad ? 'bad' : ''}`}
          type="password"
          maxLength="4"
          value={pin}
          autoFocus
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="• • • •"
        />
        <button className="btn-primary" onClick={submit} disabled={pin.length < 3}>unlock →</button>
        <div className="footnote mono" style={{ padding: '12px 0 0' }}>hint · default is 1337 · change in settings tab</div>
      </div>
    </div>
  );
}

// === Barista root ===
function BaristaPocket({ state, setState, profile, onLock }) {
  const [tab, setTab] = _usB('queue');
  return (
    <div className="barista-scroll no-scrollbar">
      <div className="barista-head">
        <div>
          <div className="mono dim">{(() => { const h = new Date().getHours(); return h < 11 ? 'good morning' : h < 17 ? 'good afternoon' : 'good evening'; })()}</div>
          <div className="h-doodle" style={{ fontSize: 30 }}>{state.barista.name} ☕</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CatSleepy size={48} />
          <button className="x-big" onClick={onLock} title="lock">🔒</button>
        </div>
      </div>
      <div className="barista-tabs">
        {[
          { id: 'queue', label: 'queue' },
          { id: 'billing', label: 'billing' },
          { id: 'people', label: 'people' },
          { id: 'summary', label: 'summary' },
          { id: 'menu', label: 'menu' },
          { id: 'asap', label: 'asap' },
          { id: 'schedule', label: 'schedule' },
        ].map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'queue' && <QueueTab state={state} setState={setState} />}
      {tab === 'billing' && <BillingTab state={state} />}
      {tab === 'people' && <PeopleTab state={state} setState={setState} profile={profile} />}
      {tab === 'summary' && <SummaryTab state={state} />}
      {tab === 'menu' && <MenuTab state={state} setState={setState} />}
      {tab === 'asap' && <AsapTab state={state} setState={setState} />}
      {tab === 'schedule' && <ScheduleTab state={state} setState={setState} />}
    </div>
  );
}

// === People tab — customer visibility + lightweight stats ===
function PeopleTab({ state, setState, profile }) {
  const people = _umB(() => {
    const map = {};
    Object.values(state.profiles || {}).forEach((p) => {
      const id = p.id || p.code;
      if (!id) return;
      map[id] = {
        id,
        name: p.name || 'friend',
        avatar: p.avatar || CTRLS.DEFAULT_AVATAR,
        profile: p,
        source: 'profile',
      };
    });
    (state.orders || []).forEach((o) => {
      if (!o.profileId || map[o.profileId]) return;
      map[o.profileId] = {
        id: o.profileId,
        name: o.name || 'friend',
        avatar: o.avatar || CTRLS.DEFAULT_AVATAR,
        profile: null,
        source: 'orders',
      };
    });
    (state.orders || []).forEach((o) => {
      const id = CTRLS.orderCreditProfileId(o);
      if (!id || map[id]) return;
      map[id] = {
        id,
        name: CTRLS.orderCreditName(o) || 'friend',
        avatar: o.creditToAvatar || o.avatar || CTRLS.DEFAULT_AVATAR,
        profile: null,
        source: 'orders',
      };
    });
    return Object.values(map)
      .filter((p) => !(state.peopleMeta || {})[p.id]?.deleted)
      .map((p) => {
        const orders = (state.orders || []).filter((o) => CTRLS.isConfirmedOrder(o) && CTRLS.orderBelongsToProfile(o, p));
        const cups = orders.reduce((s, o) => s + CTRLS.cupQty(o), 0);
        const spent = orders.reduce((s, o) => s + CTRLS.orderTotal(state, o), 0);
        const drinkMap = {};
        orders.forEach((o) => (o.items || []).forEach((it) => {
          const label = CTRLS.itemLabel(state, it);
          drinkMap[label] = (drinkMap[label] || 0) + (it.qty || 1);
        }));
        const topDrinks = Object.entries(drinkMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([label, count]) => ({ label, count }));
        return {
          ...p,
          orders,
          cups,
          spent,
          topDrinks,
          hiddenFromGift: Boolean((state.peopleMeta || {})[p.id]?.hiddenFromGift),
          isCurrent: p.id === profile.id,
        };
      })
      .sort((a, b) => b.cups - a.cups || a.name.localeCompare(b.name));
  }, [state.profiles, state.orders, state.peopleMeta, profile.id]);

  const visibleCount = people.filter((p) => !p.hiddenFromGift).length;
  const hiddenCount = people.length - visibleCount;

  function patchPerson(id, patch) {
    setState((s) => ({
      ...s,
      peopleMeta: {
        ...(s.peopleMeta || {}),
        [id]: { ...((s.peopleMeta || {})[id] || {}), ...patch },
      },
    }));
  }

  function deletePerson(person) {
    if (!confirm(`Delete ${person.name} from people? Orders stay in history.`)) return;
    setState((s) => {
      const profiles = { ...(s.profiles || {}) };
      delete profiles[person.id];
      return {
        ...s,
        profiles,
        peopleMeta: {
          ...(s.peopleMeta || {}),
          [person.id]: { ...((s.peopleMeta || {})[person.id] || {}), deleted: true, hiddenFromGift: true },
        },
      };
    });
  }

  return (
    <div>
      <div className="people-summary">
        <div>
          <div className="h-doodle" style={{ fontSize: 30 }}>{people.length}</div>
          <div className="mono dim">people</div>
        </div>
        <div>
          <div className="h-doodle" style={{ fontSize: 30 }}>{visibleCount}</div>
          <div className="mono dim">gift-visible</div>
        </div>
        <div>
          <div className="h-doodle" style={{ fontSize: 30 }}>{hiddenCount}</div>
          <div className="mono dim">hidden</div>
        </div>
      </div>

      {people.length === 0 ? (
        <div className="empty-state">
          <CatSleepy size={72} />
          <div className="h-hand" style={{ fontSize: 18 }}>no profiles yet</div>
          <div className="mono dim">customers appear after creating a profile</div>
        </div>
      ) : (
        <div className="people-list">
          {people.map((p) => (
            <div key={p.id} className={`people-card ${p.hiddenFromGift ? 'hidden' : ''}`}>
              <div className="people-main">
                <CatAvatar avatar={p.avatar || CTRLS.DEFAULT_AVATAR} size={44} />
                <div className="people-mid">
                  <div className="people-name-row">
                    <span className="h-hand" style={{ fontSize: 18 }}>{p.name}</span>
                    {p.isCurrent && <span className="people-tag mono">you</span>}
                    {p.source === 'orders' && <span className="people-tag mono">order-only</span>}
                    {p.hiddenFromGift && <span className="people-tag muted mono">hidden</span>}
                  </div>
                  <div className="mono dim" style={{ fontSize: 10 }}>
                    {p.cups} cup{p.cups !== 1 ? 's' : ''} · {p.orders.length} order{p.orders.length !== 1 ? 's' : ''} · ฿{formatBaht(p.spent)}
                  </div>
                </div>
              </div>

              <div className="people-topdrinks">
                {p.topDrinks.length ? p.topDrinks.map((d) => (
                  <span key={d.label} className="people-drink mono">{d.count}x {d.label}</span>
                )) : (
                  <span className="mono dim">no orders yet</span>
                )}
              </div>

              <div className="people-actions">
                <button className="btn-mini" onClick={() => patchPerson(p.id, { hiddenFromGift: !p.hiddenFromGift })}>
                  {p.hiddenFromGift ? 'show in gift' : 'hide from gift'}
                </button>
                <button className="btn-mini danger" disabled={p.isCurrent} title={p.isCurrent ? 'hide your profile instead' : 'delete profile'} onClick={() => deletePerson(p)}>delete profile</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function peopleOptionsFromState(state) {
  const map = {};
  function put(id, name, avatar, outOfTeam, lineId) {
    const key = id || name;
    if (!key || !name) return;
    if (!map[key]) map[key] = { id: id || null, name, avatar: avatar || CTRLS.DEFAULT_AVATAR, outOfTeam: !!outOfTeam, lineId: lineId || '' };
    else map[key] = { ...map[key], id: map[key].id || id || null, avatar: map[key].avatar || avatar, outOfTeam: map[key].outOfTeam || !!outOfTeam, lineId: map[key].lineId || lineId || '' };
  }
  Object.values(state.profiles || {}).forEach((p) => put(p.id || p.code, p.name, p.avatar, p.outOfTeam, p.lineId));
  (state.orders || []).forEach((o) => {
    put(o.profileId, o.name, o.avatar, o.outOfTeam, o.lineId);
    put(CTRLS.orderBillProfileId(o), CTRLS.orderBillName(o), CTRLS.orderBillAvatar(o), CTRLS.orderIsOutOfTeam(o), o.billLineId || o.lineId);
    put(CTRLS.orderCreditProfileId(o), CTRLS.orderCreditName(o), o.creditToAvatar || o.avatar, false, '');
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}

function findPersonOption(people, nameOrId) {
  if (!nameOrId) return null;
  return people.find((p) => p.id === nameOrId || p.name === nameOrId) || null;
}

function OrderEditSheet({ state, order, onSave, onCancelOrder, onClose }) {
  const people = _umB(() => peopleOptionsFromState(state), [state.profiles, state.orders]);
  const [billName, setBillName] = _usB(() => CTRLS.orderBillName(order));
  const [billPersonId, setBillPersonId] = _usB(() => CTRLS.orderBillProfileId(order) || '');
  const [billOutOfTeam, setBillOutOfTeam] = _usB(() => CTRLS.orderIsOutOfTeam(order));
  const [lineId, setLineId] = _usB(() => order.billLineId || order.lineId || '');
  const [note, setNote] = _usB(() => order.note || '');

  function pickBill(p) {
    setBillPersonId(p.id || '');
    setBillName(p.name);
    setBillOutOfTeam(!!p.outOfTeam);
    setLineId(p.lineId || '');
  }
  function save() {
    const billPerson = findPersonOption(people, billPersonId) || findPersonOption(people, billName);
    const cleanBillName = billName.trim() || order.name;
    const transferred = cleanBillName !== order.name;
    onSave({
      ...order,
      billToName: cleanBillName,
      billToProfileId: billPerson?.id || null,
      billToAvatar: billPerson?.avatar || order.avatar,
      creditToName: cleanBillName,
      creditToProfileId: billPerson?.id || null,
      creditToAvatar: billPerson?.avatar || order.avatar,
      billOutOfTeam,
      billLineId: billOutOfTeam ? lineId.trim() : '',
      note: note.trim(),
      transferFromName: transferred ? (order.transferFromName || order.name) : order.transferFromName,
      transferEditedAt: Date.now(),
    });
    onClose();
  }

  const originalItems = (order.items || []).map((it) => CTRLS.itemLabel(state, it)).join(' · ');
  const previewOrder = { ...order, billOutOfTeam };

  return (
    <div className="sheet-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 26 }}>edit bill</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          <div className="bill-edit-original">
            <div className="mono dim">original order</div>
            <div className="h-hand">{order.name} · {originalItems}</div>
            <div className="mono dim">current total ฿{formatBaht(CTRLS.orderTotal(state, previewOrder))}</div>
          </div>

          <label className="field-label">bill to</label>
          <input className="name-input" style={{ marginTop: 6 }} value={billName} onChange={(e) => { setBillName(e.target.value); setBillPersonId(''); }} placeholder="who pays" />
          <div className="quick-person-row">
            {people.slice(0, 16).map((p) => (
              <button key={'bill-' + (p.id || p.name)} className={`btn-mini ${billPersonId && billPersonId === p.id ? 'active' : ''}`} onClick={() => pickBill(p)}>{p.name}</button>
            ))}
          </div>
          <div className="footnote mono" style={{ paddingTop: 6 }}>loyalty and history follow whoever pays</div>

          <div className="bill-edit-toggle">
            <button className={`team-pill ${!billOutOfTeam ? 'on' : ''}`} onClick={() => setBillOutOfTeam(false)}>team bill</button>
            <button className={`team-pill ${billOutOfTeam ? 'on' : ''}`} onClick={() => setBillOutOfTeam(true)}>outside bill</button>
          </div>
          {billOutOfTeam && (
            <input className="setting-input" value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="LINE ID / contact" />
          )}

          <label className="field-label" style={{ marginTop: 14, display: 'block' }}>note</label>
          <textarea className="setting-input" rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="cancelled, resold, cash note..." />
        </div>
        <div className="sheet-foot">
          <button className="btn-primary" disabled={!billName.trim()} onClick={save}>save changes →</button>
          <button className="btn-mini danger" style={{ width: '100%', marginTop: 8 }} onClick={() => {
            if (!confirm('Cancel this order and remove it from billing?')) return;
            onCancelOrder(order);
            onClose();
          }}>cancel order · remove from bill</button>
          <div className="footnote mono">cancelled orders disappear from queue, summary, billing, and cup count</div>
        </div>
      </div>
    </div>
  );
}

function BaristaOrderSheet({ state, setState, dateIso, onClose }) {
  const people = _umB(() => peopleOptionsFromState(state), [state.profiles, state.orders]);
  const [name, setName] = _usB('');
  const [personId, setPersonId] = _usB('');
  const [date, setDate] = _usB(dateIso || CTRLS.isoToday());
  const [items, setItems] = _usB([]);
  const [picking, setPicking] = _usB(false);
  const [outOfTeam, setOutOfTeam] = _usB(false);
  const [lineId, setLineId] = _usB('');
  const [note, setNote] = _usB('added by barista');

  const selectedPerson = findPersonOption(people, personId) || findPersonOption(people, name);
  const previewOrder = { items, outOfTeam, billOutOfTeam: outOfTeam };
  const total = CTRLS.orderTotal(state, previewOrder);

  function pickPerson(p) {
    setPersonId(p.id || '');
    setName(p.name);
    setOutOfTeam(!!p.outOfTeam);
    setLineId(p.lineId || '');
  }
  function save() {
    const cleanName = name.trim();
    if (!cleanName || !items.length) return;
    const person = selectedPerson || {};
    const avatar = person.avatar || CTRLS.DEFAULT_AVATAR;
    const order = {
      id: 'bar_' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      profileId: person.id || null,
      avatar,
      date,
      items,
      status: 'queued',
      paid: 'confirmed',
      source: 'barista',
      billToName: cleanName,
      billToProfileId: person.id || null,
      billToAvatar: avatar,
      creditToName: cleanName,
      creditToProfileId: person.id || null,
      creditToAvatar: avatar,
      outOfTeam,
      billOutOfTeam: outOfTeam,
      lineId: outOfTeam ? lineId.trim() : '',
      billLineId: outOfTeam ? lineId.trim() : '',
      note: note.trim(),
      ts: Date.now(),
    };
    setState({ ...state, orders: [...state.orders, order] });
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} style={{ zIndex: 115 }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="h-doodle" style={{ fontSize: 26 }}>add order</span>
          <button className="x-big" onClick={onClose}>×</button>
        </div>
        <div className="sheet-scroll no-scrollbar">
          <label className="field-label">who pays / gets points</label>
          <input className="name-input" style={{ marginTop: 6 }} value={name} onChange={(e) => { setName(e.target.value); setPersonId(''); }} placeholder="name" />
          <div className="quick-person-row">
            {people.slice(0, 16).map((p) => (
              <button key={'manual-' + (p.id || p.name)} className={`btn-mini ${personId && personId === p.id ? 'active' : ''}`} onClick={() => pickPerson(p)}>{p.name}</button>
            ))}
          </div>

          <label className="field-label" style={{ marginTop: 14, display: 'block' }}>day</label>
          <input className="setting-input" type="date" value={date} style={{ marginTop: 6 }} onChange={(e) => setDate(e.target.value)} />
          <div className="footnote mono" style={{ paddingTop: 6 }}>barista orders bypass the customer cutoff</div>

          <label className="field-label" style={{ marginTop: 14, display: 'block' }}>cups</label>
          {items.map((it, i) => (
            <div key={i} className="cart-line">
              <span className="h-hand" style={{ flex: 1 }}>{CTRLS.itemLabel(state, it)}</span>
              <span className="mono dim">฿{CTRLS.priceForItem(state, it)}</span>
              <button className="x" onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
          <button className="edit-btn" style={{ width: '100%', marginTop: 6 }} onClick={() => setPicking(true)}>＋ add a cup</button>

          <div className="bill-edit-toggle">
            <button className={`team-pill ${!outOfTeam ? 'on' : ''}`} onClick={() => setOutOfTeam(false)}>team bill</button>
            <button className={`team-pill ${outOfTeam ? 'on' : ''}`} onClick={() => setOutOfTeam(true)}>outside bill</button>
          </div>
          {outOfTeam && (
            <input className="setting-input" value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="LINE ID / contact" />
          )}

          <label className="field-label" style={{ marginTop: 14, display: 'block' }}>note</label>
          <textarea className="setting-input" rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="late order, morning add-on..." />

          {picking && (
            <PickItemSheet
              state={state}
              onPick={(it) => { setItems((arr) => [...arr, it]); setPicking(false); }}
              onClose={() => setPicking(false)}
            />
          )}
        </div>
        <div className="sheet-foot">
          <div className="total-row">
            <span className="h-hand">total <span className="mono dim" style={{ fontSize: 10 }}>· collect manually</span></span>
            <span className="h-doodle" style={{ fontSize: 28 }}>฿{formatBaht(total)}</span>
          </div>
          <button className="btn-primary" disabled={!name.trim() || !items.length} onClick={save}>add to queue →</button>
          <div className="footnote mono">shows in queue, summary, billing, and cup count immediately</div>
        </div>
      </div>
    </div>
  );
}

// === Queue (confirmed orders only) ===
function QueueTab({ state, setState }) {
  const [filter, setFilter] = _usB(CTRLS.isoToday());
  const [editingOrder, setEditingOrder] = _usB(null);
  const [addingOrder, setAddingOrder] = _usB(false);

  const allDates = _umB(() => {
    const today = CTRLS.isoToday();
    // Only today and future — past dates are hard to scroll past and rarely needed.
    const fromOrders = state.orders
      .filter((o) => CTRLS.isConfirmedOrder(o) && o.date >= today)
      .map((o) => o.date);
    return [...new Set([today, ...fromOrders])].sort();
  }, [state.orders]);

  const orders = state.orders.filter((o) => CTRLS.isConfirmedOrder(o) && o.date === filter).sort((a, b) => a.ts - b.ts);
  const totalCups = orders.reduce((s, o) => s + CTRLS.cupQty(o), 0);
  const totalBaht = orders.reduce((s, o) => s + CTRLS.orderTotal(state, o), 0);

  // Aggregate drinks for prep list
  const prepList = _umB(() => {
    const map = {};
    orders.forEach((o) => o.items.forEach((it) => {
      const label = CTRLS.itemLabel(state, it);
      const color = CTRLS.itemColor(state, it);
      if (!map[label]) map[label] = { label, color, count: 0 };
      map[label].count += it.qty || 1;
    }));
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [orders, state]);

  const sd = filter ? shortDate(filter) : null;

  return (
    <div>
      {/* Date selector */}
      <div className="date-row no-scrollbar">
        {allDates.map((d) => {
          const s = shortDate(d);
          const n = state.orders.filter((o) => o.date === d && CTRLS.isConfirmedOrder(o)).length;
          const isToday = d === CTRLS.isoToday();
          return (
            <button key={d} className={`date-chip ${filter === d ? 'active' : ''}`} onClick={() => setFilter(d)}>
              <span className="mono">{isToday ? 'today' : s.dow}</span> {s.day}
              {n > 0 && <span className="chip-badge">{n}</span>}
            </button>
          );
        })}
      </div>

      <button className="edit-btn" style={{ width: '100%', marginBottom: 12 }} onClick={() => setAddingOrder(true)}>
        ＋ add order as barista
      </button>

      {orders.length === 0 ? (
        <div className="empty-state">
          <CatSleepy size={80} />
          <div className="h-hand" style={{ fontSize: 18 }}>quiet day 🌿</div>
          <div className="mono dim">no confirmed orders for this day</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="brew-header">
            <span className="h-doodle" style={{ fontSize: 36, color: 'var(--mustard)' }}>{totalCups}</span>
            <div>
              <div className="h-hand" style={{ fontSize: 18 }}>cup{totalCups !== 1 ? 's' : ''} to brew</div>
              <div className="mono dim">{sd?.dow} {sd?.day} {sd?.monLong} · ฿{formatBaht(totalBaht)} · {orders.length} order{orders.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Prep list */}
          <div className="brew-section-label mono">what to brew</div>
          <div className="brew-prep-list">
            {prepList.map(({ label, color, count }) => (
              <div key={label} className="brew-prep-row">
                <div className="brew-prep-count h-doodle">{count}×</div>
                <Mug size={18} color="var(--charcoal)" fill={COLOR_TO_SOFT[color] || 'var(--terracotta-soft)'} />
                <div className="h-hand brew-prep-name">{label}</div>
              </div>
            ))}
          </div>

          {/* By person */}
          <div className="brew-section-label mono" style={{ marginTop: 16 }}>for</div>
          <div className="brew-person-list">
            {orders.map((o) => (
              <div key={o.id} className="brew-person-row">
                <CatAvatar avatar={o.avatar || { body: 'beige', expression: 'happy' }} size={32} />
                <div className="brew-person-mid">
                  <div className="h-hand" style={{ fontSize: 15, lineHeight: 1.1 }}>
                    {o.source === 'gift' && <span style={{ marginRight: 4 }}>🎁</span>}
                    {o.name}
                    {o.source === 'subscription' && <span className="mono dim" style={{ fontSize: 9, marginLeft: 5 }}>📌</span>}
                  </div>
                  <div className="mono dim" style={{ fontSize: 11 }}>
                    {o.items.map((it) => CTRLS.itemLabel(state, it)).join(' · ')}
                    {o.source === 'gift' && <span style={{ color: 'var(--sage)' }}> · gift{o.gifterName ? ` from ${o.gifterName}` : ''}</span>}
                    {o.note ? <span style={{ color: 'var(--terracotta)' }}> · {o.note}</span> : null}
                  </div>
                  {(CTRLS.orderBillName(o) !== o.name || CTRLS.orderCreditName(o) !== o.name) && (
                    <div className="mono lineid-badge">
                      bill: {CTRLS.orderBillName(o)} · points: {CTRLS.orderCreditName(o)}
                      {o.transferFromName ? ` · from ${o.transferFromName}` : ''}
                    </div>
                  )}
                  {CTRLS.orderIsOutOfTeam(o) && (
                    <div className="mono lineid-badge">
                      นอกทีม +฿{CTRLS.outOfTeamSurcharge(state) * CTRLS.cupQty(o)}{(o.billLineId || o.lineId) ? ` · LINE: ${o.billLineId || o.lineId}` : ' · ไม่มี LINE ID'}
                    </div>
                  )}
                </div>
                <div className="mono dim" style={{ fontSize: 12 }}>฿{CTRLS.orderTotal(state, o)}</div>
                <button
                  className="btn-mini"
                  style={{ flexShrink: 0 }}
                  title="edit bill"
                  onClick={() => setEditingOrder(o)}
                >edit</button>
                <button
                  className="x"
                  style={{ color: 'var(--terracotta)', marginLeft: 6, flexShrink: 0 }}
                  title="remove order"
                  onClick={() => {
                    if (!confirm('Cancel this order and remove it from billing?')) return;
                    setState({ ...state, orders: state.orders.map((x) => x.id === o.id ? { ...x, status: 'cancelled', paid: 'cancelled', cancelledAt: Date.now() } : x) });
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </>
      )}
      {editingOrder && (
        <OrderEditSheet
          state={state}
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={(next) => setState({ ...state, orders: state.orders.map((x) => x.id === next.id ? next : x) })}
          onCancelOrder={(o) => setState({ ...state, orders: state.orders.map((x) => x.id === o.id ? { ...x, status: 'cancelled', paid: 'cancelled', cancelledAt: Date.now() } : x) })}
        />
      )}
      {addingOrder && (
        <BaristaOrderSheet
          state={state}
          setState={setState}
          dateIso={filter}
          onClose={() => setAddingOrder(false)}
        />
      )}
    </div>
  );
}

// === Billing tab — weekly totals per person ===
function BillingTab({ state }) {
  const [weekStart, setWeekStart] = _usB(() => {
    const today = new Date();
    const dow = today.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(today);
    mon.setDate(today.getDate() + diff);
    return isoFromDate(mon);
  });
  const [copied, setCopied] = _usB(false);

  const weekDates = _umB(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart + 'T00:00:00');
      d.setDate(d.getDate() + i);
      dates.push(isoFromDate(d));
    }
    return dates;
  }, [weekStart]);

  function bumpWeek(delta) {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7 * delta);
    setWeekStart(isoFromDate(d));
  }

  const billing = _umB(() => {
    const buckets = { team: {}, outside: {} };
    state.orders
      .filter((o) => CTRLS.isConfirmedOrder(o) && weekDates.includes(o.date))
      .forEach((o) => {
        const bucket = CTRLS.orderIsOutOfTeam(o) ? 'outside' : 'team';
        const key = CTRLS.orderBillProfileId(o) || CTRLS.orderBillName(o);
        if (!buckets[bucket][key]) {
          buckets[bucket][key] = {
            key,
            name: CTRLS.orderBillName(o),
            avatar: CTRLS.orderBillAvatar(o),
            total: 0,
            cups: 0,
            orderCount: 0,
            lines: [],
            lineId: o.billLineId || o.lineId || '',
          };
        }
        buckets[bucket][key].total += CTRLS.orderTotal(state, o);
        buckets[bucket][key].cups += CTRLS.cupQty(o);
        buckets[bucket][key].orderCount++;
        buckets[bucket][key].lines.push(o);
      });
    return {
      team: Object.values(buckets.team).sort((a, b) => b.total - a.total),
      outside: Object.values(buckets.outside).sort((a, b) => b.total - a.total),
    };
  }, [state.orders, weekDates]);

  const teamTotal = billing.team.reduce((s, p) => s + p.total, 0);
  const teamCups = billing.team.reduce((s, p) => s + p.cups, 0);
  const outsideTotal = billing.outside.reduce((s, p) => s + p.total, 0);
  const outsideCups = billing.outside.reduce((s, p) => s + p.cups, 0);
  const grandTotal = teamTotal + outsideTotal;
  const grandCups = teamCups + outsideCups;

  const weekLabel = (() => {
    const sd = shortDate(weekDates[0]);
    const ed = shortDate(weekDates[6]);
    return `${sd.mon} ${sd.day} – ${ed.mon} ${ed.day}`;
  })();

  async function copyBilling() {
    const lines = [`💰 CTRL+S COFFEE — WEEKLY BILLING`];
    lines.push(weekLabel);
    lines.push(`────────────────────`);
    lines.push(`${grandCups} cups · ฿${formatBaht(grandTotal)} total`);
    lines.push('');
    lines.push(`TEAM · ฿${formatBaht(teamTotal)}`);
    if (!billing.team.length) lines.push(`  (none)`);
    billing.team.forEach((p) => lines.push(`  • ${p.name}: ฿${formatBaht(p.total)} (${p.cups} cup${p.cups !== 1 ? 's' : ''})`));
    lines.push('');
    lines.push(`OUTSIDE · ฿${formatBaht(outsideTotal)}`);
    if (!billing.outside.length) lines.push(`  (none)`);
    billing.outside.forEach((p) => lines.push(`  • ${p.name}: ฿${formatBaht(p.total)} (${p.cups} cup${p.cups !== 1 ? 's' : ''})${p.lineId ? ` · LINE: ${p.lineId}` : ''}`));
    if (await copyText(lines.join('\n'))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  function renderBillingSection(title, people, total, cups) {
    return (
      <div className="billing-section">
        <div className="billing-section-head">
          <span className="mono dim">{title}</span>
          <span className="h-hand">฿{formatBaht(total)} · {cups} cup{cups !== 1 ? 's' : ''}</span>
        </div>
        {people.length === 0 ? (
          <div className="mono dim" style={{ padding: '10px 16px' }}>nothing here</div>
        ) : (
          <div className="billing-list">
            {people.map((p) => (
              <div key={p.key} className="billing-row">
                <CatAvatar avatar={p.avatar || { body: 'beige', expression: 'happy' }} size={36} />
                <div className="billing-mid">
                  <div className="h-hand" style={{ fontSize: 15, lineHeight: 1.1 }}>{p.name}</div>
                  <div className="mono dim" style={{ fontSize: 11 }}>
                    {p.cups} cup{p.cups !== 1 ? 's' : ''} · {p.orderCount} order{p.orderCount !== 1 ? 's' : ''}
                    {p.lineId ? ` · LINE: ${p.lineId}` : ''}
                  </div>
                </div>
                <div className="h-doodle" style={{ fontSize: 26, color: 'var(--terracotta)' }}>฿{formatBaht(p.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="billing-nav">
        <button className="nav-btn" onClick={() => bumpWeek(-1)}>‹</button>
        <span className="h-hand" style={{ flex: 1, textAlign: 'center', fontSize: 14 }}>{weekLabel}</span>
        <button className="nav-btn" onClick={() => bumpWeek(1)}>›</button>
      </div>

      {billing.team.length === 0 && billing.outside.length === 0 ? (
        <div className="empty-state">
          <CatSleepy size={80} />
          <div className="h-hand" style={{ fontSize: 18 }}>nothing to collect</div>
          <div className="mono dim">no confirmed orders this week</div>
        </div>
      ) : (
        <>
          <div className="billing-summary">
            <div className="mono dim" style={{ fontSize: 11, marginBottom: 4 }}>to collect this week</div>
            <div className="h-doodle" style={{ fontSize: 44, color: 'var(--terracotta)', lineHeight: 1 }}>฿{formatBaht(grandTotal)}</div>
            <div className="mono dim" style={{ marginTop: 4 }}>
              team ฿{formatBaht(teamTotal)} · outside ฿{formatBaht(outsideTotal)} · {grandCups} cups
            </div>
          </div>

          {renderBillingSection('team collection', billing.team, teamTotal, teamCups)}
          {renderBillingSection('outside collection', billing.outside, outsideTotal, outsideCups)}

          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyBilling}>{copied ? '✓ copied' : '📋 copy list'}</button>
          </div>
        </>
      )}
    </div>
  );
}

// === Summary tab — text confirm for tomorrow ===
function SummaryTab({ state }) {
  // Default to tomorrow
  const [target, setTarget] = _usB(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return isoFromDate(d);
  });
  const [copied, setCopied] = _usB(false);
  const [copiedOut, setCopiedOut] = _usB(false);

  const allOrders = state.orders.filter((o) => o.date === target && CTRLS.isConfirmedOrder(o)).sort((a, b) => a.ts - b.ts);
  // Team summary goes to the internal group chat → exclude out-of-team folks;
  // they bill individually, so they get their own separate list.
  const orders = allOrders.filter((o) => !CTRLS.orderIsOutOfTeam(o));
  const outOrders = allOrders.filter((o) => CTRLS.orderIsOutOfTeam(o));
  const totalCups = orders.reduce((s, o) => s + CTRLS.cupQty(o), 0);
  const totalBaht = orders.reduce((s, o) => s + CTRLS.orderTotal(state, o), 0);

  // Aggregate by drink name for prep count (team only)
  const drinkCount = {};
  orders.forEach((o) => o.items.forEach((it) => {
    const label = CTRLS.itemLabel(state, it);
    drinkCount[label] = (drinkCount[label] || 0) + (it.qty || 1);
  }));

  const sd = shortDate(target);
  const lines = [];
  lines.push(`☕ CTRL+S COFFEE — ${sd.dow} ${sd.day} ${sd.monLong}`);
  lines.push(`────────────────────`);
  lines.push(`${totalCups} cup${totalCups !== 1 ? 's' : ''} · ฿${formatBaht(totalBaht)} · ${orders.length} order${orders.length !== 1 ? 's' : ''}`);
  lines.push('');
  if (Object.keys(drinkCount).length) {
    lines.push(`📋 by drink:`);
    Object.entries(drinkCount).sort((a,b) => b[1]-a[1]).forEach(([k, v]) => lines.push(`  • ${v}× ${k}`));
    lines.push('');
  }
  lines.push(`👥 by person:`);
  if (orders.length === 0) lines.push(`  (none yet)`);
  orders.forEach((o) => {
    const items = o.items.map((it) => CTRLS.itemLabel(state, it)).join(', ');
    const tag = (o.source === 'gift' ? ` 🎁${o.gifterName ? ' from ' + o.gifterName : ''}` : o.source === 'subscription' ? ' 📌' : '');
    const billNote = CTRLS.orderBillName(o) !== o.name ? ` · bill ${CTRLS.orderBillName(o)}` : '';
    lines.push(`  • ${CTRLS.orderCreditName(o)}: ${items}${tag}${billNote}`);
  });
  const summaryText = lines.join('\n');

  // Separate out-of-team list — billed individually (with LINE IDs)
  const outCups = outOrders.reduce((s, o) => s + CTRLS.cupQty(o), 0);
  const outBaht = outOrders.reduce((s, o) => s + CTRLS.orderTotal(state, o), 0);
  const outLines = [];
  outLines.push(`🧾 OUT-OF-TEAM — ${sd.dow} ${sd.day} ${sd.monLong}`);
  outLines.push(`────────────────────`);
  outLines.push(`${outCups} cup${outCups !== 1 ? 's' : ''} · ฿${formatBaht(outBaht)} · bill individually`);
  outLines.push('');
  outOrders.forEach((o) => {
    const items = o.items.map((it) => CTRLS.itemLabel(state, it)).join(', ');
    const line = (o.billLineId || o.lineId) ? ` · LINE: ${o.billLineId || o.lineId}` : ' · no LINE ID';
    const credit = CTRLS.orderCreditName(o) !== CTRLS.orderBillName(o) ? ` · points: ${CTRLS.orderCreditName(o)}` : '';
    outLines.push(`  • ${CTRLS.orderBillName(o)}: ${items} · ฿${formatBaht(CTRLS.orderTotal(state, o))}${line}${credit}`);
  });
  const outText = outLines.join('\n');

  async function copy() {
    if (await copyText(summaryText)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }
  async function copyOut() {
    if (await copyText(outText)) {
      setCopiedOut(true);
      setTimeout(() => setCopiedOut(false), 1600);
    }
  }
  // Generate next 7 day chips
  const dateChips = _umB(() => nextNDays(7, CTRLS.isoToday()), []);

  return (
    <div>
      <div className="date-row no-scrollbar">
        {dateChips.map((d) => {
          const csd = shortDate(d);
          const count = state.orders.filter((o) => o.date === d && CTRLS.isConfirmedOrder(o)).length;
          return (
            <button key={d} className={`date-chip ${target === d ? 'active' : ''}`} onClick={() => setTarget(d)}>
              <span className="mono">{csd.dow}</span> {csd.day}
              {count > 0 && <span className="chip-badge">{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="summary-card">
        <div className="asap-head">
          <span className="mono dim">team · copy & paste for nightly check</span>
          <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>{copied ? '✓ copied' : '📋 copy'}</button>
        </div>
        <pre className="summary-pre">{summaryText}</pre>
      </div>
      <div className="footnote mono" style={{ padding: '4px 0' }}>tip · paste into your group chat in the evening to double-check before brewing</div>

      {outOrders.length > 0 && (
        <div className="summary-card" style={{ marginTop: 12 }}>
          <div className="asap-head">
            <span className="mono dim">out-of-team · {outOrders.length} · bill individually</span>
            <button className={`copy-btn ${copiedOut ? 'copied' : ''}`} onClick={copyOut}>{copiedOut ? '✓ copied' : '📋 copy'}</button>
          </div>
          <pre className="summary-pre">{outText}</pre>
          <div className="footnote mono" style={{ padding: '4px 0' }}>kept out of the team list · DM each person their bill via LINE</div>
        </div>
      )}
    </div>
  );
}

// === Menu tab — manage signature menu (add/edit/delete + cat color) ===
function MenuTab({ state, setState }) {
  const [editing, setEditing] = _usB(null);
  const menu = state.signatureMenu || CTRLS.DEFAULT_SIGNATURE_MENU;
  function update(id, patch) {
    setState({ ...state, signatureMenu: menu.map((m) => m.id === id ? { ...m, ...patch } : m) });
  }
  function remove(id) {
    if (!confirm('Remove this signature menu item? Existing orders keep the name.')) return;
    setState({ ...state, signatureMenu: menu.filter((m) => m.id !== id) });
  }
  function add() {
    const id = 'm' + Date.now().toString(36);
    setState({
      ...state,
      signatureMenu: [...menu, {
        id, name: 'New Drink', mood: '✨', roast: 'medium', price: 40, color: 'sage', catStyle: 'happy',
        tag: 'tasting notes / tag',
        tagline: 'short story of this cup.',
      }],
    });
    setEditing(id);
  }
  return (
    <div>
      <div className="asap-head">
        <span className="mono dim">signature menu · the regulars</span>
        <button className="btn-mini" onClick={add}>+ add</button>
      </div>
      {menu.map((m) => (
        <div key={m.id}>
          {editing === m.id ? (
            <div className="menu-edit-form">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CatBase size={48}
                  fill={m.color === 'pink' ? '#EADFCB' : m.color === 'mustard' ? '#F6F1E8' : m.color === 'terracotta' ? '#F6F1E8' : m.color === 'sage' ? '#EADFCB' : '#F6F1E8'}
                  stroke="#2B2B2B"
                  expression={m.catStyle || 'happy'}
                  accent={({ mustard:'#D5A23B', pink:'#E7A2AC', terracotta:'#C97B5F', sage:'#8FA287', charcoal:'#D5A23B' })[m.color] || '#D5A23B'}
                />
                <input style={{ flex: 1, fontSize: 18 }} value={m.name} onChange={(e) => update(m.id, { name: e.target.value })} placeholder="name" />
                <input style={{ width: 50 }} value={m.mood || ''} onChange={(e) => update(m.id, { mood: e.target.value })} placeholder="🌟" />
              </div>
              <input value={m.tag} onChange={(e) => update(m.id, { tag: e.target.value })} placeholder="tasting tag (small caps line)" />
              <textarea rows="2" value={m.tagline} onChange={(e) => update(m.id, { tagline: e.target.value })} placeholder="tagline (the story)" />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="mono dim" style={{ fontSize: 10, flex: '0 0 60px' }}>roast</span>
                <select value={CTRLS.itemRoast(m)} onChange={(e) => update(m.id, { roast: e.target.value })}>
                  {CTRLS.ROAST_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <span className={`roast-pill ${CTRLS.itemRoast(m)}`}>{CTRLS.itemRoast(m)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="mono dim" style={{ fontSize: 10, flex: '0 0 60px' }}>cat color</span>
                <div className="color-picker">
                  {CTRLS.COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      className={`color-swatch ${m.color === c ? 'selected' : ''}`}
                      style={{ background: COLOR_TO_VAR[c] }}
                      onClick={() => update(m.id, { color: c })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="mono dim" style={{ fontSize: 10 }}>expression</span>
                <div className="avatar-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 6 }}>
                  {EXPRESSIONS.map((exp) => (
                    <button
                      key={exp}
                      className={`avatar-cell ${(m.catStyle || 'happy') === exp ? 'selected' : ''}`}
                      onClick={() => update(m.id, { catStyle: exp })}
                      title={exp}
                    >
                      <CatBase size={32} fill="#EADFCB" stroke="#2B2B2B" expression={exp} accent="#D5A23B" />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="mono dim" style={{ fontSize: 10, flex: '0 0 60px' }}>price</span>
                <span className="mono dim" style={{ fontSize: 10 }}>฿</span>
                <input type="number" style={{ width: 70 }} value={m.price} onChange={(e) => update(m.id, { price: +e.target.value })} />
              </div>
              <div className="ed-row">
                <button className="btn-mini" onClick={() => update(m.id, { available: !CTRLS.isAvailable(m) })}>
                  {CTRLS.isAvailable(m) ? 'mark sold out' : 'make available'}
                </button>
                <button className="btn-mini danger" onClick={() => { remove(m.id); setEditing(null); }}>delete</button>
                <button className="btn-mini" onClick={() => setEditing(null)} style={{ marginLeft: 'auto' }}>done</button>
              </div>
            </div>
          ) : (
            <button className={`menu-row ${!CTRLS.isAvailable(m) ? 'unavailable' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => setEditing(m.id)}>
              <div className="color-dot" style={{ background: COLOR_TO_VAR[m.color] }} />
              <div className="menu-mid">
                <div className="menu-name">{m.name} {m.mood}</div>
                <div className="menu-tag">
                  <span className={`roast-pill ${CTRLS.itemRoast(m)}`}>{CTRLS.itemRoast(m)}</span>
                  {!CTRLS.isAvailable(m) && <span className="soldout-pill">sold out</span>}
                  {m.tag}
                </div>
              </div>
              <div className="h-doodle" style={{ fontSize: 20 }}>฿{m.price}</div>
              <span className="mono dim" style={{ fontSize: 10, marginLeft: 6 }}>edit ✎</span>
            </button>
          )}
        </div>
      ))}
      <div className="footnote mono" style={{ padding: '12px 0' }}>signature = everyday regulars · use sold out when something should disappear from ordering</div>
    </div>
  );
}

// === ASAP tab (existing, but sorted) ===
function AsapTab({ state, setState }) {
  const [editing, setEditing] = _usB(null);
  const sorted = _umB(() => {
    return [...state.asap].sort((a, b) => (CTRLS.ROAST_ORDER[CTRLS.itemRoast(a)] - CTRLS.ROAST_ORDER[CTRLS.itemRoast(b)]) || a.name.localeCompare(b.name));
  }, [state.asap]);
  function update(id, patch) {
    setState({ ...state, asap: state.asap.map((a) => a.id === id ? { ...a, ...patch } : a) });
  }
  function remove(id) {
    setState({ ...state, asap: state.asap.filter((a) => a.id !== id) });
  }
  function add() {
    const id = 'a' + Date.now();
    setState({ ...state, asap: [...state.asap, { id, name: 'New Bean', roast: 'medium', price: 60, notes: 'tasting notes here' }] });
    setEditing(id);
  }
  return (
    <div>
      <div className="asap-head">
        <span className="mono dim">today's lineup · sorted by roast</span>
        <button className="btn-mini" onClick={add}>+ bean</button>
      </div>
      {state.barista?.featuredAsap && (() => {
        const feat = state.asap.find((a) => a.id === state.barista.featuredAsap);
        return feat ? (
          <div className="edit-warn" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📌</span>
            <span className="h-hand" style={{ flex: 1 }}>Today's Roast: <strong>{feat.name}</strong></span>
            <button className="btn-mini" style={{ background: 'var(--terracotta)', color: 'var(--cream)' }}
              onClick={() => setState({ ...state, barista: { ...state.barista, featuredAsap: null } })}>unpin</button>
          </div>
        ) : null;
      })()}
      {sorted.map((a) => (
        <div key={a.id} className="asap-row">
          {editing === a.id ? (
            <div className="asap-edit">
              <input className="ed-name" value={a.name} onChange={(e) => update(a.id, { name: e.target.value })} />
              <textarea className="ed-notes" rows="2" value={a.notes} onChange={(e) => update(a.id, { notes: e.target.value })} />
              <div className="ed-row">
                <select value={CTRLS.itemRoast(a)} onChange={(e) => update(a.id, { roast: e.target.value })}>
                  {CTRLS.ROAST_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="number" value={a.price} onChange={(e) => update(a.id, { price: +e.target.value })} />
                <button className="btn-mini" onClick={() => update(a.id, { available: !CTRLS.isAvailable(a) })}>
                  {CTRLS.isAvailable(a) ? 'sold out' : 'available'}
                </button>
                <button className="btn-mini danger" onClick={() => { remove(a.id); setEditing(null); }}>delete</button>
                <button className="btn-mini" onClick={() => setEditing(null)}>save</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
              <button className={`asap-row-btn ${!CTRLS.isAvailable(a) ? 'unavailable' : ''}`} style={{ flex: 1 }} onClick={() => setEditing(a.id)}>
                <div className="asap-row-left">
                  <span className={`roast-pill ${CTRLS.itemRoast(a)}`}>{CTRLS.itemRoast(a)}</span>
                  {!CTRLS.isAvailable(a) && <span className="soldout-pill">sold out</span>}
                  <div>
                    <div className="h-hand">{a.name}</div>
                    <div className="mono dim notes-clip">{a.notes}</div>
                  </div>
                </div>
                <div className="asap-row-right">
                  <span className="h-doodle">฿{a.price}</span>
                  <span className="mono dim">edit ✎</span>
                </div>
              </button>
              <button
                title={state.barista?.featuredAsap === a.id ? 'unpin' : 'feature as today\'s roast'}
                style={{
                  padding: '0 12px',
                  borderRadius: 14,
                  border: '1px solid var(--line)',
                  background: state.barista?.featuredAsap === a.id ? 'var(--terracotta)' : 'var(--paper)',
                  fontSize: 16,
                  flexShrink: 0,
                  transition: 'background .15s',
                }}
                onClick={() => setState({
                  ...state,
                  barista: { ...state.barista, featuredAsap: state.barista?.featuredAsap === a.id ? null : a.id },
                })}
              >
                📌
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// === Schedule tab — weekly toggles + monthly overrides ===
function ScheduleTab({ state, setState }) {
  const [monthCursor, setMonthCursor] = _usB(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function toggleDow(d) {
    const open = state.openDays.includes(d) ? state.openDays.filter((x) => x !== d) : [...state.openDays, d];
    setState({ ...state, openDays: open });
  }
  function bumpMonth(delta) {
    let { y, m } = monthCursor;
    m += delta;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonthCursor({ y, m });
  }
  function toggleDateOverride(iso) {
    const dow = new Date(iso + 'T00:00:00').getDay();
    const baseOpen = state.openDays.includes(dow);
    const isClosed = state.closedDates?.includes(iso);
    const isOpen = state.openDates?.includes(iso);
    // cycle: base → opposite of base → base
    if (baseOpen) {
      // open by default → toggle closed override
      if (isClosed) setState({ ...state, closedDates: state.closedDates.filter((x) => x !== iso) });
      else setState({ ...state, closedDates: [...(state.closedDates || []), iso], openDates: (state.openDates || []).filter((x) => x !== iso) });
    } else {
      // closed by default → toggle open override
      if (isOpen) setState({ ...state, openDates: state.openDates.filter((x) => x !== iso) });
      else setState({ ...state, openDates: [...(state.openDates || []), iso], closedDates: (state.closedDates || []).filter((x) => x !== iso) });
    }
  }
  const matrix = monthMatrix(monthCursor.y, monthCursor.m);
  const monthLabel = new Date(monthCursor.y, monthCursor.m, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  const todayIso = CTRLS.isoToday();

  return (
    <div>
      <div className="asap-head">
        <span className="mono dim">recurring week · default open days</span>
      </div>
      <div className="dow-grid">
        {dows.map((label, i) => (
          <button key={i} className={`dow-card ${state.openDays.includes(i) ? 'open' : 'closed'}`} onClick={() => toggleDow(i)}>
            <div className="mono dim">{label.toLowerCase().slice(0,3)}</div>
            <div className="h-doodle" style={{ fontSize: 26 }}>{state.openDays.includes(i) ? '✓' : '·'}</div>
            <div className="mono dim">{state.openDays.includes(i) ? 'open' : 'closed'}</div>
          </button>
        ))}
      </div>

      <div className="asap-head" style={{ marginTop: 20 }}>
        <span className="mono dim">specific days · override anything</span>
      </div>
      <div className="sched-month">
        <div className="sched-month-head">
          <div className="daypicker-nav">
            <button className="nav-btn" onClick={() => bumpMonth(-1)}>‹</button>
            <button className="nav-btn" onClick={() => { const d = new Date(); setMonthCursor({ y: d.getFullYear(), m: d.getMonth() }); }} style={{ width: 'auto', padding: '0 8px', borderRadius: 999 }}>now</button>
            <button className="nav-btn" onClick={() => bumpMonth(1)}>›</button>
          </div>
          <div className="h-doodle">{monthLabel}</div>
        </div>
        <div className="sched-grid">
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={'h'+i} className="month-dow">{d}</div>)}
          {matrix.map((c, i) => {
            if (c.otherMonth) return <div key={i} className="sched-cell blank" />;
            const baseOpen = state.openDays.includes(new Date(c.iso + 'T00:00:00').getDay());
            const overrideClosed = state.closedDates?.includes(c.iso);
            const overrideOpen = state.openDates?.includes(c.iso);
            const eff = CTRLS.isOpen(state, c.iso);
            return (
              <button
                key={i}
                className={`sched-cell ${eff ? 'open' : 'closed'} ${overrideClosed ? 'override-closed' : ''} ${overrideOpen ? 'override-open' : ''} ${c.iso === todayIso ? 'today' : ''}`}
                onClick={() => toggleDateOverride(c.iso)}
              >
                {c.day}
              </button>
            );
          })}
        </div>
        <div className="sched-legend">
          <span className="lg"><span className="sw" style={{ background: 'var(--mustard-soft)', border: '1px solid var(--mustard)' }}></span> open</span>
          <span className="lg"><span className="sw" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}></span> closed</span>
          <span className="lg"><span className="sw" style={{ background: 'var(--paper)', boxShadow: 'inset 0 0 0 2px var(--sage)' }}></span> opened one-off</span>
          <span className="lg"><span className="sw" style={{ background: 'var(--mustard-soft)', boxShadow: 'inset 0 0 0 2px var(--terracotta)' }}></span> closed one-off</span>
        </div>
      </div>

      <div className="asap-head" style={{ marginTop: 20 }}>
        <span className="mono dim">data</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn-mini" style={{ flex: 1 }} onClick={() => {
          if (!confirm('Clear all orders? Shop settings & profiles stay.')) return;
          setState({ ...state, orders: [] });
        }}>🗑 clear all orders</button>
        <button className="btn-mini danger" style={{ flex: 1 }} onClick={() => {
          if (!confirm('Factory reset? This wipes EVERYTHING on this device.')) return;
          CTRLS.reset(); location.reload();
        }}>⚠ factory reset</button>
      </div>

      <div className="asap-head">
        <span className="mono dim">payment & settings</span>
      </div>
      <div className="today-note-editor">
        <div className="settings-row">
          <label className="mono dim">today's note</label>
          <button
            className={`btn-mini ${state.barista?.todayNote?.enabled ? '' : 'ghost'}`}
            onClick={() => setState({
              ...state,
              barista: {
                ...state.barista,
                todayNote: { ...(state.barista?.todayNote || {}), enabled: !state.barista?.todayNote?.enabled },
              },
            })}
          >
            {state.barista?.todayNote?.enabled ? 'showing' : 'hidden'}
          </button>
        </div>
        <div className="settings-row">
          <label className="mono dim">title</label>
          <input
            className="setting-input"
            value={state.barista?.todayNote?.title || "today's note"}
            onChange={(e) => setState({
              ...state,
              barista: {
                ...state.barista,
                todayNote: { ...(state.barista?.todayNote || {}), title: e.target.value },
              },
            })}
          />
        </div>
        <div className="settings-row note-row">
          <label className="mono dim">message</label>
          <textarea
            className="setting-input"
            rows="3"
            placeholder="new beans today, holiday note, quick hello..."
            value={state.barista?.todayNote?.body || ''}
            onChange={(e) => setState({
              ...state,
              barista: {
                ...state.barista,
                todayNote: { ...(state.barista?.todayNote || {}), body: e.target.value },
              },
            })}
          />
        </div>
      </div>
      <div className="settings-row">
        <label className="mono dim">PromptPay</label>
        <input className="setting-input" value={state.barista.promptPay} onChange={(e) => setState({ ...state, barista: { ...state.barista, promptPay: e.target.value } })} />
      </div>
      <div className="settings-row">
        <label className="mono dim">shop name</label>
        <input className="setting-input" value={state.barista.shopName} onChange={(e) => setState({ ...state, barista: { ...state.barista, shopName: e.target.value } })} />
      </div>
      <div className="settings-row">
        <label className="mono dim">your name</label>
        <input className="setting-input" value={state.barista.name} onChange={(e) => setState({ ...state, barista: { ...state.barista, name: e.target.value } })} />
      </div>
      <div className="settings-row">
        <label className="mono dim">barista PIN</label>
        <input className="setting-input" value={state.barista.baristaPin} onChange={(e) => setState({ ...state, barista: { ...state.barista, baristaPin: e.target.value.replace(/\D/g, '') } })} />
      </div>
    </div>
  );
}

Object.assign(window, {
  BaristaPinGate, BaristaPocket,
});
