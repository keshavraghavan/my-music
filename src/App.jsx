'use client';

import React from 'react';
import sx from './sx.js';

// ─────────────────────────────────────────────────────────────────────────────
// Static data. Ported verbatim from the design source (Retro Music Social).
// ─────────────────────────────────────────────────────────────────────────────

const ACCENTS = ['#B7472A', '#3F6B4F', '#C9A227', '#2F5673'];

const PEOPLE = {
  theok: { id: 'theok', name: 'Theo K.', handle: 'theok_fm', initials: 'TK', color: '#3F6B4F', service: 'Apple Music', city: 'Bushwick, Brooklyn', private: false },
  samo: { id: 'samo', name: 'Sam O.', handle: 'sam_radio', initials: 'SO', color: '#2F5673', service: 'Spotify', city: 'Astoria, Queens', private: true },
  marisolv: { id: 'marisolv', name: 'Marisol V.', handle: 'marisolv', initials: 'MV', color: '#B7472A', service: 'Spotify', city: 'Sunset Park, Brooklyn', private: false },
  priyad: { id: 'priyad', name: 'Priya D.', handle: 'priyad', initials: 'PD', color: '#C9A227', service: 'Apple Music', city: 'Jackson Heights, Queens', private: false },
  devonp: { id: 'devonp', name: 'Devon P.', handle: 'devonp', initials: 'DP', color: '#3F6B4F', service: 'Spotify', city: 'Crown Heights, Brooklyn', private: false },
  wrenl: { id: 'wrenl', name: 'Wren L.', handle: 'wrenl', initials: 'WL', color: '#2F5673', service: 'Apple Music', city: 'Inwood, Manhattan', private: false },
  irisn: { id: 'irisn', name: 'Iris N.', handle: 'irisn', initials: 'IN', color: '#C9A227', service: 'Spotify', city: 'Greenpoint, Brooklyn', private: false },
  cassr: { id: 'cassr', name: 'Cass R.', handle: 'cassr', initials: 'CR', color: '#B7472A', service: 'Apple Music', city: 'Woodside, Queens', private: false },
};
const DIRECTORY_HANDLES = Object.values(PEOPLE).map((p) => p.handle).concat(['junotapes']);

const TRACK_POOL = [
  { title: 'Terracotta', artist: 'Coral June' },
  { title: 'Amber Line', artist: 'Marigold Static' },
  { title: 'Honeycomb', artist: 'Peach Radio' },
  { title: 'Slow Fade', artist: 'Hollow Coast' },
  { title: 'Rooftop Static', artist: 'The Nightbus' },
  { title: 'Bodega Light', artist: 'Slow Salt' },
  { title: 'Copper & Rust', artist: 'Meridian Low' },
  { title: 'Last Train Home', artist: 'Wilder Sun' },
];

// ─────────────────────────────────────────────────────────────────────────────
// App — the single-page application. All screens, state and interactions live
// here (mirrors the design's `Component extends DCLogic`). React.Component gives
// us the same state/setState/render lifecycle the design logic assumed.
// ─────────────────────────────────────────────────────────────────────────────

export default class App extends React.Component {
  state = {
    route: 'landing',
    onboardStep: 0,
    ob: { name: 'Juno Reyes', handle: 'junotapes2', bio: '' },
    modules: { feed: true, nowPlaying: true, chart: true, monthly: true, receipt: true, recs: true, friendsList: true },
    chartTab: 'songs',
    order: ['feed', 'nowPlaying', 'chart', 'recs', 'monthly', 'receipt', 'friendsList'],
    expanded: { feed: false, nowPlaying: true, chart: true, recs: false, monthly: false, receipt: false, friendsList: false },
    dragKey: null,
    editMode: false,
    spacing: 'comfortable',
    monthlyTracks: [
      { id: 'mt1', title: 'Amber Line', artist: 'Marigold Static' },
      { id: 'mt2', title: 'Slow Fade', artist: 'Hollow Coast' },
      { id: 'mt3', title: 'Rooftop Static', artist: 'The Nightbus' },
      { id: 'mt4', title: 'Terracotta', artist: 'Coral June' },
      { id: 'mt5', title: 'Last Train Home', artist: 'Wilder Sun' },
    ],

    connected: { spotify: false, apple: false },
    nowPlayingSource: 'spotify',
    isPrivateProfile: false,

    relations: { theok: 'friend', marisolv: 'friend', priyad: 'friend', devonp: 'friend', irisn: 'friend', cassr: 'friend', samo: 'none', wrenl: 'none' },
    friendSearch: '',
    openFriendMenu: null,
    viewingFriendId: null,

    recs: [
      { id: 'r1', personId: 'marisolv', text: "This one's been on repeat since the block party, you need it on your page.", track: 'Amber Line', artist: 'Marigold Static', status: 'active' },
      { id: 'r2', personId: 'theok', text: 'Sunday morning energy, thought of you immediately.', track: 'Low Tide Radio', artist: 'Hollow Coast', status: 'active' },
      { id: 'r3', personId: 'priyad', text: 'For the commute home when the light hits just right.', track: 'Rooftop Static', artist: 'The Nightbus', status: 'active' },
    ],
    openRecMenu: null,

    notifications: [
      { id: 'n1', type: 'rec', text: 'Theo K. left you a recommendation — Low Tide Radio.', time: '2H AGO', read: false },
      { id: 'n2', type: 'chart', text: 'Your July chart updated — Terracotta jumped to #4.', time: '2D AGO', read: false },
      { id: 'n3', type: 'friend', text: 'You and Priya D. became friends.', time: '1D AGO', read: true },
      { id: 'n4', type: 'playlist', text: 'Marisol V. added a track to Rooftop Party 2026.', time: '3D AGO', read: true },
    ],

    theoWall: [
      { id: 'w1', personId: 'marisolv', text: "This one's been on repeat since the block party.", track: 'Amber Line', artist: 'Marigold Static', time: '2D AGO' },
      { id: 'w2', personId: 'priyad', text: 'For the commute home when the light hits just right.', track: 'Rooftop Static', artist: 'The Nightbus', time: '4D AGO' },
    ],

    playlistTracks: [
      { id: 't1', title: 'Terracotta', artist: 'Coral June', addedBy: ['Juno Reyes', 'Theo K.'] },
      { id: 't2', title: 'Amber Line', artist: 'Marigold Static', addedBy: ['Marisol V.'] },
      { id: 't3', title: 'Honeycomb', artist: 'Peach Radio', addedBy: ['Juno Reyes'] },
    ],

    compose: { open: false, mode: 'recommend', targetFriendId: null, target: 'wall', query: '', selectedIdx: null, note: '', addAnyway: false },
    confirm: { open: false, kind: '', title: '', message: '', confirmLabel: 'CONFIRM', payload: null },
    toast: null,

    accountForm: { name: 'Juno Reyes', handle: 'junotapes', bio: 'Vinyl hoarder. Sunday soul. Currently on a slow-jam kick.' },
    settingsTab: 'account',
    notifPrefs: { recs: true, friendActivity: true, chart: false },
  };

  goTo(route) { this.setState({ route, editMode: false }); }
  showToast(msg) {
    this.setState({ toast: msg });
    setTimeout(() => this.setState((s) => (s.toast === msg ? { toast: null } : null)), 2600);
  }

  toggle(key) { this.setState((s) => ({ modules: { ...s.modules, [key]: !s.modules[key] } })); }
  toggleEditMode() { this.setState((s) => ({ editMode: !s.editMode })); }
  toggleExpand(key) { this.setState((s) => ({ expanded: { ...s.expanded, [key]: !s.expanded[key] } })); }
  removeMonthlyTrack(id) { this.setState((s) => ({ monthlyTracks: s.monthlyTracks.filter((t) => t.id !== id) })); }
  setSpacing(key) { this.setState({ spacing: key }); }
  dropOn(targetKey) {
    this.setState((s) => {
      const dragKey = s.dragKey;
      if (!dragKey || dragKey === targetKey) return null;
      const order = s.order.filter((k) => k !== dragKey);
      order.splice(order.indexOf(targetKey), 0, dragKey);
      return { order, dragKey: null };
    });
  }

  // onboarding
  setObField(field, val) { this.setState((s) => ({ ob: { ...s.ob, [field]: val } })); }
  obNext() {
    const s = this.state;
    if (s.onboardStep === 2 && DIRECTORY_HANDLES.includes(s.ob.handle)) return;
    if (s.onboardStep === 4) { this.goTo('home'); return; }
    this.setState({ onboardStep: s.onboardStep + 1 });
  }
  obBack() {
    if (this.state.onboardStep === 0) return;
    this.setState((s) => ({ onboardStep: s.onboardStep - 1 }));
  }

  // friends
  viewFriend(id) {
    const p = PEOPLE[id];
    const rel = this.state.relations[id];
    this.setState({ viewingFriendId: id, route: p.private && rel !== 'friend' ? 'friend-locked' : 'friend' });
  }
  requestFollow() {
    const id = this.state.viewingFriendId;
    this.setState((s) => ({ relations: { ...s.relations, [id]: 'requested' } }));
  }
  addFriend(id) {
    this.setState((s) => ({ relations: { ...s.relations, [id]: 'friend' } }));
    this.showToast(`You're now friends with ${PEOPLE[id].name}.`);
  }
  toggleFriendMenu(id) { this.setState((s) => ({ openFriendMenu: s.openFriendMenu === id ? null : id })); }
  askRemoveFriend(id) {
    this.setState({ openFriendMenu: null, confirm: { open: true, kind: 'remove', title: 'Remove friend?', message: `${PEOPLE[id].name} will no longer see your page updates, and you won't see theirs.`, confirmLabel: 'REMOVE', payload: id } });
  }
  askBlockFriend(id) {
    this.setState({ openFriendMenu: null, confirm: { open: true, kind: 'block', title: 'Block this person?', message: `${PEOPLE[id].name} won't be able to view your page or send you recommendations.`, confirmLabel: 'BLOCK', payload: id } });
  }

  // recs
  toggleRecMenu(id) { this.setState((s) => ({ openRecMenu: s.openRecMenu === id ? null : id })); }
  hideRec(id) { this.setState((s) => ({ recs: s.recs.map((r) => (r.id === id ? { ...r, status: 'hidden' } : r)), openRecMenu: null })); }
  askReportRec(id) {
    this.setState({ confirm: { open: true, kind: 'report-rec', title: 'Report this recommendation?', message: "We'll take a look and remove it from your page if it violates guidelines.", confirmLabel: 'REPORT', payload: id }, openRecMenu: null });
  }

