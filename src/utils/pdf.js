import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateTicketPDF(registration, event) {
    const ticketElement = document.createElement('div');
    ticketElement.className = 'fixed top-[-9999px] left-[-9999px]';
    ticketElement.innerHTML = `
        <div id="ticket-template" style="width: 600px; padding: 40px; background: white; font-family: 'Inter', sans-serif;">
            <div style="border: 4px solid #1e3a8a; padding: 20px; border-radius: 20px; position: relative; overflow: hidden;">
                <!-- Decorative Circle -->
                <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: #eff6ff; border-radius: 50%; z-index: 0;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
                        <div>
                            <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: 800;">EVENTFLOW</h1>
                            <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Official Entry Pass</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-weight: 700; color: #1e3a8a;">ID: ${registration.id}</p>
                            <p style="margin: 5px 0 0; font-size: 12px; color: #94a3b8;">${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <h2 style="margin: 0; font-size: 22px; color: #1e293b;">${event.title}</h2>
                        <div style="display: flex; gap: 20px; margin-top: 15px;">
                            <div>
                                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Date</p>
                                <p style="margin: 5px 0 0; font-weight: 600;">${event.date}</p>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Time</p>
                                <p style="margin: 5px 0 0; font-weight: 600;">${event.time}</p>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Venue</p>
                                <p style="margin: 5px 0 0; font-weight: 600;">${event.venue}</p>
                            </div>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; display: flex; align-items: center; gap: 20px;">
                        <div style="width: 80px; height: 80px; background: white; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${registration.id}" style="width: 100%; height: 100%;">
                        </div>
                        <div>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">PARTICIPANT</p>
                            <p style="margin: 5px 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">${registration.name}</p>
                            <p style="margin: 2px 0 0; font-size: 14px; color: #64748b;">${registration.email}</p>
                        </div>
                    </div>

                    <div style="margin-top: 30px; text-align: center; border-top: 2px dashed #e2e8f0; padding-top: 20px;">
                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">Please present this ticket at the venue for check-in. This is a computer-generated document.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(ticketElement);

    try {
        const canvas = await html2canvas(document.getElementById('ticket-template'), {
            scale: 2,
            backgroundColor: null
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
        pdf.save(`Ticket_${event.title.replace(/\s+/g, '_')}.pdf`);

    } finally {
        document.body.removeChild(ticketElement);
    }
}
