import Link from 'next/link';
import { CompanionCardData } from '@/types/database';
import { ShieldCheck, Star, MapPin, Briefcase, ChevronRight, User, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CompanionCardProps {
  companion: CompanionCardData;
  onSelect?: (companion: CompanionCardData) => void;
}

export default function CompanionCard({ companion, onSelect }: CompanionCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Top Header: Avatar & Rate */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <Link
              href={`/companions/${companion.id}`}
              className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border-2 border-emerald-200 shrink-0 hover:scale-105 transition"
            >
              {companion.profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={companion.profile.avatar_url}
                  alt={companion.profile.full_name || 'Companion'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-emerald-600" />
              )}
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/companions/${companion.id}`}
                  className="font-bold text-gray-950 text-lg group-hover:text-emerald-700 hover:underline transition"
                >
                  {companion.profile?.full_name || 'ผู้ช่วยร่วมเดินทาง'}
                </Link>
                {companion.verification_status === 'verified' && (
                  <span title="ยืนยันตัวตนผ่านบัตรประชาชนแล้ว">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {companion.rating_avg.toFixed(1)}
                </span>
                <span>•</span>
                <span>({companion.rating_count} รีวิว)</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  {companion.experience_years} ปี
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xl font-black text-emerald-700">
              {formatPrice(companion.hourly_rate)}
            </span>
            <span className="text-xs text-gray-400 block font-medium">/ ชั่วโมง</span>
          </div>
        </div>

        {/* Bio */}
        {companion.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
            {companion.bio}
          </p>
        )}

        {/* Available Schedule */}
        {companion.available_schedule && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-100 mb-3">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">สะดวก: {companion.available_schedule}</span>
          </div>
        )}

        {/* Skills Tags */}
        {companion.skills && companion.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {companion.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium"
              >
                {skill}
              </span>
            ))}
            {companion.skills.length > 3 && (
              <span className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-400">
                +{companion.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Service Areas */}
        {companion.service_areas && companion.service_areas.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">
              พื้นที่: {companion.service_areas.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Action CTA */}
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(companion)}
          className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-900 font-bold text-sm text-center transition-all flex items-center justify-center gap-2 group/btn border border-emerald-200 hover:border-emerald-700 shadow-2xs cursor-pointer active:scale-98"
        >
          เลือก Companion ท่านนี้
          <ChevronRight className="w-4 h-4 transition group-hover/btn:translate-x-1" />
        </button>
      ) : (
        <Link
          href={`/companions/${companion.id}`}
          className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-900 font-bold text-sm text-center transition-all flex items-center justify-center gap-2 group/btn border border-emerald-200 hover:border-emerald-700 shadow-2xs"
        >
          เลือก Companion ท่านนี้
          <ChevronRight className="w-4 h-4 transition group-hover/btn:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
