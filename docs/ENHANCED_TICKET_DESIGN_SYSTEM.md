# Enhanced Ticket Design System

## 🎫 Overview

The ticket design system has been significantly enhanced with new customization options, background images, logo integration, multiple ticket sizes, and advanced QR code configuration.

## ✨ New Features

### 1. Background Image Support
- **Upload custom background images** for tickets
- **Automatic readability overlay** (85% white overlay) when background image is present
- **Image preview** with crop/resize to fit ticket dimensions
- **Easy removal** with delete button

### 2. App Logo Integration
- **Multiple logo options** available in footer:
  - `be-out_logo.svg` (recommended - SVG format)
  - `be-out_logo_orange.png` (orange variant)
  - `be-out_logo_noir.png` (black variant)
  - `be-out_logo_blanc.png` (white variant)
  - Option to display no logo
- **Visual preview** of each logo option in dropdown
- **Automatic error handling** if logo fails to load

### 3. Multiple Ticket Sizes
Support for three standard formats optimized for printing and PDF generation:

#### A4 (210×297mm) - Default
- **Full page format**
- Best for events requiring detailed information
- Suitable for framing or keeping as souvenir

#### 1/2 A4 (210×148mm) - Landscape
- **Compact landscape format**
- Perfect balance of information and space efficiency
- Easy to store in wallet or phone case

#### 1/4 A4 (105×148mm) - Compact
- **Small ticket format**
- Minimal space usage
- Quick printing and distribution
- Standard cinema/concert ticket size

### 4. Advanced QR Code Configuration

The QR code system offers four different content types to meet various security and functional needs:

#### 🔗 URL de vérification (Recommended)
- **Content**: `https://be-out.app/verify/{ticket_number}`
- **Security**: Highest - real-time validation
- **Benefits**:
  - Prevents ticket fraud
  - Real-time status checking
  - Organizer can see scan history
  - Works offline with cached data

#### 📝 Référence de réservation
- **Content**: Ticket reference (e.g., `BE-OUT-001234`)
- **Security**: Basic - human readable
- **Benefits**:
  - Simple manual verification
  - Easy to communicate over phone/email
  - No internet required for basic checks

#### 🔒 Hash de sécurité
- **Content**: Cryptographic hash (SHA256)
- **Security**: High - tamper-proof
- **Benefits**:
  - Cannot be forged without access to system
  - Compact unique identifier
  - Mathematical verification possible

#### ⚙️ Données personnalisées
- **Content**: Custom JSON data structure
- **Security**: Variable - depends on implementation
- **Benefits**:
  - Full control over data structure
  - Can include multiple fields
  - Extensible for future needs

**Example custom JSON:**
```json
{
  "event_id": "123",
  "organizer": "Mon Organisation",
  "ticket_type": "VIP",
  "valid_until": "2025-12-31T23:59:59Z",
  "section": "A",
  "seat": "15"
}
```

## 🔧 Technical Implementation

### Data Structure

The ticket configuration is stored in the `customizations` object:

```javascript
{
  // Existing fields
  primary_color: "#1976d2",
  secondary_color: "#f50057",
  custom_message: "Thank you for participating!",

  // New fields
  ticket_size: "a4|half-a4|quarter-a4",
  background_image: "data:image/...", // Base64 encoded
  app_logo: "be-out_logo.svg", // Logo filename
  qr_code_type: "verification_url|booking_reference|ticket_hash|custom_data",
  qr_custom_data: "{...}" // JSON string for custom data
}
```

### QR Code Generation Logic

