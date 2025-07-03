/* global chrome */
import { useEffect, useState } from 'react';
import './App.css';
import logo from "./logo.svg";

function App() {
  //important states for the app
  const [todos, setTodos] = useState([]);
  const [checkedTasks, setCheckedTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [siteTimes, setSiteTime] = useState({});

  //get the user's tasks from chrome storage
  useEffect(() => {
    if(typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["todos"], (result) =>{
        setTodos(result.todos || []);
      })
    }
  }, [])

  //gets user's time
  useEffect(() => {
  if (typeof chrome !== "undefined" && chrome.storage) {
    const interval = setInterval(() => {
      chrome.storage.local.get(["siteTimes"], (result) => {
        setSiteTime(result.siteTimes || {}); 
      });
    }, 1000);

    return () => clearInterval(interval);
  }
}, []);

  //delete any unwanted tasks
  const deleteTasks = async () => {
    if(typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["todos"], (result) => {
        const filtered = (result.todos || []).filter(todo => !checkedTasks.includes(todo._id));
        chrome.storage.local.set({todos: filtered});
        //filters out deleted tasks from the todos
        setTodos(prevTodos => prevTodos.filter(todo => !checkedTasks.includes(todo._id)));
        //clears the todos
        setCheckedTasks([]);
      });
    }
  }

  //add a new task
  const addTask = async () => {
    const newTodo = {
      _id: crypto.randomUUID(),
      task: newTask,
    } 
    if(typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["todos"], result => {
        const currentTodos = result.todos || [];
        const updatedTodos = [...currentTodos, newTodo];
        chrome.storage.local.set({todos:updatedTodos});
      })
      setTodos(prev => [...prev, newTodo]);
      setNewTask("");
    }
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
      "www.facebook.com" : "Facebook",
      "www.instagram.com": "Instagram",
      "www.youtube.com": "YouTube",
      "www.tiktok.com": "TikTok",
    };

    return customNames[host] || host;
  }

  //renders todos conditionally
  function renderTodos(){

    //if no todos put a message
    if(todos.length == 0){
      return(        
      <><label class="wishlist">Please add an activity using the card below</label><br /><br/></>
      )
    }
    return (
      //otherwise map them
      todos.map((d, i) => 
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
          <label class="wishlist" htmlFor={i}>{d.task}</label><br/> <br/> </div>
            
        )
      )
  }

  //conditional rendering for scroll times, but different since times is a dictionary
  function renderTimes(){
    if(Object.entries(siteTimes).length == 0){
      return (<p>Start scrolling to see your time wasted</p>)
    }

    return (
      Object.entries(siteTimes).map(([host, time]) => (
        //display the different scroll times in a list
        <p key = {host}>
          <b>{formatHostname(host)} </b> : {formatTime(time)}
        </p>
      ))
    )
  }


  return (
    <div className="App">

      <header className="title-bar">
        <h1>SCROLL STOPPER</h1> <img src={logo} width={48}></img>  
      </header>
      <main>

        <div class="card">
          <h3>TIME WASTED SCROLLING</h3>
          <div class="list">
            {renderTimes()}
          </div>         
        </div>

        <div class="card">
          <h3>THINGS YOU'D RATHER BE DOING</h3> 
          <form>
            <div class="list">
              <br/>
            {renderTodos()}</div>
            <br/>
            <button onClick={(e) => {
              //deletes checked tasks on click
              e.preventDefault();
              deleteTasks();
            }
            }>I Actually Did These</button>
          </form><br/></div>

          <div class="card">
            <h3>A NEW THING YOU'D RATHER BE DOING</h3>
            <br/>
            <form>
              <input class="wider" type="text" id="newtask" placeholder="Write something from your wishlist" value={newTask}
              onChange={(e) => 
              /*changes value in textbox to be new task */ 
              setNewTask(e.target.value)}/>
              <label htmlFor="newtask"></label>
              <br/><br/>
              <button onClick={(e) => {
                //adds new task on click
                e.preventDefault();
                addTask();
              }}>Add New Scroll Stopping Activity</button>
            </form><br/>
          </div>


        <br/><br/> <br/> 
      </main>
    </div>
  );
}

export default App;
