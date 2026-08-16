import { uniqueEmail, uniqueUsername, strongPassword } from '../utils/dataGenerator';

export interface BookstoreCredentials {
  username: string;
  email: string;
  password: string;
}

export function newBookstoreUser(): BookstoreCredentials {
  return {
    username: uniqueUsername('qabookstore'),
    email: uniqueEmail('bookstore'),
    password: strongPassword(),
  };
}

export const billingDetails = {
  name: 'QA Test User',
  address: '123 Test Street, Test City',
};

// Publicly documented on the checkout page itself ("you can use
// 4242424242424242 as the card number...") as the app's Stripe integration
// running in test mode — not a real card, so safe to use and log in plain
// text, unlike this project's genuinely sensitive fields (passwords/tokens).
export const stripeTestCard = {
  cardHolderName: 'QA Test User',
  cardNumber: '4242424242424242',
  expiryMonth: '12',
  expiryYear: String(new Date().getFullYear() + 4),
  cvc: '123',
};

export const bookstoreMessages = {
  emailAlreadyInUse: 'Email is already in use',
  userNotFound: 'No user found with the given email address',
  incorrectPassword: 'Incorrect password',
  emptyCart: 'No items in carts',
  purchaseSuccess: 'Your purchase was successful',
};
