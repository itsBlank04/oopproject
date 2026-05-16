export interface User {
  id: number
  email: string
  displayName: string
  phone: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  createdAt: string
}

export interface Role {
  id: number
  name: string
}

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
  phone?: string
  role: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  role: string
}

export interface ApiError {
  message: string
  status?: number
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export interface Category {
  id: number
  name: string
  parentId: number | null
}

export interface Product {
  id: number
  vendor: { id: number; displayName: string; email: string; phone: string | null; status: string; createdAt: string }
  category: { id: number; name: string; parentId: number | null }
  name: string
  description: string | null
  priceBdt: number
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: number
  imageUrl: string
  sortOrder: number
}

export interface Inventory {
  id: number
  productId: number
  stockQty: number
  lowStockThreshold: number
}

export interface Order {
  id: number
  customer: { id: number; displayName: string } | number | null
  totalBdt: number
  status: 'PLACED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  items: OrderItem[] | null
  createdAt: string
}

export interface OrderItem {
  id: number
  product: { id: number; name: string } | number
  qty: number
  unitPriceBdt: number
}

export interface Payment {
  id: number
  orderId: number
  amountBdt: number
  status: 'PENDING' | 'PAID' | 'FAILED'
  method: string
  transactionRef: string | null
}

// Used Items
export interface UsedListing {
  id: number
  sellerId: number
  sellerName?: string
  categoryId: number
  categoryName?: string
  conditionId: number
  conditionLabel?: string
  title: string
  description: string | null
  priceBdt: number
  warrantyFlag: 'YES' | 'NO'
  status: 'ACTIVE' | 'SOLD' | 'REMOVED'
  images: UsedImage[]
  videos: UsedVideo[]
  history?: UsedItemHistory
  createdAt: string
}

export interface UsedImage {
  id: number
  url: string
  sortOrder: number
}

export interface UsedVideo {
  id: number
  url: string
  sortOrder: number
}

export interface ConditionLevel {
  id: number
  label: string
}

export interface UsedItemHistory {
  id: number
  ownerCount: number
  usageDurationMonths: number | null
}

// Repair
export interface Technician {
  id: number
  userId: number
  userName?: string
  specialization: string
  pickupAvailable: boolean
  level: 'Beginner' | 'Verified' | 'Expert'
  ratingAvg: number
  completionRate: number
}

export interface RepairRequest {
  id: number
  customerId: number
  customerName?: string
  category: string
  description: string
  pickupNeeded: boolean
  status: 'OPEN' | 'QUOTED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED'
  media: RepairMedia[]
  createdAt: string
  activeBooking?: RepairBooking | null
}

export interface RepairMedia {
  id: number
  url: string
  type: 'IMAGE' | 'VIDEO'
}

export interface RepairQuote {
  id: number
  requestId: number
  technicianId: number
  technicianName?: string
  quoteBdt: number
  plan: string | null
  status: 'SENT' | 'ACCEPTED' | 'REJECTED'
}

export interface RepairBooking {
  id: number
  requestId: number
  technicianId: number
  technicianUserId: number
  scheduledDate: string
  status: 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
}

// Auctions
export interface Auction {
  id: number
  vendorId: number
  vendorName?: string
  title: string
  type: 'STANDARD' | 'FLASH' | 'REVERSE' | 'RESERVE'
  status: 'CREATED' | 'APPROVED' | 'PREPARING' | 'ACTIVE' | 'EXTENDED' | 'CLOSED' | 'COMPLETED'
  startTime: string
  endTime: string
  reservePriceBdt: number | null
  lots: AuctionLot[]
  createdAt: string
}

export interface AuctionLot {
  id: number
  auctionId: number
  title: string
  description: string | null
  startingPriceBdt: number
  currentBidBdt: number
  status: 'PREPARING' | 'ACTIVE' | 'CLOSED'
  images: AuctionImage[]
}

export interface AuctionImage {
  id: number
  imageUrl: string
}

export interface Bid {
  id: number
  lotId: number
  bidderId: number
  bidderName?: string
  amountBdt: number
  createdAt: string
}

export interface WatchlistEntry {
  id: number
  lotId: number
  createdAt: string
}

// Chat
export interface Conversation {
  id: number
  createdAt: string
  members?: { id: number; user: { id: number; displayName: string } }[]
}

export interface Message {
  id: number
  conversation: { id: number } | number
  sender: { id: number; displayName: string } | number
  message: string
  createdAt: string
}

// Notifications
export interface Notification {
  id: number
  userId: number
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

// Returns
export interface Return {
  id: number
  orderItem: { id: number } | number
  customer: { id: number; displayName: string } | number
  reason: string
  status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  createdAt: string
  resolvedAt: string | null
}

// Service Listings
export interface ServiceListing {
  id: number
  technician: { id: number; user: { id: number; displayName: string } } | number
  category: string
  priceMinBdt: number
  priceMaxBdt: number
  availabilityNote: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

// Bidder Restriction
export interface BidderRestriction {
  id: number
  vendor: { id: number } | number
  bidder: { id: number; displayName: string } | number
  reason: string | null
  createdAt: string
}

// Review
export interface Review {
  id: number
  reviewer: { id: number; displayName: string } | number
  reviewee: { id: number; displayName: string } | number
  product: { id: number; name: string } | number | null
  rating: number
  comment: string | null
  createdAt: string
}

// Return
export interface ReturnRequest {
  orderItemId: number
  reason: string
}
