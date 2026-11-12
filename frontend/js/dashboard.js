// SportVault Dashboard Module

// Load dashboard statistics (admin)
async function loadDashboardStats() {
    try {
        const data = await apiRequest('/admin/dashboard-stats');

        // Update stat cards
        document.getElementById('total-equipment').textContent = data.totalEquipment;
        document.getElementById('available-equipment').textContent = data.availableEquipment;
        document.getElementById('total-bookings').textContent = data.totalBookings;
        document.getElementById('total-students').textContent = data.totalStudents;
        document.getElementById('pending-maintenance').textContent = data.pendingMaintenance;
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        showAlert('Failed to load dashboard statistics', 'error');
    }
}

// Load student dashboard statistics
async function loadStudentStats() {
    try {
        const data = await apiRequest('/equipment/stats');

        // Update only equipment stat cards for students
        const totalEl = document.getElementById('total-equipment');
        const availableEl = document.getElementById('available-equipment');
        
        if (totalEl) totalEl.textContent = data.totalEquipment;
        if (availableEl) availableEl.textContent = data.availableEquipment;
        
        // Hide other stat cards for students
        const bookingsEl = document.getElementById('total-bookings');
        const studentsEl = document.getElementById('total-students');
        const maintenanceEl = document.getElementById('pending-maintenance');
        
        if (bookingsEl) bookingsEl.parentElement.style.display = 'none';
        if (studentsEl) studentsEl.parentElement.style.display = 'none';
        if (maintenanceEl) maintenanceEl.parentElement.style.display = 'none';
        
    } catch (error) {
        console.error('Failed to load student stats:', error);
    }
}

// Load student IDs (admin only)
async function loadStudentIds() {
    try {
        const data = await apiRequest('/admin/student-ids');
        const tbody = document.getElementById('student-ids-tbody');

        if (!tbody) return;

        if (data.studentIds.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No student IDs created yet</td></tr>';
            return;
        }

        tbody.innerHTML = data.studentIds.map(si => `
            <tr>
                <td>${si.student_id}</td>
                <td>${si.is_registered ? 'Yes' : 'No'}</td>
                <td>${si.name || '-'}</td>
                <td>
                    ${!si.is_registered ? `
                        <button class="btn btn-danger btn-sm" onclick="deleteStudentId(${si.id})">Delete</button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load student IDs:', error);
    }
}

// Create student ID (admin only)
async function createStudentId(event) {
    event.preventDefault();

    const studentIdInput = document.getElementById('new-student-id');
    const studentId = studentIdInput.value.trim();

    if (!studentId) {
        showAlert('Please enter a student ID', 'warning');
        return;
    }

    try {
        await apiRequest('/admin/create-student-id', {
            method: 'POST',
            body: JSON.stringify({ student_id: studentId })
        });

        showAlert('Student ID created successfully', 'success');
        studentIdInput.value = '';
        loadStudentIds();
    } catch (error) {
        showAlert(error.message || 'Failed to create student ID', 'error');
    }
}

// Delete student ID (admin only)
async function deleteStudentId(id) {
    if (!confirm('Are you sure you want to delete this student ID?')) {
        return;
    }

    try {
        await apiRequest(`/admin/student-ids/${id}`, {
            method: 'DELETE'
        });

        showAlert('Student ID deleted successfully', 'success');
        loadStudentIds();
    } catch (error) {
        showAlert(error.message || 'Failed to delete student ID', 'error');
    }
}

// Show alert message
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    const user = getCurrentUser();

    // Update welcome message
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) {
        welcomeName.textContent = user.name;
    }

    // Load stats based on role
    if (user.role === 'admin') {
        loadDashboardStats();
    } else {
        // For students, load limited stats
        loadStudentStats();
    }

    // Admin-only features
    if (user.role === 'admin') {
        loadStudentIds();

        const createForm = document.getElementById('create-student-id-form');
        if (createForm) {
            createForm.addEventListener('submit', createStudentId);
        }
    }
});
