import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Settings, Shield, Bell, Database, Key, Globe } from 'lucide-react';

export const AdminSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-2xl text-neutral-900 mb-2">
            Platform Settings
          </h1>
          <p className="font-sans text-neutral-600">
            Manage platform configuration and system settings
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/settings/security')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">
                    Security Settings
                  </h3>
                  <p className="font-sans text-sm text-neutral-600 mb-3">
                    Configure authentication, password policies, and security features
                  </p>
                  <button className="font-sans text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Configure →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/settings/notifications')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">
                    Notifications
                  </h3>
                  <p className="font-sans text-sm text-neutral-600 mb-3">
                    Manage email notifications and alert preferences
                  </p>
                  <button className="font-sans text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Configure →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/settings/database')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">
                    Database
                  </h3>
                  <p className="font-sans text-sm text-neutral-600 mb-3">
                    Database backup, maintenance, and optimization
                  </p>
                  <button className="font-sans text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Manage →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/settings/api-keys')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Key className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">
                    API Keys
                  </h3>
                  <p className="font-sans text-sm text-neutral-600 mb-3">
                    Manage API keys for Paystack, Flutterwave, and GIGL
                  </p>
                  <button className="font-sans text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Manage →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/settings/platform')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">
                    Platform Configuration
                  </h3>
                  <p className="font-sans text-sm text-neutral-600 mb-3">
                    Commission rates, fees, and platform parameters
                  </p>
                  <button className="font-sans text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Configure →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/admin/settings/regional')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">
                    Regional Settings
                  </h3>
                  <p className="font-sans text-sm text-neutral-600 mb-3">
                    Markets, locations, currency, and language settings
                  </p>
                  <button className="font-sans text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Configure →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 border-neutral-200">
          <CardContent className="p-6">
            <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
              System Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="font-sans text-sm text-neutral-600">Platform Version</span>
                <span className="font-sans text-sm font-medium text-neutral-900">v1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="font-sans text-sm text-neutral-600">Database Status</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="font-sans text-sm text-neutral-600">Last Backup</span>
                <span className="font-sans text-sm font-medium text-neutral-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-sans text-sm text-neutral-600">API Status</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                  Operational
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
