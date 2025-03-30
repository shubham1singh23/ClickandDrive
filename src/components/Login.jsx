// Auth.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import app from './Firebase'; // Import the Firebase app instance from your file
import './Login.css';

// Use the Firebase app that's already initialized
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const Login = (props) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        props.setCurrentUser(currentUser.uid);
        props.setUserEmail(currentUser.email);
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, props]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        props.setCurrentUser(userCredential.user.uid);
        props.setUserEmail(userCredential.user.email);
        navigate('/');
      } else {
        // Handle signup
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        props.setCurrentUser(userCredential.user.uid);
        props.setUserEmail(userCredential.user.email);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      props.setCurrentUser(result.user.uid);
      props.setUserEmail(result.user.email);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      props.setCurrentUser("");
      props.setUserEmail("");
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div className="auth-container">
        <div className="auth-form-container welcome-container">
          <h2>Welcome!</h2>
          <p>You are logged in as: {user.email}</p>
          <button onClick={handleSignOut} className="auth-button">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="form-toggle">
          <button
            className={`toggle-button ${isLogin ? 'active' : ''}`}
            onClick={() => isLogin ? null : toggleForm()}
          >
            Login
          </button>
          <button
            className={`toggle-button ${!isLogin ? 'active' : ''}`}
            onClick={() => !isLogin ? null : toggleForm()}
          >
            Sign Up
          </button>
        </div>

        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="google-button"
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v3.2h5.59c-0.56,2.37-2.34,3.68-5.59,3.68c-3.35,0-6.07-2.72-6.07-6.08 s2.72-6.08,6.07-6.08c1.71,0,3.26,0.56,4.48,1.69l2.37-2.37C17.56,3.86,15.07,3,12,3C7.04,3,3,7.04,3,12c0,4.96,4.04,9,9,9 c4.93,0,8.28-3.56,8.28-8.55C20.28,11.94,20.93,11.1,21.35,11.1z" fill="#EA4335" />
              <path d="M3,9l3.33,2.3l4.67-4C8.55,5.37,5.55,5.1,3,9z" fill="#FBC02D" />
              <path d="M12,20.95c2.77,0,5.16-0.91,6.94-2.48l-3.38-2.63C14.4,16.73,13.27,17.3,12,17.3 c-3.19,0-5.91-2.06-6.88-4.91L1.44,14.91C3.21,18.35,7.23,20.95,12,20.95z" fill="#34A853" />
              <path d="M21.35,11.1H12v3.2h5.59c-0.27,1.15-0.84,2.05-1.59,2.65l3.38,2.63c1.97-1.85,3.08-4.56,3.08-7.79 c0-0.5-0.05-1.01-0.15-1.51C22.04,10.89,21.71,11.1,21.35,11.1z" fill="#4285F4" />
            </g>
          </svg>
          Continue with Google
        </button>

        <p className="form-footer">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="text-button"
            onClick={toggleForm}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;