import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar, FaUser, FaSignOutAlt, FaListAlt, FaTruck } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import app from './Firebase';
import './Navbar.css';

const auth = getAuth(app);

const Navbar = ({ currentUser, userEmail, setCurrentUser, setUserEmail }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser("");
      setUserEmail("");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaCar className="logo-icon" />
          <span>ClickNDrive</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">
            <FaCar className="nav-icon" />
            <span>Browse Cars</span>
          </Link>
          <Link to="/add-car" className="nav-link">
            <FaCar className="nav-icon" />
            <span>Add Your Car</span>
          </Link>
          <Link to="/rent-requests" className="nav-link">
            <FaListAlt className="nav-icon" />
            <span>Rent Requests</span>
          </Link>
          <Link to="/driver-requests" className="nav-link">
            <FaTruck className="nav-icon" />
            <span>Driver Requests</span>
          </Link>
        </div>

        <div className="navbar-user">
          {currentUser ? (
            <div className="user-menu">
              {/* <div className="user-info">
                <span className="user-email">{userEmail}</span>
              </div> */}
              <button onClick={handleSignOut} className="sign-out-btn">
                <FaSignOutAlt className="sign-out-icon" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
