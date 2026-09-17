// Utility functions for Care Companion

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatThaiDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusBadgeInfo(status: string) {
  switch (status) {
    case 'pending':
      return {
        label: 'รอการตอบรับ',
        bgColor: 'bg-amber-100 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500',
      };
    case 'accepted':
      return {
        label: 'ยืนยันแล้ว / รอเริ่มงาน',
        bgColor: 'bg-blue-100 text-blue-800 border-blue-300',
        dotColor: 'bg-blue-500',
      };
    case 'in_progress':
      return {
        label: 'กำลังเดินทาง / ทำธุระ',
        bgColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        dotColor: 'bg-indigo-500 animate-pulse',
      };
    case 'completed':
      return {
        label: 'เสร็จสิ้นภารกิจ',
        bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-500',
      };
    case 'rejected':
      return {
        label: 'ปฏิเสธคำขอ',
        bgColor: 'bg-rose-100 text-rose-800 border-rose-300',
        dotColor: 'bg-rose-500',
      };
    case 'cancelled':
      return {
        label: 'ยกเลิกแล้ว',
        bgColor: 'bg-gray-100 text-gray-700 border-gray-300',
        dotColor: 'bg-gray-400',
      };
    default:
      return {
        label: status,
        bgColor: 'bg-gray-100 text-gray-700 border-gray-300',
        dotColor: 'bg-gray-400',
      };
  }
}
