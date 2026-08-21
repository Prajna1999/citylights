export type VerificationItem = {
  id: string;
  shopName: string;
  local: string;
  category: string;
  area: string;
  lastVerified: string;
  needs: "New listing" | "Re-verify";
  submitted: string;
};

export type ReportItem = {
  id: string;
  shopName: string;
  body: string;
  phone: string;
  status: "open" | "resolved";
  createdAt: string;
};

export const verificationQueue: VerificationItem[] = [
  { id: "v1", shopName: "Samrat Stationery", local: "ସମ୍ରାଟ ଷ୍ଟେସନେରୀ", category: "Services", area: "Bant Square", lastVerified: "—", needs: "New listing", submitted: "2 days ago" },
  { id: "v2", shopName: "Radha Sweets & Bakery", local: "ରାଧା ସୁଇଟ୍ସ", category: "Food & groceries", area: "Charampa", lastVerified: "14 Mar 2025", needs: "Re-verify", submitted: "5 days ago" },
  { id: "v3", shopName: "Basanti Tailors", local: "ବସନ୍ତୀ ଟେଲର୍ସ", category: "Services", area: "Kacheri Bazar", lastVerified: "—", needs: "New listing", submitted: "1 week ago" },
  { id: "v4", shopName: "Sree Balaji Electronics", local: "ଶ୍ରୀ ବାଲାଜୀ ଇଲେକ୍ଟ୍ରୋନିକ୍ସ", category: "Home & living", area: "Nuabazar", lastVerified: "2 Mar 2025", needs: "Re-verify", submitted: "1 week ago" },
];

export const reportQueue: ReportItem[] = [
  { id: "r1", shopName: "Maa Mangala Stores", body: "Closed for the last two weeks, the shutters were down.", phone: "98765 12340", status: "open", createdAt: "Today, 9:14 AM" },
  { id: "r2", shopName: "Kalinga Mobile Point", body: "Phone number on the listing is out of service.", phone: "—", status: "open", createdAt: "Yesterday, 6:40 PM" },
  { id: "r3", shopName: "Sahoo Saree Centre", body: "Moved to the new market building near the bus stand.", phone: "91234 56789", status: "open", createdAt: "2 days ago" },
  { id: "r4", shopName: "Salandi Home Needs", body: "Timings changed, now closes at 6 PM.", phone: "—", status: "resolved", createdAt: "5 days ago" },
];
