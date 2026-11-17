export type Occasion =
  | "engagement"
  | "soiree"
  | "katb-ketab"
  | "bridal"
  | "handmade";

export type DressStatus =
  | "available"
  | "reserved"
  | "bookable"
  | "sale"
  | "tailor"
  | "unavailable";

export type ShotAngle =
  | "front"
  | "three-quarter"
  | "side"
  | "back"
  | "three-quarter-l"
  | "side-l"
  | "detail";

export interface DressShot {
  src: string;
  angle: ShotAngle;
  labelAr: string;
  w: number;
  h: number;
}

export interface DressColor {
  nameAr: string;
  hex: string;
}

export interface Dress {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  storyAr: string;
  occasions: Occasion[];
  colors: DressColor[];
  sizes: string[];
  lengthAr: string;
  fabricAr: string;
  detailsAr: string[];
  modes: {
    rent: boolean;
    sale: boolean;
    tailor: boolean;
  };
  rentPrice?: number;
  deposit?: number;
  rentalDays?: number;
  salePrice?: number;
  showPrice: boolean;
  status: DressStatus;
  shots: DressShot[];
  symmetric: boolean;
  onOrbit: boolean;
  orbitOrder: number;
  isFeatured: boolean;
}

export interface AtelierCategory {
  id: string;
  slug: Occasion;
  nameAr: string;
  nameEn: string;
  subtitleAr: string;
  descriptionAr: string;
  sortOrder: number;
}

export type RentalRequestStatus =
  | "new"
  | "confirmed"
  | "ready"
  | "picked-up"
  | "returned"
  | "cancelled";

export interface RentalRequest {
  id: string;
  dressId: string;
  dressCode: string;
  dressNameAr: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  pickupDate: string;
  returnDate: string;
  sizeLabel: string;
  colorNameAr?: string;
  requestType: "rent" | "tailor";
  notes?: string;
  status: RentalRequestStatus;
  createdAt: string;
}

export type AppointmentStatus = "new" | "confirmed" | "done" | "cancelled";

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  occasion: Occasion;
  eventDate: string;
  preferredColor?: string;
  approxSize?: string;
  dressCode?: string;
  dressType?: string;
  visitDate: string;
  visitTime: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface BlockedDateRange {
  id: string;
  dressCode: string;
  startDate: string;
  endDate: string;
  reasonAr: string;
}

export interface AtelierSettings {
  storeName: string;
  storeNameAr: string;
  taglineEn: string;
  taglineAr: string;
  phone: string;
  whatsapp: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  facebookGroupUrl?: string;
  mapsUrl?: string;
  addressAr: string;
  addressNoteAr: string;
  workingHoursAr: string;
  visitingPolicyAr: string;
  rentalDurationDays: number;
  cleaningBufferDays: number;
  depositPolicyAr: string;
  alterationPolicyAr: string;
  cancellationPolicyAr: string;
  damagePolicyAr: string;
  cleaningPolicyAr: string;
  announcementAr: string;
  acceptingBookings: boolean;
  adminUsername: string;
  adminPassword: string;
}

export interface DB {
  catalogVersion?: number;
  settings: AtelierSettings;
  categories: AtelierCategory[];
  dresses: Dress[];
  rentalRequests: RentalRequest[];
  appointments: Appointment[];
  blockedDates: BlockedDateRange[];
}
