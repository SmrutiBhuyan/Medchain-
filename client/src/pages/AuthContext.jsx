import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get("http://localhost:5000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data) {
            setUser(response.data);
            redirectUser(response.data);
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        setAuthError(error.response?.data?.message || "Authentication error");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

const redirectUser = (userData) => {
  if (!userData) return;
  
  // Admin users should always be able to access their dashboard
  if (userData.role === 'admin') {
    navigate('/admin/dashboard');
    return;
  }
  
  // For non-admin users, check approval status
  if (userData.status !== 'approved') {
    navigate('/pending-approval');
    return;
  }
  
  // Common dashboard for all approved non-admin users
  navigate(`/${userData.role}/dashboard`);
};
  const login = async (credentials) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const response = await axios.post("http://localhost:5000/api/auth/login", credentials);
      console.log(response);
      
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      redirectUser(response.data.user);
      
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.response?.data?.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const response = await axios.post("http://localhost:5000/api/auth/register", userData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      setUser(response.data.user);
      
      if (response.data.user.status === 'approved') {
        redirectUser(response.data.user);
      } else {
        navigate('/pending-approval');
      }
      
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      setAuthError(error.response?.data?.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      authError,
      login, 
      logout, 
      register,
      setAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}