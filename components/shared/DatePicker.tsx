'use client';

import { useState } from 'react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD format
    onChange: (date: string) => void;
    onClose?: () => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DatePicker({ value, onChange, onClose }: DatePickerProps) {
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            const [year, month] = value.split('-');
            return { year: parseInt(year), month: parseInt(month) - 1 };
        }
        return { year: 2026, month: 4 }; // May 2026 default
    });

    const selectedDate = value ? new Date(value) : null;

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewDate(prev => {
            if (prev.month === 0) {
                return { year: prev.year - 1, month: 11 };
            }
            return { ...prev, month: prev.month - 1 };
        });
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setViewDate(prev => {
            if (prev.month === 11) {
                return { year: prev.year + 1, month: 0 };
            }
            return { ...prev, month: prev.month + 1 };
        });
    };

    const handleSelectDate = (day: number) => {
        const month = (viewDate.month + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const dateStr = `${viewDate.year}-${month}-${dayStr}`;
        onChange(dateStr);
        onClose?.();
    };

    const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
    const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return (
            selectedDate.getFullYear() === viewDate.year &&
            selectedDate.getMonth() === viewDate.month &&
            selectedDate.getDate() === day
        );
    };

    return (
        <div
            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-xl w-80"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header with month/year navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-lg"
                >
                    ←
                </button>
                <div className="font-semibold text-[var(--text-primary)]">
                    {MONTHS[viewDate.month]} {viewDate.year}
                </div>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-lg"
                >
                    →
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                    <div key={day} className="text-center text-xs text-[var(--text-muted)] font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                    <div key={index} className="aspect-square">
                        {day !== null && (
                            <button
                                type="button"
                                onClick={() => handleSelectDate(day)}
                                className={`
                  w-full h-full rounded-lg text-sm font-medium transition-all
                  ${isSelected(day)
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                                    }
                `}
                            >
                                {day}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick select buttons */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <div className="text-xs text-[var(--text-muted)] mb-2">Quick Select:</div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { label: 'May 11', date: '2026-05-11' },
                        { label: 'May 12', date: '2026-05-12' },
                        { label: 'May 13', date: '2026-05-13' },
                        { label: 'May 14', date: '2026-05-14' },
                        { label: 'May 15', date: '2026-05-15' },
                    ].map(q => (
                        <button
                            key={q.date}
                            type="button"
                            onClick={() => { onChange(q.date); onClose?.(); }}
                            className={`
                px-2 py-1 text-xs rounded-md transition-colors
                ${value === q.date
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                }
              `}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Close button */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full btn-secondary text-sm"
                >
                    Cancel
                </button>
            )}
        </div>
    );
}
