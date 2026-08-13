/* eslint-disable max-len */
export default {
  page: {
    landing: {
      title: 'Pay - BC Government Services',
      h1: 'Preparing your payment...'
    },
    account: {
      title: 'Select Account Profile',
      h1: 'Select Account Profile',
      subtitle: 'Choose the account you wish to make payment for.',
      registerNew: 'Register New',
      continue: 'Continue to Profile'
    },
    checkout: {
      title: 'Complete Your Payment',
      h1: 'Complete Your Payment',
      method: {
        cc: 'Credit Card',
        ccSub: 'Visa, Mastercard, AMEX',
        pad: 'Pre-Authorized Debit (PAD)',
        padSub: 'Direct withdrawal from business account',
        ob: 'Online Banking',
        obSub: 'Bill Payment via your bank',
        eft: 'Electronic Funds Transfer (EFT)',
        eftSub: 'Send funds directly from your bank to BC Registries'
      },
      submit: {
        cc: 'Continue to Payment',
        pad: 'Confirm PAD Payment',
        ob: 'Confirm Payment',
        eft: 'Confirm Payment'
      },
      instructions: {
        pad: {
          title: 'How Pre-Authorized Debit works',
          body: 'Funds will be automatically withdrawn from your registered business account within 3 business days. You do not need to take any further action.'
        },
        ob: {
          title: 'How to complete Online Banking payment',
          payeeNameLabel: 'Payee Name',
          identifierLabel: 'Payment Identifier',
          identifierPending: 'Generating…',
          step1: 'Sign in to your financial institution\'s online banking website or app and go to the bill payment page.',
          step2: 'Add the following as a payee:',
          step3: 'Enter this payment identifier as your account number:',
          step4: 'Submit the payment for the total amount shown. It may take 2 to 5 business days to process.'
        },
        eft: {
          title: 'How to complete EFT payment',
          body: 'Send an Electronic Funds Transfer for the total amount above to BC Registries and Online Services. You will receive detailed EFT instructions on the next page.'
        }
      },
      summary: 'Invoice Summary',
      subtotal: 'Subtotal',
      total: 'Total Amount Due',
      pad: {
        loading: 'Checking your PAD account…',
        pendingTitle: 'PAD activation in progress',
        pendingBody: 'Your PAD account is being activated (typically 3 business days). This invoice will be debited once activation completes — you can continue and confirm below.',
        frozenTitle: 'PAD is currently frozen',
        frozenBody: 'Your PAD account is frozen. Please pick a different payment method or contact support to unfreeze it.',
        notAuthorizedTitle: 'PAD setup not available',
        notAuthorizedBody: 'Only an account administrator or coordinator can set up Pre-Authorized Debit. Please contact your account administrator or coordinator to add banking information, or choose a different payment method.'
      },
      errors: {
        methodSwitchFailed: 'Unable to update payment method. Please try again.',
        submitFailed: 'Unable to submit payment. Please try again.'
      }
    },
    return: {
      title: 'Processing payment...',
      h1: 'Processing your payment...',
      body: 'Please wait, this can take a few seconds.'
    },
    success: {
      title: 'Payment Successful',
      h1: {
        cc: 'Payment Successful',
        pad: 'Payment Scheduled',
        ob: 'Awaiting Payment',
        eft: 'Awaiting Funds'
      },
      body: {
        cc: 'Your transaction has been processed successfully. A confirmation email has been sent to your registered address.',
        pad: 'Your pre-authorized debit is scheduled. Funds will be withdrawn from your business account within 3 business days. We will notify you once payment is confirmed.',
        ob: 'Please complete the online banking payment using the invoice number shown as your payee reference. We will notify you once the payment is received.',
        eft: 'Please complete the Electronic Funds Transfer using the details provided. We will notify you once funds arrive.'
      }
    },
    error: {
      invalidLink: 'This payment link is no longer valid.',
      invalidLinkBody: 'The link may have already been used or has expired. Please contact the sender for a new link.'
    }
  },
  padWidget: {
    title: 'Set up Pre-Authorized Debit',
    confirmationPeriodBody: 'The Canadian Payment Association requires a 3-business-day confirmation period before your first PAD deduction. The account administrator will receive a written confirmation of the PAD agreement prior to the first deduction.',
    transit: 'Transit Number',
    transitHint: 'Minimum 4 digits',
    institution: 'Institution Number',
    institutionHint: 'Exactly 3 digits',
    account: 'Bank Account Number',
    accountHint: '7 to 12 digits',
    tos: 'I authorize BC Registries and Online Services to debit the account above according to the terms of the Pre-Authorized Debit agreement.',
    submit: 'Save banking information',
    submitting: 'Verifying…',
    errors: {
      transit: 'Transit Number must be at least 4 digits.',
      institution: 'Institution Number must be exactly 3 digits.',
      account: 'Account Number must be between 7 and 12 digits.',
      verifyFailed: 'Your bank information could not be verified. Please double-check and try again.',
      saveFailed: 'Unable to save your PAD information. Please try again.'
    }
  }
}
