const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("url");

const Todo = mongoose.model("Todo", {
  userId: String,
  task: String,
});

//get based on user id
app.get("/todos/:userId", async (req, res) =>{
    const todos = await db.ScrollStopper.find({userId: req.params.userId});
    res.json(todos);
});

//post singular to-do
app.post("/todos", async (req, res) => {
    const todo = new Todo(req.body);
    await todo.save();
    res.json(todo);
});

//delete many to-dos
app.delete("/todos", async (req, res) => {
    const {ids} = req.body;
    try {
        await db.ScrollStopper.deleteMany({_id: {$in:ids}});
        res.json({message: "Successful deletion" });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Failed deletion"})
    }
})

app.listen(3001, () => console.log("API running on http://localhost:3001"));
