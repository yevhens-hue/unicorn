import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, describe } from 'vitest'
import B2CFunnel from './B2CFunnel'

describe('B2CFunnel Component', () => {
  test('renders hero section with ZIP input', () => {
    render(<B2CFunnel />)
    expect(screen.getByPlaceholderText(/Enter your ZIP code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Get Quotes/i })).toBeInTheDocument()
  })

  test('advances to vertical selection when valid ZIP is entered', () => {
    render(<B2CFunnel />)
    const input = screen.getByPlaceholderText(/Enter your ZIP code/i)
    fireEvent.change(input, { target: { value: '90210' } })
    
    const button = screen.getByRole('button', { name: /Get Quotes/i })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)

    expect(screen.getByText(/What type of project is this/i)).toBeInTheDocument()
  })
})
