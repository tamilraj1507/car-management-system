import { useState, type FormEvent } from 'react';
import { CheckCircle2, MapPin, ShieldCheck, X } from 'lucide-react';
import type { BodyStyle, Vehicle } from '../types.ts';
import { calculateFinancing, formatCurrency, formatNumber } from '../utils/format.ts';
import { VehicleImage } from './VehicleImage.tsx';

interface PublicShowroomViewProps {
  vehicles: Vehicle[];
  onSubmitInquiry: (payload: {
    name: string;
    email: string;
    phone: string;
    city: string;
    vehicleId: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
    downPayment: number;
    termMonths: 36 | 48 | 60 | 72;
  }) => Promise<void>;
}

export function PublicShowroomView({
  vehicles,
  onSubmitInquiry,
}: PublicShowroomViewProps) {
  const [bodyFilter, setBodyFilter] = useState<BodyStyle | 'All'>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [termMonths, setTermMonths] = useState<36 | 48 | 60 | 72>(60);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('San Francisco, CA');
  const [preferredDate, setPreferredDate] = useState('2026-11-20');
  const [preferredTime, setPreferredTime] = useState('14:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<string | null>(
    null
  );

  const showroomUnits = vehicles.filter(
    (v) =>
      (v.status === 'Available' || v.status === 'Reserved') &&
      (bodyFilter === 'All' || v.bodyStyle === bodyFilter)
  );

  const featuredUnit = showroomUnits[0] ?? vehicles[0];

  const handleOpenInquiry = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSubmittedConfirmation(null);
  };

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      const downPayment = Math.round(
        selectedVehicle.listPrice * (downPaymentPct / 100)
      );
      await onSubmitInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '(415) 555-0182',
        city: city.trim(),
        vehicleId: selectedVehicle.id,
        preferredDate,
        preferredTime,
        notes: notes.trim(),
        downPayment,
        termMonths,
      });
      setSubmittedConfirmation(
        `Confirmed test drive & inquiry for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}. Added directly to the DMS pipeline and schedule.`
      );
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Showroom Hero */}
      {featuredUnit && (
        <section className="bg-slate-900 text-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-blue-300 tracking-wide">
                Meridian Curated Showroom · San Francisco Gallery
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold font-display tracking-tight text-balance leading-tight">
                {featuredUnit.year} {featuredUnit.make} {featuredUnit.model}
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-lg">
                {featuredUnit.notes ||
                  `${featuredUnit.trim} finished in ${featuredUnit.exteriorColor} with ${formatNumber(featuredUnit.mileage)} verified miles.`}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block">
                  Transparent Retail Price
                </span>
                <span className="text-2xl font-semibold font-mono tabular-nums">
                  {formatCurrency(featuredUnit.listPrice)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenInquiry(featuredUnit)}
                className="px-5 py-2.5 text-sm font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Book Test Drive &amp; Quote
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[260px] lg:min-h-full bg-slate-800">
            <VehicleImage
              src={featuredUnit.imageUrl}
              alt={`${featuredUnit.year} ${featuredUnit.make} ${featuredUnit.model}`}
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Showroom Collection Filter & Grid */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 font-display">
              Available Collection
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every inquiry creates a live buyer lead, test drive appointment, and deal file in the DMS
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {(['All', 'Sedan', 'SUV', 'Wagon', 'Coupe'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setBodyFilter(style)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  bodyFilter === style
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {showroomUnits.map((vehicle) => {
            const sampleFinance = calculateFinancing({
              salePrice: vehicle.listPrice,
              tradeInValue: 0,
              downPayment: Math.round(vehicle.listPrice * 0.2),
              docFee: 695,
              taxRate: 8.625,
              apr: 5.49,
              termMonths: 60,
            });
            return (
              <article
                key={vehicle.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <VehicleImage
                    src={vehicle.imageUrl}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {vehicle.year} · {vehicle.fuelType} · {formatNumber(vehicle.mileage)} mi
                      </span>
                      <span
                        className={`font-medium ${
                          vehicle.status === 'Available'
                            ? 'text-emerald-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {vehicle.status}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-lg font-semibold text-slate-900 font-display">
                      {vehicle.make} {vehicle.model}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {vehicle.trim} · {vehicle.exteriorColor}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(vehicle.listPrice)}
                      </div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        Est. {formatCurrency(sampleFinance.monthlyPayment)}/mo
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenInquiry(vehicle)}
                      className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Reserve / Test Drive
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Customer Inquiry & Payment Estimator Modal */}
      {selectedVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reserve or Schedule Test Drive"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedVehicle.trim} · Stock #{selectedVehicle.stockNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                aria-label="Close modal"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittedConfirmation ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-semibold text-slate-900 font-display">
                  Showroom Reservation Received
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  {submittedConfirmation}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Return to Showroom
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="p-6 space-y-5">
                {/* Live Payment Estimator */}
                {(() => {
                  const dp = Math.round(
                    selectedVehicle.listPrice * (downPaymentPct / 100)
                  );
                  const est = calculateFinancing({
                    salePrice: selectedVehicle.listPrice,
                    tradeInValue: 0,
                    downPayment: dp,
                    docFee: 695,
                    taxRate: 8.625,
                    apr: 5.49,
                    termMonths,
                  });
                  return (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Estimated Payment (5.49% APR)
                        </span>
                        <span className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                          {formatCurrency(est.monthlyPayment)}/mo
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Down Payment ({downPaymentPct}% · {formatCurrency(dp)})
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={5}
                          value={downPaymentPct}
                          onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                          className="w-full accent-blue-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Loan Term
                        </label>
                        <select
                          value={termMonths}
                          onChange={(e) =>
                            setTermMonths(
                              Number(e.target.value) as 36 | 48 | 60 | 72
                            )
                          }
                          className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-200 rounded-lg"
                        >
                          <option value={36}>36 Months</option>
                          <option value={48}>48 Months</option>
                          <option value={60}>60 Months</option>
                          <option value={72}>72 Months</option>
                        </select>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jordan Blake"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(415) 555-0129"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      required
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Questions or Trade-In Details
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional trade-in VIN/mileage or specific questions..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      150-Point Certified
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVehicle.location}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Test Drive & Inquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
