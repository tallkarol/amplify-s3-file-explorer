// src/components/common/Breadcrumb.tsx
interface BreadcrumbItem {
    label: string;
    path: string;
  }
  
  interface BreadcrumbProps {
    items: BreadcrumbItem[];
    onNavigate: (path: string) => void;
  }
  
  const Breadcrumb = ({ items, onNavigate }: BreadcrumbProps) => {
    return (
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-0 py-1">
          <li className="breadcrumb-item">
            <button 
              onClick={() => onNavigate("/")}
              className="btn btn-link p-0 text-decoration-none"
            >
              Home
            </button>
          </li>
          {items.map((item, index) => (
            <li 
              key={index} 
              className={`breadcrumb-item ${index === items.length - 1 ? 'active' : ''}`}
            >
              <button
                onClick={() => onNavigate(item.path)}
                className="btn btn-link p-0 text-decoration-none"
                disabled={index === items.length - 1}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    );
  };
  
  export default Breadcrumb;