export const services = {
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3001',
  identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  quotation: process.env.QUOTATION_SERVICE_URL || 'http://localhost:3004',
  logistics: process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3005',
};

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
};
