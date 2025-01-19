export interface DatabaseField {
  key: string;
  label: string;
  required?: boolean;
}

export interface StudentImport {
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  cpf?: string;
  rg?: string;
  religion?: string;
  unit?: 'Templo SP' | 'Templo BH';
  is_founder?: boolean | string | undefined;
  is_admin?: boolean | string | undefined;
  is_active?: boolean | string | undefined;
  development_start_date?: string;
  internship_start_date?: string;
  magista_initiation_date?: string;
  not_entry_date?: string;
  master_mage_initiation_date?: string;
  inactive_since?: string;
  photo_url?: string;
  [key: string]: any;
}
