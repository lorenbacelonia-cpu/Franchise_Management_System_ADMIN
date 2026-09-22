import React from 'react';
import { FranchiseProvider, useFranchise } from './context/FranchiseContext';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';

const MainContent: React.FC = () => {
  const { isAuthenticated } = useFranchise();
  return isAuthenticated ? <Dashboard /> : <LoginScreen />;
};

export function App() {
  return (
    <FranchiseProvider>
      <MainContent />
    </FranchiseProvider>
  );
}

export default App;
