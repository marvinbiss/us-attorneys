-- ============================================================================
-- Migration 446: Fix Phantom Columns
-- Adds missing columns/tables referenced by application code
-- Only references tables that exist: attorneys, specialties, states, counties,
-- locations_us, zip_codes, courthouses, bar_admissions, case_results,
-- attorney_specialties, attorney_courthouses, attorney_claims, statute_of_limitations
-- ============================================================================

-- Add boost_level to attorneys (subscription tier: 0=free, 1=pro, 2=premium)
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_attorneys_boost_level ON attorneys(boost_level DESC NULLS LAST);

-- Add is_featured to attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add response_time_hours to attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS response_time_hours NUMERIC(6,2);

-- Create profiles table (required by auth, reviews, bookings, leads)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'attorney', 'admin')),
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can view basic profiles" ON profiles FOR SELECT USING (true);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID REFERENCES attorneys(id),
  client_id UUID REFERENCES profiles(id),
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  would_recommend BOOLEAN,
  status VARCHAR(50) DEFAULT 'published',
  artisan_id UUID REFERENCES profiles(id),
  artisan_response TEXT,
  artisan_responded_at TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published reviews" ON reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_reviews_attorney_id ON reviews(attorney_id);

-- Create bookings table (video consultations)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id),
  client_id UUID REFERENCES profiles(id),
  client_email TEXT,
  client_name TEXT,
  client_phone TEXT,
  specialty_id UUID REFERENCES specialties(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  stripe_payment_intent_id TEXT,
  daily_room_url TEXT,
  daily_room_name TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK (cancelled_by IN ('client', 'attorney', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (
  auth.uid() = client_id OR
  auth.uid() IN (SELECT user_id FROM attorneys WHERE id = bookings.attorney_id)
);
CREATE POLICY "Authenticated can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_bookings_attorney ON bookings(attorney_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id UUID REFERENCES specialties(id),
  state_code CHAR(2),
  city TEXT,
  zip_code TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'assigned', 'converted', 'lost')),
  urgency TEXT DEFAULT 'normal',
  source TEXT DEFAULT 'website',
  assigned_attorney_id UUID REFERENCES attorneys(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_attorney ON leads(assigned_attorney_id);

-- Create client_documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES attorneys(id),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON client_documents FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can insert own documents" ON client_documents FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can delete own documents" ON client_documents FOR DELETE USING (auth.uid() = client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_attorney ON client_documents(attorney_id);

-- Add user_id to attorneys (for claimed profiles linking)
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS idx_attorneys_user_id ON attorneys(user_id);
