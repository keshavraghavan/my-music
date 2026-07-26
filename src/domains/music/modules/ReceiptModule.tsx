'use client';

import { ModuleCard } from '@/core/page-builder';
import sx from '@/sx';
import { useAppState } from '@/state/client-store';

const CARD_CSS =
  "background:#F2ECDF;padding:20px 22px 16px;max-width:320px;margin:0 auto;font-family:'JetBrains Mono'";
const EXPAND_CSS = 'top:56px;right:22px';
const HANDLE_CSS = 'top:8px;right:6px;color:rgba(30,27,24,0.35)';
const DASHES = '-'.repeat(38);

export function ReceiptModule() {
  const { connected, me, receiptLines: lines, receiptMeta } = useAppState();
  const noService = !connected.spotify && !connected.apple;

  return (
    <ModuleCard
      moduleKey="receipt"
      label="Transit Receipt"
      css={CARD_CSS}
      expandCss={EXPAND_CSS}
      handleCss={HANDLE_CSS}
    >
      <h2
        style={sx(
          "text-align:center;font:700 12px 'JetBrains Mono';letter-spacing:0.03em;margin:0",
        )}
      >
        METROPOLITAN TRANSIT AUTHORITY
        <br />
        OF LISTENING
      </h2>
      <div
        aria-hidden="true"
        style={sx("font:400 11px/1.4 'JetBrains Mono';color:#1E1B18;margin:10px 0;white-space:pre")}
      >
        {DASHES}
      </div>
      {noService ? (
        <div
          style={sx(
            "text-align:center;font:400 11px/1.6 'JetBrains Mono';color:#6b6156;padding:14px 0",
          )}
        >
          NO SERVICE CONNECTED — RECEIPT UNAVAILABLE
        </div>
      ) : (
        <>
          <div style={sx("font:400 11px/1.7 'JetBrains Mono';color:#1E1B18")}>
            <div style={sx('display:flex;justify-content:space-between')}>
              <span>STATION</span>
              <span>{receiptMeta.station}</span>
            </div>
            <div style={sx('display:flex;justify-content:space-between')}>
              <span>DATE</span>
              <span>{receiptMeta.date}</span>
            </div>
            <div style={sx('display:flex;justify-content:space-between')}>
              <span>RIDER ID</span>
              <span>@{me.handle.toUpperCase()}</span>
            </div>
          </div>
          <div
            aria-hidden="true"
            style={sx(
              "font:400 11px/1.4 'JetBrains Mono';color:#1E1B18;margin:8px 0;white-space:pre",
            )}
          >
            {DASHES}
          </div>
          <div style={sx("font:700 10.5px 'JetBrains Mono';color:#1E1B18;margin-bottom:4px")}>
            TOP 5 TRACKS THIS MONTH
          </div>
          {lines.map((line) => (
            <div key={line.stop} style={sx("font:400 11px/1.6 'JetBrains Mono';color:#1E1B18")}>
              <div style={sx('display:flex;justify-content:space-between')}>
                <span>
                  {line.stop} {line.title}
                </span>
                <span>{line.mins}</span>
              </div>
              <div style={sx('font-size:9.5px;color:#6b6156')}>
                {'   '}
                {line.artist}
              </div>
            </div>
          ))}
          <div
            aria-hidden="true"
            style={sx(
              "font:400 11px/1.4 'JetBrains Mono';color:#1E1B18;margin:8px 0 4px;white-space:pre",
            )}
          >
            {DASHES}
          </div>
          <div
            style={sx(
              "display:flex;justify-content:space-between;font:700 12px 'JetBrains Mono';color:#1E1B18",
            )}
          >
            <span>TOTAL RIDE TIME</span>
            <span>{receiptMeta.totalRideTime}</span>
          </div>
        </>
      )}
    </ModuleCard>
  );
}
