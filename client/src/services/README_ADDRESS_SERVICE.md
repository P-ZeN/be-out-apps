# Address Service - Client Side Implementation

This service handles all address-related operations using the new centralized address system.

## Installation

```bash
npm install axios lodash
```

## Usage

```javascript
import AddressService from './services/addressService';

// Get user's addresses
const addresses = await AddressService.getUserAddresses(userId);

// Create new address
const newAddress = await AddressService.createAddress({
    address_line_1: "123 Rue de la Paix",
    locality: "Paris",
    postal_code: "75001",
    country_code: "FR",
    address_type: "home",
    label: "Home Address"
}, "user", userId, "primary");

// Update address
const updatedAddress = await AddressService.updateAddress(addressId, {
    address_line_2: "Apt 4B"
});

// Set as primary
await AddressService.setPrimaryAddress(addressId, "user", userId);

// Validate address
const isValid = await AddressService.validateAddress(addressData);

// Search addresses
const suggestions = await AddressService.searchAddresses("123 Rue", "FR");
```
