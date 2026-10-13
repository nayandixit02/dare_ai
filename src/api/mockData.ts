import type {
  Order,
  OrderStatus,
  OrderPriority,
  OrderRegion,
  OrderChannel,
  ShippingAddress,
  OrderItem,
  TimelineEvent,
} from '../types/order'

// Deterministic Pseudo-Random Number Generator (mulberry32)
function createPRNG(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Lucas', 'Mia', 'Aiden',
  'Isabella', 'Jackson', 'Charlotte', 'Mason', 'Amelia', 'Oliver', 'Harper', 'Elijah',
  'Evelyn', 'Benjamin', 'Abigail', 'James', 'Emily', 'Alexander', 'Ella', 'Henry',
  'Avery', 'Sebastian', 'Scarlett', 'Daniel', 'Chloe', 'Matthew', 'Victoria', 'David',
  'Grace', 'Joseph', 'Zoey', 'Samuel', 'Penelope', 'John', 'Riley', 'Gabriel', 'Nora',
  'Carter', 'Lily', 'Luke', 'Eleanor', 'Anthony', 'Hannah', 'Dylan', 'Priya', 'Aarav',
  'Mei', 'Hiroshi', 'Zara', 'Tariq', 'Elena', 'Mateo', 'Fatima', 'Kavita',
]

const LAST_NAMES = [
  'Vance', 'Sterling', 'Blackwood', 'Chen', 'Patel', 'Sinclair', 'Nakamura', 'Moreau',
  'Mercer', 'Kowalski', 'O\'Connor', 'Al-Mansoor', 'Dubois', 'Castillo', 'Lindqvist',
  'Gomez', 'Novak', 'Fischer', 'Schneider', 'Santos', 'Reyes', 'Takahashi', 'Gupta',
  'Kim', 'Petrov', 'Larson', 'Bauer', 'Kovacs', 'Hansen', 'Morales', 'Zhang', 'Rao',
]

const COMPANIES = [
  'Vanguard Logistics', 'Acme Cloud Dynamics', 'Stripe Global Ops', 'Cyberdyne Systems',
  'Initech Enterprise', 'Wayne Enterprises Tech', 'Umbrella Biotech', 'Stark Industries',
  'Hooli Cloud Infrastructure', 'Massive Dynamic Inc', 'Pied Piper Networks',
  'Aperture Science Labs', 'Tyrell Corporation', 'Globex Automation', 'Soylent Foods',
  'Oscorp Technologies', 'Dunder Mifflin Paper', 'Buy n Large Logistics', 'Oceanic Oceanic Cargo',
  'Wonka Global Sweets', 'Weyland-Yutani Supply', 'Nakatomi Trading Co', 'Gekko & Co Capital',
]

const REGIONS: OrderRegion[] = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East',
]

const CHANNELS: OrderChannel[] = [
  'Direct Web',
  'Enterprise Portal',
  'API Partner',
  'Wholesale',
]

const STATUSES: OrderStatus[] = [
  'delivered',
  'processing',
  'in_transit',
  'cancelled',
  'refunded',
  'on_hold',
]

const PRIORITIES: OrderPriority[] = ['critical', 'high', 'medium', 'low']

const CARRIERS = ['FedEx Priority', 'DHL Express', 'UPS Air', 'Maersk Line', 'BlueDart Global']

const PRODUCTS = [
  { name: 'Quantum Core Accelerator X9', sku: 'SKU-QC-09', price: 1250 },
  { name: 'Titanium Server Rack Rail 42U', sku: 'SKU-SR-42', price: 420 },
  { name: 'Optic Fiber Transceiver 100G', sku: 'SKU-OF-100', price: 340 },
  { name: 'Industrial IoT Edge Gateway', sku: 'SKU-IOT-55', price: 890 },
  { name: 'Encrypted Hardware Key Vault v4', sku: 'SKU-KEY-04', price: 160 },
  { name: 'High-Density Lithium Battery Unit', sku: 'SKU-BAT-90', price: 1100 },
  { name: 'Thermal Dissipation Heat Sink Kit', sku: 'SKU-TH-12', price: 95 },
  { name: 'Ultra-Low Latency Switch Matrix', sku: 'SKU-SW-88', price: 2450 },
  { name: 'Precision Calibrated Sensor Array', sku: 'SKU-SN-31', price: 610 },
  { name: 'Rugged Field Diagnostics Tablet', sku: 'SKU-TAB-77', price: 1450 },
]

