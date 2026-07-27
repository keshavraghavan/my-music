# Verification

## Automated phase gate

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
```

The product-decision suite treats these as contracts:

- public follows are accepted immediately; private follows stay pending;
- follow edges remain asymmetric and unfollow deletes only the actor's edge;
- only owners and accepted playlist collaborators may mutate tracks;
- an invitation alone grants no playlist write access;
- reports persist as `open` and trigger an operator-delivery attempt;
- blocks remove both follow directions and hide reads in either direction.

## Manual matrix

Test at 375 px and 1440 px with mouse and keyboard. Hard-refresh every route.
Disconnect the network during search, expire a Spotify token, deny an avatar
PUT, and background then restore the polling tab. Confirm retry and fallback
copy stays actionable.

For privacy, use two browsers: anonymous, requester, accepted follower, blocked
viewer, and owner. Repeat against public and private profiles.

## Fresh-template check

Clone into a new directory, run `npm ci && npm run build` with an empty
environment, and verify the mock-provider tests and public landing page. Then
add Postgres and confirm magic links log in development without Resend.
