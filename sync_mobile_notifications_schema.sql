-- ============================================================================
-- TABACO CITY TRD PORTAL - REAL-TIME MOBILE REPORT STATUS SYNC & NOTIFICATIONS SCHEMA
-- Execute in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ============================================================================

-- 1. Real-time Notifications Table for Mobile Passenger & Enforcer Apps
CREATE TABLE IF NOT EXISTS public.mobile_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'all', -- 'passenger', 'enforcer', or 'all'
    recipient_username VARCHAR(150),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    record_type VARCHAR(50), -- 'violation', 'complaint', 'review', 'general'
    record_id VARCHAR(100),
    plate_number VARCHAR(50),
    status VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexing for fast mobile query polling and unread badge lookup
CREATE INDEX IF NOT EXISTS idx_mobile_notifications_recipient 
    ON public.mobile_notifications (recipient_username, recipient_type, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_notifications_record 
    ON public.mobile_notifications (record_id, record_type);

-- 2. Chat / Admin Responses Table for Passenger Reports & Complaints
CREATE TABLE IF NOT EXISTS public.complaint_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id VARCHAR(100) NOT NULL,
    sender VARCHAR(20) NOT NULL DEFAULT 'admin', -- 'admin', 'complainant'
    sender_name VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint 
    ON public.complaint_messages (complaint_id, created_at ASC);

-- 3. Ensure Columns Exist in passenger_complaints for Admin Status, Remarks & Sync
ALTER TABLE IF EXISTS public.passenger_complaints 
    ADD COLUMN IF NOT EXISTS admin_response TEXT,
    ADD COLUMN IF NOT EXISTS admin_decision TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Ensure Columns Exist in violations tables for Settled Dates, Remarks & Status
ALTER TABLE IF EXISTS public.violations_tricycle_admin
    ADD COLUMN IF NOT EXISTS settled_date DATE,
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE IF EXISTS public.violations_pedicab_admin
    ADD COLUMN IF NOT EXISTS settled_date DATE,
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE IF EXISTS public.violations
    ADD COLUMN IF NOT EXISTS settled_date DATE,
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 5. Ensure Columns Exist in pending_reviews for Decision Sync
ALTER TABLE IF EXISTS public.pending_reviews
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 6. Disable Row Level Security (RLS) & Grant Access for Direct Real-time Sync
ALTER TABLE IF EXISTS public.mobile_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaint_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passenger_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_reviews DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.mobile_notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.complaint_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.passenger_complaints TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.violations_tricycle_admin TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.violations_pedicab_admin TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pending_reviews TO anon, authenticated, service_role;

-- 7. Automatic Database Trigger: Auto-generate mobile notification on Report Status Decision
CREATE OR REPLACE FUNCTION public.fn_sync_passenger_complaint_status_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed or updated
    IF (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.admin_response IS DISTINCT FROM NEW.admin_response)) THEN
        INSERT INTO public.mobile_notifications (
            recipient_type,
            recipient_username,
            title,
            message,
            record_type,
            record_id,
            plate_number,
            status,
            is_read,
            created_at
        ) VALUES (
            'passenger',
            COALESCE(NEW.complainant_name, 'all'),
            'Report Decision: ' || NEW.status,
            COALESCE(NEW.admin_response, 'Your passenger report for Plate ' || COALESCE(NEW.city_plate_number, '') || ' is marked as [' || NEW.status || '].'),
            'complaint',
            NEW.id::text,
            NEW.city_plate_number,
            NEW.status,
            FALSE,
            timezone('utc'::text, now())
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_passenger_complaint_status_sync ON public.passenger_complaints;
CREATE TRIGGER trg_passenger_complaint_status_sync
    AFTER UPDATE ON public.passenger_complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_passenger_complaint_status_notification();
