import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportDropdown({
  onExportCsv,
  onExportExcel,
  onExportGoogleSheets,
  title = "Export",
  filteredCount = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (exportFn) => {
    setIsOpen(false);
    if (exportFn) exportFn();
  };

  return (
    <div className="export-dropdown-wrapper" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn-export-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          padding: '8px 14px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <Download size={15} />
        <span>{title}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          className="export-menu-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 1000,
            minWidth: '220px',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Choose Export Format
          </div>

          <button
            type="button"
            onClick={() => handleSelect(onExportCsv)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileText size={16} color="#60a5fa" />
            <div>
              <div style={{ fontWeight: 600 }}>CSV File (.csv)</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Comma-separated text</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(onExportExcel)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileSpreadsheet size={16} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600 }}>Excel (.xlsx)</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Microsoft Excel format</div>
            </div>
          </button>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

          <button
            type="button"
            onClick={() => handleSelect(onExportGoogleSheets)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '15px' }}>🟢</span>
            <div>
              <div style={{ fontWeight: 600 }}>Google Sheets</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Copy TSV & open sheets.new</div>
            </div>
          </button>

          {filteredCount !== null && (
            <div style={{ padding: '6px 10px 2px 10px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
              Exporting {filteredCount} {filteredCount === 1 ? 'row' : 'rows'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
