# Bugfix Requirements Document

## Introduction

The rental checkout flow does not process actual payments. When users complete a rental checkout, the system simulates payment success without invoking any payment provider API. In contrast, room and hall reservations correctly integrate with Paystack to process real payments. This results in a critical revenue leakage where bookings are created without actual payment being collected.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user completes rental checkout and clicks the payment button THEN the system simulates a 1.4-second delay and immediately marks the booking as confirmed without calling any payment provider API
1.2 WHEN a user completes rental checkout THEN the booking is created with paymentStatus set to "deposit" or "paid" regardless of whether actual funds were received
1.3 WHEN a user completes rental checkout THEN the user receives a "Payment successful" confirmation message despite no real payment transaction occurring

### Expected Behavior (Correct)

2.1 WHEN a user completes rental checkout and clicks the payment button THEN the system SHALL initiate a real payment transaction via Paystack (the same payment provider used for room/hall reservations)
2.2 WHEN a user completes rental checkout THEN the system SHALL only mark the booking as confirmed after receiving a successful payment callback from Paystack
2.3 WHEN a user completes rental checkout THEN the system SHALL display appropriate error messages if the payment fails or is cancelled

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user completes room/hall reservation checkout THEN the system SHALL CONTINUE TO use Paystack for payment processing as it currently does
3.2 WHEN a user completes rental checkout with internal ownership items THEN the system SHALL CONTINUE TO decrement inventory and log inventory movements
3.3 WHEN a user completes rental checkout THEN the system SHALL CONTINUE TO calculate dueNow and balance correctly based on ownership type (internal: 100%, vendor: depositPct)
3.4 WHEN a user completes rental checkout THEN the system SHALL CONTINUE TO generate a booking reference and store customer details