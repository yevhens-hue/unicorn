import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import ExportDropdown from './ExportDropdown';

describe('ExportDropdown Component', () => {
  test('renders export trigger button', () => {
    render(<ExportDropdown title="Export Leads" />);
    expect(screen.getByRole('button', { name: /Export Leads/i })).toBeInTheDocument();
  });

  test('opens dropdown menu on click and lists format options', () => {
    const handleCsv = vi.fn();
    const handleExcel = vi.fn();

    render(
      <ExportDropdown
        title="Export Leads"
        onExportCsv={handleCsv}
        onExportExcel={handleExcel}
      />
    );

    const trigger = screen.getByRole('button', { name: /Export Leads/i });
    fireEvent.click(trigger);

    expect(screen.getByText(/CSV File \(\.csv\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel \(\.xlsx\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/CSV File \(\.csv\)/i));
    expect(handleCsv).toHaveBeenCalledTimes(1);
  });
});
