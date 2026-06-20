import { Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Config from './pages/Config';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Updates from './pages/Updates';
import Usage from './pages/Usage';

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/config" element={<Config />} />
                <Route path="/usage" element={<Usage />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<Home />} />
            </Routes>
            <Analytics />
        </>
    );
}

export default App;
