import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '@/App';

/**
 * Onboarding is the app's only multi-step flow with a validation gate, so it is
 * the piece most likely to break when Phase 2 splits App.tsx into per-route
 * components. These tests pin the behaviour, not the markup.
 */
describe('onboarding', () => {
  it('starts on the landing screen', () => {
    render(<App />);
    expect(screen.getByText('GET STARTED →')).toBeInTheDocument();
    expect(screen.queryByText('STEP 1 / 5')).not.toBeInTheDocument();
  });

  it('enters the flow at step 1 of 5', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('GET STARTED →'));

    expect(screen.getByText('STEP 1 / 5')).toBeInTheDocument();
    expect(screen.getByText('Welcome aboard')).toBeInTheDocument();
  });

  it('advances and steps back through the flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('GET STARTED →'));
    await user.click(screen.getByText("LET'S GO →"));
    expect(screen.getByText('STEP 2 / 5')).toBeInTheDocument();
    expect(screen.getByText('Link your music')).toBeInTheDocument();

    await user.click(screen.getByText('← BACK'));
    expect(screen.getByText('STEP 1 / 5')).toBeInTheDocument();
  });

  it('marks a service connected once linked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('GET STARTED →'));
    await user.click(screen.getByText("LET'S GO →"));

    const [spotifyConnect] = screen.getAllByText('CONNECT');
    await user.click(spotifyConnect!);

    expect(screen.getByText('CONNECTED ✓')).toBeInTheDocument();
  });

  describe('handle validation', () => {
    /** Clicks through to step 3, where name / handle / bio are entered. */
    async function goToProfileStep(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByText('GET STARTED →'));
      await user.click(screen.getByText("LET'S GO →"));
      await user.click(screen.getByText('CONTINUE →'));
    }

    it('rejects a handle already in the directory and blocks the step', async () => {
      const user = userEvent.setup();
      render(<App />);
      await goToProfileStep(user);

      const handleField = screen.getByDisplayValue('junotapes2');
      await user.clear(handleField);
      await user.type(handleField, 'marisolv');

      expect(screen.getByText('@marisolv is already taken — try another.')).toBeInTheDocument();

      // The gate is the point: advancing must not move past step 3.
      await user.click(screen.getByText('CONTINUE →'));
      expect(screen.getByText('STEP 3 / 5')).toBeInTheDocument();
    });

    it('accepts a free handle and advances', async () => {
      const user = userEvent.setup();
      render(<App />);
      await goToProfileStep(user);

      const handleField = screen.getByDisplayValue('junotapes2');
      await user.clear(handleField);
      await user.type(handleField, 'a-handle-nobody-has');

      expect(screen.queryByText(/is already taken/)).not.toBeInTheDocument();

      await user.click(screen.getByText('CONTINUE →'));
      expect(screen.getByText('STEP 4 / 5')).toBeInTheDocument();
    });
  });

  it('lands on the page after the final step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('GET STARTED →'));
    await user.click(screen.getByText("LET'S GO →"));
    await user.click(screen.getByText('CONTINUE →')); // service → profile
    await user.click(screen.getByText('CONTINUE →')); // profile → modules
    await user.click(screen.getByText('CONTINUE →')); // modules → done
    await user.click(screen.getByText('ENTER YOUR PAGE →'));

    // The signed-in shell only renders off the landing/onboarding routes.
    expect(screen.getByText('NOTIFICATIONS')).toBeInTheDocument();
    expect(screen.queryByText(/STEP \d \/ 5/)).not.toBeInTheDocument();
  });
});
