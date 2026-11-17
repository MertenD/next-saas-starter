export const CUSTOMER_STATUSES = ["active", "invited", "suspended"] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

export const CUSTOMER_STATUS_FILTER_OPTIONS = [
  "all",
  ...CUSTOMER_STATUSES,
] as const
export type CustomerStatusFilter =
  (typeof CUSTOMER_STATUS_FILTER_OPTIONS)[number]

export const CUSTOMER_PLANS = ["free", "pro", "enterprise"] as const
export type CustomerPlan = (typeof CUSTOMER_PLANS)[number]

export const CUSTOMER_SORT_BY_OPTIONS = [
  "name",
  "email",
  "totalSpent",
  "createdAt",
] as const
export type CustomerSortBy = (typeof CUSTOMER_SORT_BY_OPTIONS)[number]

export const SORT_ORDER_OPTIONS = ["asc", "desc"] as const
export type SortOrder = (typeof SORT_ORDER_OPTIONS)[number]

export type Customer = {
  id: string
  name: string
  email: string
  plan: CustomerPlan
  status: CustomerStatus
  totalSpent: number
  createdAt: string
}

const FIRST_NAMES = [
  "Olivia",
  "Liam",
  "Emma",
  "Noah",
  "Ava",
  "Elijah",
  "Sophia",
  "Lucas",
  "Isabella",
  "Mason",
  "Mia",
  "Ethan",
  "Amelia",
  "Logan",
  "Harper",
  "James",
  "Evelyn",
  "Benjamin",
  "Abigail",
  "Henry",
  "Ella",
  "Alexander",
  "Scarlett",
  "Sebastian",
  "Grace",
  "Jack",
  "Chloe",
  "Owen",
  "Victoria",
  "Daniel",
]

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Walker",
]

const EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "proton.me",
  "acme.io",
]

// Weighted so most demo customers land as "active", mirroring a realistic distribution.
const STATUS_WEIGHTS: [CustomerStatus, number][] = [
  ["active", 0.7],
  ["invited", 0.18],
  ["suspended", 0.12],
]

const PLAN_WEIGHTS: [CustomerPlan, number][] = [
  ["free", 0.55],
  ["pro", 0.35],
  ["enterprise", 0.1],
]

function weightedPick<T>(options: [T, number][]): T {
  const roll = Math.random()
  let cumulative = 0
  for (const [value, weight] of options) {
    cumulative += weight
    if (roll <= cumulative) return value
  }
  const last = options[options.length - 1]
  if (!last) throw new Error("weightedPick needs at least one option")
  return last[0]
}

function generateCustomers(count: number): Customer[] {
  const now = Date.now()
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000

  return Array.from({ length: count }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]
    const lastName =
      LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]
    const domain =
      EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)]
    const createdAt = new Date(now - Math.random() * twoYearsMs).toISOString()

    return {
      id: `cust_${index + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}${index}@${domain}`.toLowerCase(),
      plan: weightedPick(PLAN_WEIGHTS),
      status: weightedPick(STATUS_WEIGHTS),
      totalSpent: Math.round(Math.random() * 4800),
      createdAt,
    }
  })
}

export const MOCK_CUSTOMERS: Customer[] = generateCustomers(137)
