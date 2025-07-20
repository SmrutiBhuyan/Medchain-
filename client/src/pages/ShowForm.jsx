import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ShowForm.css';
import { useAuth } from './AuthContext';

const DOCUMENT_REQUIREMENTS = {
  manufacturer: [
    { name: 'Drug Manufacturing License (Form 25/26)', key: 'manufacturing_license', accepted: ['pdf', 'jpg', 'png'] },
    { name: 'GST Registration Certificate', key: 'gst_certificate', accepted: ['pdf'] },
    { name: 'Company PAN Card', key: 'company_pan', accepted: ['pdf', 'jpg'] }
  ],
  distributor: [
    { name: 'Wholesale Drug License (Form 20B/21B)', key: 'wholesale_license', accepted: ['pdf'] },
    { name: 'Company PAN Card', key: 'company_pan', accepted: ['pdf', 'jpg'] },
    { name: 'GST Registration Certificate', key: 'gst_certificate', accepted: ['pdf'] }
  ],
  wholesaler: [
    { name: 'Wholesale Drug License (Form 20B/21B)', key: 'wholesaler_license', accepted: ['pdf'] },
    { name: 'Drug Control Department Approval', key: 'drug_control_approval', accepted: ['pdf', 'jpg'] },
    { name: 'GST Registration Certificate', key: 'gst_certificate', accepted: ['pdf'] }
  ],
  retailer: [
    { name: 'Retail Drug License (Form 20/21)', key: 'retail_license', accepted: ['pdf'] },
    { name: 'Pharmacist Registration Certificate', key: 'pharmacist_certificate', accepted: ['pdf'] },
    { name: 'Shop and Establishment Certificate', key: 'shop_certificate', accepted: ['pdf'] }
  ],
  pharmacy: [
    { name: 'Retail Drug License (Form 20/21)', key: 'retail_license', accepted: ['pdf'] },
    { name: 'Pharmacist Registration Certificate', key: 'pharmacist_certificate', accepted: ['pdf'] }
  ],
  public: [
    { name: 'Aadhaar Card (Optional)', key: 'aadhaar_card', accepted: ['pdf', 'jpg'] }
  ]
};

export default function ShowForm({ role }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    walletAddress: '',
    organization: '',
    location: '',
    password: '',
    confirmPassword: ''
  });
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleFile = (e, key) => {
    setFiles(prev => ({ ...prev, [key]: e.target.files[0] }));
  };

 
 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  try {
    const formDataToSend = new FormData();
    
    // Append all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'confirmPassword') {
        formDataToSend.append(key, value);
      }
    });
    
    // Append files
    Object.entries(files).forEach(([key, file]) => {
      formDataToSend.append(key, file);
      formDataToSend.append(`${key}_name`, DOCUMENT_REQUIREMENTS[role].find(d => d.key === key).name);
    });
    
    // Append role
    formDataToSend.append('role', role);
    
    // Register user
    await register(formDataToSend);
    
    // The AuthContext will handle the redirection based on user status
  } catch (error) {
    setError(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  if (!role) return <p>Please select a role first.</p>;

  const requiresWallet = ['manufacturer', 'distributor', 'pharmacy'].includes(role);

  return (
    <form className="role-form" onSubmit={handleSubmit}>
      <h2>Register as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>

      {error && <div className="error-message">{error}</div>}

      <input 
        name="name" 
        placeholder="Full Name" 
        value={formData.name}
        onChange={handleChange} 
        required 
      />
      <input 
        name="email" 
        type="email" 
        placeholder="Email" 
        value={formData.email}
        onChange={handleChange} 
        required 
      />
      <input 
        name="phone" 
        type="tel" 
        placeholder="Phone" 
        value={formData.phone}
        onChange={handleChange} 
        required 
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
        minLength="6"
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        minLength="6"
      />

      {requiresWallet && (
        <input
          name="walletAddress"
          placeholder="Blockchain Wallet Address"
          value={formData.walletAddress}
          onChange={handleChange}
          required
        />
      )}

      <input
        name="organization"
        placeholder="Organization Name"
        value={formData.organization}
        onChange={handleChange}
        required={role !== 'public'}
      />
      <input
        name="location"
        placeholder="Location"
        value={formData.location}
        onChange={handleChange}
        required={role !== 'public'}
      />

      {DOCUMENT_REQUIREMENTS[role]?.map(doc => (
        <div key={doc.key} className="file-group">
          <label>{doc.name}</label>
          <div className="file-input-container">
            <input
              type="file"
              accept={doc.accepted.map(ext => `.${ext}`).join(',')}
              onChange={(e) => handleFile(e, doc.key)}
              required={doc.key !== 'aadhaar_card'}
            />
            <div className="file-input-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 16C5.9 16 5 16.9 5 18C5 19.1 5.9 20 7 20C8.1 20 9 19.1 9 18C9 16.9 8.1 16 7 16ZM17 16C15.9 16 15 16.9 15 18C15 19.1 15.9 20 17 20C18.1 20 19 19.1 19 18C19 16.9 18.1 16 17 16ZM19 10H17.17L13.26 6.1C13.09 5.93 12.86 5.83 12.62 5.83H12.61C12.36 5.83 12.13 5.93 11.96 6.1L7.1 11H19V10ZM7 18C7 18.55 7.45 19 8 19C8.55 19 9 18.55 9 18V18C9 17.45 8.55 17 8 17C7.45 17 7 17.45 7 18V18ZM5.11 12L8 9.19L11.59 13H5.11V12ZM17 18C17 18.55 17.45 19 18 19C18.55 19 19 18.55 19 18V18C19 17.45 18.55 17 18 17C17.45 17 17 17.45 17 18V18ZM20 9H14.5L12.5 7H4V17H6.1C6.24 17.72 6.69 18.35 7.34 18.71C7.27 18.8 7.21 18.89 7.16 19H4C2.9 19 2 18.1 2 17V7C2 5.9 2.9 5 4 5H12.5L14.5 7H20C21.1 7 22 7.9 22 9V17C22 17.36 21.9 17.7 21.71 18C21.53 18.3 21.28 18.56 20.97 18.74C20.72 18.89 20.44 19 20.15 19H20V9Z" fill="currentColor"/>
              </svg>
              <span className="file-input-text">Click to upload or drag and drop</span>
              <span className="file-input-hint">{doc.accepted.map(ext => ext.toUpperCase()).join(', ')} files accepted</span>
            </div>
            {files[doc.key] && (
              <div className="file-selected">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '4px'}}>
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                </svg>
                {files[doc.key].name}
              </div>
            )}
          </div>
        </div>
      ))}

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Submit'}
      </button>

      {role !== 'public' && (
        <div className="registration-note">
          <p>Note: Your registration will be reviewed by an administrator before you can access the system.</p>
          <p>You'll receive an email notification once your account is approved.</p>
        </div>
      )}
    </form>
  );
}