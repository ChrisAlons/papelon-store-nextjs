-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InventoryMovementType" ADD VALUE 'ENTRY';
ALTER TYPE "InventoryMovementType" ADD VALUE 'EXIT';
ALTER TYPE "InventoryMovementType" ADD VALUE 'ADJUSTMENT';
ALTER TYPE "InventoryMovementType" ADD VALUE 'DAMAGE';

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "movementType" "InventoryMovementType",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "quantity" INTEGER;
