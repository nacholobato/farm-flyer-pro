export type JobStatus = 'pending' | 'in_progress' | 'done';

export interface Organization {
  id: string;
  name: string;
  ruc: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  razon_social: string | null;
  cuit: string | null;
  contacto_principal: string | null;
  puesto: string | null;
  phone: string | null;
  otro_contacto_1: string | null;
  telefono_1: string | null;
  otro_contacto_2: string | null;
  telefono_2: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  client_id: string;
  organization_id: string | null;
  name: string;
  cultivo: string | null;
  area_hectares: number | null;
  localidad: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  client_id: string;
  farm_id: string;
  title: string;
  description: string | null;
  task: string | null;
  application_dose: string | null;
  cuadro: string | null;
  cultivo: string | null;
  superficie_teorica_has: number | null;
  superficie_aplicada_has: number | null;
  start_date: string | null;
  due_date: string | null;
  status: JobStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: Client;
  farm?: Farm;
}

export interface AgrochemicalUsed {
  id: string;
  job_id: string;
  product_id: string | null;
  product_name: string;
  dose: number;
  unit: string;
  application_order: number;
  cost_per_unit: number | null;
  notes: string | null;
  created_at: string;
}

export interface JobWithDetails extends Job {
  client: Client;
  farm: Farm;
  agrochemicals: AgrochemicalUsed[];
}

export type ResourceCategory =
  | 'weather_climate'
  | 'crop_information'
  | 'market_prices'
  | 'pest_management'
  | 'education_research'
  | 'data_statistics'
  | 'equipment'
  | 'regulations'
  | 'other';

export interface Resource {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ResourceCategory;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgrochemicalUsed {
  id: string;
  job_id: string;
  agrochemical_id: string | null;
  product_name: string;
  dose: number;
  unit: string;
  application_order: number;
  cost_per_unit: number | null;
  notes: string | null;
  created_at: string;
}

export interface Agrochemical {
  id: string;
  created_at: string;
  name: string;
  active_ingredient: string | null;
  category: string | null;
  mode_of_action: string | null;
  toxicological_class: string | null;
  manufacturer: string | null;
  function: string | null;
  safety_precautions: string | null;
  label_url: string | null;
  standard_dose: number | null;
  unit: string;
  organization_id: string;
}
