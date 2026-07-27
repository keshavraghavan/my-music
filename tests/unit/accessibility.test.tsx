import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './app';

/**
 * The other half of Phase 2: the app is operable without a mouse.
 *
 * Each of these describes something that was unreachable while every control
 * was a `<div onClick>`.
 */
describe('keyboard operability', () => {
  it('toggles a module with the keyboard', async () => {
    const user = userEvent.setup();
    renderApp('/home');

    const toggle = screen.getByRole('switch', { name: 'Show Transit Receipt on your page' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    toggle.focus();
    await user.keyboard(' ');

    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('reorders a module with the arrow keys', async () => {
    const user = userEvent.setup();
    renderApp('/home');
    await user.click(screen.getByRole('button', { name: 'EDIT PAGE' }));

    const handle = screen.getByRole('button', { name: /Move Line Updates, position 1 of 7/ });
    handle.focus();
    await user.keyboard('{ArrowDown}');

    expect(
      screen.getByRole('button', { name: /Move Line Updates, position 2 of 7/ }),
    ).toBeInTheDocument();
  });

  it('will not move a module past the end of the page', async () => {
    const user = userEvent.setup();
    renderApp('/home');
    await user.click(screen.getByRole('button', { name: 'EDIT PAGE' }));

    const handle = screen.getByRole('button', { name: /Move Line Updates, position 1 of 7/ });
    handle.focus();
    await user.keyboard('{ArrowUp}');

    expect(
      screen.getByRole('button', { name: /Move Line Updates, position 1 of 7/ }),
    ).toBeInTheDocument();
  });

  it('closes a row menu on Escape and hands focus back to its trigger', async () => {
    const user = userEvent.setup();
    renderApp('/friends');

    const trigger = screen.getByRole('button', { name: 'Options for Theo K.' });
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'UNFOLLOW' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'BLOCK' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('dialogs', () => {
  it('names itself, takes focus, and returns it on close', async () => {
    const user = userEvent.setup();
    renderApp('/playlist');

    const opener = screen.getByRole('button', { name: '+ ADD TRACK' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: /Add Track/ });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toContainElement(document.activeElement as HTMLElement | null);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('keeps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    renderApp('/playlist');
    await user.click(screen.getByRole('button', { name: '+ ADD TRACK' }));

    const dialog = screen.getByRole('dialog', { name: /Add Track/ });
    const stops = within(dialog).getAllByRole('button');
    stops[stops.length - 1]?.focus();

    await user.tab();

    expect(dialog).toContainElement(document.activeElement as HTMLElement | null);
  });
});

describe('announcements', () => {
  it('puts toasts in a polite live region', async () => {
    const user = userEvent.setup();
    renderApp('/friends');

    await user.click(screen.getByRole('button', { name: 'Add Wren L.' }));

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent("You're now friends with Wren L.");
  });
});
