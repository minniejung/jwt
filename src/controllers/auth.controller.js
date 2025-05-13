const jwt = require("jsonwebtoken");
const { findUserByUserId, verifyUser } = require("../services/auth.service");
const { secretKey } = require("../config");

module.exports = {
  login: async (req, res) => {
    const { userId, password } = req.body;
    /*
      Todo: verifyUser 함수를 통해 유저임을 확인합니다.
        - 유저가 아닐 경우, 401 응답코드와 함께 message의 값으로 '등록되지 않은 유저입니다.'를 반환
        - 유저일 경우, 
            토큰을 생성하여
            200 응답코드와 함께 token의 값으로 토큰을 반환
    */
    const user = await verifyUser(userId, password);
    if (!user) {
      return res.status(401).json({ message: "등록되지 않은 유저입니다." });
    }
    const token = jwt.sign({ userId }, secretKey);
    return res.status(200).json({ token });
  },

  me: async (req, res) => {
    const { userId } = req.decoded;
    /*
      Todo: findUserByUserId 함수를 통해 유저 정보를 찾아
        200 응답코드와 함께 user의 값으로 유저 정보를 반환합니다.
        - 반환해야 하는 데이터 양식은 테스트 코드를 통해 확인합니다.
    */

    const user = await findUserByUserId(userId);
    if (!user) {
      return res.status(402).json({ message: "유저 정보를 찾을 수 없습니다." });
    }

    console.log("user", user);

    return res.status(200).json({ user });
  },
};
