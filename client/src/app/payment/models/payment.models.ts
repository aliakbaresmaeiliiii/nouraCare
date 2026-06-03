export type PaymentSource = 'shop' | 'consultation';

export type IranianPaymentMethodId =
  | 'online_shaparak'
  | 'wallet'
  | 'snapp_pay'
  | 'digipay';

export interface IranianPaymentMethod {
  id: IranianPaymentMethodId;
  titleKey: string;
  subtitleKey: string;
  badgeKey?: string;
  icon: string;
  accent: string;
}

export interface PaymentLineItem {
  id: string;
  titleKey: string;
  subtitleKey?: string;
  quantity: number;
  unitAmountTomans: number;
  imageUrl?: string;
}

export interface ConsultationPaymentMeta {
  doctorId: string;
  doctorName: string;
  specialtyLabel: string;
  bookingType: 'online' | 'in-person';
  timeLabel: string;
  avatarUrl?: string;
  appointmentId?: string;
}

export interface PaymentOrder {
  id: string;
  source: PaymentSource;
  items: PaymentLineItem[];
  subtotalTomans: number;
  discountTomans: number;
  payableTomans: number;
  createdAt: string;
  consultation?: ConsultationPaymentMeta;
}

export interface PaymentResult {
  orderId: string;
  source: PaymentSource;
  methodId: IranianPaymentMethodId;
  success: boolean;
  referenceCode?: string;
  paidAt: string;
  consultation?: ConsultationPaymentMeta;
}
