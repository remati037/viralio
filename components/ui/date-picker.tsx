'use client';

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  value?: string | null; // ISO date string or null
  onChange: (date: string | null) => void; // Returns ISO date string or null
  placeholder?: string;
  className?: string;
  minDate?: string; // ISO date string
  maxDate?: string; // ISO date string
  disablePast?: boolean; // If true, disables all dates before today
}

const MONTHS = [
  'Januar',
  'Februar',
  'Mart',
  'April',
  'Maj',
  'Jun',
  'Jul',
  'Avgust',
  'Septembar',
  'Oktobar',
  'Novembar',
  'Decembar',
];

const WEEKDAYS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Izaberi datum',
  className = '',
  minDate,
  maxDate,
  disablePast = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const pickerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Parse value to Date object (treat YYYY-MM-DD as local date, not UTC)
  const selectedDate = value
    ? (() => {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
      })()
    : null;

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set initial view to selected date or current date
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.date-picker-dropdown')
      ) {
        setIsOpen(false);
      }
    };

    const calculatePosition = () => {
      if (!isOpen || !pickerRef.current) return;

      const rect = pickerRef.current.getBoundingClientRect();
      const dropdownHeight = 350;
      const gap = 8;
      const viewportPadding = 16;
      const isMobile = window.innerWidth < 640; // sm breakpoint

      // Responsive width: smaller on mobile, match input width or min 320px on desktop
      const dropdownWidth = isMobile
        ? Math.min(window.innerWidth - viewportPadding * 2, 320)
        : Math.max(rect.width, 320);

      // Calculate space above and below
      const spaceAbove = rect.top - viewportPadding;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;

      let top: number;
      let left: number;

      // Determine if we should position above or below
      // Prefer below if there's more space, or if space above is insufficient
      if (
        spaceBelow >= dropdownHeight ||
        (spaceBelow >= spaceAbove && spaceBelow >= dropdownHeight * 0.6)
      ) {
        // Position below the input
        top = rect.bottom + gap;
      } else if (spaceAbove >= dropdownHeight) {
        // Position above the input
        top = rect.top - dropdownHeight - gap;
      } else {
        // Not enough space either way - position where there's more space
        if (spaceBelow > spaceAbove) {
          top = rect.bottom + gap;
        } else {
          top = viewportPadding;
        }
      }

      // Ensure top doesn't go above viewport
      if (top < viewportPadding) {
        top = viewportPadding;
      }

      // Ensure dropdown doesn't go below viewport
      if (top + dropdownHeight > window.innerHeight - viewportPadding) {
        top = window.innerHeight - dropdownHeight - viewportPadding;
      }

      // Calculate left position - center on mobile, align with input on desktop
      if (isMobile) {
        // Center on mobile
        left = (window.innerWidth - dropdownWidth) / 2;
      } else {
        // Align with input on desktop
        left = rect.left;

        // Adjust if dropdown would go off-screen to the right
        if (left + dropdownWidth > window.innerWidth - viewportPadding) {
          left = window.innerWidth - dropdownWidth - viewportPadding;
        }

        // Adjust if dropdown would go off-screen to the left
        if (left < viewportPadding) {
          left = viewportPadding;
        }
      }

      setDropdownPosition({
        top,
        left,
        width: dropdownWidth,
      });
    };

    if (isOpen && pickerRef.current) {
      document.addEventListener('mousedown', handleClickOutside);

      // Calculate initial position
      calculatePosition();

      // Recalculate on scroll, resize, or orientation change
      const handleResize = () => calculatePosition();
      const handleScroll = () => calculatePosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const isDateDisabled = (date: Date): boolean => {
    // If disablePast is true, set minDate to today (local date)
    let effectiveMinDate = minDate;
    if (disablePast) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      effectiveMinDate = `${year}-${month}-${day}`;
    }

    if (effectiveMinDate) {
      // Parse YYYY-MM-DD as local date
      const [year, month, day] = effectiveMinDate.split('-').map(Number);
      const min = new Date(year, month - 1, day);
      min.setHours(0, 0, 0, 0);
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0);
      if (dateToCheck < min) return true;
    }
    if (maxDate) {
      // Parse YYYY-MM-DD as local date
      const [year, month, day] = maxDate.split('-').map(Number);
      const max = new Date(year, month - 1, day);
      max.setHours(23, 59, 59, 999);
      if (date > max) return true;
    }
    return false;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (isDateDisabled(date)) return;

    // Format as YYYY-MM-DD in local time (avoid UTC conversion)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day}. ${month} ${year}`;
  };

  // Generate calendar days
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const daysInCurrentMonth = daysInMonth(viewYear, viewMonth);
  const days: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    days.push(day);
  }

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-left flex items-center justify-between transition-colors hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {selectedDate ? (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-white">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>
        ) : (
          <span className="text-slate-500">{placeholder}</span>
        )}
        <div className="flex items-center gap-2">
          {selectedDate && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded cursor-pointer"
              title="Ukloni datum"
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
          )}
          <Calendar
            size={18}
            className={`text-slate-400 transition-transform`}
          />
        </div>
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="date-picker-dropdown fixed z-[9999] bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Prethodni mesec"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={goToToday}
                  className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded transition-colors"
                >
                  Danas
                </button>
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Sledeći mesec"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-400 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const date = new Date(viewYear, viewMonth, day);
                const disabled = isDateDisabled(date);
                const isSelectedDay = isSelected(date);
                const isTodayDay = isToday(date);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={disabled}
                    className={`aspect-square flex items-center justify-center text-sm rounded transition-colors ${
                      disabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : isSelectedDay
                        ? 'bg-blue-600 text-white font-semibold'
                        : isTodayDay
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
