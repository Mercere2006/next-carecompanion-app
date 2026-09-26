// Helper for managing companion heart/like state on customer reviews
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'carecompanion_liked_reviews';

/**
 * Get map of reviewId -> liked (boolean) from localStorage
 */
export function getLikedReviewsMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading liked reviews from localStorage:', e);
    return {};
  }
}

/**
 * Check if a review has been liked by the companion
 */
export function isReviewLiked(reviewId: string, initialDbLiked?: boolean): boolean {
  if (typeof window === 'undefined') return Boolean(initialDbLiked);
  const map = getLikedReviewsMap();
  if (typeof map[reviewId] === 'boolean') {
    return map[reviewId];
  }
  return Boolean(initialDbLiked);
}

/**
 * Set the liked state for a review (with Supabase sync fallback)
 */
export async function setReviewLiked(reviewId: string, liked: boolean): Promise<boolean> {
  if (typeof window === 'undefined' || !reviewId) return liked;

  try {
    // 1. Update localStorage
    const map = getLikedReviewsMap();
    map[reviewId] = liked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));

    // 2. Dispatch CustomEvent for intra-page reactivity
    window.dispatchEvent(
      new CustomEvent('carecompanion_review_heart_updated', {
        detail: { reviewId, liked },
      })
    );

    // 3. Background sync to Supabase (safe fallback if column doesn't exist yet)
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('reviews')
        .update({ liked_by_companion: liked })
        .eq('id', reviewId);

      if (error && error.code !== '42703') {
        // 42703 is Postgres column does not exist - ignorable until migration is run
        console.warn('Could not sync review heart to Supabase:', error.message);
      }
    } catch (dbErr) {
      // Safe fallback
    }
  } catch (err) {
    console.error('Error updating review heart:', err);
  }

  return liked;
}

/**
 * Toggle heart state for a review
 */
export async function toggleReviewHeart(
  reviewId: string,
  currentLiked: boolean
): Promise<boolean> {
  const nextLiked = !currentLiked;
  return await setReviewLiked(reviewId, nextLiked);
}
