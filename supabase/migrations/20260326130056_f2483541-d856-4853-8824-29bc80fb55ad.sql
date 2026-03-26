
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Job descriptions table
CREATE TABLE public.job_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  parsed_skills JSONB DEFAULT '[]'::jsonb,
  parsed_requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read job descriptions" ON public.job_descriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert job descriptions" ON public.job_descriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job descriptions" ON public.job_descriptions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job descriptions" ON public.job_descriptions FOR DELETE USING (true);

CREATE TRIGGER update_job_descriptions_updated_at
  BEFORE UPDATE ON public.job_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  skills TEXT[] DEFAULT '{}',
  education TEXT,
  experience_years NUMERIC DEFAULT 0,
  experience_roles JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  certifications TEXT[] DEFAULT '{}',
  resume_url TEXT,
  resume_filename TEXT,
  parsed_data JSONB DEFAULT '{}'::jsonb,
  quality_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert candidates" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update candidates" ON public.candidates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete candidates" ON public.candidates FOR DELETE USING (true);

-- Candidate scores table
CREATE TABLE public.candidate_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE NOT NULL,
  overall_score NUMERIC DEFAULT 0,
  skills_score NUMERIC DEFAULT 0,
  experience_score NUMERIC DEFAULT 0,
  education_score NUMERIC DEFAULT 0,
  projects_score NUMERIC DEFAULT 0,
  certifications_score NUMERIC DEFAULT 0,
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_description_id)
);

ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read scores" ON public.candidate_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scores" ON public.candidate_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scores" ON public.candidate_scores FOR UPDATE USING (true);

-- Candidate statuses table
CREATE TYPE public.candidate_status AS ENUM ('pending', 'shortlisted', 'rejected', 'saved');

CREATE TABLE public.candidate_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status public.candidate_status NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read statuses" ON public.candidate_statuses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert statuses" ON public.candidate_statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update statuses" ON public.candidate_statuses FOR UPDATE USING (true);

CREATE TRIGGER update_candidate_statuses_updated_at
  BEFORE UPDATE ON public.candidate_statuses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);

CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Anyone can read resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
