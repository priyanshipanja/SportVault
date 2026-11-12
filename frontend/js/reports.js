// SportVault Reports Module - Admin Historical Data

let equipmentIssuesData = [];
let bookingsHistoryData = [];
let maintenanceHistoryData = [];

// Load all historical data
async function loadAllReports() {
    await Promise.all([
        loadEquipmentIssuesHistory(),
        loadBookingsHistory(),
        loadMaintenanceHistory(),
        loadSummaryStats()
    ]);
}

// Load equipment issues history
async function loadEquipmentIssuesHistory() {
    const tbody = document.getElementById('equipment-issues-tbody');
    if (!tbody) {
        console.error('Equipment issues tbody not found');
        return;
    }
    
    try {
        console.log('Fetching equipment issues history...');
        // Get all equipment issues with student and equipment details
        const data = await apiRequest('/equipment/issues-history');
        console.log('Equipment issues response:', data);
        
        // Handle different response formats
        equipmentIssuesData = data.issues || data || [];
        console.log('Equipment issues data:', equipmentIssuesData);
        
        if (!equipmentIssuesData || equipmentIssuesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No equipment issues found</td></tr>';
            return;
        }

        tbody.innerHTML = equipmentIssuesData.map(issue => {
            const daysUsed = calculateDaysUsed(issue.issue_date, issue.return_date);
            return `
                <tr>
                    <td>${escapeHtml(issue.student_name || 'N/A')}</td>
                    <td>${escapeHtml(issue.equipment_name || 'N/A')}</td>
                    <td>${escapeHtml(issue.category || 'N/A')}</td>
                    <td>${formatDate(issue.issue_date)}</td>
                    <td>${issue.return_date ? formatDate(issue.return_date) : '-'}</td>
                    <td>${daysUsed}</td>
                    <td><span class="badge ${issue.status === 'returned' ? 'badge-success' : 'badge-warning'}">${issue.status || 'N/A'}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editEquipmentIssue(${issue.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteEquipmentIssue(${issue.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
        console.log('Equipment issues rendered successfully');
    } catch (error) {
        console.error('Failed to load equipment issues:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Failed to load data: ' + (error.message || 'Unknown error') + '</td></tr>';
        }
    }
}

// Load bookings history
async function loadBookingsHistory() {
    try {
        const data = await apiRequest('/bookings');
        bookingsHistoryData = data.bookings || [];
        
        const tbody = document.getElementById('bookings-history-tbody');
        if (!tbody) return;

        if (bookingsHistoryData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No bookings found</td></tr>';
            return;
        }

        tbody.innerHTML = bookingsHistoryData.map(booking => {
            const statusClass = getBookingStatusClass(booking.status);
            return `
                <tr>
                    <td>${escapeHtml(booking.user_name)}</td>
                    <td>${escapeHtml(booking.venue_name)}</td>
                    <td>${formatDate(booking.booking_date)}</td>
                    <td>${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</td>
                    <td>${escapeHtml(booking.purpose || '-')}</td>
                    <td><span class="badge ${statusClass}">${booking.status}</span></td>
                    <td>${formatDate(booking.created_at)}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editBooking(${booking.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteBooking(${booking.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load bookings:', error);
        document.getElementById('bookings-history-tbody').innerHTML = 
            '<tr><td colspan="8" class="empty-state">Failed to load data</td></tr>';
    }
}

// Load maintenance history
async function loadMaintenanceHistory() {
    try {
        const data = await apiRequest('/maintenance');
        maintenanceHistoryData = data.maintenance || [];
        
        const tbody = document.getElementById('maintenance-history-tbody');
        if (!tbody) return;

        if (maintenanceHistoryData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No maintenance records found</td></tr>';
            return;
        }

        tbody.innerHTML = maintenanceHistoryData.map(record => {
            const statusClass = getMaintenanceStatusClass(record.status);
            return `
                <tr>
                    <td>${escapeHtml(record.equipment_name)}</td>
                    <td>${escapeHtml(record.issue_description.substring(0, 50))}${record.issue_description.length > 50 ? '...' : ''}</td>
                    <td>${escapeHtml(record.reported_by_name)}</td>
                    <td>${formatDate(record.reported_date)}</td>
                    <td>${record.completed_date ? formatDate(record.completed_date) : '-'}</td>
                    <td>${record.repair_cost ? '₹' + record.repair_cost : '-'}</td>
                    <td><span class="badge ${statusClass}">${record.status}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editMaintenance(${record.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMaintenance(${record.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load maintenance:', error);
        document.getElementById('maintenance-history-tbody').innerHTML = 
            '<tr><td colspan="8" class="empty-state">Failed to load data</td></tr>';
    }
}

// Load summary statistics
async function loadSummaryStats() {
    try {
        // Get equipment issues count
        const issuesRes = await apiRequest('/equipment/issues-history');
        const totalIssues = issuesRes.issues ? issuesRes.issues.length : 0;
        document.getElementById('total-issues').textContent = totalIssues;

        // Get bookings count
        const bookingsRes = await apiRequest('/bookings');
        const totalBookings = bookingsRes.bookings ? bookingsRes.bookings.length : 0;
        document.getElementById('total-bookings-count').textContent = totalBookings;

        // Get maintenance cost
        const maintenanceRes = await apiRequest('/maintenance/stats');
        const totalCost = maintenanceRes.totalRepairCost || 0;
        document.getElementById('total-maintenance-cost').textContent = '₹' + totalCost;

        // Get active students count
        const statsRes = await apiRequest('/admin/dashboard-stats');
        document.getElementById('active-students').textContent = statsRes.totalStudents || 0;
    } catch (error) {
        console.error('Failed to load summary stats:', error);
    }
}

// Calculate days used
function calculateDaysUsed(issueDate, returnDate) {
    const start = new Date(issueDate);
    const end = returnDate ? new Date(returnDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Download Equipment Issues CSV
function downloadEquipmentIssuesCSV() {
    if (equipmentIssuesData.length === 0) {
        showAlert('No data to download', 'warning');
        return;
    }

    const headers = ['Student Name', 'Equipment', 'Category', 'Issue Date', 'Return Date', 'Days Used', 'Status'];
    const rows = equipmentIssuesData.map(issue => [
        issue.student_name,
        issue.equipment_name,
        issue.category,
        formatDate(issue.issue_date),
        issue.return_date ? formatDate(issue.return_date) : 'Not Returned',
        calculateDaysUsed(issue.issue_date, issue.return_date),
        issue.status
    ]);

    downloadCSV('equipment_issues_history.csv', headers, rows);
}

// Download Bookings CSV
function downloadBookingsCSV() {
    if (bookingsHistoryData.length === 0) {
        showAlert('No data to download', 'warning');
        return;
    }

    const headers = ['Student Name', 'Venue', 'Date', 'Start Time', 'End Time', 'Purpose', 'Status', 'Booked On'];
    const rows = bookingsHistoryData.map(booking => [
        booking.user_name,
        booking.venue_name,
        formatDate(booking.booking_date),
        formatTime(booking.start_time),
        formatTime(booking.end_time),
        booking.purpose || '-',
        booking.status,
        formatDate(booking.created_at)
    ]);

    downloadCSV('bookings_history.csv', headers, rows);
}

// Download Maintenance CSV
function downloadMaintenanceCSV() {
    if (maintenanceHistoryData.length === 0) {
        showAlert('No data to download', 'warning');
        return;
    }

    const headers = ['Equipment', 'Issue Description', 'Reported By', 'Reported Date', 'Completed Date', 'Repair Cost (Rs)', 'Status'];
    const rows = maintenanceHistoryData.map(record => [
        record.equipment_name,
        record.issue_description,
        record.reported_by_name,
        formatDate(record.reported_date),
        record.completed_date ? formatDate(record.completed_date) : '-',
        record.repair_cost || 0,
        record.status
    ]);

    downloadCSV('maintenance_history.csv', headers, rows);
}

// Generic CSV download function
function downloadCSV(filename, headers, rows) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert(`Downloaded ${filename}`, 'success');
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
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getBookingStatusClass(status) {
    switch (status) {
        case 'approved': return 'badge-success';
        case 'pending': return 'badge-warning';
        case 'rejected': return 'badge-danger';
        case 'cancelled': return 'badge-secondary';
        default: return 'badge-secondary';
    }
}

function getMaintenanceStatusClass(status) {
    switch (status) {
        case 'completed': return 'badge-success';
        case 'in_progress': return 'badge-warning';
        case 'reported': return 'badge-info';
        case 'cancelled': return 'badge-secondary';
        default: return 'badge-secondary';
    }
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

// ==================== EDIT FUNCTIONS ====================

// Edit Equipment Issue
async function editEquipmentIssue(id) {
    const issue = equipmentIssuesData.find(i => i.id === id);
    if (!issue) return;

    const newStatus = prompt('Enter new status (issued/returned):', issue.status);
    if (!newStatus || !['issued', 'returned'].includes(newStatus)) {
        showAlert('Invalid status', 'error');
        return;
    }

    try {
        await apiRequest(`/equipment/issues/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showAlert('Equipment issue updated', 'success');
        loadEquipmentIssuesHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to update', 'error');
    }
}

// Delete Equipment Issue
async function deleteEquipmentIssue(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
        await apiRequest(`/equipment/issues/${id}`, {
            method: 'DELETE'
        });
        showAlert('Equipment issue deleted', 'success');
        loadEquipmentIssuesHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to delete', 'error');
    }
}

// Edit Booking
async function editBooking(id) {
    const booking = bookingsHistoryData.find(b => b.id === id);
    if (!booking) return;

    const newStatus = prompt('Enter new status (pending/approved/rejected/cancelled):', booking.status);
    if (!newStatus || !['pending', 'approved', 'rejected', 'cancelled'].includes(newStatus)) {
        showAlert('Invalid status', 'error');
        return;
    }

    try {
        await apiRequest(`/bookings/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showAlert('Booking updated', 'success');
        loadBookingsHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to update', 'error');
    }
}

// Delete Booking
async function deleteBooking(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
        await apiRequest(`/bookings/${id}/cancel`, {
            method: 'PUT'
        });
        showAlert('Booking deleted', 'success');
        loadBookingsHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to delete', 'error');
    }
}

// Edit Maintenance
async function editMaintenance(id) {
    const record = maintenanceHistoryData.find(m => m.id === id);
    if (!record) return;

    const newStatus = prompt('Enter new status (reported/in_progress/completed/cancelled):', record.status);
    if (!newStatus || !['reported', 'in_progress', 'completed', 'cancelled'].includes(newStatus)) {
        showAlert('Invalid status', 'error');
        return;
    }

    try {
        await apiRequest(`/maintenance/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showAlert('Maintenance record updated', 'success');
        loadMaintenanceHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to update', 'error');
    }
}

// Delete Maintenance
async function deleteMaintenance(id) {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;

    try {
        await apiRequest(`/maintenance/${id}`, {
            method: 'DELETE'
        });
        showAlert('Maintenance record deleted', 'success');
        loadMaintenanceHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to delete', 'error');
    }
}

// ==================== CSV UPLOAD FUNCTIONS ====================

// Parse CSV file
function parseCSV(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
        callback(data);
    };
    reader.readAsText(file);
}

// Upload Equipment Issues CSV
function uploadEquipmentIssuesCSV(input) {
    const file = input.files[0];
    if (!file) return;

    parseCSV(file, async (data) => {
        try {
            for (const row of data) {
                await apiRequest('/equipment/import-issue', {
                    method: 'POST',
                    body: JSON.stringify(row)
                });
            }
            showAlert(`Imported ${data.length} equipment issues`, 'success');
            loadEquipmentIssuesHistory();
        } catch (error) {
            showAlert(error.message || 'Failed to import', 'error');
        }
    });
}

// Upload Bookings CSV
function uploadBookingsCSV(input) {
    const file = input.files[0];
    if (!file) return;

    parseCSV(file, async (data) => {
        try {
            for (const row of data) {
                await apiRequest('/bookings/import', {
                    method: 'POST',
                    body: JSON.stringify(row)
                });
            }
            showAlert(`Imported ${data.length} bookings`, 'success');
            loadBookingsHistory();
        } catch (error) {
            showAlert(error.message || 'Failed to import', 'error');
        }
    });
}

// Upload Maintenance CSV
function uploadMaintenanceCSV(input) {
    const file = input.files[0];
    if (!file) return;

    parseCSV(file, async (data) => {
        try {
            for (const row of data) {
                await apiRequest('/maintenance/import', {
                    method: 'POST',
                    body: JSON.stringify(row)
                });
            }
            showAlert(`Imported ${data.length} maintenance records`, 'success');
            loadMaintenanceHistory();
        } catch (error) {
            showAlert(error.message || 'Failed to import', 'error');
        }
    });
}

// ==================== SYNTHETIC DATA GENERATION ====================

// Generate Synthetic Equipment Issues
async function generateSyntheticEquipmentIssues() {
    try {
        // Fetch actual users and equipment from the database
        const [usersData, equipmentData] = await Promise.all([
            apiRequest('/admin/users'),
            apiRequest('/equipment')
        ]);
        
        const users = usersData.users || [];
        const equipment = equipmentData.equipment || [];
        
        if (users.length === 0) {
            showAlert('No users found in database. Please register some students first.', 'error');
            return;
        }
        
        if (equipment.length === 0) {
            showAlert('No equipment found in database. Please add equipment first.', 'error');
            return;
        }

        const statuses = ['issued', 'returned'];
        const syntheticData = [];
        
        for (let i = 0; i < 10; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomEquipment = equipment[Math.floor(Math.random() * equipment.length)];
            const issueDate = new Date('2026-01-01');
            issueDate.setDate(issueDate.getDate() + Math.floor(Math.random() * 90));
            
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            let returnDate = null;
            if (status === 'returned') {
                returnDate = new Date(issueDate);
                returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 14) + 1);
            }
            
            syntheticData.push({
                student_name: randomUser.name,
                equipment_name: randomEquipment.name,
                category: randomEquipment.category,
                issue_date: issueDate.toISOString().split('T')[0],
                return_date: returnDate ? returnDate.toISOString().split('T')[0] : null,
                status: status
            });
        }

        for (const row of syntheticData) {
            await apiRequest('/equipment/import-issue', {
                method: 'POST',
                body: JSON.stringify(row)
            });
        }
        showAlert(`Generated ${syntheticData.length} synthetic equipment issues`, 'success');
        loadEquipmentIssuesHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to generate data', 'error');
    }
}

// Generate Synthetic Bookings
async function generateSyntheticBookings() {
    try {
        // Fetch actual users from the database
        const usersData = await apiRequest('/admin/users');
        const users = usersData.users || [];
        
        if (users.length === 0) {
            showAlert('No users found in database. Please register some students first.', 'error');
            return;
        }

        const venues = ['Main Cricket Ground', 'Football Field 1', 'Basketball Court', 'Tennis Court 1', 'Badminton Hall', 'Volleyball Court'];
        const purposes = ['Practice match', 'Training session', 'Friendly match', 'Team practice', 'Coaching session'];
        const statuses = ['approved', 'pending', 'cancelled'];

        const syntheticData = [];
        for (let i = 0; i < 15; i++) {
            const date = new Date('2026-04-01');
            date.setDate(date.getDate() + Math.floor(Math.random() * 30));
            
            const randomUser = users[Math.floor(Math.random() * users.length)];
            
            syntheticData.push({
                user_name: randomUser.name,
                venue_name: venues[Math.floor(Math.random() * venues.length)],
                booking_date: date.toISOString().split('T')[0],
                start_time: '10:00',
                end_time: '12:00',
                purpose: purposes[Math.floor(Math.random() * purposes.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
        }

        for (const row of syntheticData) {
            await apiRequest('/bookings/import', {
                method: 'POST',
                body: JSON.stringify(row)
            });
        }
        showAlert(`Generated ${syntheticData.length} synthetic bookings`, 'success');
        loadBookingsHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to generate data', 'error');
    }
}

// Generate Synthetic Maintenance
async function generateSyntheticMaintenance() {
    try {
        // Fetch actual users and equipment from the database
        const [usersData, equipmentData] = await Promise.all([
            apiRequest('/admin/users'),
            apiRequest('/equipment')
        ]);
        
        const users = usersData.users || [];
        const equipment = equipmentData.equipment || [];
        
        if (users.length === 0) {
            showAlert('No users found in database.', 'error');
            return;
        }
        
        if (equipment.length === 0) {
            showAlert('No equipment found in database. Please add equipment first.', 'error');
            return;
        }

        const issues = ['String broken', 'Grip worn out', 'Air leak', 'Frame cracked', 'Surface damaged', 'Stitching loose'];
        const statuses = ['completed', 'in_progress', 'reported'];

        const syntheticData = [];
        for (let i = 0; i < 10; i++) {
            const randomEquipment = equipment[Math.floor(Math.random() * equipment.length)];
            const randomReporter = users[Math.floor(Math.random() * users.length)];
            const reportedDate = new Date('2026-04-01');
            reportedDate.setDate(reportedDate.getDate() + Math.floor(Math.random() * 20));
            
            const isCompleted = Math.random() > 0.5;
            const completedDate = isCompleted ? new Date(reportedDate) : null;
            if (completedDate) {
                completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 10) + 1);
            }

            syntheticData.push({
                equipment_name: randomEquipment.name,
                issue_description: issues[Math.floor(Math.random() * issues.length)],
                reported_by_name: randomReporter.name,
                reported_date: reportedDate.toISOString().split('T')[0],
                completed_date: completedDate ? completedDate.toISOString().split('T')[0] : null,
                repair_cost: Math.floor(Math.random() * 5000) + 500,
                status: isCompleted ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)]
            });
        }

        for (const row of syntheticData) {
            await apiRequest('/maintenance/import', {
                method: 'POST',
                body: JSON.stringify(row)
            });
        }
        showAlert(`Generated ${syntheticData.length} synthetic maintenance records`, 'success');
        loadMaintenanceHistory();
    } catch (error) {
        showAlert(error.message || 'Failed to generate data', 'error');
    }
}

// Initialize reports page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Reports page loaded');
    
    if (!requireAuth()) {
        console.log('Auth required, redirecting to login');
        return;
    }

    const user = getCurrentUser();
    console.log('Current user:', user);
    
    if (user.role !== 'admin') {
        console.log('Not admin, redirecting to dashboard');
        window.location.href = '/dashboard';
        return;
    }

    console.log('Loading reports...');
    loadAllReports();
});
