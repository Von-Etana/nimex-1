import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit2, Save, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const ProfileScreen: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(formData);
    if (error) {
      alert('Failed to update profile: ' + error.message);
    } else {
      setEditing(false);
    }
    setSaving(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-8">
          My Profile
        </h1>

        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-lg text-neutral-900">
                  Personal Information
                </h2>
                {!editing ? (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          full_name: profile?.full_name || '',
                          phone: profile?.phone || '',
                          location: profile?.location || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 font-sans text-sm font-medium text-neutral-700 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="font-sans text-neutral-900">{profile?.full_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 font-sans text-sm font-medium text-neutral-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <p className="font-sans text-neutral-900">{user.email}</p>
                  <p className="font-sans text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 font-sans text-sm font-medium text-neutral-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+234 801 234 5678"
                    />
                  ) : (
                    <p className="font-sans text-neutral-900">{profile?.phone || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 font-sans text-sm font-medium text-neutral-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Lagos, Nigeria"
                    />
                  ) : (
                    <p className="font-sans text-neutral-900">{profile?.location || 'Not set'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
                Account Type
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans font-semibold text-neutral-900 capitalize">
                    {profile?.role || 'Buyer'}
                  </p>
                  <p className="font-sans text-sm text-neutral-600 mt-1">
                    {profile?.role === 'vendor' ? 'You can sell products on NIMEX' : 'You can buy products on NIMEX'}
                  </p>
                </div>
                {profile?.role === 'buyer' && (
                  <Button onClick={() => navigate('/signup?type=vendor')} variant="outline">
                    Become a Vendor
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
