// app/lib/productImages.ts
// Product photos live on the stock app's image server, named
//   <StyleNumber (Artikujt.NumriSerik)>_<colour code (Artikujt.K41 label)>_1.jpg
// e.g. https://stock.am-clothes.com:8443/uploads/images/16084840_3909943_1.jpg
// Missing images return 404; the ProductThumb component then shows a placeholder.

export const PRODUCT_IMAGE_ORIGIN = "https://stock.am-clothes.com:8443"
export const PRODUCT_IMAGE_PATH = "/uploads/images/"

const SAFE = /^[A-Za-z0-9-]+$/

/** Image URL for a style + colour, or null when either part is missing or malformed. */
export function productImageUrl(styleNumber: string | number | null | undefined, colorCode: string | null | undefined): string | null {
  const style = String(styleNumber ?? "").trim()
  const color = (colorCode ?? "").trim()
  if (!SAFE.test(style) || !SAFE.test(color)) return null
  return `${PRODUCT_IMAGE_ORIGIN}${PRODUCT_IMAGE_PATH}${style}_${color}_1.jpg`
}
