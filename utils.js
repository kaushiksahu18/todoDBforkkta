import { z } from "zod";
import mongoose from "mongoose";

import { USERS } from "./index.js";

async function connectDB(url) {
  await mongoose
    .connect(url)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
}

// zod schema for verification
const todoSchema = z.object({
  title: z.string(),
  description: z.string(),
});
const userSchema = z.object({
  username: z.string(),
  password: z.string().min(3),
});

// Convert Zod schemas to Mongoose schemas
const UserModel = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    password: String,
    todos: [
      {
        title: String,
        description: String,
      },
    ],
  }),
  "todoapp"
);

// middlewares for validation of username and password
const validateUser = async (req, res, next) => {
  try {
    const { username, password } = req.headers;
    if (username && password) {
      const user = await USERS.find({ username, password }).exec();
      if (user) {
        console.log("user found in DB");
        req.username = username;
        req.password = password;
        next();
      } else {
        res
          .status(400)
          .send("Invalid username or password: Not found user in DataBase");
      }
    } else {
      res.status(400).send("Invalid username or password Input");
    }
  } catch (error) {
    res.status(400).send("Invalid username or password Input");
    console.log(error);
  }
};

// middlewares for validation of todo
const validateTodo = (req, res, next) => {
  try {
    const { title, description } = todoSchema.parse(req.body);
    if (title && description) {
      next();
    } else {
      res.status(400).send("Invalid todo Input");
    }
  } catch (error) {
    res.status(400).send("Invalid todo Input");
    console.log(error);
  }
};

export { UserModel, validateUser, validateTodo, userSchema, connectDB };
