import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import app from './Firebase';
import './DriverRequests.css';
import { FaCar, FaUser, FaCalendarAlt, FaClock, FaCheck, FaMapMarkerAlt, FaFilter, FaPhoneAlt } from 'react-icons/fa';
import { MdLocationOn, MdOutlineSchedule } from 'react-icons/md';

const DriverRequests = ({ currentUser, userEmail }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Function to generate a random phone number
  const generatePhoneNumber = () => {
    const prefix = "+91";
    const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
    return `${prefix} ${randomNum}`;
  };

  // Function to calculate driver arrival time (1 hour before pickup time)
  const calculateDriverArrivalTime = (pickupTime) => {
    const [hours, minutes] = pickupTime.split(':').map(Number);
    let arrivalHours = hours - 1;

    // Handle midnight crossing
    if (arrivalHours < 0) {
      arrivalHours = 23;
    }

    return `${arrivalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchRequests = () => {
      const database = getDatabase(app);
      const requestsRef = ref(database, 'rentRequests');

      onValue(requestsRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const requestsArray = Object.entries(data).map(([id, details]) => {
            const ownerPhone = generatePhoneNumber();
            const renterPhone = generatePhoneNumber();
            const driverArrivalTime = calculateDriverArrivalTime(details.pickupTime);

            // Calculate driver earnings (10% of totalPrice)
            let driverEarnings = 0;
            if (details.totalPrice) {
              const price = parseFloat(details.totalPrice);
              driverEarnings = !isNaN(price) ? price * 0.1 : 0;
              console.log('Total Price:', price, 'Driver Earnings:', driverEarnings);
            }

            return {
              id,
              ...details,
              ownerPhone,
              renterPhone,
              driverArrivalTime,
              driverEarnings
            };
          });

          // Filter requests to show only accepted requests
          const acceptedRequests = requestsArray.filter(request => request.status === 'accepted');

          // Extract unique cities
          const uniqueCities = [...new Set(acceptedRequests.map(request => request.location))];
          setCities(uniqueCities);

          // Filter by selected city if any
          const filteredRequests = selectedCity
            ? acceptedRequests.filter(request => request.location === selectedCity)
            : acceptedRequests;

          setRequests(filteredRequests);
        } else {
          setRequests([]);
          setCities([]);
        }
        setLoading(false);
      });
    };

    fetchRequests();
  }, [currentUser, selectedCity]);

  const handleAcceptRequest = async (requestId) => {
    const database = getDatabase(app);
    const requestRef = ref(database, `rentRequests/${requestId}`);

    try {
      await update(requestRef, {
        driverId: currentUser,
        driverEmail: userEmail,
        status: 'driver_assigned',
        updatedAt: new Date().toISOString()
      });

      alert("You have successfully accepted this delivery request!");
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Error accepting request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader">Loading delivery requests...</div>
      </div>
    );
  }

  return (
    <div className="driver-requests-container">
      <div className="header-section">
        <h1>Car Delivery Requests</h1>
        {/* <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> {selectedCity ? 'Change City' : 'Filter by City'}
        </button> */}
      </div>

      {showFilters && (
        <div className="filters-section">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="city-select"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="no-requests">
          <FaCar className="no-requests-icon" />
          <h2>No Delivery Requests</h2>
          <p>There are no delivery requests available at the moment.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div className="request-type">
                  <span className="delivery">Delivery Request</span>
                </div>
                <div className="request-status">
                  <span className="status accepted">Accepted by Owner</span>
                </div>
              </div>

              <div className="request-details">
                <div className="car-info">
                  <FaCar className="icon" />
                  <div>
                    <h3>Vehicle Details</h3>
                    <p>{request.carBrand} {request.carModel} - {request.carType}</p>
                    <p><small>License Plate: {request.licensePlate || "MH05"}</small></p>
                  </div>
                </div>

                <div className="location-info">
                  <FaMapMarkerAlt className="icon" />
                  <div>
                    <h3>Location</h3>
                    <p>{request.location || "Mumbai"}</p>
                  </div>
                </div>

                <div className="booking-info">
                  <FaCalendarAlt className="icon" />
                  <div>
                    <h3>Delivery Date</h3>
                    <p>{new Date(request.bookingDate || request.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pickup-info">
                  <MdLocationOn className="icon" />
                  <div>
                    <h3>Pickup Address</h3>
                    <p>{request.pickupAddress || "star colony, dombivli e"}</p>
                  </div>
                </div>

                <div className="drop-info">
                  <MdLocationOn className="icon" />
                  <div>
                    <h3>Drop Address</h3>
                    <p>{request.dropAddress || "manpada dombivli"}</p>
                  </div>
                </div>

                <div className="driver-time-info">
                  <MdOutlineSchedule className="icon" />
                  <div>
                    <h3>Driver Arrival Time</h3>
                    <p>{request.driverArrivalTime} (1hr before pickup)</p>
                  </div>
                </div>

                <div className="pickup-info">
                  <FaClock className="icon" />
                  <div>
                    <h3>Customer Pickup Time</h3>
                    <p>{request.pickupTime}</p>
                  </div>
                </div>

                <div className="duration-info">
                  <FaClock className="icon" />
                  <div>
                    <h3>Rental Duration</h3>
                    <p>{request.duration} hours</p>
                  </div>
                </div>

                <div className="earnings-info">
                  <FaClock className="icon" />
                  <div>
                    <h3>Driver Earnings</h3>
                    <p>₹{request.driverEarnings.toFixed(2)} (10% of rent)</p>
                  </div>
                </div>

                <div className="contact-info">
                  <FaUser className="icon" />
                  <div>
                    <h3>Owner Contact</h3>
                    <p>{request.ownerEmail}</p>
                    <p><FaPhoneAlt size={12} /> {request.ownerPhone}</p>
                  </div>
                </div>

                <div className="contact-info">
                  <FaUser className="icon" />
                  <div>
                    <h3>Renter Contact</h3>
                    <p>{request.renterEmail}</p>
                    <p><FaPhoneAlt size={12} /> {request.renterPhone}</p>
                  </div>
                </div>
              </div>

              <div className="request-actions">
                <button
                  className="accept-btn"
                  onClick={() => handleAcceptRequest(request.id)}
                >
                  <FaCheck /> Accept Delivery Assignment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverRequests;