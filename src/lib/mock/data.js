/**
 * Destination photography ships with the app rather than being hot-linked, so
 * the landing page renders identically offline and never depends on a third
 * party staying up. Property imagery is deliberately *not* bundled — that comes
 * from the API, which serves each listing's own uploads.
 */
import londonImage from '@/assets/images/destinations/london.jpg';
import barcelonaImage from '@/assets/images/destinations/barcelona.jpg';
import madridImage from '@/assets/images/destinations/madrid.jpg';
import abujaImage from '@/assets/images/destinations/abuja.jpg';
import dubaiImage from '@/assets/images/destinations/dubai.jpg';
import newYorkImage from '@/assets/images/destinations/new-york.jpg';
import lagosImage from '@/assets/images/destinations/lagos.jpg';
import parisImage from '@/assets/images/destinations/paris.jpg';

// Testimonial portraits — bundled for the same reason as the destinations.
import eleanorAvatar from '@/assets/images/avatars/eleanor.jpg';
import marcusAvatar from '@/assets/images/avatars/marcus.jpg';
import amaraAvatar from '@/assets/images/avatars/amara.jpg';

/**
 * Seed data for the in-browser mock backend.
 *
 * Everything here mirrors the shape a real API would return, so swapping
 * `VITE_USE_MOCK=false` changes only *where* the data comes from — never how
 * components consume it.
 *
 * Photography is illustrative placeholder imagery from Unsplash, not the actual
 * residences — replace the URLs when real inventory is available.
 */

const img = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/* -------------------------------------------------------------------------- */
/* Destinations — "Featured Destinations" grid on the landing page             */
/* -------------------------------------------------------------------------- */

export const destinations = [
  { id: 'london', city: 'London', country: 'UK', code: 'GB', properties: 60, image: londonImage },
  { id: 'barcelona', city: 'Barcelona', country: 'SPAIN', code: 'ES', properties: 40, image: barcelonaImage },
  { id: 'madrid', city: 'Madrid', country: 'SPAIN', code: 'ES', properties: 42, image: madridImage },
  { id: 'abuja', city: 'Abuja', country: 'Nigeria', code: 'NG', properties: 62, image: abujaImage },
  { id: 'dubai', city: 'Dubai', country: 'UAE', code: 'AE', properties: 100, image: dubaiImage },
  { id: 'new-york', city: 'New York', country: 'United States', code: 'US', properties: 80, image: newYorkImage },
  { id: 'lagos', city: 'Lagos', country: 'Nigeria', code: 'NG', properties: 54, image: lagosImage },
  { id: 'paris', city: 'Paris', country: 'France', code: 'FR', properties: 48, image: parisImage },
];

/* -------------------------------------------------------------------------- */
/* Properties                                                                  */
/* -------------------------------------------------------------------------- */

const AMENITY_SET = [
  'Infinity Pool',
  '24/7 Security',
  'High Speed Wi-Fi',
  'Private Balcony',
  'Air Conditioning',
  'Smart Home System',
  'Fitness Center',
  'Elevator Access',
];

const HIGHLIGHTS = [
  'Spacious living and dining area with modern interiors',
  'Floor-to-ceiling windows with natural marina views',
  'Modern kitchen with premium built-in appliances',
  'Master bedroom with en-suite bathroom',
  'Private balcony overlooking the marina',
  'Secure gated estate with 24/7 security and CCTV monitoring',
  'Dedicated parking space and visitor parking area',
  'Close to metro, restaurants, and entertainment hub',
];

const LANDMARKS = [
  '2 minutes walk to Marina Walk',
  '5 minutes to Dubai Marina Mall',
  '8 mins to JBR Beach',
  '10 mins to Palm Jumeirah',
  '12 mins to Metro Station',
];

const MANAGER = {
  id: 'mgr_daniel',
  name: 'Daniel Miller',
  role: 'Property Manager',
  initials: 'DM',
  yearsManaging: 5,
  responseTime: 'Within 1 hour',
  rating: 4.8,
  reviewCount: 120,
  availability: 'Available 24/7 on chat',
};

const baseProperty = (overrides) => ({
  type: 'Apartments',
  currency: 'GBP',
  rating: 5.0,
  reviewCount: 18,
  guests: 6,
  areaSqm: 1950,
  areaSqft: 2450,
  verified: true,
  availableForRent: true,
  bedConfiguration: 'King, Queen, Twin',
  bathroomConfiguration: 'En-suite',
  amenities: AMENITY_SET,
  highlights: HIGHLIGHTS,
  landmarks: LANDMARKS,
  manager: MANAGER,
  cleaningFee: 30000,
  serviceFee: 20000,
  description: [
    'This well-finished apartment is located in a secure and serene estate at the heart of the neighbourhood. The living room is spacious and naturally lit, opening to a private balcony with partial marina views.',
    'The property offers excellent access to major roads, supermarkets, schools, and local transport. Residents enjoy a peaceful environment with 24/7 security and CCTV monitoring for your comfort and safety.',
  ],
  ...overrides,
});

