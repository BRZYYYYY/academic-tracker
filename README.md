# Academic Tracker

A responsive web application for students to track their grades and academic performance.

## Features

- **User Authentication**: Secure login/signup system with Supabase
- **Subject Management**: Create and manage multiple subjects
- **Grade Tracking**: Add grade items with scores, types, and modes
- **Automatic Calculations**: Percentage and mean calculations
- **Filtering & Grouping**: Filter grades by type (Activities, Assignments, Quizzes, Examinations) and mode (Written, Online)
- **Data Persistence**: All data stored securely in Supabase cloud database

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (Authentication & Database)
- **Deployment**: Vercel (or any static hosting)

## Setup Instructions

### 1. Database Setup (Supabase)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Run the SQL script from `supabase_setup.sql` in the SQL Editor
4. Go to **Authentication → Settings** and disable "Enable email confirmations" (since we're using username-based login)
5. Copy your Project URL and anon key from **Settings → API**

### 2. Configuration

Update `script.js` with your Supabase credentials:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Local Development

Simply open `index.html` in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000
```

Then visit `http://localhost:8000`

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty or set to `.`)
   - **Install Command**: (leave empty)
6. Click "Deploy"

Your app will be live on Vercel!

## Project Structure

```
academic-tracker/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # Application logic
├── supabase_setup.sql  # Database schema
└── README.md           # This file
```

## Usage

1. **Sign Up**: Create an account with a username and password
2. **Add Subjects**: Click "Add Subject" to create a new subject
3. **Add Grades**: Click on a subject card, then "Add Grade Item"
4. **Track Performance**: View your overall mean percentage for each subject
5. **Filter Grades**: Use the filter dropdowns to view specific types/modes

## License

MIT






