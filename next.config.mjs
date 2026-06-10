/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mark all @react-pdf/* packages as external for the server bundle.
  // This forces Next.js RSC to use native Node.js require() instead of
  // bundling them through the RSC React 19 canary runtime, which would
  // cause "Minified React error #31" when React.createElement is intercepted.
  serverExternalPackages: [
    '@react-pdf/renderer',
    '@react-pdf/layout',
    '@react-pdf/reconciler',
    '@react-pdf/primitives',
    '@react-pdf/render',
    '@react-pdf/stylesheet',
    '@react-pdf/font',
    '@react-pdf/fns',
    '@react-pdf/pdfkit',
    '@react-pdf/types',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling these through the RSC transformer.
      // They must be loaded as plain Node.js CJS modules at runtime.
      const reactPdfExternals = [
        '@react-pdf/renderer',
        '@react-pdf/reconciler',
        '@react-pdf/layout',
        '@react-pdf/render',
        '@react-pdf/stylesheet',
        '@react-pdf/font',
        '@react-pdf/primitives',
        '@react-pdf/fns',
        '@react-pdf/pdfkit',
        '@react-pdf/types',
      ];
      const existingExternals = config.externals || [];
      config.externals = [
        ...existingExternals,
        ({ request }, callback) => {
          if (reactPdfExternals.some((pkg) => request === pkg || request.startsWith(pkg + '/'))) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
