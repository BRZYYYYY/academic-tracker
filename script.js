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
const header = document.querySelector('.header');
const mainContainer = document.querySelector('.main-container');
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
const addSubjectBtn = document.getElementById('add-subject-header-btn');
const removeSubjectBtn = document.getElementById('remove-subject-btn');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const deleteSelectedBar = document.getElementById('delete-selected-bar');
const selectedCount = document.getElementById('selected-count');
const userAvatarBtn = document.getElementById('user-avatar-btn');
const userDropdown = document.getElementById('user-dropdown');
const dropdownUsername = document.getElementById('dropdown-username');
const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
const emptyStateContainer = document.getElementById('empty-state');
const backBtn = document.getElementById('back-btn');
const subjectNameDisplay = document.getElementById('subject-name-display');
const subjectMeanValue = document.getElementById('subject-mean-value');
const addGradeBtn = document.getElementById('add-grade-btn');
const gradeItemsContainer = document.getElementById('grade-items-container');
const filterTypeHeader = document.getElementById('filter-type-header');
const filterTypeMenu = document.getElementById('filter-type-menu');
const filterModeHeader = document.getElementById('filter-mode-header');
const filterModeMenu = document.getElementById('filter-mode-menu');

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
    dropdownUsername.textContent = currentUsername || 'User';
    setupCustomFilters();
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

// Avatar Dropdown Toggle
function toggleAvatarDropdown() {
    userDropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (userAvatarBtn && userDropdown && !userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
    }
});

