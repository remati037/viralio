'use client';

import { KANBAN_COLUMNS } from '@/lib/constants';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type TaskStatus = 'idea' | 'ready' | 'scheduled' | 'published';

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  className?: string;
  disabled?: boolean;
}

export default function StatusSelect({
  value,
  onChange,
  className = '',
  disabled = false,
}: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedStatus = KANBAN_COLUMNS.find((col) => col.id === value);

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
          highlightedIndex < KANBAN_COLUMNS.length
        ) {
          onChange(KANBAN_COLUMNS[highlightedIndex].id as TaskStatus);
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
            prev < KANBAN_COLUMNS.length - 1 ? prev + 1 : prev
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
        className={`w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-left flex items-center justify-between transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
        } ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedStatus ? (
          <span
            className={`text-sm font-bold rounded border ${selectedStatus.color}`}
          >
            {selectedStatus.title}
          </span>
        ) : (
          <span className="text-slate-500">Izaberi status</span>
        )}
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto divide-y-[0.5px] divide-slate-700 p-2"
        >
          {KANBAN_COLUMNS.map((column, index) => (
            <li
              key={column.id}
              role="option"
              aria-selected={value === column.id}
              onClick={() => {
                onChange(column.id as TaskStatus);
                setIsOpen(false);
                setHighlightedIndex(-1);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 ${
                value === column.id
                  ? 'bg-blue-600/20'
                  : highlightedIndex === index
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className={`text-sm font-boldrounded ${column.color}`}>
                {column.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
