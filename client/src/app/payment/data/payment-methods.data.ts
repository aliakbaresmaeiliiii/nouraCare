import { IranianPaymentMethod } from '../models/payment.models';

export const IRANIAN_PAYMENT_METHODS: IranianPaymentMethod[] = [
  {
    id: 'online_shaparak',
    titleKey: 'payment.method.online.title',
    subtitleKey: 'payment.method.online.subtitle',
    badgeKey: 'payment.method.online.badge',
    icon: 'card-outline',
    accent: '#ef394e',
  },
  {
    id: 'wallet',
    titleKey: 'payment.method.wallet.title',
    subtitleKey: 'payment.method.wallet.subtitle',
    icon: 'wallet-outline',
    accent: '#00bfd6',
  },
  {
    id: 'snapp_pay',
    titleKey: 'payment.method.snappPay.title',
    subtitleKey: 'payment.method.snappPay.subtitle',
    badgeKey: 'payment.method.snappPay.badge',
    icon: 'calendar-outline',
    accent: '#008efa',
  },
  {
    id: 'digipay',
    titleKey: 'payment.method.digipay.title',
    subtitleKey: 'payment.method.digipay.subtitle',
    badgeKey: 'payment.method.digipay.badge',
    icon: 'layers-outline',
    accent: '#004d8a',
  },
];
