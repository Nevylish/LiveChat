import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Config = lazy(() => import('./pages/Config'));
const Usage = lazy(() => import('./pages/Usage'));
const Updates = lazy(() => import('./pages/Updates'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

function App() {
    return (
        <Suspense fallback={null}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/config" element={<Config />} />
                <Route path="/config/:guildId" element={<Config />} />
                <Route path="/usage" element={<Usage />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<Home />} />
            </Routes>
        </Suspense>
    );
}

export default App;
