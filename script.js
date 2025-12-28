// Supabase Configuration
const supabaseUrl = 'https://fyhxzwilmzhjragefkdz.supabase.co';
const supabaseKey = 'sb_publishable_52yr6Ofav7_43NTWH1U25A_kv8Ff-Lz';

// Initialize Supabase client  
// Use var instead of let/const to avoid redeclaration errors if CDN already declared it
var supabase = null;

// Function to initialize Supabase client
function initSupabase() {
    try {
        let createClientFn = null;
        
        if (typeof window !== 'undefined') {
            // First, check for ES module export (our preferred method)
            if (window.supabaseLib && typeof window.supabaseLib.createClient === 'function') {
                createClientFn = window.supabaseLib.createClient;
                console.log('Found Supabase via ES module (window.supabaseLib)');
            }
            // Check for UMD build (window.supabase)
            else if (window.supabase && window.supabase !== null && typeof window.supabase.createClient === 'function') {
                createClientFn = window.supabase.createClient;
                console.log('Found Supabase via UMD (window.supabase)');
            }
            // Check for direct export
            else if (typeof window.createClient === 'function') {
                createClientFn = window.createClient;
                console.log('Found Supabase createClient directly on window');
            }
        }
        
        // If we found createClient, use it
        if (createClientFn && typeof createClientFn === 'function') {
            supabase = createClientFn(supabaseUrl, supabaseKey);
            console.log('Supabase client initialized successfully');
            return true;
        }
        
        // If we still don't have it, log what we found
        console.error('Supabase library not found.');
        console.log('window.supabase:', window.supabase);
        console.log('window.supabaseLib:', window.supabaseLib);
        console.log('window._supabaseScriptLoaded:', window._supabaseScriptLoaded);
        console.log('Available window keys with "supabase":', 
            Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
        return false;
        
    } catch (err) {
        console.error('Error initializing Supabase:', err);
        console.error('Error details:', err.message, err.stack);
    }
    return false;
}

// Helper function to convert username to email
function usernameToEmail(username) {
    return `${username.trim()}@tracker.local`;
}

// Helper function to extract username from email
function emailToUsername(email) {
    return email.replace('@tracker.local', '');
}

// Authentication State
let currentUser = null;
let currentUsername = null;

// View Management
let currentSubjectId = null;
let currentTypeFilter = 'all';
let currentModeFilter = 'all';
let manageMode = false;
let selectedSubjects = new Set();

// DOM Elements
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginCard = document.getElementById('login-card');
const signupCard = document.getElementById('signup-card');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const usernameDisplay = document.getElementById('username-display');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const signupUsernameInput = document.getElementById('signup-username');
const signupPasswordInput = document.getElementById('signup-password');
const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');

const dashboardView = document.getElementById('dashboard-view');
const detailView = document.getElementById('detail-view');
const subjectsGrid = document.getElementById('subjects-grid');
const addSubjectBtn = document.getElementById('add-subject-btn');
const manageSubjectsBtn = document.getElementById('manage-subjects-btn');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const deleteSelectedBar = document.getElementById('delete-selected-bar');
const selectedCount = document.getElementById('selected-count');
const backBtn = document.getElementById('back-btn');
const subjectNameDisplay = document.getElementById('subject-name-display');
const subjectMeanValue = document.getElementById('subject-mean-value');
const addGradeBtn = document.getElementById('add-grade-btn');
const gradeItemsContainer = document.getElementById('grade-items-container');
const filterType = document.getElementById('filter-type');
const filterMode = document.getElementById('filter-mode');

// Modal Elements
const subjectModal = document.getElementById('subject-modal');
const gradeModal = document.getElementById('grade-modal');
const subjectForm = document.getElementById('subject-form');
const gradeForm = document.getElementById('grade-form');
const subjectNameInput = document.getElementById('subject-name');
const gradeTitleInput = document.getElementById('grade-title');
const scoreObtainedInput = document.getElementById('score-obtained');
const totalScoreInput = document.getElementById('total-score');
const gradeTypeSelect = document.getElementById('grade-type');
const gradeModeSelect = document.getElementById('grade-mode');

// Initialize app - check auth state
async function initApp() {
    // Ensure login view is visible initially
    if (loginView) {
        loginView.classList.add('active');
    }
    
    // Try to initialize Supabase
    if (!initSupabase()) {
        console.error('Supabase client not loaded. Please check that the CDN link is included.');
        if (loginError) {
            showError(loginError, 'Supabase client not loaded. Please refresh the page or check your internet connection.');
        }
        return;
    }
    
    if (!supabase) {
        console.error('Failed to initialize Supabase client.');
        if (loginError) {
            showError(loginError, 'Failed to initialize database connection. Please check your configuration.');
        }
        return;
    }

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
        }
        
        if (session && session.user) {
            currentUser = session.user;
            currentUsername = emailToUsername(session.user.email);
            showApp();
        } else {
            showLogin();
        }

        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                currentUsername = emailToUsername(session.user.email);
                showApp();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                currentUsername = null;
                showLogin();
            }
        });
    } catch (err) {
        console.error('Error initializing app:', err);
        showLogin();
        if (loginError) {
            showError(loginError, 'Error connecting to server. Please check your connection.');
        }
    }
}

