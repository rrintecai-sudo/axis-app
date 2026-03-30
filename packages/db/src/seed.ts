import { prisma } from "./index.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Limpiar datos previos
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.task.deleteMany();
  await prisma.lifeArea.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // Usuario de prueba
  const user = await prisma.user.create({
    data: {
      email: "oscar@test.com",
      name: "Oscar",
      phone: "+58412000000",
      timezone: "America/Caracas",
      subscriptionStatus: "TRIAL",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      profile: {
        create: {
          roles: ["empresario", "padre", "líder"],
          values: ["familia", "libertad", "impacto", "fe"],
          q1Goals: [
            "Lanzar AXIS con 50 usuarios pagos",
            "Generar $5K MRR",
            "Sistematizar operaciones de RR INTEC",
          ],
          topPriority: "Lanzar AXIS",
          wakeUpTime: "06:30",
          sleepTime: "22:00",
          lifeAreas: {
            create: [
              { name: "Negocio", priority: 1 },
              { name: "Familia", priority: 2 },
              { name: "Salud", priority: 3 },
              { name: "Fe", priority: 4 },
              { name: "Crecimiento", priority: 5 },
            ],
          },
        },
      },
      subscription: {
        create: {
          plan: "STARTER",
          status: "TRIAL",
        },
      },
    },
  });

  // Tareas de prueba
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: "Completar Módulo 1 de AXIS",
        description: "Setup del monorepo, Prisma y estructura base",
        lifeArea: "Negocio",
        priority: 9,
        impact: 10,
        status: "IN_PROGRESS",
        isTopTask: true,
        aiReason: "Tarea crítica para el lanzamiento del producto",
      },
      {
        userId: user.id,
        title: "Llamar al equipo de RR INTEC",
        lifeArea: "Negocio",
        priority: 6,
        impact: 7,
        status: "PENDING",
      },
      {
        userId: user.id,
        title: "Tiempo de calidad con la familia",
        lifeArea: "Familia",
        priority: 8,
        impact: 9,
        status: "PENDING",
      },
    ],
  });

  console.log(`✅ Seed completado. Usuario de prueba creado: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Phone: ${user.phone}`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
