// src/pages/developer/CertificationApplicationForm.tsx
import { useState } from 'react';
import Card from '../../components/common/Card';
import AlertMessage from '../../components/common/AlertMessage';
import { useAuthenticator } from '@aws-amplify/ui-react';

// Define the form data interface based on the document
interface CertificationFormData {
  // Section 1: Reason for Application
  reasonForApplication: 'new' | 'transfer' | 'change';
  dateOfApplication: string;
  applicationNumber: string;
  
  // Section 2: Company Data
  contactPerson: string;
  contactFunction: string;
  contactPhone: string;
  companyName: string;
  contactEmail: string;
  website: string;
  companyScope: string;
  industriesServed: string;
  productDescriptions: string;
  safetyApplications: boolean;
  designResponsible: boolean;
  eaIndustryCodes: string;
  outsourcedProcesses: string;
  
  // Section 3: Certification Data
  isoStandards: string[];
  targetCertificationDate: string;
  currentlyCertified: boolean;
  environmentalHazards: string;
  environmentalRegulations: string;
  transferReason: string;
  
  // Section 4: Sites
  sites: Array<{
    address: string;
    isHQ: boolean;
    employeeCount: number;
    shifts: number;
    activities: string;
  }>;
  
  // Section 5: Consultants
  hasUsedConsultants: boolean;
  consultantDetails: string;
  serviceType: string;
  consultancyEndDate: string;
  
  // Section 6: Additional Comments
  additionalComments: string;
}

