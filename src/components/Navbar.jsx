import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaCar, FaUser, FaSignOutAlt, FaListAlt, FaTruck, FaRobot } from 'react-icons/fa';
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

  const handleHelpClick = () => {
    // Dispatch a custom event that Chatbot will listen for
    window.dispatchEvent(new CustomEvent('toggleChatbot'));
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaCar className="logo-icon" />
          <span>ClickNDrive</span>
        </Link>

        <div className="navbar-links">
          {currentUser && (
            <NavLink to="/profile" className="nav-link">
              <FaUser />
              <span>Profile</span>
            </NavLink>
          )}
          <Link to="/" className="nav-link">
            <FaCar className="nav-icon" />
            <span>Browse Cars</span>
          </Link>
          {currentUser && (
            <>
              <Link to="/add-car" className="nav-link">
                <FaCar className="nav-icon" />
                <span>Add Car</span>
              </Link>
              <NavLink to="/my-cars" className="nav-link">
                <FaCar />
                <span>My Cars</span>
              </NavLink>
              <NavLink to="/delivery-partner" className="nav-link">
                <FaTruck />
                <span>Be Partner</span>
              </NavLink>
              <button className="nav-link help-button" onClick={handleHelpClick}>
                <FaRobot />
                <span>Get Help</span>
              </button>
            </>
          )}
        </div>

        <div className="navbar-user">
          {currentUser ? (
            <button onClick={handleSignOut} className="sign-out-btn">
              <FaSignOutAlt className="sign-out-icon" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link to="/login" className="login-btn">
              <FaUser className="login-icon" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
