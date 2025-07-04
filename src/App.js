/* global chrome */
import { useEffect, useState } from 'react';
import './App.css';
import logo from "./logo.svg";
import Popup from "reactjs-popup";

function App() {
  //important states for the app
  const [todos, setTodos] = useState([]);
  const [checkedTasks, setCheckedTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [siteTimes, setSiteTime] = useState({});
  const [scrollSites, setScrollSites] = useState([]);
  const [siteInput, setSiteInput] = useState(""); //sites to add or remove

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
    chrome.storage.local.get(["siteTimes"], (result) => {
      setSiteTime(result.siteTimes || {});
    });

    const handleChange = (changes, areaName) => {
      if (areaName === "local" && changes.siteTimes) {
        setSiteTime(changes.siteTimes.newValue || {});
      }
    };

    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }
}, []);

//get the scrollsites
useEffect(() =>{
  if(typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["scrollSites"], (result) => {
      setScrollSites(result.scrollSites || []);
    })
  }
})


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
    if(newTask === "") {
      return;
    }
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
    const cleaned = host.replace(/^www\./, "");
    return cleaned;
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
          <label class="wishlist" fonthtmlFor={i}>{d.task}</label><br/> <br/> </div>        
        ))
  }

  //conditional rendering for scroll times, but different since times is a dictionary
  function renderTimes(){
    if(Object.entries(siteTimes).length == 0){
      return (<p>Start scrolling to see your time wasted or add sites using the last card</p>)
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

  //render what sites the user has chosen to scroll
  function renderScollSites(){
    if(scrollSites.length == 0){
      return(<p>Add Distracting Sites</p>)
    }
    return(
      scrollSites.map((d, i) => 
      <div key={i}><b><p>{d}</p></b></div>
      )
    )
  }

  //remove a site to track
  function removeSiteTracking() {
    if(siteInput === "") return;
    if(typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["scrollSites"], result => {
        const currentSites = result.scrollSites || [];
        const updatedSites = currentSites.filter(site => site !== siteInput);
        chrome.storage.local.set({ scrollSites: updatedSites });
      })
    }
    setScrollSites(prev => prev.filter(site => site !== siteInput));
    setSiteInput("");
  }

  //add a site to track
  function addSiteTracking(){
    if(siteInput === "") return;
    if(siteInput.indexOf(".") == -1) return; 
    if(scrollSites.includes(siteInput)) return;

    if(typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["scrollSites"], result => {
        const currentSites = result.scrollSites || [];
        const updatedSites = [...currentSites, siteInput,];
        chrome.storage.local.set({scrollSites:updatedSites});

      })
      setScrollSites(prev => [...prev, siteInput]);
      setSiteInput("");
    }
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
            }>I'm Done Doing These'</button>
          </form><br/></div>

          <div class="card">
            <h3>A NEW THING YOU'D RATHER BE DOING</h3>
            <br/>
            <form>
              <input class="wider" type="text" id="newtask" placeholder="Write something from your wishlist" value={newTask}
              onChange={(e) => 
              /*changes value in textbox to be new task */ 
              setNewTask(e.target.value)}/>        
              <br/><br/>
              <button onClick={(e) => {
                //adds new task on click
                e.preventDefault();
                addTask();
              }}>Add New Scroll Stopping Activity</button>
            </form><br/>
          </div>

          <div class="card">
           <h3>ADD OR REMOVE DISTRACTING SITES</h3>
           <br/>
            <div class="list">{renderScollSites()}</div>
            <br/>
            <form>
              <input class="wider" type="text" id="siteInput" placeholder="Write site to add or remove" value={siteInput}
              onChange={(e) => 
              /*changes the site input*/ 
              setSiteInput(e.target.value)}/><br/><br/>
              <button type="button" class="scrollSitesbtn" style={{ marginRight: '12px'}} onClick={(e) => {
                e.preventDefault();
                addSiteTracking();
              }}>Add Site</button>
              
              <Popup trigger={<button type="button" class="scrollSitesbtn" onClick={(e) => e.preventDefault()}>Remove Site</button>} modal nested>
              {
                close => (
                  <><div class="overlay"><div class="popup-card">
                    <h3 class="popuph3">ARE YOU SURE YOU WANT TO REMOVE THE FOLLOWING SITE?</h3>
                    <p class="popuptext">{siteInput}</p>
                    <button type="button" class="popupbtn" onClick={(e) => {
                      e.preventDefault();
                      close();
                      setSiteInput("");
                    } }>No</button> <br /><br /> <button class="popupbtn" type="button" onClick={(e) => {
                      e.preventDefault();
                      removeSiteTracking();
                      close();
                    } }>Yes</button>
                  </div></div></>
                )
              }
                
                </Popup>
            </form>
            </div>


        <br/><br/> <br/> 
      </main>
    </div>
  );
}

export default App;
