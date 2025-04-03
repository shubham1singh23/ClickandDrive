import './App.css'
import Login from './components/Login'
import AddCar from './components/Addcar'
import Home from './components/Home'
import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import RentRequests from './components/RentRequests'
import DriverRequests from './components/DriverRequests'
import ChatBot from './components/Chatbot'
function App() {
  const [currentUser, setCurrentUser] = useState("");
  const [userEmail, setUserEmail] = useState("");

  return (
    <Router>
      <div className="app">
        {currentUser && <Navbar
          currentUser={currentUser}
          userEmail={userEmail}
          setCurrentUser={setCurrentUser}
          setUserEmail={setUserEmail}
        />}
        <div className={`content ${currentUser ? 'with-navbar' : ''}`}>
          <Routes>
            <Route
              path="/login"
              element={
                currentUser ?
                  <Navigate to="/" /> :
                  <Login setCurrentUser={setCurrentUser} setUserEmail={setUserEmail} />
              }
            />
            <Route
              path="/"
              element={
                currentUser ?
                  <Home currentUser={currentUser} userEmail={userEmail} /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/home"
              element={
                currentUser ?
                  <Navigate to="/" /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/add-car"
              element={
                currentUser ?
                  <AddCar currentUser={currentUser} userEmail={userEmail} /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/rent-requests"
              element={
                currentUser ?
                  <RentRequests currentUser={currentUser} userEmail={userEmail} /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/driver-requests"
              element={
                currentUser ?
                  <DriverRequests currentUser={currentUser} userEmail={userEmail} /> :
                  <Navigate to="/login" />
              }
            />
          </Routes>
        </div>

        {/* ChatBot will only be visible when user is logged in */}
        {currentUser && <ChatBot userEmail={userEmail} />}
      </div>
    </Router>
  )
}

export default App