import './App.css';


function App() {
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
            <input type="checkbox" id="todo1"/>
            <label htmlFor="todo1"> Write a Novel</label><br />

            <input type="checkbox" id="todo2"/>
            <label htmlFor="todo2"> Go Swimming</label><br />

            <input type="checkbox" id="todo3"/>
            <label htmlFor="todo3"> Go Draw Something</label><br/> <br/>
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
