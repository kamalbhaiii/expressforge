/** @type {import('next').NextConfig} */
const apiUrl = (() => {
  const raw = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw) return `https://${raw}`;
  return "http://localhost:8000";
})();

const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
