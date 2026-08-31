export interface SubscriptionRecord {
  plan: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
  currentPeriodEnd: string | null;
}

export interface PayfastPayload {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  subscription_type: string;
  billing_date: string;
  recurring_amount: string;
  frequency: string;
  cycles: string;
  signature: string;
  actionUrl: string;
}