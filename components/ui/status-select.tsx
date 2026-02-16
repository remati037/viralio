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
  /** Use 'light' for modals/light backgrounds */
  variant?: 'dark' | 'light';
}

const triggerClassDark =
  'w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-left flex items-center justify-between transition-colors hover:border-slate-600 text-white';
const triggerClassLight =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-left flex items-center justify-between transition-colors hover:border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30';
const listClassDark =
  'absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto divide-y-[0.5px] divide-slate-700 p-2';
const listClassLight =
  'absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto divide-y divide-slate-100 p-2';

export default function StatusSelect({
  value,
  onChange,
  className = '',
  disabled = false,
  variant = 'dark',
}: StatusSelectProps) {
  const isLight = variant === 'light';
  const triggerClass = isLight ? triggerClassLight : triggerClassDark;
  const listClass = isLight ? listClassLight : listClassDark;
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
        className={`${triggerClass} ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        } ${isOpen ? (isLight ? 'border-primary ring-2 ring-primary/20' : 'border-blue-500 ring-2 ring-blue-500/20') : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedStatus ? (
          <div className="flex items-center gap-2">
            {selectedStatus.icon && (
              <selectedStatus.icon
                className={selectedStatus.iconColor}
                size={16}
              />
            )}
            <span className={`text-sm font-bold ${selectedStatus.iconColor}`}>
              {selectedStatus.title}
            </span>
          </div>
        ) : (
          <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>Izaberi status</span>
        )}
        <ChevronDown
          size={18}
          className={`${isLight ? 'text-slate-500' : 'text-slate-400'} transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className={listClass}
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
              className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 rounded ${
                value === column.id
                  ? isLight
                    ? 'bg-primary/10 text-slate-900'
                    : 'bg-blue-600/20'
                  : highlightedIndex === index
                  ? isLight
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-700 text-white'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-50'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {column.icon && (
                <column.icon className={column.iconColor} size={16} />
              )}
              <span className={`text-sm font-bold ${column.iconColor}`}>
                {column.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
