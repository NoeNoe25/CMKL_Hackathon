import React, { useState } from 'react';
import './AppointmentBooking.css';

function AppointmentBooking() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patientName: '',
    phoneNumber: '',
    email: '',
    department: '',
    doctor: '',
    date: '',
    time: '',
    symptoms: ''
  });

  const departments = [
    'General Medicine',
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Dermatology'
  ];

  const doctorsByDepartment = {
    'General Medicine': ['Dr. Smith', 'Dr. Johnson', 'Dr. Lee'],
    'Cardiology': ['Dr. Williams', 'Dr. Brown'],
    'Neurology': ['Dr. Davis', 'Dr. Miller'],
    'Pediatrics': ['Dr. Wilson', 'Dr. Moore'],
    'Orthopedics': ['Dr. Taylor', 'Dr. Anderson'],
    'Dermatology': ['Dr. Thomas', 'Dr. Jackson']
  };

  const availableTimes = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Appointment booked:', formData);
    setStep(4);
  };

  return (
    <div className="appointment-container">
      <h2>Book Medical Appointment</h2>
      <div className="progress-bar">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Patient Info</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Department</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Date/Time</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Confirmation</div>
      </div>

      {step === 1 && (
        <div className="appointment-form">
          <h3>Patient Information</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <button className="next-btn" onClick={nextStep}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="appointment-form">
          <h3>Select Department & Doctor</h3>
          <div className="form-group">
            <label>Medical Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select a department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          {formData.department && (
            <div className="form-group">
              <label>Select Doctor</label>
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                required
              >
                <option value="">Select a doctor</option>
                {doctorsByDepartment[formData.department].map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label>Symptoms (Optional)</label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="Briefly describe your symptoms..."
            />
          </div>
          
          <div className="button-group">
            <button className="back-btn" onClick={prevStep}>Back</button>
            <button className="next-btn" onClick={nextStep} disabled={!formData.doctor}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="appointment-form">
          <h3>Select Appointment Date & Time</h3>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          {formData.date && (
            <div className="form-group">
              <label>Available Times</label>
              <div className="time-slots">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    type="button"
                    className={`time-slot ${formData.time === time ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, time})}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="button-group">
            <button className="back-btn" onClick={prevStep}>Back</button>
            <button 
              className="confirm-btn" 
              onClick={handleSubmit}
              disabled={!formData.time}
            >
              Confirm Appointment
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="confirmation">
          <div className="confirmation-icon">✓</div>
          <h3>Appointment Booked Successfully!</h3>
          <div className="appointment-details">
            <p><strong>Patient:</strong> {formData.patientName}</p>
            <p><strong>Doctor:</strong> {formData.doctor}</p>
            <p><strong>Department:</strong> {formData.department}</p>
            <p><strong>Date:</strong> {formData.date}</p>
            <p><strong>Time:</strong> {formData.time}</p>
          </div>
          <p className="confirmation-note">
            You will receive a confirmation email shortly. 
            Please arrive 15 minutes before your appointment time.
          </p>
          <button 
            className="new-appointment-btn"
            onClick={() => {
              setStep(1);
              setFormData({
                patientName: '',
                phoneNumber: '',
                email: '',
                department: '',
                doctor: '',
                date: '',
                time: '',
                symptoms: ''
              });
            }}
          >
            Book Another Appointment
          </button>
        </div>
      )}
    </div>
  );
}

export default AppointmentBooking;