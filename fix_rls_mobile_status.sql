-- ==============================================================================
-- FIX ROW LEVEL SECURITY (RLS) FOR REAL-TIME MOBILE REPORT STATUS & NOTIFICATIONS
-- Execute this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ==============================================================================

-- 1. Disable RLS on all operational tables so Admin & Mobile App can update statuses freely
ALTER TABLE IF EXISTS public.mobile_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaint_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passenger_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;

-- 2. Grant all permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE public.mobile_notifications TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.complaint_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.passenger_complaints TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.violations_tricycle_admin TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.violations_pedicab_admin TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pending_reviews TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.franchise_records_tricycle_admin TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.franchise_records_pedicab_admin TO anon, authenticated, service_role;

-- 3. Enable Real-Time Broadcasts on Supabase Realtime Publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.passenger_complaints;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.violations_tricycle_admin;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.violations_pedicab_admin;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_notifications;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_messages;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
    END;
END $$;

-- 4. Replace the status trigger function with SECURITY DEFINER and EXCEPTION safety
-- This ensures that whenever a status is updated, it NEVER crashes with an RLS error
CREATE OR REPLACE FUNCTION public.fn_sync_passenger_complaint_status_notification()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If status or admin response changed
    IF (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.admin_response IS DISTINCT FROM NEW.admin_response)) THEN
        BEGIN
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
        EXCEPTION WHEN OTHERS THEN
            -- In case of any notification table issue, NEVER block the complaint status update itself!
            RAISE NOTICE 'Notification sync notice: %', SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_passenger_complaint_status_sync ON public.passenger_complaints;
CREATE TRIGGER trg_passenger_complaint_status_sync
    AFTER UPDATE ON public.passenger_complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_passenger_complaint_status_notification();

