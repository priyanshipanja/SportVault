// SportVault Booking Module

let allBookings = [];
let venues = [];

// Load all venues
async function loadVenues() {
    try {
        const data = await apiRequest('/bookings/venues');
        venues = data.venues;

        const venueSelect = document.getElementById('booking-venue');
        if (venueSelect) {
            venueSelect.innerHTML = '<option value="">Select Venue</option>' +
                venues.map(v => `<option value="${v.id}">${escapeHtml(v.name)} - ${escapeHtml(v.location)}</option>`).join('');
        }

        // Display venues info
        renderVenuesInfo(venues);
    } catch (error) {
        console.error('Failed to load venues:', error);
    }
}

// Render venues information
function renderVenuesInfo(venues) {
    const container = document.getElementById('venues-info');
    if (!container) return;

    if (venues.length === 0) {
        container.innerHTML = '<p>No venues available</p>';
        return;
    }

    container.innerHTML = venues.map(v => `
        <div style="padding: 1rem; border-bottom: 1px solid #e0e0e0;">
            <h4 style="margin: 0 0 0.5rem 0; color: #0B1F3A;">${escapeHtml(v.name)}</h4>
            <p style="margin: 0.25rem 0; color: #666;"><strong>Location:</strong> ${escapeHtml(v.location || 'N/A')}</p>
            <p style="margin: 0.25rem 0; color: #666;"><strong>Capacity:</strong> ${v.capacity || 'N/A'} people</p>
            ${v.description ? `<p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${escapeHtml(v.description)}</p>` : ''}
        </div>
    `).join('');
}

// Load all bookings
async function loadBookings() {
    try {
        const data = await apiRequest('/bookings');
        allBookings = data.bookings;
        renderBookings(allBookings);
        renderMyBookings(allBookings); // Also render student's own bookings
    } catch (error) {
        console.error('Failed to load bookings:', error);
        showAlert('Failed to load bookings', 'error');
    }
}

// Render bookings list (for admin - all bookings)
function renderBookings(bookings) {
    const container = document.getElementById('bookings-container');
    const user = getCurrentUser();

    if (!container) return;

    if (bookings.length === 0) {
        container.innerHTML = '<div class="empty-state">No bookings found</div>';
        return;
    }

    container.innerHTML = bookings.map(booking => {
        const statusClass = getBookingStatusClass(booking.status);

        return `
            <div class="booking-item ${booking.status}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4>${escapeHtml(booking.venue_name)}</h4>
                        <p><strong>Date:</strong> ${formatDate(booking.booking_date)}</p>
                        <p><strong>Time:</strong> ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                        ${booking.purpose ? `<p><strong>Purpose:</strong> ${escapeHtml(booking.purpose)}</p>` : ''}
                        ${user.role === 'admin' ? `<p><strong>Booked by:</strong> ${escapeHtml(booking.user_name)} (${escapeHtml(booking.user_email)})</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${statusClass}">${booking.status}</span>
                        <div style="margin-top: 0.5rem;">
                            ${canCancel(booking) ? `
                                <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                            ` : ''}
                            ${user.role === 'admin' && booking.status === 'pending' ? `
                                <div style="margin-top: 0.5rem;">
                                    <button class="btn btn-success btn-sm" onclick="updateBookingStatus(${booking.id}, 'approved')">Approve</button>
                                    <button class="btn btn-danger btn-sm" onclick="updateBookingStatus(${booking.id}, 'rejected')">Reject</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render my bookings (for student)
function renderMyBookings(bookings) {
    const container = document.getElementById('my-bookings-container');
    if (!container) return;

    // Filter only current user's bookings
    const user = getCurrentUser();
    const myBookings = bookings.filter(b => b.user_id === user.id);

    if (myBookings.length === 0) {
        container.innerHTML = '<div class="empty-state">You have no bookings</div>';
        return;
    }

    container.innerHTML = myBookings.map(booking => {
        const statusClass = getBookingStatusClass(booking.status);

        return `
            <div class="booking-item ${booking.status}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4>${escapeHtml(booking.venue_name)}</h4>
                        <p><strong>Date:</strong> ${formatDate(booking.booking_date)}</p>
                        <p><strong>Time:</strong> ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                        ${booking.purpose ? `<p><strong>Purpose:</strong> ${escapeHtml(booking.purpose)}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${statusClass}">${booking.status}</span>
                        <div style="margin-top: 0.5rem;">
                            ${canCancel(booking) ? `
                                <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get booking status badge class
function getBookingStatusClass(status) {
    switch (status) {
        case 'approved': return 'badge-success';
        case 'pending': return 'badge-warning';
        case 'rejected': return 'badge-danger';
        case 'cancelled': return 'badge-secondary';
        default: return 'badge-secondary';
    }
}

// Check if user can cancel booking
function canCancel(booking) {
    const user = getCurrentUser();
    if (!user) return false;

    // User can cancel their own pending or approved bookings
    if (booking.user_id === user.id && (booking.status === 'pending' || booking.status === 'approved')) {
        return true;
    }

    // Admin can cancel any pending or approved booking
    if (user.role === 'admin' && (booking.status === 'pending' || booking.status === 'approved')) {
        return true;
    }

    return false;
}

// Create new booking
async function createBooking(event) {
    event.preventDefault();

    const formData = {
        venue_id: document.getElementById('booking-venue').value,
        booking_date: document.getElementById('booking-date').value,
        start_time: document.getElementById('booking-start-time').value,
        end_time: document.getElementById('booking-end-time').value,
        purpose: document.getElementById('booking-purpose').value
    };

    // Validate
    if (!formData.venue_id || !formData.booking_date || !formData.start_time || !formData.end_time) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }

    // Validate time
    if (formData.start_time >= formData.end_time) {
        showAlert('End time must be after start time', 'warning');
        return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showAlert('Cannot book for past dates', 'warning');
        return;
    }

    try {
        await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showAlert('Booking created successfully', 'success');
        event.target.reset();
        loadBookings();
    } catch (error) {
        showAlert(error.message || 'Failed to create booking', 'error');
    }
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        await apiRequest(`/bookings/${bookingId}/cancel`, {
            method: 'PUT'
        });

        showAlert('Booking cancelled successfully', 'success');
        loadBookings();
    } catch (error) {
        showAlert(error.message || 'Failed to cancel booking', 'error');
    }
}

// Update booking status (admin only)
async function updateBookingStatus(bookingId, status) {
    try {
        await apiRequest(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        showAlert(`Booking ${status} successfully`, 'success');
        loadBookings();
    } catch (error) {
        showAlert(error.message || 'Failed to update booking status', 'error');
    }
}

// Filter bookings by status
function filterBookings(status) {
    if (status === 'all') {
        renderBookings(allBookings);
    } else {
        const filtered = allBookings.filter(b => b.status === status);
        renderBookings(filtered);
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Initialize booking page
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    loadVenues();
    loadBookings();

    // Set minimum date to today
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Event listeners
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', createBooking);
    }

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBookings(e.target.dataset.filter);
        });
    });
});
