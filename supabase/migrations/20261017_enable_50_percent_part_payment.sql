UPDATE public.properties
SET deposit_required = true,
    deposit_percent = 50,
    deposit_fixed = NULL,
    updated_at = now()
WHERE status IN ('active','draft');