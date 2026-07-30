import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test, describe } from 'vitest'
import AdminPortal from './AdminPortal'

describe('AdminPortal Component', () => {
  test('renders the admin dashboard header', () => {
    render(<AdminPortal />)
    expect(screen.getByText(/Unicorn Admin/i)).toBeInTheDocument()
  })

  test('renders navigation tabs', () => {
    render(<AdminPortal />)
    expect(screen.getAllByText(/Leads/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Buyers/i)).toBeInTheDocument()
  })
})
