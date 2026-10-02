const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const data = {};
  
  data.Customer = await prisma.customer.findMany();
  data.CustomerLocation = await prisma.customerLocation.findMany();
  data.LocationContact = await prisma.locationContact.findMany();
  data.ServiceType = await prisma.serviceType.findMany();
  data.PaymentMethod = await prisma.paymentMethod.findMany();
  data.ServiceOrder = await prisma.serviceOrder.findMany();
  data.ServiceOrderAssignment = await prisma.serviceOrderAssignment.findMany();
  data.ServiceOrderVisit = await prisma.serviceOrderVisit.findMany();
  data.AccountsReceivable = await prisma.accountsReceivable.findMany();
  data.ExpenseCategory = await prisma.expenseCategory.findMany();
  data.Vehicle = await prisma.vehicle.findMany();
  data.AccountsPayable = await prisma.accountsPayable.findMany();
  data.Employee = await prisma.employee.findMany();
  data.User = await prisma.user.findMany();
  data.EmployeeWorkLog = await prisma.employeeWorkLog.findMany();
  data.SystemLog = await prisma.systemLog.findMany();

  fs.writeFileSync('./scratch/backup.json', JSON.stringify(data, null, 2));
  console.log("Export complete!");
}

exportData().catch(console.error).finally(() => prisma.$disconnect());
