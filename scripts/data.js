// CTRL+S — shared data model used by all prototypes
// Persisted to localStorage by default, with optional Supabase sync for
// sharing orders between customer + barista devices.

(function () {
  const STORAGE_KEY = 'ctrls_v2';

  // === Default data ===
  const DEFAULT_OPEN_DAYS = [1, 3, 5]; // Mon, Wed, Fri
  const DEFAULT_CLOSED_DATES = [];
  const DEFAULT_OPEN_DATES = [];
  const COLOR_OPTIONS = ['mustard', 'pink', 'terracotta', 'sage', 'charcoal'];
  const ROAST_ORDER = { light: 0, medium: 1, dark: 2, 'non-coffee': 3 };
  const ROAST_OPTIONS = ['light', 'medium', 'dark', 'non-coffee'];

  const DEFAULT_SIGNATURE_MENU = [
    {
      id: 'approve',
      name: 'Approve',
      mood: '👍',
      roast: 'medium',
      available: true,
      price: 40,
      color: 'mustard',
      catStyle: 'star',
      tag: 'vanilla forward / buttery / caramel-ish',
      tagline: "Bitter but sweet at the end. Like waiting 6 hrs for a one-word: 'APPROVE.'",
    },
    {
      id: 'wfh',
      name: 'WFH',
      mood: '❤️',
      roast: 'medium',
      available: true,
      price: 40,
      color: 'pink',
      catStyle: 'happy',
      tag: 'floral / soft sweet / easygoing',
      tagline: 'Cozy enough to feel like WFH and 2PM is your nap time.',
    },
  ];

  const DEFAULT_ASAP = [
    { id: 'a1', name: 'Strawberry', roast: 'light', available: true, price: 60, notes: 'Bright and juicy like freshly picked strawberries. Sparkling finish.' },
    { id: 'a2', name: 'Chrysanthemum', roast: 'light', available: true, price: 60, notes: 'Floral and calming like a cup of chrysanthemum tea. Gently sweet.' },
    { id: 'a3', name: 'French Toast', roast: 'medium', available: true, price: 60, notes: 'Warm and buttery with hints of maple syrup. Comforting like Sunday morning.' },
    { id: 'a4', name: 'Tiramisu', roast: 'medium', available: true, price: 60, notes: 'Creamy and smooth with notes of cocoa and mascarpone.' },
    { id: 'a5', name: 'Choco Biscuit Nutty', roast: 'medium', available: true, price: 40, notes: 'Nutty and chocolatey with a buttery biscuit vibe. Super drinkable.' },
    { id: 'a6', name: 'Whisky Rum', roast: 'medium', available: true, price: 60, notes: 'Deep and boozy with a touch of whisky and rum. Bold and sophisticated.' },
    { id: 'a7', name: 'Inferno Dark Chocolate', roast: 'dark', available: true, price: 40, notes: 'Intense smoky, roasty, burnt notes in deep dark chocolate. Unapologetically dark.' },
  ];

  function seedOrders() {
    // Find the next 2 open days from today so demo faces always appear in the week view
    const today = new Date();
    const opens = [];
    for (let i = 0; i < 60 && opens.length < 2; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (DEFAULT_OPEN_DAYS.includes(d.getDay())) opens.push(isoDate(d));
    }
    const d1 = opens[0] || isoDate(today);
    const d2 = opens[1] || d1;
    return [
      { id: 'demo-1', name: 'Pim', date: d1, items: [{ type: 'menu', refId: 'wfh', qty: 1 }], status: 'queued', paid: 'paid', note: '', ts: Date.now() - 1000 * 60 * 30, avatar: { body: 'rosy', accent: 'pink', expression: 'happy', prop: 'bow' } },
      { id: 'demo-2', name: 'Top', date: d1, items: [{ type: 'asap', refId: 'a4', qty: 1 }, { type: 'menu', refId: 'approve', qty: 1 }], status: 'brewing', paid: 'paid', note: 'less ice plz', ts: Date.now() - 1000 * 60 * 12, avatar: { body: 'beige', accent: 'mustard', expression: 'sparkle', prop: 'glasses' } },
      { id: 'demo-3', name: 'Earn', date: d2, items: [{ type: 'asap', refId: 'a7', qty: 1 }], status: 'done', paid: 'paid', note: '', ts: Date.now() - 1000 * 60 * 60 * 2, avatar: { body: 'caramel', accent: 'terracotta', expression: 'smug', prop: 'sunglasses' } },
    ];
  }

  const DEFAULT_STATE = {
    openDays: DEFAULT_OPEN_DAYS,
    closedDates: DEFAULT_CLOSED_DATES,
    openDates: DEFAULT_OPEN_DATES,
    signatureMenu: DEFAULT_SIGNATURE_MENU,
    asap: DEFAULT_ASAP,
    orders: [],
    subscriptions: [],
    gifts: [],
    profiles: {}, // fake shared store · code → profile
    peopleMeta: {}, // profileId -> { hiddenFromGift, deleted }
    barista: { name: 'Boss', shopName: 'CTRL+S Coffee', promptPay: '081-234-5678', baristaPin: '1337', featuredAsap: null, todayNote: { enabled: false, title: "today's note", body: '' } },
  };

  function load() { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
  function save(_state) {} // state lives in Supabase — localStorage no longer used as primary store

  // === Optional Supabase shared state ===
  const DEFAULT_REMOTE_CONFIG = { url: '', anonKey: '', table: 'ctrls_state', rowId: 'main' };
  let remoteClientCache = null;
  let remoteClientKey = '';

  function remoteConfig() {
    const cfg = { ...DEFAULT_REMOTE_CONFIG, ...(window.CTRLS_SUPABASE || {}) };
    try {
      const saved = JSON.parse(localStorage.getItem('ctrls_supabase_config') || '{}');
      Object.assign(cfg, saved || {});
    } catch {}
    cfg.table = cfg.table || DEFAULT_REMOTE_CONFIG.table;
    cfg.rowId = cfg.rowId || DEFAULT_REMOTE_CONFIG.rowId;
    return cfg;
  }

  function remoteEnabled() {
    const cfg = remoteConfig();
    return Boolean(cfg.url && cfg.anonKey && window.supabase && window.supabase.createClient);
  }

  function remoteClient() {
    const cfg = remoteConfig();
    if (!remoteEnabled()) return null;
    const key = `${cfg.url}|${cfg.anonKey}`;
    if (!remoteClientCache || remoteClientKey !== key) {
      remoteClientCache = window.supabase.createClient(cfg.url, cfg.anonKey);
      remoteClientKey = key;
    }
    return remoteClientCache;
  }

  function normalizeState(state) {
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
      ...(state || {}),
      orders: Array.isArray(state?.orders) ? state.orders : [],
      subscriptions: Array.isArray(state?.subscriptions) ? state.subscriptions : [],
      gifts: Array.isArray(state?.gifts) ? state.gifts : [],
      profiles: state?.profiles || {},
      peopleMeta: state?.peopleMeta || {},
      barista: { ...DEFAULT_STATE.barista, ...(state?.barista || {}) },
    };
  }

  function adoptRemoteState(localState, remoteState) {
    const local = normalizeState(localState);
    const remote = normalizeState(remoteState);
    const code = activeCode();
    if (code && local.profiles?.[code] && !remote.profiles?.[code]) {
      remote.profiles = { ...remote.profiles, [code]: local.profiles[code] };
    }
    return remote;
  }

  async function pullRemoteState() {
    const client = remoteClient();
    const cfg = remoteConfig();
    if (!client) throw new Error('Supabase client not available');

    const { data, error } = await client
      .from(cfg.table)
      .select('state')
      .eq('id', cfg.rowId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const initial = normalizeState({});
      await pushRemoteState(initial);
      return { state: initial, created: true };
    }
    return { state: normalizeState(data.state), created: false };
  }

  async function pushRemoteState(state) {
    const client = remoteClient();
    const cfg = remoteConfig();
    if (!client) return { ok: false };
    const payload = {
      id: cfg.rowId,
      state: normalizeState(state),
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from(cfg.table).upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { ok: true };
  }

  // Read-after-write confirmation. MERGES the given new orders into the LATEST
  // remote state (never overwrites other people's data), pushes, then reads it
  // back to confirm the ids actually landed. Returns { ok, missing, reason }.
  async function confirmOrders(localState, orderIds) {
    const client = remoteClient();
    const cfg = remoteConfig();
    if (!client) return { ok: false, reason: 'offline', missing: orderIds || [] };
    const ids = orderIds || [];
    // 1) Pull the freshest remote so we don't clobber other devices' orders.
    const { data: current, error: pullErr } = await client
      .from(cfg.table).select('state').eq('id', cfg.rowId).maybeSingle();
    if (pullErr) throw pullErr;
    const base = (current && current.state) ? normalizeState(current.state) : normalizeState(localState);
    // 2) Append only our brand-new orders that aren't on the server yet.
    const localOrders = (localState && Array.isArray(localState.orders)) ? localState.orders : [];
    const present = new Set((base.orders || []).map((o) => o.id));
    const newOnes = localOrders.filter((o) => ids.includes(o.id) && !present.has(o.id));
    const merged = { ...base, orders: [...(base.orders || []), ...newOnes] };
    // 3) Push the merged state.
    await pushRemoteState(merged);
    // 4) Read back and verify our ids are really there.
    const { data, error } = await client
      .from(cfg.table).select('state').eq('id', cfg.rowId).maybeSingle();
    if (error) throw error;
    const remoteOrders = (data && data.state && Array.isArray(data.state.orders)) ? data.state.orders : [];
    const have = new Set(remoteOrders.map((o) => o.id));
    const missing = ids.filter((id) => !have.has(id));
    return { ok: missing.length === 0, missing, reason: missing.length ? 'missing' : 'ok' };
  }

  function subscribeRemoteState(onState, onError) {
    const client = remoteClient();
    const cfg = remoteConfig();
    if (!client) return () => {};
    const channel = client
      .channel(`ctrls-${cfg.table}-${cfg.rowId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: cfg.table, filter: `id=eq.${cfg.rowId}` },
        (payload) => {
          if (payload?.new?.state) onState(payload.new.state);
        }
      )
      .subscribe((status, err) => {
        if (err && onError) onError(err);
        if (status === 'CHANNEL_ERROR' && onError) onError(new Error('Supabase realtime channel error'));
      });
    return () => { client.removeChannel(channel); };
  }

  // === Date helpers ===
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function isoToday() {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function isoDate(d) {
    const dd = new Date(d);
    return dd.getFullYear() + '-' + pad2(dd.getMonth() + 1) + '-' + pad2(dd.getDate());
  }
  function isOpen(state, dateIso) {
    if (state.openDates && state.openDates.includes(dateIso)) return true;
    if (state.closedDates && state.closedDates.includes(dateIso)) return false;
    const dow = new Date(dateIso + 'T00:00:00').getDay();
    return state.openDays.includes(dow);
  }
  function orderCutoffForDate(dateIso) {
    const cutoff = new Date(dateIso + 'T00:00:00');
    cutoff.setDate(cutoff.getDate() - 1);
    cutoff.setHours(23, 59, 0, 0);
    return cutoff;
  }
  function canOrderDate(state, dateIso, now = Date.now()) {
    return isOpen(state, dateIso) && now < orderCutoffForDate(dateIso).getTime();
  }
  function addMonths(iso, n) {
    const d = new Date(iso + 'T00:00:00');
    const m = d.getMonth() + n;
    d.setMonth(m);
    return isoDate(d);
  }
  function daysBetween(aIso, bIso) {
    const a = new Date(aIso + 'T00:00:00');
    const b = new Date(bIso + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function menuById(state, id) { return (state.signatureMenu || DEFAULT_SIGNATURE_MENU).find((x) => x.id === id); }
  function asapById(state, id) { return state.asap.find((x) => x.id === id); }
  function priceForItem(state, item) {
    const ref = item.type === 'menu' ? menuById(state, item.refId) : asapById(state, item.refId);
    return (ref ? ref.price : 0) * (item.qty || 1);
  }
  function orderTotal(state, order) { return order.items.reduce((s, it) => s + priceForItem(state, it), 0); }
  function itemRoast(itemOrDrink) { return itemOrDrink?.roast || 'medium'; }
  function isAvailable(itemOrDrink) { return itemOrDrink?.available !== false; }
  function subscriptionCandidatesForTemplate(state, item) {
    if (!item) return [];
    if (item.type === 'random') {
      return (state.asap || [])
        .filter((a) => isAvailable(a) && itemRoast(a) === item.roast)
        .map((a) => ({ type: 'asap', refId: a.id, qty: item.qty || 1 }));
    }
    const ref = item.type === 'menu' ? menuById(state, item.refId) : asapById(state, item.refId);
    return ref && isAvailable(ref) ? [{ ...item, qty: item.qty || 1 }] : [];
  }
  function subscriptionTemplateAvailable(state, item) {
    return subscriptionCandidatesForTemplate(state, item).length > 0;
  }
  function isConfirmedOrder(order) {
    return Boolean(order && order.status !== 'cancelled' && order.paid !== 'cancelled');
  }
  function orderBelongsToProfile(order, profile) {
    if (!order || !profile) return false;
    return (order.profileId && order.profileId === profile.id) || order.name === profile.name;
  }
  function cupQty(order) {
    return (order?.items || []).reduce((s, it) => s + (it.qty || 1), 0);
  }
  function cupCountForProfile(state, profile) {
    return (state.orders || [])
      .filter((o) => isConfirmedOrder(o) && orderBelongsToProfile(o, profile))
      .reduce((s, o) => s + cupQty(o), 0);
  }
  function itemLabel(state, item) {
    const ref = item.type === 'menu' ? menuById(state, item.refId) : asapById(state, item.refId);
    return ref ? ref.name : '?';
  }
  function itemColor(state, item) {
    if (item.type === 'menu') return menuById(state, item.refId)?.color || 'mustard';
    return 'terracotta';
  }

  // === Profile / multi-profile fake server ===
  // We keep a per-device "active code" pointer, and the actual profiles live in
  // state.profiles keyed by code. This way the SAME tab can simulate a transfer
  // by switching the active pointer to another code.
  const ACTIVE_CODE_KEY = 'ctrls_active_code_v1';
  const LOCAL_PROFILE_KEY = 'ctrls_profile_v1'; // legacy single-profile fallback

  function activeCode() {
    try { return localStorage.getItem(ACTIVE_CODE_KEY) || null; } catch { return null; }
  }
  function setActiveCode(code) {
    try { if (code) localStorage.setItem(ACTIVE_CODE_KEY, code); else localStorage.removeItem(ACTIVE_CODE_KEY); } catch {}
  }
  function genCode() {
    // Friendly 6-char code: CAT-XXX where X is alphanumeric (no confusable chars).
    const chars = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return 'CAT-' + out;
  }

  const DEFAULT_AVATAR = { body: 'beige', accent: 'mustard', eyeColor: 'black', expression: 'happy', prop: 'none' };

  function newProfile(name, existingCodes = []) {
    let code; do { code = genCode(); } while (existingCodes.includes(code));
    return {
      id: code,
      code,
      name: name || '',
      cupCount: 0,
      joinedAt: Date.now(),
      orderIds: [],
      avatar: { ...DEFAULT_AVATAR },
      stats: { firstOrderDate: null },
    };
  }

  // Helpers to read/write the active profile from the shared store.
  function getActiveProfile(state) {
    const code = activeCode();
    if (!code) {
      // legacy migration: maybe there's an old single-profile in localStorage
      try {
        const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          // migrate into shared store
          const migrated = {
            ...newProfile(p.name || 'You'),
            cupCount: p.cupCount || 0,
            joinedAt: p.joinedAt || Date.now(),
            orderIds: p.orderIds || [],
            avatar: p.avatar || { ...DEFAULT_AVATAR },
          };
          state.profiles = { ...(state.profiles || {}), [migrated.code]: migrated };
          save(state);
          setActiveCode(migrated.code);
          localStorage.removeItem(LOCAL_PROFILE_KEY);
          return migrated;
        }
      } catch {}
      return null;
    }
    const found = (state.profiles || {})[code] || null;
    if (!found) return null;
    const cupsFromOrders = cupCountForProfile(state, found);
    const orderIds = (state.orders || [])
      .filter((o) => isConfirmedOrder(o) && orderBelongsToProfile(o, found))
      .map((o) => o.id);
    return {
      ...found,
      cupCount: Math.max(found.cupCount || 0, cupsFromOrders),
      orderIds: Array.from(new Set([...(found.orderIds || []), ...orderIds])),
    };
  }

  function upsertProfile(state, profile) {
    return {
      ...state,
      profiles: { ...(state.profiles || {}), [profile.code]: profile },
    };
  }

  function profileByCode(state, code) {
    return (state.profiles || {})[code] || null;
  }

  // Rank ladder
  const RANKS = [
    { key: 'newfile', label: 'CTRL+N', sub: 'new file',       min: 0,   icon: '⌘N', badge: null },
    { key: 'copy',    label: 'CTRL+C', sub: 'copy that',      min: 10,  icon: '⌘C', badge: null },
    { key: 'paste',   label: 'CTRL+V', sub: 'sticky regular', min: 30,  icon: '⌘V', badge: null },
    { key: 'undo',    label: 'CTRL+Z', sub: 'second guess',   min: 70,  icon: '⌘Z', badge: 'ring' },
    { key: 'save',    label: 'CTRL+S', sub: 'committed',      min: 150, icon: '⌘S', badge: 'crown' },
  ];

  // Avatar items unlocked per rank (cumulative — each tier adds to all previous)
  const RANK_UNLOCKS = {
    newfile: {
      body:       ['cream', 'beige', 'sand', 'calico'],
      accent:     ['mustard', 'pink', 'lemon'],
      eyeColor:   ['black', 'brown'],
      expression: ['happy', 'closed', 'sleepy', 'curious'],
      prop:       ['none', 'bow', 'collar', 'name-tag', 'star-clip', 'bandana', 'tiny-spoon', 'sticky-note', 'leaf', 'heart-pin'],
    },
    copy: {
      body:       ['caramel', 'rosy', 'mocha'],
      accent:     ['terracotta', 'coral'],
      eyeColor:   ['blue', 'rose'],
      expression: ['wink', 'sparkle', 'shy', 'blep'],
      prop:       ['beanie', 'beret', 'pencil', 'coffee', 'cursor', 'keyboard', 'tote-bag', 'washi-tape'],
    },
    paste: {
      body:       ['mint', 'sky', 'lavender'],
      accent:     ['sage', 'teal'],
      eyeColor:   ['green', 'amber', 'teal'],
      expression: ['heart', 'lol', 'grumpy', 'happy-tears'],
      prop:       ['glasses', 'headband', 'flower', 'cap', 'eyedropper', 'layers', 'clipboard', 'plant', 'mug-stack'],
    },
    undo: {
      body:       [],
      accent:     ['plum'],
      eyeColor:   ['violet'],
      expression: ['star', 'smug', 'focus'],
      prop:       ['sunglasses', 'scarf', 'headphones', 'crown', 'party-hat', 'pentool', 'lightning', 'moon', 'magic-wand'],
    },
    save: {
      body:       ['charcoal'],
      accent:     ['navy'],
      eyeColor:   [],
      expression: ['shocked', 'star-pulse', 'heart-float', 'neon-blink'],
      prop:       ['halo', 'sparkle-aura', 'rainbow', 'cmd-key', 'orbit-stars', 'steam-aura', 'bounce-badge', 'comet-tail'],
    },
  };

  const RANK_ORDER = ['newfile', 'copy', 'paste', 'undo', 'save'];

  function unlocksFor(cupCount) {
    const rank = rankFor(cupCount);
    const idx = RANK_ORDER.indexOf(rank.key);
    const out = { body: [], accent: [], eyeColor: [], expression: [], prop: [] };
    for (let i = 0; i <= idx; i++) {
      const tier = RANK_UNLOCKS[RANK_ORDER[i]];
      for (const k of Object.keys(out)) out[k] = [...out[k], ...(tier[k] || [])];
    }
    return out;
  }

  function rankFor(cupCount) {
    let r = RANKS[0];
    for (const x of RANKS) if (cupCount >= x.min) r = x;
    return r;
  }
  function nextRank(cupCount) {
    return RANKS.find((r) => r.min > cupCount) || null;
  }

  // === Subscription billing ===
  // sub: {
  //   id, profileId, name, days: [dow], itemTemplate: { [dow]: item },
  //   active, startDate (iso), nextBillDate (iso), monthlyBilled (boolean),
  //   billingHistory: [{ date, amount, period }]
  // }
  function expandSubscription(state, sub, fromIso, toIso) {
    const out = [];
    const start = new Date(fromIso + 'T00:00:00');
    const end = new Date(toIso + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = isoDate(d);
      const dow = d.getDay();
      if (!sub.days.includes(dow)) continue;
      if (!isOpen(state, iso)) continue;
      const tpl = sub.itemTemplate[dow];
      if (!tpl) continue;
      if (!subscriptionTemplateAvailable(state, tpl)) continue;
      out.push({ date: iso, item: tpl });
    }
    return out;
  }

  // Calculate next 30 days of items from this sub (for monthly billing preview).
  function previewMonthlyForSub(state, sub, fromIso) {
    const from = fromIso || isoToday();
    const to = addMonths(from, 1);
    const expanded = expandSubscription(state, sub, from, to);
    let total = 0;
    for (const { item } of expanded) {
      let price = 0;
      if (item.type === 'random') {
        // estimate using average price at that roast
        const candidates = subscriptionCandidatesForTemplate(state, item);
        price = candidates.length ? Math.round(candidates.reduce((s, candidate) => s + priceForItem(state, candidate), 0) / candidates.length) : 0;
      } else {
        price = priceForItem(state, item);
      }
      total += price;
    }
    return { total, cups: expanded.length, from, to };
  }

  // Day-of-week labels
  const DOW_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_EN_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  window.CTRLS = {
    STORAGE_KEY, ACTIVE_CODE_KEY,
    DEFAULT_SIGNATURE_MENU, DEFAULT_ASAP, DEFAULT_OPEN_DAYS,
    DEFAULT_AVATAR,
    COLOR_OPTIONS, ROAST_ORDER, ROAST_OPTIONS, RANKS, RANK_UNLOCKS, RANK_ORDER, unlocksFor,
    DOW_TH, DOW_EN, DOW_EN_SHORT,
    load, save, isoToday, isoDate, isOpen, orderCutoffForDate, canOrderDate, addMonths, daysBetween,
    remoteConfig, remoteEnabled, pullRemoteState, pushRemoteState, confirmOrders, subscribeRemoteState, adoptRemoteState,
    menuById, asapById, priceForItem, orderTotal, itemRoast, isAvailable, subscriptionCandidatesForTemplate, subscriptionTemplateAvailable, isConfirmedOrder, orderBelongsToProfile, cupQty, cupCountForProfile, itemLabel, itemColor,
    activeCode, setActiveCode, genCode, newProfile,
    getActiveProfile, upsertProfile, profileByCode,
    rankFor, nextRank,
    expandSubscription, previewMonthlyForSub,
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_CODE_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
    },
  };
})();
