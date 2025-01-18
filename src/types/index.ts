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
  is_founder?: boolean;
  unit?: string;
  [key: string]: any;
}
