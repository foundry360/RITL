export interface RoastifyShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email: string;
}

export interface RoastifyOrderItem {
  sku: string;
  quantity: number;
  artworkUrl?: string;
}

export interface RoastifyCreateOrderRequest {
  toAddress: RoastifyShippingAddress;
  items: RoastifyOrderItem[];
}

export interface RoastifyCreateOrderResponse {
  orderId: string;
  status?: string;
  createdAt?: string;
}
