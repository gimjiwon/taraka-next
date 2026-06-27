# TAKARA Kuji Admin Update

This update adds the first real admin operation flow.

## Added

- Admin kuji creation form at `/admin/kuji`
- Prize rank/quantity registration
- Automatic ticket number generation
- Random prize assignment to ticket numbers
- Kuji status controls: draft, active, paused, ended
- Public kuji list reads active kujis from Supabase
- Public detail, queue, select, and payment pages read registered kujis from Supabase

## Test flow

1. Log in with the admin account.
2. Open `/admin/kuji`.
3. Register a kuji.
4. Make sure prize quantity total equals total ticket count.
5. Set status to `바로 공개` or click `공개` after registration.
6. Open `/kuji`.
7. Confirm the registered kuji is shown.
8. Enter detail page and number selection page.

## Rule

The total of all prize quantities must equal the total ticket count. TAKARA has no blank result, so every ticket is assigned to a prize.
