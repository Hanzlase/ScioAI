/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Ensure the root URL always shows the landing page
      { source: "/", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
