import React from 'react';

const formatPhoneNumber = (value) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

const PhoneInput = ({ value, onChange, error }) => {
  const handleChange = (e) => {
    // Only pass raw numbers up to the parent
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    if (rawValue.length <= 10) {
      onChange(rawValue);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <input
        type="text"
        role="textbox"
        placeholder="(555) 555-5555"
        value={formatPhoneNumber(value)}
        onChange={handleChange}
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          border: error ? '1px solid red' : '1px solid #ccc',
          fontSize: '16px',
          outline: 'none',
          backgroundColor: '#fff',
          color: '#333'
        }}
      />
      {error && <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
    </div>
  );
};

export default PhoneInput;
