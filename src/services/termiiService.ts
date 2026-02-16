import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase.config';

interface SMSRequest {
    to: string;
    message: string;
}

interface SMSResponse {
    success: boolean;
    data?: any;
    error?: string;
}

class TermiiService {
    private functions = getFunctions(app);

    /**
     * Send SMS via Termii (Cloud Function)
     * @param to Phone number in international format (e.g., 2348000000000)
     * @param message Message content
     */
    async sendSMS(to: string, message: string): Promise<SMSResponse> {
        try {
            // Format phone number: remove '+' if present
            let formattedTo = to.replace('+', '');

            // Basic formatting for Nigerian numbers if missing prefix (assuming 080... -> 23480...)
            if (formattedTo.startsWith('0') && formattedTo.length === 11) {
                formattedTo = '234' + formattedTo.substring(1);
            }

            console.log(`Sending SMS to ${formattedTo}: ${message}`);

            const sendTermiiSms = httpsCallable<SMSRequest, SMSResponse>(this.functions, 'sendTermiiSms');

            const result = await sendTermiiSms({
                to: formattedTo,
                message,
            });

            const data = result.data;

            if (data.success === false) {
                throw new Error(data.error || 'Failed to send SMS');
            }

            return { success: true, data: data.data };

        } catch (error: any) {
            console.error('Termii Service Error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS'
            };
        }
    }

    /**
     * Send Welcome SMS
     */
    async sendWelcomeSMS(phone: string, name: string): Promise<SMSResponse> {
        const firstName = name.split(' ')[0];
        const message = `Welcome to NIMEX, ${firstName}! Your marketer account has been created. Log in to start earning commissions.`;
        return this.sendSMS(phone, message);
    }
}

export const termiiService = new TermiiService();
