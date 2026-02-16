ALTER TABLE vendors ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"emailSales": true, "smsAlerts": false, "inAppUpdates": true}'::jsonb;
