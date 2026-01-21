'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Header() {
    const { state, logout } = useApp();
    const pathname = usePathname();

    const isLogistics = pathname === '/logistics';
    const isOperations = pathname === '/operations';
    const isAdmin = pathname === '/admin';

    return (
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] sticky top-0 z-40">
            <div className="container">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">🏥</span>
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            PMMT2026
                        </span>
                    </Link>

                    {/* Navigation - Main tabs only */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            href="/"
                            className={`nav-link ${!isLogistics && !isOperations && !isAdmin ? 'nav-link-active' : ''}`}
                        >
                            <span>👤</span>
                            <span>My Shifts</span>
                        </Link>
                        <Link
                            href="/logistics"
                            className={`nav-link ${isLogistics ? 'nav-link-active' : ''}`}
                        >
                            <span>📊</span>
                            <span>Dashboard</span>
                        </Link>
                    </nav>

                    {/* User Menu with subtle Admin link */}
                    <div className="flex items-center gap-3">
                        {state.currentUser && (
                            <>
                                <div className="hidden sm:block text-right">
                                    <div className="text-sm font-medium text-[var(--text-primary)]">
                                        {state.currentUser.name}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {state.currentUser.email}
                                    </div>
                                </div>

                                {/* Subtle separator */}
                                <div className="h-6 w-px bg-[var(--border-subtle)]" />

                                {/* Reporting link */}
                                <Link
                                    href="/operations"
                                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    Reporting
                                </Link>

                                {/* Admin link */}
                                <Link
                                    href="/admin"
                                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    Admin
                                </Link>

                                <button
                                    onClick={logout}
                                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation - without Admin */}
                <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
                    <Link
                        href="/"
                        className={`nav-link flex-shrink-0 ${!isLogistics && !isOperations && !isAdmin ? 'nav-link-active' : ''}`}
                    >
                        <span>👤</span>
                        <span className="text-sm">Shifts</span>
                    </Link>
                    <Link
                        href="/logistics"
                        className={`nav-link flex-shrink-0 ${isLogistics ? 'nav-link-active' : ''}`}
                    >
                        <span>📊</span>
                        <span className="text-sm">Dashboard</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}

