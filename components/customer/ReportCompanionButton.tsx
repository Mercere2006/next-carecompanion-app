'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportCompanionModal from './ReportCompanionModal';

interface ReportCompanionButtonProps {
  companionId: string;
  companionName: string;
  companionAvatar?: string | null;
  className?: string;
  onSuccess?: () => void;
}

export default function ReportCompanionButton({
  companionId,
  companionName,
  companionAvatar,
  className = '',
  onSuccess,
}: ReportCompanionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl border border-gray-200 hover:border-rose-200 transition cursor-pointer ${className}`}
      >
        <Flag className="w-3.5 h-3.5 text-rose-500" />
        <span>รายงานผู้ช่วยท่านนี้</span>
      </button>

      <ReportCompanionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        companionId={companionId}
        companionName={companionName}
        companionAvatar={companionAvatar}
        onSuccess={onSuccess}
      />
    </>
  );
}
