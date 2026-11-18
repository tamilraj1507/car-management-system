export type VehicleStatus = 'Available' | 'Reserved' | 'In Prep' | 'Sold';

export type FuelType = 'Electric' | 'Hybrid' | 'Gasoline';

export type BodyStyle = 'Sedan' | 'SUV' | 'Wagon' | 'Coupe';

export interface PrepChecklist {
  inspection: boolean;
  detailing: boolean;
  photography: boolean;
  pricingVerified: boolean;
}

export interface Vehicle {
  id: string;
  stockNumber: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: BodyStyle;
  fuelType: FuelType;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  costPrice: number;
  listPrice: number;
  status: VehicleStatus;
  daysInStock: number;
  location: string;
  imageUrl: string;
  horsepower: number;
  notes: string;
  prepChecklist: PrepChecklist;
  createdAt: string;
}

export type DealStage =
  | 'Inquiry'
  | 'Test Drive'
  | 'Negotiation'
  | 'F&I Approval'
  | 'Closed Won'
  | 'Closed Lost';

export type LeadSource =
  | 'Showroom Walk-in'
  | 'Web Showroom'
  | 'Phone Inquiry'
  | 'Referral'
  | 'Partner Marketplace';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  source: LeadSource;
  budgetMax: number;
  preferredBodyStyle: BodyStyle | 'Any';
  assignedRep: string;
  lastContacted: string;
  notes: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  dealNumber: string;
  vehicleId: string;
  customerId: string;
  salesRep: string;
  stage: DealStage;
  salePrice: number;
  tradeInValue: number;
  downPayment: number;
  apr: number;
  termMonths: 36 | 48 | 60 | 72;
  docFee: number;
  taxRate: number;
  grossProfit: number;
  expectedCloseDate: string;
  notes: string;
  updatedAt: string;
}

export type TestDriveStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface TestDrive {
  id: string;
  vehicleId: string;
  customerId: string;
  salesRep: string;
  scheduledDate: string;
  scheduledTime: string;
  status: TestDriveStatus;
  routeNotes: string;
  feedback: string;
}

export interface DealershipData {
  vehicles: Vehicle[];
  customers: Customer[];
  deals: Deal[];
  testDrives: TestDrive[];
  salesReps: string[];
}

export type ActiveView =
  | 'overview'
  | 'inventory'
  | 'pipeline'
  | 'customers'
  | 'test-drives'
  | 'showroom';
