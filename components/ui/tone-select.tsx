'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type Tone =
  | 'friendly'
  | 'contrarian'
  | 'expert'
  | 'playful'
  | 'cinematic'
  | 'educational'
  | 'entertaining'
  | 'inspirational';

export interface ToneOption {
  value: Tone;
  label: string;
  description: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    value: 'friendly',
    label: 'Prijateljski',
    description: 'Topao, pristupačan ton komunikacije',
  },
  {
    value: 'contrarian',
    label: 'Kontrarian',
    description: 'Smeo, izaziva ustaljena mišljenja',
  },
  {
    value: 'expert',
    label: 'Stručan',
    description: 'Autoritativan, pouzdan i kredibilan',
  },
  {
    value: 'playful',
    label: 'Razigran',
    description: 'Zabavan, lagan i opušten stil',
  },
  {
    value: 'cinematic',
    label: 'Filmski',
    description: 'Dramatičan, vizuelan i narativan',
  },
  {
    value: 'educational',
    label: 'Edukativan',
    description: 'Informativan, objašnjava i podučava',
  },
  {
    value: 'entertaining',
    label: 'Zabavan',
    description: 'Interesantan, dinamičan i privlačan pažnji',
  },
  {
    value: 'inspirational',
    label: 'Inspirativan',
    description: 'Motivišući, podstiče i ohrabruje',
  },
];

interface ToneSelectProps {
  value?: Tone | null;
  onChange: (tone: Tone | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Use 'light' for modals/light backgrounds */
  variant?: 'dark' | 'light';
}

const triggerClassDark =
  'w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-left flex items-center justify-between transition-colors hover:border-slate-600 text-white';
const triggerClassLight =
  'w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-left flex items-center justify-between transition-colors hover:border-slate-300 text-slate-900';
const listClassDark =
  'absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto divide-y-[0.5px] divide-slate-700 p-2';
const listClassLight =
  'absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto divide-y divide-slate-100 p-2';

export default function ToneSelect({
  value,
  onChange,
  placeholder = 'Izaberi ton',
  className = '',
  disabled = false,
  variant = 'dark',
}: ToneSelectProps) {
  const isLight = variant === 'light';
  const triggerClass = isLight ? triggerClassLight : triggerClassDark;
  const listClass = isLight ? listClassLight : listClassDark;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedTone = value
    ? TONE_OPTIONS.find((t) => t.value === value)
    : null;

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
          highlightedIndex < TONE_OPTIONS.length
        ) {
          onChange(TONE_OPTIONS[highlightedIndex].value);
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
            prev < TONE_OPTIONS.length - 1 ? prev + 1 : prev
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
        {selectedTone ? (
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-medium">
              {selectedTone.label}
            </span>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {selectedTone.description}
            </span>
          </div>
        ) : (
          <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{placeholder}</span>
        )}
        <ChevronDown
          size={18}
          className={`${isLight ? 'text-slate-500' : 'text-slate-400'} transition-transform shrink-0 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
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
            className={`px-3 py-2 cursor-pointer transition-colors ${
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
            <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Bez tona</span>
          </li>
          {TONE_OPTIONS.map((tone, index) => (
            <li
              key={tone.value}
              role="option"
              aria-selected={value === tone.value}
              onClick={() => {
                onChange(tone.value);
                setIsOpen(false);
                setHighlightedIndex(-1);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                isLight
                  ? value === tone.value
                    ? 'bg-slate-100 text-slate-900'
                    : highlightedIndex === index
                      ? 'bg-slate-50 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  : value === tone.value
                    ? 'bg-blue-600/20 text-white'
                    : highlightedIndex === index
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{tone.label}</span>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {tone.description}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
