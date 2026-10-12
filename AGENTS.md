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
- Admin panel screens live in src/components/admin/ as reusable panels; the admin route only handles layout and navigation. Why: keeps the route small and makes it easy to add sections.
- Admin navigation uses a scrollable flex sidebar and account actions are rendered by the Settings panel independently of content loading. Why: prevents short-screen overlap and keeps session controls available on content errors.

- Storefront theme is controlled by the header and persisted under veerja-theme; semantic tokens supply both modes. Why: keeps the sun/moon switch consistent across page sections.
- Catalog discovery filters published products in the browser using dynamic category metadata and pantry-group aliases. Why: supports named pantry groups without changing admin-managed categories.
- Product uploads persist the selected variant on image records and validate product ownership; storefront galleries use only that variant's photos plus shared photos. Why: prevents photos leaking between pack sizes.
- Review photos/videos live in the private review-media bucket under the uploader's user-id folder; the public media route serves only files of approved reviews. Why: pending/rejected uploads must never leak.
