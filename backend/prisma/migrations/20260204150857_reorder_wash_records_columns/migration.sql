-- Reorder columns in wash_records table:
-- Move car_category to right after licence_plate
-- Move wash_type to right before original_price

-- Step 1: Create new table with columns in desired order
CREATE TABLE "wash_records_new" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "washer_id" INTEGER NOT NULL,
    "company_id" TEXT,
    "discount_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "licence_plate" TEXT NOT NULL,
    "car_category" TEXT NOT NULL,
    "company_name" TEXT,
    "discount_percentage" INTEGER NOT NULL DEFAULT 0,
    "custom_service_name" TEXT,
    "wash_type" TEXT NOT NULL,
    "original_price" DECIMAL(10,2) NOT NULL,
    "discounted_price" DECIMAL(10,2) NOT NULL,
    "washer_cut" DECIMAL(10,2) NOT NULL,
    "washer_username" TEXT NOT NULL,
    "box_number" INTEGER NOT NULL DEFAULT 0,
    "payment_method" "PaymentMethod",
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wash_records_new_pkey" PRIMARY KEY ("id")
);

-- Step 2: Copy data from old table to new table (if any exists)
INSERT INTO "wash_records_new" (
    "id",
    "vehicle_id",
    "washer_id",
    "company_id",
    "discount_id",
    "created_by_id",
    "licence_plate",
    "car_category",
    "company_name",
    "discount_percentage",
    "custom_service_name",
    "washer_username",
    "box_number",
    "wash_type",
    "original_price",
    "discounted_price",
    "washer_cut",
    "payment_method",
    "start_time",
    "end_time",
    "created_at"
)
SELECT 
    "id",
    "vehicle_id",
    "washer_id",
    "company_id",
    "discount_id",
    "created_by_id",
    "licence_plate",
    "car_category",
    "company_name",
    "discount_percentage",
    "custom_service_name",
    "washer_username",
    "box_number",
    "wash_type",
    "original_price",
    "discounted_price",
    "washer_cut",
    "payment_method",
    "start_time",
    "end_time",
    "created_at"
FROM "wash_records";

-- Step 3: Drop old table (this will cascade and drop foreign keys)
DROP TABLE "wash_records" CASCADE;

-- Step 4: Rename new table to original name
ALTER TABLE "wash_records_new" RENAME TO "wash_records";

-- Step 5: Recreate foreign key constraints
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_washer_id_fkey" FOREIGN KEY ("washer_id") REFERENCES "washers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_car_category_fkey" FOREIGN KEY ("car_category") REFERENCES "car_type_config"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wash_records" ADD CONSTRAINT "wash_records_wash_type_fkey" FOREIGN KEY ("wash_type") REFERENCES "wash_type_config"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
