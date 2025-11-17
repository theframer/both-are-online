import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import './ContactForm.css';

function ContactForm({ onClose }) {
  const [state, handleSubmit] = useForm("mldlrjdp");

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Contact Me</h2>

        {state.succeeded ? (
          <p>Form submitted successfully, will get back to you.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Name" required />
            <ValidationError prefix="Name" field="name" errors={state.errors} />

            <input type="email" name="email" placeholder="Email" required />
            <ValidationError prefix="Email" field="email" errors={state.errors} />

            <input type="tel" name="phone" placeholder="Phone" />

            <select name="type" required>
              <option value="">Select a reason</option>
              <option>Zoho Consulting/Strategy Call</option>
              <option>Networking / Collaboration</option>
              <option>Zoho Support & Troubleshooting</option>
              <option>Training & Workshops</option>
              <option>Project Inquiry</option>
              <option>Quotation / Pricing Request</option>
              <option>Partnership</option>
              <option>Opportunities</option>
              <option>General Inquiry</option>
            </select>
            <ValidationError prefix="Type" field="type" errors={state.errors} />

            <textarea name="description" placeholder="Description"></textarea>
            <ValidationError prefix="Description" field="description" errors={state.errors} />

            <button type="submit" className="submit-btn" disabled={state.submitting}>
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ContactForm;