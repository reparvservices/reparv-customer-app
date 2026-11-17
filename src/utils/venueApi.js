import {API_BASE_URL} from '../config/api';
import {requestJson} from './networkClient';

const BASE = `${API_BASE_URL}/customerapp`;
const json = {'Content-Type': 'application/json'};
const auth = token => ({...json, Authorization: `Bearer ${token}`});

export const VENUE_TYPES = ['villa', 'hall', 'banquet', 'farmhouse', 'resort', 'lawn'];

export const rupees = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** YYYY-MM-DD in local time (the server's calendar days are plain dates). */
export const toIso = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDaysIso = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return toIso(new Date(y, m - 1, d + n));
};

const dayDiff = (a, b) => {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
};

/** Same overlap rule as the server: dates overlap (end exclusive) and slots overlap. */
export const stayClashes = (stay, taken) =>
  dayDiff(stay.start, taken.end) > 0 &&
  dayDiff(taken.start, stay.end) > 0 &&
  (stay.slot === 'full' || taken.slot === 'full' || stay.slot === taken.slot);

export async function fetchVenues({city, type, q, page = 1} = {}) {
  const p = new URLSearchParams({page: String(page), limit: '20'});
  if (city) {p.set('city', city);}
  if (type) {p.set('type', type);}
  if (q) {p.set('q', q);}
  const data = await requestJson(`${BASE}/venues?${p}`, {method: 'GET'}, 'venues');
  return {listings: data?.listings || [], hasMore: Boolean(data?.hasMore)};
}

export async function fetchVenue(id) {
  const data = await requestJson(`${BASE}/venues/${id}`, {method: 'GET'}, 'venue');
  return data?.listing;
}

/** Everything unavailable from today for ~2 months: [{start,end,slot}] */
export async function fetchUnavailable(id) {
  const data = await requestJson(`${BASE}/venues/${id}/availability`, {method: 'GET'}, 'venue availability');
  const booked = (data?.booked || []).map(b => ({start: b.start, end: b.end, slot: b.slot}));
  const blocked = (data?.blocked || []).map(b => ({start: b.date, end: addDaysIso(b.date, 1), slot: b.slot}));
  return [...booked, ...blocked];
}

export async function fetchQuote(id, input) {
  return requestJson(
    `${BASE}/venues/${id}/quote`,
    {method: 'POST', headers: json, body: JSON.stringify(input)},
    'venue quote',
  );
}

export async function createVenueBooking(input, token) {
  return requestJson(
    `${BASE}/venue-bookings`,
    {method: 'POST', headers: auth(token), body: JSON.stringify(input)},
    'venue booking',
  );
}

export async function verifyVenuePayment(payload, token) {
  return requestJson(
    `${BASE}/venue-bookings/verify`,
    {method: 'POST', headers: auth(token), body: JSON.stringify(payload)},
    'venue payment verify',
  );
}

export async function fetchMyVenueBookings(token) {
  const data = await requestJson(`${BASE}/venue-bookings`, {method: 'GET', headers: auth(token)}, 'my venue bookings');
  return data?.bookings || [];
}

export async function cancelVenueBooking(id, token, reason) {
  return requestJson(
    `${BASE}/venue-bookings/${id}/cancel`,
    {method: 'POST', headers: auth(token), body: JSON.stringify({reason})},
    'venue cancel',
  );
}
