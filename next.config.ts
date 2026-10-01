import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Read from the env so a database move never needs a code change.
        // The fallback is the current project (rebuilt 2026-10-01 after the
        // original project was deleted).
        hostname: new URL(
          process.env.NEXT_PUBLIC_SUPABASE_URL ??
            "https://pcouqsokuvroeddqbpwu.supabase.co"
        ).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      // Legacy Webador URLs — permanent (301) redirects so any external
      // links (Google, flyers, business cards, old email footers) that
      // point at the previous site keep landing on a valid page.
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/client-reviews",
        // The home page carries the testimonials block; send people to it
        // rather than dropping them at the top of the page.
        destination: "/#reviews",
        permanent: true,
      },
      // The remaining five legacy URLs. Each of these is in the old sitemap,
      // so Google has them indexed and they 404 without a mapping -- verified
      // on the live site: /our-services was already returning 404.
      {
        source: "/our-services",
        destination: "/#services",
        permanent: true,
      },
      {
        source: "/our-portfolio",
        destination: "/#projects",
        permanent: true,
      },
      {
        source: "/why-choose-us",
        destination: "/process",
        permanent: true,
      },
      {
        source: "/financing-options",
        destination: "/financing",
        permanent: true,
      },
      {
        source: "/meet-the-team",
        destination: "/team",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
