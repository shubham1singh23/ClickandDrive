import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDatabase, ref, onValue, remove, update } from 'firebase/database';
import app from './Firebase';
import './MyCar.css';
import { FaEdit, FaTrash, FaCar, FaSpinner } from 'react-icons/fa';

const MyCar = ({ currentUser }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCar, setEditingCar] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Initialize Firebase Database
  const db = getDatabase(app);

  // Fetch cars from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const carsRef = ref(db, `cars`);
    const unsubscribe = onValue(carsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          // Filter cars for current user
          const userCars = Object.entries(data)
            .filter(([_, car]) => car.userId === currentUser)
            .map(([id, car]) => ({
              id,
              ...car
            }));
          setCars(userCars);
        } else {
          setCars([]);
        }
        setLoading(false);
      } catch (err) {
        setError('Error fetching cars');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser, db]);

  // Delete car handler
  const handleDelete = useCallback(async (carId) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      try {
        const carRef = ref(db, `cars/${carId}`);
        await remove(carRef);
      } catch (err) {
        setError('Error deleting car');
      }
    }
  }, [db]);

  // Edit car handler
  const handleEdit = useCallback(async (carData) => {
    try {
      const carRef = ref(db, `cars/${carData.id}`);
      const updates = {
        pricePerHour: carData.pricePerHour,
        location: carData.location,
        address: carData.address,
        seatingCapacity: carData.seatingCapacity,
        transmission: carData.transmission,
        fuelType: carData.fuelType,
        carType: carData.carType,
        rentingEnabled: carData.rentingEnabled,
        updatedAt: new Date().toISOString()
      };
      await update(carRef, updates);
      setShowEditModal(false);
      setEditingCar(null);
    } catch (err) {
      setError('Error updating car');
    }
  }, [db]);

  const toggleRenting = async (car, enabled) => {
    try {
      const carRef = ref(db, `cars/${car.id}`);
      await update(carRef, {
        rentingEnabled: enabled,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      setError('Error updating car status');
    }
  };

  // Memoized car cards
  const carCards = useMemo(() => {
    return cars.map((car) => (
      <motion.div
        key={car.id}
        className="car-card"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="car-image">
          <img src={car.imageUrls[0]} alt={`${car.carBrand} ${car.carModel}`} />
        </div>
        <div className="car-details">
          <h3>{car.carBrand} {car.carModel}</h3>
          <p className="car-info">
            <span>{car.manufacturingYear}</span>
            <span>{car.transmission}</span>
            <span>{car.fuelType}</span>
          </p>
          <p className="car-price">₹{car.pricePerHour}/hour</p>
        </div>
        <div className="car-actions">
          <div className="renting-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={car.rentingEnabled !== false}
                onChange={(e) => toggleRenting(car, e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">
              {car.rentingEnabled !== false ? 'Available for Rent' : 'Not Available'}
            </span>
          </div>
          <button
            className="edit-btn"
            onClick={() => {
              setEditingCar(car);
              setShowEditModal(true);
            }}
          >
            <FaEdit /> Edit
          </button>
          <button
            className="delete-btn"
            onClick={() => handleDelete(car.id)}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </motion.div>
    ));
  }, [cars, handleDelete]);

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading your cars...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="mycar-container">
      <h1>My Cars</h1>
      {cars.length === 0 ? (
        <div className="no-cars">
          <FaCar className="no-cars-icon" />
          <p>You haven't added any cars yet</p>
        </div>
      ) : (
        <motion.div className="car-grid">
          <AnimatePresence>
            {carCards}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingCar && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="edit-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2>Edit Car Details</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleEdit(editingCar);
              }}>
                <div className="form-group">
                  <label>Car Type</label>
                  <select
                    value={editingCar.carType}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      carType: e.target.value
                    })}
                    required
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transmission</label>
                  <select
                    value={editingCar.transmission}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      transmission: e.target.value
                    })}
                    required
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Fuel Type</label>
                  <select
                    value={editingCar.fuelType}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      fuelType: e.target.value
                    })}
                    required
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Seating Capacity</label>
                  <select
                    value={editingCar.seatingCapacity}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      seatingCapacity: e.target.value
                    })}
                    required
                  >
                    {[2, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Price per Hour (₹)</label>
                  <input
                    type="number"
                    value={editingCar.pricePerHour}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      pricePerHour: e.target.value
                    })}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editingCar.location}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      location: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Complete Address</label>
                  <textarea
                    value={editingCar.address}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      address: e.target.value
                    })}
                    required
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCar(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyCar;
