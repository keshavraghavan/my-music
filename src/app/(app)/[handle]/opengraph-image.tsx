import { ImageResponse } from 'next/og';
import { loadPersonByHandle } from '@/core/db/read-model';

export const alt = 'MyMusic profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const person = await loadPersonByHandle(handle);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#F2ECDF',
        color: '#1E1B18',
        padding: '64px 72px',
        border: '18px solid #1E1B18',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28 }}>
        <span>MyMusic.</span>
        <span>METROPOLITAN LISTENING NETWORK</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'serif', fontSize: 92, lineHeight: 1 }}>
          {person?.name ?? 'Listener not found'}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 34, marginTop: 24 }}>
          @{person?.handle ?? handle} {person?.private ? '｜ PRIVATE LINE' : '｜ NOW BOARDING'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {['#3F6B4F', '#B7472A', '#C9A227', '#2F5673'].map((color) => (
          <div key={color} style={{ width: 120, height: 14, background: color }} />
        ))}
      </div>
    </div>,
    size,
  );
}
