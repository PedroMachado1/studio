
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
      // Prevent 'fs' and 'path' modules from being resolved on the client-side
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback, // Spread existing fallbacks
          fs: false,
          path: false,
        },
      };
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
