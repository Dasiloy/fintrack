/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fintrack/database", "@fintrack/utils", "@fintrack/ui"],
};

export default nextConfig;
