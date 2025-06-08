
import type {NextConfig} from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack'; // Import webpack Configuration type

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (
    config: WebpackConfiguration,
    { isServer }: { isServer: boolean }
  ): WebpackConfiguration => {
    if (!isServer) {
      // Ensure config.resolve object exists
      if (!config.resolve) {
        config.resolve = {};
      }
      // Ensure config.resolve.fallback object exists and add/override fs and path
      // This prevents errors from libraries trying to require Node.js built-in modules
      // like 'fs' or 'path' in a browser environment.
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}), // Preserve any existing fallbacks
        fs: false, // Tell Webpack to treat 'fs' as an empty module on the client
        path: false, // Tell Webpack to treat 'path' as an empty module on the client
      };
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
