import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Let phones/other devices on the local network load dev-server scripts.
    // Without this, a non-localhost origin gets the HTML but no JS, so only
    // plain <Link>s work. Covers the laptop (192.168.10.x) and this PC (192.168.0.x).
    allowedDevOrigins: ['192.168.*.*'],
};

export default nextConfig;
