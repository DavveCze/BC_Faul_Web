  import React, { useState, useRef, useEffect } from 'react';

interface EditableNumberLabelProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  isPercentage?: boolean;
  decimals?: number;
  className?: string;
  displayPrefix?: string;
  displaySuffix?: string;
}

/**
 * Zobrazuje číselnou hodnotu, kterou lze po dvojkliku přímo přepsat z klávesnice.
 * Umožňuje rychlé zadání bez nutnosti zdlouhavého posouvání slideru myší.
 */
export const EditableNumberLabel: React.FC<EditableNumberLabelProps> = ({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  isPercentage = false,
  decimals = 2,
  className = '',
  displayPrefix = '',
  displaySuffix = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Spuštění editace dvojklikem
  const handleStartEdit = () => {
    // Pro procenta zadává uživatel přirozeně např. 85, pro desetinná čísla např. 0.85
    const initialText = isPercentage
      ? Math.round(value * 100).toString()
      : value.toFixed(decimals);
    setTempText(initialText);
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCommit = () => {
    setIsEditing(false);
    const parsed = parseFloat(tempText.replace(',', '.'));
    if (isNaN(parsed)) return;

    let targetValue = isPercentage ? parsed / 100 : parsed;
    // Omezení v mezích min a max
    targetValue = Math.max(min, Math.min(max, targetValue));
    // Zaokrouhlení na krok step
    if (step > 0) {
      targetValue = Math.round(targetValue / step) * step;
    }
    // Zaokrouhlení plovoucí čárky
    targetValue = parseFloat(targetValue.toFixed(4));
    onChange(targetValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={tempText}
        step={isPercentage ? step * 100 : step}
        min={isPercentage ? min * 100 : min}
        max={isPercentage ? max * 100 : max}
        onChange={(e) => setTempText(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white text-slate-800 border-2 border-ou-blue rounded shadow-sm focus:outline-none"
      />
    );
  }

  const displayText = isPercentage
    ? `${Math.round(value * 100)} %`
    : `${displayPrefix}${value.toFixed(decimals)}${displaySuffix}`;

  return (
    <span
      onDoubleClick={handleStartEdit}
      title="Dvojklik pro ruční přepsání z klávesnice"
      className={`cursor-pointer hover:bg-slate-200/80 px-1 py-0.5 rounded transition select-none font-mono font-bold ${className}`}
    >
      {displayText}
    </span>
  );
};
