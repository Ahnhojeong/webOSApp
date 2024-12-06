// import { Route, Routes } from 'react-router-dom';
import { HashRouter, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ConnectDevicePage } from './pages/ConnectDevicePage';
import { WifiListPage } from './pages/WifiListPage';
import { SetupProvider } from './context/SetupContext';
import { SuccessPage } from './pages/SuccessPage';
import { FailPage } from './pages/FailPage';

function App() {
  return (
    <SetupProvider>
      <div className="App">
        <HashRouter basename="/">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/connectDevice" element={<ConnectDevicePage />} />
            <Route path="/wifilist" element={<WifiListPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/fail" element={<FailPage />} /> {/* 추가 */}
          </Routes>
        </HashRouter>
      </div>
    </SetupProvider>
  );
}

export default App;
