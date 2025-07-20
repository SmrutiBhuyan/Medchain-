import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 10,
    approvedUsers: 0,
    pendingUsers: 0
  });

  
  useEffect(() => {
   
    const fetchData = async () => {
      try{
        const res = await fetch('http://localhost:5000/api/users/pending');
        const data = await res.json();
        setPendingUsers(data);
        setStats(prev=>(
          {
            ...prev,pendingUsers:data.length
          }
        ))}
        catch(error){
          console.error('Failed to fetch pending users:',error);
          
        }
      }
      
       
     
  
    
    fetchData();
  }, []);

  const handleApprove = (userId) => {
   try{
    const res = fetch(`http://localhost:5000/api/users/${userId}/approve`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'}
    });
    if(res.ok){
      setPendingUsers(prev=>prev.filter(u=>u._id != userId));
      alert(`User ${userId} approved`);
    }
   else {
      console.error('Failed to Approve users');
    }
  }
   catch(err){
console.error('Approve failed:', err);
   }
  };

 const handleReject = async (userId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/users/${userId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      alert(`User ${userId} rejected`);
    } else {
      console.error(await res.json());
    }
  } catch (err) {
    console.error('Reject failed:', err);
  }
};

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, Admin</span>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <nav>
            <ul>
              <li className="active"><a href="#">Dashboard</a></li>
              <li><a href="#">Users</a></li>
              <li><a href="#">Transactions</a></li>
              <li><a href="#">Reports</a></li>
              <li><a href="#">Settings</a></li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <section className="stats-section">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-value">{stats.totalUsers}</p>
              <p className="stat-label">All registered users</p>
            </div>
            <div className="stat-card">
              <h3>Approved Users</h3>
              <p className="stat-value">{stats.approvedUsers}</p>
              <p className="stat-label">Active accounts</p>
            </div>
            <div className="stat-card">
              <h3>Pending Approval</h3>
              <p className="stat-value">{stats.pendingUsers}</p>
              <p className="stat-label">Awaiting review</p>
            </div>
          </section>

          <section className="pending-users-section">
            <h2>Pending Approvals</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.length > 0 ? (
                    pendingUsers.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                        <td>{user.createdAt}</td>
                        <td className="actions">
                          <button 
                            onClick={() => handleApprove(user._id)} 
                            className="approve-btn"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(user._id)} 
                            className="reject-btn"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-pending">
                        No pending approvals at this time
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}