import 'dotenv/config';
import { db } from './client';
import { roles, branding, siteContent, faqs } from './schema';

export async function seed() {
  

  // Create default roles
  const defaultRoles = [
    { name: 'owner', tabs: ['revenue', 'bookings', 'contacts', 'inventory', 'hotels', 'rooms', 'halls', 'packages', 'arrangements', 'rentals', 'receipts', 'faqs', 'legal', 'content', 'branding', 'employees'] },
    { name: 'admin', tabs: ['revenue', 'bookings', 'contacts', 'inventory', 'hotels', 'rooms', 'halls', 'packages', 'arrangements', 'rentals', 'receipts', 'faqs', 'legal', 'content', 'branding', 'employees'] },
    { name: 'staff', tabs: ['bookings', 'inventory'] },
  ];

  for (const role of defaultRoles) {
    await db.insert(roles).values(role).onConflictDoNothing();
  }

  // Create default branding
  const defaultBranding = {
    brandName: 'AbConsult',
    tagline: 'Premium Event & Travel Services',
    primaryAccent: '#3B82F6',
  };

  const existingBranding = await db.query.branding.findFirst();
  if (!existingBranding) {
    await db.insert(branding).values(defaultBranding);
  }

  // Create default site content
  const defaultSiteContent = {
    data: {
      about: 'Welcome to our platform',
      privacyPolicy: 'Your privacy is important to us',
      returnPolicy: 'All returns must be made within 30 days',
    },
  };

  const existingContent = await db.query.siteContent.findFirst();
  if (!existingContent) {
    await db.insert(siteContent).values(defaultSiteContent);
  }

  // Create sample FAQs
  const sampleFaqs = [
    {
      question: 'What is your refund policy?',
      answer: 'Refunds are processed within 7 business days.',
      order: 1,
      published: true,
    },
    {
      question: 'How do I track my booking?',
      answer: 'You can track your booking using your reference number on the Track page.',
      order: 2,
      published: true,
    },
  ];

  for (const faq of sampleFaqs) {
    await db.insert(faqs).values(faq).onConflictDoNothing();
  }

}

// Run if called directly
seed().catch(console.error);
