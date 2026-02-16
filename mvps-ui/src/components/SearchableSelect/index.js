import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './SearchableSelect.css';

/**
 * A searchable dropdown select component.
 *
 * Props:
 *  - options: Array of { value, label } objects
 *  - value: currently selected value (string or number)
 *  - onChange: (value) => void
 *  - placeholder: placeholder text when nothing selected
 *  - className: additional class for the wrapper
 *  - disabled: boolean
 */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setSearch('');
    // focus the search input after opening
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const handleSelect = useCallback(
    (optValue) => {
      onChange(optValue);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
      if (e.key === 'Enter' && filtered.length === 1) {
        e.preventDefault();
        handleSelect(filtered[0].value);
      }
    },
    [filtered, handleSelect],
  );

  return (
    <div
      className={`searchable-select ${className} ${disabled ? 'searchable-select--disabled' : ''}`}
      ref={wrapperRef}
    >
      {/* Display trigger */}
      <button
        type="button"
        className="searchable-select__trigger input"
        onClick={handleOpen}
        disabled={disabled}
      >
        <span className={`searchable-select__value ${!selectedOption ? 'searchable-select__placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="searchable-select__arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="searchable-select__dropdown">
          <input
            ref={inputRef}
            type="text"
            className="searchable-select__search"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <ul className="searchable-select__list">
            {filtered.length === 0 && (
              <li className="searchable-select__no-results">No matches found</li>
            )}
            {filtered.map((opt) => (
              <li
                key={String(opt.value)}
                className={`searchable-select__item ${String(opt.value) === String(value) ? 'searchable-select__item--selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
