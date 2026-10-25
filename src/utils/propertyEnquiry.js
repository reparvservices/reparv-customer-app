import {API_BASE_URL} from '../config/api';

const DEFAULT_CONTACT = '8010881965';

/** 10-digit number to call / WhatsApp for a property (same fallbacks as the website). */
export const propertyContactOf = property => {
  const raw =
    property?.projectPartnerContact ||
    property?.guestUserContact ||
    DEFAULT_CONTACT;
  const digits = String(raw).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : DEFAULT_CONTACT;
};

// Enquiry category the website asks the visitor to pick, derived from the listing
const enquiryCategoryOf = propertyCategory => {
  if (String(propertyCategory || '').startsWith('Rental')) {
    return 'Rent Property';
  }
  if (propertyCategory === 'Resale') return 'Buy Resale Property';
  return 'Buy New Property';
};

/**
 * Tracks a call / whatsapp / share action in property analytics.
 * Fire-and-forget: never blocks the action itself.
 */
export const trackPropertyAction = (propertyid, source) => {
  if (!propertyid) return;
  fetch(`${API_BASE_URL}/admin/propertyAnalytics/addvisits`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({propertyid, source}),
  }).catch(err => console.log('Track property action error:', err));
};

/**
 * Saves a call / WhatsApp lead for the property, like the website's enquiry popups.
 * The app user is already logged in, so their own number is used instead of a form.
 *  - channel: 'call' | 'whatsapp'
 */
export const recordPropertyEnquiry = (property, user, channel) => {
  const contact = String(user?.contact || '')
    .replace(/\D/g, '')
    .slice(-10);
  if (!property?.propertyid || !/^[6-9]\d{9}$/.test(contact)) return;

  const endpoint =
    channel === 'whatsapp' ? 'whatsapp-enquirers' : 'call-enquirers';
  fetch(`${API_BASE_URL}/admin/${endpoint}/add`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      propertyid: property.propertyid,
      projectpartnerid: property.projectpartnerid,
      type: property.propertyCategory || 'NewFlat',
      category: enquiryCategoryOf(property.propertyCategory),
      contact,
    }),
  }).catch(err => console.log('Record enquiry error:', err));
};
