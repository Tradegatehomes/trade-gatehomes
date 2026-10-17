UPDATE public.properties
SET balance_due_days = 0,
    updated_at = now()
WHERE deposit_required = true;

UPDATE public.bookings
SET balance_due_date = check_in
WHERE pay_deposit = true
  AND balance_amount > 0
  AND status NOT IN ('cancelled','refunded','completed');

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  recipient text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  provider_message_id text,
  UNIQUE(event_key, recipient)
);

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_notifications FROM anon, authenticated;