export const properties = [
  baseProperty({
    id: 'azure-penthouse-dubai-marina',
    name: 'The Azure Penthouse, Dubai Marina',
    shortName: 'The Azure Penthouse',
    city: 'Dubai Marina',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Penthouses',
    price: 420,
    beds: 3,
    baths: 3,
    featured: true,
    images: [
      img('1600607687939-ce8a6c25118c'),
      img('1600566753086-00f18fb6b3ea'),
      img('1600585154340-be6161a56a0c'),
      img('1582719478250-c89cae4dc85b'),
      img('1600210492486-724fe5c67fb0'),
      img('1556911220-bff31c812dba'),
    ],
  }),
  baseProperty({
    id: 'exclusive-sea-view-residence',
    name: 'Exclusive Sea View Residence',
    shortName: 'Exclusive Sea View Residence',
    city: 'Dubai Marina',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Villas',
    price: 420,
    beds: 3,
    baths: 3,
    featured: true,
    images: [img('1613490493576-7fde63acd811'), img('1600596542815-ffad4c1539a9'), img('1512917774080-9991f1c4c750')],
  }),
  baseProperty({
    id: 'barcelona-loft',
    name: 'Barcelona Loft',
    shortName: 'Barcelona Loft',
    city: 'Dubai Harbour',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Lofts',
    price: 300,
    beds: 2,
    baths: 2,
    guests: 5,
    featured: true,
    images: [img('1582719478250-c89cae4dc85b'), img('1613977257363-707ba9348227'), img('1580587771525-78b9dba3b914')],
  }),
  baseProperty({
    id: 'manhattan-skyline-residence',
    name: 'Manhattan Skyline Residence',
    shortName: 'Manhattan Skyline Residence',
    city: 'Jumeirah Beach Residence',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Apartments',
    price: 260,
    beds: 4,
    baths: 4,
    featured: true,
    images: [img('1600047509807-ba8f99d2cdde'), img('1600566753086-00f18fb6b3ea'), img('1560448204-e02f11c3d0e2')],
  }),
  baseProperty({
    id: 'skyline-penthouse-retreat',
    name: 'Skyline Penthouse Retreat',
    shortName: 'Skyline Penthouse Retreat',
    city: 'Business Bay',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Penthouses',
    price: 420,
    beds: 3,
    baths: 2,
    featured: true,
    images: [img('1600585154340-be6161a56a0c'), img('1613490493576-7fde63acd811'), img('1568605114967-8130f3a36994')],
  }),
  baseProperty({
    id: 'victoria-sanctuary',
    name: 'Victoria Sanctuary',
    shortName: 'Victoria Sanctuary',
    city: 'Abuja',
    country: 'Nigeria',
    destinationId: 'abuja',
    type: 'Villas',
    currency: 'NGN',
    price: 250000,
    cleaningFee: 30000,
    serviceFee: 20000,
    beds: 3,
    baths: 3,
    featured: true,
    images: [img('1600607687939-ce8a6c25118c'), img('1600566753086-00f18fb6b3ea'), img('1568605114967-8130f3a36994')],
  }),
  baseProperty({
    id: 'chelsea-heritage-suite',
    name: 'The Chelsea Heritage Suite',
    shortName: 'The Chelsea Heritage Suite',
    city: 'London',
    country: 'United Kingdom',
    destinationId: 'london',
    type: 'Hotel Suites',
    price: 400,
    beds: 3,
    baths: 2,
    featured: true,
    images: [img('1522708323590-d24dbb6b0267'), img('1493809842364-78817add7ffb'), img('1560448075-bb485b067938')],
  }),
  baseProperty({
    id: 'castellana-cloud-loft',
    name: 'Castellana Cloud Loft',
    shortName: 'Castellana Cloud Loft',
    city: 'London',
    country: 'United Kingdom',
    destinationId: 'london',
    type: 'Lofts',
    price: 400,
    beds: 3,
    baths: 2,
    featured: true,
    images: [img('1512917774080-9991f1c4c750'), img('1600596542815-ffad4c1539a9'), img('1613977257363-707ba9348227')],
  }),
  baseProperty({
    id: 'madrid-heritage-suite',
    name: 'The Madrid Heritage Suite',
    shortName: 'The Madrid Heritage Suite',
    city: 'Madrid',
    country: 'Spain',
    destinationId: 'madrid',
    type: 'Hotel Suites',
    price: 300,
    beds: 5,
    baths: 2,
    featured: true,
    images: [img('1505693416388-ac5ce068fe85'), img('1540518614846-7eded433c457'), img('1571003123894-1f0594d2b5d9')],
  }),
  baseProperty({
    id: 'ikoyi-sanctuary',
    name: 'The Ikoyi Sanctuary',
    shortName: 'The Ikoyi Sanctuary',
    city: 'Lagos',
    country: 'Nigeria',
    destinationId: 'lagos',
    type: 'Apartments',
    price: 250,
    beds: 3,
    baths: 2,
    featured: true,
    images: [img('1560448204-e02f11c3d0e2'), img('1600210492486-724fe5c67fb0'), img('1522708323590-d24dbb6b0267')],
  }),
  baseProperty({
    id: 'azure-palm',
    name: 'The Azure Palm',
    shortName: 'The Azure Palm',
    city: 'Dubai',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Villas',
    price: 400,
    beds: 3,
    baths: 2,
    featured: true,
    images: [img('1566073771259-6a8506099945'), img('1582719478250-c89cae4dc85b'), img('1571003123894-1f0594d2b5d9')],
  }),
  baseProperty({
    id: 'marina-skyline-suite',
    name: 'Marina Skyline Suite',
    shortName: 'Marina Skyline Suite',
    city: 'Business Bay',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Hotel Suites',
    price: 420,
    beds: 3,
    baths: 2,
    images: [img('1613977257363-707ba9348227'), img('1600585154340-be6161a56a0c'), img('1560448075-bb485b067938')],
  }),
  baseProperty({
    id: 'premium-2br-jbr',
    name: 'Premium 2BR in JBR',
    shortName: 'Premium 2BR in JBR',
    city: 'Dubai Harbour',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Apartments',
    price: 300,
    beds: 2,
    baths: 2,
    guests: 5,
    images: [img('1582719478250-c89cae4dc85b'), img('1613490493576-7fde63acd811'), img('1600596542815-ffad4c1539a9')],
  }),
  baseProperty({
    id: 'luxury-marina-view-apartment',
    name: 'Luxury Marina View Apartment',
    shortName: 'Luxury Marina View Apartment',
    city: 'Jumeirah Beach Residence',
    country: 'UAE',
    destinationId: 'dubai',
    type: 'Apartments',
    price: 260,
    beds: 4,
    baths: 4,
    images: [img('1600607687939-ce8a6c25118c'), img('1566073771259-6a8506099945'), img('1600047509807-ba8f99d2cdde')],
  }),
  baseProperty({
    id: 'modern-penthouse-terrace',
    name: 'Modern Penthouse With Terrace',
    shortName: 'Modern Penthouse With Terrace',
    city: 'Bordeaux',
    country: 'France',
    destinationId: 'paris',
    type: 'Penthouses',
    currency: 'USD',
    price: 325,
    beds: 5,
    baths: 3,
    images: [img('1512917774080-9991f1c4c750'), img('1600596542815-ffad4c1539a9'), img('1600585154340-be6161a56a0c')],
  }),
  baseProperty({
    id: 'charming-historic-townhouse',
    name: 'Charming Historic Townhouse',
    shortName: 'Charming Historic Townhouse',
    city: 'Bordeaux',
    country: 'France',
    destinationId: 'paris',
    type: 'Cottages',
    currency: 'USD',
    price: 200,
    beds: 5,
    baths: 3,
    images: [img('1580587771525-78b9dba3b914'), img('1568605114967-8130f3a36994'), img('1522708323590-d24dbb6b0267')],
  }),
  baseProperty({
    id: 'cozy-studio-saint-pierre',
    name: 'Cozy Studio near Saint-Pierre',
    shortName: 'Cozy Studio near Saint-Pierre',
    city: 'Bordeaux',
    country: 'France',
    destinationId: 'paris',
    type: 'Lofts',
    currency: 'USD',
    price: 125,
    beds: 5,
    baths: 3,
    images: [img('1493809842364-78817add7ffb'), img('1505693416388-ac5ce068fe85'), img('1560448204-e02f11c3d0e2')],
  }),
];

