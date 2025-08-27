"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeformService = exports.TypeformService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("../config/env.config");
class TypeformService {
    constructor() {
        this.baseUrl = env_config_1.envConfig.typeform.baseUrl;
        this.token = env_config_1.envConfig.typeform.personalAccessToken;
        this.formId = env_config_1.envConfig.typeform.formId;
        this.webhookSecret = env_config_1.envConfig.typeform.webhookSecret;
        if (!this.token || !this.formId) {
            throw new Error('Typeform configuration is incomplete. Please check your environment variables.');
        }
    }
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
    /**
     * Verify webhook signature to ensure request authenticity
     */
    verifyWebhookSignature(payload, signature) {
        if (!this.webhookSecret) {
            console.warn('Webhook secret not configured, skipping signature verification');
            return true;
        }
        const expectedSignature = crypto_1.default
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('base64');
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expectedSignature}`));
    }
    /**
     * Retrieve a specific response by token
     */
    async getResponse(responseToken) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/forms/${this.formId}/responses`, {
                headers: this.getHeaders(),
                params: {
                    included_response_ids: responseToken,
                    page_size: 1
                }
            });
            if (response.data.items.length > 0) {
                return response.data.items[0];
            }
            return null;
        }
        catch (error) {
            console.error('Error fetching Typeform response:', error);
            throw new Error('Failed to fetch response from Typeform');
        }
    }
    /**
     * Retrieve all responses for the form with pagination
     */
    async getAllResponses(options = {}) {
        try {
            const params = {
                page_size: options.pageSize || 1000,
                completed: options.completed !== undefined ? options.completed : true
            };
            if (options.since)
                params.since = options.since;
            if (options.until)
                params.until = options.until;
            const response = await axios_1.default.get(`${this.baseUrl}/forms/${this.formId}/responses`, {
                headers: this.getHeaders(),
                params
            });
            return response.data.items;
        }
        catch (error) {
            console.error('Error fetching all Typeform responses:', error);
            throw new Error('Failed to fetch responses from Typeform');
        }
    }
    /**
     * Get form information
     */
    async getFormInfo() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/forms/${this.formId}`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching form info:', error);
            throw new Error('Failed to fetch form information');
        }
    }
    /**
     * Create a webhook for the form
     */
    async createWebhook(webhookUrl, enabled = true) {
        try {
            const response = await axios_1.default.put(`${this.baseUrl}/forms/${this.formId}/webhooks/webhook-tag`, {
                url: webhookUrl,
                enabled
            }, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating webhook:', error);
            throw new Error('Failed to create webhook');
        }
    }
    /**
     * Delete webhook
     */
    async deleteWebhook() {
        try {
            await axios_1.default.delete(`${this.baseUrl}/forms/${this.formId}/webhooks/webhook-tag`, {
                headers: this.getHeaders()
            });
        }
        catch (error) {
            console.error('Error deleting webhook:', error);
            throw new Error('Failed to delete webhook');
        }
    }
    /**
     * Get webhook information
     */
    async getWebhook() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/forms/${this.formId}/webhooks/webhook-tag`, {
                headers: this.getHeaders()
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                return null; // Webhook doesn't exist
            }
            console.error('Error fetching webhook:', error);
            throw new Error('Failed to fetch webhook information');
        }
    }
    /**
     * Parse personality test results from Typeform response
     */
    parsePersonalityTestResults(formResponse) {
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
    extractAnswerValue(answer) {
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
exports.TypeformService = TypeformService;
exports.typeformService = new TypeformService();
//# sourceMappingURL=typeform.service.js.map