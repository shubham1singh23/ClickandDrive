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
  const [processingAction, setProcessingAction] = useState(false);

  // Initialize Firebase Database
  const db = getDatabase(app);

  // Fetch cars from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const carsRef = ref(db, `cars`);

    try {
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
          console.error("Error processing car data:", err);
          setError('Error fetching cars');
          setLoading(false);
        }
      }, (error) => {
        console.error("Database error:", error);
        setError('Database connection error');
        setLoading(false);
      });

      return () => {
        // Ensure we properly detach the listener when component unmounts
        try {
          unsubscribe();
        } catch (err) {
          console.error("Error unsubscribing:", err);
        }
      };
    } catch (err) {
      console.error("Error setting up database listener:", err);
      setError('Failed to connect to database');
      setLoading(false);
    }
  }, [currentUser, db]);

  // Delete car handler
  const handleDelete = useCallback(async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car?')) {
      return;
    }

    setProcessingAction(true);
    try {
      const carRef = ref(db, `cars/${carId}`);
      await remove(carRef);
      // Firebase listener will update the UI automatically
    } catch (err) {
      console.error("Delete error:", err);
      setError('Error deleting car');
    } finally {
      setProcessingAction(false);
    }
  }, [db]);

  // Clean object to ensure no undefined values
  const cleanObjectForFirebase = (obj) => {
    const cleanObj = {};
    Object.keys(obj).forEach(key => {
      // Skip functions and undefined values
      if (typeof obj[key] !== 'function' && typeof obj[key] !== 'undefined') {
        cleanObj[key] = obj[key] === null ? '' : obj[key];
      }
    });
    return cleanObj;
  };

  // Edit car handler
  const handleEdit = useCallback(async (carData) => {
    setProcessingAction(true);
    try {
      const carRef = ref(db, `cars/${carData.id}`);

      // Create updates object with default values to prevent undefined
      const updates = cleanObjectForFirebase({
        pricePerHour: carData.pricePerHour || 0,
        location: carData.location || '',
        address: carData.address || '',
        seatingCapacity: carData.seatingCapacity || 4,
        transmission: carData.transmission || 'Manual',
        fuelType: carData.fuelType || 'Petrol',
        carType: carData.carType || 'Sedan',
        rentingEnabled: carData.rentingEnabled === undefined ? true : carData.rentingEnabled,
        updatedAt: new Date().toISOString()
      });

      console.log("Sending updates to Firebase:", updates);

      // Wait for the update to complete
      await update(carRef, updates);

      // Only after update is complete, update UI state
      setShowEditModal(false);
      setEditingCar(null);
    } catch (err) {
      console.error("Update error:", err);
      setError(`Error updating car: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  }, [db]);

  const toggleRenting = useCallback(async (car, enabled) => {
    setProcessingAction(true);
    try {
      const carRef = ref(db, `cars/${car.id}`);

      // Use boolean value for rentingEnabled to avoid undefined
      const updates = {
        rentingEnabled: enabled === true, // Force boolean
        updatedAt: new Date().toISOString()
      };

      console.log("Toggling rental status:", updates);

      // Wait for the update to complete
      await update(carRef, updates);

      // Firebase listener will update the UI automatically
    } catch (err) {
      console.error("Toggle error:", err);
      setError(`Error updating car status: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  }, [db]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
          <img src={car.imageUrls?.[0] || '/default-car.jpg'} alt={`${car.carBrand} ${car.carModel}`} />
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
                checked={car.rentingEnabled !== false} // Ensure boolean
                onChange={(e) => toggleRenting(car, e.target.checked)}
                disabled={processingAction}
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
              // Create a clean copy of the car data
              const cleanCar = { ...car };
              // Set defaults for any undefined fields
              if (cleanCar.rentingEnabled === undefined) {
                cleanCar.rentingEnabled = true;
              }
              setEditingCar(cleanCar);
              setShowEditModal(true);
            }}
            disabled={processingAction}
          >
            <FaEdit /> Edit
          </button>
          <button
            className="delete-btn"
            onClick={() => handleDelete(car.id)}
            disabled={processingAction}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </motion.div>
    ));
  }, [cars, handleDelete, toggleRenting, processingAction]);

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading your cars...</p>
      </div>
    );
  }

  return (
    <div className="mycar-container">
      <h1>My Cars</h1>

      {/* Error message display */}
      {error && (
        <motion.div
          className="error-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Processing indicator */}
      {processingAction && (
        <div className="processing-indicator">
          <FaSpinner className="spinner" />
          <span>Processing...</span>
        </div>
      )}

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
                    value={editingCar.carType || 'Sedan'}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      carType: e.target.value
                    })}
                    required
                    disabled={processingAction}
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
                    value={editingCar.transmission || 'Manual'}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      transmission: e.target.value
                    })}
                    required
                    disabled={processingAction}
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Fuel Type</label>
                  <select
                    value={editingCar.fuelType || 'Petrol'}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      fuelType: e.target.value
                    })}
                    required
                    disabled={processingAction}
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
                    value={editingCar.seatingCapacity || '5'}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      seatingCapacity: e.target.value
                    })}
                    required
                    disabled={processingAction}
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
                    value={editingCar.pricePerHour || '0'}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      pricePerHour: e.target.value
                    })}
                    min="0"
                    required
                    disabled={processingAction}
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editingCar.location || ''}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      location: e.target.value
                    })}
                    required
                    disabled={processingAction}
                  />
                </div>

                <div className="form-group">
                  <label>Complete Address</label>
                  <textarea
                    value={editingCar.address || ''}
                    onChange={(e) => setEditingCar({
                      ...editingCar,
                      address: e.target.value
                    })}
                    required
                    rows="3"
                    disabled={processingAction}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={editingCar.rentingEnabled !== false}
                      onChange={(e) => setEditingCar({
                        ...editingCar,
                        rentingEnabled: e.target.checked
                      })}
                      disabled={processingAction}
                    />
                    <span>Available for Rent</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCar(null);
                    }}
                    disabled={processingAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <>
                        <FaSpinner className="spinner" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
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