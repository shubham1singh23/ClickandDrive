import React, { useState } from 'react';
import './Addcar.css';
import { Camera } from 'lucide-react';
import { ref, push, set } from 'firebase/database'
import { getDatabase } from 'firebase/database';
import app from "./Firebase";
import axios from 'axios';

const AddCar = ({ currentUser, userEmail }) => {
  const [formData, setFormData] = useState({
    carBrand: '',
    carModel: '',
    manufacturingYear: '',
    licensePlate: '',
    carType: '',
    fuelType: '',
    transmission: '',
    seatingCapacity: '',
    location: '',
    address: '',
    pricePerHour: '',
    imageUrls: [], // Store Cloudinary URLs here
    userId: currentUser, // Use currentUser prop directly
    userEmail: userEmail, // Store user's email
  });

  let db = getDatabase(app);

  const [previewImages, setPreviewImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const carBrands = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Hyundai', 'Kia', 'Volkswagen', 'Nissan'];
  const years = Array.from({ length: 30 }, (_, i) => 2025 - i);
  const carTypes = ['Sedan', 'SUV', 'Hatchback', 'Luxury'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
  const transmissionTypes = ['Manual', 'Automatic'];
  const seatingCapacities = [2, 4, 5, 6, 7, 8];

  // Your Cloudinary configuration
  const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dh9nlw5gq/image/upload';
  const CLOUDINARY_UPLOAD_PRESET = 'clickndrive'; // Set this in your Cloudinary dashboard

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    handleImageFiles(files);
  };

  const handleImageFiles = (files) => {
    const newPreviewImages = [...previewImages];
    const newImageFiles = [...imageFiles];

    files.forEach(file => {
      // Add to files array for later upload
      newImageFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviewImages.push(reader.result);
        setPreviewImages([...newPreviewImages]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles(newImageFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleImageFiles(files);
  };

  const removeImage = (index) => {
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);

    const newImageFiles = [...imageFiles];
    newImageFiles.splice(index, 1);
    setImageFiles(newImageFiles);
  };

  // Upload images to Cloudinary
  const uploadImagesToCloudinary = async () => {
    try {
      const uploadedUrls = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];

        // Create form data for Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // Upload to Cloudinary
        const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        });

        // Add the URL to our array
        uploadedUrls.push(response.data.secure_url);

        // Update progress indicator
        setUploadProgress(Math.round((i + 1) * 100 / imageFiles.length));
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images to Cloudinary:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First upload images to Cloudinary
      const imageUrls = await uploadImagesToCloudinary();

      // Add the image URLs to the form data
      const carData = {
        ...formData,
        imageUrls: imageUrls
      };

      // Save to Firebase
      const carRef = ref(db, 'cars');
      const newCarRef = push(carRef); // Generate unique ID
      await set(newCarRef, {
        ...carData,
        userId: formData.userId // Ensure userId is included in the data
      });

      console.log("Car added successfully with images!");
      alert("Car has been added successfully!");

      // Reset form
      setFormData({
        carBrand: '',
        carModel: '',
        manufacturingYear: '',
        licensePlate: '',
        carType: '',
        fuelType: '',
        transmission: '',
        seatingCapacity: '',
        location: '',
        address: '',
        pricePerHour: '',
        imageUrls: [],
        userId: formData.userId,
        userEmail: formData.userEmail,
      });
      setPreviewImages([]);
      setImageFiles([]);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error in form submission:", error);
      alert("Error adding car. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-car-container">
      <h1>Add New Car</h1>
      <form onSubmit={handleSubmit} className="add-car-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="carBrand">Car Brand</label>
            <input
              type="text"
              id="carBrand"
              name="carBrand"
              value={formData.carBrand}
              onChange={handleChange}
              placeholder="Enter car brand (e.g., Toyota, Honda)"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="carModel">Car Model</label>
            <input
              type="text"
              id="carModel"
              name="carModel"
              value={formData.carModel}
              onChange={handleChange}
              placeholder="e.g. Camry, Civic"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="manufacturingYear">Manufacturing Year</label>
            <select
              id="manufacturingYear"
              name="manufacturingYear"
              value={formData.manufacturingYear}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Year</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="licensePlate">License Plate Number</label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              placeholder="e.g. ABC-1234"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="carType">Car Type</label>
            <select
              id="carType"
              name="carType"
              value={formData.carType}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Type</option>
              {carTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fuelType">Fuel Type</label>
            <select
              id="fuelType"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Fuel Type</option>
              {fuelTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transmission">Transmission</label>
            <select
              id="transmission"
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Transmission</option>
              {transmissionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="seatingCapacity">Seating Capacity</label>
            <select
              id="seatingCapacity"
              name="seatingCapacity"
              value={formData.seatingCapacity}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Capacity</option>
              {seatingCapacities.map((capacity) => (
                <option key={capacity} value={capacity}>{capacity}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pricePerHour">Price per Hour (₹)</label>
            <input
              type="number"
              id="pricePerHour"
              name="pricePerHour"
              value={formData.pricePerHour}
              onChange={handleChange}
              placeholder="Enter hourly rate"
              min="0"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="location">Car Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter city or area"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="address">Complete Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete address with street, building, etc."
              required
              disabled={loading}
              rows="3"
            />
          </div>

          <div className="form-group full-width">
            <label>Car Images</label>
            <div
              className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="carImages"
                name="carImages"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="file-input"
                disabled={loading}
              />
              <div className="upload-placeholder">
                <Camera size={48} />
                <p>Drag images here or click to browse</p>
                <span>Upload multiple images of the car</span>
              </div>
            </div>

            {previewImages.length > 0 && (
              <div className="image-previews">
                {previewImages.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image} alt={`Car preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {loading && uploadProgress > 0 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>{uploadProgress}% uploaded</p>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" disabled={loading}>Cancel</button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Adding Car...' : 'Add Car'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCar;