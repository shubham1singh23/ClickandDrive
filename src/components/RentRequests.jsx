import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import app from './Firebase';
import './RentRequests.css';
import { FaCar, FaUser, FaCalendarAlt, FaClock, FaCheck, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';

const RentRequests = ({ currentUser, userEmail }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = () => {
      const database = getDatabase(app);
      const requestsRef = ref(database, 'rentRequests');

      onValue(requestsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const requestsArray = Object.entries(data).map(([id, details]) => ({
            id,
            ...details
          }));

          // Enhanced filtering logic to check both ID and email fields
          const userRequests = requestsArray.filter(request =>
            // Check for owner by ID
            request.carOwnerId === currentUser ||
            // Check for owner by email
            request.ownerEmail === userEmail ||
            // Check for renter by ID
            request.renterId === currentUser ||
            // Check for renter by email
            request.renterEmail === userEmail
          );

          setRequests(userRequests);
        } else {
          setRequests([]);
        }
        setLoading(false);
      });
    };

    fetchRequests();
  }, [currentUser, userEmail]); // Added userEmail to dependencies

  const handleRequestAction = async (requestId, action) => {
    const database = getDatabase(app);
    const requestRef = ref(database, `rentRequests/${requestId}`);

    try {
      await update(requestRef, {
        status: action,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Error updating request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="rent-requests-container">
      <h1>Rent Requests</h1>

      {requests.length === 0 ? (
        <div className="no-requests">
          <FaCar className="no-requests-icon" />
          <h2>No Rent Requests</h2>
          <p>You don't have any active rent requests.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div className="request-type">
                  {request.carOwnerId === currentUser || request.ownerEmail === userEmail ? (
                    <span className="incoming">Incoming Request</span>
                  ) : (
                    <span className="outgoing">Your Request</span>
                  )}
                </div>
                <div className="request-status">
                  <span className={`status ${request.status}`}>{request.status}</span>
                </div>
              </div>

              <div className="request-details">
                <div className="car-info">
                  <FaCar className="icon" />
                  <div>
                    <h3>{request.carBrand} {request.carModel}</h3>
                    <p>{request.carType}</p>
                  </div>
                </div>

                <div className="user-info">
                  <FaUser className="icon" />
                  <div>
                    <h3>{(request.carOwnerId === currentUser || request.ownerEmail === userEmail)
                      ? request.renterEmail
                      : request.ownerEmail}</h3>
                    <p>{(request.carOwnerId === currentUser || request.ownerEmail === userEmail)
                      ? 'Renter'
                      : 'Car Owner'}</p>
                  </div>
                </div>

                <div className="booking-info">
                  <FaCalendarAlt className="icon" />
                  <div>
                    <h3>Booking Date</h3>
                    <p>{new Date(request.bookingDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pickup-info">
                  <FaClock className="icon" />
                  <div>
                    <h3>Pickup Time</h3>
                    <p>{request.pickupTime}</p>
                  </div>
                </div>

                <div className="duration-info">
                  <FaMapMarkerAlt className="icon" />
                  <div>
                    <h3>Duration</h3>
                    <p>{request.duration} hours</p>
                  </div>
                </div>
              </div>

              {request.status === 'pending' && (request.carOwnerId === currentUser || request.ownerEmail === userEmail) && (
                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleRequestAction(request.id, 'accepted')}
                  >
                    <FaCheck /> Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleRequestAction(request.id, 'rejected')}
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentRequests;