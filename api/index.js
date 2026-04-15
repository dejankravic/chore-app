const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
app.use(express.json());

const DB_KEY = 'chore-db';

// ── DEFAULT DATA ──────────────────────────────────────────────────────────────

function defaultChores() {
  return [
    {id:'c1',name:'Make bed',freq:'daily',pts:3,section:'Daily',mandatory:true},
    {id:'c2',name:'Wipe kitchen counter & sink',freq:'biweekly',pts:2,section:'Weekly',mandatory:false},
    {id:'c3',name:'Wash  dishes',freq:'daily',pts:4,section:'Daily',mandatory:false},
    {id:'c4',name:'Clear all after the meal (dishwasher)',freq:'daily',pts:2,section:'Daily',mandatory:true},
    {id:'c5',name:'Tidy hallway (shoes, coats)',freq:'weekly',pts:4,section:'Weekly',mandatory:false},
    {id:'c6',name:'Take out kitchen rubbish',freq:'daily',pts:4,section:'Daily',mandatory:false},
    {id:'c7',name:'Wipe bathroom sink',freq:'weekly',pts:2,section:'Weekly',mandatory:false},
    {id:'c8',name:'Cook one household meal',freq:'weekly',pts:10,section:'Weekly',mandatory:false},
    {id:'c9',name:'Grocery shopping (with list)',freq:'weekly',pts:8,section:'Weekly',mandatory:false},
    {id:'c10',name:'Vacuum own bedroom',freq:'weekly',pts:5,section:'Weekly',mandatory:false},
    {id:'c11',name:'Vacuum living room / hallway',freq:'weekly',pts:5,section:'Weekly',mandatory:false},
    {id:'c12',name:'Clean toilet + bathroom sink',freq:'weekly',pts:9,section:'Weekly',mandatory:false},
    {id:'c14',name:'Scrub shower / bathtub',freq:'weekly',pts:8,section:'Weekly',mandatory:false},
    {id:'c16',name:'Sort & load laundry',freq:'weekly',pts:4,section:'Weekly',mandatory:false},
    {id:'c17',name:'Fold & put away own clothes',freq:'biweekly',pts:3,section:'Weekly',mandatory:false},
    {id:'c19',name:'Dust surfaces + TV unit',freq:'weekly',pts:4,section:'Weekly',mandatory:false},
    {id:'c20',name:'Clean fridge',freq:'biweekly',pts:6,section:'Less frequent',mandatory:false},
    {id:'c21',name:'Change & put to wash bed linen',freq:'monthly',pts:4,section:'Less frequent',mandatory:false},
    {id:'c22',name:'Iron household items',freq:'biweekly',pts:10,section:'Weekly',mandatory:false},
    {id:'c23',name:'Clean windows (inside)',freq:'monthly',pts:6,section:'Less frequent',mandatory:false},
    {id:'c24',name:'Deep clean oven',freq:'monthly',pts:8,section:'Less frequent',mandatory:false},
    {id:'c25',name:'Deep clean grout & tiles',freq:'monthly',pts:8,section:'Less frequent',mandatory:false},
    {id:'c26',name:'Organize pantry / cupboards',freq:'monthly',pts:6,section:'Less frequent',mandatory:false},
    {id:'c27',name:'Vacuum sofa & under cushions',freq:'biweekly',pts:5,section:'Less frequent',mandatory:false},
    {id:'xjfmx9j9',name:'Tidy own room (clothes, kitchenware)',pts:3,freq:'daily',section:'Daily',mandatory:true},
    {id:'xzs6h28a',name:'Empty dishwasher',pts:4,freq:'daily',section:'Daily',mandatory:false},
    {id:'x6zjvbwt',name:'Wipe stove',pts:3,freq:'daily',section:'Weekly',mandatory:false},
    {id:'xhtrsmjj',name:'Put all dirty clothes in washing bin',pts:3,freq:'biweekly',section:'Daily',mandatory:false},
    {id:'xqlloxzo',name:'Sweep & mop any room',pts:6,freq:'weekly',section:'Weekly',mandatory:false},
    {id:'x3mdfxvg',name:'Prepare a side-dish for family (pasta, salad...)',pts:5,freq:'biweekly',section:'Weekly',mandatory:false},
    {id:'xk5l88yz',name:'Change Bed Linen',pts:5,freq:'weekly',section:'Weekly',mandatory:false},
  ];
}

