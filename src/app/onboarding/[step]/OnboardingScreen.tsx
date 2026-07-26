'use client';

import { useRouter } from 'next/navigation';
import { ONBOARDING_STEPS, routes } from '@/core/routes';
import { Avatar, Button, CenteredPage, Field, Toggle } from '@/core/ui';
import { musicModules } from '@/domains/music/modules';
import { isHandleTaken } from '@/domains/music/data/people';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/client-store';
import type { ServiceKey } from '@/types';
import styles from './onboarding.module.css';

const NEXT_LABELS: Record<number, string> = {
  1: "LET'S GO →",
  2: 'CONTINUE →',
  3: 'CONTINUE →',
  4: 'CONTINUE →',
  5: 'ENTER YOUR PAGE →',
};

const SERVICES: { key: ServiceKey; name: string; badge: string; note: string; color: string }[] = [
  {
    key: 'spotify',
    name: 'Spotify',
    badge: 'S',
    note: 'REAL-TIME PLAYS + CHARTS',
    color: '#3F6B4F',
  },
  {
    key: 'apple',
    name: 'Apple Music',
    badge: 'A',
    note: 'BACKUP LISTENING SOURCE',
    color: '#B7472A',
  },
];

/**
 * The five-stop setup. The step is the URL, so a half-finished signup is a
 * link you can send yourself — and the back button works.
 */
