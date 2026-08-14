const request = require("supertest");
const bcrypt = require("bcrypt");

jest.mock("../src/config/db");

const pool = require("../src/config/db");
const app = require("../src/app");

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ama Serwaa", email: "ama@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a duplicate email with 409", async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // existing user found

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ama Serwaa", email: "ama@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("creates a new viewer account and returns a token", async () => {
    pool.query
      .mockResolvedValueOnce([[]]) // no existing user
      .mockResolvedValueOnce([{ insertId: 42 }]); // insert result

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ama Serwaa", email: "ama@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toMatchObject({ id: 42, role: "viewer", email: "ama@example.com" });
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it("returns 401 with a generic message when the user does not exist", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "x" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid credentials");
  });

  it("returns 401 with the same generic message when the password is wrong", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 12);
    pool.query.mockResolvedValueOnce([
      [{ id: 1, name: "Admin", email: "admin@demo.com", password_hash: passwordHash, role: "admin", is_active: 1 }],
    ]);

    const res = await request(app).post("/api/auth/login").send({ email: "admin@demo.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid credentials");
  });

  it("logs in successfully with correct credentials", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 12);
    pool.query.mockResolvedValueOnce([
      [{ id: 1, name: "Admin", email: "admin@demo.com", password_hash: passwordHash, role: "admin", is_active: 1 }],
    ]);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@demo.com", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("admin");
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
