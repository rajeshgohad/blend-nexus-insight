// Master Batch Data - Single source of truth for all batch information across the application
export type DrugType = 'Metformin HCl' | 'Atorvastatin Calcium' | 'Lisinopril' | 'Omeprazole' | 'Amlodipine Besylate';
export type DensityLevel = 'low' | 'medium' | 'high';
export type CleaningRule = 'none' | 'partial' | 'full';
export type TabletSize = '6mm' | '8mm' | '10mm' | '12mm';
export type TabletShape = 'round' | 'oval' | 'capsule' | 'oblong';
export type ProductionLine = 'Line 1' | 'Line 2';

export interface BatchOrder {
  id: string;
  batchNumber: string;
  productName: string;
  productId: string;
  drug: DrugType;
  strength: string;
  density: DensityLevel;
  cleaningRule: CleaningRule;
  tabletSize: TabletSize;
  tabletShape: TabletShape;
  targetQuantity: number;
  unit: string;
  priority: 'normal' | 'high' | 'urgent';
  requiredTemp: { min: number; max: number };
  requiredHumidity: { min: number; max: number };
  toolingRequired: string;
  estimatedDuration: number; // minutes
  specialInstructions?: string;
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed';
  productionLine: ProductionLine;
}

// Master batch orders - these batch numbers are used across the entire application
export const BATCH_ORDERS: BatchOrder[] = [
  {
    id: 'batch-001',
    batchNumber: 'BN-2024-0847',
    productName: 'Metformin 500mg',
    productId: 'MET-500',
    drug: 'Metformin HCl',
    strength: '500mg',
    density: 'medium',
    cleaningRule: 'none',
    tabletSize: '8mm',
    tabletShape: 'round',
    targetQuantity: 100000,
    unit: 'tablets',
    priority: 'normal',
    requiredTemp: { min: 20, max: 25 },
    requiredHumidity: { min: 40, max: 50 },
    toolingRequired: '8mm round concave',
    estimatedDuration: 45,
    status: 'in-progress',
    productionLine: 'Line 1',
  },
  {
    id: 'batch-002',
    batchNumber: 'BN-2024-0848',
    productName: 'Metformin 500mg',
    productId: 'MET-500',
    drug: 'Metformin HCl',
    strength: '500mg',
    density: 'medium',
    cleaningRule: 'none',
    tabletSize: '8mm',
    tabletShape: 'round',
    targetQuantity: 100000,
    unit: 'tablets',
    priority: 'normal',
    requiredTemp: { min: 20, max: 25 },
    requiredHumidity: { min: 40, max: 50 },
    toolingRequired: '8mm round concave',
    estimatedDuration: 45,
    status: 'scheduled',
    productionLine: 'Line 2',
  },
  {
    id: 'batch-003',
    batchNumber: 'BN-2024-0849',
    productName: 'Metformin 850mg',
    productId: 'MET-850',
    drug: 'Metformin HCl',
    strength: '850mg',
    density: 'high',
    cleaningRule: 'partial',
    tabletSize: '10mm',
    tabletShape: 'oval',
    targetQuantity: 80000,
    unit: 'tablets',
    priority: 'normal',
    requiredTemp: { min: 20, max: 25 },
    requiredHumidity: { min: 40, max: 50 },
    toolingRequired: '10mm oval flat',
    estimatedDuration: 50,
    specialInstructions: 'Requires die changeover from 8mm',
    status: 'scheduled',
    productionLine: 'Line 1',
  },
  {
    id: 'batch-004',
    batchNumber: 'BN-2024-0850',
    productName: 'Metformin 1000mg',
    productId: 'MET-1000',
    drug: 'Metformin HCl',
    strength: '1000mg',
    density: 'low',
    cleaningRule: 'partial',
    tabletSize: '12mm',
    tabletShape: 'oblong',
    targetQuantity: 60000,
    unit: 'tablets',
    priority: 'high',
    requiredTemp: { min: 20, max: 25 },
    requiredHumidity: { min: 40, max: 50 },
    toolingRequired: '12mm oblong embossed',
    estimatedDuration: 55,
    specialInstructions: 'High priority - adjust schedule if needed',
    status: 'scheduled',
    productionLine: 'Line 2',
  },
  {
    id: 'batch-005',
    batchNumber: 'BN-2024-0851',
    productName: 'Atorvastatin 20mg',
    productId: 'ATV-20',
    drug: 'Atorvastatin Calcium',
    strength: '20mg',
    density: 'high',
    cleaningRule: 'full',
    tabletSize: '6mm',
    tabletShape: 'round',
    targetQuantity: 120000,
    unit: 'tablets',
    priority: 'normal',
    requiredTemp: { min: 18, max: 22 },
    requiredHumidity: { min: 35, max: 45 },
    toolingRequired: '6mm round film-coated',
    estimatedDuration: 60,
    specialInstructions: 'Full line clearance required - different API',
    status: 'pending',
    productionLine: 'Line 1',
  },
  {
    id: 'batch-006',
    batchNumber: 'BN-2024-0852',
    productName: 'Atorvastatin 40mg',
    productId: 'ATV-40',
    drug: 'Atorvastatin Calcium',
    strength: '40mg',
    density: 'medium',
    cleaningRule: 'partial',
    tabletSize: '8mm',
    tabletShape: 'oval',
    targetQuantity: 90000,
    unit: 'tablets',
    priority: 'normal',
    requiredTemp: { min: 18, max: 22 },
    requiredHumidity: { min: 35, max: 45 },
    toolingRequired: '8mm oval film-coated',
    estimatedDuration: 55,
    status: 'pending',
    productionLine: 'Line 2',
  },
  {
    id: 'batch-007',
    batchNumber: 'BN-2024-0853',
    productName: 'Lisinopril 10mg',
    productId: 'LIS-10',
    drug: 'Lisinopril',
    strength: '10mg',
    density: 'low',
    cleaningRule: 'full',
    tabletSize: '6mm',
    tabletShape: 'round',
    targetQuantity: 150000,
    unit: 'tablets',
    priority: 'urgent',
    requiredTemp: { min: 20, max: 25 },
    requiredHumidity: { min: 30, max: 40 },
    toolingRequired: '6mm round scored',
    estimatedDuration: 40,
    specialInstructions: 'URGENT - Hospital order. Full QA clearance required.',
    status: 'pending',
    productionLine: 'Line 1',
  },
  {
    id: 'batch-008',
    batchNumber: 'BN-2024-0854',
    productName: 'Omeprazole 20mg',
    productId: 'OMP-20',
    drug: 'Omeprazole',
    strength: '20mg',
    density: 'medium',
    cleaningRule: 'full',
    tabletSize: '8mm',
    tabletShape: 'capsule',
    targetQuantity: 100000,
    unit: 'capsules',
    priority: 'normal',
    requiredTemp: { min: 15, max: 20 },
    requiredHumidity: { min: 25, max: 35 },
    toolingRequired: 'Size 2 capsule filler',
    estimatedDuration: 65,
    specialInstructions: 'Moisture sensitive - strict RH control',
    status: 'pending',
    productionLine: 'Line 2',
  },
  {
    id: 'batch-009',
    batchNumber: 'BN-2024-0855',
    productName: 'Amlodipine 5mg',
    productId: 'AML-5',
    drug: 'Amlodipine Besylate',
    strength: '5mg',
    density: 'low',
    cleaningRule: 'full',
    tabletSize: '6mm',
    tabletShape: 'round',
    targetQuantity: 200000,
    unit: 'tablets',
    priority: 'normal',
    requiredTemp: { min: 20, max: 25 },
    requiredHumidity: { min: 40, max: 50 },
    toolingRequired: '6mm round plain',
    estimatedDuration: 45,
    status: 'pending',
    productionLine: 'Line 1',
  },
  {
    id: 'batch-010',
    batchNumber: 'BN-2024-0856',
    productName: 'Amlodipine 10mg',
    productId: 'AML-10',
    drug: 'Amlodipine Besylate',
    strength: '10mg',
    density: 'medium',
    cleaningRule: 'partial',
    tabletSize: '8mm',
    tabletShape: 'round',
    targetQuantity: 180000,
    unit: 'tablets',
    priority: 'normal',
    requiredTemp: { min: 20, max: 25 },
    requiredHumidity: { min: 40, max: 50 },
    toolingRequired: '8mm round scored',
    estimatedDuration: 50,
    status: 'pending',
    productionLine: 'Line 2',
  },
];

