// src/components/layout/Layout.tsx
import { ReactNode } from "react";
import Navigation from "./Navigtion";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  isAdmin: boolean;
}

const Layout = ({ children, isAdmin }: LayoutProps) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <header>
        <Navigation isAdmin={isAdmin} />
      </header>
      
      <main className="flex-grow-1 py-4 bg-light">
        <div className="container">
          <div className="bg-white p-4 rounded shadow-sm">
            {children}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;