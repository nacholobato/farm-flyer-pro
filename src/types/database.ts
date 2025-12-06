export type JobStatus = 'pending' | 'in_progress' | 'done';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  client_id: string;
  name: string;
  location: string | null;
  area_hectares: number | null;
  notes: string | null;
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
  product_name: string;
  dose: number;
  unit: string;
  application_order: number;
  notes: string | null;
  created_at: string;
}

export interface JobWithDetails extends Job {
  client: Client;
  farm: Farm;
  agrochemicals: AgrochemicalUsed[];
}