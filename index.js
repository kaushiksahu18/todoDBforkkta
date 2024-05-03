import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs/promises";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import {
  UserModel,
  validateUser,
  validateTodo,
  userSchema,
  connectDB,
} from "./utils.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;
const DATA_FILE_PATH = path.join(__dirname, "data.json");
const DATABASE_URL = process.env.MONGODB_DATABASE_URL || "";
// Initilize express app
const app = express();

// Global middlewares
app.use(morgan("dev")); // Logging middleware
app.use(cors());
app.use(express.json());

connectDB(DATABASE_URL);
export const USERS = mongoose.model("User");
// new UserModel({
// username: "papa@pa",
// password: "papa@p",
// todos: [{ title: "String", description: "String" }],
// });

// REST API Endpoints
// for User
// SingUp : New User
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = userSchema.parse(req.body);
    const query = await USERS.find({ username, password }).exec();
    if (query.length === 0) {
      const newUser = USERS({
        username,
        password,
        todos: [],
      });
      await newUser.save();
      res.status(201).send(newUser);
    } else {
      res.status(400).send("User already exists");
    }
  } catch (error) {
    res.status(500).send("Internal Server Error While Adding User");
    console.log(error);
  }
});

// Login : Existing User
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username && password) {
      const query = await USERS.find({ username, password }).exec();
      if (query) {
        res.status(200).json(query[0]);
        datasendCount++;
        console.log(`Data send count: ${datasendCount}`);
      } else {
        res
          .status(400)
          .send("Invalid username or password: Not found user in DataBase");
      }
    }
  } catch (error) {
    res.status(400).send("Invalid username or password Input");
  }
});

// for Todo
// GET todos
let datasendCount = 0;
app.get("/todos", validateUser, async (req, res) => {
  try {
    const { username, password } = req;
    const user = await USERS.find({ username, password }).exec();
    const todosArr = user[0].todos;
    res.status(200).json(todosArr);
    datasendCount++;
    console.log(`Data send count: ${datasendCount}`);
  } catch (error) {
    res.status(500).send("Internal Server Error While Fetching Todos");
    console.log(error);
  }
});

// POST todos
app.post("/addTodo", validateUser, validateTodo, async (req, res) => {
  try {
    const { username, password } = req;
    const user = await USERS.find({ username, password }).exec();
    const todosArr = user[0].todos;
    const newTodo = {
      ...req.body,
    };
    todosArr.push(newTodo);
    await user[0].save();
    res.status(201).json(todosArr);
    console.log("Todo Added Successfully");
  } catch (error) {
    res.status(500).send("Internal Server Error While Adding Todo");
    console.log(error);
  }
});

// DELETE todos
app.delete("/todos/:id", validateUser, async (req, res) => {
  try {
    const { username, password } = req;
    const user = await USERS.find({ username, password }).exec();
    if (user[0].todos) {
      // Todo deleted successfully
      user[0].todos = user[0].todos.filter((todo) => todo._id.toString() !== req.params.id);
      await user[0].save();
      res.status(200).json(user[0].todos);
    } else {
      // User not found or todo not found
      res.status(404).send("Todo not found");
    }
  } catch (error) {
    res.status(500).send("Internal Server Error While Deleting Todo");
    console.log(error);
  }
});

app.get("/", (req, res) => {
  res.send(`<h1>Kaushik ka TodoApp Server</h1>`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
