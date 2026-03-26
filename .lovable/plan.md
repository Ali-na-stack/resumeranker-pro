

## Intelligent CV Ranking System — Implementation Plan

### Overview
A full-stack CV ranking system that uses AI to parse resumes, extract structured data, and intelligently rank candidates against job descriptions. Built with React + Tailwind frontend and Supabase backend with Lovable AI for NLP processing.

### Architecture
- **Frontend**: React + Tailwind with multi-page dashboard
- **Backend**: Supabase (database, storage, edge functions)
- **AI Layer**: Lovable AI Gateway via edge functions for resume parsing and job description analysis
- **File Storage**: Supabase Storage for uploaded CVs (PDF/DOCX)

### Pages & Navigation
- **Dashboard** — Overview with active job posting, upload area, and ranked candidates list
- **Candidates** — Full candidate list with filters, search, and bulk actions
- **Shortlisted** — Filtered view of shortlisted candidates
- **Candidate Detail** — Full parsed resume, score breakdown, strengths/gaps, original file preview

### Key Features

**1. Job Description Input & Analysis**
- Rich text area for job description
- AI-powered extraction of required skills, preferred skills, experience level, and education requirements via edge function
- Parsed JD stored in Supabase for comparison

**2. Resume Upload & AI Parsing**
- Multi-file upload (PDF/DOCX) to Supabase Storage
- Edge function sends file content to Lovable AI for structured extraction (name, email, skills, education, experience, projects, certifications)
- Parsed data stored in `candidates` table

**3. Intelligent Matching & Scoring**
- Edge function compares each candidate against the job description using AI
- Weighted scoring: Skills (40%), Experience (25%), Education (15%), Projects (10%), Certifications (10%)
- AI handles skill synonyms (e.g., "JS" = "JavaScript") and partial matches
- Returns match score, matched skills, missing skills, and explanation

**4. Ranked Dashboard**
- Card-based candidate display sorted by score
- Progress bars for match percentage
- Top matched and missing skills shown per card
- Sort and filter by score, skills, experience, education

**5. Explainable Output**
- Each candidate gets a human-readable summary explaining their score
- Score breakdown chart (skills, experience, education, projects, certs)
- Matched vs. missing skills visualization

**6. Recruiter Actions**
- Shortlist, Reject, Save for Later buttons on each candidate
- Status persisted in database
- Bulk actions on candidate list

**7. Bias Reduction Mode**
- Toggle to hide names, emails, and personal identifiers
- Rankings based purely on skills, experience, and education

**8. Resume Quality Score**
- AI evaluates completeness, structure, and presence of key sections
- Displayed as a secondary metric on candidate cards

### Database Schema (Supabase)
- **job_descriptions** — id, title, description, parsed_skills, parsed_requirements, created_at
- **candidates** — id, job_description_id, name, email, skills[], education, experience_years, experience_roles[], projects[], certifications[], resume_url, parsed_data (JSONB), created_at
- **candidate_scores** — id, candidate_id, job_description_id, overall_score, skills_score, experience_score, education_score, projects_score, certs_score, matched_skills[], missing_skills[], explanation, quality_score
- **candidate_statuses** — id, candidate_id, status (shortlisted/rejected/saved), updated_at

### Edge Functions
- **parse-resume** — Receives uploaded file, sends to Lovable AI for structured extraction
- **analyze-job** — Parses job description into structured requirements
- **rank-candidates** — Compares parsed candidates against job requirements, returns scores and explanations

### UI Design
- Clean, professional dashboard with sidebar navigation
- Card-based candidate display with color-coded score badges (green/yellow/red)
- Progress bars and radar charts for score breakdowns
- Responsive design for desktop and tablet
- Tabs: Dashboard / Candidates / Shortlisted

