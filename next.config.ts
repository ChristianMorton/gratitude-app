import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Emits a minimal server bundle for the Docker runner stage.
  output: 'standalone',

  // Next keeps its dev-server lock inside distDir, so two dev servers can only run
  // from one checkout if they build to different directories. The e2e run sets this
  // to `.next-e2e`, which lets `npm run test:e2e` work without stopping the dev
  // server you're using. Unset everywhere else, so prod builds are untouched.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',

  // Dev-only. Next blocks cross-origin requests to dev assets, so reaching the
  // dev server on anything but localhost — e.g. over the tailnet from another
  // machine — 403s every /_next chunk. The page still renders, so the failure
  // looks like a dead form rather than a network error: no JS means no
  // hydration, and an un-hydrated form natively GETs its fields into the URL.
  // Next only trusts the hostname the dev server booted on (`localhost`), so every
  // other origin 403s on /_next assets. 127.0.0.1 is a *different* hostname to
  // `localhost` and is blocked by default too — easy to miss, because the page still
  // renders. Without JS it never hydrates, and an un-hydrated form natively GETs its
  // fields into the URL, which is how a password ends up in browser history.
  allowedDevOrigins: [
    '127.0.0.1',
    ...(process.env.DEV_ALLOWED_ORIGINS ?? '').split(',').map((host) => host.trim()).filter(Boolean),
  ],

  // sharp is a native module: don't try to bundle it. Its libvips .so is also
  // copied explicitly in the Dockerfile, because standalone tracing picks up the
  // package's JS but not the shared library it links against.
  serverExternalPackages: ['sharp'],
}

export default nextConfig