function defaultUnlocks() {
  return [
    [
      {id:'u1',name:'Coffee money (basic - 1,500 din)',tier:1,monthly:false},
      {id:'u2',name:'Shopping money (up to 8,000 din)',tier:3,monthly:false},
      {id:'u3',name:'Petrol (2,000 din)',tier:2,monthly:false},
      {id:'u4',name:'Going out money (3,000 din)',tier:2,monthly:false},
      {id:'u5',name:'Gym  and sport membership (unlimited)',tier:2,monthly:false},
      {id:'u6',name:'Tutoring / classes (unlimited)',tier:3,monthly:true},
      {id:'u7',name:'Extra petrol money (+5,000 din)',tier:3,monthly:false},
      {id:'xehtureq',name:'Extra going out money (7,000 din)',tier:3,monthly:true},
      {id:'xwyh33sg',name:'Temu purchase (up to 10,000 din)',tier:3,monthly:true},
    ],
    [
      {id:'u1',name:'Pocket money (1,500 din)',tier:1,monthly:false},
      {id:'u2',name:'Going out money (2,000 din)',tier:2,monthly:false},
      {id:'u3',name:'Basketball training 1 on 1 (unlimited)',tier:2,monthly:true},
      {id:'u4',name:'Gym  and sport membership (unlimited)',tier:2,monthly:false},
      {id:'u5',name:'Tutoring / classes (unlimited)',tier:3,monthly:true},
      {id:'u6',name:'Larger purchase including Temu (up to 10,000 din)',tier:3,monthly:true},
    ],
  ];
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  m.setHours(0, 0, 0, 0);
  return m.toISOString();
}

function defaultDB() {
  return {
    settings: {
      names: ['Katarina', 'Kosta'],
      t1: 40, t2: 65, t3: 85,
      streakTarget: 4, mandMin: 5,
      pin: '1404'
    },
    chores: defaultChores(),
    unlocks: defaultUnlocks(),
    kids: [
      { streak: 0, weekHistory: [] },
      { streak: 0, weekHistory: [] }
    ],
    week: {
      start: getWeekStart(),
      pending: [],
      approved: [{}, {}],
      approvalDates: [{}, {}]
    }
  };
}

// ── DB HELPERS ────────────────────────────────────────────────────────────────

async function readDB() {
  try {
    const { data, error } = await supabase
      .from('chore_kv')
      .select('value')
      .eq('key', DB_KEY)
      .single();
    let db = data?.value || null;
    if (!db || error) {
      db = defaultDB();
      await writeDB(db);
      return db;
    }
    if (!db.week.approvalDates) db.week.approvalDates = [{}, {}];
    const ws = getWeekStart();
    if (db.week.start !== ws) {
      archiveWeek(db);
      db.week = { start: ws, pending: [], approved: [{}, {}], approvalDates: [{}, {}] };
      await writeDB(db);
    }
    return db;
  } catch (e) {
    console.error('DB read error:', e.message);
    return defaultDB();
  }
}

async function writeDB(db) {
  await supabase
    .from('chore_kv')
    .upsert({ key: DB_KEY, value: db });
}

function archiveWeek(db) {
  const S = db.settings;
  for (let k = 0; k < 2; k++) {
    const pts = calcApprovedPts(db, k);
    const mok = checkMandatory(db, k);
    const tier = mok ? getTier(pts, S) : 0;
    if (!db.kids[k].weekHistory) db.kids[k].weekHistory = [];
    db.kids[k].weekHistory.unshift({ week: db.week.start, pts, tier, mok });
    if (db.kids[k].weekHistory.length > 20) db.kids[k].weekHistory.pop();
    db.kids[k].streak = tier === 3 ? (db.kids[k].streak || 0) + 1 : 0;
  }
}

function calcApprovedPts(db, kid) {
  let pts = 0;
  const ap = db.week.approved[kid] || {};
  Object.keys(ap).forEach(id => {
    const c = db.chores.find(x => x.id === id);
    if (c) pts += (ap[id] || 0) * c.pts;
  });
  return pts;
}

function checkMandatory(db, kid) {
  const min = db.settings.mandMin || 5;
  const mands = db.chores.filter(c => c.mandatory);
  if (!mands.length) return true;
  const ap = db.week.approved[kid] || {};
  return mands.every(c => (ap[c.id] || 0) >= min);
}

function getTier(pts, S) {
  if (pts >= S.t3) return 3;
  if (pts >= S.t2) return 2;
  if (pts >= S.t1) return 1;
  return 0;
}

function uid() {
  return 'x' + Math.random().toString(36).slice(2, 9);
}

// ── API ROUTES ────────────────────────────────────────────────────────────────

app.get('/api/state', async (req, res) => {
  res.json(await readDB());
});

app.post('/api/settings', async (req, res) => {
  const db = await readDB();
  db.settings = { ...db.settings, ...req.body };
  await writeDB(db);
  res.json({ ok: true });
});