  // notifications
  markAllRead() { this.setState((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })); }
  clickNotification(n) {
    this.setState((s) => ({ notifications: s.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }));
    if (n.type === 'rec' || n.type === 'chart') this.goTo('home');
    else if (n.type === 'playlist') this.goTo('playlist');
    else this.goTo('friends');
  }

  // compose
  openComposeForFriend() {
    this.setState({ compose: { open: true, mode: 'recommend', targetFriendId: this.state.viewingFriendId, target: 'wall', query: '', selectedIdx: null, note: '', addAnyway: false } });
  }
  openComposeForPlaylist() {
    this.setState({ compose: { open: true, mode: 'addTrack', targetFriendId: null, target: 'playlist', query: '', selectedIdx: null, note: '', addAnyway: false } });
  }
  openComposeForMonthly() {
    if (this.state.monthlyTracks.length >= 10) { this.showToast('Your Top 10 is full — remove one first.'); return; }
    this.setState({ compose: { open: true, mode: 'monthlyPick', targetFriendId: null, target: 'wall', query: '', selectedIdx: null, note: '', addAnyway: false } });
  }
  closeCompose() { this.setState((s) => ({ compose: { ...s.compose, open: false } })); }
  setComposeQuery(v) { this.setState((s) => ({ compose: { ...s.compose, query: v, selectedIdx: null, addAnyway: false } })); }
  selectTrack(idx) { this.setState((s) => ({ compose: { ...s.compose, selectedIdx: idx, addAnyway: false } })); }
  setComposeNote(v) { this.setState((s) => ({ compose: { ...s.compose, note: v } })); }
  setComposeTarget(t) { this.setState((s) => ({ compose: { ...s.compose, target: t, addAnyway: false } })); }
  toggleAddAnyway() { this.setState((s) => ({ compose: { ...s.compose, addAnyway: !s.compose.addAnyway } })); }

  postRecommendation() {
    const s = this.state;
    const results = this.filteredTracks(s.compose.query);
    const track = s.compose.selectedIdx != null ? results[s.compose.selectedIdx] : null;
    if (!track) { this.showToast('Pick a track first.'); return; }
    if (s.compose.mode === 'monthlyPick') {
      if (s.monthlyTracks.some((t) => t.title.toLowerCase() === track.title.toLowerCase())) { this.showToast('Already in your Top 10.'); return; }
      if (s.monthlyTracks.length >= 10) { this.showToast('Your Top 10 is full — remove one first.'); return; }
      this.setState((prev) => ({ monthlyTracks: [...prev.monthlyTracks, { id: 'mt' + Date.now(), title: track.title, artist: track.artist }], compose: { ...prev.compose, open: false } }));
      this.showToast(`Added ${track.title} to your Top 10.`);
      return;
    }
    const dup = s.playlistTracks.find((t) => t.title.toLowerCase() === track.title.toLowerCase());
    if (s.compose.target === 'playlist' && dup && !s.compose.addAnyway) {
      this.setState((prev) => ({ compose: { ...prev.compose, showDup: true } }));
      return;
    }
    if (s.compose.target === 'playlist') {
      if (dup) {
        this.setState((prev) => ({ playlistTracks: prev.playlistTracks.map((t) => (t.id === dup.id ? { ...t, addedBy: [...t.addedBy, 'Juno Reyes'] } : t)), compose: { ...prev.compose, open: false } }));
      } else {
        this.setState((prev) => ({ playlistTracks: [...prev.playlistTracks, { id: 'pt' + Date.now(), title: track.title, artist: track.artist, addedBy: ['Juno Reyes'] }], compose: { ...prev.compose, open: false } }));
      }
      this.showToast(`Added ${track.title} to Rooftop Party 2026.`);
    } else {
      this.setState((prev) => ({ theoWall: [{ id: 'w' + Date.now(), personId: 'me', text: s.compose.note || '', track: track.title, artist: track.artist, time: 'JUST NOW' }, ...prev.theoWall], compose: { ...prev.compose, open: false } }));
      this.showToast(`Posted to ${PEOPLE[s.compose.targetFriendId].name}'s wall.`);
    }
  }

  filteredTracks(query) {
    if (!query) return TRACK_POOL;
    const q = query.toLowerCase();
    return TRACK_POOL.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }

  // services / settings
  askDisconnect(service) {
    this.setState({ confirm: { open: true, kind: 'disconnect-' + service, title: `Disconnect ${service === 'spotify' ? 'Spotify' : 'Apple Music'}?`, message: 'Now Playing and charts pause for this service until you reconnect.', confirmLabel: 'DISCONNECT', payload: service } });
  }
  connectService(service) { this.setState((s) => ({ connected: { ...s.connected, [service]: true } })); }
  togglePrivate() { this.setState((s) => ({ isPrivateProfile: !s.isPrivateProfile })); }
  setAccountField(field, val) { this.setState((s) => ({ accountForm: { ...s.accountForm, [field]: val } })); }
  saveAccount() {
    const s = this.state;
    if (DIRECTORY_HANDLES.includes(s.accountForm.handle) && s.accountForm.handle !== 'junotapes') return;
    this.showToast('Profile updated.');
  }
  askDeleteAccount() {
    this.setState({ confirm: { open: true, kind: 'delete-account', title: 'Delete your account?', message: 'This permanently removes your page, charts, and recommendations for everyone. This cannot be undone.', confirmLabel: 'DELETE', payload: null } });
  }
  toggleNotifPref(key) { this.setState((s) => ({ notifPrefs: { ...s.notifPrefs, [key]: !s.notifPrefs[key] } })); }

  closeConfirm() { this.setState({ confirm: { open: false, kind: '', title: '', message: '', confirmLabel: '', payload: null } }); }
  confirmAction() {
    const c = this.state.confirm;
    switch (c.kind) {
      case 'remove':
        this.setState((s) => ({ relations: { ...s.relations, [c.payload]: 'none' } }));
        this.showToast(`Removed ${PEOPLE[c.payload].name} as a friend.`);
        break;
      case 'block':
        this.setState((s) => ({ relations: { ...s.relations, [c.payload]: 'blocked' } }));
        this.showToast(`Blocked ${PEOPLE[c.payload].name}.`);
        break;
      case 'report-rec':
        this.setState((s) => ({ recs: s.recs.map((r) => (r.id === c.payload ? { ...r, status: 'reported' } : r)) }));
        this.showToast("Reported. We'll take a look.");
        break;
      case 'disconnect-spotify':
        this.setState((s) => ({ connected: { ...s.connected, spotify: false } }));
        this.showToast('Spotify disconnected.');
        break;
      case 'disconnect-apple':
        this.setState((s) => ({ connected: { ...s.connected, apple: false } }));
        this.showToast('Apple Music disconnected.');
        break;
      case 'delete-account':
        this.setState({ route: 'landing' });
        break;
      default:
        break;
    }
    this.closeConfirm();
  }

  renderVals() {
    const s = this.state;
    const route = s.route;
    const showShell = !['landing', 'onboard'].includes(route);

    const navKeys = ['home', 'friends', 'playlist', 'notifications', 'settings'];
    const navBg = {}, navColor = {};
    navKeys.forEach((k) => {
      const active = route === k || (k === 'friends' && (route === 'friend' || route === 'friend-locked'));
      navBg[k] = active ? '#1E1B18' : 'transparent';
      navColor[k] = active ? '#F2ECDF' : '#1E1B18';
    });

    const m = s.modules;
    const defs = [
      { key: 'feed', label: 'Line Updates (Feed)' },
      { key: 'nowPlaying', label: 'Now Playing' },
      { key: 'chart', label: 'Top 50/100 Chart' },
      { key: 'monthly', label: "This Month's Top 10" },
      { key: 'receipt', label: 'Transit Receipt' },
      { key: 'recs', label: 'Friend Recommendations' },
      { key: 'friendsList', label: 'Friends List' },
    ];
    const moduleList = defs.map((d, i) => ({
      ...d, color: ACCENTS[i % 4], enabled: m[d.key],
      trackColor: m[d.key] ? '#1E1B18' : '#F2ECDF', knobColor: m[d.key] ? '#F2ECDF' : '#1E1B18',
      knobLeft: m[d.key] ? '21px' : '1px', knobLeftSm: m[d.key] ? '19px' : '1px',
      toggle: () => this.toggle(d.key),
    }));

    const topSongs = [
      { title: 'Amber Line', artist: 'Marigold Static' }, { title: 'Slow Fade', artist: 'Hollow Coast' },
      { title: 'Rooftop Static', artist: 'The Nightbus' }, { title: 'Terracotta', artist: 'Coral June' },
      { title: 'Last Train Home', artist: 'Wilder Sun' }, { title: 'Honeycomb', artist: 'Peach Radio' },
      { title: 'Bodega Light', artist: 'Slow Salt' }, { title: 'Copper & Rust', artist: 'Meridian Low' },
    ].map((t, i) => ({ ...t, rank: i + 1, bulletColor: ACCENTS[i % 4] }));
    const topAlbums = [
      { title: 'Ridgewood Nights', artist: 'Marigold Static' }, { title: 'Low Tide Radio', artist: 'Hollow Coast' },
      { title: 'Elevated', artist: 'The Nightbus' }, { title: 'Sundial', artist: 'Coral June' },
      { title: 'Departures', artist: 'Wilder Sun' }, { title: 'Honeycomb EP', artist: 'Peach Radio' },
    ].map((t, i) => ({ ...t, rank: i + 1, bulletColor: ACCENTS[i % 4] }));
    const receiptTracks = topSongs.slice(0, 5).map((t, i) => ({ stop: `0${i + 1}`, title: t.title, artist: t.artist, mins: `${14 - i * 2}m` }));
    const monthlyDisplay = s.monthlyTracks.map((t, i) => ({ ...t, rank: i + 1, remove: () => this.removeMonthlyTrack(t.id) }));
    const chartItems = s.chartTab === 'songs' ? topSongs : topAlbums;

    const keys = ['feed', 'nowPlaying', 'chart', 'recs', 'monthly', 'receipt', 'friendsList'];
    const order = {}; keys.forEach((k) => { order[k] = s.order.indexOf(k); });
    const drag = {};
    keys.forEach((k) => {
      drag[`dragStart_${k}`] = () => this.setState({ dragKey: k });
      drag[`drop_${k}`] = (e) => { e.preventDefault(); this.dropOn(k); };
    });
    const span = {}; const expandLabel = {}; const toggleExpand = {};
    keys.forEach((k) => {
      span[k] = s.expanded[k] ? 'span 2' : 'span 1';
      expandLabel[`expandLabel_${k}`] = s.expanded[k] ? '⤡ COLLAPSE' : '⤢ EXPAND';
      toggleExpand[`toggleExpand_${k}`] = () => this.toggleExpand(k);
    });
    const spacingMap = { compact: 16, comfortable: 28, spacious: 44 };
    const spacingProps = {};
    ['compact', 'comfortable', 'spacious'].forEach((k) => {
      const active = s.spacing === k;
      spacingProps[`setSpacing_${k}`] = () => this.setSpacing(k);
      spacingProps[`spacingBg_${k}`] = active ? '#1E1B18' : 'transparent';
      spacingProps[`spacingColor_${k}`] = active ? '#F2ECDF' : '#6b6156';
    });

    const noServiceConnected = !s.connected.spotify && !s.connected.apple;
    const bothConnected = s.connected.spotify && s.connected.apple;
    const activeRecs = s.recs.filter((r) => r.status === 'active');
    const friendRecs = activeRecs.map((r) => ({
      ...r, name: PEOPLE[r.personId].name.toUpperCase(), color: PEOPLE[r.personId].color, initials: PEOPLE[r.personId].initials,
      menuOpen: s.openRecMenu === r.id, toggleMenu: () => this.toggleRecMenu(r.id),
      hide: () => this.hideRec(r.id), report: () => this.askReportRec(r.id),
    }));

    const friendIds = Object.keys(s.relations).filter((id) => s.relations[id] === 'friend');
    const friendsListDisplay = friendIds.map((id) => ({ ...PEOPLE[id], view: () => this.viewFriend(id) }));

    const q = s.friendSearch.trim().toLowerCase();
    const directoryPool = Object.values(PEOPLE).filter((p) => s.relations[p.id] !== 'friend' && s.relations[p.id] !== 'blocked');
    const filtered = q ? directoryPool.filter((p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)) : directoryPool.slice(0, 3);
    const directoryResults = filtered.map((p) => {
      const rel = s.relations[p.id];
      let actionLabel = '+ ADD', action = () => this.addFriend(p.id), actionBg = 'transparent', actionColor = '#1E1B18', actionBorder = 'rgba(30,27,24,0.4)';
      if (p.private && rel !== 'friend') {
        actionLabel = rel === 'requested' ? 'REQUESTED' : 'REQUEST';
        action = rel === 'requested' ? () => {} : () => { this.setState((s2) => ({ relations: { ...s2.relations, [p.id]: 'requested' } })); };
      }
      if (rel === 'requested') { actionBg = '#1E1B18'; actionColor = '#F2ECDF'; actionBorder = '#1E1B18'; }
      return { ...p, isPrivate: p.private, view: () => this.viewFriend(p.id), action, actionLabel, actionBg, actionColor, actionBorder };
    });

    const friendsManage = friendIds.map((id) => ({
      ...PEOPLE[id], view: () => this.viewFriend(id), menuOpen: s.openFriendMenu === id,
      toggleMenu: () => this.toggleFriendMenu(id), remove: () => this.askRemoveFriend(id), block: () => this.askBlockFriend(id),
    }));

    const viewingFriend = s.viewingFriendId ? PEOPLE[s.viewingFriendId] : PEOPLE.theok;
    const friendWall = s.viewingFriendId === 'theok' ? s.theoWall.map((w) => ({
      ...w, name: w.personId === 'me' ? 'JUNO REYES' : PEOPLE[w.personId].name.toUpperCase(),
      color: w.personId === 'me' ? '#B7472A' : PEOPLE[w.personId].color, initials: w.personId === 'me' ? 'JR' : PEOPLE[w.personId].initials,
      border: w.time === 'JUST NOW' ? '#3F6B4F' : 'rgba(30,27,24,0.3)', bg: w.time === 'JUST NOW' ? 'rgba(63,107,79,0.06)' : 'transparent',
    })) : [];
    const requestRel = s.relations[s.viewingFriendId] || 'none';

    const notificationsDisplay = s.notifications.map((n) => ({
      ...n, weight: n.read ? '400' : '700', bg: n.read ? 'transparent' : 'rgba(183,71,42,0.05)', dotColor: n.read ? 'transparent' : '#B7472A',
      click: () => this.clickNotification(n),
    }));
    const unreadCount = s.notifications.filter((n) => !n.read).length;

    const composeResults = this.filteredTracks(s.compose.query).map((t, i) => ({
      ...t, selectedBg: s.compose.selectedIdx === i ? 'rgba(63,107,79,0.08)' : 'transparent',
      check: s.compose.selectedIdx === i ? '✓' : '', select: () => this.selectTrack(i),
    }));
    const selectedTrack = s.compose.selectedIdx != null ? this.filteredTracks(s.compose.query)[s.compose.selectedIdx] : null;
    const dupTrack = selectedTrack ? s.playlistTracks.find((t) => t.title.toLowerCase() === selectedTrack.title.toLowerCase()) : null;
    const showDuplicateWarning = s.compose.target === 'playlist' && !!dupTrack && !!selectedTrack;

    const playlistTracksDisplay = s.playlistTracks.map((t) => ({
      ...t, addedByLabel: t.addedBy.join(' + ').toUpperCase(), isConflict: t.addedBy.length > 1,
    }));

    return {
      showShell, navBg, navColor, hasUnread: unreadCount > 0, unreadCount,
      isLanding: route === 'landing', isOnboard: route === 'onboard', isHome: route === 'home',
      isFriends: route === 'friends', isFriendPublic: route === 'friend', isFriendLocked: route === 'friend-locked',
      isNotifications: route === 'notifications', isSettings: route === 'settings', isPlaylist: route === 'playlist',
      goHome: () => this.goTo('home'), goFriends: () => this.goTo('friends'), goPlaylist: () => this.goTo('playlist'),
      goNotifications: () => this.goTo('notifications'), goSettings: () => this.goTo('settings'),
      goSettingsServices: () => { this.setState({ settingsTab: 'services' }); this.goTo('settings'); },
      startOnboarding: () => this.setState({ route: 'onboard', onboardStep: 0 }),

      obStepNum: s.onboardStep + 1,
      obStep0: s.onboardStep === 0, obStep1: s.onboardStep === 1, obStep2: s.onboardStep === 2, obStep3: s.onboardStep === 3, obStep4: s.onboardStep === 4,
      ob: s.ob, setObName: (e) => this.setObField('name', e.target.value), setObBio: (e) => this.setObField('bio', e.target.value),
      setObHandle: (e) => this.setObField('handle', e.target.value),
      obConnectSpotify: () => this.connectService('spotify'), obConnectApple: () => this.connectService('apple'),
      obSpotifyLabel: s.connected.spotify ? 'CONNECTED ✓' : 'CONNECT', obSpotifyBg: s.connected.spotify ? '#3F6B4F' : 'transparent', obSpotifyColor: s.connected.spotify ? '#F2ECDF' : '#1E1B18',
      obAppleLabel: s.connected.apple ? 'CONNECTED ✓' : 'CONNECT', obAppleBg: s.connected.apple ? '#B7472A' : 'transparent', obAppleColor: s.connected.apple ? '#F2ECDF' : '#1E1B18',
      obHandleTaken: DIRECTORY_HANDLES.includes(s.ob.handle), obHandleBorder: DIRECTORY_HANDLES.includes(s.ob.handle) ? '#B7472A' : 'rgba(30,27,24,0.3)',
      obNoService: noServiceConnected,
      obBack: () => this.obBack(), obBackLabel: s.onboardStep === 0 ? '' : '← BACK', obBackColor: s.onboardStep === 0 ? 'transparent' : '#6b6156',
      obNext: () => this.obNext(), obNextLabel: s.onboardStep === 4 ? 'ENTER YOUR PAGE →' : (s.onboardStep === 0 ? "LET'S GO →" : (s.onboardStep === 1 ? 'CONTINUE →' : (s.onboardStep === 2 ? 'CONTINUE →' : 'CONTINUE →'))),
      obNextOpacity: (s.onboardStep === 2 && DIRECTORY_HANDLES.includes(s.ob.handle)) ? 0.4 : 1,

      modules: m, moduleList, order, span, ...expandLabel, ...toggleExpand, ...drag, ...spacingProps, gapPx: spacingMap[s.spacing],
      editMode: s.editMode, toggleEditMode: () => this.toggleEditMode(),
      editButtonLabel: s.editMode ? 'DONE EDITING' : 'EDIT PAGE', editButtonBg: s.editMode ? '#1E1B18' : 'transparent', editButtonColor: s.editMode ? '#F2ECDF' : '#1E1B18',
      cardCursor: s.editMode ? 'grab' : 'default', onDragOver: (e) => e.preventDefault(), onDragEnd: () => this.setState({ dragKey: null }),
      chartItems, receiptTracks, monthlyDisplay, hasMonthlyTracks: s.monthlyTracks.length > 0,
      openComposeForMonthly: () => this.openComposeForMonthly(),
      monthlyAddLabel: s.monthlyTracks.length >= 10 ? 'TOP 10 FULL' : '+ ADD A TRACK',
      chartTab: s.chartTab, setChartTab_songs: () => this.setState({ chartTab: 'songs' }), setChartTab_albums: () => this.setState({ chartTab: 'albums' }),
      songsTabBg: s.chartTab === 'songs' ? '#1E1B18' : 'transparent', songsTabColor: s.chartTab === 'songs' ? '#F2ECDF' : '#6b6156',
      albumsTabBg: s.chartTab === 'albums' ? '#1E1B18' : 'transparent', albumsTabColor: s.chartTab === 'albums' ? '#F2ECDF' : '#6b6156',
      receiptDashes: '-'.repeat(38),
      feedItems: [
        { text: 'Theo K. left you a recommendation — Low Tide Radio.', time: '2H AGO', color: '#3F6B4F' },
        { text: 'Marisol V. added Amber Line to their Top 10.', time: '5H AGO', color: '#B7472A' },
        { text: 'You and Priya D. became friends.', time: '1D AGO', color: '#C9A227' },
        { text: 'Your July chart updated — Terracotta jumped to #4.', time: '2D AGO', color: '#2F5673' },
      ],
      nowPlaying: { track: 'Terracotta', artist: 'Coral June', album: 'Sundial', progressPct: '43%', updated: 'UPDATED JUL 20, 8:57 PM' },
      nowPlayingSourceLabel: s.nowPlayingSource === 'spotify' ? 'Spotify' : 'Apple Music',
      noServiceConnected, bothConnected, setSourceSpotify: () => this.setState({ nowPlayingSource: 'spotify' }), setSourceApple: () => this.setState({ nowPlayingSource: 'apple' }),
      isPrivateProfile: s.isPrivateProfile,
      friendCount: friendIds.length, hasFriends: friendIds.length > 0, friendsListDisplay,
      hasActiveRecs: friendRecs.length > 0, friendRecs,

      friendSearch: s.friendSearch, setFriendSearch: (e) => this.setState({ friendSearch: e.target.value }),
      searchIsEmpty: q === '', searchHasResults: directoryResults.length > 0, directoryResults, friendsManage,

      friend: {
        ...viewingFriend, wall: friendWall, wallLabel: viewingFriend.id === 'theok' ? 'HIS WALL' : 'THEIR WALL',
      },
      openComposeForFriend: () => this.openComposeForFriend(),
      requestFollow: () => this.requestFollow(), requestLabel: requestRel === 'requested' ? 'REQUEST SENT' : 'REQUEST TO FOLLOW',
      requestBg: requestRel === 'requested' ? '#1E1B18' : 'transparent', requestColor: requestRel === 'requested' ? '#F2ECDF' : '#1E1B18',

      notificationsDisplay, markAllRead: () => this.markAllRead(),

      tabBg: { account: s.settingsTab === 'account' ? '#1E1B18' : 'transparent', services: s.settingsTab === 'services' ? '#1E1B18' : 'transparent', privacy: s.settingsTab === 'privacy' ? '#1E1B18' : 'transparent', notifs: s.settingsTab === 'notifs' ? '#1E1B18' : 'transparent' },
      tabColor: { account: s.settingsTab === 'account' ? '#F2ECDF' : '#1E1B18', services: s.settingsTab === 'services' ? '#F2ECDF' : '#1E1B18', privacy: s.settingsTab === 'privacy' ? '#F2ECDF' : '#1E1B18', notifs: s.settingsTab === 'notifs' ? '#F2ECDF' : '#1E1B18' },
      setSettingsTab_account: () => this.setState({ settingsTab: 'account' }), setSettingsTab_services: () => this.setState({ settingsTab: 'services' }),
      setSettingsTab_privacy: () => this.setState({ settingsTab: 'privacy' }), setSettingsTab_notifs: () => this.setState({ settingsTab: 'notifs' }),
      settingsIsAccount: s.settingsTab === 'account', settingsIsServices: s.settingsTab === 'services', settingsIsPrivacy: s.settingsTab === 'privacy', settingsIsNotifs: s.settingsTab === 'notifs',

      accountForm: s.accountForm, setAccountName: (e) => this.setAccountField('name', e.target.value), setAccountBio: (e) => this.setAccountField('bio', e.target.value),
      setAccountHandle: (e) => this.setAccountField('handle', e.target.value),
      accountHandleTaken: DIRECTORY_HANDLES.includes(s.accountForm.handle) && s.accountForm.handle !== 'junotapes',
      accountHandleBorder: (DIRECTORY_HANDLES.includes(s.accountForm.handle) && s.accountForm.handle !== 'junotapes') ? '#B7472A' : 'rgba(30,27,24,0.3)',
      saveAccount: () => this.saveAccount(), askDeleteAccount: () => this.askDeleteAccount(),

      spotifyStatus: s.connected.spotify ? 'CONNECTED' : 'NOT CONNECTED', appleStatus: s.connected.apple ? 'CONNECTED' : 'NOT CONNECTED',
      spotifyBtnLabel: s.connected.spotify ? 'DISCONNECT' : 'CONNECT', spotifyBtnBg: s.connected.spotify ? 'transparent' : '#1E1B18', spotifyBtnColor: s.connected.spotify ? '#1E1B18' : '#F2ECDF',
      appleBtnLabel: s.connected.apple ? 'DISCONNECT' : 'CONNECT', appleBtnBg: s.connected.apple ? 'transparent' : '#1E1B18', appleBtnColor: s.connected.apple ? '#1E1B18' : '#F2ECDF',
      spotifyAction: () => (s.connected.spotify ? this.askDisconnect('spotify') : this.connectService('spotify')),
      appleAction: () => (s.connected.apple ? this.askDisconnect('apple') : this.connectService('apple')),

      togglePrivate: () => this.togglePrivate(), privateTrackColor: s.isPrivateProfile ? '#1E1B18' : '#F2ECDF', privateKnobColor: s.isPrivateProfile ? '#F2ECDF' : '#1E1B18', privateKnobLeft: s.isPrivateProfile ? '21px' : '1px',

      notifPrefsList: [
        { key: 'recs', label: 'New recommendations' }, { key: 'friendActivity', label: 'Friend activity' }, { key: 'chart', label: 'Chart updates' },
      ].map((np) => ({ ...np, trackColor: s.notifPrefs[np.key] ? '#1E1B18' : '#F2ECDF', knobColor: s.notifPrefs[np.key] ? '#F2ECDF' : '#1E1B18', knobLeft: s.notifPrefs[np.key] ? '19px' : '1px', toggle: () => this.toggleNotifPref(np.key) })),

      playlistContributorCount: new Set(s.playlistTracks.flatMap((t) => t.addedBy)).size,
      playlistTracksDisplay, openComposeForPlaylist: () => this.openComposeForPlaylist(),

      compose: { ...s.compose, isRecommend: s.compose.mode === 'recommend', showDuplicateWarning },
      composeTitle: s.compose.mode === 'recommend' ? `New Recommendation → ${viewingFriend.name}` : (s.compose.mode === 'monthlyPick' ? 'Add to Your Top 10' : 'Add Track → Rooftop Party 2026'),
      closeCompose: () => this.closeCompose(), setComposeQuery: (e) => this.setComposeQuery(e.target.value), composeResults,
      setComposeNote: (e) => this.setComposeNote(e.target.value),
      setComposeTargetWall: () => this.setComposeTarget('wall'), setComposeTargetPlaylist: () => this.setComposeTarget('playlist'),
      targetWallBorder: s.compose.target === 'wall' ? '#1E1B18' : 'rgba(30,27,24,0.35)', targetWallDot: s.compose.target === 'wall' ? '#1E1B18' : 'transparent', targetWallShadow: s.compose.target === 'wall' ? 'inset 0 0 0 3px #F2ECDF' : 'none',
      targetPlaylistBorder: s.compose.target === 'playlist' ? '#1E1B18' : 'rgba(30,27,24,0.35)', targetPlaylistDot: s.compose.target === 'playlist' ? '#1E1B18' : 'transparent', targetPlaylistShadow: s.compose.target === 'playlist' ? 'inset 0 0 0 3px #F2ECDF' : 'none',
      duplicateName: dupTrack ? dupTrack.addedBy[dupTrack.addedBy.length - 1] : '', toggleAddAnyway: () => this.toggleAddAnyway(),
      addAnywayLabel: s.compose.addAnyway ? 'WILL ADD ANYWAY ✓' : 'ADD ANYWAY',
      postRecommendation: () => this.postRecommendation(), composeSubmitLabel: s.compose.mode === 'recommend' ? 'POST RECOMMENDATION →' : (s.compose.mode === 'monthlyPick' ? 'ADD TO TOP 10 →' : 'ADD TO PLAYLIST →'),

      confirm: s.confirm, closeConfirm: () => this.closeConfirm(), confirmAction: () => this.confirmAction(),
      confirmBtnBg: (s.confirm.kind === 'block' || s.confirm.kind === 'delete-account' || s.confirm.kind === 'report-rec') ? '#B7472A' : '#1E1B18',

      toast: s.toast,
    };
  }

  render() {
    const v = this.renderVals();
    return (
      <div style={sx('background:#F2ECDF;min-height:100vh;color:#1E1B18;position:relative')}>

        {/* ===================== APP NAV (logged-in shell) ===================== */}
        {v.showShell && (
          <div style={sx('border-bottom:1px solid rgba(30,27,24,0.35);background:#F2ECDF;position:sticky;top:0;z-index:20')}>
            <div style={sx('max-width:1200px;margin:0 auto;padding:14px 40px;display:flex;align-items:center;gap:28px;flex-wrap:wrap')}>
              <div onClick={v.goHome} style={sx("font:700 22px 'Tinos';cursor:pointer;flex:none")}>MyMusic.</div>
              <div style={sx('display:flex;gap:4px;flex:1;flex-wrap:wrap')}>
                <div onClick={v.goHome} style={sx(`font:700 11px 'JetBrains Mono';letter-spacing:0.05em;padding:8px 12px;cursor:pointer;background:${v.navBg.home};color:${v.navColor.home}`)}>HOME</div>
                <div onClick={v.goFriends} style={sx(`font:700 11px 'JetBrains Mono';letter-spacing:0.05em;padding:8px 12px;cursor:pointer;background:${v.navBg.friends};color:${v.navColor.friends}`)}>FRIENDS</div>
                <div onClick={v.goPlaylist} style={sx(`font:700 11px 'JetBrains Mono';letter-spacing:0.05em;padding:8px 12px;cursor:pointer;background:${v.navBg.playlist};color:${v.navColor.playlist}`)}>PLAYLIST</div>
                <div onClick={v.goNotifications} style={sx(`font:700 11px 'JetBrains Mono';letter-spacing:0.05em;padding:8px 12px;cursor:pointer;background:${v.navBg.notifications};color:${v.navColor.notifications};display:flex;align-items:center;gap:6px`)}>NOTIFICATIONS{v.hasUnread && (<span style={sx("width:16px;height:16px;border-radius:50%;background:#B7472A;color:#F2ECDF;font:700 9px 'Arimo';display:flex;align-items:center;justify-content:center")}>{v.unreadCount}</span>)}</div>
                <div onClick={v.goSettings} style={sx(`font:700 11px 'JetBrains Mono';letter-spacing:0.05em;padding:8px 12px;cursor:pointer;background:${v.navBg.settings};color:${v.navColor.settings}`)}>SETTINGS</div>
              </div>
              <span style={sx("width:30px;height:30px;border-radius:50%;background:#1E1B18;color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 11px 'Tinos';flex:none")}>JR</span>
            </div>
          </div>
        )}

        {/* ===================== LANDING ===================== */}
        {v.isLanding && (
          <div style={sx('min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:repeating-linear-gradient(135deg,#B7472A 0 3px,#F2ECDF 3px 3px,#F2ECDF 3px 60px,#3F6B4F 60px 63px,#F2ECDF 63px 120px)')}>
            <div style={sx('background:#F2ECDF;padding:44px 60px;border:1px solid rgba(30,27,24,0.35)')}>
              <div style={sx("font:700 60px/1 'Tinos';text-align:center")}>MyMusic.</div>
              <div style={sx("font:400 13px 'Arimo';color:#6b6156;text-align:center;margin-top:12px;letter-spacing:0.04em")}>YOUR PAGE ｜ YOUR CHARTS ｜ YOUR FRIENDS' PICKS</div>
              <div onClick={v.startOnboarding} style={sx("margin-top:22px;background:#1E1B18;color:#F2ECDF;font:700 12px 'JetBrains Mono';text-align:center;padding:14px;letter-spacing:0.08em;cursor:pointer")}>GET STARTED →</div>
            </div>
          </div>
        )}

        {/* ===================== ONBOARDING ===================== */}
        {v.isOnboard && (
          <div style={sx('min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px')}>
            <div style={sx('width:560px;border:1px solid rgba(30,27,24,0.35);background:#F2ECDF')}>
              <div style={sx("height:30px;border-bottom:1px solid rgba(30,27,24,0.35);display:flex;align-items:center;justify-content:space-between;padding:0 16px;font:600 10.5px 'JetBrains Mono';color:#6b6156")}>
                <span>mymusic.page/setup</span><span>STEP {v.obStepNum} / 5</span>
              </div>
              <div style={sx('padding:36px 40px;min-height:380px;display:flex;flex-direction:column;justify-content:center')}>

                {v.obStep0 && (
                  <div style={sx('text-align:center')}>
                    <div style={sx("font:700 34px 'Tinos';margin-bottom:8px")}>Welcome aboard</div>
                    <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;margin-bottom:18px")}>Five stops: welcome, connect your service, build your page, choose your modules, and you're running.</div>
                  </div>
                )}

                {v.obStep1 && (
                  <>
                    <div style={sx("font:700 22px 'Tinos';margin-bottom:4px")}>Link your music</div>
                    <div style={sx("font:400 12.5px/1.5 'Arimo';color:#6b6156;margin-bottom:14px")}>Connect at least one to power Now Playing, your charts, and your monthly fare receipt. You can skip, but your page runs empty until you connect.</div>
                    <div style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:14px 18px;margin-bottom:10px')}>
                      <span style={sx("width:30px;height:30px;border-radius:50%;background:#3F6B4F;color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none")}>S</span>
                      <div style={sx('flex:1')}><div style={sx("font:700 14px 'Arimo'")}>Spotify</div><div style={sx("font:400 11px 'JetBrains Mono';color:#6b6156")}>REAL-TIME PLAYS + CHARTS</div></div>
                      <div onClick={v.obConnectSpotify} style={sx(`background:${v.obSpotifyBg};color:${v.obSpotifyColor};border:1px solid #1E1B18;font:700 11px 'JetBrains Mono';padding:9px 16px;letter-spacing:0.05em;cursor:pointer`)}>{v.obSpotifyLabel}</div>
                    </div>
                    <div style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:14px 18px;margin-bottom:14px')}>
                      <span style={sx("width:30px;height:30px;border-radius:50%;background:#B7472A;color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none")}>A</span>
                      <div style={sx('flex:1')}><div style={sx("font:700 14px 'Arimo'")}>Apple Music</div><div style={sx("font:400 11px 'JetBrains Mono';color:#6b6156")}>BACKUP LISTENING SOURCE</div></div>
                      <div onClick={v.obConnectApple} style={sx(`background:${v.obAppleBg};color:${v.obAppleColor};border:1px solid #1E1B18;font:700 11px 'JetBrains Mono';padding:9px 16px;letter-spacing:0.05em;cursor:pointer`)}>{v.obAppleLabel}</div>
                    </div>
                  </>
                )}

                {v.obStep2 && (
                  <>
                    <div style={sx('display:flex;gap:28px;align-items:center;margin-bottom:10px')}>
                      <div style={sx("width:90px;height:90px;border-radius:50%;border:1px dashed rgba(30,27,24,0.4);display:flex;align-items:center;justify-content:center;font:600 10px 'JetBrains Mono';color:#6b6156;text-align:center;flex:none")}>ADD<br />PHOTO</div>
                      <div style={sx("font:700 22px 'Tinos'")}>Build your page</div>
                    </div>
                    <div style={sx("font:600 10px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:4px")}>NAME</div>
                    <input value={v.ob.name} onChange={v.setObName} style={sx("border:none;border-bottom:1px solid rgba(30,27,24,0.3);padding:8px 2px;font:700 15px 'Tinos';margin-bottom:12px;background:transparent;width:100%;box-sizing:border-box")} />
                    <div style={sx("font:600 10px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:4px")}>HANDLE</div>
                    <input value={v.ob.handle} onChange={v.setObHandle} style={sx(`border:none;border-bottom:1px solid ${v.obHandleBorder};padding:8px 2px;font:500 13px 'JetBrains Mono';margin-bottom:4px;background:transparent;width:100%;box-sizing:border-box`)} />
                    {v.obHandleTaken && (<div style={sx("font:600 11px 'JetBrains Mono';color:#B7472A;margin-bottom:8px")}>@{v.ob.handle} is already taken — try another.</div>)}
                    {!v.obHandleTaken && (<div style={sx('height:19px;margin-bottom:8px')}></div>)}
                    <div style={sx("font:600 10px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:4px")}>BIO</div>
                    <input value={v.ob.bio} onChange={v.setObBio} placeholder="Vinyl hoarder. Sunday soul." style={sx("border:none;border-bottom:1px solid rgba(30,27,24,0.3);padding:8px 2px;font:400 13px 'Arimo';background:transparent;width:100%;box-sizing:border-box")} />
                  </>
                )}

                {v.obStep3 && (
                  <>
                    <div style={sx("font:700 22px 'Tinos';margin-bottom:2px")}>What's on your page?</div>
                    <div style={sx("font:400 12px 'Arimo';color:#6b6156;margin-bottom:10px")}>Toggle anytime from settings.</div>
                    {v.moduleList.map((m) => (
                      <div key={m.key} style={sx('display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px dotted rgba(30,27,24,0.3)')}>
                        <span style={sx(`width:8px;height:8px;border-radius:50%;background:${m.color};flex:none`)}></span>
                        <span style={sx("flex:1;font:600 13px 'Arimo'")}>{m.label}</span>
                        <div onClick={m.toggle} style={sx(`width:34px;height:18px;border:1px solid rgba(30,27,24,0.4);position:relative;cursor:pointer;background:${m.trackColor}`)}>
                          <div style={sx(`width:12px;height:12px;background:${m.knobColor};position:absolute;top:2px;left:${m.knobLeftSm};transition:left 0.15s`)}></div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {v.obStep4 && (
                  <div style={sx('text-align:center')}>
                    <span style={sx("width:60px;height:60px;border-radius:50%;border:2px solid #3F6B4F;display:flex;align-items:center;justify-content:center;font:700 28px 'Tinos';color:#3F6B4F;margin:0 auto 14px")}>✓</span>
                    <div style={sx("font:700 22px 'Tinos'")}>Your page is live</div>
                    <div style={sx("font:500 12px 'JetBrains Mono';color:#6b6156;margin-top:4px")}>mymusic.page/{v.ob.handle}</div>
                    {v.obNoService && (<div style={sx("font:400 11.5px/1.5 'Arimo';color:#B7472A;margin-top:14px;max-width:360px;margin-left:auto;margin-right:auto")}>No music service connected yet — Now Playing and your charts will stay empty until you connect one in Settings.</div>)}
                  </div>
                )}

              </div>
              <div style={sx('border-top:1px solid rgba(30,27,24,0.35);padding:16px 40px;display:flex;justify-content:space-between;align-items:center')}>
                <span onClick={v.obBack} style={sx(`font:700 11px 'JetBrains Mono';color:${v.obBackColor};cursor:pointer;letter-spacing:0.05em`)}>{v.obBackLabel}</span>
                <span onClick={v.obNext} style={sx(`background:#1E1B18;color:#F2ECDF;font:700 11px 'JetBrains Mono';padding:11px 22px;letter-spacing:0.05em;cursor:pointer;opacity:${v.obNextOpacity}`)}>{v.obNextLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================== HOME ===================== */}
        {v.isHome && (
          <div style={sx('max-width:1200px;margin:0 auto;padding:30px 40px 60px')}>

            {v.noServiceConnected && (
              <div style={sx('border:1px solid #B7472A;background:rgba(183,71,42,0.08);padding:12px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px')}>
                <span style={sx("font:600 12px 'Arimo';color:#1E1B18")}>No music service connected — Now Playing and charts are paused.</span>
                <span onClick={v.goSettingsServices} style={sx("font:700 11px 'JetBrains Mono';color:#B7472A;cursor:pointer;text-decoration:underline")}>CONNECT A SERVICE →</span>
              </div>
            )}

            <div style={sx('border:1px solid rgba(30,27,24,0.35)')}>
              <div style={sx('display:flex;align-items:center;gap:20px;padding:26px 32px;border-bottom:1px solid rgba(30,27,24,0.35)')}>
                <span style={sx("width:76px;height:76px;border-radius:50%;background:#1E1B18;color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 26px 'Tinos';flex:none")}>JR</span>
                <div style={sx('flex:1')}>
                  <div style={sx("font:700 26px 'Tinos'")}>Juno Reyes</div>
                  <div style={sx("font:500 12px 'JetBrains Mono';color:#6b6156;letter-spacing:0.03em")}>@JUNOTAPES ｜ RIDGEWOOD, QUEENS {v.isPrivateProfile && (<>｜ 🔒 PRIVATE</>)}</div>
                </div>
                <div style={sx("font:400 13px 'Tinos';font-style:italic;color:#6b6156;max-width:260px;text-align:right")}>“Vinyl hoarder. Sunday soul. Currently on a slow-jam kick.”</div>
                <div onClick={v.toggleEditMode} style={sx(`font:700 11px 'JetBrains Mono';border:1px solid rgba(30,27,24,0.4);padding:8px 14px;cursor:pointer;flex:none;background:${v.editButtonBg};color:${v.editButtonColor}`)}>{v.editButtonLabel}</div>
              </div>

              <div style={sx('padding:16px 32px;border-bottom:1px solid rgba(30,27,24,0.35);display:flex;gap:24px')}>
                <span onClick={v.goFriends} style={sx("font:700 11px 'JetBrains Mono';letter-spacing:0.04em;cursor:pointer;color:#1E1B18")}>FRIENDS ｜ {v.friendCount} →</span>
                <span onClick={v.goPlaylist} style={sx("font:700 11px 'JetBrains Mono';letter-spacing:0.04em;cursor:pointer;color:#1E1B18")}>SHARED PLAYLIST →</span>
              </div>

              <div style={sx(`padding:32px 32px 24px;display:grid;grid-template-columns:repeat(2,1fr);gap:${v.gapPx}px;align-items:start`)}>

                {v.modules.feed && (
                  <div draggable={v.editMode} onDragStart={v.dragStart_feed} onDragOver={v.onDragOver} onDrop={v.drop_feed} onDragEnd={v.onDragEnd} style={sx(`order:${v.order.feed};grid-column:${v.span.feed};position:relative;cursor:${v.cardCursor};border:1px solid rgba(30,27,24,0.3);padding:22px 24px`)}>
                    {v.editMode && (
                      <>
                        <span onClick={v.toggleExpand_feed} style={sx("position:absolute;top:12px;right:38px;font:700 9px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;border:1px solid #3F6B4F;padding:2px 6px")} title="Toggle widget size">{v.expandLabel_feed}</span>
                        <span style={sx("position:absolute;top:12px;right:14px;font:700 13px 'Arimo';color:rgba(30,27,24,0.35)")} title="Drag to move">✥</span>
                      </>
                    )}
                    <span style={sx("font:700 15px 'Tinos'")}>Line Updates</span>
                    {v.feedItems.map((fi, i) => (
                      <div key={i} style={sx('display:flex;gap:12px;padding:12px 0;border-bottom:1px dotted rgba(30,27,24,0.3)')}>
                        <span style={sx(`width:20px;height:20px;border-radius:50%;background:${fi.color};flex:none;margin-top:2px`)}></span>
                        <div style={sx('flex:1')}>
                          <div style={sx("font:400 13px/1.5 'Arimo'")}>{fi.text}</div>
                          <div style={sx("font:500 10px 'JetBrains Mono';color:#6b6156;margin-top:3px;letter-spacing:0.03em")}>{fi.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {v.modules.nowPlaying && (
                  <div draggable={v.editMode} onDragStart={v.dragStart_nowPlaying} onDragOver={v.onDragOver} onDrop={v.drop_nowPlaying} onDragEnd={v.onDragEnd} style={sx(`order:${v.order.nowPlaying};grid-column:${v.span.nowPlaying};position:relative;cursor:${v.cardCursor};border:1px solid rgba(30,27,24,0.3);padding:22px 24px 18px`)}>
                    {v.editMode && (
                      <>
                        <span onClick={v.toggleExpand_nowPlaying} style={sx("position:absolute;top:12px;right:38px;font:700 9px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;border:1px solid #3F6B4F;padding:2px 6px")} title="Toggle widget size">{v.expandLabel_nowPlaying}</span>
                        <span style={sx("position:absolute;top:12px;right:14px;font:700 13px 'Arimo';color:rgba(30,27,24,0.35)")} title="Drag to move">✥</span>
                      </>
                    )}
                    {v.noServiceConnected && (
                      <>
                        <span style={sx("font:700 15px 'Tinos'")}>Now Playing</span>
                        <div style={sx('padding:30px 0;text-align:center')}>
                          <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;margin-bottom:10px")}>Connect Spotify or Apple Music to show what you're listening to.</div>
                          <span onClick={v.goSettingsServices} style={sx("font:700 11px 'JetBrains Mono';color:#3F6B4F;text-decoration:underline;cursor:pointer")}>CONNECT A SERVICE →</span>
                        </div>
                      </>
                    )}
                    {!v.noServiceConnected && (
                      <>
                        <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:2px')}>
                          <div style={sx('display:flex;align-items:center;gap:7px')}>
                            <span style={sx("font:700 12px 'Arimo'")}>{v.nowPlayingSourceLabel}</span>
                            <span style={sx('width:6px;height:6px;border-radius:50%;background:#3F6B4F;display:inline-block;box-shadow:0 0 0 3px rgba(63,107,79,0.18);margin-left:4px')}></span>
                            <span style={sx("font:700 10.5px 'JetBrains Mono';color:#3F6B4F;letter-spacing:0.06em")}>PLAYING NOW</span>
                          </div>
                        </div>
                        {v.bothConnected && (
                          <div style={sx("border:1px solid #C9A227;background:rgba(201,162,39,0.1);padding:8px 12px;margin:10px 0;font:600 11px 'Arimo'")}>Spotify and Apple Music disagree on what's playing — showing:
                            <span onClick={v.setSourceSpotify} style={sx("text-decoration:underline;cursor:pointer;margin-left:4px;font:700 11px 'JetBrains Mono'")}>SPOTIFY</span> /
                            <span onClick={v.setSourceApple} style={sx("text-decoration:underline;cursor:pointer;font:700 11px 'JetBrains Mono'")}>APPLE</span>
                          </div>
                        )}
                        <div style={sx('height:1px;background:rgba(30,27,24,0.3);margin:12px 0 18px')}></div>
                        <div style={sx('display:flex;gap:18px;align-items:flex-start')}>
                          <div style={sx('width:76px;height:76px;border-radius:8px;background:linear-gradient(135deg,#C9A227,#B7472A);flex:none')}></div>
                          <div style={sx('flex:1;min-width:0;padding-top:2px')}>
                            <div style={sx("font:400 22px/1.2 'Tinos';white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{v.nowPlaying.track}</div>
                            <div style={sx("font:600 11.5px 'JetBrains Mono';color:#6b6156;letter-spacing:0.03em;margin-top:6px;text-transform:uppercase")}>{v.nowPlaying.artist}</div>
                            <div style={sx("font:400 11.5px 'JetBrains Mono';color:#6b6156;font-style:italic")}>{v.nowPlaying.album}</div>
                          </div>
                        </div>
                        <div style={sx('margin-top:16px')}>
                          <div style={sx('height:3px;background:rgba(30,27,24,0.12)')}>
                            <div style={sx(`height:100%;width:${v.nowPlaying.progressPct};background:#3F6B4F`)}></div>
                          </div>
                        </div>
                        <div style={sx('height:1px;background:repeating-linear-gradient(90deg,rgba(30,27,24,0.3) 0 3px,transparent 3px 7px);margin:16px 0 12px')}></div>
                        <div style={sx('display:flex;justify-content:space-between;align-items:center')}>
                          <span style={sx("font:500 10.5px 'JetBrains Mono';color:#6b6156")}>{v.nowPlaying.updated}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {v.modules.chart && (
                  <div draggable={v.editMode} onDragStart={v.dragStart_chart} onDragOver={v.onDragOver} onDrop={v.drop_chart} onDragEnd={v.onDragEnd} style={sx(`order:${v.order.chart};grid-column:${v.span.chart};position:relative;cursor:${v.cardCursor};border:1px solid rgba(30,27,24,0.3);padding:22px 24px`)}>
                    {v.editMode && (
                      <>
                        <span onClick={v.toggleExpand_chart} style={sx("position:absolute;top:12px;right:38px;font:700 9px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;border:1px solid #3F6B4F;padding:2px 6px")} title="Toggle widget size">{v.expandLabel_chart}</span>
                        <span style={sx("position:absolute;top:12px;right:14px;font:700 13px 'Arimo';color:rgba(30,27,24,0.35)")} title="Drag to move">✥</span>
                      </>
                    )}
                    {v.noServiceConnected && (
                      <>
                        <span style={sx("font:700 15px 'Tinos'")}>Top 50 — The Chart</span>
                        <div style={sx("padding:26px 0;text-align:center;font:400 13px/1.6 'Arimo';color:#6b6156")}>No listening data yet. Charts build once a service is connected.</div>
                      </>
                    )}
                    {!v.noServiceConnected && (
                      <>
                        <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:16px')}>
                          <span style={sx("font:700 15px 'Tinos'")}>Top 50 — The Chart</span>
                          <div style={sx('display:flex;gap:0;border:1px solid rgba(30,27,24,0.4)')}>
                            <div onClick={v.setChartTab_songs} style={sx(`padding:6px 16px;font:700 11px 'JetBrains Mono';cursor:pointer;background:${v.songsTabBg};color:${v.songsTabColor}`)}>SONGS</div>
                            <div onClick={v.setChartTab_albums} style={sx(`padding:6px 16px;font:700 11px 'JetBrains Mono';cursor:pointer;background:${v.albumsTabBg};color:${v.albumsTabColor};border-left:1px solid rgba(30,27,24,0.4)`)}>ALBUMS</div>
                          </div>
                        </div>
                        {v.chartItems.map((c, i) => (
                          <div key={i} style={sx('display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px dotted rgba(30,27,24,0.3)')}>
                            <span style={sx(`width:26px;height:26px;border-radius:50%;background:${c.bulletColor};color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none`)}>{c.rank}</span>
                            <span style={sx("flex:1;font:700 13.5px 'Tinos';white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{c.title}</span>
                            <span style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>{c.artist}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {v.modules.recs && (
                  <div draggable={v.editMode} onDragStart={v.dragStart_recs} onDragOver={v.onDragOver} onDrop={v.drop_recs} onDragEnd={v.onDragEnd} style={sx(`order:${v.order.recs};grid-column:${v.span.recs};position:relative;cursor:${v.cardCursor};border:1px solid rgba(30,27,24,0.3);padding:22px 24px`)}>
                    {v.editMode && (
                      <>
                        <span onClick={v.toggleExpand_recs} style={sx("position:absolute;top:12px;right:38px;font:700 9px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;border:1px solid #3F6B4F;padding:2px 6px")} title="Toggle widget size">{v.expandLabel_recs}</span>
                        <span style={sx("position:absolute;top:12px;right:14px;font:700 13px 'Arimo';color:rgba(30,27,24,0.35)")} title="Drag to move">✥</span>
                      </>
                    )}
                    <span style={sx("font:700 15px 'Tinos'")}>Friend Recommendations</span>
                    {v.hasActiveRecs && v.friendRecs.map((r) => (
                      <div key={r.id} style={sx('display:flex;gap:12px;padding:14px 0;border-bottom:1px dotted rgba(30,27,24,0.3)')}>
                        <span style={sx(`width:36px;height:36px;border-radius:50%;background:${r.color};flex:none;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';color:#F2ECDF`)}>{r.initials}</span>
                        <div style={sx('flex:1')}>
                          <div style={sx('display:flex;justify-content:space-between;align-items:baseline')}>
                            <div style={sx("font:600 12px 'JetBrains Mono';letter-spacing:0.02em")}>{r.name} <span style={sx('color:#6b6156;font-weight:400')}>left a rec</span></div>
                            <span onClick={r.toggleMenu} style={sx("font:700 14px 'Arimo';color:#6b6156;cursor:pointer;padding:0 4px")}>⋮</span>
                          </div>
                          <div style={sx("font:400 13.5px/1.5 'Tinos';font-style:italic;margin:4px 0 8px")}>“{r.text}”</div>
                          <div style={sx('display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(30,27,24,0.3);padding:5px 10px')}>
                            <span style={sx("font:700 11.5px 'Arimo'")}>{r.track}</span>
                            <span style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>· {r.artist}</span>
                          </div>
                          {r.menuOpen && (
                            <div style={sx('display:flex;gap:14px;margin-top:8px')}>
                              <span onClick={r.hide} style={sx("font:700 10.5px 'JetBrains Mono';color:#6b6156;cursor:pointer;text-decoration:underline")}>HIDE</span>
                              <span onClick={r.report} style={sx("font:700 10.5px 'JetBrains Mono';color:#B7472A;cursor:pointer;text-decoration:underline")}>REPORT</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!v.hasActiveRecs && (
                      <div style={sx('padding:26px 0;text-align:center')}>
                        <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;margin-bottom:8px")}>No recommendations yet.</div>
                        <span onClick={v.goFriends} style={sx("font:700 11px 'JetBrains Mono';color:#3F6B4F;text-decoration:underline;cursor:pointer")}>FIND FRIENDS TO GET RECS →</span>
                      </div>
                    )}
                  </div>
                )}

                {v.modules.monthly && (
                  <div draggable={v.editMode} onDragStart={v.dragStart_monthly} onDragOver={v.onDragOver} onDrop={v.drop_monthly} onDragEnd={v.onDragEnd} style={sx(`order:${v.order.monthly};grid-column:${v.span.monthly};position:relative;cursor:${v.cardCursor};border:1px solid rgba(30,27,24,0.3)`)}>
                    {v.editMode && (
                      <>
                        <span onClick={v.toggleExpand_monthly} style={sx("position:absolute;top:47px;right:14px;font:700 9px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;border:1px solid #3F6B4F;background:#F2ECDF;padding:2px 6px;z-index:2")} title="Toggle widget size">{v.expandLabel_monthly}</span>
                        <span style={sx("position:absolute;top:12px;right:14px;font:700 13px 'Arimo';color:rgba(242,236,223,0.4);z-index:1")} title="Drag to move">✥</span>
                      </>
                    )}
                    <div style={sx("background:#1E1B18;color:#F2ECDF;padding:12px 64px 12px 20px;display:flex;justify-content:space-between;align-items:baseline")}>
                      <span style={sx("font:700 12px 'JetBrains Mono';letter-spacing:0.06em")}>MY TOP 10 — HAND-PICKED</span>
                      <span style={sx("font:400 10.5px 'JetBrains Mono';color:rgba(242,236,223,0.55)")}>JULY 2026</span>
                    </div>
                    <div style={sx("padding:8px 100px 0 20px;font:400 11px/1.5 'Arimo';color:#6b6156")}>Chosen by you — not pulled from Spotify or Apple Music.</div>
                    {!v.hasMonthlyTracks && (
                      <div style={sx('padding:22px 20px;text-align:center')}>
                        <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;margin-bottom:8px")}>You haven't picked your Top 10 yet.</div>
                        <span onClick={v.openComposeForMonthly} style={sx("font:700 11px 'JetBrains Mono';color:#3F6B4F;text-decoration:underline;cursor:pointer")}>PICK YOUR TOP 10 →</span>
                      </div>
                    )}
                    {v.hasMonthlyTracks && (
                      <div style={sx('padding:8px 20px 12px')}>
                        {v.monthlyDisplay.map((mo) => (
                          <div key={mo.id} style={sx('display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dotted rgba(30,27,24,0.3)')}>
                            <span style={sx("width:18px;font:700 12px 'Arimo';color:#B7472A")}>{mo.rank}</span>
                            <span style={sx("flex:1;font:600 12.5px 'Tinos';white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{mo.title}</span>
                            <span style={sx("font:500 10.5px 'JetBrains Mono';color:#6b6156")}>{mo.artist}</span>
                            {v.editMode && (<span onClick={mo.remove} style={sx("font:700 13px 'Arimo';color:#B7472A;cursor:pointer;padding:0 2px")}>×</span>)}
                          </div>
                        ))}
                        {v.editMode && (
                          <div onClick={v.openComposeForMonthly} style={sx("margin-top:10px;text-align:center;font:700 10.5px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;text-decoration:underline")}>{v.monthlyAddLabel}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {v.modules.receipt && (
                  <div draggable={v.editMode} onDragStart={v.dragStart_receipt} onDragOver={v.onDragOver} onDrop={v.drop_receipt} onDragEnd={v.onDragEnd} style={sx(`order:${v.order.receipt};grid-column:${v.span.receipt};position:relative;cursor:${v.cardCursor};background:#F2ECDF;padding:20px 22px 16px;max-width:320px;margin:0 auto;font-family:'JetBrains Mono'`)}>
                    {v.editMode && (
                      <>
                        <span onClick={v.toggleExpand_receipt} style={sx("position:absolute;top:56px;right:22px;font:700 9px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;border:1px solid #3F6B4F;background:#F2ECDF;padding:2px 6px;z-index:2")} title="Toggle widget size">{v.expandLabel_receipt}</span>
                        <span style={sx("position:absolute;top:8px;right:6px;font:700 13px 'Arimo';color:rgba(30,27,24,0.35)")} title="Drag to move">✥</span>
                      </>
                    )}
                    <div style={sx("text-align:center;font:700 12px 'JetBrains Mono';letter-spacing:0.03em")}>METROPOLITAN TRANSIT AUTHORITY</div>
                    <div style={sx("text-align:center;font:700 12px 'JetBrains Mono';letter-spacing:0.03em;margin-bottom:8px")}>OF LISTENING</div>
                    <div style={sx("font:400 11px/1.4 'JetBrains Mono';color:#1E1B18;margin:10px 0;white-space:pre")}>{v.receiptDashes}</div>
                    {v.noServiceConnected && (
                      <div style={sx("text-align:center;font:400 11px/1.6 'JetBrains Mono';color:#6b6156;padding:14px 0")}>NO SERVICE CONNECTED — RECEIPT UNAVAILABLE</div>
                    )}
                    {!v.noServiceConnected && (
                      <>
                        <div style={sx("font:400 11px/1.7 'JetBrains Mono';color:#1E1B18")}>
                          <div style={sx('display:flex;justify-content:space-between')}><span>STATION</span><span>RIDGEWOOD, QNS</span></div>
                          <div style={sx('display:flex;justify-content:space-between')}><span>DATE</span><span>07/20/26 8:57PM</span></div>
                          <div style={sx('display:flex;justify-content:space-between')}><span>RIDER ID</span><span>@JUNOTAPES</span></div>
                        </div>
                        <div style={sx("font:400 11px/1.4 'JetBrains Mono';color:#1E1B18;margin:8px 0;white-space:pre")}>{v.receiptDashes}</div>
                        <div style={sx("font:700 10.5px 'JetBrains Mono';color:#1E1B18;margin-bottom:4px")}>TOP 5 TRACKS THIS MONTH</div>
                        {v.receiptTracks.map((t, i) => (
                          <div key={i} style={sx("font:400 11px/1.6 'JetBrains Mono';color:#1E1B18")}>
                            <div style={sx('display:flex;justify-content:space-between')}><span>{t.stop} {t.title}</span><span>{t.mins}</span></div>
                            <div style={sx('font-size:9.5px;color:#6b6156')}>{'   '}{t.artist}</div>
                          </div>
                        ))}
                        <div style={sx("font:400 11px/1.4 'JetBrains Mono';color:#1E1B18;margin:8px 0 4px;white-space:pre")}>{v.receiptDashes}</div>
                        <div style={sx("display:flex;justify-content:space-between;font:700 12px 'JetBrains Mono';color:#1E1B18")}>
                          <span>TOTAL RIDE TIME</span><span>47H 12M</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {v.modules.friendsList && (
                  <div draggable={v.editMode} onDragStart={v.dragStart_friendsList} onDragOver={v.onDragOver} onDrop={v.drop_friendsList} onDragEnd={v.onDragEnd} style={sx(`order:${v.order.friendsList};grid-column:${v.span.friendsList};position:relative;cursor:${v.cardCursor};border:1px solid rgba(30,27,24,0.3);padding:22px 24px`)}>
                    {v.editMode && (
                      <>
                        <span onClick={v.toggleExpand_friendsList} style={sx("position:absolute;top:12px;right:38px;font:700 9px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;border:1px solid #3F6B4F;padding:2px 6px")} title="Toggle widget size">{v.expandLabel_friendsList}</span>
                        <span style={sx("position:absolute;top:12px;right:14px;font:700 13px 'Arimo';color:rgba(30,27,24,0.35)")} title="Drag to move">✥</span>
                      </>
                    )}
                    <span style={sx("font:700 12px 'JetBrains Mono';letter-spacing:0.06em")}>FRIENDS ｜ {v.friendCount}</span>
                    {v.hasFriends && (
                      <div style={sx('display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:14px')}>
                        {v.friendsListDisplay.map((f) => (
                          <div key={f.id} onClick={f.view} style={sx('display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer')}>
                            <span style={sx(`width:42px;height:42px;border-radius:50%;background:${f.color};display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';color:#F2ECDF`)}>{f.initials}</span>
                            <span style={sx("font:500 10px 'JetBrains Mono';color:#6b6156")}>{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!v.hasFriends && (
                      <div style={sx('padding:20px 0;text-align:center')}>
                        <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;margin-bottom:8px")}>No friends yet.</div>
                        <span onClick={v.goFriends} style={sx("font:700 11px 'JetBrains Mono';color:#3F6B4F;text-decoration:underline;cursor:pointer")}>SEARCH FOR FRIENDS →</span>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div style={sx('border:1px solid rgba(30,27,24,0.3);padding:18px 20px;margin:24px 32px 32px')}>
                <div style={sx('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px')}>
                  <span style={sx("font:700 11px 'JetBrains Mono';color:#6b6156;letter-spacing:0.08em")}>PAGE MODULES {v.editMode && (<>｜ DRAG CARDS ABOVE TO REARRANGE</>)}</span>
                  <div style={sx('display:flex;border:1px solid rgba(30,27,24,0.35)')}>
                    <div onClick={v.setSpacing_compact} style={sx(`padding:5px 10px;font:700 9.5px 'JetBrains Mono';cursor:pointer;background:${v.spacingBg_compact};color:${v.spacingColor_compact}`)}>COMPACT</div>
                    <div onClick={v.setSpacing_comfortable} style={sx(`padding:5px 10px;font:700 9.5px 'JetBrains Mono';cursor:pointer;background:${v.spacingBg_comfortable};color:${v.spacingColor_comfortable};border-left:1px solid rgba(30,27,24,0.35)`)}>COMFORTABLE</div>
                    <div onClick={v.setSpacing_spacious} style={sx(`padding:5px 10px;font:700 9.5px 'JetBrains Mono';cursor:pointer;background:${v.spacingBg_spacious};color:${v.spacingColor_spacious};border-left:1px solid rgba(30,27,24,0.35)`)}>SPACIOUS</div>
                  </div>
                </div>
                {v.moduleList.map((m) => (
                  <div key={m.key} style={sx('display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dotted rgba(30,27,24,0.25)')}>
                    <span style={sx("flex:1;font:600 12px 'Arimo'")}>{m.label}</span>
                    <div onClick={m.toggle} style={sx(`width:34px;height:18px;border:1px solid rgba(30,27,24,0.4);position:relative;cursor:pointer;background:${m.trackColor}`)}>
                      <div style={sx(`width:12px;height:12px;background:${m.knobColor};position:absolute;top:2px;left:${m.knobLeftSm};transition:left 0.15s`)}></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div style={sx("margin-top:36px;padding-top:16px;border-top:1px solid rgba(30,27,24,0.3);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font:500 10.5px 'JetBrains Mono';color:#6b6156;letter-spacing:0.04em")}>
              <span>© 2026 MYMUSIC</span>
              <span>SET IN TINOS, JETBRAINS MONO &amp; ARIMO</span>
              <span>RUN ON THE JUNOTAPES LINE</span>
            </div>
          </div>
        )}

        {/* ===================== FRIENDS ===================== */}
        {v.isFriends && (
          <div style={sx('max-width:900px;margin:0 auto;padding:30px 40px 60px')}>
            <div style={sx("font:700 30px 'Tinos';margin-bottom:18px")}>Friends</div>

            <div style={sx('border:1px solid rgba(30,27,24,0.4);display:flex;align-items:center;gap:8px;padding:10px 14px;margin-bottom:4px')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E1B18" strokeWidth="2"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input value={v.friendSearch} onChange={v.setFriendSearch} placeholder="Search by name or handle…" style={sx("border:none;flex:1;font:400 13px 'Tinos';font-style:italic;background:transparent")} />
            </div>

            {v.searchIsEmpty && (
              <div style={sx("margin:20px 0 30px;font:700 11px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em")}>SUGGESTED</div>
            )}
            {!v.searchIsEmpty && (
              <>
                {v.searchHasResults && (<div style={sx("margin:20px 0 30px;font:700 11px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em")}>RESULTS FOR “{v.friendSearch}”</div>)}
                {!v.searchHasResults && (
                  <div style={sx('margin:24px 0 30px;text-align:center;padding:30px 0;border:1px dashed rgba(30,27,24,0.3)')}>
                    <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156")}>No one found for “{v.friendSearch}”.</div>
                    <div style={sx("font:400 12px 'Arimo';color:#6b6156;margin-top:4px")}>Invite them by sharing your page link instead.</div>
                  </div>
                )}
              </>
            )}

            {v.directoryResults.map((p) => (
              <div key={p.id} style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:12px 16px;margin-bottom:10px')}>
                <span style={sx(`width:38px;height:38px;border-radius:50%;background:${p.color};color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none`)}>{p.initials}</span>
                <div onClick={p.view} style={sx('flex:1;cursor:pointer')}>
                  <div style={sx("font:700 14px 'Arimo'")}>{p.name} {p.isPrivate && (<>🔒</>)}</div>
                  <div style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>@{p.handle} ｜ {p.service}</div>
                </div>
                <div onClick={p.action} style={sx(`font:700 11px 'JetBrains Mono';padding:8px 14px;cursor:pointer;letter-spacing:0.04em;border:1px solid ${p.actionBorder};background:${p.actionBg};color:${p.actionColor}`)}>{p.actionLabel}</div>
              </div>
            ))}

            <div style={sx("margin:34px 0 14px;font:700 11px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em")}>MY FRIENDS ｜ {v.friendCount}</div>
            {v.hasFriends && v.friendsManage.map((f) => (
              <div key={f.id} style={sx('position:relative;display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:12px 16px;margin-bottom:10px')}>
                <span style={sx(`width:38px;height:38px;border-radius:50%;background:${f.color};color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none`)}>{f.initials}</span>
                <div onClick={f.view} style={sx('flex:1;cursor:pointer')}>
                  <div style={sx("font:700 14px 'Arimo'")}>{f.name}</div>
                  <div style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>@{f.handle} ｜ {f.service}</div>
                </div>
                <span onClick={f.toggleMenu} style={sx("font:700 16px 'Arimo';color:#6b6156;cursor:pointer;padding:0 6px")}>⋮</span>
                {f.menuOpen && (
                  <div style={sx('position:absolute;right:16px;top:48px;background:#F2ECDF;border:1px solid rgba(30,27,24,0.4);z-index:5;min-width:140px')}>
                    <div onClick={f.remove} style={sx("padding:10px 14px;font:600 11px 'JetBrains Mono';cursor:pointer;border-bottom:1px solid rgba(30,27,24,0.2)")}>REMOVE FRIEND</div>
                    <div onClick={f.block} style={sx("padding:10px 14px;font:600 11px 'JetBrains Mono';cursor:pointer;color:#B7472A")}>BLOCK</div>
                  </div>
                )}
              </div>
            ))}
            {!v.hasFriends && (
              <div style={sx("text-align:center;padding:26px 0;border:1px dashed rgba(30,27,24,0.3);font:400 13px 'Arimo';color:#6b6156")}>No friends yet. Search above to add some.</div>
            )}
          </div>
        )}

        {/* ===================== FRIEND PAGE (public) ===================== */}
        {v.isFriendPublic && (
          <div style={sx('max-width:700px;margin:0 auto;padding:30px 40px 60px')}>
            <div onClick={v.goFriends} style={sx("font:700 11px 'JetBrains Mono';color:#6b6156;cursor:pointer;margin-bottom:14px")}>← FRIENDS</div>
            <div style={sx('border:1px solid rgba(30,27,24,0.35);background:#F2ECDF')}>
              <div style={sx("height:28px;border-bottom:1px solid rgba(30,27,24,0.35);display:flex;align-items:center;padding:0 14px;font:500 10.5px 'JetBrains Mono';color:#6b6156")}>mymusic.page/{v.friend.handle}</div>
              <div style={sx('padding:26px 30px')}>
                <div style={sx('display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:1px solid rgba(30,27,24,0.3)')}>
                  <span style={sx(`width:52px;height:52px;border-radius:50%;background:${v.friend.color};color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 18px 'Tinos';flex:none`)}>{v.friend.initials}</span>
                  <div style={sx('flex:1')}>
                    <div style={sx("font:700 18px 'Tinos'")}>{v.friend.name}</div>
                    <div style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>@{v.friend.handle} ｜ {v.friend.city} ｜ <span style={sx('border:1px solid rgba(30,27,24,0.3);padding:1px 5px')}>{v.friend.service}</span></div>
                  </div>
                  <div onClick={v.openComposeForFriend} style={sx("border:1px solid #1E1B18;background:#1E1B18;color:#F2ECDF;font:700 11px 'JetBrains Mono';padding:9px 14px;letter-spacing:0.04em;cursor:pointer;white-space:nowrap")}>+ LEAVE A REC</div>
                </div>
                <div style={sx("font:700 12px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin:16px 0 8px")}>{v.friend.wallLabel}</div>
                {v.friend.wall.map((r) => (
                  <div key={r.id} style={sx(`display:flex;gap:10px;padding:12px;border:1px solid ${r.border};background:${r.bg};margin-bottom:8px`)}>
                    <span style={sx(`width:30px;height:30px;border-radius:50%;background:${r.color};flex:none;display:flex;align-items:center;justify-content:center;font:700 10.5px 'Arimo';color:#F2ECDF`)}>{r.initials}</span>
                    <div style={sx('flex:1')}>
                      <div style={sx('display:flex;justify-content:space-between')}><span style={sx("font:600 11px 'JetBrains Mono'")}>{r.name}</span><span style={sx("font:700 9.5px 'JetBrains Mono';color:#6b6156")}>{r.time}</span></div>
                      <div style={sx("font:400 12.5px/1.4 'Tinos';font-style:italic")}>“{r.text}”</div>
                      <div style={sx('display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(30,27,24,0.3);padding:5px 10px;margin-top:6px')}>
                        <span style={sx("font:700 11.5px 'Arimo'")}>{r.track}</span>
                        <span style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>· {r.artist}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== FRIEND PAGE (locked) ===================== */}
        {v.isFriendLocked && (
          <div style={sx('max-width:600px;margin:0 auto;padding:30px 40px 60px')}>
            <div onClick={v.goFriends} style={sx("font:700 11px 'JetBrains Mono';color:#6b6156;cursor:pointer;margin-bottom:14px")}>← FRIENDS</div>
            <div style={sx('border:1px solid rgba(30,27,24,0.35);background:#F2ECDF')}>
              <div style={sx("height:28px;border-bottom:1px solid rgba(30,27,24,0.35);display:flex;align-items:center;padding:0 14px;font:500 10.5px 'JetBrains Mono';color:#6b6156")}>mymusic.page/{v.friend.handle}</div>
              <div style={sx('padding:60px 40px;text-align:center')}>
                <span style={sx(`width:64px;height:64px;border-radius:50%;background:${v.friend.color};color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 22px 'Tinos';margin:0 auto 16px`)}>{v.friend.initials}</span>
                <div style={sx("font:700 20px 'Tinos'")}>{v.friend.name}</div>
                <div style={sx("font:500 11px 'JetBrains Mono';color:#6b6156;margin-bottom:20px")}>@{v.friend.handle}</div>
                <div style={sx("font:700 40px 'Arimo';color:#6b6156;margin-bottom:12px")}>🔒</div>
                <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;max-width:340px;margin:0 auto 18px")}>This page is private. Follow to see their charts, Now Playing and wall.</div>
                <div onClick={v.requestFollow} style={sx(`display:inline-block;background:${v.requestBg};color:${v.requestColor};border:1px solid #1E1B18;font:700 11px 'JetBrains Mono';padding:11px 20px;letter-spacing:0.05em;cursor:pointer`)}>{v.requestLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== NOTIFICATIONS ===================== */}
        {v.isNotifications && (
          <div style={sx('max-width:700px;margin:0 auto;padding:30px 40px 60px')}>
            <div style={sx('display:flex;justify-content:space-between;align-items:center;margin-bottom:18px')}>
              <div style={sx("font:700 30px 'Tinos'")}>Notifications</div>
              <span onClick={v.markAllRead} style={sx("font:700 11px 'JetBrains Mono';color:#3F6B4F;cursor:pointer;text-decoration:underline")}>MARK ALL READ</span>
            </div>
            {v.notificationsDisplay.map((n) => (
              <div key={n.id} onClick={n.click} style={sx(`display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid rgba(30,27,24,0.3);margin-bottom:8px;cursor:pointer;background:${n.bg}`)}>
                <span style={sx(`width:8px;height:8px;border-radius:50%;background:${n.dotColor};margin-top:6px;flex:none`)}></span>
                <div style={sx('flex:1')}>
                  <div style={sx(`font:${n.weight} 13px/1.5 'Arimo'`)}>{n.text}</div>
                  <div style={sx("font:500 10px 'JetBrains Mono';color:#6b6156;margin-top:3px")}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===================== SETTINGS ===================== */}
        {v.isSettings && (
          <div style={sx('max-width:700px;margin:0 auto;padding:30px 40px 60px')}>
            <div style={sx("font:700 30px 'Tinos';margin-bottom:18px")}>Settings</div>
            <div style={sx('display:flex;border:1px solid rgba(30,27,24,0.4);margin-bottom:22px')}>
              <div onClick={v.setSettingsTab_account} style={sx(`flex:1;text-align:center;padding:10px;font:700 11px 'JetBrains Mono';cursor:pointer;background:${v.tabBg.account};color:${v.tabColor.account}`)}>ACCOUNT</div>
              <div onClick={v.setSettingsTab_services} style={sx(`flex:1;text-align:center;padding:10px;font:700 11px 'JetBrains Mono';cursor:pointer;background:${v.tabBg.services};color:${v.tabColor.services};border-left:1px solid rgba(30,27,24,0.4)`)}>SERVICES</div>
              <div onClick={v.setSettingsTab_privacy} style={sx(`flex:1;text-align:center;padding:10px;font:700 11px 'JetBrains Mono';cursor:pointer;background:${v.tabBg.privacy};color:${v.tabColor.privacy};border-left:1px solid rgba(30,27,24,0.4)`)}>PRIVACY</div>
              <div onClick={v.setSettingsTab_notifs} style={sx(`flex:1;text-align:center;padding:10px;font:700 11px 'JetBrains Mono';cursor:pointer;background:${v.tabBg.notifs};color:${v.tabColor.notifs};border-left:1px solid rgba(30,27,24,0.4)`)}>NOTIFICATIONS</div>
            </div>

            {v.settingsIsAccount && (
              <>
                <div style={sx("font:600 10px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:4px")}>NAME</div>
                <input value={v.accountForm.name} onChange={v.setAccountName} style={sx("border:none;border-bottom:1px solid rgba(30,27,24,0.3);padding:8px 2px;font:700 15px 'Tinos';margin-bottom:14px;background:transparent;width:100%;box-sizing:border-box")} />
                <div style={sx("font:600 10px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:4px")}>HANDLE</div>
                <input value={v.accountForm.handle} onChange={v.setAccountHandle} style={sx(`border:none;border-bottom:1px solid ${v.accountHandleBorder};padding:8px 2px;font:500 13px 'JetBrains Mono';margin-bottom:4px;background:transparent;width:100%;box-sizing:border-box`)} />
                {v.accountHandleTaken && (<div style={sx("font:600 11px 'JetBrains Mono';color:#B7472A;margin-bottom:10px")}>@{v.accountForm.handle} is already taken.</div>)}
                {!v.accountHandleTaken && (<div style={sx('height:19px;margin-bottom:10px')}></div>)}
                <div style={sx("font:600 10px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:4px")}>BIO</div>
                <input value={v.accountForm.bio} onChange={v.setAccountBio} style={sx("border:none;border-bottom:1px solid rgba(30,27,24,0.3);padding:8px 2px;font:400 13px 'Arimo';margin-bottom:18px;background:transparent;width:100%;box-sizing:border-box")} />
                <div onClick={v.saveAccount} style={sx("display:inline-block;background:#1E1B18;color:#F2ECDF;font:700 11px 'JetBrains Mono';padding:10px 20px;letter-spacing:0.05em;cursor:pointer;margin-bottom:30px")}>SAVE CHANGES</div>

                <div style={sx('border-top:1px solid rgba(30,27,24,0.3);padding-top:18px')}>
                  <div style={sx("font:700 12px 'JetBrains Mono';color:#B7472A;letter-spacing:0.05em;margin-bottom:8px")}>DANGER ZONE</div>
                  <div style={sx("font:400 12px/1.5 'Arimo';color:#6b6156;margin-bottom:10px")}>Deleting your account removes your page, charts and recommendations for everyone. This can't be undone.</div>
                  <div onClick={v.askDeleteAccount} style={sx("display:inline-block;border:1px solid #B7472A;color:#B7472A;font:700 11px 'JetBrains Mono';padding:9px 16px;letter-spacing:0.05em;cursor:pointer")}>DELETE ACCOUNT</div>
                </div>
              </>
            )}

            {v.settingsIsServices && (
              <>
                <div style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:16px 18px;margin-bottom:12px')}>
                  <span style={sx("width:32px;height:32px;border-radius:50%;background:#3F6B4F;color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none")}>S</span>
                  <div style={sx('flex:1')}><div style={sx("font:700 14px 'Arimo'")}>Spotify</div><div style={sx("font:400 11px 'JetBrains Mono';color:#6b6156")}>{v.spotifyStatus}</div></div>
                  <div onClick={v.spotifyAction} style={sx(`border:1px solid #1E1B18;background:${v.spotifyBtnBg};color:${v.spotifyBtnColor};font:700 11px 'JetBrains Mono';padding:9px 16px;letter-spacing:0.05em;cursor:pointer`)}>{v.spotifyBtnLabel}</div>
                </div>
                <div style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:16px 18px')}>
                  <span style={sx("width:32px;height:32px;border-radius:50%;background:#B7472A;color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none")}>A</span>
                  <div style={sx('flex:1')}><div style={sx("font:700 14px 'Arimo'")}>Apple Music</div><div style={sx("font:400 11px 'JetBrains Mono';color:#6b6156")}>{v.appleStatus}</div></div>
                  <div onClick={v.appleAction} style={sx(`border:1px solid #1E1B18;background:${v.appleBtnBg};color:${v.appleBtnColor};font:700 11px 'JetBrains Mono';padding:9px 16px;letter-spacing:0.05em;cursor:pointer`)}>{v.appleBtnLabel}</div>
                </div>
              </>
            )}

            {v.settingsIsPrivacy && (
              <div style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:18px')}>
                <div style={sx('flex:1')}>
                  <div style={sx("font:700 14px 'Arimo';margin-bottom:4px")}>Private profile</div>
                  <div style={sx("font:400 12px/1.5 'Arimo';color:#6b6156")}>Only friends can see your charts, Now Playing and wall. Others must request to follow.</div>
                </div>
                <div onClick={v.togglePrivate} style={sx(`width:38px;height:20px;border:1px solid rgba(30,27,24,0.4);position:relative;cursor:pointer;background:${v.privateTrackColor};flex:none`)}>
                  <div style={sx(`width:14px;height:14px;background:${v.privateKnobColor};position:absolute;top:2px;left:${v.privateKnobLeft};transition:left 0.15s`)}></div>
                </div>
              </div>
            )}

            {v.settingsIsNotifs && (
              <>
                {v.notifPrefsList.map((np) => (
                  <div key={np.key} style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:16px 18px;margin-bottom:10px')}>
                    <span style={sx("flex:1;font:700 13px 'Arimo'")}>{np.label}</span>
                    <div onClick={np.toggle} style={sx(`width:34px;height:18px;border:1px solid rgba(30,27,24,0.4);position:relative;cursor:pointer;background:${np.trackColor}`)}>
                      <div style={sx(`width:12px;height:12px;background:${np.knobColor};position:absolute;top:2px;left:${np.knobLeft};transition:left 0.15s`)}></div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ===================== PLAYLIST ===================== */}
        {v.isPlaylist && (
          <div style={sx('max-width:700px;margin:0 auto;padding:30px 40px 60px')}>
            <div style={sx('display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:12px;flex-wrap:wrap')}>
              <div>
                <div style={sx("font:700 30px 'Tinos'")}>Rooftop Party 2026</div>
                <div style={sx("font:500 11px 'JetBrains Mono';color:#6b6156;margin-top:4px")}>SHARED PLAYLIST ｜ {v.playlistContributorCount} CONTRIBUTORS</div>
              </div>
              <div onClick={v.openComposeForPlaylist} style={sx("background:#1E1B18;color:#F2ECDF;font:700 11px 'JetBrains Mono';padding:10px 18px;letter-spacing:0.05em;cursor:pointer;white-space:nowrap")}>+ ADD TRACK</div>
            </div>
            {v.playlistTracksDisplay.map((pt) => (
              <div key={pt.id} style={sx('display:flex;align-items:center;gap:14px;border:1px solid rgba(30,27,24,0.3);padding:14px 16px;margin-bottom:8px')}>
                <div style={sx('width:40px;height:40px;border-radius:6px;background:linear-gradient(135deg,#C9A227,#B7472A);flex:none')}></div>
                <div style={sx('flex:1')}>
                  <div style={sx("font:700 14px 'Tinos'")}>{pt.title}</div>
                  <div style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>{pt.artist}</div>
                </div>
                <div style={sx('text-align:right')}>
                  <span style={sx("font:600 10.5px 'JetBrains Mono';color:#6b6156")}>ADDED BY {pt.addedByLabel}</span>
                  {pt.isConflict && (<div style={sx("font:700 9.5px 'JetBrains Mono';color:#C9A227;margin-top:2px")}>2 PEOPLE ADDED THIS</div>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===================== COMPOSE MODAL ===================== */}
        {v.compose.open && (
          <div style={sx('position:fixed;inset:0;background:rgba(30,27,24,0.5);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px')}>
            <div style={sx('width:560px;max-height:90vh;overflow-y:auto;background:#F2ECDF;border:1px solid rgba(30,27,24,0.4)')}>
              <div style={sx('padding:20px 26px;border-bottom:1px solid rgba(30,27,24,0.3);display:flex;justify-content:space-between;align-items:center')}>
                <span style={sx("font:700 18px 'Tinos'")}>{v.composeTitle}</span>
                <span onClick={v.closeCompose} style={sx("font:700 20px 'Arimo';cursor:pointer;color:#6b6156")}>×</span>
              </div>
              <div style={sx('padding:22px 26px;display:flex;flex-direction:column;gap:14px')}>
                <div>
                  <div style={sx("font:700 10.5px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:6px")}>SEARCH ANY TRACK, ANYWHERE</div>
                  <input value={v.compose.query} onChange={v.setComposeQuery} placeholder="Search a track…" style={sx("border:1px solid rgba(30,27,24,0.4);padding:9px 12px;font:400 12.5px 'Tinos';font-style:italic;width:100%;box-sizing:border-box;background:transparent")} />
                </div>
                <div style={sx('border:1px solid rgba(30,27,24,0.25);max-height:180px;overflow-y:auto')}>
                  {v.composeResults.map((st, i) => (
                    <div key={i} onClick={st.select} style={sx(`display:flex;align-items:center;gap:12px;padding:9px 12px;border-bottom:1px solid rgba(30,27,24,0.15);background:${st.selectedBg};cursor:pointer`)}>
                      <div style={sx('width:36px;height:36px;border-radius:6px;background:linear-gradient(135deg,#C9A227,#B7472A);flex:none')}></div>
                      <div style={sx('flex:1;min-width:0')}>
                        <div style={sx("font:700 12.5px 'Tinos';white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{st.title}</div>
                        <div style={sx("font:500 10px 'JetBrains Mono';color:#6b6156")}>{st.artist}</div>
                      </div>
                      <span style={sx("font:700 13px 'Arimo';color:#3F6B4F;flex:none")}>{st.check}</span>
                    </div>
                  ))}
                </div>

                {v.compose.isRecommend && (
                  <>
                    <div>
                      <div style={sx("font:700 10.5px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:6px")}>NOTE (OPTIONAL)</div>
                      <input value={v.compose.note} onChange={v.setComposeNote} style={sx("border:1px solid rgba(30,27,24,0.4);padding:10px 12px;font:400 12.5px 'Tinos';font-style:italic;width:100%;box-sizing:border-box;background:transparent")} />
                    </div>
                    <div>
                      <div style={sx("font:700 10.5px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:6px")}>POST TO</div>
                      <div style={sx('display:flex;flex-direction:column;gap:6px')}>
                        <div onClick={v.setComposeTargetWall} style={sx(`display:flex;align-items:center;gap:8px;border:1px solid ${v.targetWallBorder};padding:9px 12px;cursor:pointer`)}>
                          <span style={sx(`width:14px;height:14px;border-radius:50%;border:1px solid #1E1B18;background:${v.targetWallDot};box-shadow:${v.targetWallShadow};flex:none`)}></span>
                          <span style={sx("font:600 12px 'Arimo'")}>Their Wall</span>
                        </div>
                        <div onClick={v.setComposeTargetPlaylist} style={sx(`display:flex;align-items:center;gap:8px;border:1px solid ${v.targetPlaylistBorder};padding:9px 12px;cursor:pointer`)}>
                          <span style={sx(`width:14px;height:14px;border-radius:50%;border:1px solid #1E1B18;background:${v.targetPlaylistDot};box-shadow:${v.targetPlaylistShadow};flex:none`)}></span>
                          <span style={sx("font:600 12px 'Arimo'")}>Rooftop Party 2026 <span style={sx('color:#6b6156;font-weight:400')}>｜ shared playlist</span></span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {v.compose.showDuplicateWarning && (
                  <div style={sx("border:1px solid #C9A227;background:rgba(201,162,39,0.1);padding:10px 12px;font:600 11.5px 'Arimo'")}>
                    {v.duplicateName} already added this to the playlist.
                    <span onClick={v.toggleAddAnyway} style={sx("text-decoration:underline;cursor:pointer;margin-left:6px;font:700 11px 'JetBrains Mono'")}>{v.addAnywayLabel}</span>
                  </div>
                )}

                <div onClick={v.postRecommendation} style={sx("background:#1E1B18;color:#F2ECDF;font:700 12px 'JetBrains Mono';text-align:center;padding:12px;letter-spacing:0.06em;cursor:pointer")}>{v.composeSubmitLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== CONFIRM MODAL ===================== */}
        {v.confirm.open && (
          <div style={sx('position:fixed;inset:0;background:rgba(30,27,24,0.5);z-index:60;display:flex;align-items:center;justify-content:center;padding:20px')}>
            <div style={sx('width:380px;background:#F2ECDF;border:1px solid rgba(30,27,24,0.4);padding:26px')}>
              <div style={sx("font:700 18px 'Tinos';margin-bottom:8px")}>{v.confirm.title}</div>
              <div style={sx("font:400 13px/1.5 'Arimo';color:#6b6156;margin-bottom:20px")}>{v.confirm.message}</div>
              <div style={sx('display:flex;gap:10px;justify-content:flex-end')}>
                <div onClick={v.closeConfirm} style={sx("font:700 11px 'JetBrains Mono';padding:10px 16px;cursor:pointer;border:1px solid rgba(30,27,24,0.4)")}>CANCEL</div>
                <div onClick={v.confirmAction} style={sx(`font:700 11px 'JetBrains Mono';padding:10px 16px;cursor:pointer;background:${v.confirmBtnBg};color:#F2ECDF`)}>{v.confirm.confirmLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TOAST ===================== */}
        {v.toast && (
          <div style={sx("position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1E1B18;color:#F2ECDF;font:600 12.5px 'Arimo';padding:12px 22px;z-index:70;box-shadow:0 4px 16px rgba(0,0,0,0.25)")}>{v.toast}</div>
        )}

      </div>
    );
  }
}
