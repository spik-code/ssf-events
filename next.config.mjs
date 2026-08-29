/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Every <Image> is delivered by ImageKit — see lib/imagekit-loader.ts.
    // Local /media and /brand paths pass through untouched.
    loader: "custom",
    loaderFile: "./lib/imagekit-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
