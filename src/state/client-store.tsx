'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { endSentence } from '@/core/text';
import {
  acceptFollowRequest,
  blockUser,
  cancelFollowRequest,
  declineFollowRequest,
  followUser,
  unfollowUser,
} from '@/core/graph/actions';
import {
  FEED_ITEMS,
  monthlyReceipt,
  NOW_PLAYING,
  PLAYLIST_NAME,
  RECEIPT_META,
  TOP_ALBUMS,
  TOP_SONGS,
} from '@/domains/music/data/listening';
import { isHandleTaken, ME, PEOPLE } from '@/domains/music/data/people';
import { filterTracks, TRACK_POOL } from '@/domains/music/data/tracks';
import { disconnectMusicService } from '@/domains/music/actions';
import type {
  AppState,
  ChartTab,
  ComposeTarget,
  ConfirmKind,
  ModuleKey,
  NotifPrefKey,
  PersonId,
  ProfileForm,
  Relation,
  ServiceKey,
  ServiceName,
  Spacing,
} from '@/types';

/*
 * The Phase 3 client store.
 *
 * Persisted values arrive from a Server Component through `initialState`.
 * The state kept here is transient UI state plus deliberately stubbed
 * mutations; Phase 5 replaces those stubs with server writes.
 */

const TOAST_MS = 2600;

// prettier-ignore
export const INITIAL_STATE: AppState = {
  me: { id: 'me', userId: 'juno', ...ME },
  people: PEOPLE,
  catalog: TRACK_POOL,
  topSongs: TOP_SONGS,
  topAlbums: TOP_ALBUMS,
  nowPlaying: NOW_PLAYING,
  receiptMeta: RECEIPT_META,
  receiptLines: monthlyReceipt(),
  feedItems: FEED_ITEMS,
  playlistName: PLAYLIST_NAME,
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

  connected: { mock: true, spotify: false, apple: false },
  nowPlayingSource: 'mock',
  isPrivateProfile: false,

  relations: { theok: 'friend', marisolv: 'friend', priyad: 'friend', devonp: 'friend', irisn: 'friend', cassr: 'friend', samo: 'none', wrenl: 'none' },
  incomingFollowRequests: [],
  friendSearch: '',
  openFriendMenu: null,

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

  accountForm: { name: ME.name, handle: ME.handle, bio: ME.bio },
  notifPrefs: { recs: true, friendActivity: true, chart: false },
};

const SERVICE_NAMES: Record<ServiceKey, ServiceName> = {
  mock: 'Demo Library',
  spotify: 'Spotify',
  apple: 'Apple Music',
};

export interface AppActions {
  showToast: (message: string) => void;

  // page layout
  toggleModule: (key: ModuleKey) => void;
  toggleEditMode: () => void;
  setEditMode: (on: boolean) => void;
  toggleExpand: (key: ModuleKey) => void;
  setSpacing: (spacing: Spacing) => void;
  setDragKey: (key: ModuleKey | null) => void;
  dropOn: (targetKey: ModuleKey) => void;
  /** Keyboard equivalent of a drag: shifts a module one slot up or down. */
  moveModule: (key: ModuleKey, delta: -1 | 1) => void;
  removeMonthlyTrack: (id: string) => void;

  // onboarding
  setObField: (field: keyof ProfileForm, value: string) => void;

  // friends
  addFriend: (id: PersonId) => void;
  requestFollow: (id: PersonId) => void;
  cancelFollowRequest: (id: PersonId) => void;
  acceptFollowRequest: (id: PersonId) => void;
  declineFollowRequest: (id: PersonId) => void;
  setRelation: (id: PersonId, relation: Relation) => void;
  setFriendSearch: (query: string) => void;
  toggleFriendMenu: (id: PersonId) => void;
  closeFriendMenu: () => void;
  askRemoveFriend: (id: PersonId) => void;
  askBlockFriend: (id: PersonId) => void;

  // recommendations
  toggleRecMenu: (id: string) => void;
  closeRecMenu: () => void;
  hideRec: (id: string) => void;
  askReportRec: (id: string) => void;

  // notifications
  markAllRead: () => void;
  readNotification: (id: string) => void;
  toggleNotifPref: (key: NotifPrefKey) => void;

