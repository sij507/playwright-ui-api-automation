import { test, expect } from '../../src/fixtures/base';
import { formValidationMessages } from '../../src/data/messages';
import { malformedContactNumber, validTicketSubmission } from '../../src/data/formValidation';

test.describe('Form validation', () => {
  test.beforeEach(async ({ formValidationPage, step }) => {
    await step.given('the user is on the form validation page', async () => {
      await formValidationPage.goto();
    });
  });

  test(
    'submits successfully once every required field is valid',
    { tag: ['@critical', '@regression'] },
    async ({ formValidationPage, page, step }) => {
      const submission = validTicketSubmission();

      await step.when('the user fills every field with valid data and submits', async () => {
        await formValidationPage.fillValidForm(submission);
        await formValidationPage.submit();
      });

      await step.then('the browser navigates to the confirmation page', async () => {
        await expect(page, 'page URL').toHaveURL(/\/form-confirmation$/);
        await expect(formValidationPage.confirmationHeading, 'confirmation heading').toBeVisible();
        await expect(page.getByText(formValidationMessages.confirmationMessage), 'confirmation message').toBeVisible();
      });
    },
  );

  test.describe('Negative', () => {
    test(
      'rejects a completely empty submission with a message per required field',
      { tag: ['@regression'] },
      async ({ formValidationPage, page, step }) => {
        await step.when('the user submits the form without filling anything in', async () => {
          await formValidationPage.submit();
        });

        await step.then('every required field shows its own validation message', async () => {
          await expect(formValidationPage.invalidFeedback('ContactName'), 'Contact Name error').toHaveText(
            formValidationMessages.contactNameRequired,
          );
          await expect(formValidationPage.invalidFeedback('contactnumber'), 'Contact number error').toHaveText(
            formValidationMessages.contactNumberRequired,
          );
          await expect(formValidationPage.invalidFeedback('pickupdate'), 'PickUp Date error').toHaveText(
            formValidationMessages.pickupDateRequired,
          );
          await expect(formValidationPage.invalidFeedback('payment'), 'Payment Method error').toHaveText(
            formValidationMessages.paymentRequired,
          );
        });

        await step.and('the user stays on the form validation page', async () => {
          await expect(page, 'page URL').toHaveURL(/\/form-validation$/);
        });
      },
    );
  });

  test.describe('Edge cases', () => {
    test(
      'rejects a contact number that is the right length but the wrong format',
      { tag: ['@regression'] },
      async ({ formValidationPage, page, step }) => {
        const submission = validTicketSubmission({ contactNumber: malformedContactNumber });

        await step.when('the user submits a contact number missing the required hyphen', async () => {
          await formValidationPage.fillValidForm(submission);
          await formValidationPage.submit();
        });

        await step.then('only the contact number field is flagged invalid', async () => {
          await expect(formValidationPage.invalidFeedback('contactnumber'), 'Contact number error').toHaveText(
            formValidationMessages.contactNumberRequired,
          );
          await expect(formValidationPage.invalidFeedback('ContactName'), 'Contact Name error').toBeHidden();
          await expect(formValidationPage.invalidFeedback('pickupdate'), 'PickUp Date error').toBeHidden();
          await expect(formValidationPage.invalidFeedback('payment'), 'Payment Method error').toBeHidden();
        });

        await step.and('the user stays on the form validation page', async () => {
          await expect(page, 'page URL').toHaveURL(/\/form-validation$/);
        });
      },
    );
  });
});
