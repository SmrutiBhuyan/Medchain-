import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PendingApproval() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.status === 'approved') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="pending-approval">
      <h2>Your account is pending approval</h2>
      <p>
        Thank you for registering. Your account is currently under review by our 
        admin team. You'll receive an email notification once your account is approved.
      </p>
    </div>
  );
}