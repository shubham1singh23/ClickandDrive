import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import app from './Firebase';
import './Home.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSearch, FaCar, FaMapMarkerAlt, FaUsers, FaGasPump, FaCog, FaCalendarAlt, FaMoneyBillWave, FaTimes, FaPlus } from 'react-icons/fa';

const Home = ({ currentUser, userEmail, suggestedFilters }) => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    bookingDate: '',
    pickupTime: '',
    duration: 1,
    startTime: null,
    endTime: null,
    dropAddress: ''
  });
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    locations: [],
    carTypes: [],
    carBrands: [],
    seatingCapacities: [],
    priceRange: { min: 0, max: 10000 }
  });
  const [activeFilters, setActiveFilters] = useState({
    locations: [],
    carTypes: [],
    carBrands: [],
    seatingCapacities: [],
    priceRange: { min: 0, max: 10000 }
  });

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    carTypes: [],
    carBrands: [],
    seatingCapacities: [],
    maxPrice: 0
  });

  // Add new state for booking conflicts
  const [bookingConflicts, setBookingConflicts] = useState([]);

  // Define time slots
  const timeSlots = [
    { id: 'morning', label: 'Morning', hours: '6:00 AM - 12:00 PM', value: 6 },
    { id: 'afternoon', label: 'Afternoon', hours: '12:00 PM - 5:00 PM', value: 5 },
    { id: 'evening', label: 'Evening', hours: '5:00 PM - 9:00 PM', value: 4 },
    { id: 'night', label: 'Night', hours: '9:00 PM - 6:00 AM', value: 9 }
  ];

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const database = getDatabase(app);
        const carsRef = ref(database, 'cars');

        onValue(carsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const carsArray = Object.entries(data).map(([id, details]) => ({
              id,
              ...details,
              pricePerHour: Number(details.pricePerHour),
              seatingCapacity: Number(details.seatingCapacity)
            }));
            setCars(carsArray);

            // Extract filter options from data
            const locations = [...new Set(carsArray.map(car => car.location))];
            const carTypes = [...new Set(carsArray.map(car => car.carType))];
            const carBrands = [...new Set(carsArray.map(car => car.carBrand))];
            const seatingCapacities = [...new Set(carsArray.map(car => car.seatingCapacity))].sort((a, b) => a - b);
            const maxPrice = Math.max(...carsArray.map(car => car.pricePerHour));

            setFilterOptions({
              locations,
              carTypes,
              carBrands,
              seatingCapacities,
              maxPrice
            });

            // Initialize filters
            setFilters({
              locations: [],
              carTypes: [],
              carBrands: [],
              seatingCapacities: [],
              priceRange: { min: 0, max: maxPrice }
            });

            setActiveFilters({
              locations: [],
              carTypes: [],
              carBrands: [],
              seatingCapacities: [],
              priceRange: { min: 0, max: maxPrice }
            });
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error fetching cars:", error);
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleCarClick = (car) => {
    setSelectedCar(car);
    setBookingStatus(null);
    setShowBookingForm(false);
    document.body.classList.add('modal-open');
    if (!isUserOwnCar(car)) {
      checkExistingRequest(car.id);
    }
  };

  const closeModal = () => {
    setSelectedCar(null);
    document.body.classList.remove('modal-open');
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (updated[type].includes(value)) {
        updated[type] = updated[type].filter(item => item !== value);
      } else {
        updated[type] = [...updated[type], value];
      }
      return updated;
    });
  };

  const handlePriceChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: parseInt(value)
      }
    }));
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetFiltersData = {
      locations: [],
      carTypes: [],
      carBrands: [],
      seatingCapacities: [],
      priceRange: { min: 0, max: filterOptions.maxPrice }
    };

    setFilters(resetFiltersData);
    setActiveFilters(resetFiltersData);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.locations.length) count++;
    if (activeFilters.carTypes.length) count++;
    if (activeFilters.carBrands.length) count++;
    if (activeFilters.seatingCapacities.length) count++;
    if (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < filterOptions.maxPrice) count++;
    return count;
  };

  const filteredCars = cars.filter(car => {
    // Search filter
    const matchesSearch =
      car.carBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.carModel.toLowerCase().includes(searchTerm.toLowerCase());

    // Location filter
    const matchesLocation =
      activeFilters.locations.length === 0 ||
      activeFilters.locations.includes(car.location);

    // Car type filter
    const matchesType =
      activeFilters.carTypes.length === 0 ||
      activeFilters.carTypes.includes(car.carType);

    // Car brand filter
    const matchesBrand =
      activeFilters.carBrands.length === 0 ||
      activeFilters.carBrands.includes(car.carBrand);

    // Seating capacity filter
    const matchesSeating =
      activeFilters.seatingCapacities.length === 0 ||
      activeFilters.seatingCapacities.includes(car.seatingCapacity);

    // Price range filter
    const matchesPrice =
      car.pricePerHour >= activeFilters.priceRange.min &&
      car.pricePerHour <= activeFilters.priceRange.max;

    return matchesSearch && matchesLocation && matchesType && matchesBrand && matchesSeating && matchesPrice;
  });

  // Function to check if car belongs to current user
  const isUserOwnCar = (car) => {
    return car.userId === currentUser;
  };

  // Hero Section Background Images (would be replaced with your actual images)
  const heroImages = [
    "https://res.cloudinary.com/dh9nlw5gq/image/upload/v1743313032/rb3ynnepjn14kujap6lq.jpg"
  ];

  // Function to handle duration change
  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 5) {
      setBookingData(prev => ({
        ...prev,
        duration: value,
        totalHours: value
      }));
    }
  };

  // Function to check for booking conflicts
  const checkBookingConflicts = async (carId, bookingDate, pickupTime, duration) => {
    try {
      const database = getDatabase(app);
      const rentRequestsRef = ref(database, 'rentRequests');

      const snapshot = await onValue(rentRequestsRef, (snapshot) => {
        const requests = snapshot.val();
        if (requests) {
          const conflicts = Object.values(requests).filter(request => {
            if (request.carId === carId && request.status === 'accepted') {
              const requestStart = new Date(`${request.bookingDate}T${request.pickupTime}`);
              const requestEnd = new Date(requestStart.getTime() + request.duration * 60 * 60 * 1000);

              const newStart = new Date(`${bookingDate}T${pickupTime}`);
              const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);

              return (newStart >= requestStart && newStart < requestEnd) ||
                (newEnd > requestStart && newEnd <= requestEnd) ||
                (newStart <= requestStart && newEnd >= requestEnd);
            }
            return false;
          });

          setBookingConflicts(conflicts);
          return conflicts.length > 0;
        }
        return false;
      });
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      return false;
    }
  };

  // Update handleBookingSubmit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError(null);

    if (!bookingData.bookingDate || !bookingData.pickupTime || !bookingData.dropAddress) {
      setBookingError('Please fill in all required fields');
      return;
    }

    // Check for booking conflicts
    const hasConflicts = await checkBookingConflicts(
      selectedCar.id,
      bookingData.bookingDate,
      bookingData.pickupTime,
      bookingData.duration
    );

    if (hasConflicts) {
      setBookingError('This time slot is already booked. Please select a different time.');
      return;
    }

    try {
      const database = getDatabase(app);
      const rentRequestsRef = ref(database, 'rentRequests');

      // Calculate total price
      const totalPrice = selectedCar.pricePerHour * bookingData.duration;

      // Create booking request
      const bookingRequest = {
        carId: selectedCar.id,
        carBrand: selectedCar.carBrand,
        carModel: selectedCar.carModel,
        carType: selectedCar.carType,
        ownerId: selectedCar.userId,
        ownerEmail: selectedCar.userEmail,
        renterId: currentUser,
        renterEmail: userEmail,
        bookingDate: bookingData.bookingDate,
        pickupTime: bookingData.pickupTime,
        duration: bookingData.duration,
        totalPrice: totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pickupAddress: selectedCar.address,
        dropAddress: bookingData.dropAddress
      };

      // Push the booking request to Firebase
      const newRequestRef = push(rentRequestsRef);
      await set(newRequestRef, bookingRequest);

      // Update UI state
      setBookingStatus('pending');
      setShowBookingForm(false);
      closeModal();

      // Show success message
      alert('Booking request sent successfully! You can track the status in your Rent Requests section.');

    } catch (error) {
      console.error('Error submitting booking request:', error);
      setBookingError('Failed to submit booking request. Please try again.');
    }
  };

  // Add function to check availability when time or date changes
  const checkAvailability = async (date, time, duration) => {
    if (date && time && duration) {
      const hasConflicts = await checkBookingConflicts(
        selectedCar.id,
        date,
        time,
        duration
      );

      if (hasConflicts) {
        setBookingError('This time slot is already booked. Please select a different time.');
      } else {
        setBookingError(null);
      }
    }
  };

  // Function to check if there's a pending request for this car
  const checkExistingRequest = async (carId) => {
    try {
      const database = getDatabase(app);
      const rentRequestsRef = ref(database, 'rentRequests');

      const snapshot = await onValue(rentRequestsRef, (snapshot) => {
        const requests = snapshot.val();
        if (requests) {
          const existingRequest = Object.values(requests).find(
            request => request.carId === carId &&
              request.renterId === currentUser &&
              request.status === 'pending'
          );
          if (existingRequest) {
            setBookingStatus('pending');
          }
        }
      });
    } catch (error) {
      console.error('Error checking existing request:', error);
    }
  };

  // Apply suggested filters when they change
  useEffect(() => {
    if (suggestedFilters) {
      setFilters(prevFilters => ({
        ...prevFilters,
        ...suggestedFilters,
      }));
      setActiveFilters(prevFilters => ({
        ...prevFilters,
        ...suggestedFilters,
      }));
      setShowFilters(true); // Show the filters panel

      // Scroll to results
      document.querySelector('.main-content')?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [suggestedFilters]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader">
          <div className="car-body">
            <div className="car-top"></div>
            <div className="car-base"></div>
            <div className="car-wheel wheel-left"></div>
            <div className="car-wheel wheel-right"></div>
          </div>
          <div className="road"></div>
        </div>
        <p>Finding the perfect ride for you...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background" style={{ backgroundImage: `url(${heroImages[0]})` }}></div>
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Find Your Perfect Ride
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Quality cars with premium experience
          </motion.p>

          <motion.div
            className="hero-search-box"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by brand or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="hero-search-input"
              />
            </div>

            <div className="hero-buttons">
              <button
                className="filter-button"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
                <span>Filters</span>
                {getActiveFiltersCount() > 0 && (
                  <span className="filter-count">{getActiveFiltersCount()}</span>
                )}
              </button>

              <button
                className="add-car-button"
                onClick={() => navigate('/add-car')}
              >
                <FaPlus />
                <span>Add Your Car</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.section
            className="advanced-filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="close-filters" onClick={() => setShowFilters(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="filters-grid">
              {/* City/Location Filter */}
              <div className="filter-group">
                <h4><FaMapMarkerAlt /> Location</h4>
                <div className="checkbox-group">
                  {filterOptions.locations.map(location => (
                    <label key={location} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.locations.includes(location)}
                        onChange={() => toggleFilter('locations', location)}
                      />
                      <span className="checkbox-custom"></span>
                      {location}
                    </label>
                  ))}
                </div>
              </div>

              {/* Car Type Filter */}
              <div className="filter-group">
                <h4><FaCar /> Car Type</h4>
                <div className="checkbox-group">
                  {filterOptions.carTypes.map(type => (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.carTypes.includes(type)}
                        onChange={() => toggleFilter('carTypes', type)}
                      />
                      <span className="checkbox-custom"></span>
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* Car Brand Filter */}
              <div className="filter-group">
                <h4><FaCar /> Car Brand</h4>
                <div className="checkbox-group">
                  {filterOptions.carBrands.map(brand => (
                    <label key={brand} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.carBrands.includes(brand)}
                        onChange={() => toggleFilter('carBrands', brand)}
                      />
                      <span className="checkbox-custom"></span>
                      {brand}
                    </label>
                  ))}
                </div>
              </div>

              {/* Seating Capacity Filter */}
              <div className="filter-group">
                <h4><FaUsers /> Seating Capacity</h4>
                <div className="checkbox-group">
                  {filterOptions.seatingCapacities.map(capacity => (
                    <label key={capacity} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.seatingCapacities.includes(capacity)}
                        onChange={() => toggleFilter('seatingCapacities', capacity)}
                      />
                      <span className="checkbox-custom"></span>
                      {capacity} {capacity === 1 ? 'person' : 'people'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="filter-group full-width">
                <h4><FaMoneyBillWave /> Price Range (per hour)</h4>
                <div className="price-range">
                  <div className="range-inputs">
                    <div className="price-input">
                      <span>₹</span>
                      <input
                        type="number"
                        min="0"
                        max={filters.priceRange.max}
                        value={filters.priceRange.min}
                        onChange={(e) => handlePriceChange('min', e.target.value)}
                      />
                    </div>
                    <span>to</span>
                    <div className="price-input">
                      <span>₹</span>
                      <input
                        type="number"
                        min={filters.priceRange.min}
                        max={filterOptions.maxPrice}
                        value={filters.priceRange.max}
                        onChange={(e) => handlePriceChange('max', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="range-slider">
                    <input
                      type="range"
                      min="0"
                      max={filterOptions.maxPrice}
                      value={filters.priceRange.min}
                      onChange={(e) => handlePriceChange('min', e.target.value)}
                      className="slider min-slider"
                    />
                    <input
                      type="range"
                      min="0"
                      max={filterOptions.maxPrice}
                      value={filters.priceRange.max}
                      onChange={(e) => handlePriceChange('max', e.target.value)}
                      className="slider max-slider"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button className="btn-reset" onClick={resetFilters}>Reset All</button>
              <button className="btn-apply" onClick={applyFilters}>Apply Filters</button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <section className="main-content">
        <div className="results-header">
          <h2>Available Cars</h2>
          <p>{filteredCars.length} cars available</p>
        </div>

        {filteredCars.length === 0 ? (
          <div className="no-cars">
            <div className="no-results-icon">
              <FaCar />
            </div>
            <h3>No cars match your search criteria</h3>
            <p>Try adjusting your filters or search terms</p>
            <button onClick={resetFilters} className="reset-search-btn">Reset All Filters</button>
          </div>
        ) : (
          <motion.div
            className="cars-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {filteredCars.map((car, index) => (
              <motion.div
                className="car-card"
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * (index % 8), duration: 0.4 }}
                whileHover={{ y: -8 }}
                onClick={() => handleCarClick(car)}
              >
                <div className="car-image-container">
                  <img
                    src={car.imageUrls && car.imageUrls[0] ? car.imageUrls[0] : 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={`${car.carBrand} ${car.carModel}`}
                    className="car-image"
                  />
                  <div className="car-type-badge">{car.carType}</div>
                  {isUserOwnCar(car) && (
                    <div className="your-car-badge">Your Car</div>
                  )}
                  <div className="car-location">
                    <FaMapMarkerAlt />
                    <span>{car.location}</span>
                  </div>
                </div>
                <div className="car-info">
                  <div className="car-title">
                    <h3>{car.carBrand} {car.carModel}</h3>
                    <span className="car-year">{car.manufacturingYear}</span>
                  </div>

                  <div className="car-features">
                    <div className="feature">
                      <FaUsers />
                      <span>{car.seatingCapacity}</span>
                    </div>
                    <div className="feature">
                      <FaGasPump />
                      <span>{car.fuelType}</span>
                    </div>
                    <div className="feature">
                      <FaCog />
                      <span>{car.transmission}</span>
                    </div>
                  </div>

                  <div className="car-pricing">
                    <div className="price">
                      <span className="amount">₹{car.pricePerHour}</span>
                      <span className="period">/hour</span>
                    </div>
                    <button className="view-details-btn">View Details</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Car Detail Modal */}
      <AnimatePresence>
        {selectedCar && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="car-detail-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <button className="close-button" onClick={closeModal}>
                <FaTimes />
              </button>

              <div className="modal-content">
                <div className="modal-gallery">
                  <div className="main-image-container">
                    <img
                      src={selectedCar.imageUrls && selectedCar.imageUrls[0] ? selectedCar.imageUrls[0] : 'https://via.placeholder.com/600x400?text=No+Image'}
                      alt={`${selectedCar.carBrand} ${selectedCar.carModel}`}
                      className="main-image"
                    />
                  </div>

                  {selectedCar.imageUrls && selectedCar.imageUrls.length > 1 && (
                    <div className="image-thumbnails">
                      {selectedCar.imageUrls.map((url, idx) => (
                        <div className="thumbnail" key={idx}>
                          <img src={url} alt={`${selectedCar.carBrand} ${selectedCar.carModel} view ${idx}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-details">
                  <div className="car-header">
                    <div className="car-title-section">
                      <h2>{selectedCar.carBrand} {selectedCar.carModel}</h2>
                      <div className="car-subtitle">
                        <span className="year"><FaCalendarAlt /> {selectedCar.manufacturingYear}</span>
                        <span className="location"><FaMapMarkerAlt /> {selectedCar.location}</span>
                      </div>
                    </div>
                    <div className="price-badge">
                      <span className="price-amount">₹{selectedCar.pricePerHour}</span>
                      <span className="price-period">/hour</span>
                    </div>
                  </div>

                  <div className="car-highlights">
                    <div className="highlight">
                      <div className="highlight-icon"><FaCar /></div>
                      <div className="highlight-content">
                        <span className="highlight-label">Type</span>
                        <span className="highlight-value">{selectedCar.carType}</span>
                      </div>
                    </div>

                    <div className="highlight">
                      <div className="highlight-icon"><FaUsers /></div>
                      <div className="highlight-content">
                        <span className="highlight-label">Seats</span>
                        <span className="highlight-value">{selectedCar.seatingCapacity}</span>
                      </div>
                    </div>

                    <div className="highlight">
                      <div className="highlight-icon"><FaGasPump /></div>
                      <div className="highlight-content">
                        <span className="highlight-label">Fuel</span>
                        <span className="highlight-value">{selectedCar.fuelType}</span>
                      </div>
                    </div>

                    <div className="highlight">
                      <div className="highlight-icon"><FaCog /></div>
                      <div className="highlight-content">
                        <span className="highlight-label">Transmission</span>
                        <span className="highlight-value">{selectedCar.transmission}</span>
                      </div>
                    </div>
                  </div>

                  <div className="car-details-section">
                    <h3>About this car</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">License Plate</span>
                        <span className="detail-value">{selectedCar.licensePlate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Manufacturing Year</span>
                        <span className="detail-value">{selectedCar.manufacturingYear}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Fuel Type</span>
                        <span className="detail-value">{selectedCar.fuelType}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Transmission</span>
                        <span className="detail-value">{selectedCar.transmission}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Seating Capacity</span>
                        <span className="detail-value">{selectedCar.seatingCapacity} people</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Car Type</span>
                        <span className="detail-value">{selectedCar.carType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-section">
                    <div className="price-summary">
                      <div className="price-item">
                        <span>Hourly Rate</span>
                        <span>₹{selectedCar.pricePerHour}</span>
                      </div>
                      <div className="price-item total">
                        <span>Total (per hour)</span>
                        <span>₹{selectedCar.pricePerHour}</span>
                      </div>
                    </div>

                    {isUserOwnCar(selectedCar) ? (
                      <button className="book-now-button" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                        Cannot Book Your Own Car
                      </button>
                    ) : bookingStatus === 'pending' ? (
                      <button className="book-now-button" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                        Booking Request Pending
                      </button>
                    ) : !showBookingForm ? (
                      <button
                        className="book-now-button"
                        onClick={() => setShowBookingForm(true)}
                      >
                        Book This Car
                      </button>
                    ) : (
                      <form onSubmit={handleBookingSubmit} className="booking-form">
                        <div className="form-group">
                          <label htmlFor="bookingDate">Select Date</label>
                          <div className="calendar-input-container">
                            <input
                              type="date"
                              id="bookingDate"
                              value={bookingData.bookingDate}
                              onChange={(e) => {
                                setBookingData({ ...bookingData, bookingDate: e.target.value });
                                checkAvailability(e.target.value, bookingData.pickupTime, bookingData.duration);
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className="calendar-input"
                            />
                          </div>
                          <div className="calendar-hint">Select a date for your booking</div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="pickupTime">Select Pickup Time</label>
                          <input
                            type="time"
                            id="pickupTime"
                            value={bookingData.pickupTime}
                            onChange={(e) => {
                              setBookingData({ ...bookingData, pickupTime: e.target.value });
                              checkAvailability(bookingData.bookingDate, e.target.value, bookingData.duration);
                            }}
                            required
                            className="time-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="dropAddress">Drop-off Address</label>
                          <textarea
                            id="dropAddress"
                            value={bookingData.dropAddress}
                            onChange={(e) => setBookingData({ ...bookingData, dropAddress: e.target.value })}
                            placeholder="Enter your drop-off address"
                            required
                            className="address-input"
                            rows="3"
                          />
                          <div className="address-hint">Please provide the complete address where you'll drop off the car</div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="duration">Duration (hours)</label>
                          <div className="duration-selector">
                            <button
                              type="button"
                              className="duration-btn"
                              onClick={() => {
                                const newDuration = Math.max(1, bookingData.duration - 1);
                                setBookingData({ ...bookingData, duration: newDuration });
                                checkAvailability(bookingData.bookingDate, bookingData.pickupTime, newDuration);
                              }}
                              disabled={bookingData.duration <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              id="duration"
                              value={bookingData.duration}
                              onChange={(e) => {
                                const newDuration = Math.max(1, parseInt(e.target.value) || 1);
                                setBookingData({ ...bookingData, duration: newDuration });
                                checkAvailability(bookingData.bookingDate, bookingData.pickupTime, newDuration);
                              }}
                              min="1"
                              required
                              className="duration-input"
                            />
                            <button
                              type="button"
                              className="duration-btn"
                              onClick={() => {
                                const newDuration = bookingData.duration + 1;
                                setBookingData({ ...bookingData, duration: newDuration });
                                checkAvailability(bookingData.bookingDate, bookingData.pickupTime, newDuration);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="price-summary">
                          <div className="price-item">
                            <span>Price per Hour</span>
                            <span>₹{selectedCar.pricePerHour}</span>
                          </div>
                          <div className="price-item total">
                            <span>Total Price</span>
                            <span>₹{selectedCar.pricePerHour * bookingData.duration}</span>
                          </div>
                        </div>

                        {bookingError && (
                          <div className="error-message">
                            <FaTimes className="error-icon" />
                            {bookingError}
                          </div>
                        )}

                        <div className="booking-form-actions">
                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() => setShowBookingForm(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="book-now-button"
                            disabled={!bookingData.bookingDate || !bookingData.pickupTime || bookingError}
                          >
                            Confirm Booking
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;