  // compose
  openComposeForFriend: (personId: PersonId) => void;
  openComposeForPlaylist: () => void;
  openComposeForMonthly: () => void;
  closeCompose: () => void;
  setComposeQuery: (query: string) => void;
  selectTrack: (index: number) => void;
  setComposeNote: (note: string) => void;
  setComposeTarget: (target: ComposeTarget) => void;
  toggleAddAnyway: () => void;
  submitCompose: () => void;

  // services, profile, settings
  connectService: (service: ServiceKey) => void;
  askDisconnect: (service: ServiceKey) => void;
  togglePrivate: () => void;
  setAccountField: (field: keyof ProfileForm, value: string) => void;
  saveAccount: () => void;
  askDeleteAccount: () => void;
  setChartTab: (tab: ChartTab) => void;
  setNowPlayingSource: (service: ServiceKey) => void;

  // confirmation dialog
  closeConfirm: () => void;
  /** Applies the pending confirmation and reports what it was, so the caller
   *  can follow up — deleting an account has to leave the signed-in shell. */
  confirmAction: () => ConfirmKind;
}

const StateContext = createContext<AppState | null>(null);
const ActionsContext = createContext<AppActions | null>(null);

export function AppStateProvider({
  children,
  initialState = INITIAL_STATE,
}: {
  children: ReactNode;
  initialState?: AppState;
}) {
  const [state, setState] = useState<AppState>(initialState);

  // Actions that branch on the current state read it here rather than through
  // a setState updater, so the updaters stay free of side effects.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const actions = useMemo<AppActions>(() => {
    const showToast = (message: string) => {
      setState((s) => ({ ...s, toast: message }));
      setTimeout(() => {
        setState((s) => (s.toast === message ? { ...s, toast: null } : s));
      }, TOAST_MS);
    };

    const setRelation = (id: PersonId, relation: Relation) =>
      setState((s) => ({ ...s, relations: { ...s.relations, [id]: relation } }));
    const showSaveError = () => showToast('That change could not be saved. Please try again.');

    const closeCompose = () => setState((s) => ({ ...s, compose: { ...s.compose, open: false } }));

    return {
      showToast,

      toggleModule: (key) =>
        setState((s) => ({ ...s, modules: { ...s.modules, [key]: !s.modules[key] } })),
      toggleEditMode: () => setState((s) => ({ ...s, editMode: !s.editMode })),
      setEditMode: (on) => setState((s) => (s.editMode === on ? s : { ...s, editMode: on })),
      toggleExpand: (key) =>
        setState((s) => ({ ...s, expanded: { ...s.expanded, [key]: !s.expanded[key] } })),
      setSpacing: (spacing) => setState((s) => ({ ...s, spacing })),
      setDragKey: (dragKey) => setState((s) => ({ ...s, dragKey })),
      dropOn: (targetKey) =>
        setState((s) => {
          const dragKey = s.dragKey;
          if (!dragKey || dragKey === targetKey) return s;
          const order = s.order.filter((k) => k !== dragKey);
          order.splice(order.indexOf(targetKey), 0, dragKey);
          return { ...s, order, dragKey: null };
        }),
      moveModule: (key, delta) =>
        setState((s) => {
          const from = s.order.indexOf(key);
          const to = from + delta;
          if (from < 0 || to < 0 || to >= s.order.length) return s;
          const order = [...s.order];
          const [moved] = order.splice(from, 1);
          order.splice(to, 0, moved as ModuleKey);
          return { ...s, order };
        }),
      removeMonthlyTrack: (id) =>
        setState((s) => ({ ...s, monthlyTracks: s.monthlyTracks.filter((t) => t.id !== id) })),

      setObField: (field, value) => setState((s) => ({ ...s, ob: { ...s.ob, [field]: value } })),

      setRelation,
      addFriend: (id) => {
        const previous = latest.current.relations[id];
        setRelation(id, 'friend');
        showToast(endSentence(`You're now friends with ${latest.current.people[id].name}`));
        void followUser(id)
          .then((result) => {
            if (!result.ok) {
              setRelation(id, previous);
              showToast(result.error);
            } else if (result.data === 'pending') {
              setRelation(id, 'requested');
            }
          })
          .catch(() => {
            setRelation(id, previous);
            showSaveError();
          });
      },
      requestFollow: (id) => {
        const previous = latest.current.relations[id];
        setRelation(id, 'requested');
        void followUser(id)
          .then((result) => {
            if (!result.ok) {
              setRelation(id, previous);
              showToast(result.error);
            } else {
              setRelation(id, result.data === 'accepted' ? 'friend' : 'requested');
            }
          })
          .catch(() => {
            setRelation(id, previous);
            showSaveError();
          });
      },
      cancelFollowRequest: (id) => {
        setRelation(id, 'none');
        void cancelFollowRequest(id)
          .then((result) => {
            if (!result.ok) {
              setRelation(id, 'requested');
              showToast(result.error);
            }
          })
          .catch(() => {
            setRelation(id, 'requested');
            showSaveError();
          });
      },
      acceptFollowRequest: (id) => {
        const request = latest.current.incomingFollowRequests.find((person) => person.id === id);
        setState((state) => ({
          ...state,
          incomingFollowRequests: state.incomingFollowRequests.filter((person) => person.id !== id),
        }));
        const restoreRequest = () => {
          if (request) {
            setState((state) => ({
              ...state,
              incomingFollowRequests: [...state.incomingFollowRequests, request],
            }));
          }
        };
        void acceptFollowRequest(id)
          .then((result) => {
            if (!result.ok) {
              restoreRequest();
              showToast(result.error);
            } else if (request) {
              showToast(`Accepted ${request.name}'s follow request.`);
            }
          })
          .catch(() => {
            restoreRequest();
            showSaveError();
          });
      },
      declineFollowRequest: (id) => {
        const request = latest.current.incomingFollowRequests.find((person) => person.id === id);
        setState((state) => ({
          ...state,
          incomingFollowRequests: state.incomingFollowRequests.filter((person) => person.id !== id),
        }));
        const restoreRequest = () => {
          if (request) {
            setState((state) => ({
              ...state,
              incomingFollowRequests: [...state.incomingFollowRequests, request],
            }));
          }
        };
        void declineFollowRequest(id)
          .then((result) => {
            if (!result.ok) {
              restoreRequest();
              showToast(result.error);
            }
          })
          .catch(() => {
            restoreRequest();
            showSaveError();
          });
      },
      setFriendSearch: (friendSearch) => setState((s) => ({ ...s, friendSearch })),
      toggleFriendMenu: (id) =>
        setState((s) => ({ ...s, openFriendMenu: s.openFriendMenu === id ? null : id })),
      closeFriendMenu: () => setState((s) => ({ ...s, openFriendMenu: null })),
      askRemoveFriend: (id) =>
        setState((s) => ({
          ...s,
          openFriendMenu: null,
          confirm: {
            open: true,
            kind: 'remove',
            title: 'Unfollow this person?',
            message: `You will stop seeing ${latest.current.people[id].name}'s updates. Their follow of you is unchanged.`,
            confirmLabel: 'UNFOLLOW',
            payload: id,
          },
        })),
      askBlockFriend: (id) =>
        setState((s) => ({
          ...s,
          openFriendMenu: null,
          confirm: {
            open: true,
            kind: 'block',
            title: 'Block this person?',
            message: `${latest.current.people[id].name} won't be able to view your page or send you recommendations.`,
            confirmLabel: 'BLOCK',
            payload: id,
          },
        })),

      toggleRecMenu: (id) =>
        setState((s) => ({ ...s, openRecMenu: s.openRecMenu === id ? null : id })),
      closeRecMenu: () => setState((s) => ({ ...s, openRecMenu: null })),
      hideRec: (id) =>
        setState((s) => ({
          ...s,
          recs: s.recs.map((r) => (r.id === id ? { ...r, status: 'hidden' as const } : r)),
          openRecMenu: null,
        })),
      askReportRec: (id) =>
        setState((s) => ({
          ...s,
          openRecMenu: null,
          confirm: {
            open: true,
            kind: 'report-rec',
            title: 'Report this recommendation?',
            message: "We'll take a look and remove it from your page if it violates guidelines.",
            confirmLabel: 'REPORT',
            payload: id,
          },
        })),

      markAllRead: () =>
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      readNotification: (id) =>
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      toggleNotifPref: (key) =>
        setState((s) => ({ ...s, notifPrefs: { ...s.notifPrefs, [key]: !s.notifPrefs[key] } })),

      openComposeForFriend: (personId) =>
        setState((s) => ({
          ...s,
          compose: {
            open: true,
            mode: 'recommend',
            targetFriendId: personId,
            target: 'wall',
            query: '',
            selectedIdx: null,
            note: '',
            addAnyway: false,
          },
        })),
      openComposeForPlaylist: () =>
        setState((s) => ({
          ...s,
          compose: {
            open: true,
            mode: 'addTrack',
            targetFriendId: null,
            target: 'playlist',
            query: '',
            selectedIdx: null,
            note: '',
            addAnyway: false,
          },
        })),
      openComposeForMonthly: () => {
        if (latest.current.monthlyTracks.length >= 10) {
          showToast('Your Top 10 is full — remove one first.');
          return;
        }
        setState((s) => ({
          ...s,
          compose: {
            open: true,
            mode: 'monthlyPick',
            targetFriendId: null,
            target: 'wall',
            query: '',
            selectedIdx: null,
            note: '',
            addAnyway: false,
          },
        }));
      },
      closeCompose,
      setComposeQuery: (query) =>
        setState((s) => ({
          ...s,
          compose: { ...s.compose, query, selectedIdx: null, addAnyway: false },
        })),
      selectTrack: (index) =>
        setState((s) => ({
          ...s,
          compose: { ...s.compose, selectedIdx: index, addAnyway: false },
        })),
      setComposeNote: (note) => setState((s) => ({ ...s, compose: { ...s.compose, note } })),
      setComposeTarget: (target) =>
        setState((s) => ({ ...s, compose: { ...s.compose, target, addAnyway: false } })),
      toggleAddAnyway: () =>
        setState((s) => ({ ...s, compose: { ...s.compose, addAnyway: !s.compose.addAnyway } })),

      submitCompose: () => {
        const s = latest.current;
        const { compose } = s;
        const results = filterTracks(compose.query, s.catalog);
        const track = compose.selectedIdx == null ? null : results[compose.selectedIdx];
        if (!track) {
          showToast('Pick a track first.');
          return;
        }

        if (compose.mode === 'monthlyPick') {
          const already = s.monthlyTracks.some(
            (t) => t.title.toLowerCase() === track.title.toLowerCase(),
          );
          if (already) {
            showToast('Already in your Top 10.');
            return;
          }
          if (s.monthlyTracks.length >= 10) {
            showToast('Your Top 10 is full — remove one first.');
            return;
          }
          setState((prev) => ({
            ...prev,
            monthlyTracks: [
              ...prev.monthlyTracks,
              { id: `mt${Date.now()}`, title: track.title, artist: track.artist },
            ],
            compose: { ...prev.compose, open: false },
          }));
          showToast(`Added ${track.title} to your Top 10.`);
          return;
        }

        const duplicate = s.playlistTracks.find(
          (t) => t.title.toLowerCase() === track.title.toLowerCase(),
        );

        if (compose.target === 'playlist') {
          // The warning is already on screen; adding needs it acknowledged.
          if (duplicate && !compose.addAnyway) return;
          setState((prev) => ({
            ...prev,
            playlistTracks: duplicate
              ? prev.playlistTracks.map((t) =>
                  t.id === duplicate.id ? { ...t, addedBy: [...t.addedBy, s.me.name] } : t,
                )
              : [
                  ...prev.playlistTracks,
                  {
                    id: `pt${Date.now()}`,
                    title: track.title,
                    artist: track.artist,
                    addedBy: [s.me.name],
                  },
                ],
            compose: { ...prev.compose, open: false },
          }));
          showToast(`Added ${track.title} to ${s.playlistName}.`);
          return;
        }

        // Recommendations still only ever land on Theo's wall — the design
        // seeded one. Phase 5 gives every person a real wall.
        setState((prev) => ({
          ...prev,
          theoWall: [
            {
              id: `w${Date.now()}`,
              personId: 'me',
              text: compose.note || '',
              track: track.title,
              artist: track.artist,
              time: 'JUST NOW',
            },
            ...prev.theoWall,
          ],
          compose: { ...prev.compose, open: false },
        }));
        const recipient = compose.targetFriendId ? s.people[compose.targetFriendId].name : 'their';
        showToast(`Posted to ${recipient}'s wall.`);
      },

      connectService: (service) => {
        if (service === 'mock') return;
        if (service === 'spotify') {
          // Optimistic so the control responds immediately; a full navigation
          // starts the PKCE flow and the server snapshot becomes authoritative.
          setState((state) => ({
            ...state,
            connected: { ...state.connected, spotify: true },
          }));
          window.location.assign('/api/music/connect/spotify');
          return;
        }
        showToast('Apple Music requires your own Apple Developer account.');
      },
      askDisconnect: (service) =>
        service === 'mock'
          ? undefined
          : setState((s) => ({
              ...s,
              confirm: {
                open: true,
                kind: service === 'spotify' ? 'disconnect-spotify' : 'disconnect-apple',
                title: `Disconnect ${SERVICE_NAMES[service]}?`,
                message: 'Now Playing and charts pause for this service until you reconnect.',
                confirmLabel: 'DISCONNECT',
                payload: service,
              },
            })),
      togglePrivate: () => setState((s) => ({ ...s, isPrivateProfile: !s.isPrivateProfile })),
      setAccountField: (field, value) =>
        setState((s) => ({ ...s, accountForm: { ...s.accountForm, [field]: value } })),
      saveAccount: () => {
        const { accountForm } = latest.current;
        if (
          isHandleTaken(
            accountForm.handle,
            latest.current.me.handle,
            Object.values(latest.current.people).map((person) => person.handle),
          )
        )
          return;
        showToast('Profile updated.');
      },
      askDeleteAccount: () =>
        setState((s) => ({
          ...s,
          confirm: {
            open: true,
            kind: 'delete-account',
            title: 'Delete your account?',
            message:
              'This permanently removes your page, charts, and recommendations for everyone. This cannot be undone.',
            confirmLabel: 'DELETE',
            payload: null,
          },
        })),
      setChartTab: (chartTab) => setState((s) => ({ ...s, chartTab })),
      setNowPlayingSource: (nowPlayingSource) => setState((s) => ({ ...s, nowPlayingSource })),

      closeConfirm: () =>
        setState((s) => ({
          ...s,
          confirm: {
            open: false,
            kind: '',
            title: '',
            message: '',
            confirmLabel: '',
            payload: null,
          },
        })),
      confirmAction: () => {
        const { confirm } = latest.current;
        const payload = confirm.payload;
        switch (confirm.kind) {
          case 'remove':
            if (payload && latest.current.people[payload as PersonId]) {
              const personId = payload as PersonId;
              const previous = latest.current.relations[personId];
              setRelation(personId, 'none');
              showToast(endSentence(`Unfollowed ${latest.current.people[personId].name}`));
              void unfollowUser(personId)
                .then((result) => {
                  if (!result.ok) {
                    setRelation(personId, previous);
                    showToast(result.error);
                  }
                })
                .catch(() => {
                  setRelation(personId, previous);
                  showSaveError();
                });
            }
            break;
          case 'block':
            if (payload && latest.current.people[payload as PersonId]) {
              const personId = payload as PersonId;
              const previous = latest.current.relations[personId];
              setRelation(personId, 'blocked');
              showToast(endSentence(`Blocked ${latest.current.people[personId].name}`));
              void blockUser(personId)
                .then((result) => {
                  if (!result.ok) {
                    setRelation(personId, previous);
                    showToast(result.error);
                  }
                })
                .catch(() => {
                  setRelation(personId, previous);
                  showSaveError();
                });
            }
            break;
          case 'report-rec':
            setState((s) => ({
              ...s,
              recs: s.recs.map((r) =>
                r.id === payload ? { ...r, status: 'reported' as const } : r,
              ),
            }));
            showToast("Reported. We'll take a look.");
            break;
          case 'disconnect-spotify':
            setState((s) => ({ ...s, connected: { ...s.connected, spotify: false } }));
            void disconnectMusicService('spotify').then((result) =>
              showToast(result.ok ? 'Spotify disconnected.' : result.error),
            );
            break;
          case 'disconnect-apple':
            setState((s) => ({ ...s, connected: { ...s.connected, apple: false } }));
            void disconnectMusicService('apple').then((result) =>
              showToast(result.ok ? 'Apple Music disconnected.' : result.error),
            );
            break;
          case 'delete-account':
          case '':
            break;
        }
        setState((s) => ({
          ...s,
          confirm: {
            open: false,
            kind: '',
            title: '',
            message: '',
            confirmLabel: '',
            payload: null,
          },
        }));
        return confirm.kind;
      },
    };
  }, []);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const state = useContext(StateContext);
  if (!state) throw new Error('useAppState must be used inside <AppStateProvider>');
  return state;
}

export function useAppActions(): AppActions {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error('useAppActions must be used inside <AppStateProvider>');
  return actions;
}
