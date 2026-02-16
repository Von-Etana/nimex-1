import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../contexts/ToastContext';

export const AdminSettingsDetailScreen: React.FC = () => {
    const { section } = useParams<{ section: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast.success('Settings saved successfully');
    };

    const renderContent = () => {
        switch (section) {
            case 'security':
                return <SecuritySettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'database':
                return <DatabaseSettings />;
            case 'api-keys':
                return <ApiKeysSettings />;
            case 'platform':
                return <PlatformSettings />;
            case 'regional':
                return <RegionalSettings />;
            default:
                return <div>Section not found</div>;
        }
    };

    const getTitle = () => {
        switch (section) {
            case 'security': return 'Security Settings';
            case 'notifications': return 'Notification Settings';
            case 'database': return 'Database Management';
            case 'api-keys': return 'API Keys';
            case 'platform': return 'Platform Configuration';
            case 'regional': return 'Regional Settings';
            default: return 'Settings';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/settings')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-heading font-bold text-2xl text-neutral-900">{getTitle()}</h1>
                        <p className="font-sans text-neutral-600 text-sm">Manage your platform parameters</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <form onSubmit={handleSave}>
                {renderContent()}
            </form>
        </div>
    );
};

const SecuritySettings = () => (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>Configure user access and security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Two-Factor Authentication (2FA)</Label>
                        <p className="text-sm text-neutral-500">Require 2FA for all admin accounts</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Strong Password Policy</Label>
                        <p className="text-sm text-neutral-500">Enforce complex password requirements</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="grid gap-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" defaultValue="30" className="max-w-[200px]" />
                </div>
            </CardContent>
        </Card>
    </div>
);

const NotificationSettings = () => (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Manage automated email alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Order Confirmations</Label>
                        <p className="text-sm text-neutral-500">Send emails on new orders</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Low Stock Alerts</Label>
                        <p className="text-sm text-neutral-500">Notify when inventory is low</p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>New User Signups</Label>
                        <p className="text-sm text-neutral-500">Notify admins on new registrations</p>
                    </div>
                    <Switch />
                </div>
            </CardContent>
        </Card>
    </div>
);

const DatabaseSettings = () => (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Maintenance</CardTitle>
                <CardDescription>System backup and cleanup operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-medium">Automatic Backups</h4>
                        <p className="text-sm text-neutral-500">Daily incremental backups at 00:00 UTC</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-medium">Clear Cache</h4>
                        <p className="text-sm text-neutral-500">Clear system temporary files</p>
                    </div>
                    <Button variant="destructive" type="button">Clear Now</Button>
                </div>
            </CardContent>
        </Card>
    </div>
);

const ApiKeysSettings = () => {
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    const toggleKey = (key: string) => {
        setShowKey(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Payment Gateways</CardTitle>
                    <CardDescription>Manage API keys for payment providers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Paystack Public Key</Label>
                        <div className="relative">
                            <Input
                                type={showKey['paystack_pk'] ? "text" : "password"}
                                defaultValue="pk_test_xxxxxxxxxxxxxxxx"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                onClick={() => toggleKey('paystack_pk')}
                            >
                                {showKey['paystack_pk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Paystack Secret Key</Label>
                        <div className="relative">
                            <Input
                                type={showKey['paystack_sk'] ? "text" : "password"}
                                defaultValue="sk_test_xxxxxxxxxxxxxxxx"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                onClick={() => toggleKey('paystack_sk')}
                            >
                                {showKey['paystack_sk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Logistics</CardTitle>
                    <CardDescription>GIG Logistics Integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>GIGL Client ID</Label>
                        <Input type="text" defaultValue="nimex_gigl_client" />
                    </div>
                    <div className="grid gap-2">
                        <Label>GIGL Client Secret</Label>
                        <Input type="password" defaultValue="****************" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


const PlatformSettings = () => (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Fees & Commissions</CardTitle>
                <CardDescription>Global platform financial settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Default Commission Rate (%)</Label>
                    <Input type="number" defaultValue="5.0" step="0.1" />
                </div>
                <div className="grid gap-2">
                    <Label>Minimum Withdrawal Amount (₦)</Label>
                    <Input type="number" defaultValue="1000" />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Enable Escrow Service</Label>
                        <p className="text-sm text-neutral-500">Hold funds until delivery confirmation</p>
                    </div>
                    <Switch defaultChecked />
                </div>
            </CardContent>
        </Card>
    </div>
);

const RegionalSettings = () => (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Localization</CardTitle>
                <CardDescription>Region specific configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Default Currency</Label>
                    <select className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="NGN">Nigerian Naira (₦)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="GBP">British Pound (£)</option>
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label>Timezone</Label>
                    <select className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="Africa/Lagos">West Africa Time (Lagos)</option>
                        <option value="UTC">UTC</option>
                    </select>
                </div>
            </CardContent>
        </Card>
    </div>
);
