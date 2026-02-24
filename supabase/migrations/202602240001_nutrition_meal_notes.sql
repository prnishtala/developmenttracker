alter table public.nutrition_logs
add column if not exists meal_notes text;
