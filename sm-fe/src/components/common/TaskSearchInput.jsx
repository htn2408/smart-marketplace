import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import { fetchTaskSuggestions } from '../../services/taskService'

/**
 * TaskSearchInput - Reusable Task Autocomplete & Search Input
 * Used by Homepage (HeroSearch) and TaskDetail (Bước 1: Chuẩn hóa công việc)
 */
export default function TaskSearchInput({
  value,
  onChange,
  onSelectTask,
  placeholder = 'Nhập việc cần làm (vd: Lắp tủ IKEA, sửa ống nước, dọn nhà...)',
  label,
  id = 'task-search-input',
  required = false,
  icon = 'handyman',
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  variant = 'default', // 'default' | 'hero'
}) {
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const justSelectedRef = useRef(false)

  // Debounced API call for suggestions
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }

    const trimmed = (value || '').trim()
    if (!trimmed) {
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        const results = await fetchTaskSuggestions(trimmed, {
          signal: controller.signal,
          limit: 6,
        })
        setSuggestions(results)
        setIsDropdownOpen(results.length > 0)
        setHighlightedIndex(-1)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSuggestions([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value])

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = (item) => {
    justSelectedRef.current = true
    setIsDropdownOpen(false)
    setSuggestions([])
    setHighlightedIndex(-1)
    onChange?.(item.title)
    onSelectTask?.(item)
  }

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      )
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault()
        handleSelectSuggestion(suggestions[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  const handleClear = () => {
    onChange?.('')
    onSelectTask?.(null)
    setSuggestions([])
    setIsDropdownOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block font-label-sm text-label-sm text-on-surface font-semibold mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Input container */}
      <div
        className={`relative flex items-center transition-all ${
          variant === 'hero'
            ? 'gap-3 px-3.5 py-2.5 rounded-xl bg-surface-container-low flex-1 min-w-0'
            : 'rounded-lg bg-surface-container-low focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/40 border border-transparent focus-within:border-primary/20'
        }`}
      >
        <Icon
          name={icon}
          size={variant === 'hero' ? 26 : 22}
          className={`text-primary flex-shrink-0 ${
            variant === 'hero' ? '' : 'absolute left-3.5 pointer-events-none'
          }`}
        />

        {variant === 'hero' ? (
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider font-bold">
              Cần giúp việc gì?
            </span>
            <input
              ref={inputRef}
              id={id}
              type="text"
              autoComplete="off"
              required={required}
              value={value || ''}
              onChange={(e) => {
                const val = e.target.value
                onChange?.(val)
                if (!val.trim()) {
                  setSuggestions([])
                  setIsDropdownOpen(false)
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setIsDropdownOpen(true)
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`bg-transparent font-body-md text-on-surface placeholder:text-outline text-sm sm:text-base outline-none w-full truncate ${inputClassName}`}
            />
          </div>
        ) : (
          <input
            ref={inputRef}
            id={id}
            type="text"
            autoComplete="off"
            required={required}
            value={value || ''}
            onChange={(e) => {
              const val = e.target.value
              onChange?.(val)
              if (!val.trim()) {
                setSuggestions([])
                setIsDropdownOpen(false)
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsDropdownOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full pl-11 pr-11 py-3.5 bg-transparent rounded-lg text-on-surface font-label-md text-label-md outline-none font-medium placeholder:text-on-surface-variant/60 ${inputClassName}`}
          />
        )}

        {/* Right side: Loading spinner or Clear button */}
        <div
          className={`flex items-center gap-1.5 flex-shrink-0 ${
            variant === 'hero' ? '' : 'absolute right-3.5'
          }`}
        >
          {isLoading && (
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}

          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xoá nội dung"
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-full transition-colors cursor-pointer"
              title="Xóa"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isDropdownOpen && suggestions.length > 0 && (
        <div
          className={`absolute top-full mt-1.5 left-0 right-0 z-50 bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-variant/40 overflow-hidden divide-y divide-surface-variant/20 animate-in fade-in slide-in-from-top-2 duration-150 ${dropdownClassName}`}
        >
          <div className="px-4 py-2 bg-surface-container-low/70 flex items-center justify-between text-xs font-semibold text-outline">
            <span>Gợi ý công việc phổ biến</span>
            <span className="text-[11px] font-normal hidden sm:inline">
              Dùng phím ↑ ↓ để chọn • Enter để xác nhận
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {suggestions.map((item, idx) => {
              const isHighlighted = highlightedIndex === idx
              return (
                <div
                  key={item.skillId || idx}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-primary-fixed/25 text-primary'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isHighlighted
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <Icon name={item.icon || 'handyman'} size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-label-md text-sm font-bold truncate">
                        {item.title}
                      </p>
                      <p className="font-body-sm text-xs text-on-surface-variant truncate">
                        {item.categoryName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-primary font-semibold hidden md:inline">
                      Chọn
                    </span>
                    <Icon
                      name="arrow_forward"
                      size={16}
                      className={isHighlighted ? 'text-primary' : 'text-outline'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
