# Writing a page module

A module is a React component plus registry metadata. The page builder owns
ordering, keyboard movement, visibility, expansion, and density.

```tsx
'use client';

import { ModuleCard } from '@/core/page-builder';

export function PhotoModule() {
  return (
    <ModuleCard moduleKey="photos" label="Recent photos">
      {/* domain UI */}
    </ModuleCard>
  );
}
```

Add its key to the domain module-key type, register it in the domain registry,
and seed a `page_modules` row. Module code should not teach
`core/page-builder` about its domain.

- Give the card a unique, stable key.
- Provide an accessible label and real empty/error states.
- Keep writes in authorized Server Actions.
- Add a keyboard and 375 px viewport test.
- Add persisted defaults and a migration if the key ships enabled.
