import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';

export const AdminLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-neutral-50">
            <AdminHeader />
            <main>
                <Outlet />
            </main>
            <footer className="w-full bg-white border-t border-neutral-200 mt-12">
                <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-700 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="font-sans text-sm text-neutral-600">
                                © 2024 NIMEX Vendor Platform. All rights reserved.
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a
                                href="#"
                                className="font-sans text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                            >
                                Admin Links
                            </a>
                            <a
                                href="#"
                                className="font-sans text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                            >
                                System
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
