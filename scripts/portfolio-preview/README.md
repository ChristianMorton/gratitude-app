# Reproduce the component previews

These harnesses render the application's real composer/feed components with
fictional data. The map harness is a preview-only copy of the map component with
the basemap style changed to https://demotiles.maplibre.org/style.json. It uses
the same pin rendering and detail interaction. No auth, database, storage or
privacy-rule behaviour is mocked or asserted by these previews.

After `npm ci`, copy `page.tsx` to `src/app/portfolio-preview/page.tsx`.
Copy `map-page.tsx` to `src/app/portfolio-map/page.tsx` and `map-preview.tsx`
beside it. These routes refuse to render outside development mode. Use local
Supabase URL/key values when starting Next, then run `npm run dev`.
With no backend available, a placeholder key and the loopback URL suffice for
these unsigned component pages; never substitute production credentials.

Open `/portfolio-preview` and `/portfolio-map`. The header identifies fixture
data. Compose text and change the audience to try the actual client controls;
do not submit, because no backend is connected. On the map, click a pin to open
its detail card. Only fictional coordinates are sent to the external basemap.

Remove both temporary route directories after capturing. They are not included
in the release's application route tree. Production map defaults still use only
the self-hosted basemap. Recreate the preview copy from the production component
when its implementation changes.

The checked-in screenshots were captured with headless Edge at desktop and
390px mobile widths. The GIF records three real composer states (private empty
draft, friends draft, close-friends draft); it does not show saving a post.
Next's development indicator was hidden for the capture. The images themselves
were not retouched. MapLibre demo-source attribution is linked above; see that
project's source for its example data.
