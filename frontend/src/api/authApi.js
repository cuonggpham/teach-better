import axios from "./axiosConfig";

/**
 * LOGIN (chuẩn backend)
 * POST /auth/login
 * Body: { email, password }
 */
export const login = async (email, password) => {
  const res = await axios.post("/auth/login", {
    email,
    password,
  });
  return res.data; // { user, access_token }
};

/**
 * SIGNUP
 * POST /auth/signup
 */
export const signup = async (data) => {
  const res = await axios.post("/auth/signup", data);
  return res.data;
};

/**
 * LOGOUT — backend chưa có nên mock tạm
 */
export const logout = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Đăng xuất thành công",
      });
    }, 300);
  });
};

/**
 * GET CURRENT USER
 * GET /users/me
 */
export const getCurrentUser = async () => {
  const res = await axios.get("/users/me");
  return res.data;
};
