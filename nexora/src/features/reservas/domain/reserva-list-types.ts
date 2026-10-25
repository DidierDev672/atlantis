export type ReservaViewMode = 'cards' | 'table';

export interface StayApiDto {
  id: string;
  room_id: string;
  reservation_id?: string;
  person_ids?: string[];
  person_id?: string;
  check_in_date: string;
  check_out_date: string;
  payment_method?: string;
  security_deposit?: number;
  remarks?: string;
  status?: string;
  state?: string;
  number_of_guests?: number;
  total_price?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type ReservaApiDto = StayApiDto;

export type ReservaTone =
  | 'amber'
  | 'emerald'
  | 'blue'
  | 'stone'
  | 'red'
  | 'purple';

export interface ReservaGuestItem {
  id?: string;
  name: string;
  initials: string;
}

export interface ReservaViewItem {
  id: string;
  roomId: string;
  roomDisplayName: string;
  roomFloor?: string | number;
  personId: string;
  personIds?: string[];
  personDisplayName: string;
  guests?: ReservaGuestItem[];
  checkInDate: string;
  checkInFormatted: string;
  checkOutDate: string;
  checkOutFormatted: string;
  nights: number;
  numberOfGuests: number;
  state: string;
  stateLabel: string;
  stateTone: ReservaTone;
  totalPrice: number;
  totalPriceFormatted: string;
  paymentMethod?: string;
  securityDeposit?: number;
  remarks?: string;
  createdBy: string;
  createdAt?: string;
}