```javascript
const getQRCodeContent = (type, ticketData, customData) => {
  switch (type) {
    case 'verification_url':
      return `https://be-out.app/verify/${ticketData.ticketNumber}`;
    case 'booking_reference':
      return ticketData.ticketNumber;
    case 'ticket_hash':
      return crypto.createHash('sha256')
        .update(`${ticketData.bookingId}-${ticketData.ticketNumber}-${Date.now()}`)
        .digest('hex');
    case 'custom_data':
      return JSON.stringify(JSON.parse(customData));
    default:
      return ticketData.ticketNumber;
  }
};
```

## 📱 Mobile & PDF Considerations

### Responsive Design
- Ticket preview adapts to container size
- Maintains aspect ratios across different sizes
- Background images scale appropriately

### Print Optimization
- All sizes are based on standard paper dimensions
- High contrast colors for readability
- QR codes sized for reliable scanning
- Logo placement optimized for cutting/folding

### PDF Generation Ready
The ticket design system is prepared for future PDF generation with:
- Precise mm-based dimensions
- Print-safe color profiles
- Vector graphics where possible
- Scalable QR codes

## 🔐 Security Recommendations

### For Maximum Security
1. **Use verification URL QR codes** - enables real-time validation
2. **Implement server-side verification endpoint** at `/verify/{ticket}`
3. **Log all QR code scans** for audit trail
4. **Use HTTPS only** for verification URLs

### For Offline Events
1. **Use ticket hash QR codes** for mathematical verification
2. **Pre-download ticket database** to scanning device
3. **Implement checksum validation** in scanning app

### For Simple Events
1. **Booking reference QR codes** for manual checking
2. **Train staff** on reference format verification
3. **Have backup paper list** of valid references

## 🎨 Design Guidelines

### Color Combinations
- **Primary color**: Main brand color for headers and accents
- **Secondary color**: Complement color for gradients and highlights
- **High contrast**: Ensure QR codes remain scannable

### Background Images
- **Subtle patterns** work better than busy photos
- **Light/faded images** with overlay ensure text readability
- **Brand-appropriate** imagery only

### Logo Usage
- **SVG format preferred** for crispness at all sizes
- **White logo** for dark backgrounds
- **Black logo** for light backgrounds
- **Orange logo** for brand consistency

## 🚀 Future Enhancements

### Planned Features
1. **Template library** with pre-designed layouts
2. **Custom fonts** support
3. **Advanced QR code styling** (colors, embedded logos)
4. **Batch PDF generation** for organizers
5. **Mobile scanning app** for event check-in
6. **Analytics dashboard** for scan tracking

### API Endpoints (To Be Implemented)
```
GET  /api/verify/{ticket_number}     # QR code verification
POST /api/events/{id}/tickets/pdf    # Generate PDF tickets
POST /api/scan                       # Log QR code scan
GET  /api/events/{id}/scan-stats     # Scan analytics
```

## 📋 Testing Checklist

### Ticket Design
- [ ] All ticket sizes render correctly
- [ ] Background images display with proper overlay
- [ ] All logo variants load properly
- [ ] Colors apply consistently
- [ ] Custom messages display correctly

### QR Code Generation
- [ ] Verification URLs format correctly
- [ ] Booking references match expected pattern
- [ ] Hash generation produces consistent results
- [ ] Custom JSON validates properly
- [ ] QR codes scan successfully with mobile devices

### Responsive Behavior
- [ ] Tickets scale properly on different screen sizes
- [ ] Print dimensions maintain aspect ratios
- [ ] Background images don't distort
- [ ] Text remains readable at all sizes

## 🔗 Related Documentation

- [TICKET_SYSTEM_IMPLEMENTATION.md](./TICKET_SYSTEM_IMPLEMENTATION.md) - Original implementation plan
- [MULTI_STEP_FORM_IMPLEMENTATION_COMPLETE.md](./MULTI_STEP_FORM_IMPLEMENTATION_COMPLETE.md) - Form integration
- [MUI_GRID_SYNTAX_REMINDER.md](./MUI_GRID_SYNTAX_REMINDER.md) - UI component guidelines

---

**Note**: This enhanced ticket system maintains backward compatibility with existing ticket configurations while adding powerful new customization options for organizers.
