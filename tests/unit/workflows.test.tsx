import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './app';

/**
 * The signed-in workflows, exercised through roles rather than through the
 * DOM-climbing helpers Phase 1 needed. Every control is a real control now, so
 * a test can ask for it by name.
 */
describe('friends', () => {
  it('adds a public account from the directory and confirms with a toast', async () => {
    const user = userEvent.setup();
    renderApp('/friends');

    await user.click(screen.getByRole('button', { name: 'Add Wren L.' }));

    // Phase 1 pinned "Wren L.." — the display name's period plus the toast's.
    // Phase 2's copy pass fixed it, so a single stop is the assertion now.
    expect(screen.getByText("You're now friends with Wren L.")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'MY FRIENDS ｜ 7' })).toBeInTheDocument();
  });

  it('offers a follow request rather than an add for a private account', async () => {
    const user = userEvent.setup();
    renderApp('/friends');

    expect(screen.queryByRole('button', { name: 'Add Sam O.' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Request to follow Sam O.' }));
    expect(screen.getByRole('button', { name: 'Follow request sent to Sam O.' })).toBeDisabled();
  });

  it('removes a friend only after the confirmation is accepted', async () => {
    const user = userEvent.setup();
    renderApp('/friends');

    await user.click(screen.getByRole('button', { name: 'Options for Theo K.' }));
    await user.click(screen.getByRole('menuitem', { name: 'REMOVE FRIEND' }));

    // The dialog is up; nothing has changed yet.
    const dialog = screen.getByRole('dialog', { name: 'Remove friend?' });
    expect(screen.queryByText('Removed Theo K. as a friend.')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'REMOVE' }));
    expect(screen.getByText('Removed Theo K. as a friend.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'MY FRIENDS ｜ 5' })).toBeInTheDocument();
  });

  it('leaves the friend in place when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderApp('/friends');

    await user.click(screen.getByRole('button', { name: 'Options for Theo K.' }));
    await user.click(screen.getByRole('menuitem', { name: 'REMOVE FRIEND' }));
    await user.click(screen.getByRole('button', { name: 'CANCEL' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'MY FRIENDS ｜ 6' })).toBeInTheDocument();
  });

  it('blocks a friend through the row menu', async () => {
    const user = userEvent.setup();
    renderApp('/friends');

    await user.click(screen.getByRole('button', { name: 'Options for Marisol V.' }));
    await user.click(screen.getByRole('menuitem', { name: 'BLOCK' }));

    const dialog = screen.getByRole('dialog', { name: 'Block this person?' });
    await user.click(within(dialog).getByRole('button', { name: 'BLOCK' }));

    expect(screen.getByText('Blocked Marisol V.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'MY FRIENDS ｜ 5' })).toBeInTheDocument();
  });
});

describe('shared playlist', () => {
  async function openCompose(user: ReturnType<typeof userEvent.setup>) {
    renderApp('/playlist');
    await user.click(screen.getByRole('button', { name: '+ ADD TRACK' }));
    return screen.getByRole('dialog', { name: /Add Track/ });
  }

  it('warns when adding a track someone already contributed', async () => {
    const user = userEvent.setup();
    const dialog = await openCompose(user);

    // Terracotta is already on the playlist, credited to Juno Reyes + Theo K.
    await user.click(within(dialog).getByRole('button', { name: /Terracotta/ }));

    expect(within(dialog).getByRole('button', { name: 'ADD ANYWAY' })).toBeInTheDocument();
    expect(within(dialog).getByText(/already added this to the playlist/)).toBeInTheDocument();
  });

  it('does not warn for a track that is not on the playlist yet', async () => {
    const user = userEvent.setup();
    const dialog = await openCompose(user);

    await user.click(within(dialog).getByRole('button', { name: /Bodega Light/ }));
    expect(within(dialog).queryByRole('button', { name: 'ADD ANYWAY' })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'ADD TO PLAYLIST →' }));
    expect(screen.getByText('Added Bodega Light to Rooftop Party 2026.')).toBeInTheDocument();
  });

  it('blocks the duplicate add until "add anyway" is chosen', async () => {
    const user = userEvent.setup();
    const dialog = await openCompose(user);

    await user.click(within(dialog).getByRole('button', { name: /Terracotta/ }));

    // Submitting while the warning stands is a no-op.
    await user.click(within(dialog).getByRole('button', { name: 'ADD TO PLAYLIST →' }));
    expect(screen.queryByText('Added Terracotta to Rooftop Party 2026.')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'ADD ANYWAY' }));
    await user.click(within(dialog).getByRole('button', { name: 'ADD TO PLAYLIST →' }));
    expect(screen.getByText('Added Terracotta to Rooftop Party 2026.')).toBeInTheDocument();
  });
});