app.post('/api/log', async (req, res) => {
  const { kid, choreId } = req.body;
  const db = await readDB();
  if (!db.week.pending) db.week.pending = [];
  if (!db.week.approvalDates) db.week.approvalDates = [{}, {}];

  const chore = db.chores.find(c => c.id === choreId);
  const now = new Date();

  // toggle / stale-pending logic
  const idx = db.week.pending.findIndex(p => p.kid === kid && p.choreId === choreId);
  if (idx >= 0) {
    const existingEntry = db.week.pending[idx];
    const pendingDate = new Date(existingEntry.time).toDateString();
    const isStaleDaily = chore && chore.freq === 'daily' && pendingDate !== now.toDateString();
    if (isStaleDaily) {
      // Stale daily pending from a previous day — replace with today's
      db.week.pending.splice(idx, 1);
      // fall through to add fresh pending entry below
    } else {
      // Same-day pending (or non-daily): toggle it off
      db.week.pending.splice(idx, 1);
      await writeDB(db);
      return res.json({ ok: true, action: 'removed' });
    }
  }

  const approvedCount = (db.week.approved[kid] || {})[choreId] || 0;
  const lastDate = (db.week.approvalDates[kid] || {})[choreId];

  if (chore) {
    if (chore.freq === 'daily') {
      if (lastDate === now.toDateString()) {
        return res.json({ ok: false, reason: 'already_approved_today' });
      }
    } else if (chore.freq === 'weekly') {
      if (approvedCount >= 1) {
        return res.json({ ok: false, reason: 'already_approved_this_week' });
      }
    } else if (chore.freq === 'biweekly') {
      if (approvedCount >= 2) {
        return res.json({ ok: false, reason: 'max_biweekly_reached' });
      }
    } else if (chore.freq === 'monthly') {
      if (lastDate) {
        const last = new Date(lastDate);
        if (last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear()) {
          return res.json({ ok: false, reason: 'already_approved_this_month' });
        }
      }
    }
  }

  db.week.pending.push({ kid, choreId, time: now.toISOString() });
  await writeDB(db);
  res.json({ ok: true, action: 'added' });
});

app.post('/api/approve', async (req, res) => {
  const { pin, index } = req.body;
  const db = await readDB();
  if (pin !== db.settings.pin) return res.status(401).json({ ok: false, reason: 'wrong_pin' });
  const p = db.week.pending[index];
  if (!p) return res.status(400).json({ ok: false, reason: 'not_found' });
  if (!db.week.approved[p.kid]) db.week.approved[p.kid] = {};
  if (!db.week.approvalDates) db.week.approvalDates = [{}, {}];
  if (!db.week.approvalDates[p.kid]) db.week.approvalDates[p.kid] = {};
  db.week.approved[p.kid][p.choreId] = (db.week.approved[p.kid][p.choreId] || 0) + 1;
  // Store the date the kid LOGGED the chore, not when the parent approved it.
  // This ensures daily chores reset correctly the next day.
  db.week.approvalDates[p.kid][p.choreId] = new Date(p.time).toDateString();
  db.week.pending.splice(index, 1);
  await writeDB(db);
  res.json({ ok: true });
});

app.post('/api/reject', async (req, res) => {
  const { pin, index } = req.body;
  const db = await readDB();
  if (pin !== db.settings.pin) return res.status(401).json({ ok: false, reason: 'wrong_pin' });
  db.week.pending.splice(index, 1);
  await writeDB(db);
  res.json({ ok: true });
});

app.post('/api/chore', async (req, res) => {
  const { id, name, pts, freq, section, mandatory } = req.body;
  const db = await readDB();
  if (id) {
    const c = db.chores.find(x => x.id === id);
    if (c) { c.name = name; c.pts = pts; c.freq = freq; c.section = section; c.mandatory = mandatory; }
  } else {
    db.chores.push({ id: uid(), name, pts, freq, section, mandatory });
  }
  await writeDB(db);
  res.json({ ok: true, chores: db.chores });
});

app.delete('/api/chore/:id', async (req, res) => {
  const db = await readDB();
  db.chores = db.chores.filter(c => c.id !== req.params.id);
  await writeDB(db);
  res.json({ ok: true });
});

app.post('/api/unlock', async (req, res) => {
  const { kid, id, name, tier, monthly } = req.body;
  const db = await readDB();
  if (!db.unlocks[kid]) db.unlocks[kid] = [];
  if (id) {
    const u = db.unlocks[kid].find(x => x.id === id);
    if (u) { u.name = name; u.tier = tier; u.monthly = monthly; }
    else db.unlocks[kid].push({ id, name, tier, monthly });
  } else {
    db.unlocks[kid].push({ id: uid(), name, tier, monthly });
  }
  await writeDB(db);
  res.json({ ok: true });
});

app.delete('/api/unlock/:kid/:id', async (req, res) => {
  const db = await readDB();
  const kid = parseInt(req.params.kid);
  db.unlocks[kid] = (db.unlocks[kid] || []).filter(u => u.id !== req.params.id);
  await writeDB(db);
  res.json({ ok: true });
});

app.post('/api/reset-week', async (req, res) => {
  const { pin } = req.body;
  const db = await readDB();
  if (pin !== db.settings.pin) return res.status(401).json({ ok: false });
  db.week = { start: getWeekStart(), pending: [], approved: [{}, {}], approvalDates: [{}, {}] };
  await writeDB(db);
  res.json({ ok: true });
});

app.post('/api/reset-all', async (req, res) => {
  const { pin } = req.body;
  const db = await readDB();
  if (pin !== db.settings.pin) return res.status(401).json({ ok: false });
  await writeDB(defaultDB());
  res.json({ ok: true });
});

module.exports = app;
