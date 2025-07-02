/* global chrome */
import { useEffect, useState } from 'react';
import './App.css';
import logo from "./logo.svg";

function App() {
  //important states for the app
  const [userID, setUserID] = useState(null); //1 is default ID
  const [todos, setTodos] = useState([]);
  const [checkedTasks, setCheckedTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [siteTimes, setSiteTime] = useState({});

  //get the userID
  useEffect(() => {
    const getUserID = async () => {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(["scrollStopperUserID"], resolve);
      });
      if(result.scrollStopperUserID){
        setUserID(result.scrollStopperUserID);
      }
    }
    getUserID();
  }, []);

  //get the user's tasks
  useEffect(() => {
    const fetchTasks = async() => {

      //api call to get tasks based on userID
      if(!userID) return;
      try{
        const res = await fetch(`http://localhost:3010/todos/${userID}`); 
        const data = await res.json();
        setTodos(data); 
      } catch (error) {
        //error handling
        console.log("error catching todos");
      } 
    }
    fetchTasks();
    //dependant on userID obviously
  }, [userID])

  //gets user's time
  useEffect(() => {
    const getTimes = async() => {
      if(typeof chrome !== "undefined" && chrome.storage) {
      const interval = setInterval(() => {
        chrome.storage.local.get(["siteTimes"], (result) => {
          setSiteTime(result.siteTimes || {}); 
        });
      }, 1000);
        return () => clearInterval(interval);
      }
    }
    getTimes();
  }, [])

  //delete any unwanted tasks
  const deleteTasks = async () => {

    //api call
    const res = await fetch(`http://localhost:3010/todos/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ids: checkedTasks})
    });

    //filters out deleted tasks from the todos
    setTodos(prevTodos => prevTodos.filter(todo => !checkedTasks.includes(todo._id)));
    //clears the todos
    setCheckedTasks([]);
  }

  //add a new task
  const addTask = async () => {
    console.log(newTask);
    const res = await fetch(`http://localhost:3010/todos/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userID,
        task: newTask,
      }),
    })

    const added = await res.json();
    setTodos(prev => [...prev, added]); //adds to the todos to make a change
    setNewTask("");
  }

  //this function is used to format time
  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  //this function formats the host names
  const formatHostname = (host) => {
    const customNames = {
      "www.instagram.com": "Instagram",
      "www.youtube.com": "YouTube",
      "www.tiktok.com": "TikTok",
    };

    if (customNames[host]) return customNames[host];
  }


  return (
    <div className="App">

      <header className="title-bar">
        <h1>SCROLL STOPPER</h1> <img src={logo} width={48}></img>  
      </header>
      <main>


        <div class="card">
          <h3>TIME WASTED SCROLLING</h3>
          <div class="timelist">
            {Object.entries(siteTimes).map(([host, time]) => (
              //display the different scroll times in a list
              <p key = {host}>
                <b>{formatHostname(host)} </b> : {formatTime(time)}
              </p>
            ))}
          </div>         
        </div>

        <div class="card">
          <h3>WISHLIST ITEMS</h3>   
          <br/> 
            
          <form>
            <div class="wishlist">
            {todos.map((d, i) => 
              <div key={d._id}><input type="checkbox" id={i} 
              onChange={(e) => {
                if(e.target.checked) {
                  //adds tasks to checkedTasks when checked
                  setCheckedTasks(prev => [...prev, d._id])
                } else {
                  //removes tasks from checkedTasks when checked
                  setCheckedTasks(prev => prev.filter(id => id !== d._id))
                }
              }}/>
              <label htmlFor={i}>{d.task}</label><br/> <br/> </div>
            
            )}</div>
            <br/>
            <button onClick={(e) => {
              //deletes checked tasks on click
              e.preventDefault();
              deleteTasks();
            }
            }>I Finished These Items</button>
          </form><br/></div>

          <div class="card">
            <h3>WHAT ELSE IS THERE TO DO</h3>
            <br/>
            <form>
              <input class="wider" type="text" id="newtask" placeholder="Write a new wishlist item" value={newTask}
              onChange={(e) => 
              /*changes value in textbox to be new task */ 
              setNewTask(e.target.value)}/>
              <label htmlFor="newtask"></label>
              <br/><br/>
              <button onClick={(e) => {
                //adds new task on click
                e.preventDefault();
                addTask();
              }}>Add New Wishlist Item</button>
            </form><br/>
          </div>


        <br/><br/> <br/> 
      </main>
    </div>
  );
}

export default App;
