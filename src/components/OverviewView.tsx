import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type {
  ActiveView,
  Customer,
  Deal,
  DealStage,
  TestDrive,
  Vehicle,
} from '../types.ts';
import { formatCurrency, formatNumber, formatShortDate } from '../utils/format.ts';
import { VehicleImage } from './VehicleImage.tsx';

interface OverviewViewProps {
  vehicles: Vehicle[];
  customers: Customer[];
  deals: Deal[];
  testDrives: TestDrive[];
  salesReps: string[];
  onNavigate: (view: ActiveView) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onSelectDeal: (deal: Deal) => void;
  onUpdateTestDriveStatus: (id: string, status: TestDrive['status']) => void;
}

const PIPELINE_STAGES: DealStage[] = [
  'Inquiry',
  'Test Drive',
  'Negotiation',
  'F&I Approval',
  'Closed Won',
];

export function OverviewView({
  vehicles,
  customers,
  deals,
  testDrives,
  salesReps,
  onNavigate,
  onSelectVehicle,
  onSelectDeal,
  onUpdateTestDriveStatus,
}: OverviewViewProps) {
  const activeStock = vehicles.filter((v) => v.status !== 'Sold');
  const totalInventoryValue = activeStock.reduce((sum, v) => sum + v.listPrice, 0);
  const avgDaysInStock = activeStock.length
    ? Math.round(activeStock.reduce((sum, v) => sum + v.daysInStock, 0) / activeStock.length)
    : 0;
  const agingUnits = activeStock.filter((v) => v.daysInStock >= 45);

  const closedWonDeals = deals.filter((d) => d.stage === 'Closed Won');
  const closedRevenue = closedWonDeals.reduce((sum, d) => sum + d.salePrice, 0);
  const closedGross = closedWonDeals.reduce((sum, d) => sum + d.grossProfit, 0);
  const closedMarginPct = closedRevenue > 0 ? ((closedGross / closedRevenue) * 100).toFixed(1) : '0.0';

  const openDeals = deals.filter(
    (d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  );
  const openPipelineValue = openDeals.reduce((sum, d) => sum + d.salePrice, 0);

  const stageSummary = PIPELINE_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    const totalValue = stageDeals.reduce((sum, d) => sum + d.salePrice, 0);
    return {
      stage,
      count: stageDeals.length,
      totalValue,
    };
  });

  const maxStageValue = Math.max(1, ...stageSummary.map((s) => s.totalValue));
  const monthlyTarget = 450000;
  const targetProgress = Math.min(100, Math.round((closedRevenue / monthlyTarget) * 100));

  const upcomingDrives = testDrives
    .filter((td) => td.status === 'Scheduled' || td.status === 'In Progress')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 4-Column Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Inventory Value</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5 text-2xl font-semibold text-slate-900 font-display tabular-nums">
            {formatCurrency(totalInventoryValue)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {activeStock.length} vehicles on lot · {vehicles.filter((v) => v.status === 'Available').length} ready for sale
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Closed Sales (MTD)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5 text-2xl font-semibold text-slate-900 font-display tabular-nums">
            {formatCurrency(closedRevenue)}
          </div>
          <div className="mt-1.5 text-xs text-emerald-700 font-medium tabular-nums">
            {formatCurrency(closedGross)} gross profit · {closedMarginPct}% margin
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Pipeline Volume</span>
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5 text-2xl font-semibold text-slate-900 font-display tabular-nums">
            {formatCurrency(openPipelineValue)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {openDeals.length} active deals · {customers.length} total buyers
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Avg. Days in Stock</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5 text-2xl font-semibold text-slate-900 font-display tabular-nums">
            {avgDaysInStock} days
          </div>
          <div
            className={`mt-1.5 text-xs font-medium tabular-nums ${
              agingUnits.length > 0 ? 'text-amber-700' : 'text-slate-500'
            }`}
          >
            {agingUnits.length > 0
              ? `${agingUnits.length} unit(s) aged 45+ days`
              : 'All stock within 45-day turn target'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Operations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Pipeline Stage Breakdown & Monthly Quota */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Sales Pipeline by Stage
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deal volume distribution across active negotiation and closing stages
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('pipeline')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Deal Board
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {stageSummary.map((item) => {
                const widthPct = Math.max(
                  item.totalValue > 0 ? 8 : 0,
                  Math.round((item.totalValue / maxStageValue) * 100)
                );
                const isWon = item.stage === 'Closed Won';
                return (
                  <button
                    key={item.stage}
                    type="button"
                    onClick={() => onNavigate('pipeline')}
                    className="w-full text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                        {item.stage}
                      </span>
                      <span className="text-slate-600 font-mono tabular-nums">
                        {item.count} {item.count === 1 ? 'deal' : 'deals'} ·{' '}
                        <strong className="text-slate-900 font-semibold">
                          {formatCurrency(item.totalValue)}
                        </strong>
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md transition-all duration-200 ${
                          isWon
                            ? 'bg-emerald-600 group-hover:bg-emerald-700'
                            : 'bg-blue-600 group-hover:bg-blue-700'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                November Dealership Quota ({formatCurrency(monthlyTarget)})
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {targetProgress}% achieved
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-slate-100 rounded-md overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-md transition-all duration-300"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        </section>

        {/* Right 5 Cols: Scheduled Test Drives & Aging Stock Alerts */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Upcoming Test Drives
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('test-drives')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Full Schedule
              </button>
            </div>

            {upcomingDrives.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No upcoming test drives scheduled.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {upcomingDrives.map((td) => {
                  const vehicle = vehicles.find((v) => v.id === td.vehicleId);
                  const customer = customers.find((c) => c.id === td.customerId);
                  return (
                    <div key={td.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {customer?.name ?? 'Unknown Client'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5 tabular-nums">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'} ·{' '}
                          {formatShortDate(td.scheduledDate)} at {td.scheduledTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {td.status === 'Scheduled' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateTestDriveStatus(td.id, 'In Progress')}
                            className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Check Out
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateTestDriveStatus(td.id, 'Completed')}
                            className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900 font-display">
                  Aging Stock Watchlist
                </h3>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">45+ days threshold</span>
            </div>

            {agingUnits.length === 0 ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All available inventory is turning within target window.</span>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {agingUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => onSelectVehicle(unit)}
                    className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <VehicleImage
                        src={unit.imageUrl}
                        alt={`${unit.year} ${unit.make} ${unit.model}`}
                        className="w-12 h-9 rounded object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {unit.year} {unit.make} {unit.model}
                        </p>
                        <p className="text-xs text-amber-800 font-mono tabular-nums">
                          {unit.daysInStock} days · {formatCurrency(unit.listPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-blue-700 whitespace-nowrap shrink-0">
                      Review
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom High-Density Deal Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-display">
              Active & Recent Deal Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any deal row to open the F&amp;I worksheet and payment calculator
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Browse {formatNumber(vehicles.length)} Vehicles
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-6 whitespace-nowrap">Deal #</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Client</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Vehicle</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Stage</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Sales Rep</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Sale Price</th>
                <th className="py-2.5 px-6 text-right whitespace-nowrap">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {deals.slice(0, 6).map((deal) => {
                const vehicle = vehicles.find((v) => v.id === deal.vehicleId);
                const customer = customers.find((c) => c.id === deal.customerId);
                return (
                  <tr
                    key={deal.id}
                    onClick={() => onSelectDeal(deal)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-6 font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap">
                      {deal.dealNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {customer?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium ${
                          deal.stage === 'Closed Won'
                            ? 'text-emerald-700'
                            : deal.stage === 'Closed Lost'
                            ? 'text-rose-700'
                            : deal.stage === 'F&I Approval'
                            ? 'text-blue-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {deal.salesRep}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(deal.salePrice)}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-medium text-emerald-700 tabular-nums whitespace-nowrap">
                      +{formatCurrency(deal.grossProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sales Rep Performance & Commission Leaderboard */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-display">
              Sales Team Performance &amp; Commission
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live unit volume, gross profit, and 20% rep commission computed from dealership deals
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {salesReps.length} active reps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-6 whitespace-nowrap">Sales Representative</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Closed Units</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Active Deals</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Closed Volume</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Closed Gross</th>
                <th className="py-2.5 px-6 text-right whitespace-nowrap">Commission (20%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {salesReps.map((rep) => {
                const repDeals = deals.filter((d) => d.salesRep === rep);
                const won = repDeals.filter((d) => d.stage === 'Closed Won');
                const open = repDeals.filter(
                  (d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
                );
                const volume = won.reduce((sum, d) => sum + d.salePrice, 0);
                const gross = won.reduce((sum, d) => sum + d.grossProfit, 0);
                const commission = Math.max(0, Math.round(gross * 0.2));
                return (
                  <tr key={rep} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-900 whitespace-nowrap">
                      {rep}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {won.length}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {open.length}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(volume)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 tabular-nums whitespace-nowrap">
                      +{formatCurrency(gross)}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(commission)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
