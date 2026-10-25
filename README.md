# Ajour Plugin - ICS calendar

Shows the meetings in your calendar as suggestions in Ajour's Time view, so you
can add them as time entries. It reads the calendar's private ICS address,
which Google Calendar, Outlook and Exchange all publish, so one plugin covers
the three without signing in. It never writes to the calendar.

The plugin declares Ajour's `calendar` capability and exports
`validateConnection` and `listCalendarEvents`. See the Calendar API page in
Ajour's developer docs.

The plugin runs on **plugin API 4**: it runs in a sandboxed worker with no
network, disk or Node access. The calendar address is a *secret address*, the
connection's whole address. The plugin asks Ajour's broker for the connection
with a GET and an empty path, and the broker fetches the address the user saved,
turns `webcal://` into `https://`, follows up to three https redirects to any
host and hands back the status, the headers and the body. The plugin never sees
the address, the host it ended at, or a redirect.

## Get your calendar's address

- **Google Calendar.** Settings, then your calendar under "Settings for my
  calendars", then "Integrate calendar". Copy "Secret address in iCal format".
- **Outlook and Microsoft 365.** Settings, Calendar, Shared calendars. Under
  "Publish a calendar", pick the calendar and "Can view all details", then
  publish and copy the ICS link. Your organization may have turned publishing
  off.
- **Exchange in your organization.** In Outlook on the web, the same "Publish a
  calendar" setting, if your administrator allows it.

The address works without a password. Anyone who has it can read your whole
calendar until you reset it: "Reset private URLs" in Google Calendar,
"Unpublish" in Outlook. Ajour keeps it in its vault as a secret connection
value, never passes it to the plugin and keeps it out of logs and error
messages.

Add **Your email** to the connection if your calendar lists attendees. The
plugin uses it to find your own reply, so Ajour can hide meetings you declined.
For a Google calendar, the plugin falls back to the calendar's name, which is
your email.

## What reaches Ajour

For each occurrence in the requested days: the event's id, its series id when
it repeats, start, end, whether it is all-day, the title, the status, your
reply, whether it blocks time, and whether you organize it. Nothing else.
Attendees, descriptions, locations and meeting links stay in the plugin.

## Known limits

- Google serves the secret address from a cache. New and changed events can
  take several hours to appear.
- Outlook's published calendars often leave out attendees, so your reply shows
  as unknown.
- A calendar larger than 5 MB, or one that takes more than 20 seconds to
  download, is refused. Ajour's broker refuses an answer over 8 MB and a request
  over 20 seconds before the plugin sees them; the plugin refuses a feed over
  5 MB itself.
- The address must be https (or webcal). Ajour's broker refuses a redirect to a
  plain http address, or after the third, and the plugin shows the broker's
  message.
- Time zones come from the calendar's own definitions. A zone named without a
  definition is read as an IANA name, or as one of the common Windows names.
  Times without a zone use the calendar's zone, then yours.

## Development

Requirements: Node.js 24 (for the build and the tests; the plugin itself runs in
Ajour's worker), Corepack with pnpm 10.7.0, and `just` (optional).

```sh
just install
just test
just typecheck
just build
```

`just dev` rebuilds the bundle on every change. To try it in a development
build of Ajour, point Settings, Debug, at this folder.

The build bundles the plugin and [ical.js](https://github.com/kewisch/ical.js)
into `dist/plugin.js` with esbuild, as one ES module for the browser
(`scripts/bundle-options.mjs`), because Ajour installs only `plugin.json` and
`dist/`. `tsc` only type-checks, and without Node types, so `Buffer` or
`process` in the source fails the type check. The bundle's tests also fail on a
Node built-in, `Buffer`, `require`, a global `fetch` or an `Authorization`
header.

## The Ajour SDK

The tests use `createFakeAjour` from `@ajour/plugin-sdk`, which refuses what
Ajour's broker would: a request that is not a GET with an empty path, or a
header that `plugin.json` does not list. The SDK is not on npm yet, so the packed
package is vendored in `vendor/ajour-plugin-sdk-0.1.0.tgz` and installed as a
`file:` dev dependency.

It was built from Ajour commit `678911a6a6f935927a956087eb6b742120446a9f`
(`packages/plugin-sdk`, version 0.1.0). Refresh it when the plugin contract
changes:

```sh
# in an Ajour checkout
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @ajour/plugin-sdk build
cd packages/plugin-sdk && npm pack
# copy ajour-plugin-sdk-<version>.tgz to vendor/, point package.json at it,
# run `just install`, and update the commit above
```

Once the SDK is published, swap the `file:` dependency for a version range and
delete `vendor/`.

## Build an installable plugin

```sh
just package
```

The archive is written to `package/ics-<version>.ajour-connector`. It holds
`plugin.json` and `dist/` (the bundle) only. Its version comes from
`plugin.json`; keep it aligned with `package.json`.

Every push to `main` runs the tests and type checks, stamps a prerelease
version such as `0.1.0-main.3.9aac30e`, packages the archive, keeps it as a
GitHub Actions artifact for 30 days and publishes it as a GitHub prerelease.

## Install in Ajour

In the desktop app, open **Settings, Plugins**, choose **Install plugin** and
select the `.ajour-connector` archive. Then add a connection with your
calendar's address.

Until the release that switches every plugin to API 4, Ajour admits an API 4
package in development builds only.

## License

MIT. The bundle includes ical.js, under the Mozilla Public License 2.0; its
license notice and source link are at the top of `dist/plugin.js`.
