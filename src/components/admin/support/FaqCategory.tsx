// src/components/admin/support/FaqCategory.tsx
import React, { useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FaqCategoryProps {
  title: string;
  faqs: FaqItem[];
}

const FaqCategory: React.FC<FaqCategoryProps> = ({ title, faqs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const toggleItem = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  return (
    <div className="mb-4">
      <h5>{title}</h5>
      
      <div className="accordion">
        {faqs.map((faq) => (
          <div className="accordion-item border-0 mb-2" key={faq.id}>
            <h2 className="accordion-header">
              <button 
                className={`accordion-button ${expandedId === faq.id ? '' : 'collapsed'} bg-light`} 
                type="button" 
                onClick={() => toggleItem(faq.id)}
                aria-expanded={expandedId === faq.id}
              >
                {faq.question}
              </button>
            </h2>
            <div 
              className={`accordion-collapse collapse ${expandedId === faq.id ? 'show' : ''}`}
            >
              <div className="accordion-body">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqCategory;

