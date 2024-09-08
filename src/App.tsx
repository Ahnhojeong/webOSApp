// import { Route, Routes } from 'react-router-dom';
import { HashRouter, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { WebsocketProvider } from '@/context/WebsocketContext';

function App() {
  return (
    <WebsocketProvider>
      <div className="App">
        <HashRouter basename="/">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HashRouter>
      </div>
    </WebsocketProvider>
  );
}

export default App;
