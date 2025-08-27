"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebhook = exports.getWebhookStatus = exports.syncTypeformResponses = exports.handleTypeformWebhook = exports.getPersonalityTestStatus = exports.submitPersonalityTest = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userprof_model_1 = __importDefault(require("../models/userprof.model"));
const typeform_service_1 = require("../services/typeform.service");
const submitPersonalityTest = async (req, res) => {
    try {
        const { responses, typeformResponseId, testScore, personalityType } = req.body;
        if (!responses) {
            return res.status(400).json({ error: 'Test responses are required' });
        }
        if (req.user.personalityTestCompleted) {
            return res.status(400).json({
                error: 'Personality test already completed',
                message: 'You have already completed the personality test'
            });
        }
        // Verify the response with Typeform if responseId is provided
        let verifiedResponse = null;
        if (typeformResponseId) {
            try {
                verifiedResponse = await typeform_service_1.typeformService.getResponse(typeformResponseId);
                if (!verifiedResponse) {
                    return res.status(400).json({ error: 'Invalid Typeform response ID' });
                }
            }
            catch (error) {
                console.error('Error verifying Typeform response:', error);
                // Continue without verification if API call fails
            }
        }
        const personalityTestData = {
            responses,
            typeformResponseId: typeformResponseId || null,
            testScore: testScore || verifiedResponse?.calculated?.score || null,
            personalityType: personalityType || null,
            completedAt: new Date(),
            version: '1.0',
            verifiedResponse: verifiedResponse ? true : false
        };
        const user = await userprof_model_1.default.findByIdAndUpdate(req.user._id, {
            personalityTestCompleted: true,
            personalityTestData
        }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            message: 'Personality test submitted successfully',
            data: {
                personalityTestCompleted: user.personalityTestCompleted,
                testCompletedAt: personalityTestData.completedAt,
                personalityType: personalityType || null,
                verified: personalityTestData.verifiedResponse
            }
        });
    }
    catch (error) {
        console.error('Personality test submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitPersonalityTest = submitPersonalityTest;
const getPersonalityTestStatus = async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            data: {
                personalityTestCompleted: user.personalityTestCompleted,
                testData: user.personalityTestCompleted ? user.personalityTestData : null
            }
        });
    }
    catch (error) {
        console.error('Personality test status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getPersonalityTestStatus = getPersonalityTestStatus;
// Typeform webhook handler with signature verification
const handleTypeformWebhook = async (req, res) => {
    try {
        const payload = JSON.stringify(req.body);
        const signature = req.headers['typeform-signature'];
        // Verify webhook signature if secret is configured
        if (signature && !typeform_service_1.typeformService.verifyWebhookSignature(payload, signature)) {
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }
        const { form_response } = req.body;
        if (!form_response) {
            return res.status(400).json({ error: 'No form response data' });
        }
        const { hidden, answers, response_id, submitted_at } = form_response;
        const userId = hidden?.user_id;
        // Handle test webhook (from setup script)
        if (userId === 'TEST_USER_ID') {
            console.log('✅ Test webhook received successfully!');
            console.log('Form Response:', {
                formId: form_response.form_id,
                token: form_response.token,
                submittedAt: form_response.submitted_at,
                answersCount: answers?.length || 0
            });
            return res.status(200).json({
                message: 'Test webhook received successfully',
                status: 'success'
            });
        }
        // Validate user ID format for real webhooks
        if (!userId) {
            return res.status(400).json({ error: 'User ID not provided in hidden fields' });
        }
        // Check if userId is a valid MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            console.error('Invalid user ID format:', userId);
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        // Process the personality test completion
        const parsedResults = typeform_service_1.typeformService.parsePersonalityTestResults(form_response);
        // Find and update the user
        const user = await userprof_model_1.default.findByIdAndUpdate(userId, {
            personalityTestCompleted: true,
            personalityTestData: {
                responses: parsedResults.answers,
                typeformResponseId: form_response.token,
                score: parsedResults.score,
                completedAt: new Date(form_response.submitted_at),
                rawData: form_response // Store the complete response for reference
            }
        }, { new: true });
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('✅ Personality test completed for user:', user.firstName, user.lastName);
        res.status(200).json({
            message: 'Personality test data processed successfully',
            userId: user._id,
            completed: true
        });
    }
    catch (error) {
        console.error('Typeform webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.handleTypeformWebhook = handleTypeformWebhook;
// Admin endpoint to sync responses from Typeform
const syncTypeformResponses = async (req, res) => {
    try {
        const { since, until } = req.query;
        const responses = await typeform_service_1.typeformService.getAllResponses({
            since: since,
            until: until,
            completed: true
        });
        let processed = 0;
        let errors = 0;
        for (const response of responses) {
            try {
                const testResults = typeform_service_1.typeformService.parsePersonalityTestResults(response);
                const userId = testResults.userId;
                if (!userId) {
                    console.warn(`No user ID found in response ${response.token}`);
                    continue;
                }
                const user = await userprof_model_1.default.findById(userId);
                if (!user) {
                    console.warn(`User not found: ${userId}`);
                    errors++;
                    continue;
                }
                // Only update if not already completed
                if (!user.personalityTestCompleted) {
                    await userprof_model_1.default.findByIdAndUpdate(userId, {
                        personalityTestCompleted: true,
                        personalityTestData: {
                            responses: testResults.answers,
                            typeformResponseId: testResults.responseToken,
                            testScore: testResults.score || null,
                            personalityType: null,
                            completedAt: new Date(testResults.submittedAt),
                            version: '1.0',
                            verifiedResponse: true,
                            syncedAt: new Date(),
                            landedAt: testResults.landedAt,
                            userInfo: testResults.userInfo
                        }
                    });
                    processed++;
                }
            }
            catch (error) {
                console.error(`Error processing response ${response.token}:`, error);
                errors++;
            }
        }
        res.json({
            success: true,
            message: 'Sync completed',
            data: {
                totalResponses: responses.length,
                processed,
                errors
            }
        });
    }
    catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to sync responses' });
    }
};
exports.syncTypeformResponses = syncTypeformResponses;
// Get Typeform webhook status
const getWebhookStatus = async (req, res) => {
    try {
        const webhook = await typeform_service_1.typeformService.getWebhook();
        res.json({
            success: true,
            data: webhook
        });
    }
    catch (error) {
        console.error('Webhook status error:', error);
        res.status(500).json({ error: 'Failed to get webhook status' });
    }
};
exports.getWebhookStatus = getWebhookStatus;
// Setup webhook
const setupWebhook = async (req, res) => {
    try {
        const { webhookUrl } = req.body;
        if (!webhookUrl) {
            return res.status(400).json({ error: 'Webhook URL is required' });
        }
        const webhook = await typeform_service_1.typeformService.createWebhook(webhookUrl, true);
        res.json({
            success: true,
            message: 'Webhook created successfully',
            data: webhook
        });
    }
    catch (error) {
        console.error('Webhook setup error:', error);
        res.status(500).json({ error: 'Failed to setup webhook' });
    }
};
exports.setupWebhook = setupWebhook;
//# sourceMappingURL=personalitytest.controller.js.map