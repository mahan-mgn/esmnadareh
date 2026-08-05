-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "couponId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "couponId" TEXT;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL DEFAULT 'PERCENT',
    "value" INTEGER NOT NULL,
    "minSubtotal" INTEGER NOT NULL DEFAULT 0,
    "maxDiscount" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "perUserLimit" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
