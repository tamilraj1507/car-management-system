import { useState } from 'react';
import {
  CalendarPlus,
  CheckSquare,
  Edit3,
  Handshake,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import type { PrepChecklist, Vehicle, VehicleStatus } from '../types.ts';
import { formatCurrency, formatNumber } from '../utils/format.ts';
import { VehicleImage } from './VehicleImage.tsx';

interface VehicleDrawerProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onEdit: (vehicle: Vehicle) => void;
  onUpdateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
  onStartDeal: (vehicle: Vehicle) => void;
  onScheduleTestDrive: (vehicle: Vehicle) => void;
}

const CHECKLIST_LABELS: { key: keyof PrepChecklist; label: string }[] = [
  { key: 'inspection', label: '150-Point Mechanical & Battery Inspection' },
  { key: 'detailing', label: 'Interior & Exterior Paint Correction Detail' },
  { key: 'photography', label: 'Studio Photography & Window Sticker' },
  { key: 'pricingVerified', label: 'Market Comp & Margin Pricing Verified' },
];

export function VehicleDrawer({
  vehicle,
  onClose,
  onEdit,
  onUpdateVehicle,
  onDeleteVehicle,
  onStartDeal,
  onScheduleTestDrive,
}: VehicleDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!vehicle) return null;

  const grossMargin = vehicle.listPrice - vehicle.costPrice;
  const marginPct =
    vehicle.listPrice > 0
      ? ((grossMargin / vehicle.listPrice) * 100).toFixed(1)
      : '0.0';

  const toggleChecklist = (key: keyof PrepChecklist) => {
    onUpdateVehicle(vehicle.id, {
      prepChecklist: {
        ...vehicle.prepChecklist,
        [key]: !vehicle.prepChecklist[key],
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model} details`}
    >
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
        {/* Sticky Drawer Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-500 tabular-nums">
              {vehicle.stockNumber} · VIN {vehicle.vin}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 font-display truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <VehicleImage
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Pricing & Margin Strip */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs text-slate-500 block">List Price</span>
              <span className="text-lg font-semibold text-slate-900 font-mono tabular-nums">
                {formatCurrency(vehicle.listPrice)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Acquisition Cost</span>
              <span className="text-lg font-semibold text-slate-700 font-mono tabular-nums">
                {formatCurrency(vehicle.costPrice)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Projected Gross</span>
              <span className="text-lg font-semibold text-emerald-700 font-mono tabular-nums">
                +{formatCurrency(grossMargin)} ({marginPct}%)
              </span>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-2">
              Unit Availability Status
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(['Available', 'Reserved', 'In Prep', 'Sold'] as VehicleStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onUpdateVehicle(vehicle.id, { status })}
                    className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      vehicle.status === status
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Specifications Grid */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 font-display mb-3">
              Specifications &amp; Lot Location
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-slate-100 pt-3">
              <div>
                <dt className="text-xs text-slate-500">Trim &amp; Body</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {vehicle.trim} · {vehicle.bodyStyle}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Mileage / Age</dt>
                <dd className="font-medium text-slate-900 font-mono tabular-nums mt-0.5">
                  {formatNumber(vehicle.mileage)} mi · {vehicle.daysInStock} days
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Powertrain</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {vehicle.fuelType} · {vehicle.horsepower} hp
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Transmission / Drive</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {vehicle.transmission} · {vehicle.drivetrain}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Exterior / Interior</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {vehicle.exteriorColor} / {vehicle.interiorColor}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Lot Bay</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {vehicle.location}
                </dd>
              </div>
            </dl>
          </div>

          {/* Pre-Delivery Prep Checklist */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 font-display mb-2.5">
              Pre-Delivery Readiness Checklist
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {CHECKLIST_LABELS.map((item) => {
                const checked = vehicle.prepChecklist[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleChecklist(item.key)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        checked ? 'text-slate-900 font-medium' : 'text-slate-600'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {vehicle.notes && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-display mb-1.5">
                Merchandising &amp; Condition Notes
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {vehicle.notes}
              </p>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Unit from Inventory
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-rose-700 font-medium">
                  Confirm permanent removal?
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteVehicle(vehicle.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-md cursor-pointer"
                >
                  Delete Unit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer Actions */}
        {vehicle.status !== 'Sold' && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onScheduleTestDrive(vehicle)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <CalendarPlus className="w-4 h-4" />
              Schedule Test Drive
            </button>
            <button
              type="button"
              onClick={() => onStartDeal(vehicle)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Handshake className="w-4 h-4" />
              Create Sales Deal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
