import { useState } from 'react';
import { ArrowRight, Columns3, Download, List, Plus } from 'lucide-react';
import type { Customer, Deal, DealStage, Vehicle } from '../types.ts';
import {
  calculateFinancing,
  downloadCsv,
  formatCurrency,
  formatShortDate,
} from '../utils/format.ts';

interface PipelineViewProps {
  deals: Deal[];
  vehicles: Vehicle[];
  customers: Customer[];
  onSelectDeal: (deal: Deal) => void;
  onAdvanceStage: (deal: Deal, nextStage: DealStage) => Promise<void>;
  onNewDeal: () => void;
}

const ACTIVE_STAGES: DealStage[] = [
  'Inquiry',
  'Test Drive',
  'Negotiation',
  'F&I Approval',
  'Closed Won',
];

export function PipelineView({
  deals,
  vehicles,
  customers,
  onSelectDeal,
  onAdvanceStage,
  onNewDeal,
}: PipelineViewProps) {
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [repFilter, setRepFilter] = useState('All');
  const [showLostOnBoard, setShowLostOnBoard] = useState(false);

  const reps = Array.from(new Set(deals.map((d) => d.salesRep)));
  const filteredDeals = deals.filter((d) =>
    repFilter === 'All' ? true : d.salesRep === repFilter
  );

  const openDeals = filteredDeals.filter(
    (d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  );
  const lostDeals = filteredDeals.filter((d) => d.stage === 'Closed Lost');
  const totalOpenVolume = openDeals.reduce((sum, d) => sum + d.salePrice, 0);
  const totalProjectedGross = openDeals.reduce((sum, d) => sum + d.grossProfit, 0);

  const handleExportDeals = () => {
    downloadCsv(
      'meridian-deals.csv',
      filteredDeals.map((d) => {
        const vehicle = vehicles.find((v) => v.id === d.vehicleId);
        const customer = customers.find((c) => c.id === d.customerId);
        return {
          DealNumber: d.dealNumber,
          Customer: customer?.name ?? '',
          Vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : '',
          Stage: d.stage,
          SalesRep: d.salesRep,
          SalePrice: d.salePrice,
          GrossProfit: d.grossProfit,
          ExpectedClose: d.expectedCloseDate,
        };
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500">Active Pipeline: </span>
            <strong className="font-mono text-slate-900 tabular-nums">
              {formatCurrency(totalOpenVolume)}
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Projected Gross: </span>
            <strong className="font-mono text-emerald-700 tabular-nums">
              +{formatCurrency(totalProjectedGross)}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            aria-label="Filter by sales representative"
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Sales Reps</option>
            {reps.map((rep) => (
              <option key={rep} value={rep}>
                {rep}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Ledger
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportDeals}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {viewMode === 'board' && lostDeals.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLostOnBoard((v) => !v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showLostOnBoard
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Closed Lost ({lostDeals.length})
            </button>
          )}

          <button
            type="button"
            onClick={onNewDeal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Deal
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            showLostOnBoard ? 'xl:grid-cols-6' : 'xl:grid-cols-5'
          } gap-4 items-start`}
        >
          {(showLostOnBoard
            ? [...ACTIVE_STAGES, 'Closed Lost' as DealStage]
            : ACTIVE_STAGES
          ).map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage);
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.salePrice, 0);
            const activeIdx = ACTIVE_STAGES.indexOf(stage);
            const nextStage =
              activeIdx !== -1 && activeIdx < ACTIVE_STAGES.length - 1
                ? ACTIVE_STAGES[activeIdx + 1]
                : null;

            return (
              <div
                key={stage}
                className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 flex flex-col gap-3 min-h-[260px]"
              >
                <div className="px-1 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-800 font-display">
                    {stage} ({stageDeals.length})
                  </h3>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {formatCurrency(stageTotal)}
                  </span>
                </div>

                {stageDeals.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-slate-300 rounded-lg p-4 text-center">
                    <span className="text-xs text-slate-400">No deals in stage</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {stageDeals.map((deal) => {
                      const vehicle = vehicles.find((v) => v.id === deal.vehicleId);
                      const customer = customers.find((c) => c.id === deal.customerId);
                      const finance = calculateFinancing(deal);
                      return (
                        <div
                          key={deal.id}
                          className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectDeal(deal)}
                            className="w-full text-left cursor-pointer"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                              <span>{deal.dealNumber}</span>
                              <span>{formatShortDate(deal.expectedCloseDate)}</span>
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate">
                              {customer?.name ?? 'Client'}
                            </p>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {vehicle
                                ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                                : 'Vehicle'}
                            </p>
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
                                {formatCurrency(deal.salePrice)}
                              </span>
                              <span className="text-xs font-mono text-slate-500 tabular-nums">
                                {finance.monthlyPayment > 0
                                  ? `${formatCurrency(finance.monthlyPayment)}/mo`
                                  : 'Cash'}
                              </span>
                            </div>
                          </button>

                          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-500 truncate">
                              {deal.salesRep}
                            </span>
                            {nextStage && (
                              <button
                                type="button"
                                onClick={() => onAdvanceStage(deal, nextStage)}
                                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-medium whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Advance
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5 whitespace-nowrap">Deal #</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-4 whitespace-nowrap">Vehicle</th>
                  <th className="py-3 px-4 whitespace-nowrap">Stage</th>
                  <th className="py-3 px-4 whitespace-nowrap">Sales Rep</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Sale Price</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Est. Payment</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDeals.map((deal) => {
                  const vehicle = vehicles.find((v) => v.id === deal.vehicleId);
                  const customer = customers.find((c) => c.id === deal.customerId);
                  const finance = calculateFinancing(deal);
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {deal.dealNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {customer?.name ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {vehicle
                          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            deal.stage === 'Closed Won'
                              ? 'text-emerald-700'
                              : deal.stage === 'Closed Lost'
                              ? 'text-rose-700'
                              : 'text-blue-700'
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
                      <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {finance.monthlyPayment > 0
                          ? `${formatCurrency(finance.monthlyPayment)}/mo`
                          : 'Cash'}
                      </td>
                      <td className="py-3 px-5 text-right font-mono font-medium text-emerald-700 tabular-nums whitespace-nowrap">
                        +{formatCurrency(deal.grossProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
