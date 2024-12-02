import { HashRouter, Route, Routes } from 'react-router-dom';
import NotFoundPage from '@/pages/NotFoundPage';
import TestPage from './pages/TestPage';

function App() {
  return (
    // <WebsocketProvider>
    <div className="App">
      <HashRouter basename="/">
        <Routes>
          <Route path="/" element={<TestPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
    </div>
    // </WebsocketProvider>
  );
}

export default App;
