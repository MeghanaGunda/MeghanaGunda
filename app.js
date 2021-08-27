const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeServerAndDB = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error message:${e.message}`);
    process.exit(1);
  }
};

initializeServerAndDB();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//GET TODOS BASED ON QUERY PARAMETERS

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodosQuery = "";
  let data = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo = "%${search_q}%"
            AND status = "${status}"
            AND priority = "${priority}";`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo = "%${search_q}%"
            AND status = "${status}";`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo = "%${search_q}%"
            AND priority = "${priority}";`;
      break;
    default:
      getTodosQuery = `
        SELECT *
            FROM todo
            WHERE todo = "%${search_q}%";`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//GET A TODO BASED ON TODOID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const todoData = await database.get(getTodoQuery);
  response.send(todoData);
});

//CREATE A TODO

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const addTodoQuery = `
  INSERT INTO 
    todo (id,todo,priority,status)
  VALUES (${id},"${todo}","${priority}","${status}");`;

  await database.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//UPDATE TODODETAILS BASED ON TODOID

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateTodoQuery = `
  UPDATE todo
  SET todo="${todo}",
      status="${status}",
      priority="${priority}"
  WHERE id = ${todoId};`;

  const newTodo = await database.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//DELETE A TODO

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
