<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Multi-property architecture: never hardcode property name, pricing, contacts, policies or availability — all of it comes from the database, keyed per property.
- Pricing, availability and booking creation run in server functions (`src/lib/*.functions.ts`) using the admin client; browser-submitted prices are never trusted.
- Public reads (properties, images, amenities, approved reviews) go through the browser Supabase client under RLS; writes that guests perform go through server functions.
- Roles live in `public.user_roles` with the `has_role` / `is_staff` security-definer functions; never store roles on profiles.
- Money is stored as numeric NGN and formatted with `formatNaira` in `src/lib/format.ts`.
- Payment providers are behind a modular layer so a second provider can be added without touching booking logic.