// Show Login View
function showLogin() {
    if (loginView) {
        loginView.classList.add('active');
    }
    if (appView) {
        appView.style.display = 'none';
    }
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
    if (loginError) hideError(loginError);
    if (signupError) hideError(signupError);
    if (loginCard) {
        loginCard.style.display = 'block';
    }
    if (signupCard) {
        signupCard.style.display = 'none';
    }
}

// Show App View
function showApp() {
    loginView.classList.remove('active');
    appView.style.display = 'block';
    usernameDisplay.textContent = currentUsername || 'User';
    loadSubjects();
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(loginError);

    // Try to initialize if not already done
    if (!supabase) {
        if (!initSupabase()) {
            showError(loginError, 'Supabase not loaded. Please refresh the page.');
            return;
        }
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        showError(loginError, 'Please enter both username and password.');
        return;
    }

    const email = usernameToEmail(username);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showError(loginError, error.message);
            return;
        }

        if (data.user) {
            currentUser = data.user;
            currentUsername = username;
            showApp();
        }
    } catch (err) {
        showError(loginError, 'An error occurred during login. Please try again.');
        console.error('Login error:', err);
    }
});

// Signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(signupError);

    // Try to initialize if not already done
    if (!supabase) {
        if (!initSupabase()) {
            showError(signupError, 'Supabase not loaded. Please refresh the page.');
            return;
        }
    }

    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value;
    const confirmPassword = signupConfirmPasswordInput.value;

    if (!username || !password || !confirmPassword) {
        showError(signupError, 'Please fill in all fields.');
        return;
    }

    if (password.length < 6) {
        showError(signupError, 'Password must be at least 6 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        showError(signupError, 'Passwords do not match.');
        return;
    }

    const email = usernameToEmail(username);

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            showError(signupError, error.message);
            return;
        }

        if (data.user) {
            // Success - show login form
            signupCard.style.display = 'none';
            hideError(signupError);
            showError(loginError, 'Account created! Please sign in.', 'success');
            signupForm.reset();
        }
    } catch (err) {
        showError(signupError, 'An error occurred during signup. Please try again.');
        console.error('Signup error:', err);
    }
});

// Note: Signup/Login form toggle event listeners are attached in DOMContentLoaded
// to ensure DOM elements are available

// Logout
logoutBtn.addEventListener('click', async () => {
    if (supabase) {
        await supabase.auth.signOut();
    }
    currentUser = null;
    currentUsername = null;
    showLogin();
});

// Error Display Helpers
function showError(element, message, type = 'error') {
    element.textContent = message;
    element.classList.add('show');
    if (type === 'success') {
        element.style.color = '#10b981';
    } else {
        element.style.color = '';
    }
}

function hideError(element) {
    element.textContent = '';
    element.classList.remove('show');
}

// Calculate percentage for a grade item
function calculatePercentage(scoreObtained, totalScore) {
    if (totalScore === 0) return 0;
    return (scoreObtained / totalScore) * 100;
}

// Calculate overall mean for a subject
function calculateSubjectMean(grades) {
    if (!grades || grades.length === 0) {
        return 0;
    }
    
    const percentages = grades.map(item => parseFloat(item.percentage));
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    return sum / percentages.length;
}

// Database Operations - Subjects

// Load all subjects for current user
async function loadSubjects() {
    if (!supabase || !currentUser) return;

    try {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading subjects:', error);
            return;
        }

        // Load grades for each subject to calculate mean
        for (let subject of data) {
            const grades = await loadGrades(subject.id);
            subject.current_average = calculateSubjectMean(grades);
        }

        renderSubjects(data);
    } catch (err) {
        console.error('Error in loadSubjects:', err);
    }
}

