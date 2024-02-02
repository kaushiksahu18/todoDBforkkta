// server.mjs
import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs/promises";
import cors from "cors";
import morgan from "morgan";
import { z } from "zod";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 6969;
const DATA_FILE_PATH =
  process.env.DATA_FILE_PATH || path.join(__dirname, "data.json");

// Initilize express app
const app = express();

// Global middlewares
app.use(morgan("dev")); // Logging middleware
app.use(cors());
app.use(express.json());

// zod schema for verification
const todoSchema = z.object({
  title: z.string(),
  description: z.string(),
});
const userSchema = z.object({
  username: z.string(),
  password: z.string().min(6),
});

// middlewares for validation of username and password
const validateUser = async (req, res, next) => {
  try {
    const { username, password } = req.headers;
    if (username && password) {
      const users = await JSON.parse(await fs.readFile(DATA_FILE_PATH, "utf8"));
      const user = users.find((user) => user.username === username);
      if (user) {
        console.log("user found in DB");
        req.username = username;
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

// REST API Endpoints
// for User
// SingUp : New User
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = userSchema.parse(req.body);
    const users = await JSON.parse(await fs.readFile(DATA_FILE_PATH, "utf8"));
    const user = users.find((user) => user.username === username);
    if (!user) {
      const newUser = {
        id: newId(users, 10001, 99999),
        username,
        password,
        todos: [],
      };
      users.push(newUser);
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(users));
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
      const users = await JSON.parse(await fs.readFile(DATA_FILE_PATH, "utf8"));
      const user = users.find(
        (user) => user.username === username && user.password === password,
      );
      if (user) {
        res.status(200).json(user);
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
    const { username } = req;
    const users = await JSON.parse(await fs.readFile(DATA_FILE_PATH, "utf8"));
    const userIndex = users.findIndex((user) => user.username === username);
    res.status(200).json(users[userIndex].todos);
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
    const { username } = req;
    const users = await JSON.parse(await fs.readFile(DATA_FILE_PATH, "utf8"));
    const userIndex = users.findIndex((user) => user.username === username);
    const newTodo = {
      id: newId(users[userIndex].todos, 101, 999),
      ...req.body,
    };
    users[userIndex].todos.push(newTodo);
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(users));
    res.status(201).json(users[userIndex].todos);
    console.log("Todo Added Successfully");
  } catch (error) {
    res.status(500).send("Internal Server Error While Adding Todo");
    console.log(error);
  }
});

// DELETE todos
app.delete("/todos/:id", validateUser, async (req, res) => {
  try {
    const { username } = req;
    const users = await JSON.parse(await fs.readFile(DATA_FILE_PATH, "utf8"));
    const userIndex = users.findIndex((user) => user.username === username);
    const index = users[userIndex].todos.findIndex(
      (todo) => todo.id === parseInt(req.params.id),
    );
    if (index !== -1) {
      users[userIndex].todos.splice(index, 1);
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(users));
      res.status(200).json(users[userIndex].todos);
    } else {
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

const newId = (arrOFobj, min, max) => {
  let canbenewId = Math.round(Math.random() * (max - min)) + min;
  if (arrOFobj.some((obj) => obj.id == canbenewId)) {
    return newId(arrOFobj, min, max);
  }
  return canbenewId;
};
