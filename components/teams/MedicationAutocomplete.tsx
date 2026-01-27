import React, { useState, useEffect, useRef } from 'react';
import { PharmacyItem } from '@/lib/types';

interface MedicationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    pharmacyItems: PharmacyItem[];
    className?: string;
}

export default function MedicationAutocomplete({
    value,
    onChange,
    placeholder = "Drug",
    pharmacyItems,
    className
}: MedicationAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredItems, setFilteredItems] = useState<PharmacyItem[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter items based on input
    useEffect(() => {
        if (!value.trim()) {
            setFilteredItems([]);
            return;
        }

        const lowerVal = value.toLowerCase();
        const filtered = pharmacyItems
            .filter(item => item.name.toLowerCase().includes(lowerVal))
            .sort((a, b) => {
                // Prioritize searching starts with
                const aStarts = a.name.toLowerCase().startsWith(lowerVal);
                const bStarts = b.name.toLowerCase().startsWith(lowerVal);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.name.localeCompare(b.name);
            })
            .slice(0, 50); // Limit to 50 results

        setFilteredItems(filtered);
    }, [value, pharmacyItems]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex(prev =>
                prev < filteredItems.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
                selectItem(filteredItems[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const selectItem = (item: PharmacyItem) => {
        onChange(item.name);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                    setHighlightedIndex(-1);
                }}
                onFocus={() => {
                    if (value.trim()) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />

            {isOpen && filteredItems.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-lg max-h-60 overflow-y-auto overflow-x-hidden text-sm">
                    {filteredItems.map((item, index) => (
                        <li
                            key={item.id}
                            onClick={() => selectItem(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`px-3 py-1.5 cursor-pointer flex justify-between items-center transition-colors ${index === highlightedIndex
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            <span className="font-medium truncate mr-2">
                                {item.name} <span className="text-[var(--text-secondary)] font-normal ml-1 text-[10px]">{/^\d+$/.test(item.dosage) ? `${item.dosage}mg` : item.dosage}</span>
                            </span>
                            <span className={`text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded border border-opacity-20 ${item.stockCount > 0
                                ? 'bg-green-100/50 text-green-700 border-green-500'
                                : 'bg-red-100/50 text-red-700 border-red-500'
                                }`}>
                                {item.stockCount} stock
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
