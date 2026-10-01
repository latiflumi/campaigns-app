import type { NextConfig } from "next";
import { PRODUCT_IMAGE_ORIGIN, PRODUCT_IMAGE_PATH } from "./app/lib/productImages";

const nextConfig: NextConfig = {
    // Let phones/other devices on the local network load dev-server scripts.
    // Without this, a non-localhost origin gets the HTML but no JS, so only
    // plain <Link>s work. Covers the laptop (192.168.10.x) and this PC (192.168.0.x).
    allowedDevOrigins: ['192.168.*.*'],

    // Product photos from the stock app (see app/lib/productImages.ts). Next resizes them, so a list
    // of 50 thumbnails loads a few KB each instead of the ~100 KB originals. Only that folder is allowed.
    images: {
        remotePatterns: [new URL(`${PRODUCT_IMAGE_ORIGIN}${PRODUCT_IMAGE_PATH}**`)],
        // Photos rarely change; keep resized copies for a week
        minimumCacheTTL: 7 * 24 * 3600,
    },
};

export default nextConfig;
