# Fork MyMusic into another social site

The shortest fork keeps the social core and replaces the music domain.

1. Rename product copy and metadata in `README.md` and `src/app/layout.tsx`.
2. Edit `src/core/styles/tokens.css` to replace palette, fonts, and page metrics.
3. Copy `src/domains/music/` to a new domain folder and keep only needed flows.
4. Register home-page cards through a module registry; see [MODULES.md](MODULES.md).
5. Replace `MusicProvider` with your external-system seam, or remove it.
6. Update schema exports, generate a migration, and adapt the read model.
7. Replace seeded fixtures with fictional data appropriate to the fork.
8. Run `npm run check`, `npm run build`, and the decision-contract tests.

The `follows`, `blocks`, `notifications`, `reports`, `page_modules`, and
`user_prefs` tables are domain-agnostic. Keeping them preserves the template's
privacy, moderation, realtime, and page-builder behavior.
