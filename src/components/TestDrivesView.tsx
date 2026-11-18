import { useState, type FormEvent } from 'react';
import { Calendar, Clock, Handshake, Plus, X } from 'lucide-react';
import type { Customer, TestDrive, TestDriveStatus, Vehicle } from '../types.ts';
import { formatShortDate } from '../utils/format.ts';
import { VehicleImage } from './VehicleImage.tsx';

interface TestDrivesViewProps {
  testDrives: TestDrive[];
  vehicles: Vehicle[];
  customers: Customer[];
  salesReps: string[];
  preselectedVehicleId?: string | null;
  onClearPreselect?: () => void;
  onCreateTestDrive: (payload: Omit<TestDrive, 'id'>) => Promise<void>;
  onUpdateTestDrive: (id: string, patch: Partial<TestDrive>) => Promise<void>;
  onStartDeal: (vehicle: Vehicle, customerId: string) => void;
}

const STATUS_FILTERS: ('All' | TestDriveStatus)[] = [
  'All',
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
];

function getStatusClass(status: TestDriveStatus): string {
  switch (status) {
    case 'Scheduled':
      return 'text-blue-700';
    case 'In Progress':
      return 'text-amber-700';
    case 'Completed':
      return 'text-emerald-700';
    case 'Cancelled':
      return 'text-slate-500';
  }
}

export function TestDrivesView({
  testDrives,
  vehicles,
  customers,
  salesReps,
  preselectedVehicleId,
  onClearPreselect,
  onCreateTestDrive,
  onUpdateTestDrive,
  onStartDeal,
}: TestDrivesViewProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | TestDriveStatus>('All');
  const [showScheduleModal, setShowScheduleModal] = useState(
    Boolean(preselectedVehicleId)
  );
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState('');

  const availableVehicles = vehicles.filter((v) => v.status !== 'Sold');
  const [vehicleId, setVehicleId] = useState(
    preselectedVehicleId ?? availableVehicles[0]?.id ?? vehicles[0]?.id ?? ''
  );
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [salesRep, setSalesRep] = useState(salesReps[0] ?? 'Elena Vance');
  const [scheduledDate, setScheduledDate] = useState('2026-11-18');
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [routeNotes, setRouteNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = testDrives.filter((td) =>
    statusFilter === 'All' ? true : td.status === statusFilter
  );

  const handleCloseModal = () => {
    setShowScheduleModal(false);
    onClearPreselect?.();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !customerId) return;
    setSaving(true);
    try {
      await onCreateTestDrive({
        vehicleId,
        customerId,
        salesRep,
        scheduledDate,
        scheduledTime,
        status: 'Scheduled',
        routeNotes: routeNotes.trim() || 'Standard dealership loop.',
        feedback: '',
      });
      setRouteNotes('');
      handleCloseModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab === 'All'
                ? testDrives.length
                : testDrives.filter((t) => t.status === tab).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowScheduleModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule Test Drive
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900 font-display">
            No appointments in this view
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Schedule a test drive for an active prospect or switch status tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((td) => {
            const vehicle = vehicles.find((v) => v.id === td.vehicleId);
            const customer = customers.find((c) => c.id === td.customerId);
            const isEditingFeedback = editingFeedbackId === td.id;

            return (
              <div
                key={td.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <VehicleImage
                    src={vehicle?.imageUrl ?? ''}
                    alt={
                      vehicle
                        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                        : 'Vehicle'
                    }
                    className="w-24 h-18 rounded-lg object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-500 tabular-nums">
                        {vehicle?.stockNumber ?? 'UNIT'} · Rep: {td.salesRep}
                      </span>
                      <span className={`font-semibold ${getStatusClass(td.status)}`}>
                        {td.status}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 font-display mt-1 truncate">
                      {customer?.name ?? 'Client'}
                    </h3>
                    <p className="text-xs text-slate-600 truncate">
                      {vehicle
                        ? `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
                        : 'Selected Vehicle'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatShortDate(td.scheduledDate)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {td.scheduledTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-3">
                  <p>
                    <strong className="text-slate-800">Route / Notes:</strong>{' '}
                    {td.routeNotes}
                  </p>
                  {td.feedback && !isEditingFeedback && (
                    <p className="text-emerald-800 bg-emerald-50/70 px-3 py-2 rounded-lg border border-emerald-200/70">
                      <strong>Post-Drive Feedback:</strong> {td.feedback}
                    </p>
                  )}
                  {isEditingFeedback && (
                    <div className="pt-1 space-y-2">
                      <textarea
                        rows={2}
                        value={feedbackDraft}
                        onChange={(e) => setFeedbackDraft(e.target.value)}
                        placeholder="Record buyer impressions, trade-in discussion, or next steps..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onUpdateTestDrive(td.id, {
                              status: 'Completed',
                              feedback: feedbackDraft.trim(),
                            });
                            setEditingFeedbackId(null);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md cursor-pointer"
                        >
                          Save &amp; Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFeedbackId(null)}
                          className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {td.status === 'Scheduled' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTestDrive(td.id, { status: 'In Progress' })
                          }
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                        >
                          Check Out Keys
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTestDrive(td.id, { status: 'Cancelled' })
                          }
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {td.status === 'In Progress' && !isEditingFeedback && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFeedbackId(td.id);
                          setFeedbackDraft(td.feedback);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer"
                      >
                        Log Return &amp; Feedback
                      </button>
                    )}
                  </div>

                  {vehicle && vehicle.status !== 'Sold' && (
                    <button
                      type="button"
                      onClick={() => onStartDeal(vehicle, td.customerId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <Handshake className="w-3.5 h-3.5" />
                      Convert to Deal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Schedule Test Drive"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 font-display">
                Schedule Test Drive
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close modal"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Vehicle
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.stockNumber} — {v.year} {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Buyer / Client
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sales Rep
                  </label>
                  <select
                    value={salesRep}
                    onChange={(e) => setSalesRep(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    {salesReps.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Route &amp; Prep Notes
                </label>
                <textarea
                  rows={2}
                  value={routeNotes}
                  onChange={(e) => setRouteNotes(e.target.value)}
                  placeholder="Highway loop, child seat check, charging demo..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