// Create new subject
async function createSubject(name) {
    if (!supabase || !currentUser) return null;

    try {
        const { data, error } = await supabase
            .from('subjects')
            .insert([
                {
                    name: name.trim(),
                    user_id: currentUser.id,
                    current_average: 0
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating subject:', error);
            alert('Error creating subject: ' + error.message);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Error in createSubject:', err);
        return null;
    }
}

// Delete subject
async function deleteSubject(id) {
    if (!supabase || !currentUser) return;

    try {
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting subject:', error);
            alert('Error deleting subject: ' + error.message);
            return;
        }

        // Update subject average after deletion (handled by cascade delete in DB)
        loadSubjects();
    } catch (err) {
        console.error('Error in deleteSubject:', err);
    }
}

// Database Operations - Grades

// Load grades for a subject
async function loadGrades(subjectId) {
    if (!supabase || !currentUser) return [];

    try {
        const { data, error } = await supabase
            .from('grades')
            .select('*')
            .eq('subject_id', subjectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading grades:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in loadGrades:', err);
        return [];
    }
}

// Create grade item
async function createGradeItem(subjectId, name, scoreObtained, totalScore, type, mode) {
    if (!supabase || !currentUser) return null;

    const percentage = calculatePercentage(parseFloat(scoreObtained), parseFloat(totalScore));

    try {
        const { data, error } = await supabase
            .from('grades')
            .insert([
                {
                    subject_id: subjectId,
                    name: name.trim(),
                    score: parseFloat(scoreObtained),
                    total: parseFloat(totalScore),
                    percentage: percentage,
                    type: type,
                    mode: mode
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating grade:', error);
            alert('Error creating grade: ' + error.message);
            return null;
        }

        // Update subject average
        await updateSubjectAverage(subjectId);

        return data;
    } catch (err) {
        console.error('Error in createGradeItem:', err);
        return null;
    }
}

// Delete grade item
async function deleteGradeItem(subjectId, itemId) {
    if (!supabase || !currentUser) return;

    try {
        const { error } = await supabase
            .from('grades')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error('Error deleting grade:', error);
            alert('Error deleting grade: ' + error.message);
            return;
        }

        // Update subject average
        await updateSubjectAverage(subjectId);
    } catch (err) {
        console.error('Error in deleteGradeItem:', err);
    }
}

// Update subject average in database
async function updateSubjectAverage(subjectId) {
    if (!supabase || !currentUser) return;

    try {
        // Get all grades for this subject
        const grades = await loadGrades(subjectId);
        const average = calculateSubjectMean(grades);

        const { error } = await supabase
            .from('subjects')
            .update({ current_average: average })
            .eq('id', subjectId);

        if (error) {
            console.error('Error updating subject average:', error);
        }
    } catch (err) {
        console.error('Error in updateSubjectAverage:', err);
    }
}

// UI Rendering

// Show Dashboard
function showDashboard() {
    dashboardView.classList.add('active');
    detailView.classList.remove('active');
    currentSubjectId = null;
    loadSubjects();
}

// Show Subject Detail
async function showSubjectDetail(subjectId) {
    currentSubjectId = subjectId;
    dashboardView.classList.remove('active');
    detailView.classList.add('active');
    await renderSubjectDetail(subjectId);
}

// Render Subjects (Dashboard)
function renderSubjects(subjects) {
    if (!subjects || subjects.length === 0) {
        subjectsGrid.innerHTML = `
            <div class="empty-state">
                <p>No subjects yet. Click "Add Subject" to get started!</p>
            </div>
        `;
        return;
    }
    
    subjectsGrid.innerHTML = subjects.map(subject => {
        const mean = subject.current_average || 0;
        const isManageMode = manageMode ? 'manage-mode' : '';
        const isSelected = selectedSubjects.has(subject.id);
        
        return `
            <div class="subject-card ${isManageMode}" data-subject-id="${subject.id}">
                ${manageMode ? `<input type="checkbox" class="subject-checkbox" data-subject-id="${subject.id}" ${isSelected ? 'checked' : ''}>` : ''}
                <div class="subject-card-header">
                    <h3 class="subject-card-name">${escapeHtml(subject.name)}</h3>
                    <div class="subject-card-mean">${mean.toFixed(1)}%</div>
                </div>
                <div class="subject-card-meta">
                    ${manageMode ? 'Click checkbox to select' : 'Click to view details'}
                </div>
            </div>
        `;
    }).join('');
    
    // Add checkbox listeners if in manage mode
    if (manageMode) {
        document.querySelectorAll('.subject-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const subjectId = checkbox.dataset.subjectId;
                if (checkbox.checked) {
                    selectedSubjects.add(subjectId);
                } else {
                    selectedSubjects.delete(subjectId);
                }
                updateSelectedCount();
            });
            
            // Prevent card click when clicking checkbox
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    } else {
        // Add click listeners to subject cards (only if not in manage mode)
        document.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const subjectId = card.dataset.subjectId;
                showSubjectDetail(subjectId);
            });
        });
    }
}

