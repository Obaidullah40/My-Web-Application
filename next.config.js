/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Add allowed image hosts here as needed (e.g. for testimonial/profile images)
    ],
  },
};

module.exports = nextConfig;
