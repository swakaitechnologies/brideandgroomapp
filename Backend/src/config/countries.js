/**
 * Country Registry — All supported countries with locale configuration.
 * Admin can enable/disable countries via SystemSettings without code changes.
 */
const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR", currencySymbol: "₹", phoneCode: "+91", timezone: "Asia/Kolkata", dateFormat: "DD/MM/YYYY", gateway: "razorpay" },
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", phoneCode: "+1", timezone: "America/New_York", dateFormat: "MM/DD/YYYY", gateway: "stripe" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "د.إ", phoneCode: "+971", timezone: "Asia/Dubai", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", phoneCode: "+44", timezone: "Europe/London", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "C$", phoneCode: "+1", timezone: "America/Toronto", dateFormat: "MM/DD/YYYY", gateway: "stripe" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$", phoneCode: "+61", timezone: "Australia/Sydney", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "S$", phoneCode: "+65", timezone: "Asia/Singapore", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "NZ$", phoneCode: "+64", timezone: "Pacific/Auckland", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "DE", name: "Germany", currency: "EUR", currencySymbol: "€", phoneCode: "+49", timezone: "Europe/Berlin", dateFormat: "DD.MM.YYYY", gateway: "stripe" },
  { code: "FR", name: "France", currency: "EUR", currencySymbol: "€", phoneCode: "+33", timezone: "Europe/Paris", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥", phoneCode: "+81", timezone: "Asia/Tokyo", dateFormat: "YYYY/MM/DD", gateway: "stripe" },
  { code: "KR", name: "South Korea", currency: "KRW", currencySymbol: "₩", phoneCode: "+82", timezone: "Asia/Seoul", dateFormat: "YYYY.MM.DD", gateway: "stripe" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R", phoneCode: "+27", timezone: "Africa/Johannesburg", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "MY", name: "Malaysia", currency: "MYR", currencySymbol: "RM", phoneCode: "+60", timezone: "Asia/Kuala_Lumpur", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "LK", name: "Sri Lanka", currency: "LKR", currencySymbol: "Rs", phoneCode: "+94", timezone: "Asia/Colombo", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "NP", name: "Nepal", currency: "NPR", currencySymbol: "रू", phoneCode: "+977", timezone: "Asia/Kathmandu", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "BD", name: "Bangladesh", currency: "BDT", currencySymbol: "৳", phoneCode: "+880", timezone: "Asia/Dhaka", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "PK", name: "Pakistan", currency: "PKR", currencySymbol: "₨", phoneCode: "+92", timezone: "Asia/Karachi", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh", phoneCode: "+254", timezone: "Africa/Nairobi", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
  { code: "NG", name: "Nigeria", currency: "NGN", currencySymbol: "₦", phoneCode: "+234", timezone: "Africa/Lagos", dateFormat: "DD/MM/YYYY", gateway: "stripe" },
];

/**
 * Get country config by ISO code.
 */
const getCountry = (code) => COUNTRIES.find((c) => c.code === code?.toUpperCase());

/**
 * Get all supported countries.
 */
const getAllCountries = () => COUNTRIES;

/**
 * Get default gateway for a country.
 */
const getGatewayForCountry = (code) => {
  const country = getCountry(code);
  return country ? country.gateway : "stripe";
};

/**
 * Get currency for a country.
 */
const getCurrencyForCountry = (code) => {
  const country = getCountry(code);
  return country ? country.currency : "USD";
};

module.exports = {
  COUNTRIES,
  getCountry,
  getAllCountries,
  getGatewayForCountry,
  getCurrencyForCountry,
};