export const propertyTypes = [
  'All',
  'Apartments',
  'Villas',
  'Penthouses',
  'Lofts',
  'Hotel Suites',
  'Cottages',
];

export const searchFilters = [
  'Price',
  'Type of place',
  'Free cancellation',
  'Wifi',
  'Kitchen',
  'Air conditioning',
  'Washer',
  'Iron',
  'Dedicated workspace',
  'Free parking',
  'Dryer',
];

/* -------------------------------------------------------------------------- */
/* Landing page content                                                        */
/* -------------------------------------------------------------------------- */

export const testimonials = [
  {
    id: 't1',
    name: 'Eleanor Thompson.',
    stay: 'Stayed at the Barcelona Loft',
    rating: 5,
    avatar: eleanorAvatar,
    quote:
      'The attention to detail at the Barcelona Loft was unmatched. It felt like a 5-star hotel with the privacy of a home.',
  },
  {
    id: 't2',
    name: 'Marcus Chen.',
    stay: 'Stayed at The Azure Palm',
    rating: 5,
    avatar: marcusAvatar,
    quote:
      'As a business traveler, the seamless check-in and reliable high-speed internet in Dubai were critical. Exceptional service.',
  },
  {
    id: 't3',
    name: 'Amina Okafor.',
    stay: 'Stayed at the Victoria Sanctuary',
    rating: 5,
    avatar: amaraAvatar,
    quote:
      'We found a beautiful apartment in 4 days — and not one agent issue. Everything was transparent and safe.',
  },
];

