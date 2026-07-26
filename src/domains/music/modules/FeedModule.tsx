'use client';

import { ModuleCard } from '@/core/page-builder';
import sx from '@/sx';
import { useAppState } from '@/state/client-store';
import styles from './modules.module.css';

const CARD_CSS = 'border:1px solid rgba(30,27,24,0.3);padding:22px 24px';

export function FeedModule() {
  const { feedItems } = useAppState();
  return (
    <ModuleCard moduleKey="feed" label="Line Updates" css={CARD_CSS}>
      <h2 className={styles.title}>Line Updates</h2>
      <ul className={styles.list}>
        {feedItems.map((item) => (
          <li
            key={item.text}
            style={sx(
              'display:flex;gap:12px;padding:12px 0;border-bottom:1px dotted rgba(30,27,24,0.3)',
            )}
          >
            <span
              aria-hidden="true"
              style={sx(
                `width:20px;height:20px;border-radius:50%;background:${item.color};flex:none;margin-top:2px`,
              )}
            />
            <div style={sx('flex:1')}>
              <div style={sx("font:400 13px/1.5 'Arimo'")}>{item.text}</div>
              <div
                style={sx(
                  "font:500 10px 'JetBrains Mono';color:#6b6156;margin-top:3px;letter-spacing:0.03em",
                )}
              >
                {item.time}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ModuleCard>
  );
}
