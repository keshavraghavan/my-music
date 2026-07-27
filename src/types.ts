// Domain types for the MyMusic demo.
//
// These describe the in-memory shapes the app carries today. As the phases in
// docs/ROADMAP.md land, the persisted subset of this file moves to the Drizzle
// schema and the domain-agnostic half moves to core/ — so treat this as the
// staging ground for that split rather than a permanent home.
//
// Phase 2 removed `Route`: which screen is showing is now the URL's job, and
// `src/core/routes.ts` is the only place that names one.

export type ModuleKey =
  'feed' | 'nowPlaying' | 'chart' | 'monthly' | 'receipt' | 'recs' | 'friendsList';

export type PersonId =
  'theok' | 'samo' | 'marisolv' | 'priyad' | 'devonp' | 'wrenl' | 'irisn' | 'cassr';

/** Author of a wall post: another person, or the signed-in user. */
export type AuthorId = PersonId | 'me';

export type Relation = 'none' | 'requested' | 'friend' | 'blocked';
export type ServiceKey = 'mock' | 'spotify' | 'apple';
export type ServiceName = 'Demo Library' | 'Spotify' | 'Apple Music';
export type Spacing = 'compact' | 'comfortable' | 'spacious';
export type SettingsTab = 'account' | 'services' | 'privacy' | 'notifs';
export type ChartTab = 'songs' | 'albums';
export type ComposeMode = 'recommend' | 'addTrack' | 'monthlyPick';
export type ComposeTarget = 'wall' | 'playlist';
export type NotificationKind = 'rec' | 'chart' | 'friend' | 'playlist';
export type RecStatus = 'active' | 'hidden' | 'reported';
export type NotifPrefKey = 'recs' | 'friendActivity' | 'chart' | 'emailDigest';

export type ConfirmKind =
  | ''
  | 'remove'
  | 'block'
  | 'report-rec'
  | 'disconnect-spotify'
  | 'disconnect-apple'
  | 'delete-account';

export interface Person {
  id: PersonId;
  name: string;
  handle: string;
  initials: string;
  color: string;
  service: string;
  city: string;
  private: boolean;
  avatarUrl?: string | null;
}

export interface ViewerProfile {
  id: 'me';
  userId: string;
  name: string;
  handle: string;
  initials: string;
  color: string;
  city: string;
  bio: string;
  avatarUrl?: string | null;
}

export interface Track {
  title: string;
  artist: string;
  movement?: number | null;
}

export interface NowPlaying {
  track: string;
  artist: string;
  album: string;
  progressPct: string;
  updated: string;
}

export interface ReceiptMeta {
  station: string;
  date: string;
  totalRideTime: string;
  month: string;
}

export interface ReceiptLine extends Track {
  stop: string;
  mins: string;
}

export interface FeedItem {
  text: string;
  time: string;
  color: string;
}

export interface MonthlyTrack extends Track {
  id: string;
}

export interface Rec {
  id: string;
  personId: PersonId;
  text: string;
  track: string;
  artist: string;
  status: RecStatus;
}

export interface AppNotification {
  id: string;
  type: NotificationKind;
  text: string;
  time: string;
  read: boolean;
}

export interface WallPost {
  id: string;
  personId: AuthorId;
  text: string;
  track: string;
  artist: string;
  time: string;
}

export interface PlaylistTrack extends Track {
  id: string;
  /** Display names today; becomes user ids in Phase 5. See docs/ROADMAP.md. */
  addedBy: string[];
}

export interface ProfileForm {
  name: string;
  handle: string;
  bio: string;
}

export interface ComposeState {
  open: boolean;
  mode: ComposeMode;
  targetFriendId: PersonId | null;
  target: ComposeTarget;
  query: string;
  selectedIdx: number | null;
  note: string;
  addAnyway: boolean;
}

export interface ConfirmState {
  open: boolean;
  kind: ConfirmKind;
  title: string;
  message: string;
  confirmLabel: string;
  /** A PersonId, a rec id, or a ServiceKey depending on `kind`. */
  payload: string | null;
}

/**
 * Everything the app holds in memory. The screen you are on is not in here —
 * that is the URL — and neither is the onboarding step or the settings tab,
 * for the same reason.
 */
export interface AppState {
  /** Server-loaded persisted data. Client actions remain stubs until Phase 5. */
  me: ViewerProfile;
  people: Record<PersonId, Person>;
  catalog: Track[];
  topSongs: Track[];
  topAlbums: Track[];
  nowPlaying: NowPlaying;
  receiptMeta: ReceiptMeta;
  receiptLines: ReceiptLine[];
  feedItems: FeedItem[];
  playlistName: string;

  ob: ProfileForm;
  modules: Record<ModuleKey, boolean>;
  chartTab: ChartTab;
  order: ModuleKey[];
  expanded: Record<ModuleKey, boolean>;
  dragKey: ModuleKey | null;
  editMode: boolean;
  spacing: Spacing;
  monthlyTracks: MonthlyTrack[];

  connected: Record<ServiceKey, boolean>;
  /**
   * Services whose stored tokens were rejected. The connection row still
   * exists, so this is not the same as never having connected — the page shows
   * an empty state and asks for a reconnect rather than falling back to mock
   * data the viewer would read as their own listening history.
   */
  needsReconnect: Record<ServiceKey, boolean>;
  nowPlayingSource: ServiceKey;
  isPrivateProfile: boolean;

  relations: Record<PersonId, Relation>;
  incomingFollowRequests: Person[];
  friendSearch: string;
  openFriendMenu: PersonId | null;

  recs: Rec[];
  openRecMenu: string | null;

  notifications: AppNotification[];
  theoWall: WallPost[];
  playlistTracks: PlaylistTrack[];

  compose: ComposeState;
  confirm: ConfirmState;
  toast: string | null;

  accountForm: ProfileForm;
  notifPrefs: Record<NotifPrefKey, boolean>;
}
