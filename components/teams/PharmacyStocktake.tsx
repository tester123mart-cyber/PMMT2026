import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PharmacyItem, PharmacyCategory, PharmacyForm as PharmacyFormType } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { addPharmacyItem, updatePharmacyItem } from '@/lib/firebaseService';

const CATEGORIES: PharmacyCategory[] = [
    'Analgesics',
    'Antimicrobials',
    'Cardiovascular Medications',
    'Ear Eyes Nose Throat Preparations',
    'Endocrine Medications',
    'GIT Medications',
    'Miscellaneous Medications',
    'Obstetric & Gynaecological',
    'Psychotropics',
    'Respiratory Medications',
    'Tablets & Capsules',
    'Topical Medications',
    'Vitamins & Supplements',
].sort() as PharmacyCategory[];

const FORMS: PharmacyFormType[] = [
    'Box',
    'Capsules',
    'Cream/Ointment',
    'Drops',
    'Ear Drops',
    'Inhaler',
    'Liquid',
    'Lotion',
    'Lozenge',
    'Sachet',
    'Syrups',
    'Tab/Caps',
    'Tablets',
].sort() as PharmacyFormType[];

export default function PharmacyStocktake() {
    const { state, dispatch } = useApp();
    const { pharmacyItems } = state;

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState<PharmacyCategory>(CATEGORIES[0]);
    const [form, setForm] = useState<PharmacyFormType>(FORMS[0]);
    const [dosage, setDosage] = useState('');
    const [stockCount, setStockCount] = useState<number>(0);
    const [initialStock, setInitialStock] = useState<number>(0); // Helper for percentage

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Please enter a medication name.');
            return;
        }

        const newItem: PharmacyItem = {
            id: generateId(),
            name: name.trim(),
            category,
            form,
            dosage,
            stockCount,
            initialStock: initialStock > 0 ? initialStock : stockCount, // Default to current if not set
            updatedAt: new Date().toISOString(),
        };

        if (state.currentUser && state.currentUser.isAdmin) {
            // In a real app we might want to check permissions more strictly
            // referencing types/firebase logic here
        }

        await addPharmacyItem(newItem);

        // Optimistic update
        dispatch({
            type: 'UPDATE_PHARMACY_ITEMS',
            payload: [...pharmacyItems, newItem]
        });

        // Reset Form
        setName('');
        setDosage('');
        setStockCount(0);
        setInitialStock(0);
    };

    const getStockPercentage = (item: PharmacyItem) => {
        if (item.initialStock <= 0) return 0;
        return Math.min(100, Math.round((item.stockCount / item.initialStock) * 100));
    };

    const getStockColor = (percentage: number) => {
        if (percentage > 50) return 'bg-green-500';
        if (percentage > 20) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
            {/* Left Column: Stocktake Form */}
            <div>
                <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6 sticky top-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                        💊 Add Stock Item
                    </h3>

                    <div className="flex flex-col gap-4 mb-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                Medication Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Paracetamol"
                                className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Category & Form */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as PharmacyCategory)}
                                    className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Form
                                </label>
                                <select
                                    value={form}
                                    onChange={(e) => setForm(e.target.value as PharmacyFormType)}
                                    className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                >
                                    {FORMS.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dosage & Stock */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Dosage
                                </label>
                                <input
                                    type="text"
                                    value={dosage}
                                    onChange={(e) => setDosage(e.target.value)}
                                    placeholder="e.g. 500mg"
                                    className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Current Stock
                                </label>
                                <input
                                    type="number"
                                    value={stockCount}
                                    onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
                                    className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Total Capacity
                                </label>
                                <input
                                    type="number"
                                    value={initialStock}
                                    onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                                    placeholder="Optional"
                                    className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add to Stock
                    </button>
                </div>
            </div>

            {/* Right Column: Stock Table */}
            <div>
                <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6 h-full overflow-hidden flex flex-col">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                        📦 Inventory ({pharmacyItems.length})
                    </h3>

                    <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                        {pharmacyItems.length === 0 ? (
                            <div className="text-center py-12 text-[var(--text-muted)]">
                                <div className="text-3xl mb-2">📦</div>
                                <p>No items in stock</p>
                            </div>
                        ) : (
                            pharmacyItems.map(item => {
                                const percent = getStockPercentage(item);
                                return (
                                    <div key={item.id} className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-[var(--text-primary)]">{item.name}</h4>
                                                <p className="text-xs text-[var(--text-secondary)]">{item.dosage} • {item.form}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-mono font-bold text-[var(--text-primary)]">{item.stockCount}</span>
                                                <span className="text-xs text-[var(--text-muted)] block">rem.</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getStockColor(percent)}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-[var(--text-muted)]">{item.category}</span>
                                            <span className="text-[10px] text-[var(--text-muted)]">{percent}%</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
