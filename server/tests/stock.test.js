const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/config/db");

const pool = require("../src/config/db");
const env = require("../src/config/env");
const app = require("../src/app");

function tokenFor(role, id = 1) {
  return jwt.sign({ sub: id, role, email: `${role}@demo.com` }, env.jwtSecret, { expiresIn: "1h" });
}

describe("POST /api/stock/out", () => {
  let conn;

  beforeEach(() => {
    conn = pool.__mockConnection;
    conn.query.mockReset();
    conn.beginTransaction.mockReset();
    conn.commit.mockReset();
    conn.rollback.mockReset();
    conn.release.mockReset();
  });

  it("rejects requests with no auth token", async () => {
    const res = await request(app).post("/api/stock/out").send({ productId: 1, quantity: 1 });
    expect(res.status).toBe(401);
  });

  it("rejects a viewer role with 403", async () => {
    const res = await request(app)
      .post("/api/stock/out")
      .set("Authorization", `Bearer ${tokenFor("viewer")}`)
      .send({ productId: 1, quantity: 1 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects a movement that would take stock negative", async () => {
    conn.query.mockResolvedValueOnce([[{ id: 1, quantity: 2 }]]); // FOR UPDATE select

    const res = await request(app)
      .post("/api/stock/out")
      .set("Authorization", `Bearer ${tokenFor("staff")}`)
      .send({ productId: 1, quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
    expect(conn.rollback).toHaveBeenCalledTimes(1);
    expect(conn.commit).not.toHaveBeenCalled();
  });

  it("records a valid stock-out movement and commits the transaction", async () => {
    conn.query
      .mockResolvedValueOnce([[{ id: 1, quantity: 10 }]]) // FOR UPDATE select
      .mockResolvedValueOnce([{}]) // UPDATE products
      .mockResolvedValueOnce([{ insertId: 99 }]) // INSERT stock_movements
      .mockResolvedValueOnce([[{ id: 99, product_id: 1, type: "OUT", quantity: 3 }]]); // re-select

    const res = await request(app)
      .post("/api/stock/out")
      .set("Authorization", `Bearer ${tokenFor("staff")}`)
      .send({ productId: 1, quantity: 3, reference: "SO-9001" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id: 99, type: "OUT", quantity: 3 });
    expect(conn.commit).toHaveBeenCalledTimes(1);
    expect(conn.rollback).not.toHaveBeenCalled();
  });
});

describe("POST /api/stock/in", () => {
  let conn;

  beforeEach(() => {
    conn = pool.__mockConnection;
    conn.query.mockReset();
    conn.commit.mockReset();
    conn.rollback.mockReset();
  });

  it("increases quantity and commits for a valid stock-in movement", async () => {
    conn.query
      .mockResolvedValueOnce([[{ id: 1, quantity: 10 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ insertId: 100 }])
      .mockResolvedValueOnce([[{ id: 100, product_id: 1, type: "IN", quantity: 20 }]]);

    const res = await request(app)
      .post("/api/stock/in")
      .set("Authorization", `Bearer ${tokenFor("admin")}`)
      .send({ productId: 1, quantity: 20, reference: "PO-5001" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ type: "IN", quantity: 20 });
    expect(conn.commit).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-positive quantity with a validation error", async () => {
    const res = await request(app)
      .post("/api/stock/in")
      .set("Authorization", `Bearer ${tokenFor("admin")}`)
      .send({ productId: 1, quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
