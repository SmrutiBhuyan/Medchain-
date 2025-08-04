import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../pages/AuthContext";
import { 
 FaPills

} from 'react-icons/fa';
import "./Header.css";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Verify Medicine", href: "/verify-drug" },
    { name: "Find Medicine", href: "/find-medicine" },
    { name: "Need Help?", href: "/chatbot" },
    { name: "Report", href: "/report" },
    { name: "About", href: "/about" },
  ];

  const roleBasedNavigation = {
    manufacturer: [
      { name: "Production", href: "/manufacturer/production" },
      { name: "Batch Tracking", href: "/manufacturer/batches" }
    ],
    distributor: [
      { name: "Shipments", href: "/distributor/shipments" },
      { name: "Inventory", href: "/distributor/inventory" }
    ],
    wholesaler: [
      { name: "Orders", href: "/wholesaler/orders" },
      { name: "Warehouse", href: "/wholesaler/warehouse" }
    ],
    retailer: [
      { name: "Sales", href: "/retailer/sales" },
      { name: "Stock", href: "/retailer/stock" }
    ],
    pharmacy: [
      { name: "Prescriptions", href: "/pharmacy/prescriptions" },
      { name: "Inventory", href: "/pharmacy/inventory" }
    ],
    admin: [
      { name: "Dashboard", href: "/admin/dashboard" },
      { name: "Users", href: "/admin/users" },
      { name: "Approvals", href: "/admin/approvals" }
    ]
  };

  const isActive = (href) => location.pathname === href;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return <div className="header-loading">Loading...</div>;
  }

  return (
    <header className="header1">
      <div className="header-container">
          {/* Enhanced Logo Section */}
        <div className="header-content">
          <Link to="/" className="logo-link">
            <FaPills className="logo-icon" />
            <span className="logo-text">MedChain</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Role-based navigation for authenticated users */}
            {user && user?.role && roleBasedNavigation[user.role]?.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="auth-buttons">
            {user ? (
              <div className="user-menu">
                <span className="welcome-message">
                  Welcome, {user?.name} ({user?.role})
                </span>
                
                {/* Role-specific panels */}
                {user?.role === "admin" && (
                  <Link to="/admin/dashboard">
                    <button className="panel-button">
                      Admin Panel
                    </button>
                  </Link>
                )}
                {user?.role === "pharmacy" && (
                  <Link to="/pharmacy/dashboard">
                    <button className="panel-button">
                      Pharmacy Panel
                    </button>
                  </Link>
                )}
                {user?.role === "manufacturer" && (
                  <Link to="/manufacturer/dashboard">
                    <button className="panel-button">
                      Manufacturer Panel
                    </button>
                  </Link>
                )}
                {user?.role === "distributor" && (
                  <Link to="/distributor/dashboard">
                    <button className="panel-button">
                      Distributor Panel
                    </button>
                  </Link>
                )}
                
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <button className="login-button">
                    Login
                  </button>
                </Link>
                <Link to="/select-role">
                  <button className="register-button">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="mobile-menu-button">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="menu-toggle"
            >
              {mobileMenuOpen ? (
                <X className="menu-icon" />
              ) : (
                <Menu className="menu-icon" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          <div className="mobile-nav-content">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`mobile-nav-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Role-based mobile navigation */}
            {user && user?.role && roleBasedNavigation[user.role]?.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`mobile-nav-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div className="mobile-auth-buttons">
              {user ? (
                <div className="mobile-user-menu">
                  <div className="mobile-welcome-message">
                    Welcome, {user?.name} ({user?.role})
                  </div>
                  
                  {/* Mobile role-specific panels */}
                  {user?.role === "admin" && (
                    <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <button className="mobile-panel-button">
                        Admin Panel
                      </button>
                    </Link>
                  )}
                  {user?.role === "pharmacy" && (
                    <Link to="/pharmacy/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <button className="mobile-panel-button">
                        Pharmacy Panel
                      </button>
                    </Link>
                  )}
                  {user?.role === "manufacturer" && (
                    <Link to="/manufacturer/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <button className="mobile-panel-button">
                        Manufacturer Panel
                      </button>
                    </Link>
                  )}
                  
                  <button onClick={handleLogout} className="mobile-logout-button">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-options">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="mobile-login-button">
                      Login
                    </button>
                  </Link>
                  <Link to="/select-role" onClick={() => setMobileMenuOpen(false)}>
                    <button className="mobile-register-button">
                      Get Started
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}