import dotenv from "dotenv";

process.env = { ...process.env, ...dotenv.config().parsed };

export default {};
