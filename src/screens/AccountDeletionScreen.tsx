import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { ShieldAlert, Mail, UserMinus } from 'lucide-react';

export const AccountDeletionScreen: React.FC = () => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full bg-gradient-to-r from-red-600 to-red-700 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mb-4">
            Account & Data Deletion
          </h1>
          <p className="font-sans text-white text-lg opacity-90">
            How to request deletion of your NIMEX account or specific data
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12">
        <Card className="border border-neutral-200 shadow-sm mb-8">
          <CardContent className="p-8 md:p-12">
            <div className="font-sans text-neutral-700 text-base leading-relaxed space-y-4">
              <p>
                At NIMEX, we respect your right to privacy and your right to be forgotten. If you wish to delete your account and all associated data, you have two options:
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserMinus className="w-6 h-6 text-neutral-700" />
                </div>
                <h2 className="font-heading font-bold text-neutral-900 text-xl mt-2">
                  Option 1: Inside the App
                </h2>
              </div>
              <ol className="list-decimal pl-5 space-y-2 font-sans text-neutral-700 text-sm leading-relaxed">
                <li>Open the NIMEX mobile app</li>
                <li>Go to the <strong>Profile</strong> tab</li>
                <li>Scroll down and select <strong>Settings</strong></li>
                <li>Tap on <strong>Delete Account</strong></li>
                <li>Confirm your decision</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-neutral-700" />
                </div>
                <h2 className="font-heading font-bold text-neutral-900 text-xl mt-2">
                  Option 2: Via Email
                </h2>
              </div>
              <p className="font-sans text-neutral-700 text-sm leading-relaxed mb-4">
                Send us an email from the address associated with your NIMEX account requesting full account deletion, or specifying which data you want deleted without deleting your account.
              </p>
              <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                <p className="font-sans text-neutral-900 font-medium">To: privacy@nimex.ng</p>
                <p className="font-sans text-neutral-900 font-medium">Subject: Account or Data Deletion Request</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-heading font-bold text-neutral-900 text-xl mb-2">
                  What happens when I delete my account?
                </h3>
                <ul className="space-y-2 font-sans text-neutral-700 text-sm leading-relaxed">
                  <li>• Your profile and personal information will be permanently deleted.</li>
                  <li>• Your order history and saved items will be erased.</li>
                  <li>• Financial records related to completed transactions will be retained solely for legal and tax compliance purposes.</li>
                  <li>• This action <strong>cannot be undone</strong>.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