describe("this month's top 10", () => {
  /** The add control only exists in edit mode. */
  async function openTop10Compose(user: ReturnType<typeof userEvent.setup>) {
    renderApp('/home');
    await user.click(screen.getByRole('button', { name: 'EDIT PAGE' }));
    await user.click(screen.getByRole('button', { name: '+ ADD A TRACK' }));
    return screen.getByRole('dialog', { name: 'Add to Your Top 10' });
  }

  it('refuses a track already picked', async () => {
    const user = userEvent.setup();
    const dialog = await openTop10Compose(user);

    await user.click(within(dialog).getByRole('button', { name: /Amber Line/ }));
    await user.click(within(dialog).getByRole('button', { name: 'ADD TO TOP 10 →' }));

    expect(screen.getByText('Already in your Top 10.')).toBeInTheDocument();
  });

  it('adds a new pick', async () => {
    const user = userEvent.setup();
    const dialog = await openTop10Compose(user);

    await user.click(within(dialog).getByRole('button', { name: /Honeycomb/ }));
    await user.click(within(dialog).getByRole('button', { name: 'ADD TO TOP 10 →' }));

    expect(screen.getByText('Added Honeycomb to your Top 10.')).toBeInTheDocument();
  });

  it('requires a track to be selected before submitting', async () => {
    const user = userEvent.setup();
    const dialog = await openTop10Compose(user);

    await user.click(within(dialog).getByRole('button', { name: 'ADD TO TOP 10 →' }));

    expect(screen.getByText('Pick a track first.')).toBeInTheDocument();
  });
});

describe('notifications', () => {
  it('shows the unread count and clears it on mark-all-read', async () => {
    const user = userEvent.setup();
    renderApp('/notifications');

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByText('2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'MARK ALL READ' }));

    expect(within(nav).queryByText('2')).not.toBeInTheDocument();
  });
});

describe('service connections', () => {
  it('connects a service, then requires confirmation to disconnect', async () => {
    const user = userEvent.setup();
    renderApp('/settings/services');

    await user.click(screen.getByRole('button', { name: 'Connect Spotify' }));
    const disconnect = screen.getByRole('button', { name: 'Disconnect Spotify' });

    await user.click(disconnect);
    expect(screen.getByRole('dialog', { name: 'Disconnect Spotify?' })).toBeInTheDocument();

    // Cancelling leaves it connected.
    await user.click(screen.getByRole('button', { name: 'CANCEL' }));
    expect(screen.getByRole('button', { name: 'Disconnect Spotify' })).toBeInTheDocument();
  });
});

describe('page layout', () => {
  it('toggles a module off from the module list', async () => {
    const user = userEvent.setup();
    renderApp('/home');

    expect(screen.getByRole('heading', { name: 'MY TOP 10 — HAND-PICKED' })).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: "Show This Month's Top 10 on your page" }));

    expect(
      screen.queryByRole('heading', { name: 'MY TOP 10 — HAND-PICKED' }),
    ).not.toBeInTheDocument();
  });
});