const CITIES_BY_REGION: Record<OrderRegion, Array<{ city: string; state: string; country: string }>> = {
  'North America': [
    { city: 'San Francisco', state: 'CA', country: 'United States' },
    { city: 'Austin', state: 'TX', country: 'United States' },
    { city: 'Seattle', state: 'WA', country: 'United States' },
    { city: 'Toronto', state: 'ON', country: 'Canada' },
    { city: 'New York', state: 'NY', country: 'United States' },
    { city: 'Vancouver', state: 'BC', country: 'Canada' },
  ],
  'Europe': [
    { city: 'Berlin', state: 'BE', country: 'Germany' },
    { city: 'London', state: 'ENG', country: 'United Kingdom' },
    { city: 'Amsterdam', state: 'NH', country: 'Netherlands' },
    { city: 'Stockholm', state: 'AB', country: 'Sweden' },
    { city: 'Zurich', state: 'ZH', country: 'Switzerland' },
    { city: 'Paris', state: 'IDF', country: 'France' },
  ],
  'Asia Pacific': [
    { city: 'Tokyo', state: '13', country: 'Japan' },
    { city: 'Singapore', state: 'SG', country: 'Singapore' },
    { city: 'Sydney', state: 'NSW', country: 'Australia' },
    { city: 'Seoul', state: '11', country: 'South Korea' },
    { city: 'Bengaluru', state: 'KA', country: 'India' },
    { city: 'Taipei', state: 'TP', country: 'Taiwan' },
  ],
  'Latin America': [
    { city: 'São Paulo', state: 'SP', country: 'Brazil' },
    { city: 'Mexico City', state: 'CDMX', country: 'Mexico' },
    { city: 'Buenos Aires', state: 'BA', country: 'Argentina' },
    { city: 'Santiago', state: 'RM', country: 'Chile' },
    { city: 'Bogotá', state: 'DC', country: 'Colombia' },
  ],
  'Middle East': [
    { city: 'Dubai', state: 'DU', country: 'United Arab Emirates' },
    { city: 'Riyadh', state: 'RI', country: 'Saudi Arabia' },
    { city: 'Doha', state: 'DA', country: 'Qatar' },
    { city: 'Abu Dhabi', state: 'AZ', country: 'United Arab Emirates' },
  ],
}

// Generate deterministic 12,500 orders dataset
export function generateOrders(totalCount: number = 12500): Order[] {
  const rng = createPRNG(42) // Fixed seed for reproducible results
  const orders: Order[] = []

  const baseTime = new Date('2026-03-01T00:00:00.000Z').getTime()
  const timeSpan = 90 * 24 * 60 * 60 * 1000 // 90 days span

  for (let i = 1; i <= totalCount; i++) {
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]
    const customerName = `${firstName} ${lastName}`
    const company = COMPANIES[Math.floor(rng() * COMPANIES.length)]
    const emailDomain = company.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10) + '.com'
    const customerEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`

    const region = REGIONS[Math.floor(rng() * REGIONS.length)]
    const channel = CHANNELS[Math.floor(rng() * CHANNELS.length)]
    const status = STATUSES[Math.floor(rng() * STATUSES.length)]
    const priority = PRIORITIES[Math.floor(rng() * PRIORITIES.length)]
    const carrier = CARRIERS[Math.floor(rng() * CARRIERS.length)]

    const cities = CITIES_BY_REGION[region]
    const location = cities[Math.floor(rng() * cities.length)]
    const streetNumber = 100 + Math.floor(rng() * 8900)
    const postalCode = `${10000 + Math.floor(rng() * 89999)}`

    const shippingAddress: ShippingAddress = {
      street: `${streetNumber} Innovation Parkway, Suite ${Math.floor(rng() * 800) + 100}`,
      city: location.city,
      state: location.state,
      country: location.country,
      postalCode,
    }

    // Items
    const itemCount = 1 + Math.floor(rng() * 4)
    const items: OrderItem[] = []
    let totalAmount = 0

    for (let k = 0; k < itemCount; k++) {
      const prod = PRODUCTS[Math.floor(rng() * PRODUCTS.length)]
      const qty = 1 + Math.floor(rng() * 5)
      const unitPrice = prod.price
      totalAmount += unitPrice * qty
      items.push({
        name: prod.name,
        sku: prod.sku,
        qty,
        unitPrice,
      })
    }

    // Timestamp
    const orderTimestamp = baseTime - Math.floor(rng() * timeSpan)
    const orderDate = new Date(orderTimestamp)
    const estDeliveryDate = new Date(orderTimestamp + (2 + Math.floor(rng() * 8)) * 86400000)

    // Timeline events
    const timeline: TimelineEvent[] = [
      {
        title: 'Order Placed & Verified',
        timestamp: orderDate.toISOString(),
        completed: true,
        description: `Order received via ${channel} and authenticated successfully.`,
      },
      {
        title: 'Warehouse Allocation',
        timestamp: new Date(orderTimestamp + 3600000 * 3).toISOString(),
        completed: status !== 'cancelled',
        description: `Items allocated at ${region} Logistics Hub.`,
      },
      {
        title: 'Dispatched via Carrier',
        timestamp: new Date(orderTimestamp + 3600000 * 18).toISOString(),
        completed: status === 'in_transit' || status === 'delivered',
        description: `Handed over to ${carrier}. Tracking manifest generated.`,
      },
      {
        title: 'Final Delivery',
        timestamp: estDeliveryDate.toISOString(),
        completed: status === 'delivered',
        description: status === 'delivered' ? 'Signed for by recipient.' : 'Expected at destination address.',
      },
    ]

    const orderIdNum = 10000 + i
    const trackingCode = `TRK-${region.slice(0, 2).toUpperCase()}-${Math.floor(rng() * 899999 + 100000)}`

    orders.push({
      id: `ORD-${orderIdNum}`,
      customerName,
      customerEmail,
      company,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerName)}`,
      amount: totalAmount,
      currency: 'USD',
      status,
      priority,
      region,
      channel,
      createdAt: orderDate.toISOString(),
      itemsCount: items.reduce((sum, it) => sum + it.qty, 0),
      carrier,
      trackingNumber: trackingCode,
      estimatedDelivery: estDeliveryDate.toISOString(),
      shippingAddress,
      timeline,
      items,
    })
  }

  return orders
}

// Singleton in-memory master dataset
let _cachedOrders: Order[] | null = null

export function getMasterOrders(): Order[] {
  if (!_cachedOrders) {
    _cachedOrders = generateOrders(12500)
  }
  return _cachedOrders
}
