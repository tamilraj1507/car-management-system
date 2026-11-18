import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CarFront,
  Globe,
  Handshake,
  LayoutDashboard,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { CustomersView } from './components/CustomersView.tsx';
import { DealModal } from './components/DealModal.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { PipelineView } from './components/PipelineView.tsx';
import { PublicShowroomView } from './components/PublicShowroomView.tsx';
import { TestDrivesView } from './components/TestDrivesView.tsx';
import { VehicleDrawer } from './components/VehicleDrawer.tsx';
import { VehicleModal } from './components/VehicleModal.tsx';
import { INITIAL_DEALERSHIP_DATA } from './data/seedData.ts';
import type {
  ActiveView,
  Customer,
  Deal,
  DealershipData,
  DealStage,
  TestDrive,
  Vehicle,
} from './types.ts';
import { formatCurrency } from './utils/format.ts';

const NAV_ITEMS: { id: ActiveView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: CarFront },
  { id: 'pipeline', label: 'Sales Pipeline', icon: Handshake },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'test-drives', label: 'Test Drives', icon: CalendarClock },
  { id: 'showroom', label: 'Public Showroom', icon: Globe },
];

const VIEW_TITLES: Record<ActiveView, string> = {
  overview: 'Overview',
  inventory: 'Vehicle Inventory',
  pipeline: 'Sales Pipeline',
  customers: 'Customers & Leads',
  'test-drives': 'Test Drives',
  showroom: 'Public Showroom',
};

