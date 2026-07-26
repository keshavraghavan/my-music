import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';

type User = ReturnType<typeof userEvent.setup>;

/** Clicks through onboarding to the signed-in page. */
async function signIn(user: User) {
  await user.click(screen.getByText('GET STARTED →'));
  await user.click(screen.getByText("LET'S GO →"));
  await user.click(screen.getByText('CONTINUE →'));
  await user.click(screen.getByText('CONTINUE →'));
  await user.click(screen.getByText('CONTINUE →'));
  await user.click(screen.getByText('ENTER YOUR PAGE →'));
}

function navBar(): HTMLElement {
  return screen.getByText('MyMusic.').parentElement!;
}

async function navigate(user: User, label: string) {
  await user.click(within(navBar()).getByText(label));
}

/**
 * Walks up from `start` to the nearest ancestor that also contains `marker`.
 *
 * The markup has no roles, ids or classes to scope by — every element is a
 * bare styled <div> — so relating a row to its own controls means climbing the
 * tree. Phase 2 replaces this with real semantics and these helpers go away.
 */
function ancestorContaining(start: HTMLElement, marker: string): HTMLElement {
  let node = start;
  while (node.parentElement && !(node.textContent ?? '').includes(marker)) {
    node = node.parentElement;
  }
  return node;
}

/** The person row for `name`, scoped so it holds that person's action button. */
function personRow(name: string | RegExp, action: string): HTMLElement {
  return ancestorContaining(screen.getByText(name), action);
}

/** The compose modal, identified by the submit button it carries. */
function composeModal(submitLabel: string): HTMLElement {
  return ancestorContaining(screen.getByPlaceholderText('Search a track…'), submitLabel);
}

