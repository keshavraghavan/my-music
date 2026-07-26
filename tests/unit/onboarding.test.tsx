import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { testRouter } from '../mocks/next-navigation';
import { renderApp } from './app';

/**
 * Onboarding is the app's only multi-step flow with a validation gate. Phase 2
 * moved the step into the URL, so these pin both the behaviour and the routing.
 */
describe('onboarding', () => {
  it('starts on the landing screen', () => {
    renderApp();
    expect(screen.getByRole('link', { name: 'GET STARTED →' })).toBeInTheDocument();
    expect(screen.queryByText('STEP 1 / 5')).not.toBeInTheDocument();
  });

  it('enters the flow at step 1 of 5, at its own URL', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('link', { name: 'GET STARTED →' }));

    expect(testRouter.path).toBe('/onboarding/1');
    expect(screen.getByText('STEP 1 / 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome aboard' })).toBeInTheDocument();
  });

  it('advances and steps back through the flow', async () => {
    const user = userEvent.setup();
    renderApp('/onboarding/1');

    await user.click(screen.getByRole('button', { name: "LET'S GO →" }));
    expect(screen.getByText('STEP 2 / 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Link your music' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '← BACK' }));
    expect(screen.getByText('STEP 1 / 5')).toBeInTheDocument();
  });

  it('is deep-linkable: step 3 renders on its own', () => {
    renderApp('/onboarding/3');
    expect(screen.getByRole('heading', { name: 'Build your page' })).toBeInTheDocument();
  });

  it('marks a service connected once linked', async () => {
    const user = userEvent.setup();
    renderApp('/onboarding/2');

    await user.click(screen.getByRole('button', { name: 'Connect Spotify' }));

    expect(screen.getByRole('button', { name: 'Spotify connected' })).toBeInTheDocument();
  });

  describe('handle validation', () => {
    it('rejects a handle already in the directory and blocks the step', async () => {
      const user = userEvent.setup();
      renderApp('/onboarding/3');

      const handle = screen.getByLabelText('HANDLE');
      await user.clear(handle);
      await user.type(handle, 'marisolv');

      expect(screen.getByText('@marisolv is already taken — try another.')).toBeInTheDocument();
      expect(handle).toHaveAttribute('aria-invalid', 'true');

      // The gate is the point: the step must not advance.
      await user.click(screen.getByRole('button', { name: 'CONTINUE →' }));
      expect(testRouter.path).toBe('/onboarding/3');
    });

    it('accepts a free handle and advances', async () => {
      const user = userEvent.setup();
      renderApp('/onboarding/3');

      const handle = screen.getByLabelText('HANDLE');
      await user.clear(handle);
      await user.type(handle, 'a-handle-nobody-has');

      expect(screen.queryByText(/is already taken/)).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'CONTINUE →' }));
      expect(testRouter.path).toBe('/onboarding/4');
    });
  });

  it('lands on the page after the final step', async () => {
    const user = userEvent.setup();
    renderApp('/onboarding/5');

    await user.click(screen.getByRole('button', { name: 'ENTER YOUR PAGE →' }));

    expect(testRouter.path).toBe('/home');
    // The signed-in shell only exists inside the (app) route group.
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });
});
