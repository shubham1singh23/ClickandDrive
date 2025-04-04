import './App.css'
import Login from './components/Login'
import AddCar from './components/Addcar'
import Home from './components/Home'
import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
// import RentRequests from './components/RentRequests'
// import DriverRequests from './components/DriverRequests'
import ChatBot from './components/Chatbot'
import MyCar from './components/MyCar'
import DriverRequests from './components/DriverRequests'
import Profile from './components/Profile'

function App() {
  const [currentUser, setCurrentUser] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [globalFilters, setGlobalFilters] = useState(null);

  const handleFilterUpdate = (filters) => {
    setGlobalFilters(filters);
  };

  return (
    <Router>
      <div className="app">
        <Navbar
          currentUser={currentUser}
          userEmail={userEmail}
          setCurrentUser={setCurrentUser}
          setUserEmail={setUserEmail}
        />
        <div className={`content ${currentUser ? 'with-navbar' : ''}`}>
          <Routes>
            <Route path="/login" element={
              currentUser ? <Navigate to="/" /> : <Login setCurrentUser={setCurrentUser} setUserEmail={setUserEmail} />
            } />
            <Route path="/" element={<Home currentUser={currentUser} userEmail={userEmail} suggestedFilters={globalFilters} />} />
            <Route path="/add-car" element={
              currentUser ? <AddCar currentUser={currentUser} userEmail={userEmail} /> : <Navigate to="/login" />
            } />
            <Route path="/my-cars" element={
              currentUser ? <MyCar currentUser={currentUser} /> : <Navigate to="/login" />
            } />
            <Route path="/delivery-partner" element={
              currentUser ? <DriverRequests currentUser={currentUser} userEmail={userEmail} /> : <Navigate to="/login" />
            } />
            <Route path="/profile" element={
              currentUser ? <Profile currentUser={currentUser} userEmail={userEmail} /> : <Navigate to="/login" />
            } />
          </Routes>
        </div>
        {currentUser && <ChatBot userEmail={userEmail} onFilterUpdate={handleFilterUpdate} />}
      </div>
    </Router>
  )
}

export default App;