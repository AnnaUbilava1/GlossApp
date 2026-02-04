/*
  Warnings:

  - Changed the type of `car_category` on the `price_list` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `wash_type` on the `price_list` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `car_category` on the `vehicles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `car_category` on the `wash_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `wash_type` on the `wash_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
ALTER TABLE "price_list"
  ALTER COLUMN "car_category" TYPE TEXT USING "car_category"::text,
  ALTER COLUMN "wash_type"    TYPE TEXT USING "wash_type"::text;

ALTER TABLE "vehicles"
  ALTER COLUMN "car_category" TYPE TEXT USING "car_category"::text;

-- AlterTable
ALTER TABLE "wash_records" DROP COLUMN "car_category",
ADD COLUMN     "car_category" TEXT NOT NULL,
DROP COLUMN "wash_type",
ADD COLUMN     "wash_type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "CarType";

-- DropEnum
DROP TYPE "WashType";

-- CreateTable
CREATE TABLE "car_type_config" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayNameKa" TEXT NOT NULL,
    "displayNameEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_type_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_type_config" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayNameKa" TEXT NOT NULL,
    "displayNameEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wash_type_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "car_type_config_code_key" ON "car_type_config"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wash_type_config_code_key" ON "wash_type_config"("code");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_car_category_fkey" FOREIGN KEY ("car_category") REFERENCES "car_type_config"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_car_category_fkey" FOREIGN KEY ("car_category") REFERENCES "car_type_config"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_wash_type_fkey" FOREIGN KEY ("wash_type") REFERENCES "wash_type_config"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_car_category_fkey" FOREIGN KEY ("car_category") REFERENCES "car_type_config"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_wash_type_fkey" FOREIGN KEY ("wash_type") REFERENCES "wash_type_config"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