export const trustStats = [
  { id: 'rating', value: '4.9', label: 'Average Rating', stars: true },
  { id: 'guests', value: '100K+', label: 'Verified Guests' },
  { id: 'moveins', value: '5,200', label: 'Move-Ins' },
  { id: 'activity', value: 'Last 60 Days', label: 'Recent Activity' },
];

export const valueProps = [
  {
    id: 'hospitality',
    icon: 'gem',
    title: 'Premium Hospitality',
    description:
      'Personalized concierge services and luxury amenities tailored to your lifestyle and travel needs.',
  },
  {
    id: 'compliance',
    icon: 'clipboard-check',
    title: 'Compliance-First',
    description:
      'Every property is verified against local regulations, safety standards, and hospitality requirements.',
  },
  {
    id: 'reach',
    icon: 'globe',
    title: 'Global Reach',
    description:
      "A curated collection of exclusive properties in the world's most desirable business and leisure hubs.",
  },
];

export const propertyAssurances = [
  {
    id: 'verified',
    icon: 'badge-check',
    title: 'Verified Properties',
    description: 'All properties are verified for quality and authenticity.',
  },
  {
    id: 'payments',
    icon: 'credit-card',
    title: 'Secure Payments',
    description: 'Your payments are protected with bank-level security.',
  },
  {
    id: 'concierge',
    icon: 'headset',
    title: '24/7 Concierge',
    description: 'Round-the-clock support for a seamless stay.',
  },
];

export const faqs = [
  {
    id: 'checkin',
    question: 'What time is check-in and check-out?',
    answer:
      'Check-in is from 3:00 PM and check-out is by 11:00 AM. Early check-in and late check-out can be arranged with your property manager, subject to availability.',
  },
  {
    id: 'long-term',
    question: 'Is the property available for long-term stays?',
    answer:
      'Yes. Stays of 28 nights or more qualify for our extended-stay rates, which include weekly housekeeping and a dedicated concierge.',
  },
  {
    id: 'cancel',
    question: 'Can I cancel my booking?',
    answer:
      'Bookings cancelled more than 14 days before check-in are refunded in full. Within 14 days, the first night is retained as a cancellation fee.',
  },
  {
    id: 'parking',
    question: 'Is parking available?',
    answer:
      'Each residence includes at least one dedicated parking space, with additional visitor parking inside the gated estate.',
  },
  {
    id: 'wifi',
    question: 'Is Wi-Fi included?',
    answer:
      'Yes — complimentary high-speed fibre Wi-Fi (up to 500 Mbps) is included in every Alotel Spaces residence.',
  },
  {
    id: 'verified',
    question: 'Is the property verified?',
    answer:
      'Every listing carries the Verified Property badge only after our compliance team has inspected the residence and validated ownership documents.',
  },
];

/* -------------------------------------------------------------------------- */
/* Booking flow                                                                */
/* -------------------------------------------------------------------------- */

export const verificationMethods = [
  {
    id: 'nin',
    label: 'NIN Verification',
    description: 'Verify with your National Identification Number',
    icon: 'id-card',
  },
  {
    id: 'drivers-license',
    label: "Driver's License",
    description: "Verify with your Driver's License",
    icon: 'car-front',
  },
  {
    id: 'passport',
    label: 'International Passport',
    description: 'Verify with your International Passport',
    icon: 'book-user',
  },
];

export const paymentMethods = [
  { id: 'bank-transfer', label: 'Bank Transfer' },
  { id: 'card', label: 'Debit / Credit Card' },
  { id: 'ussd', label: 'USSD' },
];

export const payoutAccount = {
  bankName: 'Guaranty Trust Bank (GTBank)',
  accountName: 'Alotel Spaces Limited',
};

/* -------------------------------------------------------------------------- */
/* Demo credentials — surfaced on the login screen in mock mode                */
/* -------------------------------------------------------------------------- */

export const demoUser = {
  id: 'usr_demo',
  fullName: 'Jane Williams',
  email: 'demo@alotelspaces.com',
  password: 'Password123',
  phone: '08120202020',
  role: 'guest',
  avatar: eleanorAvatar,
  memberSince: '2024-03-11T09:00:00.000Z',
  emailVerified: true,
  identityVerified: true,
};
