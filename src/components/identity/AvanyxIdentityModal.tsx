import React from 'react';
import { AvanyxIdentityAuthCard } from './AvanyxIdentityAuthCard';

export interface AvanyxIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  initialMode?: 'LOGIN' | 'REGISTER';
  onSuccess?: () => void;
}

export const AvanyxIdentityModal: React.FC<AvanyxIdentityModalProps> = ({
  isOpen,
  onClose,
  appName = 'AVANYX Store',
  initialMode = 'LOGIN',
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg animate-scaleUp">
        <AvanyxIdentityAuthCard
          appName={appName}
          initialMode={initialMode}
          variant="modal"
          showCloseButton
          onCancel={onClose}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }}
        />
      </div>
    </div>
  );
};
