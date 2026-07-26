'use client';

import sx from '@/sx';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Destructive actions take the red button. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} size="sm" layer="top">
      <p style={sx("font:400 13px/1.5 'Arimo';color:#6b6156;margin:0 0 20px")}>{message}</p>
      <div style={sx('display:flex;gap:10px;justify-content:flex-end')}>
        <Button variant="outline" css="padding:10px 16px" onClick={onCancel}>
          CANCEL
        </Button>
        <Button
          variant="solid"
          css={`
            padding: 10px 16px;
            background: ${danger ? '#B7472A' : '#1E1B18'};
          `}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
