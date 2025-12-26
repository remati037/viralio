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
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Izaberi kategoriju',
  className = '',
}: CategorySelectProps) {
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

  const disabled = false;

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-left flex items-center justify-between transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
        } ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <span className="text-white first-letter:uppercase text-sm">
              {selectedCategory.name}
            </span>
          </div>
        ) : (
          <span className="text-slate-500">{placeholder}</span>
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
            className={`text-slate-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto divide-y-[0.5px] divide-slate-700 p-2"
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
            className={`px-3 py-2 cursor-pointer transition-colors ${
              value === null
                ? 'bg-blue-600/20 text-white'
                : highlightedIndex === -1
                ? 'text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="text-slate-400 text-sm">Bez kategorije</span>
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
                value === category.id
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
