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

export interface RoastifyCancelOrderResponse {
  message: string;
}

export interface RoastifyAddress {
  name?: string | null;
  company?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface RoastifyOrderItemDetail {
  sku?: string;
  quantity?: number;
  artworkUrl?: string | null;
  externalSourceId?: string | null;
}

export interface RoastifyShippingLabel {
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
  service?: string | null;
  status?: string | null;
}

export interface RoastifyOrderDetail {
  orderId: string;
  createdAt?: string;
  updatedAt?: string;
  orderStatus?: string;
  status?: string;
  isTest?: boolean;
  externalSourceId?: string | null;
  toAddress?: RoastifyAddress;
  returnAddress?: RoastifyAddress;
  items?: RoastifyOrderItemDetail[];
  shippingLabel?: RoastifyShippingLabel | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
}

export interface RoastifyOrdersListResponse {
  orders?: RoastifyOrderDetail[];
  pageInfo?: {
    endCursor?: string;
    hasNextPage?: boolean;
  };
}

export interface RoastifyOrderTracking {
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  trackingStatus?: string;
}