// Logout
dropdownLogoutBtn.addEventListener('click', async () => {
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

// Grade Color Calculation with Neon Effects
function calculateGradeColor(percentage) {
    // Empty state - no grades yet
    if (percentage === 0 || percentage === null || percentage === undefined) {
        return {
            text: '-',
            color: '#999999',
            glowColor: 'rgba(153, 153, 153, 0)',
            className: 'grade-empty'
        };
    }

    // Clamp percentage between 0 and 100
    const grade = Math.max(0, Math.min(100, percentage));

    // 100%: Neon Blue
    if (grade === 100) {
        return {
            text: '100%',
            color: '#00FFFF',
            glowColor: 'rgba(0, 255, 255, 0.8)',
            className: 'grade-neon-blue'
        };
    }

    // 99%: Neon Green
    if (grade === 99) {
        return {
            text: '99%',
            color: '#39FF14',
            glowColor: 'rgba(57, 255, 20, 0.8)',
            className: 'grade-neon-green'
        };
    }

    // 59% and below: Neon Red
    if (grade <= 59) {
        return {
            text: `${grade.toFixed(1)}%`,
            color: '#FF0040',
            glowColor: 'rgba(255, 0, 64, 0.8)',
            className: 'grade-neon-red'
        };
    }

    // 60% to 98%: Gradient from Red to Green
    // Linear interpolation between red and green
    const ratio = (grade - 60) / (98 - 60); // 0 to 1
    
    // Red (255, 0, 64) to Green (57, 255, 20)
    const red = Math.round(255 - (255 - 57) * ratio);
    const green = Math.round(0 + 255 * ratio);
    const blue = Math.round(64 - 64 * ratio);
    
    const color = `rgb(${red}, ${green}, ${blue})`;
    const glowColor = `rgba(${red}, ${green}, ${blue}, 0.8)`;

    return {
        text: `${grade.toFixed(1)}%`,
        color: color,
        glowColor: glowColor,
        className: 'grade-neon-gradient'
    };
}

// Helper function to toggle navbar visibility
function toggleNavbarVisibility(hide = false) {
    if (header && mainContainer) {
        if (hide) {
            header.classList.add('navbar-hidden');
            mainContainer.classList.add('navbar-hidden-offset');
        } else {
            header.classList.remove('navbar-hidden');
            mainContainer.classList.remove('navbar-hidden-offset');
        }
    }
}

// Show Dashboard
function showDashboard() {
    dashboardView.classList.add('active');
    detailView.classList.remove('active');
    currentSubjectId = null;
    // Reset manage mode when going back to dashboard
    if (manageMode) {
        toggleManageMode();
    }
    // Show header action buttons
    removeSubjectBtn.style.display = 'inline-flex';
    addSubjectBtn.style.display = 'inline-flex';
    userAvatarBtn.style.display = 'flex';
    loadSubjects();
}

// Show Subject Detail
async function showSubjectDetail(subjectId) {
    currentSubjectId = subjectId;
    dashboardView.classList.remove('active');
    detailView.classList.add('active');
    // Hide header action buttons
    removeSubjectBtn.style.display = 'none';
    addSubjectBtn.style.display = 'none';
    userAvatarBtn.style.display = 'none';
    await renderSubjectDetail(subjectId);
}

// Render Subjects (Dashboard)
function renderSubjects(subjects) {
    // Show empty state if no subjects
    if (!subjects || subjects.length === 0) {
        subjectsGrid.innerHTML = '';
        emptyStateContainer.classList.remove('hidden');
        return;
    }
    
    // Hide empty state and render subjects
    emptyStateContainer.classList.add('hidden');
    
    subjectsGrid.innerHTML = subjects.map(subject => {
        const mean = subject.current_average || 0;
        const gradeInfo = calculateGradeColor(mean);
        const isManageMode = manageMode ? 'manage-mode' : '';
        const isSelected = selectedSubjects.has(subject.id);
        const selectedClass = isSelected ? 'selected' : '';
        
        return `
            <div class="subject-card ${isManageMode} ${selectedClass}" data-subject-id="${subject.id}">
                ${manageMode ? `<input type="checkbox" class="subject-checkbox" data-subject-id="${subject.id}" ${isSelected ? 'checked' : ''}>` : ''}
                <div class="subject-card-header">
                    <h3 class="subject-card-name">${escapeHtml(subject.name)}</h3>
                    <div class="subject-card-mean ${gradeInfo.className}" style="color: ${gradeInfo.color};">${gradeInfo.text}</div>
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
                const card = document.querySelector(`[data-subject-id="${subjectId}"]`);
                
                if (checkbox.checked) {
                    selectedSubjects.add(subjectId);
                    if (card) card.classList.add('selected');
                } else {
                    selectedSubjects.delete(subjectId);
                    if (card) card.classList.remove('selected');
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
        const gradeInfo = calculateGradeColor(mean);
        
        subjectMeanValue.textContent = gradeInfo.text;
        subjectMeanValue.style.color = gradeInfo.color;
        subjectMeanValue.style.textShadow = '';
        subjectMeanValue.className = `mean-value ${gradeInfo.className}`;

        // Load and render grades
        const grades = await loadGrades(subjectId);
        renderGradeItems(grades);
        
        // Highlight active filters
        highlightActiveFilters();
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
    
    // Reset modal filter selections
    document.getElementById('grade-type-header').textContent = 'Type ↕';
    document.getElementById('grade-mode-header').textContent = 'Mode ↕';
    document.querySelectorAll('#grade-type-menu .modal-filter-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('#grade-mode-menu .modal-filter-item').forEach(item => item.classList.remove('active'));
    document.getElementById('grade-type').value = '';
    document.getElementById('grade-mode').value = '';
    
    gradeTitleInput.focus();
    document.getElementById('grade-modal-title').textContent = 'Add New Grade Item';
    
    // Setup modal filter handlers
    setupModalFilters();
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
        removeSubjectBtn.classList.add('active');
        deleteSelectedBar.classList.remove('hidden');
    } else {
        removeSubjectBtn.classList.remove('active');
        deleteSelectedBar.classList.add('hidden');
    }
    
    loadSubjects();
}

function updateSelectedCount() {
    selectedCount.textContent = `${selectedSubjects.size} selected`;
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
        removeSubjectBtn.classList.remove('active');
        deleteSelectedBar.classList.add('hidden');
        loadSubjects();
    } catch (err) {
        console.error('Error deleting subjects:', err);
        alert('Error deleting subjects. Please try again.');
    }
}

// Event Listeners

// Avatar Dropdown Toggle
userAvatarBtn.addEventListener('click', toggleAvatarDropdown);

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

// Remove Subject (Manage Mode Toggle)
removeSubjectBtn.addEventListener('click', toggleManageMode);

// Delete Selected Subjects
deleteSelectedBtn.addEventListener('click', deleteSelectedSubjects);

// Back to Dashboard
backBtn.addEventListener('click', showDashboard);

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

// Custom Filter Handlers
function setupCustomFilters() {
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-filter-group')) {
            filterTypeMenu.classList.remove('active');
            filterModeMenu.classList.remove('active');
        }
    });

    // Filter Type Header Toggle
    filterTypeHeader.addEventListener('click', () => {
        filterTypeMenu.classList.toggle('active');
        filterModeMenu.classList.remove('active');
    });

    // Filter Type Items
    document.querySelectorAll('#filter-type-menu .custom-filter-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const value = item.dataset.value;
            currentTypeFilter = value;
            
            // Update active state
            document.querySelectorAll('#filter-type-menu .custom-filter-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            
            // Close menu and re-render
            filterTypeMenu.classList.remove('active');
            if (currentSubjectId) {
                renderSubjectDetail(currentSubjectId);
            }
        });
    });

    // Filter Mode Header Toggle
    filterModeHeader.addEventListener('click', () => {
        filterModeMenu.classList.toggle('active');
        filterTypeMenu.classList.remove('active');
    });

    // Filter Mode Items
    document.querySelectorAll('#filter-mode-menu .custom-filter-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const value = item.dataset.value;
            currentModeFilter = value;
            
            // Update active state
            document.querySelectorAll('#filter-mode-menu .custom-filter-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            
            // Close menu and re-render
            filterModeMenu.classList.remove('active');
            if (currentSubjectId) {
                renderSubjectDetail(currentSubjectId);
            }
        });
    });
}

// Initialize filter handlers when detail view loads
function highlightActiveFilters() {
    document.querySelectorAll('#filter-type-menu .custom-filter-item').forEach(item => {
        if (item.dataset.value === currentTypeFilter) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    document.querySelectorAll('#filter-mode-menu .custom-filter-item').forEach(item => {
        if (item.dataset.value === currentModeFilter) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Setup Modal Filter Handlers (for Type and Mode in grade modal)
function setupModalFilters() {
    const gradeTypeHeader = document.getElementById('grade-type-header');
    const gradeTypeMenu = document.getElementById('grade-type-menu');
    const gradeModeHeader = document.getElementById('grade-mode-header');
    const gradeModeMenu = document.getElementById('grade-mode-menu');
    const gradeTypeInput = document.getElementById('grade-type');
    const gradeModeInput = document.getElementById('grade-mode');

    // Close menus when clicking outside
    const closeModalMenus = (e) => {
        if (!e.target.closest('.modal-filter-group')) {
            gradeTypeMenu.classList.remove('active');
            gradeModeMenu.classList.remove('active');
        }
    };

    // Remove previous listeners to avoid duplicates
    document.removeEventListener('click', closeModalMenus);
    document.addEventListener('click', closeModalMenus);

    // Grade Type Header Toggle
    gradeTypeHeader.onclick = () => {
        gradeTypeMenu.classList.toggle('active');
        gradeModeMenu.classList.remove('active');
    };

    // Grade Type Items
    document.querySelectorAll('#grade-type-menu .modal-filter-item').forEach(item => {
        item.onclick = (e) => {
            const value = item.dataset.value;
            gradeTypeInput.value = value;
            
            // Update active state
            document.querySelectorAll('#grade-type-menu .modal-filter-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            
            // Update header text
            gradeTypeHeader.innerHTML = `<span class="filter-label">${value}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="filter-icon">
                    <path d="M11.5 15a.5.5 0 0 1-.5-.5V2.707l-3.146 3.147a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 1 1-.708.708L12 2.707V14.5a.5.5 0 0 1-.5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
                </svg>`;
            
            // Close menu
            gradeTypeMenu.classList.remove('active');
        };
    });

    // Grade Mode Header Toggle
    gradeModeHeader.onclick = () => {
        gradeModeMenu.classList.toggle('active');
        gradeTypeMenu.classList.remove('active');
    };

    // Grade Mode Items
    document.querySelectorAll('#grade-mode-menu .modal-filter-item').forEach(item => {
        item.onclick = (e) => {
            const value = item.dataset.value;
            gradeModeInput.value = value;
            
            // Update active state
            document.querySelectorAll('#grade-mode-menu .modal-filter-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            
            // Update header text
            gradeModeHeader.innerHTML = `<span class="filter-label">${value}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="filter-icon">
                    <path d="M11.5 15a.5.5 0 0 1-.5-.5V2.707l-3.146 3.147a.5.5 0 1 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 1 1-.708.708L12 2.707V14.5a.5.5 0 0 1-.5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
                </svg>`;
            
            // Close menu
            gradeModeMenu.classList.remove('active');
        };
    });
}

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
    // Empty State Card Click Handler
    if (emptyStateContainer) {
        const emptyStateCard = emptyStateContainer.querySelector('.empty-state-card');
        if (emptyStateCard) {
            emptyStateCard.addEventListener('click', openSubjectModal);
        }
    }
    
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
