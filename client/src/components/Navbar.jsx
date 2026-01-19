import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="navbar-content">
        <h1>TruckingHub</h1>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/jobs">Jobs</Link>
          {(user?.role === 'dispatcher' || user?.role === 'shipper') && (
            <Link to="/jobs/create">Post Job</Link>
          )}
        </nav>
        <div>
          <span style={{ marginRight: '1rem', color: 'white' }}>
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
