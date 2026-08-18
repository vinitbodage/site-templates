/**
 * Wyndham Grand booking URL helpers.
 *
 * The base URL is set by the book-now-modal block at decoration time so
 * credentials and chain/hotel IDs stay in authored content, not hardcoded
 * across the codebase.
 */

const DEFAULT_BOOKING_URL = 'https://be-p2.synxis.com/?chain=5136&hotel=80554&src=SBE&theme=WY80554&config=WY80554';

let bookingBaseUrl = DEFAULT_BOOKING_URL;

/**
 * @param {string} url booking engine base URL
 */
export function setBookingBaseUrl(url) {
  if (url) bookingBaseUrl = url;
}

/** @returns {string} */
export function getBookingBaseUrl() {
  return bookingBaseUrl;
}

/**
 * Builds the booking engine URL from validated form data.
 * @param {object} data form field values
 * @returns {string}
 */
export function buildBookingUrl(data) {
  const url = new URL(bookingBaseUrl);
  url.searchParams.set('arrive', data.checkIn);
  url.searchParams.set('depart', data.checkOut);
  url.searchParams.set('adult', String(data.adults));
  url.searchParams.set('rooms', String(data.rooms));
  if (data.children) url.searchParams.set('child', String(data.children));
  if (data.promoCode) url.searchParams.set('promo', data.promoCode);
  if (data.firstName) url.searchParams.set('firstName', data.firstName);
  if (data.lastName) url.searchParams.set('lastName', data.lastName);
  if (data.email) url.searchParams.set('email', data.email);
  if (data.phone) url.searchParams.set('phone', data.phone);
  if (data.specialRequests) url.searchParams.set('comments', data.specialRequests);
  return url.toString();
}
