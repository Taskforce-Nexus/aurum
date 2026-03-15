/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Exclude skills/agents directories from file watching to prevent slow dev server
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.agents/**',
        '**/.claude/skills/**',
        '**/.kiro/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
