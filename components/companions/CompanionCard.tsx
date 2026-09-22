import Link from 'next/link';
import { CompanionCardData } from '@/types/database';
import { ShieldCheck, Star, MapPin, Briefcase, ChevronRight, User, Clock, Lock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { parseVehicleDetails, extractCleanBio } from '@/lib/vehicleUtils';

interface CompanionCardProps {
  companion: CompanionCardData;
  onSelect?: (companion: CompanionCardData) => void;
  currentUser?: { id: string } | null;
}

export default function CompanionCard({
  companion,
  onSelect,
  currentUser,
}: CompanionCardProps) {
  const { embeddedSchedule } = extractCleanBio(companion.bio);
  const parsedVehicles = parseVehicleDetails(
    companion.vehicle_type,
    companion.vehicle_model,
    companion.vehicle_plate,
    companion.hourly_rate,
    companion.bio
  );
  const activeSchedule = companion.available_schedule || embeddedSchedule;
  const isGoogleAvatar = (url?: string | null) =>
    Boolean(url && (url.includes('googleusercontent.com') || url.includes('google.com')));

  const isSelf = Boolean(currentUser?.id && currentUser.id === companion.id);
  const resolvedAvatar =
    companion.profile?.avatar_url && !isGoogleAvatar(companion.profile.avatar_url)
      ? companion.profile.avatar_url
      : companion.id_card_image_url || companion.profile?.avatar_url || '';

  return (
    <div className={`bg-white rounded-3xl p-4 sm:p-6 border transition-all duration-300 flex flex-col justify-between group min-w-0 overflow-hidden ${isSelf ? 'border-amber-300 ring-2 ring-amber-100 shadow-md' : 'border-gray-200/80 shadow-xs hover:shadow-xl hover:border-emerald-300'}`}>
      <div className="min-w-0">
        {/* Top Header: Avatar & Rate */}
        <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4 min-w-0">
          <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <Link
              href={isSelf ? '/companion/profile' : `/companions/${companion.id}`}
              className="w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden border-2 border-emerald-200 shrink-0 hover:scale-105 transition"
            >
              {resolvedAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedAvatar}
                  alt={companion.profile?.full_name || 'Companion'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-600" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <Link
                  href={isSelf ? '/companion/profile' : `/companions/${companion.id}`}
                  className="font-bold text-gray-950 text-sm sm:text-base md:text-lg group-hover:text-emerald-700 hover:underline transition truncate block"
                >
                  {companion.profile?.full_name || 'ผู้ช่วยร่วมเดินทาง'}
                </Link>
                {isSelf && (
                  <span className="shrink-0 text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg">
                    โปรไฟล์ของคุณ
                  </span>
                )}
                {companion.verification_status === 'verified' && (
                  <span
                    title="ยืนยันตัวตนด้วยสแกนใบหน้าและเบอร์โทรศัพท์แล้ว"
                    className="shrink-0 text-emerald-600"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500 min-w-0">
                <span className="flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400" />
                  {companion.rating_avg.toFixed(1)}
                </span>
                <span>•</span>
                <span className="shrink-0">({companion.rating_count} รีวิว)</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                  {companion.experience_years} ปี
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 pl-1">
            {parsedVehicles.type === 'both' ? (
              <>
                <span className="text-sm sm:text-base md:text-lg font-black text-emerald-700 block whitespace-nowrap">
                  ฿{parsedVehicles.motorcycle.rate} - ฿{parsedVehicles.car.rate}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 block font-medium">
                  / ชม. (ตามพาหนะ)
                </span>
              </>
            ) : (
              <>
                <span className="text-base sm:text-xl font-black text-emerald-700 block">
                  {formatPrice(companion.hourly_rate)}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 block font-medium">/ ชั่วโมง</span>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {companion.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
            {companion.bio}
          </p>
        )}

        {/* Vehicle Information with Privacy Auth Gate */}
        {parsedVehicles.type === 'both' ? (
          <div className="space-y-1.5 mb-3">
            {/* Car row */}
            <div className="flex items-center justify-between gap-1.5 text-xs bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-100 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm shrink-0">🚗</span>
                <span className="font-bold text-gray-800 truncate">
                  {parsedVehicles.car.model || 'รถยนต์ส่วนตัว'}
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded shrink-0">
                  ฿{parsedVehicles.car.rate}/ชม.
                </span>
              </div>
              <div className="shrink-0 text-[11px]">
                {currentUser ? (
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    {parsedVehicles.car.plate || 'มีทะเบียนรถ'}
                  </span>
                ) : (
                  <span className="text-gray-400 font-medium flex items-center gap-0.5 bg-white/80 px-1.5 py-0.5 rounded-md border border-gray-200 text-[10px]">
                    <Lock className="w-2.5 h-2.5" />
                    <span>ทะเบียน</span>
                  </span>
                )}
              </div>
            </div>
            {/* Motorcycle row */}
            <div className="flex items-center justify-between gap-1.5 text-xs bg-teal-50/70 px-3 py-1.5 rounded-xl border border-teal-100 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm shrink-0">🛵</span>
                <span className="font-bold text-gray-800 truncate">
                  {parsedVehicles.motorcycle.model || 'รถมอเตอร์ไซค์'}
                </span>
                <span className="text-[10px] text-teal-800 font-bold bg-teal-100/80 px-1.5 py-0.5 rounded shrink-0">
                  ฿{parsedVehicles.motorcycle.rate}/ชม.
                </span>
              </div>
              <div className="shrink-0 text-[11px]">
                {currentUser ? (
                  <span className="font-mono font-bold text-teal-900 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                    {parsedVehicles.motorcycle.plate || 'มีทะเบียนรถ'}
                  </span>
                ) : (
                  <span className="text-gray-400 font-medium flex items-center gap-0.5 bg-white/80 px-1.5 py-0.5 rounded-md border border-gray-200 text-[10px]">
                    <Lock className="w-2.5 h-2.5" />
                    <span>ทะเบียน</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : parsedVehicles.type === 'car' ? (
          <div className="flex items-center justify-between gap-1.5 text-xs bg-emerald-50/70 px-3 py-2 rounded-xl border border-emerald-100 mb-3 min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-base shrink-0">🚗</span>
              <span className="font-bold text-gray-800 truncate">
                {parsedVehicles.car.model || 'รถยนต์ส่วนตัว'}
              </span>
            </div>
            <div className="shrink-0 text-[11px]">
              {currentUser ? (
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  {parsedVehicles.car.plate || 'มีทะเบียนรถ'}
                </span>
              ) : (
                <span className="text-gray-500 font-medium flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-gray-200">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>เข้าสู่ระบบเพื่อดูทะเบียน</span>
                </span>
              )}
            </div>
          </div>
        ) : parsedVehicles.type === 'motorcycle' ? (
          <div className="flex items-center justify-between gap-1.5 text-xs bg-teal-50/70 px-3 py-2 rounded-xl border border-teal-100 mb-3 min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-base shrink-0">🛵</span>
              <span className="font-bold text-gray-800 truncate">
                {parsedVehicles.motorcycle.model || 'รถมอเตอร์ไซค์'}
              </span>
            </div>
            <div className="shrink-0 text-[11px]">
              {currentUser ? (
                <span className="font-mono font-bold text-teal-900 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  {parsedVehicles.motorcycle.plate || 'มีทะเบียนรถ'}
                </span>
              ) : (
                <span className="text-gray-500 font-medium flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-gray-200">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>เข้าสู่ระบบเพื่อดูทะเบียน</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 mb-3 min-w-0">
            <span className="text-sm shrink-0">🚶</span>
            <span className="truncate text-gray-600">ร่วมเดินทางด้วยระบบขนส่งสาธารณะ (BTS/MRT/แท็กซี่)</span>
          </div>
        )}

        {/* Available Schedule */}
        {activeSchedule && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/80 mb-3">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">สะดวก: {activeSchedule}</span>
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
      {isSelf ? (
        <Link
          href="/companion/profile"
          className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm text-center transition-all flex items-center justify-center gap-2 group/btn shadow-xs cursor-pointer active:scale-98"
        >
          จัดการโปรไฟล์ของคุณ
          <ChevronRight className="w-4 h-4 transition group-hover/btn:translate-x-1" />
        </Link>
      ) : onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(companion)}
          className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-900 font-bold text-sm text-center transition-all flex items-center justify-center gap-2 group/btn border border-emerald-200 hover:border-emerald-700 shadow-2xs cursor-pointer active:scale-98"
        >
          เลือกผู้ช่วยท่านนี้
          <ChevronRight className="w-4 h-4 transition group-hover/btn:translate-x-1" />
        </button>
      ) : (
        <Link
          href={`/companions/${companion.id}`}
          className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-900 font-bold text-sm text-center transition-all flex items-center justify-center gap-2 group/btn border border-emerald-200 hover:border-emerald-700 shadow-2xs"
        >
          เลือกผู้ช่วยท่านนี้
          <ChevronRight className="w-4 h-4 transition group-hover/btn:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
