import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PharmacyItem, PharmacyCategory, PharmacyForm as PharmacyFormType } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { addPharmacyItem, updatePharmacyItem, removePharmacyItem } from '@/lib/firebaseService';

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
    const { pharmacyItems, patientRecords, clinicDays } = state;

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState<PharmacyCategory>(CATEGORIES[0]);
    const [form, setForm] = useState<PharmacyFormType>(FORMS[0]);
    const [dosage, setDosage] = useState('');
    const [stockCount, setStockCount] = useState<number>(0);

    // Edit/View Modal State
    const [selectedItem, setSelectedItem] = useState<PharmacyItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tempItem, setTempItem] = useState<PharmacyItem | null>(null);

    // Metrics Calculation
    const metrics = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const activeClinicDay = clinicDays.find(d => d.isActive) || clinicDays.find(d => d.date === today);

        const itemMetrics: Record<string, { dispensed: number, percentRemaining: number }> = {};

        pharmacyItems.forEach(item => {
            let dispensed = 0;
            if (activeClinicDay) {
                const dailyRecords = patientRecords?.filter(r => r.clinicDayId === activeClinicDay.id) || [];
                dailyRecords.forEach(record => {
                    record.medications.forEach(med => {
                        if (med.pharmacyItemId === item.id) {
                            dispensed++;
                        }
                    });
                });
            }

            const startStock = item.stockCount + dispensed;
            const percentRemaining = startStock > 0
                ? Math.round((item.stockCount / startStock) * 100)
                : 0;

            itemMetrics[item.id] = { dispensed, percentRemaining };
        });

        return itemMetrics;
    }, [pharmacyItems, patientRecords, clinicDays]);

    // Group Items by Category
    const groupedItems = useMemo(() => {
        const groups: Partial<Record<PharmacyCategory, PharmacyItem[]>> = {};

        pharmacyItems.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category]!.push(item);
        });

        // Sort items within groups by name
        Object.keys(groups).forEach(key => {
            groups[key as PharmacyCategory]!.sort((a, b) => a.name.localeCompare(b.name));
        });

        return groups;
    }, [pharmacyItems]);

    // Active Categories (sorted by fixed order)
    const activeCategories = CATEGORIES.filter(c => groupedItems[c] && groupedItems[c]!.length > 0);

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
            updatedAt: new Date().toISOString(),
        };

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
    };

    const handleEditClick = () => {
        if (selectedItem) {
            setTempItem({ ...selectedItem });
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setTempItem(null);
    };

    const handleSaveEdit = async () => {
        if (!tempItem) return;

        // Optimistic update
        const updatedItems = pharmacyItems.map(item =>
            item.id === tempItem.id ? tempItem : item
        );
        dispatch({
            type: 'UPDATE_PHARMACY_ITEMS',
            payload: updatedItems
        });

        // Backend update
        await updatePharmacyItem(tempItem);

        setSelectedItem(tempItem);
        setIsEditing(false);
        setTempItem(null);
    };

    const handleDeleteItem = async () => {
        if (!selectedItem) return;

        if (confirm(`Are you sure you want to delete ${selectedItem.name}?`)) {
            // Optimistic update
            const updatedItems = pharmacyItems.filter(item => item.id !== selectedItem.id);
            dispatch({
                type: 'UPDATE_PHARMACY_ITEMS',
                payload: updatedItems
            });

            // Backend update
            await removePharmacyItem(selectedItem.id);

            setSelectedItem(null);
            setIsEditing(false);
        }
    };

    const updateTempItem = (field: keyof PharmacyItem, value: any) => {
        if (!tempItem) return;
        setTempItem({ ...tempItem, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto relative">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
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
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Input Stock
                                </label>
                                <input
                                    type="number"
                                    value={stockCount}
                                    onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
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

            {/* Right Column: Stock List */}
            <div>
                <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6 h-[60vh] lg:h-[80vh] overflow-hidden flex flex-col">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                        📦 Inventory ({pharmacyItems.length})
                    </h3>

                    <div className="overflow-y-auto flex-1 pr-1 space-y-4 custom-scrollbar">
                        {pharmacyItems.length === 0 ? (
                            <div className="text-center py-12 text-[var(--text-muted)]">
                                <div className="text-3xl mb-2">📦</div>
                                <p>No items in stock</p>
                            </div>
                        ) : (
                            activeCategories.map(cat => (
                                <div key={cat}>
                                    <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 sticky top-0 bg-[var(--bg-secondary)] py-1 z-10 border-b border-[var(--border-subtle)] backdrop-blur-sm bg-opacity-90">
                                        {cat} ({groupedItems[cat]!.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                        {groupedItems[cat]!.map(item => {
                                            const { dispensed, percentRemaining } = metrics[item.id] || { dispensed: 0, percentRemaining: 0 };
                                            let badgeColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                                            if (percentRemaining < 20) badgeColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                                            else if (percentRemaining < 50) badgeColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setSelectedItem(item)}
                                                    className="group flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-blue-500/50 hover:bg-[var(--bg-hover)] cursor-pointer transition-all"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm shrink-0">
                                                            💊
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-baseline gap-2">
                                                                <h4 className="font-semibold text-[var(--text-primary)] truncate text-sm">
                                                                    {item.name}
                                                                </h4>
                                                                <span className="text-[10px] text-[var(--text-secondary)] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                                                                    {item.form}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-[var(--text-muted)] truncate">
                                                                {item.dosage}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-right shrink-0 pl-3">
                                                        {percentRemaining < 100 && (
                                                            <div className="hidden sm:flex flex-col items-end">
                                                                <span className={`text-[10px] font-medium px-1.5 rounded-full ${badgeColor}`}>
                                                                    {percentRemaining}% left
                                                                </span>
                                                                <span className="text-[9px] text-[var(--text-muted)]">
                                                                    {dispensed} used today
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${item.stockCount > 0
                                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                                            }`}>
                                                            {item.stockCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Item Details Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => {
                        if (!isEditing) setSelectedItem(null);
                    }}
                >
                    <div
                        className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border-subtle)] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                                    💊
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                                        {selectedItem.name}
                                    </h3>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Inventory Item
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <button
                                        onClick={handleEditClick}
                                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 space-y-4">
                            {!isEditing ? (
                                <>
                                    {/* Stats Card */}
                                    {metrics[selectedItem.id]?.dispensed > 0 && (
                                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Daily Status</span>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    dispensed today
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                    {metrics[selectedItem.id].dispensed}
                                                </span>
                                                <span className="text-xs text-blue-500 block">
                                                    {metrics[selectedItem.id].percentRemaining}% remaining
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                            <label className="text-xs text-[var(--text-muted)] block mb-1">Category</label>
                                            <span className="font-medium text-[var(--text-primary)]">{selectedItem.category}</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                            <label className="text-xs text-[var(--text-muted)] block mb-1">Form</label>
                                            <span className="font-medium text-[var(--text-primary)]">{selectedItem.form}</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                            <label className="text-xs text-[var(--text-muted)] block mb-1">Dosage</label>
                                            <span className="font-medium text-[var(--text-primary)]">{selectedItem.dosage}</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                            <label className="text-xs text-[var(--text-muted)] block mb-1">Stock Level</label>
                                            <span className={`font-mono font-bold ${selectedItem.stockCount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {selectedItem.stockCount}
                                            </span>
                                        </div>
                                    </div>

                                    {!isEditing && (
                                        <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
                                            <button
                                                onClick={handleDeleteItem}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Delete Item
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 block">Name</label>
                                        <input
                                            value={tempItem?.name || ''}
                                            onChange={(e) => updateTempItem('name', e.target.value)}
                                            className="w-full p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 block">Category</label>
                                            <select
                                                value={tempItem?.category}
                                                onChange={(e) => updateTempItem('category', e.target.value)}
                                                className="w-full p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 block">Form</label>
                                            <select
                                                value={tempItem?.form}
                                                onChange={(e) => updateTempItem('form', e.target.value)}
                                                className="w-full p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                            >
                                                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 block">Dosage</label>
                                            <input
                                                value={tempItem?.dosage || ''}
                                                onChange={(e) => updateTempItem('dosage', e.target.value)}
                                                className="w-full p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 block">Stock</label>
                                            <input
                                                type="number"
                                                value={tempItem?.stockCount || 0}
                                                onChange={(e) => updateTempItem('stockCount', parseInt(e.target.value) || 0)}
                                                className="w-full p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Edit Actions */}
                        {isEditing && (
                            <div className="p-4 sm:p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex justify-end gap-3">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
