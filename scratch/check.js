const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.employee.update({
  where: { id: 2 },
  data: { last_lat: -5.79448, last_lng: -35.211, last_location_at: new Date() }
}).then(e => console.log(e)).finally(() => p.$disconnect());
