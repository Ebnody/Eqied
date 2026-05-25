// One-shot script to create or repair the first super admin account.
// Run with: node scripts/create-super-admin.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const EMAIL = "firaolall19@gmail.com";
const PASSWORD = "Admin@2026";
const FULL_NAME = "Firaol Allo";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const existing = await prisma.user.findFirst({
    where: { email: EMAIL },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: "SUPER_ADMIN",
        isVerified: true,
        mustChangePassword: true,
        fullName: FULL_NAME,
        linkToken: null,
        linkTokenExpiresAt: null,
      },
    });
    console.log("\n=== UPDATED EXISTING USER ===");
    console.log("ID:        ", updated.id);
    console.log("Email:     ", updated.email);
    console.log("Role:      ", updated.role);
    console.log("Verified:  ", updated.isVerified);
    console.log("MustChange:", updated.mustChangePassword);
  } else {
    const created = await prisma.user.create({
      data: {
        email: EMAIL,
        passwordHash,
        role: "SUPER_ADMIN",
        isVerified: true,
        mustChangePassword: true,
        fullName: FULL_NAME,
        preferredLocale: "en",
      },
    });
    console.log("\n=== CREATED NEW SUPER ADMIN ===");
    console.log("ID:        ", created.id);
    console.log("Email:     ", created.email);
    console.log("Role:      ", created.role);
  }

  console.log("\n=== LOGIN CREDENTIALS ===");
  console.log("URL:      https://eqied.vercel.app/admin/login");
  console.log("Email:   ", EMAIL);
  console.log("Password:", PASSWORD);
  console.log("\n(You will be forced to change the password on first login.)");
}

main()
  .catch((err) => {
    console.error("ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
