import express from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '3006', 10);

app.use(express.json());

// --------------------------------------------------
// In-memory stores (simulating database)
// --------------------------------------------------
interface BanRecord {
  id: string;
  user_id: string;
  active: boolean;
  reason: string;
  created_at: Date;
  updated_at: Date;
}

interface SellerRecord {
  id: string;
  name: string;
  verified: boolean;
  approved: boolean;
}

interface DisputeRecord {
  orderId: string;
  customer: string;
  reason: string;
  status: string;
  amount: number;
  refunded: boolean;
}

const bans: BanRecord[] = [];
const sellers: SellerRecord[] = [
  { id: '1', name: 'PrintMaster 3D', verified: false, approved: false },
  { id: '2', name: 'ProtoPixels', verified: true, approved: false },
  { id: '3', name: 'LayerCraft', verified: false, approved: false },
];

const disputes: DisputeRecord[] = [
  { orderId: 'ord-001', customer: 'user_1', reason: 'Damaged on arrival', status: 'open', amount: 4500, refunded: false },
  { orderId: 'ord-002', customer: 'user_2', reason: 'Wrong filament color', status: 'open', amount: 2200, refunded: false },
];

// --------------------------------------------------
// GET /health — service health
// --------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'admin-service' });
});

// GET /ready — readiness check
app.get('/ready', (_req, res) => {
  res.json({ status: 'ready', service: 'admin-service' });
});

// --------------------------------------------------
// GET /admin/disputes — list disputed orders
// --------------------------------------------------
app.get('/admin/disputes', (_req, res) => {
  res.json({ disputes });
});

// --------------------------------------------------
// POST /admin/disputes/:orderId/refund — issue Stripe refund
// --------------------------------------------------
app.post('/admin/disputes/:orderId/refund', (req, res) => {
  const { orderId } = req.params;
  const dispute = disputes.find((d) => d.orderId === orderId);

  if (!dispute) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `Dispute for order ${orderId} not found` });
  }

  if (dispute.refunded) {
    return res.status(409).json({ error: 'ALREADY_REFUNDED', message: `Order ${orderId} has already been refunded` });
  }

  dispute.refunded = true;
  dispute.status = 'refunded';

  console.log(`[Admin] Refund issued for order ${orderId}`);
  res.json({ success: true, orderId, refunded: true });
});

// --------------------------------------------------
// POST /admin/users/:userId/ban — ban a user
// Supports multiple ban/unban cycles.
// If an active ban exists, returns 409.
// --------------------------------------------------
app.post('/admin/users/:userId/ban', (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  // Check for existing active ban
  const existingBan = bans.find((b) => b.user_id === userId && b.active);

  if (existingBan) {
    return res.status(409).json({
      error: 'ALREADY_BANNED',
      message: `User ${userId} is already banned`,
      ban: existingBan,
    });
  }

  const ban: BanRecord = {
    id: `ban_${Date.now()}`,
    user_id: userId,
    active: true,
    reason: reason || 'No reason provided',
    created_at: new Date(),
    updated_at: new Date(),
  };

  bans.push(ban);
  console.log(`[Admin] User ${userId} banned. Reason: ${ban.reason}`);
  res.status(201).json({ success: true, ban });
});

// --------------------------------------------------
// POST /admin/sellers/:sellerId/verify — verify a seller
// --------------------------------------------------
app.post('/admin/sellers/:sellerId/verify', (req, res) => {
  const { sellerId } = req.params;
  const seller = sellers.find((s) => s.id === sellerId);

  if (!seller) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `Seller ${sellerId} not found` });
  }

  seller.verified = true;
  console.log(`[Admin] Seller ${sellerId} verified`);
  res.json({ success: true, seller });
});

// --------------------------------------------------
// POST /admin/sellers/:sellerId/approve — approve a seller
// --------------------------------------------------
app.post('/admin/sellers/:sellerId/approve', (req, res) => {
  const { sellerId } = req.params;
  const seller = sellers.find((s) => s.id === sellerId);

  if (!seller) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `Seller ${sellerId} not found` });
  }

  seller.approved = true;
  console.log(`[Admin] Seller ${sellerId} approved`);
  res.json({ success: true, seller });
});

// --------------------------------------------------
// GET /admin/users — list users (basic stub)
// --------------------------------------------------
app.get('/admin/users', (_req, res) => {
  // In a real service, this would query the identity service or database
  res.json({
    users: [
      { id: 'user_1', name: 'Alice', email: 'alice@example.com', role: 'customer' },
      { id: 'user_2', name: 'Bob', email: 'bob@example.com', role: 'customer' },
      { id: 'user_3', name: 'Charlie', email: 'charlie@example.com', role: 'seller' },
    ],
  });
});

// --------------------------------------------------
// GET /admin/stats — platform statistics
// --------------------------------------------------
app.get('/admin/stats', (_req, res) => {
  res.json({
    totalUsers: 3,
    totalSellers: 3,
    totalOrders: 2,
    activeDisputes: disputes.filter((d) => d.status === 'open').length,
    totalRevenue: 1250000,
    pendingVerifications: sellers.filter((s) => !s.verified).length,
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`[Admin Service] Listening on port ${PORT}`);
});

export default app;
