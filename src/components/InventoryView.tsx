import { useMemo, useState } from 'react';
import {
  Download,
  LayoutGrid,
  List,
  Plus,
  Search,
} from 'lucide-react';
import type { BodyStyle, FuelType, Vehicle, VehicleStatus } from '../types.ts';
import { downloadCsv, formatCurrency, formatNumber } from '../utils/format.ts';
import { VehicleImage } from './VehicleImage.tsx';

interface InventoryViewProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: () => void;
  onStartDeal: (vehicle: Vehicle) => void;
}

type StatusFilter = 'All' | VehicleStatus;
type SortOption = 'days_desc' | 'price_desc' | 'price_asc' | 'mileage_asc';

const STATUS_TABS: StatusFilter[] = ['All', 'Available', 'Reserved', 'In Prep', 'Sold'];

function getStatusTextClass(status: VehicleStatus): string {
  switch (status) {
    case 'Available':
      return 'text-emerald-700';
    case 'Reserved':
      return 'text-blue-700';
    case 'In Prep':
      return 'text-amber-700';
    case 'Sold':
      return 'text-slate-500';
  }
}

export function InventoryView({
  vehicles,
  onSelectVehicle,
  onAddVehicle,
  onStartDeal,
}: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [bodyFilter, setBodyFilter] = useState<BodyStyle | 'All'>('All');
  const [fuelFilter, setFuelFilter] = useState<FuelType | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('days_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles
      .filter((v) => {
        if (statusFilter !== 'All' && v.status !== statusFilter) return false;
        if (bodyFilter !== 'All' && v.bodyStyle !== bodyFilter) return false;
        if (fuelFilter !== 'All' && v.fuelType !== fuelFilter) return false;
        if (!q) return true;
        return (
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.trim.toLowerCase().includes(q) ||
          v.vin.toLowerCase().includes(q) ||
          v.stockNumber.toLowerCase().includes(q) ||
          String(v.year).includes(q)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_desc':
            return b.listPrice - a.listPrice;
          case 'price_asc':
            return a.listPrice - b.listPrice;
          case 'mileage_asc':
            return a.mileage - b.mileage;
          case 'days_desc':
          default:
            return b.daysInStock - a.daysInStock;
        }
      });
  }, [vehicles, search, statusFilter, bodyFilter, fuelFilter, sortBy]);

  const handleExportCsv = () => {
    downloadCsv(
      'meridian-inventory.csv',
      filtered.map((v) => ({
        StockNumber: v.stockNumber,
        VIN: v.vin,
        Year: v.year,
        Make: v.make,
        Model: v.model,
        Trim: v.trim,
        BodyStyle: v.bodyStyle,
        FuelType: v.fuelType,
        Mileage: v.mileage,
        Status: v.status,
        DaysInStock: v.daysInStock,
        CostPrice: v.costPrice,
        ListPrice: v.listPrice,
        Margin: v.listPrice - v.costPrice,
      }))
    );
  };

  return (
    <div className="space-y-5">
      {/* Filter & Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Status Tabs */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const count =
                tab === 'All'
                  ? vehicles.length
                  : vehicles.filter((v) => v.status === tab).length;
              const active = statusFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model, VIN, or stock #..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={bodyFilter}
              onChange={(e) => setBodyFilter(e.target.value as BodyStyle | 'All')}
              aria-label="Filter by body style"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="All">All Body Styles</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Wagon">Wagon</option>
              <option value="Coupe">Coupe</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value as FuelType | 'All')}
              aria-label="Filter by powertrain"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="All">All Powertrains</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Gasoline">Gasoline</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort vehicles"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="days_desc">Sort: Days in Stock (High-Low)</option>
              <option value="price_desc">Sort: List Price (High-Low)</option>
              <option value="price_asc">Sort: List Price (Low-High)</option>
              <option value="mileage_asc">Sort: Mileage (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900 font-display">
            No vehicles match the active filters
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Adjust your search criteria or add a new unit to dealership inventory.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setBodyFilter('All');
                setFuelFilter('All');
              }}
              className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={onAddVehicle}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vehicle
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((vehicle) => {
            const margin = vehicle.listPrice - vehicle.costPrice;
            return (
              <article
                key={vehicle.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onSelectVehicle(vehicle)}
                  className="aspect-[4/3] w-full bg-slate-100 overflow-hidden text-left cursor-pointer block"
                >
                  <VehicleImage
                    src={vehicle.imageUrl}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
                  />
                </button>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-500 tabular-nums">
                        {vehicle.stockNumber} · {vehicle.fuelType}
                      </span>
                      <span
                        className={`font-semibold whitespace-nowrap ${getStatusTextClass(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectVehicle(vehicle)}
                      className="mt-2 text-left block w-full cursor-pointer group"
                    >
                      <h3 className="text-base font-semibold text-slate-900 font-display group-hover:text-blue-700 transition-colors truncate">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {vehicle.trim} · {formatNumber(vehicle.mileage)} mi · {vehicle.exteriorColor}
                      </p>
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-lg font-semibold text-slate-900 font-mono tabular-nums">
                          {formatCurrency(vehicle.listPrice)}
                        </span>
                        <span className="ml-2 text-xs text-emerald-700 font-mono tabular-nums">
                          +{formatCurrency(margin)} margin
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          vehicle.daysInStock >= 45
                            ? 'text-amber-700 font-medium'
                            : 'text-slate-500'
                        }`}
                      >
                        {vehicle.daysInStock}d stock
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectVehicle(vehicle)}
                        className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Inspect Unit
                      </button>
                      {vehicle.status !== 'Sold' && (
                        <button
                          type="button"
                          onClick={() => onStartDeal(vehicle)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Start Deal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5 whitespace-nowrap">Stock #</th>
                  <th className="py-3 px-4 whitespace-nowrap">Vehicle</th>
                  <th className="py-3 px-4 whitespace-nowrap">VIN</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Mileage</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Days</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Cost</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">List Price</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">Est. Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((vehicle) => {
                  const margin = vehicle.listPrice - vehicle.costPrice;
                  return (
                    <tr
                      key={vehicle.id}
                      onClick={() => onSelectVehicle(vehicle)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {vehicle.stockNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-xs text-slate-500">
                          {vehicle.trim} · {vehicle.fuelType}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {vehicle.vin}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        {formatNumber(vehicle.mileage)} mi
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${getStatusTextClass(
                            vehicle.status
                          )}`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap ${
                          vehicle.daysInStock >= 45
                            ? 'text-amber-700 font-medium'
                            : 'text-slate-600'
                        }`}
                      >
                        {vehicle.daysInStock}d
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {formatCurrency(vehicle.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(vehicle.listPrice)}
                      </td>
                      <td className="py-3 px-5 text-right font-mono font-medium text-emerald-700 tabular-nums whitespace-nowrap">
                        +{formatCurrency(margin)}
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
