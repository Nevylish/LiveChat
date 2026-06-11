import { Route, Routes } from 'react-router-dom';
import Config from './pages/Config';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Updates from './pages/Updates';

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
            <Route path="*" element={<Home />} />
        </Routes>
    );
}

export default App;
