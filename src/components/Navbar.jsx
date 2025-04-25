import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaCar, FaUser, FaSignOutAlt, FaListAlt, FaTruck, FaRobot, FaBars, FaTimes } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import app from './Firebase';
import './Navbar.css';

const auth = getAuth(app);

const Navbar = ({ currentUser, userEmail, setCurrentUser, setUserEmail }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <FaCar className="logo-icon" />
          <span>ClickNDrive</span>
        </Link>

        <button className="mobile-menu-button" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`navbar-links ${isMenuOpen ? 'show' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>
            <FaCar className="nav-icon" />
            <span>Browse Cars</span>
          </Link>
          {currentUser && (
            <>
              <NavLink to="/profile" className="nav-link" onClick={closeMenu}>
                <FaUser />
                <span>Profile</span>
              </NavLink>
              <Link to="/add-car" className="nav-link" onClick={closeMenu}>
                <FaCar className="nav-icon" />
                <span>Add Car</span>
              </Link>
              <NavLink to="/my-cars" className="nav-link" onClick={closeMenu}>
                <FaCar />
                <span>My Cars</span>
              </NavLink>
              <NavLink to="/delivery-partner" className="nav-link" onClick={closeMenu}>
                <FaTruck />
                <span>Be Partner</span>
              </NavLink>
              <button className="nav-link help-button" onClick={() => { handleHelpClick(); closeMenu(); }}>
                <FaRobot />
                <span>Get Help</span>
              </button>
            </>
          )}
        </div>

        <div className="navbar-user">
          {currentUser ? (
            <button onClick={() => { handleSignOut(); closeMenu(); }} className="sign-out-btn">
              <FaSignOutAlt className="sign-out-icon" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link to="/login" className="login-btn" onClick={closeMenu}>
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