// Helper function to get batch by batch number
export function getBatchByNumber(batchNumber: string): BatchOrder | undefined {
  return BATCH_ORDERS.find(b => b.batchNumber === batchNumber);
}

// Helper function to get batches for control panel dropdown
export function getBatchSelectOptions(): { value: string; label: string; isCurrent: boolean }[] {
  return BATCH_ORDERS.map(batch => ({
    value: batch.batchNumber,
    label: `${batch.batchNumber} - ${batch.productName}`,
    isCurrent: batch.status === 'in-progress',
  }));
}

// Helper function to group batches by drug and density for scheduling
export interface BatchGroupingResult {
  sameDrugSameDensity: BatchOrder[];
  sameDrugDiffDensity: BatchOrder[];
  diffDrugDiffDensity: BatchOrder[];
}

export function groupBatchesForScheduling(): BatchGroupingResult {
  // Get the first batch as reference (current batch)
  const referenceBatch = BATCH_ORDERS[0];
  
  const sameDrugSameDensity: BatchOrder[] = [];
  const sameDrugDiffDensity: BatchOrder[] = [];
  const diffDrugDiffDensity: BatchOrder[] = [];

  BATCH_ORDERS.forEach(batch => {
    if (batch.drug === referenceBatch.drug && batch.density === referenceBatch.density) {
      sameDrugSameDensity.push(batch);
    } else if (batch.drug === referenceBatch.drug && batch.density !== referenceBatch.density) {
      sameDrugDiffDensity.push(batch);
    } else {
      diffDrugDiffDensity.push(batch);
    }
  });

  return {
    sameDrugSameDensity,
    sameDrugDiffDensity,
    diffDrugDiffDensity,
  };
}
