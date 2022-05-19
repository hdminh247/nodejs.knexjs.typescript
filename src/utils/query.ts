import User from "../models/user";

export const checkAvailableConnection = async () => {
  try {
    await User.query();
    return true;
  } catch (e) {
    return false;
  }
};