// Render Subject Detail
async function renderSubjectDetail(subjectId) {
    if (!supabase || !currentUser) return;

    try {
        // Get subject
        const { data: subject, error: subjectError } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', subjectId)
            .single();

        if (subjectError || !subject) {
            console.error('Error loading subject:', subjectError);
            showDashboard();
            return;
        }

        subjectNameDisplay.textContent = escapeHtml(subject.name);
        const mean = subject.current_average || 0;
        subjectMeanValue.textContent = `${mean.toFixed(1)}%`;

        // Load and render grades
        const grades = await loadGrades(subjectId);
        renderGradeItems(grades);
    } catch (err) {
        console.error('Error in renderSubjectDetail:', err);
    }
}

// Render Grade Items with Filtering and Grouping
function renderGradeItems(grades) {
    if (!grades || grades.length === 0) {
        gradeItemsContainer.innerHTML = `
            <div class="empty-state">
                <p>No grade items yet. Click "Add Grade Item" to get started!</p>
            </div>
        `;
        return;
    }
    
    // Filter grade items
    let filteredItems = grades.filter(item => {
        const typeMatch = currentTypeFilter === 'all' || item.type === currentTypeFilter;
        const modeMatch = currentModeFilter === 'all' || item.mode === currentModeFilter;
        return typeMatch && modeMatch;
    });
    
    if (filteredItems.length === 0) {
        gradeItemsContainer.innerHTML = `
            <div class="empty-state">
                <p>No grade items match the selected filters.</p>
            </div>
        `;
        return;
    }
    
    // Group by Type and Mode
    const grouped = {};
    filteredItems.forEach(item => {
        const key = `${item.type} - ${item.mode}`;
        if (!grouped[key]) {
            grouped[key] = {
                type: item.type,
                mode: item.mode,
                items: []
            };
        }
        grouped[key].items.push(item);
    });
    
    // Sort groups: Type order (Activities, Assignments, Quizzes, Examinations)
    const typeOrder = ['Activities', 'Assignments', 'Quizzes', 'Examinations'];
    const modeOrder = ['Written', 'Online'];
    
    const sortedGroups = Object.values(grouped).sort((a, b) => {
        const typeDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        if (typeDiff !== 0) return typeDiff;
        return modeOrder.indexOf(a.mode) - modeOrder.indexOf(b.mode);
    });
    
    // Render groups
    gradeItemsContainer.innerHTML = sortedGroups.map(group => {
        const itemsHtml = group.items.map(item => {
            return `
                <div class="grade-item">
                    <div class="grade-item-info">
                        <div class="grade-item-title">${escapeHtml(item.name)}</div>
                        <div class="grade-item-details">
                            <span class="grade-item-badge">${escapeHtml(item.type)}</span>
                            <span class="grade-item-badge">${escapeHtml(item.mode)}</span>
                        </div>
                    </div>
                    <div class="grade-item-score">
                        <div class="grade-item-percentage">${parseFloat(item.percentage).toFixed(1)}%</div>
                        <div class="grade-item-fraction">${item.score} / ${item.total}</div>
                    </div>
                    <div class="grade-item-actions">
                        <button class="btn btn-danger delete-grade-item" data-item-id="${item.id}" aria-label="Delete grade item">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="grade-group">
                <div class="grade-group-header">
                    <div class="grade-group-title">
                        ${escapeHtml(group.type)}
                        <span class="grade-group-badge">${escapeHtml(group.mode)}</span>
                    </div>
                </div>
                <div class="grade-items-list">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // Add delete listeners
    document.querySelectorAll('.delete-grade-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.itemId;
            if (confirm('Are you sure you want to delete this grade item?')) {
                await deleteGradeItem(currentSubjectId, itemId);
                await renderSubjectDetail(currentSubjectId);
            }
        });
    });
}

// Modal Management
function openSubjectModal() {
    subjectModal.classList.add('active');
    subjectNameInput.value = '';
    subjectNameInput.focus();
    document.getElementById('subject-modal-title').textContent = 'Add New Subject';
}

function closeSubjectModal() {
    subjectModal.classList.remove('active');
    subjectForm.reset();
}

function openGradeModal() {
    gradeModal.classList.add('active');
    gradeForm.reset();
    gradeTitleInput.focus();
    document.getElementById('grade-modal-title').textContent = 'Add New Grade Item';
}

function closeGradeModal() {
    gradeModal.classList.remove('active');
    gradeForm.reset();
}

// Manage Subjects Functions
function toggleManageMode() {
    manageMode = !manageMode;
    selectedSubjects.clear();
    
    if (manageMode) {
        deleteSelectedBar.classList.remove('hidden');
        manageSubjectsBtn.textContent = 'Done Managing';
        manageSubjectsBtn.classList.add('btn-danger');
        manageSubjectsBtn.classList.remove('btn-secondary');
    } else {
        deleteSelectedBar.classList.add('hidden');
        manageSubjectsBtn.textContent = 'Manage Subjects';
        manageSubjectsBtn.classList.remove('btn-danger');
        manageSubjectsBtn.classList.add('btn-secondary');
    }
    
    loadSubjects();
}

function updateSelectedCount() {
    selectedCount.textContent = `${selectedSubjects.size} selected`;
}

async function deleteSelectedSubjects() {
    if (selectedSubjects.size === 0) {
        alert('Please select at least one subject to delete');
        return;
    }
    
    const count = selectedSubjects.size;
    const message = `Are you sure you want to delete ${count} ${count === 1 ? 'subject' : 'subjects'}? This action cannot be undone.`;
    
    if (!confirm(message)) return;
    
    try {
        for (const subjectId of selectedSubjects) {
            await deleteSubject(subjectId);
        }
        
        selectedSubjects.clear();
        manageMode = false;
        deleteSelectedBar.classList.add('hidden');
        manageSubjectsBtn.textContent = 'Manage Subjects';
        manageSubjectsBtn.classList.remove('btn-danger');
        manageSubjectsBtn.classList.add('btn-secondary');
        loadSubjects();
    } catch (err) {
        console.error('Error deleting subjects:', err);
        alert('Error deleting subjects. Please try again.');
    }
}

// Event Listeners

// Add Subject
addSubjectBtn.addEventListener('click', openSubjectModal);

subjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = subjectNameInput.value.trim();
    if (name) {
        await createSubject(name);
        closeSubjectModal();
        loadSubjects();
    }
});

// Back to Dashboard
backBtn.addEventListener('click', showDashboard);

// Manage Subjects Toggle
manageSubjectsBtn.addEventListener('click', toggleManageMode);

// Delete Selected Subjects
deleteSelectedBtn.addEventListener('click', deleteSelectedSubjects);

// Add Grade Item
addGradeBtn.addEventListener('click', () => {
    if (currentSubjectId) {
        openGradeModal();
    }
});

gradeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = gradeTitleInput.value.trim();
    const scoreObtained = scoreObtainedInput.value;
    const totalScore = totalScoreInput.value;
    const type = gradeTypeSelect.value;
    const mode = gradeModeSelect.value;
    
    if (title && scoreObtained && totalScore && type && mode) {
        if (parseFloat(totalScore) <= 0) {
            alert('Total score must be greater than 0');
            return;
        }
        
        await createGradeItem(currentSubjectId, title, scoreObtained, totalScore, type, mode);
        closeGradeModal();
        await renderSubjectDetail(currentSubjectId);
    }
});

// Filter Change Handlers
filterType.addEventListener('change', (e) => {
    currentTypeFilter = e.target.value;
    if (currentSubjectId) {
        renderSubjectDetail(currentSubjectId);
    }
});

filterMode.addEventListener('change', (e) => {
    currentModeFilter = e.target.value;
    if (currentSubjectId) {
        renderSubjectDetail(currentSubjectId);
    }
});

// Modal Close Handlers
document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (subjectModal.contains(btn.closest('.modal-content'))) {
            closeSubjectModal();
        }
        if (gradeModal.contains(btn.closest('.modal-content'))) {
            closeGradeModal();
        }
    });
});

// Close modal on outside click
[subjectModal, gradeModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (modal === subjectModal) {
                closeSubjectModal();
            } else {
                closeGradeModal();
            }
        }
    });
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Close modals on Escape
    if (e.key === 'Escape') {
        if (subjectModal.classList.contains('active')) {
            closeSubjectModal();
        }
        if (gradeModal.classList.contains('active')) {
            closeGradeModal();
        }
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit longer for Supabase CDN to load
    console.log('DOM loaded, checking for Supabase...');
    console.log('window.supabase:', typeof window.supabase, window.supabase);
    
    // Re-get elements to ensure they exist
    const signupLink = document.getElementById('show-signup');
    const loginLink = document.getElementById('show-login');
    const loginCardEl = document.getElementById('login-card');
    const signupCardEl = document.getElementById('signup-card');
    const loginErrorEl = document.getElementById('login-error');
    const signupErrorEl = document.getElementById('signup-error');
    
    // Debug: Log element status
    console.log('Elements found:', {
        signupLink: !!signupLink,
        loginLink: !!loginLink,
        loginCard: !!loginCardEl,
        signupCard: !!signupCardEl
    });
    
    // Attach signup link event listener
    if (signupLink) {
        // Remove href navigation completely
        signupLink.setAttribute('href', 'javascript:void(0)');
        
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('Signup link clicked - showing signup form');
            
            if (loginCardEl) {
                loginCardEl.classList.add('hidden');
                loginCardEl.style.display = 'none';
                console.log('Login card hidden');
            } else {
                console.error('Login card element not found');
            }
            
            if (signupCardEl) {
                signupCardEl.classList.remove('hidden');
                signupCardEl.style.display = 'block';
                console.log('Signup card shown', signupCardEl);
            } else {
                console.error('Signup card element not found');
            }
            
            if (loginErrorEl) hideError(loginErrorEl);
            if (signupErrorEl) hideError(signupErrorEl);
            
            return false;
        }, true); // Use capture phase to catch event earlier
    } else {
        console.error('Signup link element not found!');
    }
    
    // Attach login link event listener
    if (loginLink) {
        // Remove href navigation completely
        loginLink.setAttribute('href', 'javascript:void(0)');
        
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('Login link clicked - showing login form');
            
            if (loginCardEl) {
                loginCardEl.classList.remove('hidden');
                loginCardEl.style.display = 'block';
                console.log('Login card shown');
            } else {
                console.error('Login card element not found');
            }
            
            if (signupCardEl) {
                signupCardEl.classList.add('hidden');
                signupCardEl.style.display = 'none';
                console.log('Signup card hidden');
            } else {
                console.error('Signup card element not found');
            }
            
            if (loginErrorEl) hideError(loginErrorEl);
            if (signupErrorEl) hideError(signupErrorEl);
            
            return false;
        }, true); // Use capture phase to catch event earlier
    } else {
        console.error('Login link element not found!');
    }
    
    // Wait longer for Supabase CDN to load, then try initialization
    // Try multiple times in case CDN is slow
    let attempts = 0;
    const maxAttempts = 15; // Increased attempts
    
    function tryInit() {
        attempts++;
        console.log(`Attempt ${attempts} to initialize Supabase...`);
        console.log('Script loaded flag:', window._supabaseScriptLoaded);
        
        // Check if script has loaded
        if (!window._supabaseScriptLoaded && attempts < 5) {
            console.log('Waiting for Supabase script to load...');
            setTimeout(tryInit, 300);
            return;
        }
        
        if (initSupabase()) {
            console.log('Supabase initialized, starting app...');
            initApp();
        } else if (attempts < maxAttempts) {
            // Wait 300ms and try again
            setTimeout(tryInit, 300);
        } else {
            console.error('Failed to initialize Supabase after', maxAttempts, 'attempts');
            console.error('Please check:');
            console.error('1. Internet connection');
            console.error('2. Browser console for script loading errors');
            console.error('3. Try using a different CDN or local file');
            if (loginErrorEl) {
                showError(loginErrorEl, 'Failed to load Supabase library. Please check your internet connection and refresh the page.');
            }
            // Still show the login form even if Supabase fails
            showLogin();
        }
    }
    
    // Start trying to initialize after a short delay
    setTimeout(tryInit, 100);
});
