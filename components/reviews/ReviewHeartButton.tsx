'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { isReviewLiked, toggleReviewHeart } from '@/lib/reviewHearts';

interface ReviewHeartButtonProps {
  reviewId: string;
  initialLiked?: boolean;
  canLike?: boolean; // True if the current user is the companion who received this review
  compact?: boolean;
  className?: string;
}

export default function ReviewHeartButton({
  reviewId,
  initialLiked = false,
  canLike = false,
  compact = false,
  className = '',
}: ReviewHeartButtonProps) {
  const [liked, setLiked] = useState<boolean>(() => isReviewLiked(reviewId, initialLiked));
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync state on mount and when custom event fires
  useEffect(() => {
    setLiked(isReviewLiked(reviewId, initialLiked));

    const handleHeartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ reviewId: string; liked: boolean }>;
      if (customEvent.detail && customEvent.detail.reviewId === reviewId) {
        setLiked(customEvent.detail.liked);
      }
    };

    window.addEventListener('carecompanion_review_heart_updated', handleHeartUpdate);
    window.addEventListener('storage', handleHeartUpdate);

    return () => {
      window.removeEventListener('carecompanion_review_heart_updated', handleHeartUpdate);
      window.removeEventListener('storage', handleHeartUpdate);
    };
  }, [reviewId, initialLiked]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canLike) return;

    setIsAnimating(true);
    const newLiked = await toggleReviewHeart(reviewId, liked);
    setLiked(newLiked);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // 1. Companion view: Interactive heart button
  if (canLike) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={liked ? 'คลิกเพื่อยกเลิกการส่งหัวใจ' : 'คลิกเพื่อส่งหัวใจขอบคุณลูกค้า'}
        className={`inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 ${
          compact ? 'px-2 py-1 text-xs rounded-lg' : 'px-3 py-1.5 text-xs rounded-xl font-bold'
        } ${
          liked
            ? 'bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs hover:bg-rose-100/80'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50'
        } ${className}`}
      >
        <Heart
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            liked
              ? 'fill-rose-500 text-rose-500'
              : 'text-gray-400 hover:text-rose-500'
          } ${isAnimating ? 'scale-130' : 'scale-100'}`}
        />
        <span>{liked ? 'ส่งหัวใจแล้ว' : 'ส่งหัวใจขอบคุณ'}</span>
      </button>
    );
  }

  // 2. Public / Customer view: Show charming badge if companion liked this review
  if (liked) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50/90 text-rose-700 border border-rose-200/80 shadow-2xs ${className}`}
      >
        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
        <span>ผู้ช่วยส่งหัวใจให้รีวิวนี้</span>
      </div>
    );
  }

  // If not liked and not the companion, show nothing
  return null;
}
