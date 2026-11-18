import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DEALERSHIP_DATA } from './src/data/seedData.ts';
import type {
  Customer,
  Deal,
  DealershipData,
  TestDrive,
  Vehicle,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'dealership-store.json');

function ensureStore(): DealershipData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(INITIAL_DEALERSHIP_DATA, null, 2),
      'utf-8'
    );
    return structuredClone(INITIAL_DEALERSHIP_DATA);
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as DealershipData;
  } catch {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(INITIAL_DEALERSHIP_DATA, null, 2),
      'utf-8'
    );
    return structuredClone(INITIAL_DEALERSHIP_DATA);
  }
}

function saveStore(data: DealershipData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Full dealership state
  app.get('/api/state', (_req, res) => {
    const data = ensureStore();
    res.json(data);
  });

  // Reset demo data
  app.post('/api/reset', (_req, res) => {
    const fresh = structuredClone(INITIAL_DEALERSHIP_DATA);
    saveStore(fresh);
    res.json(fresh);
  });

  // Vehicles CRUD
  app.post('/api/vehicles', (req, res) => {
    const data = ensureStore();
    const payload = req.body as Omit<Vehicle, 'id' | 'createdAt'>;
    const newVehicle: Vehicle = {
      ...payload,
      id: `veh-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    data.vehicles.unshift(newVehicle);
    saveStore(data);
    res.status(201).json(newVehicle);
  });

  app.patch('/api/vehicles/:id', (req, res) => {
    const data = ensureStore();
    const idx = data.vehicles.findIndex((v) => v.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    data.vehicles[idx] = { ...data.vehicles[idx], ...req.body };
    saveStore(data);
    res.json(data.vehicles[idx]);
  });

  app.delete('/api/vehicles/:id', (req, res) => {
    const data = ensureStore();
    const exists = data.vehicles.some((v) => v.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    data.vehicles = data.vehicles.filter((v) => v.id !== req.params.id);
    saveStore(data);
    res.json({ deleted: true });
  });

  // Customers CRUD
  app.post('/api/customers', (req, res) => {
    const data = ensureStore();
    const payload = req.body as Omit<Customer, 'id' | 'createdAt'>;
    const newCustomer: Customer = {
      ...payload,
      id: `cust-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    data.customers.unshift(newCustomer);
    saveStore(data);
    res.status(201).json(newCustomer);
  });

  app.patch('/api/customers/:id', (req, res) => {
    const data = ensureStore();
    const idx = data.customers.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    data.customers[idx] = { ...data.customers[idx], ...req.body };
    saveStore(data);
    res.json(data.customers[idx]);
  });

  app.delete('/api/customers/:id', (req, res) => {
    const data = ensureStore();
    const exists = data.customers.some((c) => c.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    data.customers = data.customers.filter((c) => c.id !== req.params.id);
    saveStore(data);
    res.json({ deleted: true });
  });

  // Deals CRUD (automatically syncs vehicle status when Closed Won / Reserved)
  app.post('/api/deals', (req, res) => {
    const data = ensureStore();
    const payload = req.body as Omit<Deal, 'id' | 'dealNumber' | 'updatedAt'>;
    const nextNum = 423 + data.deals.length;
    const newDeal: Deal = {
      ...payload,
      id: `deal-${Date.now().toString(36)}`,
      dealNumber: `DL-2026-${nextNum}`,
      updatedAt: new Date().toISOString(),
    };
    data.deals.unshift(newDeal);

    const vIdx = data.vehicles.findIndex((v) => v.id === newDeal.vehicleId);
    if (vIdx !== -1) {
      if (newDeal.stage === 'Closed Won') {
        data.vehicles[vIdx].status = 'Sold';
      } else if (newDeal.stage === 'F&I Approval') {
        data.vehicles[vIdx].status = 'Reserved';
      }
    }

    saveStore(data);
    res.status(201).json({ deal: newDeal, vehicles: data.vehicles });
  });

  app.patch('/api/deals/:id', (req, res) => {
    const data = ensureStore();
    const idx = data.deals.findIndex((d) => d.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    const updated: Deal = {
      ...data.deals[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    data.deals[idx] = updated;

    const vIdx = data.vehicles.findIndex((v) => v.id === updated.vehicleId);
    if (vIdx !== -1) {
      if (updated.stage === 'Closed Won') {
        data.vehicles[vIdx].status = 'Sold';
      } else if (updated.stage === 'F&I Approval') {
        data.vehicles[vIdx].status = 'Reserved';
      } else if (
        updated.stage === 'Closed Lost' &&
        data.vehicles[vIdx].status === 'Reserved'
      ) {
        data.vehicles[vIdx].status = 'Available';
      }
    }

    saveStore(data);
    res.json({ deal: updated, vehicles: data.vehicles });
  });

  app.delete('/api/deals/:id', (req, res) => {
    const data = ensureStore();
    const deal = data.deals.find((d) => d.id === req.params.id);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    data.deals = data.deals.filter((d) => d.id !== req.params.id);
    const vIdx = data.vehicles.findIndex((v) => v.id === deal.vehicleId);
    if (vIdx !== -1 && data.vehicles[vIdx].status === 'Reserved') {
      data.vehicles[vIdx].status = 'Available';
    }
    saveStore(data);
    res.json({ deleted: true, vehicles: data.vehicles });
  });

  // Test Drives CRUD
  app.post('/api/test-drives', (req, res) => {
    const data = ensureStore();
    const payload = req.body as Omit<TestDrive, 'id'>;
    const newTd: TestDrive = {
      ...payload,
      id: `td-${Date.now().toString(36)}`,
    };
    data.testDrives.unshift(newTd);
    saveStore(data);
    res.status(201).json(newTd);
  });

  app.patch('/api/test-drives/:id', (req, res) => {
    const data = ensureStore();
    const idx = data.testDrives.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Test drive not found' });
      return;
    }
    data.testDrives[idx] = { ...data.testDrives[idx], ...req.body };
    saveStore(data);
    res.json(data.testDrives[idx]);
  });

  app.delete('/api/test-drives/:id', (req, res) => {
    const data = ensureStore();
    const exists = data.testDrives.some((t) => t.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Test drive not found' });
      return;
    }
    data.testDrives = data.testDrives.filter((t) => t.id !== req.params.id);
    saveStore(data);
    res.json({ deleted: true });
  });

  // Public Showroom Inquiry (atomically creates Customer + Test Drive + Inquiry Deal)
  app.post('/api/showroom-inquiry', (req, res) => {
    const data = ensureStore();
    const {
      name,
      email,
      phone,
      city,
      vehicleId,
      preferredDate,
      preferredTime,
      notes,
      downPayment,
      termMonths,
    } = req.body as {
      name: string;
      email: string;
      phone: string;
      city?: string;
      vehicleId: string;
      preferredDate: string;
      preferredTime: string;
      notes?: string;
      downPayment?: number;
      termMonths?: 36 | 48 | 60 | 72;
    };

    const vehicle = data.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const assignedRep = data.salesReps[0] ?? 'Elena Vance';
    const customer: Customer = {
      id: `cust-${Date.now().toString(36)}`,
      name,
      email,
      phone,
      city: city || 'San Francisco, CA',
      source: 'Web Showroom',
      budgetMax: vehicle.listPrice,
      preferredBodyStyle: vehicle.bodyStyle,
      assignedRep,
      lastContacted: new Date().toISOString().slice(0, 10),
      notes: notes || `Submitted showroom inquiry for ${vehicle.year} ${vehicle.make} ${vehicle.model}.`,
      createdAt: new Date().toISOString(),
    };
    data.customers.unshift(customer);

    const testDrive: TestDrive = {
      id: `td-${Date.now().toString(36)}`,
      vehicleId: vehicle.id,
      customerId: customer.id,
      salesRep: assignedRep,
      scheduledDate: preferredDate,
      scheduledTime: preferredTime,
      status: 'Scheduled',
      routeNotes: notes || 'Requested via public digital showroom.',
      feedback: '',
    };
    data.testDrives.unshift(testDrive);

    const nextNum = 423 + data.deals.length;
    const deal: Deal = {
      id: `deal-${Date.now().toString(36)}`,
      dealNumber: `DL-2026-${nextNum}`,
      vehicleId: vehicle.id,
      customerId: customer.id,
      salesRep: assignedRep,
      stage: 'Test Drive',
      salePrice: vehicle.listPrice,
      tradeInValue: 0,
      downPayment: downPayment ?? Math.round(vehicle.listPrice * 0.15),
      apr: 5.49,
      termMonths: termMonths ?? 60,
      docFee: 695,
      taxRate: 8.625,
      grossProfit: Math.max(0, vehicle.listPrice - vehicle.costPrice),
      expectedCloseDate: preferredDate,
      notes: notes || 'Inbound showroom reservation & test drive request.',
      updatedAt: new Date().toISOString(),
    };
    data.deals.unshift(deal);

    saveStore(data);
    res.status(201).json({ customer, testDrive, deal });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meridian DMS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
