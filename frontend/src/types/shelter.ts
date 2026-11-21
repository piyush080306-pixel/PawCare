export type Species = 'DOG' | 'CAT' | 'BIRD';
export type StaffRole = 'MANAGER' | 'VETERINARIAN' | 'CARETAKER';
export type AdoptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VaccinationStatus = 'VACCINATED' | 'PARTIAL' | 'UNVACCINATED';

export interface Animal {
  id: number;
  category: Species;
  name: string;
  age: number;
  gender: string;
  healthStatus: string;
  isAdopted: boolean;
  describe?: string;
  detail?: string;
  breed?: string;
  size?: string;
  isTrained?: boolean;
  furColor?: string;
  isIndoorFriendly?: boolean;
  species?: string;
  wingspan?: number;
  canFly?: boolean;
}

export type AnimalCreateInput = {
  category: Species;
  name: string;
  age: number;
  gender: string;
  healthStatus: string;
  breed?: string;
  size?: string;
  isTrained?: boolean;
  furColor?: string;
  isIndoorFriendly?: boolean;
  species?: string;
  wingspan?: number;
  canFly?: boolean;
};

export type AnimalUpdateInput = Pick<Animal, 'name' | 'age' | 'gender' | 'healthStatus'>;

export interface StaffMember {
  id: number;
  role: StaffRole;
  name: string;
  contactNumber: string;
  age: number;
  salary: number;
  describe?: string;
  detail?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  shift?: string;
  assignedArea?: string;
}

export type StaffCreateInput = {
  role: StaffRole;
  name: string;
  contactNumber: string;
  age: number;
  salary: number;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  shift?: string;
  assignedArea?: string;
};

export type StaffUpdateInput = Pick<StaffMember, 'name' | 'contactNumber' | 'age' | 'salary'>;

export interface AdoptionApplication {
  id: number;
  animalId: number;
  animalName: string;
  adopterName: string;
  adopterAge: number;
  adopterContact: string;
  date: string;
  status: AdoptionStatus;
}

export type AdoptionCreateInput = Pick<
  AdoptionApplication,
  'animalId' | 'adopterName' | 'adopterAge' | 'adopterContact'
>;

export interface MedicalRecord {
  id: number;
  animalId: number;
  animalName: string;
  condition: string;
  vaccinationStatus: VaccinationStatus;
  treatment: string;
  lastCheckupDate: string;
  nextVaccinationDate: string;
  vetId: number | null;
  vetName: string | null;
}

export type MedicalRecordCreateInput = {
  animalId: number;
  medicalCondition: string;
  vaccinationStatus: VaccinationStatus;
  treatmentDetails: string;
  lastCheckupDate: string;
  nextVaccinationDate: string;
  assignedVetId: number | null;
};

export type VaccinationUpdateInput = {
  status: VaccinationStatus;
  nextVaccinationDate: string;
};

export interface CategoryCount {
  label: string;
  count: number;
}

export interface DashboardStats {
  totalAnimals: number;
  availableAnimals: number;
  adoptedAnimals: number;
  totalDogs: number;
  totalCats: number;
  totalBirds: number;
  totalStaff: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalMedicalRecords: number;
}

export interface DashboardMetrics {
  stats: DashboardStats;
  adoptionRate: number;
  successRate: number;
  categories: CategoryCount[];
  roles: CategoryCount[];
  upcoming: MedicalRecord[];
}

export interface ReportMetrics {
  adoptionSuccessRate: number;
  adoptionRate: number;
  available: number;
  adopted: number;
  categories: CategoryCount[];
  roles: CategoryCount[];
  monthly: CategoryCount[];
  upcoming: MedicalRecord[];
}

export type TimeWindow = '7' | '30' | 'overdue' | 'all';

export interface NamedRoute {
  path: string;
  label: string;
}