export default function App() {
  const [data, setData] = useState<DealershipData>(INITIAL_DEALERSHIP_DATA);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global search
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Drawers & Modals
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealPreselectVehicle, setDealPreselectVehicle] = useState<Vehicle | null>(null);
  const [dealPreselectCustomerId, setDealPreselectCustomerId] = useState<string | undefined>(
    undefined
  );
  const [showDealModal, setShowDealModal] = useState(false);

  const [testDrivePreselectVehicleId, setTestDrivePreselectVehicleId] = useState<
    string | null
  >(null);

  const fetchState = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to load dealership records.');
      const payload = (await res.json()) as DealershipData;
      setData(payload);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to reach dealership server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const selectedVehicle = useMemo(
    () => data.vehicles.find((v) => v.id === selectedVehicleId) ?? null,
    [data.vehicles, selectedVehicleId]
  );

  // Global search matches
  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return { vehicles: [], customers: [], deals: [] };
    return {
      vehicles: data.vehicles
        .filter(
          (v) =>
            v.make.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.vin.toLowerCase().includes(q) ||
            v.stockNumber.toLowerCase().includes(q)
        )
        .slice(0, 4),
      customers: data.customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        )
        .slice(0, 3),
      deals: data.deals
        .filter((d) => d.dealNumber.toLowerCase().includes(q))
        .slice(0, 3),
    };
  }, [globalQuery, data]);

  // CRUD Handlers
  const handleSaveVehicle = async (
    payload: Omit<Vehicle, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await fetch(`/api/vehicles/${existingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update vehicle');
      const updated = (await res.json()) as Vehicle;
      setData((prev) => ({
        ...prev,
        vehicles: prev.vehicles.map((v) => (v.id === existingId ? updated : v)),
      }));
    } else {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create vehicle');
      const created = (await res.json()) as Vehicle;
      setData((prev) => ({
        ...prev,
        vehicles: [created, ...prev.vehicles],
      }));
    }
  };

  const handleUpdateVehicle = async (id: string, patch: Partial<Vehicle>) => {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to update vehicle');
    const updated = (await res.json()) as Vehicle;
    setData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? updated : v)),
    }));
  };

  const handleDeleteVehicle = async (id: string) => {
    const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete vehicle');
    setData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
    }));
  };

  const handleSaveDeal = async (
    payload: Omit<Deal, 'id' | 'dealNumber' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await fetch(`/api/deals/${existingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update deal');
      const result = (await res.json()) as { deal: Deal; vehicles: Vehicle[] };
      setData((prev) => ({
        ...prev,
        deals: prev.deals.map((d) => (d.id === existingId ? result.deal : d)),
        vehicles: result.vehicles,
      }));
    } else {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create deal');
      const result = (await res.json()) as { deal: Deal; vehicles: Vehicle[] };
      setData((prev) => ({
        ...prev,
        deals: [result.deal, ...prev.deals],
        vehicles: result.vehicles,
      }));
    }
  };

  const handleAdvanceDealStage = async (deal: Deal, nextStage: DealStage) => {
    const res = await fetch(`/api/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage }),
    });
    if (!res.ok) return;
    const result = (await res.json()) as { deal: Deal; vehicles: Vehicle[] };
    setData((prev) => ({
      ...prev,
      deals: prev.deals.map((d) => (d.id === deal.id ? result.deal : d)),
      vehicles: result.vehicles,
    }));
  };

  const handleCreateCustomer = async (
    payload: Omit<Customer, 'id' | 'createdAt'>
  ) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create customer');
    const created = (await res.json()) as Customer;
    setData((prev) => ({
      ...prev,
      customers: [created, ...prev.customers],
    }));
  };

  const handleUpdateCustomer = async (
    id: string,
    patch: Partial<Customer>
  ) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to update customer');
    const updated = (await res.json()) as Customer;
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? updated : c)),
    }));
  };

  const handleDeleteCustomer = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete customer');
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  const handleDeleteDeal = async (id: string) => {
    const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete deal');
    const result = (await res.json()) as { deleted: boolean; vehicles: Vehicle[] };
    setData((prev) => ({
      ...prev,
      deals: prev.deals.filter((d) => d.id !== id),
      vehicles: result.vehicles,
    }));
  };

  const handleCreateTestDrive = async (payload: Omit<TestDrive, 'id'>) => {
    const res = await fetch('/api/test-drives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to schedule test drive');
    const created = (await res.json()) as TestDrive;
    setData((prev) => ({
      ...prev,
      testDrives: [created, ...prev.testDrives],
    }));
  };

  const handleUpdateTestDrive = async (
    id: string,
    patch: Partial<TestDrive>
  ) => {
    const res = await fetch(`/api/test-drives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to update test drive');
    const updated = (await res.json()) as TestDrive;
    setData((prev) => ({
      ...prev,
      testDrives: prev.testDrives.map((t) => (t.id === id ? updated : t)),
    }));
  };

  const handleShowroomInquiry = async (payload: {
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
  }) => {
    const res = await fetch('/api/showroom-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit inquiry');
    const created = (await res.json()) as {
      customer: Customer;
      testDrive: TestDrive;
      deal: Deal;
    };
    setData((prev) => ({
      ...prev,
      customers: [created.customer, ...prev.customers],
      testDrives: [created.testDrive, ...prev.testDrives],
      deals: [created.deal, ...prev.deals],
    }));
  };

  const handleResetDemo = async () => {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) return;
    const fresh = (await res.json()) as DealershipData;
    setData(fresh);
  };

  const openNewDealModal = (vehicle?: Vehicle | null, customerId?: string) => {
    setEditingDeal(null);
    setDealPreselectVehicle(vehicle ?? null);
    setDealPreselectCustomerId(customerId);
    setShowDealModal(true);
  };

  const primaryAction = () => {
    if (activeView === 'pipeline') {
      return (
        <button
          type="button"
          onClick={() => openNewDealModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Deal
        </button>
      );
    }
    if (activeView === 'showroom') {
      return (
        <button
          type="button"
          onClick={() => setActiveView('overview')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Back to DMS
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          setEditingVehicle(null);
          setShowVehicleModal(true);
        }}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Vehicle
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 text-slate-100 border-r border-slate-800">
        <div className="h-16 px-6 flex items-center border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className="text-lg font-bold tracking-tight font-display text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            Meridian DMS
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-2 text-xs text-slate-400">
            <div className="font-medium text-slate-200">Meridian Auto Group</div>
            <div className="mt-0.5">San Francisco · Bay Area</div>
          </div>
          <button
            type="button"
            onClick={handleResetDemo}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Sample Data
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-xs bg-slate-900 text-slate-100 h-full flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
              <span className="text-lg font-bold font-display text-white">
                Meridian DMS
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="p-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 whitespace-nowrap">
                Meridian Auto Group
              </span>
              <span className="hidden sm:inline text-slate-300">/</span>
              <h1 className="font-semibold text-slate-900 font-display truncate">
                {VIEW_TITLES[activeView]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Global Search */}
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalQuery}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
                onChange={(e) => {
                  setGlobalQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search VIN, client, deal..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />

              {searchOpen && globalQuery.trim().length > 0 && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 space-y-2">
                  {searchResults.vehicles.length === 0 &&
                  searchResults.customers.length === 0 &&
                  searchResults.deals.length === 0 ? (
                    <p className="p-3 text-xs text-slate-500 text-center">
                      No matching vehicles, clients, or deals.
                    </p>
                  ) : (
                    <>
                      {searchResults.vehicles.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedVehicleId(v.id);
                            setGlobalQuery('');
                            setSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {v.year} {v.make} {v.model}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {v.stockNumber} · {v.status}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-slate-700 tabular-nums">
                            {formatCurrency(v.listPrice)}
                          </span>
                        </button>
                      ))}
                      {searchResults.customers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setActiveView('customers');
                            setGlobalQuery('');
                            setSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Client · {c.email}
                          </p>
                        </button>
                      ))}
                      {searchResults.deals.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onMouseDown={() => {
                            setEditingDeal(d);
                            setShowDealModal(true);
                            setGlobalQuery('');
                            setSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-xs font-mono font-semibold text-slate-900">
                            {d.dealNumber}
                          </span>
                          <span className="text-[11px] text-blue-700 font-medium">
                            {d.stage}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {primaryAction()}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {errorMessage && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4 text-xs text-rose-800">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={fetchState}
                className="font-semibold underline cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="h-28 bg-white border border-slate-200 rounded-xl"
                  />
                ))}
              </div>
              <div className="h-72 bg-white border border-slate-200 rounded-xl" />
            </div>
          ) : (
            <>
              {activeView === 'overview' && (
                <OverviewView
                  vehicles={data.vehicles}
                  customers={data.customers}
                  deals={data.deals}
                  testDrives={data.testDrives}
                  salesReps={data.salesReps}
                  onNavigate={setActiveView}
                  onSelectVehicle={(v) => setSelectedVehicleId(v.id)}
                  onSelectDeal={(d) => {
                    setEditingDeal(d);
                    setShowDealModal(true);
                  }}
                  onUpdateTestDriveStatus={(id, status) =>
                    handleUpdateTestDrive(id, { status })
                  }
                />
              )}

              {activeView === 'inventory' && (
                <InventoryView
                  vehicles={data.vehicles}
                  onSelectVehicle={(v) => setSelectedVehicleId(v.id)}
                  onAddVehicle={() => {
                    setEditingVehicle(null);
                    setShowVehicleModal(true);
                  }}
                  onStartDeal={(v) => openNewDealModal(v)}
                />
              )}

              {activeView === 'pipeline' && (
                <PipelineView
                  deals={data.deals}
                  vehicles={data.vehicles}
                  customers={data.customers}
                  onSelectDeal={(d) => {
                    setEditingDeal(d);
                    setShowDealModal(true);
                  }}
                  onAdvanceStage={handleAdvanceDealStage}
                  onNewDeal={() => openNewDealModal()}
                />
              )}

              {activeView === 'customers' && (
                <CustomersView
                  customers={data.customers}
                  deals={data.deals}
                  testDrives={data.testDrives}
                  vehicles={data.vehicles}
                  salesReps={data.salesReps}
                  onCreateCustomer={handleCreateCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onStartDealForCustomer={(customerId) =>
                    openNewDealModal(null, customerId)
                  }
                />
              )}

              {activeView === 'test-drives' && (
                <TestDrivesView
                  testDrives={data.testDrives}
                  vehicles={data.vehicles}
                  customers={data.customers}
                  salesReps={data.salesReps}
                  preselectedVehicleId={testDrivePreselectVehicleId}
                  onClearPreselect={() => setTestDrivePreselectVehicleId(null)}
                  onCreateTestDrive={handleCreateTestDrive}
                  onUpdateTestDrive={handleUpdateTestDrive}
                  onStartDeal={(v, custId) => openNewDealModal(v, custId)}
                />
              )}

              {activeView === 'showroom' && (
                <PublicShowroomView
                  vehicles={data.vehicles}
                  onSubmitInquiry={handleShowroomInquiry}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Vehicle Inspection Slide-Over */}
      <VehicleDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicleId(null)}
        onEdit={(v) => {
          setSelectedVehicleId(null);
          setEditingVehicle(v);
          setShowVehicleModal(true);
        }}
        onUpdateVehicle={handleUpdateVehicle}
        onDeleteVehicle={handleDeleteVehicle}
        onStartDeal={(v) => {
          setSelectedVehicleId(null);
          openNewDealModal(v);
        }}
        onScheduleTestDrive={(v) => {
          setSelectedVehicleId(null);
          setTestDrivePreselectVehicleId(v.id);
          setActiveView('test-drives');
        }}
      />

      {/* Add / Edit Vehicle Modal */}
      {showVehicleModal && (
        <VehicleModal
          initialVehicle={editingVehicle}
          onClose={() => {
            setShowVehicleModal(false);
            setEditingVehicle(null);
          }}
          onSave={handleSaveVehicle}
        />
      )}

      {/* Deal Desk & F&I Worksheet Modal */}
      {showDealModal && (
        <DealModal
          initialDeal={editingDeal}
          preselectedVehicle={dealPreselectVehicle}
          preselectedCustomerId={dealPreselectCustomerId}
          vehicles={data.vehicles}
          customers={data.customers}
          salesReps={data.salesReps}
          onClose={() => {
            setShowDealModal(false);
            setEditingDeal(null);
            setDealPreselectVehicle(null);
            setDealPreselectCustomerId(undefined);
          }}
          onSave={handleSaveDeal}
          onDelete={handleDeleteDeal}
        />
      )}
    </div>
  );
}