describe('signed-in workflows', () => {
  let user: User;

  beforeEach(async () => {
    user = userEvent.setup();
    render(<App />);
    await signIn(user);
  });

  describe('friends', () => {
    it('adds a public account from the directory and confirms with a toast', async () => {
      await navigate(user, 'FRIENDS');

      await user.click(within(personRow('Wren L.', '+ ADD')).getByText('+ ADD'));

      // KNOWN BUG, pinned deliberately: every display name already ends in a
      // period ("Wren L."), and showToast() appends another, so this reads
      // "Wren L..". Phase 1 is behaviour-preserving, so the test documents the
      // bug rather than hiding it. Fix belongs with the copy pass in Phase 2.
      expect(screen.getByText("You're now friends with Wren L..")).toBeInTheDocument();
      expect(screen.getByText('MY FRIENDS ｜ 7')).toBeInTheDocument();
    });

    it('offers a follow request rather than an add for a private account', async () => {
      await navigate(user, 'FRIENDS');

      // Sam O. is private, so the row reads REQUEST and the name carries a lock.
      const row = personRow(/^Sam O\./, 'REQUEST');
      expect(within(row).queryByText('+ ADD')).not.toBeInTheDocument();

      await user.click(within(row).getByText('REQUEST'));
      expect(within(personRow(/^Sam O\./, 'REQUESTED')).getByText('REQUESTED')).toBeInTheDocument();
    });

    it('removes a friend only after the confirmation is accepted', async () => {
      await navigate(user, 'FRIENDS');

      await user.click(within(personRow('Theo K.', '⋮')).getByText('⋮'));
      await user.click(screen.getByText('REMOVE FRIEND'));

      // The modal is up; nothing has changed yet.
      expect(screen.getByText('Remove friend?')).toBeInTheDocument();
      expect(screen.queryByText('Removed Theo K. as a friend.')).not.toBeInTheDocument();

      await user.click(screen.getByText('REMOVE'));
      expect(screen.getByText('Removed Theo K. as a friend.')).toBeInTheDocument();
      expect(screen.getByText('MY FRIENDS ｜ 5')).toBeInTheDocument();
    });

    it('leaves the friend in place when the confirmation is cancelled', async () => {
      await navigate(user, 'FRIENDS');

      await user.click(within(personRow('Theo K.', '⋮')).getByText('⋮'));
      await user.click(screen.getByText('REMOVE FRIEND'));
      await user.click(screen.getByText('CANCEL'));

      expect(screen.queryByText('Remove friend?')).not.toBeInTheDocument();
      expect(screen.getByText('MY FRIENDS ｜ 6')).toBeInTheDocument();
    });

    it('blocks a friend through the row menu', async () => {
      await navigate(user, 'FRIENDS');

      await user.click(within(personRow('Marisol V.', '⋮')).getByText('⋮'));
      await user.click(screen.getByText('BLOCK'));

      // Confirm via the modal's own BLOCK button, not the row menu item.
      const modal = ancestorContaining(screen.getByText('Block this person?'), 'CANCEL');
      await user.click(within(modal).getByText('BLOCK'));

      // Doubled period is the same known toast bug noted above.
      expect(screen.getByText('Blocked Marisol V..')).toBeInTheDocument();
      expect(screen.getByText('MY FRIENDS ｜ 5')).toBeInTheDocument();
    });
  });

  describe('shared playlist', () => {
    it('warns when adding a track someone already contributed', async () => {
      await navigate(user, 'PLAYLIST');
      await user.click(screen.getByText('+ ADD TRACK'));

      const modal = composeModal('ADD TO PLAYLIST →');
      // Terracotta is already on the playlist, credited to Juno Reyes + Theo K.
      await user.click(within(modal).getByText('Terracotta'));

      expect(within(modal).getByText('ADD ANYWAY')).toBeInTheDocument();
      expect(within(modal).getByText(/already added this to the playlist/)).toBeInTheDocument();
    });

    it('does not warn for a track that is not on the playlist yet', async () => {
      await navigate(user, 'PLAYLIST');
      await user.click(screen.getByText('+ ADD TRACK'));

      const modal = composeModal('ADD TO PLAYLIST →');
      await user.click(within(modal).getByText('Bodega Light'));

      expect(within(modal).queryByText('ADD ANYWAY')).not.toBeInTheDocument();

      await user.click(within(modal).getByText('ADD TO PLAYLIST →'));
      expect(screen.getByText('Added Bodega Light to Rooftop Party 2026.')).toBeInTheDocument();
    });

    it('blocks the duplicate add until "add anyway" is chosen', async () => {
      await navigate(user, 'PLAYLIST');
      await user.click(screen.getByText('+ ADD TRACK'));

      const modal = composeModal('ADD TO PLAYLIST →');
      await user.click(within(modal).getByText('Terracotta'));

      // Submitting while the warning stands is a no-op.
      await user.click(within(modal).getByText('ADD TO PLAYLIST →'));
      expect(screen.queryByText('Added Terracotta to Rooftop Party 2026.')).not.toBeInTheDocument();

      await user.click(within(modal).getByText('ADD ANYWAY'));
      await user.click(within(modal).getByText('ADD TO PLAYLIST →'));
      expect(screen.getByText('Added Terracotta to Rooftop Party 2026.')).toBeInTheDocument();
    });
  });

  describe("this month's top 10", () => {
    // The add control only exists in edit mode.
    async function openTop10Compose() {
      await user.click(screen.getByText('EDIT PAGE'));
      await user.click(screen.getByText('+ ADD A TRACK'));
      return composeModal('ADD TO TOP 10 →');
    }

    it('refuses a track already picked', async () => {
      const modal = await openTop10Compose();
      // Amber Line is one of the five seeded picks.
      await user.click(within(modal).getByText('Amber Line'));
      await user.click(within(modal).getByText('ADD TO TOP 10 →'));

      expect(screen.getByText('Already in your Top 10.')).toBeInTheDocument();
    });

    it('adds a new pick', async () => {
      const modal = await openTop10Compose();
      await user.click(within(modal).getByText('Honeycomb'));
      await user.click(within(modal).getByText('ADD TO TOP 10 →'));

      expect(screen.getByText('Added Honeycomb to your Top 10.')).toBeInTheDocument();
    });

    it('requires a track to be selected before submitting', async () => {
      const modal = await openTop10Compose();
      await user.click(within(modal).getByText('ADD TO TOP 10 →'));

      expect(screen.getByText('Pick a track first.')).toBeInTheDocument();
    });
  });

  describe('notifications', () => {
    it('shows the unread count and clears it on mark-all-read', async () => {
      expect(within(navBar()).getByText('2')).toBeInTheDocument();

      await navigate(user, 'NOTIFICATIONS');
      await user.click(screen.getByText('MARK ALL READ'));

      expect(within(navBar()).queryByText('2')).not.toBeInTheDocument();
    });
  });

  describe('service connections', () => {
    it('connects a service, then requires confirmation to disconnect', async () => {
      await navigate(user, 'SETTINGS');
      await user.click(screen.getByText('SERVICES'));

      await user.click(screen.getAllByText('CONNECT')[0]!);
      expect(screen.getByText('DISCONNECT')).toBeInTheDocument();

      await user.click(screen.getByText('DISCONNECT'));
      expect(screen.getByText('Disconnect Spotify?')).toBeInTheDocument();

      // Cancelling leaves it connected.
      await user.click(screen.getByText('CANCEL'));
      expect(screen.getByText('DISCONNECT')).toBeInTheDocument();
    });
  });

  describe('page layout', () => {
    it('toggles a module off from edit mode', async () => {
      expect(screen.getByText('MY TOP 10 — HAND-PICKED')).toBeInTheDocument();

      await user.click(screen.getByText('EDIT PAGE'));

      // Each row in the PAGE MODULES list is [dot span, label span, toggle div],
      // so the row's only <div> child is the switch.
      const row = screen.getByText("This Month's Top 10").parentElement!;
      await user.click(row.querySelector('div')!);

      expect(screen.queryByText('MY TOP 10 — HAND-PICKED')).not.toBeInTheDocument();
    });
  });
});