const CertificationApplicationForm = () => {
  useAuthenticator();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Initialize form data
  const [formData, setFormData] = useState<CertificationFormData>({
    reasonForApplication: 'new',
    dateOfApplication: new Date().toISOString().split('T')[0],
    applicationNumber: '',
    contactPerson: '',
    contactFunction: '',
    contactPhone: '',
    companyName: '',
    contactEmail: '',
    website: '',
    companyScope: '',
    industriesServed: '',
    productDescriptions: '',
    safetyApplications: false,
    designResponsible: false,
    eaIndustryCodes: '',
    outsourcedProcesses: '',
    isoStandards: [],
    targetCertificationDate: '',
    currentlyCertified: false,
    environmentalHazards: '',
    environmentalRegulations: '',
    transferReason: '',
    sites: [{
      address: '',
      isHQ: false,
      employeeCount: 0,
      shifts: 1,
      activities: ''
    }],
    hasUsedConsultants: false,
    consultantDetails: '',
    serviceType: '',
    consultancyEndDate: '',
    additionalComments: ''
  });

  // EA Industry codes for the dropdown
  const eaIndustryCodes = [
    { code: '1', name: 'Agriculture, forestry and fishing' },
    { code: '2', name: 'Mining and quarrying' },
    { code: '3', name: 'Manufacture of food products, beverages and tobacco products' },
    { code: '4', name: 'Textiles and textile products' },
    { code: '5', name: 'Leather and leather products' },
    { code: '6', name: 'Manufacture of wood and of products of wood and cork' },
    { code: '7', name: 'Manufacture of paper, pulp and paper products' },
    { code: '8', name: 'Printing and reproduction of recorded media' },
    { code: '12', name: 'Manufacture of chemicals and chemical products' },
    { code: '13', name: 'Manufacture of basic pharmaceutical products' },
    { code: '14', name: 'Production of rubber and plastic products' },
    { code: '15', name: 'Non-metallic mineral products' },
    { code: '16', name: 'Concrete, cement, lime, plaster etc.' },
    { code: '17.1', name: 'Basic metals, metal production' },
    { code: '17.2', name: 'Fabricated metal products' },
    { code: '18', name: 'Machinery and equipment' },
    { code: '19.1', name: 'Manufacture of computer, electronic and optical products' },
    { code: '19.2', name: 'Active medical devices' },
    { code: '20', name: 'Shipbuilding' },
    { code: '21', name: 'Manufacture and repair of air and spacecraft' },
    { code: '22', name: 'Other transport equipment' },
    { code: '23', name: 'Manufacturing nec (furniture, jewelry)' },
    { code: '24', name: 'Recycling' },
    { code: '25', name: 'Electricity supply' },
    { code: '26', name: 'Gas supply' },
    { code: '27', name: 'Water supply' },
    { code: '28', name: 'Construction' },
    { code: '29.1', name: 'Wholesale and retail trade, except of motor vehicles' },
    { code: '29.2', name: 'Wholesale and retail trade and repair of motor vehicles' },
    { code: '30', name: 'Hotels and restaurants food and beverage service' },
    { code: '31.1', name: 'Transportation, storage' },
    { code: '31.2', name: 'Information and communication' },
    { code: '32', name: 'Real estate activities, financial and insurance' },
    { code: '33', name: 'Information Technology' },
    { code: '34.1', name: 'Scientific research and development' },
    { code: '34.2', name: 'Architecture / Engineering services' },
    { code: '35', name: 'Other services' },
    { code: '36', name: 'Administration and defense, compulsory social security' },
    { code: '37', name: 'Education' },
    { code: '38.1', name: 'Human health activities' },
    { code: '38.2', name: 'Veterinary activities' },
    { code: '38.3', name: 'Residential care activities' },
    { code: '39.2', name: 'Other social services' }
  ];

  // Update form field
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update site data
  const updateSite = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sites: prev.sites.map((site, i) => 
        i === index ? { ...site, [field]: value } : site
      )
    }));
  };

  // Add new site
  const addSite = () => {
    setFormData(prev => ({
      ...prev,
      sites: [...prev.sites, {
        address: '',
        isHQ: false,
        employeeCount: 0,
        shifts: 1,
        activities: ''
      }]
    }));
  };

  // Remove site
  const removeSite = (index: number) => {
    if (formData.sites.length > 1) {
      setFormData(prev => ({
        ...prev,
        sites: prev.sites.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle ISO standard selection
  const handleISOStandardChange = (standard: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isoStandards: checked 
        ? [...prev.isoStandards, standard]
        : prev.isoStandards.filter(s => s !== standard)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate API call - replace with actual submission logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form submitted:', formData);
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate application number based on current date
  const generateApplicationNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const appNumber = `${year}-${month}-${day}`;
    updateField('applicationNumber', appNumber);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Certification Application Form</h2>
          <p className="text-muted mb-0">BLISS CB LLC Certification Services Application</p>
        </div>
        <div className="badge bg-info fs-6 px-3 py-2">
          <i className="bi bi-code-slash me-2"></i>
          Developer Only
        </div>
      </div>

      {submitSuccess && (
        <AlertMessage
          type="success"
          title="Application Submitted Successfully"
          message="Your certification application has been submitted and will be reviewed by BLISS CB LLC."
        />
      )}

      {submitError && (
        <AlertMessage
          type="danger"
          title="Submission Failed"
          message={submitError}
        />
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Reason for Application */}
        <Card title="Section 1.0 - Reason for Application" className="mb-4">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Reason for Application</label>
              <select
                className="form-select"
                value={formData.reasonForApplication}
                onChange={(e) => updateField('reasonForApplication', e.target.value)}
                required
              >
                <option value="new">New Client Seeking Certification</option>
                <option value="transfer">New Client Seeking to Transfer Certification to BLISS CB LLC</option>
                <option value="change">Existing BLISS CB LLC Client seeking change to scope of Certification</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Date of Application</label>
              <input
                type="date"
                className="form-control"
                value={formData.dateOfApplication}
                onChange={(e) => updateField('dateOfApplication', e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Application Number</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={formData.applicationNumber}
                  onChange={(e) => updateField('applicationNumber', e.target.value)}
                  placeholder="YEAR-MONTH-DAY"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={generateApplicationNumber}
                >
                  <i className="bi bi-calendar-plus"></i>
                </button>
              </div>
              <div className="form-text">Application numbering format: YEAR-MONTH-DAY</div>
            </div>
          </div>
        </Card>

        {/* Section 2: Company Data */}
        <Card title="Section 2.0 - Company Data" className="mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Contact Person (Title, First and Last Name)</label>
              <input
                type="text"
                className="form-control"
                value={formData.contactPerson}
                onChange={(e) => updateField('contactPerson', e.target.value)}
                placeholder="Mr. John Smith"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Function</label>
              <input
                type="text"
                className="form-control"
                value={formData.contactFunction}
                onChange={(e) => updateField('contactFunction', e.target.value)}
                placeholder="Quality Manager"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                value={formData.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Company</label>
              <input
                type="text"
                className="form-control"
                value={formData.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Company Name Inc."
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.contactEmail}
                onChange={(e) => updateField('contactEmail', e.target.value)}
                placeholder="contact@company.com"
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Website</label>
              <input
                type="url"
                className="form-control"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>
            <div className="col-12">
              <label className="form-label">Company Scope/Activities</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.companyScope}
                onChange={(e) => updateField('companyScope', e.target.value)}
                placeholder="Describe your company's main activities and scope of operations"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Industry(ies) Served</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.industriesServed}
                onChange={(e) => updateField('industriesServed', e.target.value)}
                placeholder="List the industries your company serves"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Product Descriptions</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.productDescriptions}
                onChange={(e) => updateField('productDescriptions', e.target.value)}
                placeholder="Describe your products or services"
                required
              />
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.safetyApplications}
                  onChange={(e) => updateField('safetyApplications', e.target.checked)}
                />
                <label className="form-check-label">
                  Is your product used in safety critical applications?
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.designResponsible}
                  onChange={(e) => updateField('designResponsible', e.target.checked)}
                />
                <label className="form-check-label">
                  Are you product Design responsible?
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">EA Industry Code(s)</label>
              <select
                className="form-select"
                value={formData.eaIndustryCodes}
                onChange={(e) => updateField('eaIndustryCodes', e.target.value)}
              >
                <option value="">Select Industry Code</option>
                {eaIndustryCodes.map(code => (
                  <option key={code.code} value={code.code}>
                    {code.code} - {code.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">List any Outsourced Processes</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.outsourcedProcesses}
                onChange={(e) => updateField('outsourcedProcesses', e.target.value)}
                placeholder="List any processes that are outsourced"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Certification Data */}
        <Card title="Section 3.0 - Certification Data" className="mb-4">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">ISO Standard(s) being pursued</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.isoStandards.includes('ISO 9001')}
                    onChange={(e) => handleISOStandardChange('ISO 9001', e.target.checked)}
                  />
                  <label className="form-check-label">ISO 9001</label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.isoStandards.includes('ISO 14001')}
                    onChange={(e) => handleISOStandardChange('ISO 14001', e.target.checked)}
                  />
                  <label className="form-check-label">ISO 14001</label>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Target Date for Certification</label>
              <input
                type="date"
                className="form-control"
                value={formData.targetCertificationDate}
                onChange={(e) => updateField('targetCertificationDate', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <div className="form-check mt-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.currentlyCertified}
                  onChange={(e) => updateField('currentlyCertified', e.target.checked)}
                />
                <label className="form-check-label">
                  Are you currently certified?
                </label>
              </div>
            </div>

            {/* ISO 14001 specific fields */}
            {formData.isoStandards.includes('ISO 14001') && (
              <>
                <div className="col-12">
                  <div className="alert alert-info">
                    <strong>Note:</strong> ISO 14001 certification requires additional environmental information.
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Environmental Hazards, Risks and Controls</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={formData.environmentalHazards}
                    onChange={(e) => updateField('environmentalHazards', e.target.value)}
                    placeholder="List the main environmental hazards, risks and controls at your organization"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Environmental Regulations</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={formData.environmentalRegulations}
                    onChange={(e) => updateField('environmentalRegulations', e.target.value)}
                    placeholder="List any federal or state environmental laws and/or regulations applicable to your operations"
                  />
                </div>
              </>
            )}

            {/* Transfer specific fields */}
            {formData.currentlyCertified && (
              <div className="col-12">
                <label className="form-label">Reason for Transfer</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.transferReason}
                  onChange={(e) => updateField('transferReason', e.target.value)}
                  placeholder="Document the reason why your Company is requesting to Transfer your Certification to a new Certification Body"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Section 4: Sites */}
        <Card title="Section 4.0 - Site Information" className="mb-4">
          <p className="text-muted mb-4">
            Please complete the information for all sites pursuing ISO certification.
          </p>
          
          {formData.sites.map((site, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Site {index + 1}</h6>
                {formData.sites.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeSite(index)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                )}
              </div>
              
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Address of site pursuing Certification</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={site.address}
                    onChange={(e) => updateSite(index, 'address', e.target.value)}
                    placeholder="Full address including street, city, state, zip code"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <div className="form-check mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={site.isHQ}
                      onChange={(e) => updateSite(index, 'isHQ', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Is this the Central/HQ location?
                    </label>
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Employee Count</label>
                  <input
                    type="number"
                    className="form-control"
                    value={site.employeeCount}
                    onChange={(e) => updateSite(index, 'employeeCount', parseInt(e.target.value) || 0)}
                    min="0"
                    required
                  />
                  <div className="form-text">Include permanent and temporary employees</div>
                </div>
                <div className="col-md-3">
                  <label className="form-label"># of Shifts</label>
                  <input
                    type="number"
                    className="form-control"
                    value={site.shifts}
                    onChange={(e) => updateSite(index, 'shifts', parseInt(e.target.value) || 1)}
                    min="1"
                    max="3"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Site Specific Activities</label>
                  <input
                    type="text"
                    className="form-control"
                    value={site.activities}
                    onChange={(e) => updateSite(index, 'activities', e.target.value)}
                    placeholder="e.g. manufacturing, sales, R&D"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={addSite}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Another Site
          </button>
        </Card>

        {/* Section 5: Use of Consultants */}
        <Card title="Section 5.0 - Use of Consultants" className="mb-4">
          <div className="row g-3">
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.hasUsedConsultants}
                  onChange={(e) => updateField('hasUsedConsultants', e.target.checked)}
                />
                <label className="form-check-label">
                  Has your organization, within the previous two years, contracted the services of a management system consultant?
                </label>
              </div>
              <div className="form-text">
                This includes consultants for design, implementation, audit, advice or maintenance of ISO 9001 and/or ISO 14001 management systems.
              </div>
            </div>
            
            {formData.hasUsedConsultants && (
              <>
                <div className="col-md-4">
                  <label className="form-label">Consultant(s) Used</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.consultantDetails}
                    onChange={(e) => updateField('consultantDetails', e.target.value)}
                    placeholder="List consultant names or firms"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Type of Service Provided</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.serviceType}
                    onChange={(e) => updateField('serviceType', e.target.value)}
                    placeholder="e.g. Implementation, Training, Internal Audit"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date Consultancy Ended</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.consultancyEndDate}
                    onChange={(e) => updateField('consultancyEndDate', e.target.value)}
                  />
                  <div className="form-text">Enter "N/A" if ongoing</div>
                </div>
              </>
            )}
            
            <div className="col-12">
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Important:</strong> BLISS CB LLC is not permitted to provide certification audit services to organizations that have received internal audit or supply chain audit services from BLISS CB LLC within the previous two years.
              </div>
            </div>
          </div>
        </Card>

        {/* Section 6: Additional Comments */}
        <Card title="Section 6.0 - Additional Comments" className="mb-4">
          <textarea
            className="form-control"
            rows={5}
            value={formData.additionalComments}
            onChange={(e) => updateField('additionalComments', e.target.value)}
            placeholder="Please provide any additional information or comments relevant to your certification application"
          />
        </Card>

        {/* Submit Button */}
        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
          <button
            type="button"
            className="btn btn-outline-secondary me-md-2"
            onClick={() => console.log('Form data:', formData)}
          >
            <i className="bi bi-file-text me-2"></i>
            Preview Data
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting Application...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CertificationApplicationForm;