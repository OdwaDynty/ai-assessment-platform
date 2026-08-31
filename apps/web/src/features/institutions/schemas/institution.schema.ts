export interface InstitutionRecord {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}