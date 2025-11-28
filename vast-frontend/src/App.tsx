import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DesktopOnly } from './components/DesktopOnly';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Heatmap } from './pages/Heatmap';
import { Streamgraph } from './pages/Streamgraph';
import { ActivityCalendar } from './pages/ActivityCalendar';
import { FlowDiagram } from './pages/FlowDiagram';

function App() {
  return (
    <DesktopOnly>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/streamgraph" element={<Streamgraph />} />
            <Route path="/activity-calendar" element={<ActivityCalendar />} />
            <Route path="/flow-diagram" element={<FlowDiagram />} />
          </Routes>
        </Layout>
      </Router>
    </DesktopOnly>
  );
}

export default App;
