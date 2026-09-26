import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
  subTextClassName?: string;
  badgeClassName?: string;
  priority?: boolean;
}

export default function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = 'text-gray-950',
  subTextClassName = 'text-gray-500',
  badgeClassName = 'bg-emerald-100 text-emerald-800 border-emerald-200',
  priority = false,
}: BrandLogoProps) {
  const sizeMap = {
    sm: {
      box: 'w-8 h-8 rounded-xl p-1',
      img: 28,
      title: 'text-base',
      sub: 'text-[9px]',
      badge: 'text-[8px] px-1.5 py-0.5',
    },
    md: {
      box: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl p-1.5',
      img: 40,
      title: 'text-lg sm:text-2xl',
      sub: 'text-[10px] sm:text-[11px]',
      badge: 'text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5',
    },
    lg: {
      box: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl p-2.5',
      img: 56,
      title: 'text-2xl sm:text-3xl',
      sub: 'text-xs sm:text-sm',
      badge: 'text-xs px-2 py-0.5',
    },
    xl: {
      box: 'w-20 h-20 rounded-3xl p-3.5',
      img: 72,
      title: 'text-3xl sm:text-4xl',
      sub: 'text-sm sm:text-base',
      badge: 'text-xs px-2.5 py-1',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <div
        className={`${currentSize.box} bg-white border border-emerald-100 shadow-md shadow-emerald-200/50 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-emerald-200`}
      >
        <Image
          src="/images/logo-icon.png"
          alt="Care Companion Logo"
          width={currentSize.img}
          height={currentSize.img}
          priority={priority}
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="min-w-0">
          <span
            className={`${currentSize.title} font-black tracking-tight flex items-center gap-1 sm:gap-1.5 truncate ${textClassName}`}
          >
            Care Companion
            <span
              className={`${currentSize.badge} font-bold rounded-full border shrink-0 ${badgeClassName}`}
            >
              TH
            </span>
          </span>
          <p className={`${currentSize.sub} font-medium truncate ${subTextClassName}`}>
            เพื่อนร่วมทางที่คุณอุ่นใจ
          </p>
        </div>
      )}
    </div>
  );
}
