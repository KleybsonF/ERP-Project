const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  const data = JSON.parse(fs.readFileSync('./scratch/backup.json', 'utf8'));
  console.log("Read backup data.");

  try {
    if (data.Customer && data.Customer.length > 0) {
      await prisma.customer.createMany({ data: data.Customer, skipDuplicates: true });
      console.log("Imported Customer");
    }
    if (data.CustomerLocation && data.CustomerLocation.length > 0) {
      await prisma.customerLocation.createMany({ data: data.CustomerLocation, skipDuplicates: true });
      console.log("Imported CustomerLocation");
    }
    if (data.LocationContact && data.LocationContact.length > 0) {
      await prisma.locationContact.createMany({ data: data.LocationContact, skipDuplicates: true });
      console.log("Imported LocationContact");
    }
    if (data.ServiceType && data.ServiceType.length > 0) {
      await prisma.serviceType.createMany({ data: data.ServiceType, skipDuplicates: true });
      console.log("Imported ServiceType");
    }
    if (data.PaymentMethod && data.PaymentMethod.length > 0) {
      await prisma.paymentMethod.createMany({ data: data.PaymentMethod, skipDuplicates: true });
      console.log("Imported PaymentMethod");
    }
    if (data.ServiceOrder && data.ServiceOrder.length > 0) {
      await prisma.serviceOrder.createMany({ data: data.ServiceOrder, skipDuplicates: true });
      console.log("Imported ServiceOrder");
    }
    if (data.Employee && data.Employee.length > 0) {
      await prisma.employee.createMany({ data: data.Employee, skipDuplicates: true });
      console.log("Imported Employee");
    }
    if (data.ServiceOrderAssignment && data.ServiceOrderAssignment.length > 0) {
      await prisma.serviceOrderAssignment.createMany({ data: data.ServiceOrderAssignment, skipDuplicates: true });
      console.log("Imported ServiceOrderAssignment");
    }
    if (data.ServiceOrderVisit && data.ServiceOrderVisit.length > 0) {
      await prisma.serviceOrderVisit.createMany({ data: data.ServiceOrderVisit, skipDuplicates: true });
      console.log("Imported ServiceOrderVisit");
    }
    if (data.AccountsReceivable && data.AccountsReceivable.length > 0) {
      await prisma.accountsReceivable.createMany({ data: data.AccountsReceivable, skipDuplicates: true });
      console.log("Imported AccountsReceivable");
    }
    if (data.ExpenseCategory && data.ExpenseCategory.length > 0) {
      await prisma.expenseCategory.createMany({ data: data.ExpenseCategory, skipDuplicates: true });
      console.log("Imported ExpenseCategory");
    }
    if (data.Vehicle && data.Vehicle.length > 0) {
      await prisma.vehicle.createMany({ data: data.Vehicle, skipDuplicates: true });
      console.log("Imported Vehicle");
    }
    if (data.AccountsPayable && data.AccountsPayable.length > 0) {
      await prisma.accountsPayable.createMany({ data: data.AccountsPayable, skipDuplicates: true });
      console.log("Imported AccountsPayable");
    }
    if (data.User && data.User.length > 0) {
      await prisma.user.createMany({ data: data.User, skipDuplicates: true });
      console.log("Imported User");
    }
    if (data.EmployeeWorkLog && data.EmployeeWorkLog.length > 0) {
      await prisma.employeeWorkLog.createMany({ data: data.EmployeeWorkLog, skipDuplicates: true });
      console.log("Imported EmployeeWorkLog");
    }
    if (data.SystemLog && data.SystemLog.length > 0) {
      await prisma.systemLog.createMany({ data: data.SystemLog, skipDuplicates: true });
      console.log("Imported SystemLog");
    }
    console.log("Import complete!");
  } catch(e) {
    console.error("Error importing data", e);
  }
}

importData().finally(() => prisma.$disconnect());