export function OnboardingScreen({ step }: { step: number }) {
  const router = useRouter();
  const { ob, connected, modules, people } = useAppState();
  const actions = useAppActions();

  const handleTaken = isHandleTaken(
    ob.handle,
    undefined,
    Object.values(people).map((person) => person.handle),
  );
  const blocked = step === 3 && handleTaken;
  const noServiceConnected = !connected.spotify && !connected.apple;

  function goNext() {
    if (blocked) return;
    if (step === ONBOARDING_STEPS) router.push(routes.home);
    else router.push(routes.onboarding(step + 1));
  }

  return (
    <CenteredPage>
      <div className={styles.frame}>
        <div className={styles.chrome}>
          <span>mymusic.page/setup</span>
          <span>
            STEP {step} / {ONBOARDING_STEPS}
          </span>
        </div>

        <div className={styles.body}>
          {step === 1 && (
            <div style={sx('text-align:center')}>
              <h1 style={sx("font:700 34px 'Tinos';margin:0 0 8px")}>Welcome aboard</h1>
              <p style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;margin:0 0 18px")}>
                Five stops: welcome, connect your service, build your page, choose your modules, and
                you&apos;re running.
              </p>
            </div>
          )}

          {step === 2 && (
            <>
              <h1 style={sx("font:700 22px 'Tinos';margin:0 0 4px")}>Link your music</h1>
              <p style={sx("font:400 12.5px/1.5 'Arimo';color:#6b6156;margin:0 0 14px")}>
                Connect at least one to power Now Playing, your charts, and your monthly fare
                receipt. You can skip, but your page runs empty until you connect.
              </p>
              {SERVICES.map((service) => (
                <div key={service.key} className={styles.serviceRow}>
                  <Avatar initials={service.badge} size={30} color={service.color} />
                  <div style={sx('flex:1')}>
                    <div style={sx("font:700 14px 'Arimo'")}>{service.name}</div>
                    <div style={sx("font:400 11px 'JetBrains Mono';color:#6b6156")}>
                      {service.note}
                    </div>
                  </div>
                  <Button
                    css={`
                      border: 1px solid #1e1b18;
                      font: 700 11px 'JetBrains Mono';
                      padding: 9px 16px;
                      letter-spacing: 0.05em;
                      background: ${connected[service.key] ? service.color : 'transparent'};
                      color: ${connected[service.key] ? '#F2ECDF' : '#1E1B18'};
                    `}
                    aria-label={
                      connected[service.key]
                        ? `${service.name} connected`
                        : `Connect ${service.name}`
                    }
                    onClick={() => actions.connectService(service.key)}
                  >
                    {connected[service.key] ? 'CONNECTED ✓' : 'CONNECT'}
                  </Button>
                </div>
              ))}
            </>
          )}

          {step === 3 && (
            <>
              <div style={sx('display:flex;gap:28px;align-items:center;margin-bottom:10px')}>
                <div
                  aria-hidden="true"
                  style={sx(
                    "width:90px;height:90px;border-radius:50%;border:1px dashed rgba(30,27,24,0.4);display:flex;align-items:center;justify-content:center;font:600 10px 'JetBrains Mono';color:#6b6156;text-align:center;flex:none",
                  )}
                >
                  ADD
                  <br />
                  PHOTO
                </div>
                <h1 style={sx("font:700 22px 'Tinos';margin:0")}>Build your page</h1>
              </div>
              <Field
                label="NAME"
                value={ob.name}
                onChange={(value) => actions.setObField('name', value)}
                inputCss="font:700 15px 'Tinos';margin-bottom:12px"
              />
              <Field
                label="HANDLE"
                value={ob.handle}
                onChange={(value) => actions.setObField('handle', value)}
                inputCss="font:500 13px 'JetBrains Mono'"
                error={handleTaken ? `@${ob.handle} is already taken — try another.` : undefined}
                reserveErrorSpace
              />
              <Field
                label="BIO"
                value={ob.bio}
                onChange={(value) => actions.setObField('bio', value)}
                placeholder="Vinyl hoarder. Sunday soul."
              />
            </>
          )}

          {step === 4 && (
            <>
              <h1 style={sx("font:700 22px 'Tinos';margin:0 0 2px")}>What&apos;s on your page?</h1>
              <p style={sx("font:400 12px 'Arimo';color:#6b6156;margin:0 0 10px")}>
                Toggle anytime from settings.
              </p>
              <ul className={styles.list}>
                {musicModules.all.map((m) => (
                  <li key={m.key} className={styles.moduleRow}>
                    <span
                      aria-hidden="true"
                      style={sx(
                        `width:8px;height:8px;border-radius:50%;background:${m.accent};flex:none`,
                      )}
                    />
                    <span style={sx("flex:1;font:600 13px 'Arimo'")}>{m.label}</span>
                    <Toggle
                      checked={modules[m.key]}
                      onChange={() => actions.toggleModule(m.key)}
                      label={`Show ${m.label} on your page`}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 5 && (
            <div style={sx('text-align:center')}>
              <span
                aria-hidden="true"
                style={sx(
                  "width:60px;height:60px;border-radius:50%;border:2px solid #3F6B4F;display:flex;align-items:center;justify-content:center;font:700 28px 'Tinos';color:#3F6B4F;margin:0 auto 14px",
                )}
              >
                ✓
              </span>
              <h1 style={sx("font:700 22px 'Tinos';margin:0")}>Your page is live</h1>
              <p style={sx("font:500 12px 'JetBrains Mono';color:#6b6156;margin:4px 0 0")}>
                mymusic.page/{ob.handle}
              </p>
              {noServiceConnected && (
                <p
                  style={sx(
                    "font:400 11.5px/1.5 'Arimo';color:#B7472A;margin:14px auto 0;max-width:360px",
                  )}
                >
                  No music service connected yet — Now Playing and your charts will stay empty until
                  you connect one in Settings.
                </p>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 ? (
            <Button
              css="font:700 11px 'JetBrains Mono';color:#6b6156;letter-spacing:0.05em"
              onClick={() => router.push(routes.onboarding(step - 1))}
            >
              ← BACK
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant="solid"
            css={`
              padding: 11px 22px;
              opacity: ${blocked ? 0.4 : 1};
            `}
            disabled={blocked}
            onClick={goNext}
          >
            {NEXT_LABELS[step]}
          </Button>
        </div>
      </div>
    </CenteredPage>
  );
}
