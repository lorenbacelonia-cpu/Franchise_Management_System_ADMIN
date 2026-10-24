-- ==============================================================================
-- UPDATE CHECK CONSTRAINTS & AUTO-SYNC EXPIRED DRIVER STATUS FOR ADMIN & MOBILE WEB
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ==============================================================================

-- 1. DROP EXISTING CONSTRAINTS THAT PREVENT 'Expired' STATUS
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin 
    DROP CONSTRAINT IF EXISTS franchise_records_tricycle_admin_status_check;

ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin 
    DROP CONSTRAINT IF EXISTS franchise_records_pedicab_admin_status_check;

-- 2. RE-ADD CHECK CONSTRAINTS WITH 'Expired' ALLOWED
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin 
    ADD CONSTRAINT franchise_records_tricycle_admin_status_check 
    CHECK (status IN ('Active', 'Pending Renewal', 'Deactivated', 'Under Review', 'Expired'));

ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin 
    ADD CONSTRAINT franchise_records_pedicab_admin_status_check 
    CHECK (status IN ('Active', 'Pending Renewal', 'Deactivated', 'Under Review', 'Expired'));

-- 3. IMMEDIATELY MARK ALL CURRENTLY EXPIRED UNITS AS 'Expired'
UPDATE public.franchise_records_tricycle_admin
SET status = 'Expired',
    updated_at = NOW()
WHERE expiration_date < CURRENT_DATE
  AND status NOT IN ('Deactivated', 'Expired');

UPDATE public.franchise_records_pedicab_admin
SET status = 'Expired',
    updated_at = NOW()
WHERE expiration_date < CURRENT_DATE
  AND status NOT IN ('Deactivated', 'Expired');

-- 4. UPDATE SYSTEM QR CODES TABLE FOR EXPIRED UNITS
-- Replaces 'Status: Active' with 'Status: Expired' in the scannable plain-text QR payload
UPDATE public.system_qr_codes_tricycle_admin qr
SET qr_payload = REPLACE(qr.qr_payload, 'Status: Active', 'Status: Expired')
FROM public.franchise_records_tricycle_admin f
WHERE qr.city_plate_number = f.city_plate_number
  AND f.expiration_date < CURRENT_DATE
  AND qr.qr_payload LIKE '%Status: Active%';

UPDATE public.system_qr_codes_pedicab_admin qr
SET qr_payload = REPLACE(qr.qr_payload, 'Status: Active', 'Status: Expired')
FROM public.franchise_records_pedicab_admin f
WHERE qr.city_plate_number = f.city_plate_number
  AND f.expiration_date < CURRENT_DATE
  AND qr.qr_payload LIKE '%Status: Active%';

-- 5. AUTOMATIC TRIGGER FUNCTION: Check expiration on insert or update
CREATE OR REPLACE FUNCTION public.fn_auto_mark_expired_franchise()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If the expiration date is in the past and unit is not deactivated, force status to 'Expired'
    IF (NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE AND NEW.status != 'Deactivated') THEN
        NEW.status := 'Expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_mark_expired_tricycle ON public.franchise_records_tricycle_admin;
CREATE TRIGGER trg_auto_mark_expired_tricycle
    BEFORE INSERT OR UPDATE ON public.franchise_records_tricycle_admin
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_auto_mark_expired_franchise();

DROP TRIGGER IF EXISTS trg_auto_mark_expired_pedicab ON public.franchise_records_pedicab_admin;
CREATE TRIGGER trg_auto_mark_expired_pedicab
    BEFORE INSERT OR UPDATE ON public.franchise_records_pedicab_admin
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_auto_mark_expired_franchise();
