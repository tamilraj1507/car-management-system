import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { STUDIO_IMAGE_PRESETS } from '../data/seedData.ts';
import type { BodyStyle, FuelType, Vehicle, VehicleStatus } from '../types.ts';
import { formatCurrency } from '../utils/format.ts';

interface VehicleModalProps {
  initialVehicle?: Vehicle | null;
  onClose: () => void;
  onSave: (
    payload: Omit<Vehicle, 'id' | 'createdAt'>,
    existingId?: string
  ) => Promise<void>;
}

export function VehicleModal({
  initialVehicle,
  onClose,
  onSave,
}: VehicleModalProps) {
  const [stockNumber, setStockNumber] = useState(
    initialVehicle?.stockNumber ?? `MRD-${Math.floor(2510 + Math.random() * 400)}`
  );
  const [vin, setVin] = useState(initialVehicle?.vin ?? '');
  const [year, setYear] = useState(initialVehicle?.year ?? 2025);
  const [make, setMake] = useState(initialVehicle?.make ?? '');
  const [model, setModel] = useState(initialVehicle?.model ?? '');
  const [trim, setTrim] = useState(initialVehicle?.trim ?? '');
  const [bodyStyle, setBodyStyle] = useState<BodyStyle>(
    initialVehicle?.bodyStyle ?? 'SUV'
  );
  const [fuelType, setFuelType] = useState<FuelType>(
    initialVehicle?.fuelType ?? 'Hybrid'
  );
  const [transmission, setTransmission] = useState(
    initialVehicle?.transmission ?? '8-Speed Automatic'
  );
  const [drivetrain, setDrivetrain] = useState(
    initialVehicle?.drivetrain ?? 'AWD'
  );
  const [exteriorColor, setExteriorColor] = useState(
    initialVehicle?.exteriorColor ?? 'Graphite Metallic'
  );
  const [interiorColor, setInteriorColor] = useState(
    initialVehicle?.interiorColor ?? 'Charcoal Leather'
  );
  const [mileage, setMileage] = useState(initialVehicle?.mileage ?? 150);
  const [horsepower, setHorsepower] = useState(
    initialVehicle?.horsepower ?? 380
  );
  const [costPrice, setCostPrice] = useState(initialVehicle?.costPrice ?? 58000);
  const [listPrice, setListPrice] = useState(initialVehicle?.listPrice ?? 64900);
  const [status, setStatus] = useState<VehicleStatus>(
    initialVehicle?.status ?? 'Available'
  );
  const [daysInStock, setDaysInStock] = useState(
    initialVehicle?.daysInStock ?? 1
  );
  const [location, setLocation] = useState(
    initialVehicle?.location ?? 'Showroom Bay A2'
  );
  const [imageUrl, setImageUrl] = useState(
    initialVehicle?.imageUrl ?? STUDIO_IMAGE_PRESETS[0].url
  );
  const [notes, setNotes] = useState(initialVehicle?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const projectedMargin = listPrice - costPrice;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !vin.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          stockNumber: stockNumber.trim(),
          vin: vin.trim().toUpperCase(),
          year: Number(year),
          make: make.trim(),
          model: model.trim(),
          trim: trim.trim() || 'Base',
          bodyStyle,
          fuelType,
          transmission: transmission.trim(),
          drivetrain: drivetrain.trim(),
          exteriorColor: exteriorColor.trim(),
          interiorColor: interiorColor.trim(),
          mileage: Number(mileage),
          costPrice: Number(costPrice),
          listPrice: Number(listPrice),
          status,
          daysInStock: Number(daysInStock),
          location: location.trim(),
          imageUrl,
          horsepower: Number(horsepower),
          notes: notes.trim(),
          prepChecklist: initialVehicle?.prepChecklist ?? {
            inspection: true,
            detailing: false,
            photography: true,
            pricingVerified: true,
          },
        },
        initialVehicle?.id
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initialVehicle ? 'Edit Vehicle' : 'Add Vehicle to Inventory'}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-display">
              {initialVehicle ? 'Edit Vehicle Record' : 'Add Vehicle to Inventory'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter VIN, trim specs, acquisition cost, and retail pricing
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stock #
              </label>
              <input
                type="text"
                required
                value={stockNumber}
                onChange={(e) => setStockNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                17-Character VIN
              </label>
              <input
                type="text"
                required
                maxLength={17}
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="e.g. 5UX23EU09R9T44109"
                className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Year
              </label>
              <input
                type="number"
                min={1990}
                max={2028}
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Make
              </label>
              <input
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="BMW"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Model
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="X5"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Trim
              </label>
              <input
                type="text"
                value={trim}
                onChange={(e) => setTrim(e.target.value)}
                placeholder="xDrive40i"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Body Style
              </label>
              <select
                value={bodyStyle}
                onChange={(e) => setBodyStyle(e.target.value as BodyStyle)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Wagon">Wagon</option>
                <option value="Coupe">Coupe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Gasoline">Gasoline</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mileage
              </label>
              <input
                type="number"
                min={0}
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Horsepower
              </label>
              <input
                type="number"
                min={50}
                value={horsepower}
                onChange={(e) => setHorsepower(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Acquisition Cost ($)
              </label>
              <input
                type="number"
                min={0}
                required
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Retail List Price ($)
              </label>
              <input
                type="number"
                min={0}
                required
                value={listPrice}
                onChange={(e) => setListPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1">
                Projected Gross Margin
              </span>
              <div
                className={`px-3 py-2 text-sm font-mono font-semibold rounded-lg border ${
                  projectedMargin >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {projectedMargin >= 0 ? '+' : ''}
                {formatCurrency(projectedMargin)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="In Prep">In Prep</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Days in Stock
              </label>
              <input
                type="number"
                min={0}
                value={daysInStock}
                onChange={(e) => setDaysInStock(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Exterior Color
              </label>
              <input
                type="text"
                value={exteriorColor}
                onChange={(e) => setExteriorColor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lot Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Showroom Photography Preset
              </label>
              <select
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {STUDIO_IMAGE_PRESETS.map((preset) => (
                  <option key={preset.url} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Drivetrain / Transmission
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={drivetrain}
                  onChange={(e) => setDrivetrain(e.target.value)}
                  placeholder="AWD"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  placeholder="8-Speed Auto"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Condition &amp; Package Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Factory options, service history, or pricing notes..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : initialVehicle
                ? 'Save Changes'
                : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
