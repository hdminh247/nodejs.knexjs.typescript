import request from "supertest";
import app from "../src/server";

import { testAccount, testSearchKey } from "./contants";
import { pageLimit } from "../src/constants";
import { isAllEqualStatusCode } from "./helpers";

jest.useRealTimers();

let token = "";
let currentUserInfo: any = {};
// let fileUploadId = null;

beforeAll(async () => {
  const {
    body: {
      data: { token: loginToken, user },
    },
  } = await request(app).post("/api/v1/auth/login").send({ email: testAccount.email, password: testAccount.password });

  token = loginToken;
  currentUserInfo = user;
});

describe("GET /user/profile", () => {
  test("It should response status code 200 with data inside", async () => {
    const response = await request(app).get("/api/v1/user/profile").set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBe(false);
    expect(response.body.data).toHaveProperty("id");
  });
});

describe("GET /users", () => {
  test("It should response status code 200 without any query", async () => {
    const response = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
  });

  test("It should response status code 200 with pagination query", async () => {
    // Get the first page
    const response = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);

    // There is no other page, test can be done here
    if (response.body.data.next === -1) {
      expect(response.statusCode).toBe(200);
    } else {
      const totalPage = Math.round(response.body.data.total / pageLimit);
      const promises: any[] = [];
      for (let i = response.body.data.next; i <= totalPage; i++) {
        promises.push(
          new Promise(async (resolve) => {
            const rs = await request(app).get(`/api/v1/users?page=${i}`).set("Authorization", `Bearer ${token}`);

            resolve(rs.statusCode);
          }),
        );
      }

      const finalResults = await Promise.all(promises);

      expect(isAllEqualStatusCode(finalResults, 200)).toBe(true);
    }
  });

  test("It should response status code 200 with search query", async () => {
    const response = await request(app)
      .get(`/api/v1/users?search=${testSearchKey}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
  });

  test("It should response status code 200 and data does not include current user", async () => {
    const response = await request(app).get(`/api/v1/users?ignoreMe=1`).set("Authorization", `Bearer ${token}`);

    // Find current user in result
    const foundCurrentUserData = response.body.data.results.filter((user: any) => user.id === currentUserInfo.id);

    expect(foundCurrentUserData.length).toEqual(0);
  });
});

describe("PUT /user/password", () => {
  test("It should response status code 200 with correct input data", async () => {
    const response = await request(app)
      .put("/api/v1/user/password")
      .send({
        oldPassword: testAccount.password,
        newPassword: testAccount.password,
        confirmPassword: testAccount.password,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBe(false);
  });
  test("It should response status code 400 with wrong password", async () => {
    const response = await request(app)
      .put("/api/v1/user/password")
      .send({
        oldPassword: "wrongPass",
        newPassword: "wrongPass",
        confirmPassword: "wrongPass",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(true);
  });
  test("It should response status code 400 with not match confirm password", async () => {
    const response = await request(app)
      .put("/api/v1/user/password")
      .send({
        oldPassword: testAccount.password,
        newPassword: testAccount.password,
        confirmPassword: "notMatchPassword",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(true);
  });
});

describe("PUT /user/profile", () => {
  test("It should response status code 200 with basic input data, no file attached", async () => {
    const response = await request(app)
      .put("/api/v1/user/profile")
      .field("fullName", testAccount.fullName)
      .field("displayName", testAccount.displayName)
      .field("scientificDegree", testAccount.scientificDegree)
      .field("phoneNumber", testAccount.phoneNumber)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBe(false);
  });

  test("It should response status code 200 with basic input data and file attached", async () => {
    const response = await request(app)
      .put("/api/v1/user/profile")
      .field("fullName", testAccount.fullName)
      .field("displayName", testAccount.displayName)
      .field("scientificDegree", testAccount.scientificDegree)
      .field("phoneNumber", testAccount.phoneNumber)
      .attach("file", "tests/assets/file-test.png")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBe(false);
  });
});

afterAll((done) => {
  app.close(done);
});
