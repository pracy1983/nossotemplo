export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          birth_date: string | null;
          cpf: string | null;
          rg: string | null;
          phone: string | null;
          religion: string | null;
          unit: 'Templo SP' | 'Templo BH' | null;
          photo_url: string | null;
          is_admin: boolean;
          is_active: boolean;
          is_founder: boolean;
          development_start_date: string | null;
          internship_start_date: string | null;
          magista_initiation_date: string | null;
          not_entry_date: string | null;
          master_mage_initiation_date: string | null;
          inactive_since: string | null;
          created_at: string;
        };
      };
    };
  };
}