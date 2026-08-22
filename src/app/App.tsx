import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Library } from '../library/Library.js';
import { Reader } from '../reader/Reader.js';
import { RuleDetail, RulesIndex } from '../rules/Rules.js';
import '../styles/theme.css';

/**
 * HashRouter, because GitHub Pages serves static files and has no way to
 * rewrite /story/xyz back to index.html. A hash keeps deep links working
 * and survives a refresh.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/stories" element={<Navigate to="/" replace />} />
        <Route path="/story/:id" element={<Reader />} />
        <Route path="/rules" element={<RulesIndex />} />
        <Route path="/rules/:ruleId" element={<RuleDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
