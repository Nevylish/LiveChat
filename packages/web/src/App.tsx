import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Config from './pages/Config';
import Updates from './pages/Updates';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/config" element={<Config />} />
            <Route path="/config.html" element={<Config />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/updates.html" element={<Updates />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/privacy.html" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/terms.html" element={<Terms />} />
        </Routes>
    );
}

export default App;
