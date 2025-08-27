import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { envConfig } from '../config/env.config';

interface TypeformResponse {
  event_id: string;
  event_type: string;
  form_response: {
    form_id: string;
    token: string;
    submitted_at: string;
    landed_at: string;
    calculated?: {
      score: number;
    };
    hidden?: {
      user_id?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone_number?: string;
    };
    answers: Array<{
      field: {
        id: string;
        type: string;
        ref: string;
      };
      type: string;
      text?: string;
      choice?: {
        label: string;
        other?: string;
      };
      choices?: {
        labels: string[];
        other?: string;
      };
      number?: number;
      boolean?: boolean;
      date?: string;
      email?: string;
      url?: string;
      file_url?: string;
      payment?: any;
    }>;
  };
}

interface TypeformApiResponse {
  total_items: number;
  page_count: number;
  items: TypeformResponse['form_response'][];
}

export class TypeformService {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly formId: string;
  private readonly webhookSecret: string;

  constructor() {
    this.baseUrl = envConfig.typeform.baseUrl;
    this.token = envConfig.typeform.personalAccessToken!;
    this.formId = envConfig.typeform.formId!;
    this.webhookSecret = envConfig.typeform.webhookSecret!;

    if (!this.token || !this.formId) {
      throw new Error('Typeform configuration is incomplete. Please check your environment variables.');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Verify webhook signature to ensure request authenticity
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  }

  /**
   * Retrieve a specific response by token
   */
  async getResponse(responseToken: string): Promise<TypeformResponse['form_response'] | null> {
    try {
      const response: AxiosResponse<TypeformApiResponse> = await axios.get(
        `${this.baseUrl}/forms/${this.formId}/responses`,
        {
          headers: this.getHeaders(),
          params: {
            included_response_ids: responseToken,
            page_size: 1
          }
        }
      );

      if (response.data.items.length > 0) {
        return response.data.items[0];
      }

      return null;
    } catch (error) {
      console.error('Error fetching Typeform response:', error);
      throw new Error('Failed to fetch response from Typeform');
    }
  }

  /**
   * Retrieve all responses for the form with pagination
   */
  async getAllResponses(options: {
    pageSize?: number;
    since?: string;
    until?: string;
    completed?: boolean;
  } = {}): Promise<TypeformResponse['form_response'][]> {
    try {
      const params: any = {
        page_size: options.pageSize || 1000,
        completed: options.completed !== undefined ? options.completed : true
      };

      if (options.since) params.since = options.since;
      if (options.until) params.until = options.until;

      const response: AxiosResponse<TypeformApiResponse> = await axios.get(
        `${this.baseUrl}/forms/${this.formId}/responses`,
        {
          headers: this.getHeaders(),
          params
        }
      );

      return response.data.items;
    } catch (error) {
      console.error('Error fetching all Typeform responses:', error);
      throw new Error('Failed to fetch responses from Typeform');
    }
  }

  /**
   * Get form information
   */
  async getFormInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/forms/${this.formId}`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching form info:', error);
      throw new Error('Failed to fetch form information');
    }
  }

  /**
   * Create a webhook for the form
   */
  async createWebhook(webhookUrl: string, enabled: boolean = true): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/forms/${this.formId}/webhooks/webhook-tag`,
        {
          url: webhookUrl,
          enabled
        },
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new Error('Failed to create webhook');
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/forms/${this.formId}/webhooks/webhook-tag`,
        {
          headers: this.getHeaders()
        }
      );
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw new Error('Failed to delete webhook');
    }
  }

  /**
   * Get webhook information
   */
  async getWebhook(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/forms/${this.formId}/webhooks/webhook-tag`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // Webhook doesn't exist
      }
      console.error('Error fetching webhook:', error);
      throw new Error('Failed to fetch webhook information');
    }
  }

  /**
   * Parse personality test results from Typeform response
   */
  parsePersonalityTestResults(formResponse: TypeformResponse['form_response']) {
    const results = {
      userId: formResponse.hidden?.user_id,
      userInfo: {
        firstName: formResponse.hidden?.first_name,
        lastName: formResponse.hidden?.last_name,
        email: formResponse.hidden?.email,
        phoneNumber: formResponse.hidden?.phone_number
      },
      submittedAt: formResponse.submitted_at,
      landedAt: formResponse.landed_at,
      responseToken: formResponse.token,
      score: formResponse.calculated?.score,
      answers: formResponse.answers.map(answer => ({
        fieldId: answer.field.id,
        fieldRef: answer.field.ref,
        fieldType: answer.field.type,
        answerType: answer.type,
        value: this.extractAnswerValue(answer)
      }))
    };

    return results;
  }

  private extractAnswerValue(answer: any): any {
    switch (answer.type) {
      case 'text':
        return answer.text;
      case 'choice':
        return answer.choice?.label;
      case 'choices':
        return answer.choices?.labels;
      case 'number':
        return answer.number;
      case 'boolean':
        return answer.boolean;
      case 'date':
        return answer.date;
      case 'email':
        return answer.email;
      case 'url':
        return answer.url;
      case 'file_url':
        return answer.file_url;
      default:
        return answer;
    }
  }
}

export const typeformService = new TypeformService();
