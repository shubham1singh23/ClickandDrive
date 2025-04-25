import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import app from './Firebase';
import './Profile.css';
import { FaCar, FaMoneyBillWave, FaTruck, FaWallet, FaUser, FaCalendar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const Profile = ({ currentUser, userEmail }) => {
  const [userStats, setUserStats] = useState({
    totalCars: 0,
    carsOnRent: 0,
    totalRentEarnings: 0,
    totalDeliveryEarnings: 0,
    completedDeliveries: 0,
    recentBookings: [],
    recentDeliveries: []
  });
  const [profileData, setProfileData] = useState(null);
  const [bookedCars, setBookedCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = () => {
      const db = getDatabase(app);

      // Fetch cars owned by user
      const carsRef = ref(db, 'cars');
      onValue(carsRef, (snapshot) => {
        const carsData = snapshot.val();
        if (carsData) {
          const userCars = Object.values(carsData).filter(car => car.userId === currentUser);
          setUserStats(prev => ({
            ...prev,
            totalCars: userCars.length
          }));
        }
      });

      // Fetch rent requests to calculate earnings and cars on rent
      const rentRequestsRef = ref(db, 'rentRequests');
      onValue(rentRequestsRef, (snapshot) => {
        const requests = snapshot.val();
        if (requests) {
          const allRequests = Object.entries(requests).map(([id, request]) => ({
            id,
            ...request,
            totalPrice: parseFloat(request.totalPrice) || 0 // Ensure totalPrice is a number
          }));

          // Calculate rent earnings (from owned cars)
          const rentEarnings = allRequests
            .filter(req =>
              req.ownerId === currentUser &&
              req.status === 'accepted'
            )
            .reduce((sum, req) => sum + req.totalPrice, 0);

          // Calculate delivery earnings (10% of rent for delivered cars)
          const deliveryEarnings = allRequests
            .filter(req =>
              req.driverId === currentUser &&
              req.status === 'driver_assigned'
            )
            .reduce((sum, req) => sum + (req.totalPrice * 0.1), 0);

          // Count cars currently on rent
          const activeRentals = allRequests.filter(req =>
            req.ownerId === currentUser &&
            req.status === 'accepted' &&
            new Date(req.bookingDate) >= new Date()
          );

          // Get recent bookings with proper sorting
          const recentBookings = allRequests
            .filter(req => req.ownerId === currentUser)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(booking => ({
              ...booking,
              totalPrice: parseFloat(booking.totalPrice) // Ensure totalPrice is a number
            }));

          // Get recent deliveries
          const recentDeliveries = allRequests
            .filter(req => req.driverId === currentUser)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

          // Update state with verified numbers
          setUserStats(prev => ({
            ...prev,
            carsOnRent: activeRentals.length,
            totalRentEarnings: parseFloat(rentEarnings.toFixed(2)),
            totalDeliveryEarnings: parseFloat(deliveryEarnings.toFixed(2)),
            recentBookings,
            recentDeliveries
          }));

          // Log for debugging
          console.log('Rent Earnings:', rentEarnings);
          console.log('Recent Bookings:', recentBookings);
        }
      });
    };

    const fetchProfileAndBookings = async () => {
      const database = getDatabase(app);

      // Fetch profile data
      const userRef = ref(database, `users/${currentUser}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setProfileData(data);
      });

      // Fetch booked cars
      const rentRequestsRef = ref(database, 'rentRequests');
      onValue(rentRequestsRef, (snapshot) => {
        const requests = snapshot.val();
        if (requests) {
          const userBookings = Object.entries(requests)
            .map(([id, booking]) => ({ id, ...booking }))
            .filter(booking => booking.renterId === currentUser)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setBookedCars(userBookings);
        }
        setLoading(false);
      });
    };

    if (currentUser) {
      fetchUserStats();
      fetchProfileAndBookings();
    }
  }, [currentUser]);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const database = getDatabase(app);
        const bookingRef = ref(database, `rentRequests/${bookingId}`);
        await remove(bookingRef);
        alert('Booking cancelled successfully');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <FaUser className="avatar-icon" />
        </div>
        <div className="profile-info">
          <h1>{profileData?.name || 'User'}</h1>
          <p>{userEmail}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FaCar className="stat-icon" />
          <div className="stat-info">
            <h3>Total Cars</h3>
            <p>{userStats.totalCars}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaWallet className="stat-icon" />
          <div className="stat-info">
            <h3>Cars on Rent</h3>
            <p>{userStats.carsOnRent}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaMoneyBillWave className="stat-icon" />
          <div className="stat-info">
            <h3>Rent Earnings</h3>
            <p>₹{userStats.totalRentEarnings}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaTruck className="stat-icon" />
          <div className="stat-info">
            <h3>Delivery Earnings</h3>
            <p>₹{userStats.totalDeliveryEarnings}</p>
          </div>
        </div>

        <div className="stat-card total-earnings">
          <FaWallet className="stat-icon" />
          <div className="stat-info">
            <h3>Total Earnings</h3>
            <p>₹{userStats.totalRentEarnings + userStats.totalDeliveryEarnings}</p>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <div className="recent-bookings scrollable-section">
          <h2>Recent Bookings</h2>
          {userStats.recentBookings.length > 0 ? (
            <div className="activity-list">
              {userStats.recentBookings.map((booking, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon"><FaCar /></div>
                  <div className="activity-details">
                    <h3>{booking.carBrand} {booking.carModel}</h3>
                    <p>Booked by: {booking.renterEmail}</p>
                    <p>Amount: ₹{booking.totalPrice}</p>
                    <p>Status: {booking.status}</p>
                    <small>{new Date(booking.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent bookings</p>
          )}
        </div>

        <div className="recent-deliveries scrollable-section">
          <h2>Recent Deliveries</h2>
          {userStats.recentDeliveries.length > 0 ? (
            <div className="activity-list">
              {userStats.recentDeliveries.map((delivery, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon"><FaTruck /></div>
                  <div className="activity-details">
                    <h3>{delivery.carBrand} {delivery.carModel}</h3>
                    <p>From: {delivery.pickupAddress}</p>
                    <p>To: {delivery.dropAddress}</p>
                    <p>Earnings: ₹{(delivery.totalPrice * 0.1).toFixed(2)}</p>
                    <p>Status: {delivery.status}</p>
                    <small>{new Date(delivery.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent deliveries</p>
          )}
        </div>
      </div>

      <div className="profile-content">
        <section className="booked-cars-section">
          <h2>My Booked Cars</h2>
          {bookedCars.length === 0 ? (
            <div className="no-bookings">
              <FaCar className="no-bookings-icon" />
              <p>You haven't booked any cars yet</p>
            </div>
          ) : (
            <div className="cars-list">
              {bookedCars.map(booking => (
                <div key={booking.id} className="car-item">
                  <div className="car-title">
                    <h3>{booking.carBrand} {booking.carModel}</h3>
                    <div className="booking-status-badge" data-status={booking.status}>
                      {booking.status}
                    </div>
                  </div>

                  <div className="detail-group">
                    <div className="detail-item">
                      <FaCalendar />
                      <div className="detail-text">
                        <span className="detail-label">Booking Date</span>
                        <span className="detail-value">{booking.bookingDate}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <FaClock />
                      <div className="detail-text">
                        <span className="detail-label">Pickup Time</span>
                        <span className="detail-value">{booking.pickupTime} ({booking.duration}h)</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <FaMapMarkerAlt />
                      <div className="detail-text">
                        <span className="detail-label">Pickup Location</span>
                        <span className="detail-value">{booking.pickupAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="car-type">
                    <span className="detail-label">Car Type</span>
                    <span className="detail-value">{booking.carType}</span>
                  </div>

                  <div className="car-pricing">
                    <div className="price">
                      <span className="amount">₹{booking.totalPrice}</span>
                      <span className="period">total</span>
                    </div>
                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <button
                        className="cancel-booking-btn"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
