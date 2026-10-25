export interface BuildingApiResponse {
  id: string;
  name: string;
  floor_number?: number;
  headquarters_id?: string | null;
  sub_headquarters_id?: string | null;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HeadquartersApiResponse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubHeadquartersApiResponse {
  id: string;
  headquarter_id?: string;
  name: string;
  address?: string;
  phone?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoomLocationHierarchy {
  roomId: string;
  roomNumber: string;
  floor: number | string;
  buildingId?: string | null;
  buildingName: string | null;
  hasBuilding: boolean;
  headquartersId?: string | null;
  headquartersName: string | null;
  hasHeadquarters: boolean;
  subHeadquartersId?: string | null;
  subHeadquartersName: string | null;
  hasSubHeadquarters: boolean;
  formattedOptionLabel: string;
}
