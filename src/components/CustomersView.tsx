import { useMemo, useState, type FormEvent } from 'react';
import {
  CalendarCheck,
  Handshake,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  BodyStyle,
  Customer,
  Deal,
  LeadSource,
  TestDrive,
  Vehicle,
} from '../types.ts';
import { formatCurrency, formatShortDate } from '../utils/format.ts';

interface CustomersViewProps {
  customers: Customer[];
  deals: Deal[];
  testDrives: TestDrive[];
  vehicles: Vehicle[];
  salesReps: string[];
  onCreateCustomer: (
    payload: Omit<Customer, 'id' | 'createdAt'>
  ) => Promise<void>;
  onUpdateCustomer: (
    id: string,
    patch: Partial<Customer>
  ) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onStartDealForCustomer: (customerId: string) => void;
}

const LEAD_SOURCES: LeadSource[] = [
  'Showroom Walk-in',
  'Web Showroom',
  'Phone Inquiry',
  'Referral',
  'Partner Marketplace',
];

export function CustomersView({
  customers,
  deals,
  testDrives,
  vehicles,
  salesReps,
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onStartDealForCustomer,
}: CustomersViewProps) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Add lead state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('San Francisco, CA');
  const [source, setSource] = useState<LeadSource>('Showroom Walk-in');
  const [budgetMax, setBudgetMax] = useState(90000);
  const [preferredBodyStyle, setPreferredBodyStyle] = useState<BodyStyle | 'Any'>('SUV');
  const [assignedRep, setAssignedRep] = useState(salesReps[0] ?? 'Elena Vance');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit drawer draft state
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );
  const [editDraft, setEditDraft] = useState<Partial<Customer>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const openCustomerDrawer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setEditDraft({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      source: customer.source,
      budgetMax: customer.budgetMax,
      preferredBodyStyle: customer.preferredBodyStyle,
      assignedRep: customer.assignedRep,
      lastContacted: customer.lastContacted,
      notes: customer.notes,
    });
    setConfirmDelete(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (sourceFilter !== 'All' && c.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
      );
    });
  }, [customers, search, sourceFilter]);

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await onCreateCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '(415) 555-0190',
        city: city.trim(),
        source,
        budgetMax: Number(budgetMax),
        preferredBodyStyle,
        assignedRep,
        lastContacted: new Date().toISOString().slice(0, 10),
        notes: notes.trim(),
      });
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSavingEdit(true);
    try {
      await onUpdateCustomer(selectedCustomer.id, editDraft);
      setSelectedCustomerId(null);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buyer name, email, city, or notes..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as LeadSource | 'All')}
            aria-label="Filter by lead source"
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Lead Sources</option>
            {LEAD_SOURCES.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Buyer Lead
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900 font-display">
            No customer records found
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Add a new prospective buyer or clear your search filter.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5 whitespace-nowrap">Client</th>
                  <th className="py-3 px-4 whitespace-nowrap">Contact</th>
                  <th className="py-3 px-4 whitespace-nowrap">Source &amp; Preference</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Budget Cap</th>
                  <th className="py-3 px-4 whitespace-nowrap">Sales Rep</th>
                  <th className="py-3 px-4 whitespace-nowrap">Last Touch</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((customer) => {
                  const linkedDeals = deals.filter(
                    (d) => d.customerId === customer.id
                  );
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => openCustomerDrawer(customer)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 align-top">
                        <div className="font-medium text-slate-900">
                          {customer.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {customer.city}
                        </div>
                        {customer.notes && (
                          <p className="text-xs text-slate-500 mt-1.5 max-w-xs line-clamp-2">
                            {customer.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs text-slate-600 space-y-1 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {customer.source}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Seeking: {customer.preferredBodyStyle} · {linkedDeals.length}{' '}
                          {linkedDeals.length === 1 ? 'deal' : 'deals'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(customer.budgetMax)}
                      </td>
                      <td className="py-3.5 px-4 align-top text-slate-700 whitespace-nowrap">
                        {customer.assignedRep}
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
                        {formatShortDate(customer.lastContacted)}
                      </td>
                      <td
                        className="py-3.5 px-5 align-top text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onStartDealForCustomer(customer.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          Create Deal
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail & Edit Slide-Over Drawer */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label={`Customer profile for ${selectedCustomer.name}`}
        >
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  {selectedCustomer.source} · Last touch{' '}
                  {formatShortDate(selectedCustomer.lastContacted)}
                </p>
                <h2 className="text-lg font-semibold text-slate-900 font-display truncate">
                  {selectedCustomer.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                aria-label="Close drawer"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5 flex-1">
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs text-slate-600">
                  Quick CRM Touchpoint
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const today = new Date().toISOString().slice(0, 10);
                    setEditDraft((prev) => ({ ...prev, lastContacted: today }));
                    await onUpdateCustomer(selectedCustomer.id, {
                      lastContacted: today,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  Mark Contacted Today
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editDraft.name ?? ''}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editDraft.email ?? ''}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editDraft.phone ?? ''}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editDraft.city ?? ''}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Max Budget ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editDraft.budgetMax ?? 0}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        budgetMax: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preferred Body
                  </label>
                  <select
                    value={editDraft.preferredBodyStyle ?? 'Any'}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        preferredBodyStyle: e.target.value as BodyStyle | 'Any',
                      }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="Any">Any</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Wagon">Wagon</option>
                    <option value="Coupe">Coupe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assigned Rep
                  </label>
                  <select
                    value={editDraft.assignedRep ?? salesReps[0]}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        assignedRep: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    {salesReps.map((rep) => (
                      <option key={rep} value={rep}>
                        {rep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Buyer Qualification &amp; Follow-up Notes
                </label>
                <textarea
                  rows={3}
                  value={editDraft.notes ?? ''}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Linked Deals & Test Drives */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-700">
                  Linked Activity
                </h3>
                {(() => {
                  const custDeals = deals.filter(
                    (d) => d.customerId === selectedCustomer.id
                  );
                  const custDrives = testDrives.filter(
                    (t) => t.customerId === selectedCustomer.id
                  );
                  if (custDeals.length === 0 && custDrives.length === 0) {
                    return (
                      <p className="text-xs text-slate-500">
                        No linked deals or test drives yet.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2 text-xs">
                      {custDeals.map((d) => {
                        const v = vehicles.find((item) => item.id === d.vehicleId);
                        return (
                          <div
                            key={d.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-800">
                              {d.dealNumber} ·{' '}
                              {v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle'}
                            </span>
                            <span className="font-mono text-blue-700">
                              {d.stage} · {formatCurrency(d.salePrice)}
                            </span>
                          </div>
                        );
                      })}
                      {custDrives.map((t) => {
                        const v = vehicles.find((item) => item.id === t.vehicleId);
                        return (
                          <div
                            key={t.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                          >
                            <span className="text-slate-700">
                              Test Drive ·{' '}
                              {v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle'}
                            </span>
                            <span className="font-mono text-slate-600">
                              {formatShortDate(t.scheduledDate)} · {t.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Lead
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await onDeleteCustomer(selectedCustomer.id);
                        setSelectedCustomerId(null);
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
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedCustomer.id;
                      setSelectedCustomerId(null);
                      onStartDealForCustomer(id);
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    New Deal
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add Buyer Lead"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 font-display">
                Add Buyer Lead
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
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
                    placeholder="Alex Rivera"
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
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(415) 555-0148"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preferred Body
                  </label>
                  <select
                    value={preferredBodyStyle}
                    onChange={(e) =>
                      setPreferredBodyStyle(e.target.value as BodyStyle | 'Any')
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    <option value="Any">Any</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Wagon">Wagon</option>
                    <option value="Coupe">Coupe</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Max Budget ($)
                  </label>
                  <input
                    type="number"
                    min={10000}
                    step={1000}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Sales Rep
                </label>
                <select
                  value={assignedRep}
                  onChange={(e) => setAssignedRep(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                >
                  {salesReps.map((rep) => (
                    <option key={rep} value={rep}>
                      {rep}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Qualification Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Trade-in details, timeline, financing preferences..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Buyer Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
