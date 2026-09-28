import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Let phones/other devices on the local network load dev-server scripts.
    // Without this, a non-localhost origin gets the HTML but no JS, so only
    // plain <Link>s work. Covers the laptop (192.168.10.x) and this PC (192.168.0.x).
    allowedDevOrigins: ['192.168.*.*'],

    async redirects() {
        return [
            // "/" has no real page yet (app/page.tsx is placeholder data), so send people
            // to the campaigns module. Temporary on purpose: "/" becomes the BI overview
            // later, and a permanent (308) redirect would stay cached in browsers.
            { source: '/', destination: '/campaigns', permanent: false },
        ];
    },
};

export default nextConfig;
