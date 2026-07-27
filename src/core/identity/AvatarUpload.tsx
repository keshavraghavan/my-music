'use client';

import { useRef, useState } from 'react';
import { Button } from '@/core/ui';
import { completeAvatarUpload } from './actions';

export function AvatarUpload() {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setStatus('Preparing upload…');
    try {
      const response = await fetch('/api/avatar/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const payload = (await response.json()) as {
        error?: string;
        uploadUrl?: string;
        assetUrl?: string;
        headers?: Record<string, string>;
      };
      if (!response.ok || !payload.uploadUrl || !payload.assetUrl || !payload.headers) {
        throw new Error(payload.error ?? 'Could not prepare the upload.');
      }
      setStatus('Uploading…');
      const uploadResponse = await fetch(payload.uploadUrl, {
        method: 'PUT',
        headers: payload.headers,
        body: file,
      });
      if (!uploadResponse.ok) throw new Error('The image upload failed.');
      const result = await completeAvatarUpload(payload.assetUrl);
      if (!result.ok) throw new Error(result.error);
      setStatus('Avatar updated. Refreshing…');
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Avatar upload failed.');
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button
        variant="outline"
        css="padding:8px 14px"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? 'UPLOADING…' : 'UPLOAD AVATAR'}
      </Button>
      <span role="status" style={{ marginLeft: 10, fontSize: 11 }}>
        {status}
      </span>
    </div>
  );
}
