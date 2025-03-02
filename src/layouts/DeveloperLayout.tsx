// src/layouts/DeveloperLayout.tsx
import { ReactNode, useState } from "react";
import DeveloperSidebar from "./components/DeveloperSidebar";
import Footer from "./components/Footer";

interface DeveloperLayoutProps {
  children: ReactNode;
}

const DeveloperLayout = ({ children }: DeveloperLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="d-flex flex-grow-1">
        {/* Developer Sidebar */}
        <DeveloperSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
        
        {/* Main content */}
        <main className={`flex-grow-1 p-4 bg-light transition-width ${sidebarCollapsed ? 'expanded-content' : ''}`}>
          <div className="container-fluid">
            <div className="bg-white p-4 rounded shadow-sm">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default DeveloperLayout;