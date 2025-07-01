const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL);

//schema for tasks in the database
const ScrollStopper = mongoose.model("ScrollStopper", {
  userId: String,
  task: String,
}, "ScrollStopper");

//get based on user id
app.get("/todos/:userId", async (req, res) =>{
    const todos = await ScrollStopper.find({userId: req.params.userId});
    res.json(todos);
});

//post singular to-do
app.post("/todos", async (req, res) => {
    const todo = new ScrollStopper(req.body);
    await todo.save();
    res.json(todo);
});

//delete many to-dos
app.delete("/todos", async (req, res) => {
    const {ids} = req.body;
    try {
        await ScrollStopper.deleteMany({_id: {$in:ids}});
        res.json({message: "Successful deletion" });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Failed deletion"})
    }
})

//counts how many items are in the cluster
app.get("/debug", async (req, res) => {
  const count = await ScrollStopper.countDocuments({});
  res.json({ message: "Connected", totalTodos: count });
});

app.listen(3010, () => console.log("API running on http://localhost:3010"));
