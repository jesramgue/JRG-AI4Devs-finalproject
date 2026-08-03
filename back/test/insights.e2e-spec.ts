import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";

describe("Insights — price comparison (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.priceCatalogItem.deleteMany({ where: { normalizedName: { startsWith: "insights e2e" } } });
    await prisma.receiptItem.deleteMany();
    await prisma.receipt.deleteMany();
    await prisma.pantryItem.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: "insights-e2e" } } });
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerUser() {
    const email = `insights-e2e-${Date.now()}-${Math.random()}@example.com`;
    const reg = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email, password: "password123" })
      .expect(201);
    return reg.body.accessToken as string;
  }

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer())
      .get("/api/insights/price-comparison")
      .query({ normalizedName: "milk" })
      .expect(401);
  });

  it("returns catalog prices for every matching supermarket, cheapest first", async () => {
    const token = await registerUser();

    await prisma.priceCatalogItem.createMany({
      data: [
        {
          normalizedName: "insights e2e milk",
          category: "Dairy",
          supermarket: "Mercadona",
          referencePriceEur: "0.95",
          effectiveDate: new Date("2026-08-01"),
          sourceLabel: "test",
        },
        {
          normalizedName: "insights e2e milk",
          category: "Dairy",
          supermarket: "Dia",
          referencePriceEur: "0.89",
          effectiveDate: new Date("2026-08-01"),
          sourceLabel: "test",
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .get("/api/insights/price-comparison")
      .query({ normalizedName: "Insights E2E Milk" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.found).toBe(true);
    expect(res.body.prices.map((p: { supermarket: string }) => p.supermarket)).toEqual(["Dia", "Mercadona"]);
    expect(res.body.prices[0].referencePriceEur).toBe("0.89");
  });

  it("returns an unavailable state when no supermarket has the item", async () => {
    const token = await registerUser();

    const res = await request(app.getHttpServer())
      .get("/api/insights/price-comparison")
      .query({ normalizedName: "insights e2e nonexistent item" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.found).toBe(false);
    expect(res.body.prices).toEqual([]);
    expect(res.body.unavailableReason).toBe("NO_REFERENCE_DATA");
  });
});
