# DATABASE SCHEMA

## rooms
- id
- name
- price
- status
- notes
- created_at

## tenants
- id
- full_name
- whatsapp
- room_id
- check_in_date
- monthly_price
- due_date
- notes
- created_at

## bills
- id
- tenant_id
- month
- amount
- due_date
- status
- created_at

## payments
- id
- bill_id
- payment_date
- payment_method
- amount
- notes

## electricity_logs
- id
- topup_date
- nominal
- kwh_added
- current_kwh
- estimated_days_left
- created_at

# Prisma Schema

```prisma
model Room {
  id        String   @id @default(cuid())
  name      String
  price     Int
  status    String
  notes     String?
  createdAt DateTime @default(now())

  tenants Tenant[]
}

model Tenant {
  id           String   @id @default(cuid())
  fullName     String
  whatsapp     String
  roomId       String
  checkInDate  DateTime
  monthlyPrice Int
  dueDate      Int
  notes        String?
  createdAt    DateTime @default(now())

  room Room @relation(fields: [roomId], references: [id])
  bills Bill[]
}

model Bill {
  id        String   @id @default(cuid())
  tenantId  String
  month     String
  amount    Int
  dueDate   DateTime
  status    String
  createdAt DateTime @default(now())

  tenant   Tenant    @relation(fields: [tenantId], references: [id])
  payments Payment[]
}

model Payment {
  id            String   @id @default(cuid())
  billId        String
  paymentDate   DateTime
  paymentMethod String
  amount        Int
  notes         String?

  bill Bill @relation(fields: [billId], references: [id])
}

model ElectricityLog {
  id                 String   @id @default(cuid())
  topupDate          DateTime
  nominal            Int
  kwhAdded           Float
  currentKwh         Float
  estimatedDaysLeft  Int
  createdAt          DateTime @default(now())
}
```