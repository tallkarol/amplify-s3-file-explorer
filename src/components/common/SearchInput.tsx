// src/components/common/SearchInput.tsx
import React, { useState, useEffect, useRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  onClear?: () => void;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
  onClear,
  iconStart = <i className="bi bi-search"></i>,
  iconEnd
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Update local value when prop value changes (for controlled component behavior)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set a new timer
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  // Clear input
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (onClear) onClear();
  };

  // Clean up the timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className={`input-group ${className}`}>
      {iconStart && (
        <span className="input-group-text bg-light border-end-0">
          {iconStart}
        </span>
      )}
      <input
        type="text"
        className={`form-control ${iconStart ? 'border-start-0' : ''}`}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
      />
      {localValue && (
        <button
          className="btn btn-outline-secondary border-start-0"
          type="button"
          onClick={handleClear}
          title="Clear search"
        >
          <i className="bi bi-x"></i>
        </button>
      )}
      {iconEnd && (
        <span className="input-group-text">
          {iconEnd}
        </span>
      )}
    </div>
  );
};

export default SearchInput;