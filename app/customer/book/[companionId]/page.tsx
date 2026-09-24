'use client';

import { use, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useBookingForm } from '@/components/booking/useBookingForm';
import BookingHeader from '@/components/booking/BookingHeader';
import BookingBanners from '@/components/booking/BookingBanners';
import CategorySelector from '@/components/booking/CategorySelector';
import ErrandInfoFields from '@/components/booking/ErrandInfoFields';
import LocationSection from '@/components/booking/LocationSection';
import SchedulePicker from '@/components/booking/SchedulePicker';
import SpecialNeedsFields from '@/components/booking/SpecialNeedsFields';
import BookingSubmitBar from '@/components/booking/BookingSubmitBar';
import VehicleBookingSelector from '@/components/booking/VehicleBookingSelector';

function BookingForm({ companionId }: { companionId: string }) {
  const form = useBookingForm(companionId);

  if (form.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0">
        <Link
          href={`/companions/${companionId}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-emerald-700 mb-4 sm:mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับไปดูโปรไฟล์ผู้ช่วย
        </Link>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 border border-gray-200/80 shadow-lg space-y-6 sm:space-y-8">
          <BookingHeader
            companionName={form.companionName}
            companionRate={form.companionRate}
            companionVehicle={form.companionVehicle}
            totalPrice={form.totalPrice}
          />

          <BookingBanners
            isPrefilled={form.isPrefilled}
            user={form.user}
            errorMsg={form.errorMsg}
            onGoogleLogin={form.handleGoogleLogin}
          />

          <form onSubmit={form.handleSubmit} className="space-y-6">
            <CategorySelector
              categoryId={form.categoryId}
              customCategory={form.customCategory}
              onSelectCategory={form.handleCategorySelect}
              onCustomCategoryChange={form.handleCustomCategoryChange}
            />

            <ErrandInfoFields
              errandTitle={form.errandTitle}
              errandDetails={form.errandDetails}
              onTitleChange={form.setErrandTitle}
              onDetailsChange={form.setErrandDetails}
            />

            <LocationSection
              originAddress={form.originAddress}
              originLat={form.originLat}
              originLng={form.originLng}
              destinationAddress={form.destinationAddress}
              destinationLat={form.destinationLat}
              destinationLng={form.destinationLng}
              onOriginAddressChange={form.setOriginAddress}
              onOriginCoordinatesChange={(lat, lng) => {
                form.setOriginLat(lat);
                form.setOriginLng(lng);
              }}
              onDestinationAddressChange={form.setDestinationAddress}
              onDestinationCoordinatesChange={(lat, lng) => {
                form.setDestinationLat(lat);
                form.setDestinationLng(lng);
              }}
              isMeetAtDestination={form.selectedVehicle === 'none'}
            />

            {/* Vehicle Selection for Booking */}
            <VehicleBookingSelector
              vehicleDetails={form.vehicleDetails}
              selectedVehicle={form.selectedVehicle}
              onSelectVehicle={form.handleSelectVehicle}
            />

            <SchedulePicker
              appointmentDate={form.appointmentDate}
              startTime={form.startTime}
              durationHours={form.durationHours}
              companionRate={form.companionRate}
              onAppointmentDateChange={form.setAppointmentDate}
              onStartTimeChange={form.setStartTime}
              onDurationHoursChange={form.setDurationHours}
            />

            <SpecialNeedsFields
              specialNeeds={form.specialNeeds}
              onSpecialNeedsChange={form.setSpecialNeeds}
              onQuickNeedTag={form.handleQuickNeedTag}
              onClearNeeds={form.handleClearNeeds}
            />

            <BookingSubmitBar
              totalPrice={form.totalPrice}
              submitting={form.submitting}
            />
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ companionId: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingForm companionId={resolvedParams.companionId} />
    </Suspense>
  );
}
