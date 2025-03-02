// src/components/layout/Footer.tsx
const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
      <footer className="bg-light border-top py-3 mt-auto">
        <div className="container">
          <p className="text-center text-muted mb-0">
            &copy; {currentYear} S3 Secure File Share. All rights reserved.
          </p>
        </div>
      </footer>
    );
  };
  
  export default Footer;