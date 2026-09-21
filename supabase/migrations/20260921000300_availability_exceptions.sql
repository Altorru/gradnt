alter table public.user_documents drop constraint user_documents_kind_check;
alter table public.user_documents add constraint user_documents_kind_check
  check (kind in ('onboarding', 'training_plan', 'ftp_history', 'availability_exceptions'));
