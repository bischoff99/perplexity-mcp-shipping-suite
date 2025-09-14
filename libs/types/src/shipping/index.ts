// Shipping Types
export interface Address {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Package {
  length: number;
  width: number;
  height: number;
  weight: number;
  predefined_package?: string;
}

export interface Shipment {
  id?: string;
  to_address: Address;
  from_address: Address;
  parcel: Package;
  carrier?: string;
  service?: string;
  reference?: string;
  customs_info?: CustomsInfo;
}

export interface CustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_items: CustomsItem[];
  eel_pfc?: string;
  non_delivery_option?: string;
  restriction_type?: string;
  restriction_comments?: string;
}

export interface CustomsItem {
  description: string;
  quantity: number;
  weight: number;
  value: number;
  hs_tariff_number?: string;
  origin_country?: string;
}

export interface Rate {
  id: string;
  object: string;
  service: string;
  carrier: string;
  carrier_account_id?: string;
  shipment_id: string;
  rate: string;
  currency: string;
  retail_rate?: string;
  list_rate?: string;
  delivery_days?: number;
  delivery_date?: string;
  delivery_date_guaranteed?: boolean;
  est_delivery_days?: number;
}

export interface TrackingInfo {
  id: string;
  object: string;
  mode: string;
  tracking_code: string;
  status: string;
  status_detail?: string;
  created_at: string;
  updated_at: string;
  signed_by?: string;
  weight?: number;
  est_delivery_date?: string;
  shipment_id?: string;
  carrier: string;
  tracking_details: TrackingDetail[];
  carrier_detail?: any;
  public_url?: string;
  fees: any[];
}

export interface TrackingDetail {
  object: string;
  message: string;
  status: string;
  datetime: string;
  source: string;
  tracking_location?: {
    object: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
}
