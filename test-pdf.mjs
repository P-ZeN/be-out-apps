import pdfService from './server/src/services/pdfTicketService.js';
import fs from 'fs';

const mockBooking = {
  id: 'test-123',
  event: {
    id: 'event-123',
    title: 'Concert de Jazz',
    category_name: 'Musique',
    location: 'Salle Pleyel',
    address: '252 Rue du Faubourg Saint-Honoré, 75008 Paris',
    start_date: '2025-10-15T20:00:00.000Z',
    end_date: '2025-10-15T23:00:00.000Z'
  },
  user: {
    id: 'user-123',
    first_name: 'Philippe',
    last_name: 'Zenone'
  },
  quantity: 2,
  total_price: 80.00
};

console.log('Testing PDF generation...');
try {
  const buffer = await pdfService.generateTicketPDF(mockBooking);
  fs.writeFileSync('/tmp/test_ticket.pdf', buffer);
  console.log('PDF generated successfully: /tmp/test_ticket.pdf');
} catch (err) {
  console.error('Error:', err);
}
