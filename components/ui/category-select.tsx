'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

interface CategorySelectProps {
  categories: TaskCategory[];
  value?: string | null;
  onChange: (categoryId: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Use 'light' for modals/light backgrounds */
  variant?: 'dark' | 'light';
}

const triggerClassDark =
  'w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-left flex items-center justify-between transition-colors hover:border-slate-600 text-white placeholder:text-slate-500';
const triggerClassLight =
  'w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-left flex items-center justify-between transition-colors hover:border-slate-300 text-slate-900 placeholder:text-slate-400';
const listClassDark =
  'absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto divide-y-[0.5px] divide-slate-700 p-2';
const listClassLight =
  'absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto divide-y divide-slate-100 p-2';

export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Izaberi kategoriju',
  className = '',
  disabled = false,
  variant = 'dark',
}: CategorySelectProps) {
  const isLight = variant === 'light';
  const triggerClass = isLight ? triggerClassLight : triggerClassDark;
  const listClass = isLight ? listClassLight : listClassDark;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedCategory = categories.find((cat) => cat.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (
          isOpen &&
          highlightedIndex >= 0 &&
          highlightedIndex < categories.length
        ) {
          onChange(categories[highlightedIndex].id);
          setIsOpen(false);
          setHighlightedIndex(-1);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < categories.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`${triggerClass} ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer'
        } ${isOpen ? 'border-slate-400 ring-2 ring-slate-400/20' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <span className="first-letter:uppercase text-sm">
              {selectedCategory.name}
            </span>
          </div>
        ) : (
          <span>{placeholder}</span>
        )}
        <div className="flex items-center gap-2">
          {/* {selectedCategory && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded cursor-pointer"
              title="Ukloni kategoriju"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }
              }}
            >
              <X size={14} />
            </div>
          )} */}
          <ChevronDown
            size={18}
            className={`${isLight ? 'text-slate-500' : 'text-slate-400'} transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className={listClass}
        >
          <li
            role="option"
            aria-selected={value === null}
            onClick={() => {
              onChange(null);
              setIsOpen(false);
              setHighlightedIndex(-1);
            }}
            onMouseEnter={() => setHighlightedIndex(-1)}
            className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
              isLight
                ? value === null
                  ? 'bg-slate-100 text-slate-900'
                  : highlightedIndex === -1
                    ? 'text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                : value === null
                  ? 'bg-blue-600/20 text-white'
                  : highlightedIndex === -1
                    ? 'text-white'
                    : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Bez kategorije</span>
          </li>
          {categories.map((category, index) => (
            <li
              key={category.id}
              role="option"
              aria-selected={value === category.id}
              onClick={() => {
                onChange(category.id);
                setIsOpen(false);
                setHighlightedIndex(-1);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 ${
                isLight
                  ? value === category.id
                    ? 'bg-slate-100 text-slate-900'
                    : highlightedIndex === index
                      ? 'bg-slate-50 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  : value === category.id
                    ? 'bg-blue-600/20 text-white'
                    : highlightedIndex === index
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm first-letter:uppercase">
                {category.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
