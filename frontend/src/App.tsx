import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigurationsList } from './pages/ConfigurationsList';
import CreateConfiguration from './pages/CreateConfiguration';
import EditConfiguration from './pages/EditConfiguration';
import './styles/design-system.css';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConfigurationsList />} />
        <Route path="/create" element={<CreateConfiguration />} />
        <Route path="/edit/:id" element={<EditConfiguration />} />
      </Routes>
    </Router>
  );
}

export default App;
