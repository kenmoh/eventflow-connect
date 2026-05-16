# Rental Payment Fix Design

## Overview

The rental checkout flow in `src/pages/Checkout.tsx` simulates payment with a 1.4-second delay and immediately marks bookings as confirmed without calling any payment provider API. This causes revenue leakage as bookings are created without actual payment collection. The fix will integrate real Paystack payment processing (the same payment provider used for room/hall reservations in `src/routes/checkout.tsx`).

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when rental checkout payment button is clicked without actual payment processing
- **Property (P)**: The desired behavior when rental checkout completes - real payment transaction via Paystack with proper callback handling
- **Preservation**: Existing checkout behaviors for room/hall reservations that must remain unchanged
- **submit()**: The function in `src/pages/Checkout.tsx` that handles the rental checkout form submission and payment
- **cart**: The store state containing items added to the rental cart
- **dueNow**: The amount due at checkout (100% for internal ownership, deposit percentage for vendor items)

## Bug Details

### Bug Condition

The bug manifests when a user submits the rental checkout form and clicks the payment button. The `submit` function in `src/pages/Checkout.tsx` simulates payment with a simple delay and creates the booking immediately without invoking any payment provider API.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { form: CheckoutForm, lines: CartLine[], dueNow: number }
  OUTPUT: boolean
  
  RETURN input.lines.length > 0
         AND input.form.method = 'paystack'
         AND NOT paymentProviderAPIInvoked(input.dueNow, input.form.email, input.form.method)
END FUNCTION
```

### Examples

- **Concrete Example 1**: User adds equipment to cart, fills checkout form, clicks "Pay ₦50,000"
  - Expected: Paystack payment modal opens, real transaction processed
  - Actual: 1.4s simulated delay, booking created immediately with paymentStatus "deposit" or "paid"

- **Concrete Example 2**: User cancels payment at Paystack modal
  - Expected: Booking not created, error message displayed
  - Actual: Booking created regardless of payment outcome

- **Edge Case**: Payment fails due to insufficient funds
  - Expected: Booking not created, user sees failure message
  - Actual: Booking created as if payment succeeded

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Room and hall reservation checkout must continue to use Paystack for payment processing (as implemented in `src/routes/checkout.tsx`)
- Rental inventory decrement and movement logging for internal ownership items must continue to work
- DueNow and balance calculation based on ownership type (internal: 100%, vendor: depositPct) must remain unchanged
- Booking reference generation and customer detail storage must remain unchanged
- Cart clearing after successful checkout must continue

**Scope:**
All inputs related to room/hall reservations and all non-payment aspects of rental checkout should be completely unaffected by this fix. The changes are confined to:
- The `submit` function in `src/pages/Checkout.tsx`
- Payment initialization and callback handling flow

## Hypothesized Root Cause

Based on the code analysis of `src/pages/Checkout.tsx` (lines 104-108), the root cause is clear:

1. **Missing Payment Provider Integration**: The `submit` function uses only a simulated delay:
   ```typescript
   // Simulated payment flow
   await new Promise((r) => setTimeout(r, 1400));
   ```
   This immediately proceeds to booking creation without any actual payment API call.

2. **No Payment Callback Handling**: Unlike the room/hall checkout which uses Paystack's callback mechanism (`onClose: () => ...`, `callback: () => ...`), the rental checkout has no callback handling.

3. **Incorrect Booking Creation Timing**: The booking is created BEFORE payment is confirmed, rather than after successful payment callback.

4. **No Error Handling for Failed Payments**: There is no logic to handle payment failures or cancellations - the booking is always created.

## Correctness Properties

Property 1: Bug Condition - Real Paystack Payment Processing

_For any_ rental checkout input where the cart contains items (lines.length > 0), the fixed submit function SHALL initiate a real Paystack payment transaction and only create the booking after receiving a successful payment callback from Paystack.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Room/Hall Payment Processing

_For any_ room/hall reservation checkout, the fixed code SHALL produce exactly the same behavior as the original code, preserving Paystack integration in `src/routes/checkout.tsx` and all related payment flows.

**Validates: Requirements 3.1**

Property 3: Preservation - Inventory Management

_For any_ rental checkout with internal ownership items, the fixed code SHALL continue to decrement stockAvailable and log inventory movements exactly as before.

**Validates: Requirements 3.2**

Property 4: Preservation - Payment Calculation

_For any_ rental checkout, the fixed code SHALL continue to calculate dueNow and balanceDue correctly based on ownership type (internal: 100%, vendor: depositPct).

**Validates: Requirements 3.3**

## Fix Implementation

### Changes Required

**File**: `src/pages/Checkout.tsx`

**Function**: `submit` (lines ~98-168)

**Specific Changes**:

1. **Add Paystack Integration**: Replace simulated delay with real Paystack payment initialization (matching the pattern in `src/routes/checkout.tsx`):
   - Use `window.PaystackPop.setup()` to initialize Paystack
   - Initialize with public key, amount (in kobo), email, and reference
   - Set up callback handler for successful payment
   - Set up onClose handler for cancelled/failed payment

2. **Move Booking Creation to Callback**: The booking creation logic (addBooking call) must be moved inside the payment success callback, not executed before payment.

3. **Add Payment Failure Handling**: Add logic to handle:
   - Payment cancelled by user (onClose callback)
   - Payment failed (error in callback)
   - Display appropriate toast messages for each scenario

4. **Preserve Existing Logic**: Keep all inventory management, movement logging, and cart clearing logic - but execute them only after successful payment.

5. **Remove Flutterwave**: Remove any Flutterwave-related code and environment variables.

6. **Update UI Text**: Update the payment button text to reflect Paystack usage.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Analyze the unfixed code in `src/pages/Checkout.tsx` to confirm the simulated payment behavior. Run the application and complete a rental checkout to observe:
- No actual payment provider API is called
- Booking is created immediately with simulated 1.4s delay
- paymentStatus is set to "deposit" or "paid" without real payment

**Expected Counterexamples**:
- Payment provider API is NOT invoked (check network requests)
- Booking created with paymentStatus "deposit" or "paid" without actual payment
- "Payment successful" dialog appears after 1.4s regardless of payment state

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := submit_fixed(input)
  ASSERT paymentProviderAPIInvoked(result)
  ASSERT bookingCreated ONLY AFTER paymentCallback.success
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  // For room/hall checkout (not rental)
  ASSERT checkout_tsx_original(input) = checkout_tsx_fixed(input)
  
  // For non-payment aspects of rental checkout
  ASSERT inventoryManagement_original(input) = inventoryManagement_fixed(input)
  ASSERT calculation_original(input) = calculation_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for non-rental checkout paths

**Test Plan**: 
1. Test room/hall checkout continues to work with Paystack
2. Test rental inventory calculation remains correct
3. Test booking reference generation remains correct

### Unit Tests

- Test Paystack payment initialization with valid form data
- Test payment callback handling for success scenario
- Test payment callback handling for cancellation scenario
- Test booking creation only occurs after successful payment

### Property-Based Tests

- Generate random cart configurations and verify payment amount calculation
- Generate random customer details and verify booking creation
- Test that inventory management works correctly across many scenarios

### Integration Tests

- Full rental checkout flow with Paystack payment
- Test booking created with correct paymentStatus after successful payment
- Test no booking created when payment is cancelled
- Test room/hall checkout still works with Paystack