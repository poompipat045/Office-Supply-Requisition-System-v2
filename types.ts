
export type RequestStatus = 'PENDING' | 'APPROVED' | 'ISSUED' | 'REJECTED';

export interface Material {
  id: number | string;
  name: string;
  stock: number;
  unit: string;
}

export interface User {
  id: number | string;
  name: string;
  department: string;
  role: 'ADMIN' | 'USER';
  username: string;
  password: string;
}

export interface Request {
  id: number | string;
  user_id: number | string;
  material_id: number | string;
  quantity: number;
  request_date: string; // ISO String
  status: RequestStatus;
}

export interface DatabaseState {
  materials: Material[];
  users: User[];
  requests: Request[];
}
