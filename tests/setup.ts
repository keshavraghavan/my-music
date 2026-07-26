import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Next's router only exists inside a Next runtime, so every test file gets the
// in-memory stand-in from tests/mocks instead. See tests/mocks/next-navigation.
vi.mock('next/navigation', () => import('./mocks/next-navigation'));
vi.mock('next/link', () => import('./mocks/next-link'));
