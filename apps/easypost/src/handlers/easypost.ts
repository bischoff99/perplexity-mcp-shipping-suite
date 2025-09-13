import { logger } from '../utils/logger.js';
import { EasyPostClient } from '../services/easypost-client.js';
import {
  EasyPostShipment,
  EasyPostRate,
  EasyPostAddress,
  EasyPostTracker,
  EasyPostAccount,
  EasyPostCarrier,
  CreateShipmentRequest,
  AddressValidationRequest,
  SmartrateRequest,
  EasyPostError
} from '../types/index.js';

/**
 * EasyPost API handlers implementing all shipping operations
 * Provides high-level interface for EasyPost API interactions
 */
export class EasyPostHandlers {
  private client: EasyPostClient;

  constructor(client: EasyPostClient) {
    this.client = client;
  }

  /**
   * Create a new shipment
   */
  async createShipment(request: CreateShipmentRequest): Promise<EasyPostShipment> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating shipment', {
        to_city: request.to_address.city,
        from_city: request.from_address.city,
        weight: request.parcel.weight
      });

      const shipmentData = {
        to_address: this.formatAddress(request.to_address),
        from_address: this.formatAddress(request.from_address),
        parcel: this.formatParcel(request.parcel),
        options: request.options || {},
        customs_info: request.customs_info ? this.formatCustomsInfo(request.customs_info) : undefined
      };

      const response = await this.client.post<EasyPostShipment>('/shipments', shipmentData);
      
      const duration = Date.now() - startTime;
      logger.info('Shipment created successfully', {
        shipmentId: response.id,
        duration,
        rateCount: response.rates?.length || 0
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create shipment', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        to_city: request.to_address.city,
        from_city: request.from_address.city
      });
      
      if (error instanceof EasyPostError) {
        throw error;
      }
      
      throw new EasyPostError(
        'Failed to create shipment',
        'SHIPMENT_CREATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get shipping rates for a shipment
   */
  async getShipmentRates(shipmentId: string): Promise<EasyPostRate[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching shipment rates', { shipmentId });

      const response = await this.client.get<EasyPostShipment>(`/shipments/${shipmentId}`);
      
      if (!response.rates || response.rates.length === 0) {
        logger.warn('No rates available for shipment', { shipmentId });
        return [];
      }

      const duration = Date.now() - startTime;
      logger.info('Shipment rates retrieved', {
        shipmentId,
        rateCount: response.rates.length,
        duration
      });

      return response.rates;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get shipment rates', {
        shipmentId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        `Failed to get rates for shipment ${shipmentId}`,
        'RATES_FETCH_FAILED',
        { shipmentId, originalError: error }
      );
    }
  }

  /**
   * Purchase a shipping label for a shipment
   */
  async buyShipmentLabel(shipmentId: string, rateId: string): Promise<EasyPostShipment> {
    const startTime = Date.now();
    
    try {
      logger.info('Purchasing shipment label', { shipmentId, rateId });

      const response = await this.client.post<EasyPostShipment>(
        `/shipments/${shipmentId}/buy`,
        { rate: { id: rateId } }
      );
      
      const duration = Date.now() - startTime;
      const logContext: Record<string, unknown> = {
        shipmentId,
        rateId,
        duration
      };

      if (response.tracking_code !== undefined) {
        logContext['trackingCode'] = response.tracking_code;
      }

      if (response.postage_label?.label_url !== undefined) {
        logContext['labelUrl'] = response.postage_label.label_url;
      }

      logger.info('Label purchased successfully', logContext);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to purchase label', {
        shipmentId,
        rateId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        `Failed to buy label for shipment ${shipmentId}`,
        'LABEL_PURCHASE_FAILED',
        { shipmentId, rateId, originalError: error }
      );
    }
  }

  /**
   * Track a shipment by tracking code
   */
  async trackShipment(trackingCode: string, carrier?: string): Promise<EasyPostTracker> {
    const startTime = Date.now();
    
    try {
      logger.info('Tracking shipment', { trackingCode, carrier });

      const trackingData: Record<string, string> = {
        tracking_code: trackingCode
      };

      if (carrier) {
        trackingData['carrier'] = carrier;
      }

      const response = await this.client.post<EasyPostTracker>('/trackers', trackingData);
      
      const duration = Date.now() - startTime;
      logger.info('Shipment tracking retrieved', {
        trackingCode,
        carrier: response.carrier,
        status: response.status,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to track shipment', {
        trackingCode,
        carrier,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        `Failed to track shipment with code ${trackingCode}`,
        'TRACKING_FAILED',
        { trackingCode, carrier, originalError: error }
      );
    }
  }

  /**
   * Validate and verify an address
   */
  async validateAddress(request: AddressValidationRequest): Promise<EasyPostAddress> {
    const startTime = Date.now();
    
    try {
      logger.info('Validating address', {
        city: request.city,
        state: request.state,
        country: request.country
      });

      const addressData = {
        ...this.formatAddress(request),
        verify_strict: true // Use strict validation
      };

      const response = await this.client.post<EasyPostAddress>('/addresses', addressData);
      
      const duration = Date.now() - startTime;
      const isValid = response.verifications?.delivery?.success || false;
      
      logger.info('Address validation completed', {
        city: request.city,
        state: request.state,
        isValid,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to validate address', {
        city: request.city,
        state: request.state,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        'Failed to validate address',
        'ADDRESS_VALIDATION_FAILED',
        { address: request, originalError: error }
      );
    }
  }

  /**
   * Get SmartRate time-in-transit estimates
   */
  async getSmartrateEstimates(request: SmartrateRequest): Promise<unknown> {
    const startTime = Date.now();
    
    try {
      logger.info('Getting SmartRate estimates', {
        from_zip: request.from_zip,
        to_zip: request.to_zip,
        carriers: request.carriers
      });

      const smartrateData = {
        from_zip: request.from_zip,
        to_zip: request.to_zip,
        carriers: request.carriers || ['USPS', 'UPS', 'FedEx']
      };

      const response = await this.client.post('/smartrate/deliver_by', smartrateData);
      
      const duration = Date.now() - startTime;
      logger.info('SmartRate estimates retrieved', {
        from_zip: request.from_zip,
        to_zip: request.to_zip,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get SmartRate estimates', {
        from_zip: request.from_zip,
        to_zip: request.to_zip,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        'Failed to get SmartRate estimates',
        'SMARTRATE_FAILED',
        { request, originalError: error }
      );
    }
  }

  /**
   * Get current account information
   */
  async getAccount(): Promise<EasyPostAccount> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching account information');

      const response = await this.client.get<EasyPostAccount>('/account');
      
      const duration = Date.now() - startTime;
      logger.debug('Account information retrieved', {
        accountId: response.id,
        balance: response.balance,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get account information', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        'Failed to get account information',
        'ACCOUNT_FETCH_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get available carriers
   */
  async getCarriers(): Promise<EasyPostCarrier[]> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching available carriers');

      const response = await this.client.get<EasyPostCarrier[]>('/carrier_types');
      
      const duration = Date.now() - startTime;
      logger.debug('Carriers retrieved', {
        carrierCount: Array.isArray(response) ? response.length : 0,
        duration
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get carriers', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        'Failed to get carriers',
        'CARRIERS_FETCH_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipment(shipmentId: string): Promise<EasyPostShipment> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching shipment', { shipmentId });

      const response = await this.client.get<EasyPostShipment>(`/shipments/${shipmentId}`);
      
      const duration = Date.now() - startTime;
      logger.debug('Shipment retrieved', {
        shipmentId,
        status: response.status,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get shipment', {
        shipmentId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        `Failed to get shipment ${shipmentId}`,
        'SHIPMENT_FETCH_FAILED',
        { shipmentId, originalError: error }
      );
    }
  }

  /**
   * Refund a shipment
   */
  async refundShipment(shipmentId: string): Promise<EasyPostShipment> {
    const startTime = Date.now();
    
    try {
      logger.info('Refunding shipment', { shipmentId });

      const response = await this.client.post<EasyPostShipment>(
        `/shipments/${shipmentId}/refund`
      );
      
      const duration = Date.now() - startTime;
      logger.info('Shipment refunded', {
        shipmentId,
        refundStatus: response.refund_status,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to refund shipment', {
        shipmentId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new EasyPostError(
        `Failed to refund shipment ${shipmentId}`,
        'SHIPMENT_REFUND_FAILED',
        { shipmentId, originalError: error }
      );
    }
  }

  /**
   * Buy insurance for a shipment
   */
  async buyInsurance(shipmentId: string, amount: string): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Purchasing insurance', { shipmentId, amount });

      const response = await this.client.post(`/shipments/${shipmentId}/insure`, {
        amount
      });

      const duration = Date.now() - startTime;
      logger.info('Insurance purchased', { shipmentId, amount, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to purchase insurance', {
        shipmentId,
        amount,
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        `Failed to purchase insurance for shipment ${shipmentId}`,
        'INSURANCE_PURCHASE_FAILED',
        { shipmentId, amount, originalError: error }
      );
    }
  }

  /**
   * Create a batch for bulk operations
   */
  async createBatch(): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Creating batch');

      const response = await this.client.post('/batches', {}) as any;

      const duration = Date.now() - startTime;
      logger.info('Batch created', { batchId: response.id, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create batch', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        'Failed to create batch',
        'BATCH_CREATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Add shipments to a batch
   */
  async addShipmentsToBatch(batchId: string, shipmentIds: string[]): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Adding shipments to batch', { batchId, shipmentCount: shipmentIds.length });

      const response = await this.client.post(`/batches/${batchId}/add_shipments`, {
        shipments: shipmentIds.map(id => ({ id }))
      });

      const duration = Date.now() - startTime;
      logger.info('Shipments added to batch', { batchId, shipmentCount: shipmentIds.length, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to add shipments to batch', {
        batchId,
        shipmentCount: shipmentIds.length,
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        `Failed to add shipments to batch ${batchId}`,
        'BATCH_ADD_SHIPMENTS_FAILED',
        { batchId, shipmentIds, originalError: error }
      );
    }
  }

  /**
   * Buy all shipments in a batch
   */
  async buyBatch(batchId: string): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Buying batch', { batchId });

      const response = await this.client.post(`/batches/${batchId}/buy`);

      const duration = Date.now() - startTime;
      logger.info('Batch purchased', { batchId, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to buy batch', {
        batchId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        `Failed to buy batch ${batchId}`,
        'BATCH_BUY_FAILED',
        { batchId, originalError: error }
      );
    }
  }

  /**
   * Create SCAN form for shipments
   */
  async createScanForm(shipmentIds: string[]): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Creating SCAN form', { shipmentCount: shipmentIds.length });

      const response = await this.client.post('/scan_forms', {
        shipments: shipmentIds.map(id => ({ id }))
      }) as any;

      const duration = Date.now() - startTime;
      logger.info('SCAN form created', { scanFormId: response.id, shipmentCount: shipmentIds.length, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create SCAN form', {
        shipmentCount: shipmentIds.length,
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        'Failed to create SCAN form',
        'SCAN_FORM_CREATION_FAILED',
        { shipmentIds, originalError: error }
      );
    }
  }

  /**
   * Get customs information
   */
  async getCustomsInfo(customsInfoId: string): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Getting customs info', { customsInfoId });

      const response = await this.client.get(`/customs_infos/${customsInfoId}`);

      const duration = Date.now() - startTime;
      logger.info('Customs info retrieved', { customsInfoId, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get customs info', {
        customsInfoId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        `Failed to get customs info ${customsInfoId}`,
        'CUSTOMS_INFO_FETCH_FAILED',
        { customsInfoId, originalError: error }
      );
    }
  }

  /**
   * Create customs information
   */
  async createCustomsInfo(customsData: any): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Creating customs info');

      const response = await this.client.post('/customs_infos', customsData) as any;

      const duration = Date.now() - startTime;
      logger.info('Customs info created', { customsInfoId: response.id, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create customs info', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        'Failed to create customs info',
        'CUSTOMS_INFO_CREATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Advanced address verification
   */
  async verifyAddress(addressData: any): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info('Verifying address');

      const response = await this.client.post('/addresses', addressData) as any;

      const duration = Date.now() - startTime;
      logger.info('Address verified', { addressId: response.id, duration });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to verify address', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      throw new EasyPostError(
        'Failed to verify address',
        'ADDRESS_VERIFICATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Utility methods for formatting data
   */

  private formatAddress(address: Partial<EasyPostAddress>): Record<string, unknown> {
    return {
      name: address.name || undefined,
      company: address.company || undefined,
      street1: address.street1,
      street2: address.street2 || undefined,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country || 'US',
      phone: address.phone || undefined,
      email: address.email || undefined,
      residential: address.residential || undefined
    };
  }

  private formatParcel(parcel: {
    length: number;
    width: number;
    height: number;
    weight: number;
    predefined_package?: string | undefined;
  }): Record<string, unknown> {
    const result: Record<string, unknown> = {
      length: parcel.length,
      width: parcel.width,
      height: parcel.height,
      weight: parcel.weight
    };

    if (parcel.predefined_package !== undefined) {
      result['predefined_package'] = parcel.predefined_package;
    }

    return result;
  }

  private formatCustomsInfo(customsInfo: {
    contents_type: string;
    contents_explanation?: string | undefined;
    customs_certify: boolean;
    customs_signer: string;
    non_delivery_option: string;
    restriction_type?: string | undefined;
    restriction_comments?: string | undefined;
    customs_items: Array<{
      description: string;
      quantity: number;
      weight: number;
      value: number;
      hs_tariff_number?: string | undefined;
      origin_country: string;
    }>;
  }): Record<string, unknown> {
    const result: Record<string, unknown> = {
      contents_type: customsInfo.contents_type,
      customs_certify: customsInfo.customs_certify,
      customs_signer: customsInfo.customs_signer,
      non_delivery_option: customsInfo.non_delivery_option,
      customs_items: customsInfo.customs_items.map(item => {
        const customsItem: Record<string, unknown> = {
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          value: item.value.toString(), // EasyPost expects string
          origin_country: item.origin_country
        };

        if (item.hs_tariff_number !== undefined) {
          customsItem['hs_tariff_number'] = item.hs_tariff_number;
        }

        return customsItem;
      })
    };

    if (customsInfo.contents_explanation !== undefined) {
      result['contents_explanation'] = customsInfo.contents_explanation;
    }

    if (customsInfo.restriction_type !== undefined) {
      result['restriction_type'] = customsInfo.restriction_type;
    }

    if (customsInfo.restriction_comments !== undefined) {
      result['restriction_comments'] = customsInfo.restriction_comments;
    }

    return result;
  }
}