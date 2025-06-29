import { useEffect, useState } from 'react';
import './App.css';

function App() {

  const [userID, setUserID] = useState("");
  const [todos, setTodos] = useState([]);

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
              <><input type="checkbox" id={i} />
              <label htmlFor={i}>{d.task}</label></>
            )}
            <br/><br/>
            <button>I'm Done With These</button>
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
