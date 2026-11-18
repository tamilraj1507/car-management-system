import { useState, type FormEvent } from 'react';
import { FileDown, Trash2, X } from 'lucide-react';
import type { Customer, Deal, DealStage, Vehicle } from '../types.ts';
import { calculateFinancing, formatCurrency } from '../utils/format.ts';

interface DealModalProps {
  initialDeal?: Deal | null;
  preselectedVehicle?: Vehicle | null;
  preselectedCustomerId?: string;
  vehicles: Vehicle[];
  customers: Customer[];
  salesReps: string[];
  onClose: () => void;
  onSave: (
    payload: Omit<Deal, 'id' | 'dealNumber' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const STAGES: DealStage[] = [
  'Inquiry',
  'Test Drive',
  'Negotiation',
  'F&I Approval',
  'Closed Won',
  'Closed Lost',
];

export function DealModal({
  initialDeal,
  preselectedVehicle,
  preselectedCustomerId,
  vehicles,
  customers,
  salesReps,
  onClose,
  onSave,
  onDelete,
}: DealModalProps) {
  const defaultVehicle =
    vehicles.find((v) => v.id === initialDeal?.vehicleId) ??
    preselectedVehicle ??
    vehicles.find((v) => v.status !== 'Sold') ??
    vehicles[0];

  const [vehicleId, setVehicleId] = useState(
    initialDeal?.vehicleId ?? defaultVehicle?.id ?? ''
  );
  const [customerId, setCustomerId] = useState(
    initialDeal?.customerId ?? preselectedCustomerId ?? customers[0]?.id ?? ''
  );
  const [salesRep, setSalesRep] = useState(
    initialDeal?.salesRep ?? salesReps[0] ?? 'Elena Vance'
  );
  const [stage, setStage] = useState<DealStage>(
    initialDeal?.stage ?? 'Negotiation'
  );
  const [salePrice, setSalePrice] = useState(
    initialDeal?.salePrice ?? defaultVehicle?.listPrice ?? 75000
  );
  const [tradeInValue, setTradeInValue] = useState(
    initialDeal?.tradeInValue ?? 0
  );
  const [downPayment, setDownPayment] = useState(
    initialDeal?.downPayment ??
      Math.round((defaultVehicle?.listPrice ?? 75000) * 0.15)
  );
  const [apr, setApr] = useState(initialDeal?.apr ?? 5.49);
  const [termMonths, setTermMonths] = useState<36 | 48 | 60 | 72>(
    initialDeal?.termMonths ?? 60
  );
  const [docFee, setDocFee] = useState(initialDeal?.docFee ?? 695);
  const [taxRate, setTaxRate] = useState(initialDeal?.taxRate ?? 8.625);
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    initialDeal?.expectedCloseDate ?? '2026-11-25'
  );
  const [notes, setNotes] = useState(initialDeal?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const vehicleCost = selectedVehicle?.costPrice ?? 0;
  const grossProfit = salePrice - vehicleCost;
  const repCommission = Math.max(0, Math.round(grossProfit * 0.2));

  const finance = calculateFinancing({
    salePrice,
    tradeInValue,
    downPayment,
    docFee,
    taxRate,
    apr,
    termMonths,
  });

  const handleVehicleChange = (newVehicleId: string) => {
    setVehicleId(newVehicleId);
    const v = vehicles.find((item) => item.id === newVehicleId);
    if (v && !initialDeal) {
      setSalePrice(v.listPrice);
      setDownPayment(Math.round(v.listPrice * 0.15));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !customerId) return;
    setSaving(true);
    try {
      await onSave(
        {
          vehicleId,
          customerId,
          salesRep,
          stage,
          salePrice: Number(salePrice),
          tradeInValue: Number(tradeInValue),
          downPayment: Number(downPayment),
          apr: Number(apr),
          termMonths,
          docFee: Number(docFee),
          taxRate: Number(taxRate),
          grossProfit,
          expectedCloseDate,
          notes: notes.trim(),
        },
        initialDeal?.id
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
      aria-label={initialDeal ? `Deal Desk ${initialDeal.dealNumber}` : 'New Sales Deal'}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-display">
              {initialDeal
                ? `Deal Desk · ${initialDeal.dealNumber}`
                : 'Structure New Sales Deal'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure pricing, trade-in allowance, F&amp;I terms, and pipeline stage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const customer = customers.find((c) => c.id === customerId);
                const summary = [
                  `MERIDIAN AUTO GROUP — BUYER'S ORDER & DEAL SHEET`,
                  `=================================================`,
                  `Deal #: ${initialDeal?.dealNumber ?? 'DRAFT'}`,
                  `Stage: ${stage}`,
                  `Sales Representative: ${salesRep}`,
                  `Target Close Date: ${expectedCloseDate}`,
                  ``,
                  `BUYER`,
                  `Name: ${customer?.name ?? '—'}`,
                  `Email: ${customer?.email ?? '—'}`,
                  `Phone: ${customer?.phone ?? '—'}`,
                  ``,
                  `VEHICLE`,
                  `Unit: ${selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.trim}` : '—'}`,
                  `Stock #: ${selectedVehicle?.stockNumber ?? '—'}`,
                  `VIN: ${selectedVehicle?.vin ?? '—'}`,
                  ``,
                  `PRICING & FINANCING`,
                  `Negotiated Sale Price: ${formatCurrency(salePrice)}`,
                  `Trade-In Allowance: -${formatCurrency(tradeInValue)}`,
                  `Taxes (${taxRate}%) & Doc Fee: ${formatCurrency(finance.taxesAndFees)}`,
                  `Down Payment: -${formatCurrency(downPayment)}`,
                  `Amount Financed: ${formatCurrency(finance.amountFinanced)}`,
                  `Terms: ${termMonths} months @ ${apr}% APR`,
                  `Estimated Monthly Payment: ${finance.monthlyPayment > 0 ? `${formatCurrency(finance.monthlyPayment)}/mo` : 'Paid in Full'}`,
                  ``,
                  `INTERNAL GROSS SUMMARY`,
                  `Acquisition Cost: ${formatCurrency(vehicleCost)}`,
                  `Deal Gross Profit: ${formatCurrency(grossProfit)}`,
                  `Rep Commission (20%): ${formatCurrency(repCommission)}`,
                  notes ? `\nNOTES\n${notes}` : '',
                ]
                  .filter(Boolean)
                  .join('\n');
                const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${initialDeal?.dealNumber ?? 'deal-sheet'}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              Buyer&apos;s Order
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Vehicle Unit
              </label>
              <select
                value={vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.stockNumber} — {v.year} {v.make} {v.model} ({formatCurrency(v.listPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Buyer / Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned Sales Rep
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
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Close Date
              </label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Financing & Margin Worksheet */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Negotiated Price ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trade-In Credit ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={tradeInValue}
                  onChange={(e) => setTradeInValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Down Payment ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  APR (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={25}
                  value={apr}
                  onChange={(e) => setApr(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Term (Months)
                </label>
                <select
                  value={termMonths}
                  onChange={(e) =>
                    setTermMonths(Number(e.target.value) as 36 | 48 | 60 | 72)
                  }
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  <option value={36}>36 mo</option>
                  <option value={48}>48 mo</option>
                  <option value={60}>60 mo</option>
                  <option value={72}>72 mo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tax % / Doc ($)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="number"
                    min={0}
                    value={docFee}
                    onChange={(e) => setDocFee(Number(e.target.value))}
                    className="w-full px-2 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs text-slate-500">
                  Estimated Monthly Payment
                </span>
                <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                  {finance.monthlyPayment > 0
                    ? `${formatCurrency(finance.monthlyPayment)}/mo`
                    : 'Paid in Full'}
                </div>
              </div>
              <dl className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Taxes &amp; Doc Fee</dt>
                  <dd className="font-mono text-slate-700 tabular-nums">
                    {formatCurrency(finance.taxesAndFees)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Amount Financed</dt>
                  <dd className="font-mono text-slate-900 font-medium tabular-nums">
                    {formatCurrency(finance.amountFinanced)}
                  </dd>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-100">
                  <dt className="text-slate-500">Deal Gross Profit</dt>
                  <dd
                    className={`font-mono font-semibold tabular-nums ${
                      grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {grossProfit >= 0 ? '+' : ''}
                    {formatCurrency(grossProfit)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Rep Commission (20%)</dt>
                  <dd className="font-mono text-slate-700 tabular-nums">
                    {formatCurrency(repCommission)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              F&amp;I Stipulations &amp; Deal Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lender approval terms, delivery instructions, or trade payoff details..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {initialDeal && onDelete ? (
                !confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Deal
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await onDelete(initialDeal.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-md cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )
              ) : (
                <span className="text-xs text-slate-500">
                  Setting stage to <strong>Closed Won</strong> automatically marks the vehicle as Sold.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
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
                {saving ? 'Saving...' : initialDeal ? 'Update Deal' : 'Create Deal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
