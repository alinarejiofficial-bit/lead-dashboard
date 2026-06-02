import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Send, Lock } from 'lucide-react';
import './LeadForm.css';

// Custom inline SVG logo matching the mockup (LeadFlow upward chart)
const LogoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="13" width="3.5" height="7" rx="1" fill="#1253e2" />
    <rect x="8.5" y="8" width="3.5" height="12" rx="1" fill="#1253e2" />
    <rect x="14" y="3" width="3.5" height="17" rx="1" fill="#1253e2" />
    <path d="M4 14.5L9.5 9L15 3.5L20 3.5" stroke="#1253e2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.5 3.5H20V7" stroke="#1253e2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// High-fidelity checklist vector illustration for the left panel
const ChecklistIllustration = () => (
  <svg viewBox="0 0 320 220" width="100%" height="auto" className="illustration-svg" xmlns="http://www.w3.org/2000/svg">
    <circle cx="160" cy="120" r="75" fill="#e0ebff" opacity="0.8" />
    
    <circle cx="260" cy="65" r="3" fill="#cbd5e1" />
    <circle cx="275" cy="80" r="1.5" fill="#cbd5e1" />
    <circle cx="55" cy="155" r="3.5" fill="#cbd5e1" />
    
    <rect x="90" y="35" width="100" height="135" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
    
    <path d="M125 35 C125 31.6863 127.686 29 131 29 H149 C152.314 29 155 31.6863 155 35 V40 H125 V35 Z" fill="#3b82f6" />
    <circle cx="140" cy="34" r="2.5" fill="#ffffff" />
    
    <path d="M102 58 L105 61 L112 54" stroke="#1253e2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="120" y="54" width="45" height="4" rx="2" fill="#cbd5e1" />
    <rect x="120" y="61" width="25" height="3" rx="1.5" fill="#e2e8f0" />
    
    <path d="M102 78 L105 81 L112 74" stroke="#1253e2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="120" y="74" width="55" height="4" rx="2" fill="#cbd5e1" />
    <rect x="120" y="81" width="35" height="3" rx="1.5" fill="#e2e8f0" />
    
    <path d="M102 98 L105 101 L112 94" stroke="#1253e2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="120" y="94" width="50" height="4" rx="2" fill="#cbd5e1" />
    <rect x="120" y="101" width="30" height="3" rx="1.5" fill="#e2e8f0" />

    <path d="M102 118 L105 121 L112 114" stroke="#1253e2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="120" y="114" width="40" height="4" rx="2" fill="#cbd5e1" />
    <rect x="120" y="121" width="20" height="3" rx="1.5" fill="#e2e8f0" />
    
    <path d="M54 135 L58 152 C58.5 154.5 60.5 156 63 156 H71 C73.5 156 75.5 154.5 76 152 L80 135 H54 Z" fill="#0d224d" />
    <path d="M67 135 V105" stroke="#0d224d" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M67 128 C57 128 52 118 56 112 C60 106 67 118 67 128 Z" fill="#3b82f6" />
    <path d="M67 124 C77 124 82 114 78 108 C74 102 67 114 67 124 Z" fill="#1253e2" />
    <path d="M67 115 C58 115 54 105 58 99 C62 93 67 105 67 115 Z" fill="#1253e2" />
    <path d="M67 110 C76 110 80 100 76 94 C72 88 67 100 67 110 Z" fill="#3b82f6" />
    <path d="M67 105 C67 95 62 90 67 85 C72 90 67 95 67 105 Z" fill="#1253e2" />

    <g filter="drop-shadow(0px 8px 16px rgba(18, 83, 226, 0.2))">
      <rect x="155" y="115" width="105" height="65" rx="6" fill="#1253e2" />
      <path d="M155 115 L207.5 145 L260 115 Z" fill="#0d42b9" opacity="0.9" />
      <path d="M155 115 L200 150 L155 180 Z" fill="#1e3a8a" opacity="0.1" />
      <path d="M260 115 L215 150 L260 180 Z" fill="#1e3a8a" opacity="0.1" />
      <path d="M155 180 L207.5 145 L260 180 Z" fill="#0b3cb1" />
    </g>
  </svg>
);

const LeadForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/leads/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form to backend');
      }

      const data = await response.json();
      console.log('Form submitted successfully:', data);
      alert('Form submitted successfully!');
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Failed to submit details. Please make sure the backend server is running and try again.');
    }
  };

  return (
    <div className="lead-form-wrapper">
      <div className="lead-form-card">
        {/* Left Info Panel */}
        <div className="left-panel">
          <div className="logo-container">
            <span className="logo-icon">
              <LogoIcon />
            </span>
            <span className="logo-text">Connect<span>Flow</span></span>
          </div>

          <div className="heading-section">
            <h1>Get in Touch With Us</h1>
            <div className="accent-line"></div>
            <p>Fill out the form and our team will get back to you as soon as possible.</p>
          </div>

          <div className="illustration-container">
            <ChecklistIllustration />
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="right-panel">
          <div className="form-header-container">
            <h2>Contact Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="lead-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name">
                Full Name <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
                <div className="input-icon">
                  <User size={18} />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email address"
                />
                <div className="input-icon">
                  <Mail size={18} />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter your phone number"
                />
                <div className="input-icon">
                  <Phone size={18} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">
                Address <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter your address"
                />
                <div className="input-icon">
                  <MapPin size={18} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              <span className="submit-icon">
                <Send size={16} />
              </span>
              Submit Details
            </button>
          </form>


          {/* Privacy Note */}
          <div className="privacy-note">
            <span className="lock-icon">
              <Lock size={14} />
            </span>
            Your information is safe with us. We will never share your data.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
