import { useEffect, useState } from 'react';
import './App.css';

function App() {

  const [userID, setUserID] = useState("");
  const [todos, setTodos] = useState([]);
  const [checkedTasks, setCheckedTasks] = useState([]);

  useEffect(() => {
    /* chrome.storage.local.get(['scrollStopperUserID'], async (result) => {
      let storedUserID = result.scrollStopperUserID;
    if(!storedUserID){
      storedUserID = crypto.randomUUID();
      chrome.storage.local.set({ scrollStopperUserID: storedUserID });
    } */

    const fetchUserID = async() => {
      //setUserID(storedUserID);
      setUserID("1"); //for testing purposes 
    };
  fetchUserID();
  }, []);

  useEffect(() => {
    const fetchTasks = async() => {
      if(!userID) return;
      try{
        const res = await fetch(`http://localhost:3010/todos/${userID}`); 
        const data = await res.json();
        setTodos(data); 
        console.log("fetched");
      } catch (error) {
        console.log("no todos");
      } 
    }
    fetchTasks();
  }, [userID])

  const deleteTasks = async () => {
    const res = await fetch(`http://localhost:3010/todos/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ids: checkedTasks})
    });
    const result = res.json();
    console.log("hello")
    setTodos(prevTodos => prevTodos.filter(todo => !checkedTasks.includes(todo._id)));
    setCheckedTasks([]);
  }
  return (
    <div className="App">
      <header>
        <h1>Stop Scrolling Social Media!!!</h1>
      </header>
      <main>

        <div class="card">
          <h3>This is how much time you've spent scrolling</h3>
          <p>1:00</p>
        </div>
        <br/><br/>
        <div class="card">
          <h3>Here's a list of things you'd rather be doing</h3>
          <p>
          <form>
            {todos.map((d, i) => 
              <div key={d._id}><input type="checkbox" id={i} 
              onChange={(e) => {
                if(e.target.checked) {
                  setCheckedTasks(prev => [...prev, d._id])
                } else {
                  setCheckedTasks(prev => prev.filter(id => id !== d._id))
                }
              }}/>


              <label htmlFor={i}>{d.task}</label><br/></div>
            )}
            <br/>
            <button onClick={(e) => {
              e.preventDefault();
              deleteTasks();
            }
            }>I'm Done With These</button>
          </form></p></div>
          <br/><br/>

          <div class="card">
            <h3>Add something new</h3>
            <p>
            <form>
              <input type="text" id="newtask" placeholder="Add New Task"/>
              <label htmlFor="newtask"></label>
              <br/><br/>
              <button>Add New Wishlist Item</button>
            </form></p>
          </div>
        <br/><br/>
      </main>
    </div>
  );
}

export default App;
