import request from "supertest";
import app from "../src/server";

import { testAccount } from "./contants";

describe("POST /auth/login", () => {
  // @ts-ignore
  test("It should response status: 200, error: false and token inside body", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testAccount.email, password: testAccount.password });

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBe(false);
    expect(response.body.data).toHaveProperty("token");
  });
});

afterAll((done) => {
  app.close(done);
});
