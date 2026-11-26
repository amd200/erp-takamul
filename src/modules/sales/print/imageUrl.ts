/**
 * The server sends branch images as http links that it redirects to https. The redirect answer carries no CORS header,
 * so an image asked for with `crossorigin` through the http link never loads; the https link does.
 */
export const secureImageUrl = (url: string) => url.replace(/^http:\/\//i, "https://")
