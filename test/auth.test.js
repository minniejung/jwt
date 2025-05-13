const request = require("supertest");
const app = require("../src/app"); // express 앱 경로에 맞게 수정하세요
const jwt = require("jsonwebtoken");
const { secretKey } = require("../src/config");
const { auth } = require("../src/middlewares/auth.middleware");

describe("Auth Controller", () => {
  test("POST /auth/login - 유효한 로그인 시 200 응답 코드와 토큰을 반환해야 합니다.", async () => {
    const res = await request(app).post("/auth/login").send({
      userId: "alice01",
      password: "$2b$10$abcdefg1234567890hashedPassword1",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    const decoded = jwt.verify(res.body.token, secretKey);
    expect(decoded).toHaveProperty("userId", "alice01");
  });

  test('POST /auth/login - 유효하지 않은 로그인 시 401 응답 코드와 함께 "등록되지 않은 유저입니다."를 반환해야 합니다.', async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ userId: "wrongUser", password: "wrongPass" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "등록되지 않은 유저입니다.");
  });

  test("GET /auth/me - 토큰 없이 접근하면 인증 실패해야 합니다.", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/토큰/i);
  });

  test("GET /auth/me - 토큰 포함 시 유저 정보 반환해야 합니다.", async () => {
    const token = jwt.sign({ userId: "alice01" }, secretKey, {
      expiresIn: "15m",
      issuer: "jwt-issuer",
    });

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("userId", "alice01");
    expect(res.body.user).toHaveProperty("email");
  });
});

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("유효한 토큰이 주어지면 req.decoded를 설정하고 next() 호출되어야 합니다.", () => {
    const token = jwt.sign({ userId: "alice01" }, secretKey, {
      expiresIn: "1h",
    });
    req.headers.authorization = token;

    auth(req, res, next);

    expect(req.decoded).toBeDefined();
    expect(req.decoded.userId).toBe("alice01");
    expect(next).toHaveBeenCalled();
  });

  test('만료된 토큰이면 419 응답 코드와 "토큰이 만료되었습니다."를 반환해야 합니다.', () => {
    const expiredToken = jwt.sign({ userId: "alice01" }, secretKey, {
      expiresIn: "-1s",
    });
    req.headers.authorization = expiredToken;

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(419);
    expect(res.json).toHaveBeenCalledWith({
      message: "토큰이 만료되었습니다.",
    });
  });

  test('비정상 토큰이면 401 응답 코드와 "유효하지 않은 토큰입니다."를 반환해야 합니다.', () => {
    req.headers.authorization = "invalid.token";

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "유효하지 않은 토큰입니다.",
    });
  });
});
