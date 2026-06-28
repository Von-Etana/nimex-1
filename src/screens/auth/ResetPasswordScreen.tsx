import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PackageIcon, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { FirebaseAuthService } from '../../services/firebaseAuth.service';
import { getFriendlyErrorMessage } from '../../utils/errorHandling';

/**
 * Password strength validator — returns a list of unmet requirements.
 */
function getPasswordIssues(password: string): string[] {
    const issues: string[] = [];
    if (password.length < 8)             issues.push('At least 8 characters');
    if (!/[A-Z]/.test(password))         issues.push('One uppercase letter');
    if (!/[a-z]/.test(password))         issues.push('One lowercase letter');
    if (!/[0-9]/.test(password))         issues.push('One number');
    if (!/[^A-Za-z0-9]/.test(password))  issues.push('One special character');
    return issues;
}

export const ResetPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get('oobCode') ?? '';

    const [password, setPassword]       = useState('');
    const [confirm, setConfirm]         = useState('');
    const [showPw, setShowPw]           = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState(false);
    const [countdown, setCountdown]     = useState(5);

    // Auto-redirect to /login after success
    useEffect(() => {
        if (!success) return;
        if (countdown <= 0) { navigate('/login'); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [success, countdown, navigate]);

    const issues   = getPasswordIssues(password);
    const isStrong = issues.length === 0;
    const mismatch = confirm.length > 0 && password !== confirm;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!oobCode) {
            setError('Invalid or expired reset link. Please request a new one.');
            return;
        }
        if (!isStrong) {
            setError('Please meet all password requirements.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        const { error: resetError } = await FirebaseAuthService.confirmReset(oobCode, password);
        setLoading(false);

        if (resetError) {
            const code = (resetError as any)?.code;
            if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
                setError('This reset link has expired or already been used. Please request a new one.');
            } else {
                setError(getFriendlyErrorMessage(resetError));
            }
        } else {
            setSuccess(true);
        }
    };

    // ── Missing oobCode ─────────────────────────────────────────────────────
    if (!oobCode) {
        return (
            <div className="min-h-screen bg-white flex flex-col md:flex-row">
                <div className="md:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-8 md:p-12 flex flex-col justify-center items-center text-white">
                    <div className="max-w-md w-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                                <PackageIcon className="w-10 h-10 text-white" />
                            </div>
                            <span className="font-heading font-bold text-4xl">NIMEX</span>
                        </div>
                        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">Reset Your Password</h1>
                        <p className="font-sans text-lg opacity-90 leading-body">Something went wrong with your reset link.</p>
                    </div>
                </div>
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="max-w-md w-full mx-auto text-center">
                        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-error" />
                        </div>
                        <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-4">Invalid Link</h2>
                        <p className="font-sans text-neutral-600 mb-8">
                            Your password reset link is missing or invalid. This can happen if the link was already used or copied incorrectly.
                        </p>
                        <Link to="/forgot-password">
                            <Button className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg">
                                Request a New Reset Link
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Success state ───────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col md:flex-row">
                <div className="md:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-8 md:p-12 flex flex-col justify-center items-center text-white">
                    <div className="max-w-md w-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                                <PackageIcon className="w-10 h-10 text-white" />
                            </div>
                            <span className="font-heading font-bold text-4xl">NIMEX</span>
                        </div>
                        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">Password Updated!</h1>
                        <p className="font-sans text-lg opacity-90 leading-body">
                            Your password has been reset. You can now sign in with your new password.
                        </p>
                    </div>
                </div>
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="max-w-md w-full mx-auto text-center">
                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-success" />
                        </div>
                        <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-4">All Done!</h2>
                        <p className="font-sans text-neutral-600 mb-8">
                            Redirecting to sign in in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}…
                        </p>
                        <Link to="/login">
                            <Button className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg">
                                Sign In Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main form ───────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            {/* Left panel */}
            <div className="md:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-8 md:p-12 flex flex-col justify-center items-center text-white">
                <div className="max-w-md w-full">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                            <PackageIcon className="w-10 h-10 text-white" />
                        </div>
                        <span className="font-heading font-bold text-4xl">NIMEX</span>
                    </div>
                    <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">Create New Password</h1>
                    <p className="font-sans text-lg opacity-90 leading-body">
                        Choose a strong, unique password to keep your account secure.
                    </p>
                    <div className="mt-10 space-y-4">
                        {[
                            { icon: '🔒', title: 'At least 8 characters',     sub: 'Longer passwords are stronger' },
                            { icon: '🔡', title: 'Mix of letters & numbers',   sub: 'Upper, lower, digits + symbols' },
                            { icon: '✅', title: 'Unique password',            sub: "Don't reuse passwords from other sites" },
                        ].map(({ icon, title, sub }) => (
                            <div key={title} className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur flex-shrink-0">
                                    <span className="text-2xl">{icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-heading font-semibold text-base">{title}</h3>
                                    <p className="font-sans text-sm opacity-80">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-sans">Back</span>
                    </button>

                    <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-2">Reset Password</h2>
                    <p className="font-sans text-neutral-600 mb-8">Enter your new password below.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                            <p className="font-sans text-sm text-error">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label htmlFor="new-password" className="block font-sans font-medium text-neutral-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    id="new-password"
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className="w-full h-12 pl-12 pr-12 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Live strength checklist */}
                            {password.length > 0 && (
                                <ul className="mt-3 space-y-1">
                                    {[
                                        { label: 'At least 8 characters',   met: password.length >= 8 },
                                        { label: 'One uppercase letter',     met: /[A-Z]/.test(password) },
                                        { label: 'One lowercase letter',     met: /[a-z]/.test(password) },
                                        { label: 'One number',               met: /[0-9]/.test(password) },
                                        { label: 'One special character',    met: /[^A-Za-z0-9]/.test(password) },
                                    ].map(({ label, met }) => (
                                        <li key={label} className={`flex items-center gap-2 font-sans text-sm ${met ? 'text-success' : 'text-neutral-400'}`}>
                                            <span>{met ? '✓' : '○'}</span>
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirm-password" className="block font-sans font-medium text-neutral-700 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    id="confirm-password"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className={`w-full h-12 pl-12 pr-12 rounded-lg border font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                        mismatch ? 'border-error' : 'border-neutral-200'
                                    }`}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {mismatch && (
                                <p className="mt-1 font-sans text-sm text-error">Passwords do not match.</p>
                            )}
                        </div>

                        <Button
                            id="reset-password-submit"
                            type="submit"
                            disabled={loading || !isStrong || mismatch || !confirm}
                            className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
                        >
                            {loading ? 'Resetting Password…' : 'Reset Password'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="font-sans text-neutral-600">
                            Remember your password?{' '}
                            <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
