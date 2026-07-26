import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { testRouter } from '../mocks/next-navigation';
import { renderApp } from './app';

/**
 * What Phase 2 bought: every screen has a URL you can link to, and the nav
 * says which one you are on.
 */
describe('routing', () => {
  it('moves between screens through the nav', async () => {
    const user = userEvent.setup();
    renderApp('/home');
    const nav = screen.getByRole('navigation', { name: 'Main' });

    await user.click(within(nav).getByRole('link', { name: 'FRIENDS' }));
    expect(testRouter.path).toBe('/friends');
    expect(screen.getByRole('heading', { name: 'Friends', level: 1 })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: 'PLAYLIST' }));
    expect(screen.getByRole('heading', { name: 'Rooftop Party 2026' })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: 'SETTINGS' }));
    expect(testRouter.path).toBe('/settings/account');
    expect(screen.getByRole('heading', { name: 'DANGER ZONE' })).toBeInTheDocument();
  });

  it('marks the current tab for assistive tech', () => {
    renderApp('/playlist');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'PLAYLIST' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'HOME' })).not.toHaveAttribute('aria-current');
  });

  it('keeps a profile under the friends tab', () => {
    renderApp('/theok_fm');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'FRIENDS' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders a public profile at its own handle', () => {
    renderApp('/theok_fm');
    expect(screen.getByRole('heading', { name: 'Theo K.', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'HIS WALL' })).toBeInTheDocument();
  });

  it('locks a private profile at the same URL', () => {
    renderApp('/sam_radio');
    expect(screen.getByRole('heading', { name: 'Sam O.', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'REQUEST TO FOLLOW' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /WALL/ })).not.toBeInTheDocument();
  });

  it('follows a friend from the home page through to their profile', async () => {
    const user = userEvent.setup();
    renderApp('/home');

    await user.click(screen.getByRole('link', { name: 'Priya D.' }));

    expect(testRouter.path).toBe('/priyad');
    expect(screen.getByRole('heading', { name: 'Priya D.', level: 1 })).toBeInTheDocument();
  });

  it('deep-links a notification to the screen it belongs to', async () => {
    const user = userEvent.setup();
    renderApp('/notifications');

    await user.click(
      screen.getByRole('button', { name: /Marisol V\. added a track to Rooftop Party 2026\./ }),
    );

    expect(testRouter.path).toBe('/playlist');
  });

  it('ends edit mode when you leave the home page', async () => {
    const user = userEvent.setup();
    renderApp('/home');
    const nav = screen.getByRole('navigation', { name: 'Main' });

    await user.click(screen.getByRole('button', { name: 'EDIT PAGE' }));
    expect(screen.getByRole('button', { name: 'DONE EDITING' })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: 'PLAYLIST' }));
    await user.click(within(nav).getByRole('link', { name: 'HOME' }));

    expect(screen.getByRole('button', { name: 'EDIT PAGE' })).toBeInTheDocument();
  });
});
