import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The repo root has its own lockfile (for `concurrently`), so pin the root to this app.
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
};

export default nextConfig;
