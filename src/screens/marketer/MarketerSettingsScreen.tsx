import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
    User,
    Mail,
    Phone,
    Building,
    Save,
    Loader2,
    CreditCard,
    Bell,
    Shield,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../lib/firebase.config';

interface MarketerProfile {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    business_name: string;
    bank_account_details: {
        bank_name?: string;
        account_number?: string;
        account_name?: string;
    } | null;
}

export const MarketerSettingsScreen: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<MarketerProfile | null>(null);

    // Expandable sections
    const [personalExpanded, setPersonalExpanded] = useState(true);
    const [bankExpanded, setBankExpanded] = useState(false);
    const [passwordExpanded, setPasswordExpanded] = useState(false);
    const [notificationsExpanded, setNotificationsExpanded] = useState(false);

    // Form data
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [businessName, setBusinessName] = useState('');

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [notifications, setNotifications] = useState({
        emailNewReferral: true,
        emailCommissionPaid: true,
        smsAlerts: false
    });

    useEffect(() => {
        if (user?.email) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            setLoading(true);

            const marketers = await FirestoreService.getDocuments<MarketerProfile>(
                COLLECTIONS.MARKETERS,
                {
                    filters: [{ field: 'email', operator: '==', value: user?.email }],
                    limitCount: 1
                }
            );

            if (marketers.length > 0) {
                const marketer = marketers[0];
                setProfile(marketer);
                setFullName(marketer.full_name || '');
                setPhone(marketer.phone || '');
                setBusinessName(marketer.business_name || '');

                if (marketer.bank_account_details) {
                    setBankName(marketer.bank_account_details.bank_name || '');
                    setAccountNumber(marketer.bank_account_details.account_number || '');
                    setAccountName(marketer.bank_account_details.account_name || '');
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePersonal = async () => {
        if (!profile) return;

        setSaving(true);
        try {
            await FirestoreService.updateDocument(COLLECTIONS.MARKETERS, profile.id, {
                full_name: fullName,
                phone: phone,
                business_name: businessName
            });
            alert('Personal information updated successfully!');
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBankDetails = async () => {
        if (!profile) return;

        setSaving(true);
        try {
            await FirestoreService.updateDocument(COLLECTIONS.MARKETERS, profile.id, {
                bank_account_details: {
                    bank_name: bankName,
                    account_number: accountNumber,
                    account_name: accountName
                }
            });
            alert('Bank details updated successfully!');
        } catch (error: any) {
            alert('Error updating bank details: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        if (!auth.currentUser) return;

        setSaving(true);
        try {
            await updatePassword(auth.currentUser, newPassword);
            setNewPassword('');
            setConfirmPassword('');
            alert('Password changed successfully!');
        } catch (error: any) {
            alert('Error changing password: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Settings</h1>
                    <p className="text-neutral-600">Manage your account settings</p>
                </div>

                <div className="space-y-4">
                    {/* Personal Information */}
                    <Card>
                        <button
                            onClick={() => setPersonalExpanded(!personalExpanded)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900">Personal Information</h3>
                                    <p className="text-sm text-neutral-600">Update your profile details</p>
                                </div>
                            </div>
                            {personalExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {personalExpanded && (
                            <CardContent className="p-4 pt-0 border-t border-neutral-200">
                                <div className="space-y-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Business Name</label>
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSavePersonal}
                                        disabled={saving}
                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Bank Details */}
                    <Card>
                        <button
                            onClick={() => setBankExpanded(!bankExpanded)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900">Bank Account</h3>
                                    <p className="text-sm text-neutral-600">Set up your payout account</p>
                                </div>
                            </div>
                            {bankExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {bankExpanded && (
                            <CardContent className="p-4 pt-0 border-t border-neutral-200">
                                <div className="space-y-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g., First Bank"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="1234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Account Name</label>
                                        <input
                                            type="text"
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSaveBankDetails}
                                        disabled={saving}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Bank Details
                                    </Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Change Password */}
                    <Card>
                        <button
                            onClick={() => setPasswordExpanded(!passwordExpanded)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900">Security</h3>
                                    <p className="text-sm text-neutral-600">Change your password</p>
                                </div>
                            </div>
                            {passwordExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {passwordExpanded && (
                            <CardContent className="p-4 pt-0 border-t border-neutral-200">
                                <div className="space-y-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="At least 6 characters"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full h-10 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Re-enter password"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={saving || !newPassword || !confirmPassword}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                                        Change Password
                                    </Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <button
                            onClick={() => setNotificationsExpanded(!notificationsExpanded)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900">Notifications</h3>
                                    <p className="text-sm text-neutral-600">Manage notification preferences</p>
                                </div>
                            </div>
                            {notificationsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {notificationsExpanded && (
                            <CardContent className="p-4 pt-0 border-t border-neutral-200">
                                <div className="space-y-4 mt-4">
                                    <label className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                                        <div>
                                            <p className="font-medium text-neutral-900">New Referral Email</p>
                                            <p className="text-sm text-neutral-600">Get notified when someone uses your link</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.emailNewReferral}
                                            onChange={(e) => setNotifications({ ...notifications, emailNewReferral: e.target.checked })}
                                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                                        <div>
                                            <p className="font-medium text-neutral-900">Commission Paid Email</p>
                                            <p className="text-sm text-neutral-600">Get notified when your commission is paid</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.emailCommissionPaid}
                                            onChange={(e) => setNotifications({ ...notifications, emailCommissionPaid: e.target.checked })}
                                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                                        <div>
                                            <p className="font-medium text-neutral-900">SMS Alerts</p>
                                            <p className="text-sm text-neutral-600">Receive important updates via SMS</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.smsAlerts}
                                            onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })}
                                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                        />
                                    </label>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
