import { MCPClient, MCPClientConfig } from './base-client.js';
import type {
  EasyPostAddress,
  EasyPostParcel,
  EasyPostShipment,
  EasyPostRate
} from '@perplexity/shared';

export interface EasyPostMCPConfig extends Omit<MCPClientConfig, 'baseURL'> {
  baseURL?: string;
  apiKey: string;
}

export class EasyPostMCPClient extends MCPClient {
  constructor(config: EasyPostMCPConfig) {
    super({
      baseURL: config.baseURL || 'http://localhost:3000',
      timeout: config.timeout,
      retries: config.retries,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.headers
      }
    });
  }

  // Shipment Management
  async createShipment(params: {
    to_address: EasyPostAddress;
    from_address: EasyPostAddress;
    parcel: EasyPostParcel;
    carrier_accounts?: string[];
    service?: string;
  }): Promise<EasyPostShipment> {
    return this.call('create_shipment', params);
  }

  async getShipmentRates(shipmentId: string): Promise<EasyPostRate[]> {
    return this.call('get_shipment_rates', { shipmentId });
  }

  async buyShipmentLabel(params: {
    shipmentId: string;
    rateId: string;
  }): Promise<EasyPostShipment> {
    return this.call('buy_shipment_label', params);
  }

  async trackShipment(params: {
    trackingCode: string;
    carrier?: string;
  }): Promise<any> {
    return this.call('track_shipment', params);
  }

  async refundShipment(shipmentId: string): Promise<any> {
    return this.call('refund_shipment', { shipmentId });
  }

  // Address Management
  async validateAddress(address: EasyPostAddress): Promise<EasyPostAddress[]> {
    return this.call('validate_address', { address });
  }

  async verifyAddress(params: {
    address: EasyPostAddress;
    carrier?: string;
  }): Promise<EasyPostAddress> {
    return this.call('verify_address', params);
  }

  // Insurance
  async buyInsurance(params: {
    shipmentId: string;
    amount: string;
  }): Promise<any> {
    return this.call('buy_insurance', params);
  }

  // SmartRate
  async getSmartRateEstimates(params: {
    from_zip: string;
    to_zip: string;
    carriers?: string[];
  }): Promise<any> {
    return this.call('get_smartrate_estimates', params);
  }

  // Batch Operations
  async createBatch(): Promise<{ id: string }> {
    return this.call('create_batch');
  }

  async addShipmentsToBatch(params: {
    batchId: string;
    shipmentIds: string[];
  }): Promise<any> {
    return this.call('add_shipments_to_batch', params);
  }

  async buyBatch(batchId: string): Promise<any> {
    return this.call('buy_batch', { batchId });
  }

  // SCAN Form
  async createScanForm(shipmentIds: string[]): Promise<any> {
    return this.call('scan_form_create', { shipmentIds });
  }

  // Customs (International)
  async createCustomsInfo(params: {
    customs_items: any[];
    contents_type: string;
    customs_certify: boolean;
    customs_signer: string;
    contents_explanation?: string;
  }): Promise<any> {
    return this.call('create_customs_info', params);
  }

  async getCustomsInfo(customsInfoId: string): Promise<any> {
    return this.call('get_customs_info', { customsInfoId });
  }
}