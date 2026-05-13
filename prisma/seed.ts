import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const admin = await db.user.upsert({
    where: { email: "admin@propvault.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@propvault.com",
      passwordHash: "$2b$12$KLV1sdRaLuEwnvRS83hIh.wY2eZOwgO7LUXVBeqcVjdO1t8rFLBOC",
      role: "admin",
      isActive: true,
    },
  });

  console.log(`✅ Admin user ready: ${admin.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Role: ${admin.role}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
