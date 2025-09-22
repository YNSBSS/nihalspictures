import React, { useRef } from 'react';
import { X, Phone, Mail, MapPin, Printer, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from './logo.jpg';
import './PaymentVoucher.css';

const PaymentVoucher = ({ selectedBooking, onClose, statusOptions }) => {
  const voucherRef = useRef(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const printVoucher = () => {
    const printContent = voucherRef.current;
    const windowPrint = window.open('', '', 'width=800,height=1000');

    windowPrint.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Voucher</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 5px; 
            background: white;
            font-size: 11px;
          }
          
          .voucher-container {
            background: white;
            width: 100%;
            margin: 0 auto;
            padding: 25px;
            font-family: 'Arial', sans-serif;
            color: #1a202c;
            line-height: 1.4;
            font-size: 11px;
          }
          
          .voucher-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .voucher-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .logo-placeholder {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .company-info h1 {
            font-size: 18px;
            font-weight: bold;
            color: #1a202c;
            margin: 0;
          }
          
          .company-tagline {
            color: #64748b;
            font-size: 11px;
            margin: 2px 0 0 0;
          }
          
          .voucher-number {
            text-align: right;
          }
          
          .voucher-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a202c;
            margin: 0 0 6px 0;
          }
          
          .voucher-id {
            font-size: 13px;
            color: #3b82f6;
            font-weight: 600;
            margin: 0;
          }
          
          .voucher-date {
            color: #64748b;
            font-size: 11px;
            margin: 3px 0 0 0;
          }
          
          /* Always use 2 columns for print */
          .voucher-content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .voucher-client,
          .voucher-service,
          .voucher-pricing,
          .voucher-payments {
            margin-bottom: 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 3px solid #3b82f6;
          }
          
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1a202c;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .client-details,
          .service-details {
            display: grid;
            gap: 5px;
          }
          
          .client-details p,
          .service-details p {
            margin: 0;
            color: #374151;
            font-size: 10px;
            line-height: 1.3;
          }
          
          .client-details strong,
          .service-details strong {
            color: #1a202c;
            display: inline-block;
            min-width: 60px;
            font-size: 10px;
          }
          
          .supplements-section {
            margin: 8px 0;
            padding: 8px;
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          .supplements-list {
            font-size: 9px;
            color: #4b5563;
            margin-left: 10px;
          }
          
          .supplement-item {
            margin: 2px 0;
          }
          
          .supplements-total {
            font-weight: 600;
            font-size: 10px;
            margin-top: 5px;
            color: #1a202c;
          }
          
          .pricing-table {
            display: grid;
            gap: 8px;
          }
          
          .pricing-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
          }
          
          .pricing-row:last-child {
            border-bottom: none;
          }
          
          .remaining-row {
            background: #fee2e2;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #fecaca;
            font-weight: 600;
            font-size: 10px;
          }
          
          .price-value {
            font-weight: 600;
            color: #1a202c;
          }
          
          .price-value.paid {
            color: #059669;
          }
          
          .price-value.remaining {
            color: #dc2626;
          }
          
          .payments-table-compact {
            background: white;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          
          .payment-row-compact {
            padding: 6px 10px;
            border-bottom: 1px solid #f1f5f9;
            background: white;
          }
          
          .payment-info-compact {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            gap: 6px;
          }
          
          .payment-amount-compact {
            font-weight: 600;
            color: #059669;
            font-size: 10px;
          }
          
          .payment-method-compact {
            color: #64748b;
            font-size: 9px;
            text-transform: capitalize;
          }
          
          .payment-date-compact {
            color: #64748b;
            font-size: 9px;
          }
          
          .voucher-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer-contact h4 {
            font-size: 11px;
            font-weight: bold;
            margin: 0 0 8px 0;
            color: #1a202c;
          }
          
          .footer-contact p {
            margin: 2px 0;
            font-size: 10px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .footer-signature {
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #1a202c;
            width: 150px;
            padding-top: 6px;
            font-size: 10px;
            color: #64748b;
          }
          
          .voucher-terms {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          
          .voucher-terms p {
            margin: 0;
            color: #64748b;
            font-size: 9px;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 8px; 
              font-size: 10px;
            }
            .voucher-container {
              padding: 15px;
              font-size: 10px;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);

    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  };

  const downloadVoucherPDF = async () => {
    try {
      const element = voucherRef.current;
      
      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '700px'; // Slightly smaller to match 90% usage
      tempContainer.style.backgroundColor = 'white';
      tempContainer.innerHTML = element.innerHTML;
      
      // Add PDF-specific styles
      const pdfStyles = document.createElement('style');
      pdfStyles.textContent = `
        .voucher-container {
          background: white !important;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 25px !important;
          font-family: 'Arial', sans-serif !important;
          color: #1a202c !important;
          line-height: 1.4 !important;
          font-size: 11px !important;
        }
        
        .voucher-content-grid {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 15px !important;
          margin-bottom: 15px !important;
        }
        
        .voucher-client,
        .voucher-service,
        .voucher-pricing,
        .voucher-payments {
          margin-bottom: 0 !important;
          padding: 15px !important;
          background: #f8fafc !important;
          border-radius: 6px !important;
          border-left: 3px solid #3b82f6 !important;
        }
        
        .voucher-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          margin-bottom: 25px !important;
          padding-bottom: 15px !important;
          border-bottom: 2px solid #e2e8f0 !important;
        }
        
        .voucher-footer {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-end !important;
          margin-top: 25px !important;
          padding-top: 15px !important;
          border-top: 1px solid #e2e8f0 !important;
        }
      `;
      
      tempContainer.appendChild(pdfStyles);
      document.body.appendChild(tempContainer);

      // Configure html2canvas with adjusted dimensions for 90% width usage
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 720, // Match the container width
        height: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1080, // Proportionally adjusted
        windowHeight: 800
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Calculate proper dimensions for A4 with 90% width
      const a4Width = 210; // A4 width in mm
      const imgWidth = a4Width * 0.9; // Use 90% of A4 width (189mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Ensure it fits on one page
      const maxHeight = 297; // A4 height in mm
      const finalHeight = Math.min(imgHeight, maxHeight);

      // Calculate margins to center the content
      const leftMargin = (a4Width - imgWidth) / 2; // 10.5mm margin on each side

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Add image to PDF with 90% width and centered
      pdf.addImage(imgData, 'PNG', leftMargin, 0, imgWidth, finalHeight);

      const filename = `payment-voucher-${selectedBooking.id.slice(-8).toUpperCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (!selectedBooking) return null;

  return (
    <div className="voucher-modal-overlay">
      <div className="voucher-modal">
        <div className="voucher-modal-header">
          <h2 className="voucher-modal-title">Bon de payement</h2>
          <div className="voucher-actions">
            <button onClick={printVoucher} className="voucher-print-btn">
              <Printer className="voucher-btn-icon" />
              Print
            </button>
            <button onClick={downloadVoucherPDF} className="voucher-pdf-btn">
              <FileText className="voucher-btn-icon" />
              PDF
            </button>
            <button onClick={onClose} className="voucher-close-btn">
              <X className="voucher-close-icon" />
            </button>
          </div>
        </div>
        
        <div className="voucher-modal-body">
          <div ref={voucherRef} className="voucher-container">
            <div className="voucher-header">
              <div className="voucher-logo">
                <div className="logo-placeholder">
                  <img src={logo} alt="logo" style={{ width: "50px", borderRadius: "25%" }} />
                </div>
                <div className="company-info">
                  <h1 className="company-name">Nihal's Pictures</h1>
                  <p className="company-tagline">Professional Photography Services</p>
                </div>
              </div>
              <div className="voucher-number">
                <h2 className="voucher-title">Bon de payement</h2>
                <p className="voucher-id">#{selectedBooking.id.slice(-8).toUpperCase()}</p>
                <p className="voucher-date">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="voucher-content-grid">
              <div className="voucher-left-column">
                <div className="voucher-client">
                  <h3 className="section-title">INFORMATION DU CLIENT</h3>
                  <div className="client-details">
                    <p><strong>Nom:</strong> {selectedBooking.firstName} {selectedBooking.lastName}</p>

                    {selectedBooking.husbandFirstName && (
                      <p><strong>Marié:</strong> {selectedBooking.husbandFirstName}</p>
                    )}
                    {selectedBooking.wifeFirstName && (
                      <p><strong>Mariée:</strong> {selectedBooking.wifeFirstName}</p>
                    )}

                    <p><strong>Email:</strong> {selectedBooking.email}</p>
                    <p><strong>Téléphone:</strong> {selectedBooking.phoneNumbers?.[0]}</p>
                    {selectedBooking.phoneNumbers?.length > 1 && (
                      <p><strong>Téléphone 2:</strong> {selectedBooking.phoneNumbers?.[1]}</p>
                    )}
                    <p><strong>Wilaya:</strong> {selectedBooking.wilaya}</p>
                    <p><strong>Adresse:</strong> {selectedBooking.addressDetails}</p>
                    {selectedBooking.salleName && (
                      <p><strong>Salle:</strong> {selectedBooking.salleName}</p>
                    )}
                  </div>
                </div>

                <div className="voucher-service">
                  <h3 className="section-title">SERVICE DETAILS</h3>
                  <div className="service-details">
                    <p><strong>Service:</strong> {selectedBooking.packName}</p>
                    <p><strong>Date:</strong> {formatDate(selectedBooking.date)}</p>
                    <p><strong>Heure:</strong> {selectedBooking.time}</p>
                    {selectedBooking.cortege && (
                      <p><strong>Cortège:</strong> {selectedBooking.cortege}</p>
                    )}
                    {selectedBooking.remarks && (
                      <p><strong>Notes:</strong> {selectedBooking.remarks}</p>
                    )}

                    {/* Compact supplements section */}
                    {selectedBooking.supplements && selectedBooking.supplements.length > 0 && (
                      <div className="supplements-section">
                        <p><strong>Suppléments:</strong></p>
                        <div className="supplements-list">
                          {selectedBooking.supplements.map(supplement => (
                            <div key={supplement.id} className="supplement-item">
                              • {supplement.name}: {supplement.price?.toLocaleString()} DZD
                            </div>
                          ))}
                        </div>
                        <p className="supplements-total">
                          <strong>Total Suppléments: {selectedBooking.supplementsTotal?.toLocaleString()} DZD</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="voucher-right-column">
                <div className="voucher-pricing">
                  <h3 className="section-title">Payement</h3>
                  <div className="pricing-table">
                    <div className="pricing-row">
                      <span>Total Service Price:</span>
                      <span className="price-value">DZD {selectedBooking.totalPrice?.toLocaleString()}</span>
                    </div>
                    <div className="pricing-row">
                      <span>Total payé:</span>
                      <span className="price-value paid">DZD {selectedBooking.totalPaid?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="pricing-row remaining-row">
                      <span>Reste a payer:</span>
                      <span className="price-value remaining">DZD {selectedBooking.remainingAmount?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>

                <div className="voucher-payments">
                  <h3 className="section-title">PAYMENT HISTORY</h3>
                  <div className="payments-table-compact">
                    {selectedBooking.payments && selectedBooking.payments.length > 0 ? (
                      selectedBooking.payments.slice(0, 4).map((payment) => (
                        <div key={payment.id} className="payment-row-compact">
                          <div className="payment-info-compact">
                            <span className="payment-amount-compact">DZD {payment.amount?.toLocaleString()}</span>
                            <span className="payment-method-compact">{payment.method}</span>
                            <span className="payment-date-compact">{payment.createdAt?.toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-payments-compact">No payments recorded yet</div>
                    )}
                    {selectedBooking.payments && selectedBooking.payments.length > 4 && (
                      <div className="more-payments">... and {selectedBooking.payments.length - 4} more payments</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="voucher-footer">
              <div className="footer-contact">
                <h4>Contact Information</h4>
                <p><Phone size={10} /> +213 552 49 33 48</p>
                <p><Mail size={10} /> nihalspictures@gmail.com</p>
                <p><MapPin size={10} /> Alger, Algeria</p>
              </div>
              <div className="footer-signature">
                <div className="signature-line">
                  <span>Signature</span>
                </div>
              </div>
            </div>

            <div className="voucher-terms">
              <p><small>Ce bon sert de preuve de paiement pour les services de Nihal's Pictures. Veuillez le conserver pour vos dossiers.</small></p>
            </div>
          </div>

          <div className="voucher-exit-section">
            <button onClick={onClose} className="voucher-exit-btn">
              <X className="voucher-btn-icon" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVoucher;