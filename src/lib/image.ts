export const MAX_IMAGE_SIZE = 2 * 1024 * 1024
export const IMAGE_TYPES = ["image/png", "image/jpeg"]

/** The i18n key of why a picture is refused (PNG/JPG only, up to 2 MB), or null when it is fine. */
export const imageError = (file: File): "products.imageType" | "products.imageTooBig" | null =>
  !IMAGE_TYPES.includes(file.type) ? "products.imageType" : file.size > MAX_IMAGE_SIZE ? "products.imageTooBig" : null
